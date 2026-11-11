import { expect, Locator, Page, test } from '@playwright/test';

const OWNER = 'testare';
const RAW_URL = `https://raw.githubusercontent.com/${OWNER}/yardage-data/main/courses.json`;
const ESRI_TILES = /^https:\/\/server\.arcgisonline\.com\/ArcGIS\/rest\/services\/World_Imagery\//;

// 1×1 px PNG — ersätter Esri-tiles så att testet aldrig går mot nätet.
const TILE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

const coursesDocument = {
  version: 1,
  courses: [
    {
      id: 'ullna',
      name: 'Ullna GK',
      holes: Array.from({ length: 9 }, (_, i) => ({
        number: i + 1,
        green: { lat: 59.4 + i / 1000, lng: 18.1 + i / 1000 },
      })),
    },
  ],
};

async function openEditModeWithMockedRepo(page: Page, document: unknown) {
  await page.route(RAW_URL, (route) =>
    document === null
      ? route.fulfill({ status: 404, body: '404: Not Found' })
      : route.fulfill({ status: 200, contentType: 'text/plain', body: JSON.stringify(document) }),
  );
  await page.goto('/settings');
  await page.getByLabel('Ägare').fill(OWNER);
  await page.getByRole('button', { name: 'Spara data-repo' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Data-repot är sparat.' })).toBeVisible();
  await page.getByRole('link', { name: 'Tillbaka till start' }).click();
  await page.getByRole('link', { name: 'Redigeringsläge' }).click();
  await expect(page).toHaveURL(/\/edit$/);
}

async function mockEsriTiles(page: Page): Promise<() => number> {
  let tileRequests = 0;
  await page.route(ESRI_TILES, (route) => {
    tileRequests += 1;
    return route.fulfill({ status: 200, contentType: 'image/png', body: TILE_PNG });
  });
  return () => tileRequests;
}

async function dragBy(page: Page, target: Locator, dx: number, dy: number) {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (!box) throw new Error('Markören syns inte');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx / 2, y + dy / 2, { steps: 5 });
  await page.mouse.move(x + dx, y + dy, { steps: 5 });
  await page.mouse.up();
}

test.describe('Ticket 06: Redigeringsläge — karteditor med greenpunkter', () => {
  test('klick på kartan sätter greenpunkt för aktivt hål och markören kan dras', async ({
    page,
  }) => {
    const tileRequests = await mockEsriTiles(page);
    await openEditModeWithMockedRepo(page, null);
    await page.getByLabel('Namn').fill('Kortbanan');
    await page.getByLabel('9 hål', { exact: true }).check();
    await page.getByRole('button', { name: 'Skapa bana' }).click();
    await page.getByRole('button', { name: 'Redigera Kortbanan' }).click();

    const map = page.getByRole('region', { name: 'Karta' });
    await expect(map).toBeVisible();
    await expect(map).toContainText('Esri');
    await expect.poll(tileRequests).toBeGreaterThan(0);

    const holes = page.getByRole('region', { name: 'Vald bana' }).getByRole('listitem');
    await expect(holes).toHaveCount(9);
    await expect(holes.nth(0).getByRole('button', { name: /Hål 1\b/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await expect(holes.nth(0)).toContainText('greenpunkt saknas');

    // Klick på kartan sätter greenpunkten för aktivt hål (1) och aktiverar hål 2.
    await map.click();

    await expect(holes.nth(0)).not.toContainText('greenpunkt saknas');
    await expect(holes.nth(1).getByRole('button', { name: /Hål 2\b/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    const marker = page.getByRole('button', { name: 'Greenpunkt för hål 1' });
    await expect(marker).toBeVisible();

    // Dra markören: greenpunkten för hål 1 flyttas, aktivt hål är kvar.
    await holes
      .nth(0)
      .getByRole('button', { name: /Hål 1\b/ })
      .click();
    const activeHole = page.getByRole('region', { name: 'Aktivt hål' });
    const before = await activeHole.getByTestId('green-point').textContent();
    await dragBy(page, marker, 80, 40);
    await expect(activeHole.getByTestId('green-point')).not.toHaveText(before ?? '');
    await expect(page.getByRole('button', { name: 'Greenpunkt för hål 1' })).toHaveCount(1);
  });

  test('befintliga greenpunkter visas som markörer och par kan anges valfritt per hål', async ({
    page,
  }) => {
    await mockEsriTiles(page);
    await openEditModeWithMockedRepo(page, coursesDocument);
    await page.getByRole('button', { name: 'Redigera Ullna GK' }).click();

    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(9);

    await page.getByRole('button', { name: /Hål 3\b/ }).click();
    const activeHole = page.getByRole('region', { name: 'Aktivt hål' });
    await expect(activeHole.getByRole('heading')).toHaveText('Hål 3');
    await activeHole.getByLabel('Par').fill('5');
    await activeHole.getByLabel('Par').blur();
    await expect(page.getByRole('button', { name: /Hål 3\b/ })).toContainText('par 5');

    await activeHole.getByLabel('Par').fill('0');
    await activeHole.getByLabel('Par').blur();
    await expect(activeHole.getByRole('alert')).toContainText(
      'Par måste vara ett positivt heltal.',
    );

    await activeHole.getByLabel('Par').fill('');
    await activeHole.getByLabel('Par').blur();
    await expect(page.getByRole('button', { name: /Hål 3\b/ })).not.toContainText('par');
  });
});
