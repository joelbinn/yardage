import { expect, Page, test } from '@playwright/test';
import { configure, ESRI_TILES, RAW_URL, TILE_PNG, TWO_COURSES } from './support/github-api-stub';

const VIEWPORT = { width: 1440, height: 900 };

async function openEditorWithUllna(page: Page) {
  await page.route(RAW_URL, (route) =>
    route.fulfill({ status: 200, contentType: 'text/plain', body: JSON.stringify(TWO_COURSES) }),
  );
  await page.route(ESRI_TILES, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: TILE_PNG }),
  );
  await page.goto('/');
  await configure(page, null);
  await page.goto('/edit');
  await page.getByRole('button', { name: 'Redigera Ullna GK' }).click();
}

const mapBox = async (page: Page) => {
  const box = await page.getByRole('region', { name: 'Karta' }).boundingBox();
  if (!box) throw new Error('Kartan syns inte');
  return box;
};

test.describe('Redigeringsläge — kartan fyller skärmen', () => {
  test.use({ viewport: VIEWPORT });

  test('kartan fyller fönstret bredvid sidopanelen utan sidscroll', async ({ page }) => {
    await openEditorWithUllna(page);

    const box = await mapBox(page);
    expect(box.width).toBeGreaterThan(VIEWPORT.width * 0.7);
    expect(box.y + box.height).toBeGreaterThan(VIEWPORT.height - 40);
    expect(box.y + box.height).toBeLessThanOrEqual(VIEWPORT.height);
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(scrollHeight).toBeLessThanOrEqual(VIEWPORT.height);
  });

  test('fälld sidopanel ger kartan hela bredden och kan visas igen', async ({ page }) => {
    await openEditorWithUllna(page);
    const before = await mapBox(page);

    const toggle = page.getByRole('button', { name: 'Dölj panel' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await toggle.click();

    await expect(page.getByRole('button', { name: 'Redigera Ullna GK' })).toBeHidden();
    await expect.poll(async () => (await mapBox(page)).width).toBeGreaterThan(VIEWPORT.width - 40);
    // Leaflet räknar om storleken: tiles laddas även i det nyvunna området till vänster.
    await expect
      .poll(() =>
        page.locator('.leaflet-tile-loaded').evaluateAll(
          (tiles, leftEdge) => tiles.some((t) => t.getBoundingClientRect().left < leftEdge - 50),
          before.x,
        ),
      )
      .toBe(true);

    await page.getByRole('button', { name: 'Visa panel' }).click();
    await expect(page.getByRole('button', { name: 'Redigera Ullna GK' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dölj panel' })).toHaveAttribute('aria-expanded', 'true');
  });

  test('klick på kartan sätter greenpunkt även när panelen är fälld', async ({ page }) => {
    await openEditorWithUllna(page);
    await page.getByRole('button', { name: 'Hål 1', exact: false }).first().click();
    await page.getByRole('button', { name: 'Dölj panel' }).click();

    const box = await mapBox(page);
    await page.mouse.click(box.x + box.width - 60, box.y + box.height / 2);
    await page.getByRole('button', { name: 'Visa panel' }).click();

    await expect(page.getByRole('button', { name: /^Hål 2/ })).toHaveAttribute('aria-current', 'true');
  });
});
