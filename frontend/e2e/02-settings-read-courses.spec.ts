import { expect, Page, test } from '@playwright/test';

const OWNER = 'testare';
const RAW_URL = `https://raw.githubusercontent.com/${OWNER}/yardage-data/main/courses.json`;
// Påhittad token — endast för test, aldrig en riktig PAT.
const FAKE_TOKEN = 'github_pat_e2e_fake_token';

const holes = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    green: { lat: 59.4 + i / 1000, lng: 18.1 + i / 1000 },
  }));

const coursesDocument = {
  version: 1,
  courses: [
    { id: 'ullna', name: 'Ullna GK', holes: holes(18) },
    { id: 'kortbanan', name: 'Kortbanan', holes: holes(9) },
  ],
};

async function configureDataRepo(page: Page) {
  await page.goto('/settings');
  await expect(page.getByRole('heading', { level: 2, name: 'Inställningar' })).toBeVisible();
  await page.getByLabel('Ägare').fill(OWNER);
  await expect(page.getByLabel('Reponamn')).toHaveValue('yardage-data');
  await page.getByRole('button', { name: 'Spara data-repo' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Data-repot är sparat.' })).toBeVisible();
}

async function openPlayMode(page: Page) {
  await page.getByRole('link', { name: 'Tillbaka till start' }).click();
  await page.getByRole('link', { name: 'Spelläge' }).click();
  await expect(page).toHaveURL(/\/play$/);
}

test.describe('Ticket 02: Inställningar + läs banor från data-repo', () => {
  test('inställningar för data-repo och token sparas och läses tillbaka efter omladdning', async ({ page }) => {
    await configureDataRepo(page);

    await page.getByLabel('Token', { exact: true }).fill(FAKE_TOKEN);
    await page.getByRole('button', { name: 'Spara token' }).click();
    await expect(page.getByText('En token är sparad i den här webbläsaren.')).toBeVisible();
    // Tokenen visas aldrig igen efter sparande.
    await expect(page.getByLabel('Ersätt token')).toHaveValue('');

    await page.reload();

    await expect(page.getByLabel('Ägare')).toHaveValue(OWNER);
    await expect(page.getByLabel('Reponamn')).toHaveValue('yardage-data');
    await expect(page.getByText('En token är sparad i den här webbläsaren.')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('yardage.token'))).toBe(FAKE_TOKEN);

    await page.getByRole('button', { name: 'Radera token' }).click();
    await expect(page.getByText('En token är sparad i den här webbläsaren.')).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('yardage.token'))).toBeNull();
  });

  test('token-sektionen förklarar minimiscope och hur tokenen återkallas', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.getByText('contents:write')).toBeVisible();
    await expect(page.getByText('Only select repositories')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Så återkallar du den' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Fine-grained tokens/ })).toHaveAttribute(
      'href',
      'https://github.com/settings/personal-access-tokens',
    );
  });

  test('banor läses från data-repots raw-URL utan autentisering och listas', async ({ page }) => {
    let authHeader: string | undefined = 'ej anropad';
    await page.route(RAW_URL, (route) => {
      authHeader = route.request().headers()['authorization'];
      return route.fulfill({ status: 200, contentType: 'text/plain', body: JSON.stringify(coursesDocument) });
    });

    await configureDataRepo(page);
    await page.getByLabel('Token', { exact: true }).fill(FAKE_TOKEN);
    await page.getByRole('button', { name: 'Spara token' }).click();
    await openPlayMode(page);

    const items = page.getByRole('list', { name: 'Banor' }).getByRole('listitem');
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toContainText('Ullna GK');
    await expect(items.nth(0)).toContainText('18 hål');
    await expect(items.nth(1)).toContainText('Kortbanan');
    await expect(items.nth(1)).toContainText('9 hål');
    expect(authHeader).toBeUndefined();
  });

  test('saknat ban-dokument (404) ger ett tydligt fallback-meddelande', async ({ page }) => {
    await page.route(RAW_URL, (route) => route.fulfill({ status: 404, body: '404: Not Found' }));

    await configureDataRepo(page);
    await openPlayMode(page);

    await expect(page.getByRole('alert')).toContainText('Hittade inget ban-dokument');
    await expect(page.getByRole('alert')).toContainText(`${OWNER}/yardage-data`);
  });

  test('data-repo som inte nås ger ett tydligt meddelande', async ({ page }) => {
    await page.route(RAW_URL, (route) => route.abort('internetdisconnected'));

    await configureDataRepo(page);
    await openPlayMode(page);

    await expect(page.getByRole('alert')).toContainText('Data-repot kunde inte nås');
  });

  test('utan inställt data-repo hänvisar spelläget till inställningarna', async ({ page }) => {
    await page.goto('/play');

    await expect(page.getByRole('alert')).toContainText('Inget data-repo är inställt');
    await page.getByRole('link', { name: 'Gå till Inställningar' }).click();
    await expect(page).toHaveURL(/\/settings$/);
  });
});
