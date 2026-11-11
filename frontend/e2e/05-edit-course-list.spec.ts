import { expect, Page, test } from '@playwright/test';

const OWNER = 'testare';
const RAW_URL = `https://raw.githubusercontent.com/${OWNER}/yardage-data/main/courses.json`;

const holes = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    green: { lat: 59.4 + i / 1000, lng: 18.1 + i / 1000 },
  }));

const coursesDocument = {
  version: 1,
  courses: [{ id: 'ullna', name: 'Ullna GK', holes: holes(18) }],
};

async function openEditModeWithMockedRepo(page: Page, document: unknown = coursesDocument) {
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

async function createCourse(page: Page, name: string, holeCount: '9' | '18') {
  await page.getByLabel('Namn').fill(name);
  await page.getByLabel(`${holeCount} hål`, { exact: true }).check();
  await page.getByRole('button', { name: 'Skapa bana' }).click();
}

test.describe('Ticket 05: Redigeringsläge — bankurslista + skapa Bana', () => {
  test('skapar 9- och 18-hålsbana, tar bort en bana och väljer en bana för redigering', async ({
    page,
  }) => {
    await openEditModeWithMockedRepo(page);

    const list = page.getByRole('list', { name: 'Banor' });
    const items = list.getByRole('listitem');
    await expect(items).toHaveCount(1);
    await expect(items.nth(0)).toContainText('Ullna GK');
    await expect(items.nth(0)).toContainText('18 hål');

    await createCourse(page, 'Kortbanan', '9');
    await createCourse(page, 'Långbanan', '18');

    await expect(items).toHaveCount(3);
    await expect(items.nth(1)).toContainText('Kortbanan');
    await expect(items.nth(1)).toContainText('9 hål');
    await expect(items.nth(2)).toContainText('Långbanan');
    await expect(items.nth(2)).toContainText('18 hål');

    await items.nth(0).getByRole('button', { name: 'Ta bort Ullna GK' }).click();
    await expect(items).toHaveCount(2);
    await expect(list).not.toContainText('Ullna GK');

    await items.nth(0).getByRole('button', { name: 'Redigera Kortbanan' }).click();
    const selected = page.getByRole('region', { name: 'Vald bana' });
    await expect(selected.getByRole('heading', { name: 'Kortbanan' })).toBeVisible();
    await expect(selected.getByRole('listitem')).toHaveCount(9);
    await expect(selected.getByRole('listitem').first()).toContainText('Hål 1');

    // Ändringarna lever i minnet och överlever navigering inom appen.
    await page.getByRole('link', { name: 'Tillbaka till start' }).click();
    await page.getByRole('link', { name: 'Redigeringsläge' }).click();
    await expect(items).toHaveCount(2);
  });

  test('ogiltigt namn ger felmeddelande och lämnar listan orörd', async ({ page }) => {
    await openEditModeWithMockedRepo(page);
    await expect(page.getByRole('list', { name: 'Banor' }).getByRole('listitem')).toHaveCount(1);

    await page.getByRole('button', { name: 'Skapa bana' }).click();

    await expect(page.getByRole('alert')).toContainText('Ange ett namn på banan.');
    await expect(page.getByRole('list', { name: 'Banor' }).getByRole('listitem')).toHaveCount(1);
  });

  test('nytt data-repo utan ban-dokument kan få sin första bana i Redigeringsläget', async ({
    page,
  }) => {
    await openEditModeWithMockedRepo(page, null);

    await expect(page.getByRole('status')).toContainText('inget ban-dokument');
    await createCourse(page, 'Kortbanan', '9');

    const items = page.getByRole('list', { name: 'Banor' }).getByRole('listitem');
    await expect(items).toHaveCount(1);
    await expect(items.nth(0)).toContainText('Kortbanan — 9 hål');
  });

  test('utan inställt data-repo hänvisar redigeringsläget till inställningarna', async ({
    page,
  }) => {
    await page.goto('/edit');

    await expect(page.getByRole('alert')).toContainText('Inget data-repo är inställt');
    await page.getByRole('link', { name: 'Gå till Inställningar' }).click();
    await expect(page).toHaveURL(/\/settings$/);
  });
});
