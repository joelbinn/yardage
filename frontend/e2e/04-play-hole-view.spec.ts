import { expect, Page, test } from '@playwright/test';

const OWNER = 'testare';
const RAW_URL = `https://raw.githubusercontent.com/${OWNER}/yardage-data/main/courses.json`;

// Nio hål på rad norrut; varje greenpunkt ligger 0,001° (≈ 111 m) norr om föregående.
const BASE = { lat: 59.48, lng: 18.16 };
const coursesDocument = {
  version: 1,
  courses: [
    {
      id: 'ullna',
      name: 'Ullna GK',
      holes: Array.from({ length: 9 }, (_, i) => ({
        number: i + 1,
        green: { lat: BASE.lat + i / 1000, lng: BASE.lng },
      })),
    },
  ],
};

// Spelaren står 0,001° söder om green på hål 1 → 111 m; till hål 2 → 222 m.
const TEE_1 = { latitude: BASE.lat - 0.001, longitude: BASE.lng, accuracy: 8 };

async function openHoleView(page: Page) {
  await page.route(RAW_URL, (route) =>
    route.fulfill({ status: 200, contentType: 'text/plain', body: JSON.stringify(coursesDocument) }),
  );
  await page.goto('/');
  await page.evaluate((owner) => {
    localStorage.setItem('yardage.dataRepo', JSON.stringify({ owner, name: 'yardage-data' }));
  }, OWNER);
  await page.goto('/play/ullna');
}

const distance = (page: Page) => page.getByRole('status', { name: 'Avstånd till green' });

test.describe('Ticket 04: Spelläge — hålvyn med live Avstånd', () => {
  test.use({ geolocation: TEE_1, permissions: ['geolocation'] });

  test('hålvyn visar Avstånd från spelarens position och noggrannhet', async ({ page }) => {
    await openHoleView(page);

    await expect(page.getByRole('heading', { name: 'Hål 1' })).toBeVisible();
    await expect(distance(page)).toHaveText('111 m');
    await expect(page.getByText('±8 m')).toBeVisible();
  });

  test('Avståndet uppdateras när spelaren går', async ({ page, context }) => {
    await openHoleView(page);
    await expect(distance(page)).toHaveText('111 m');

    // Spelaren går halvvägs mot green (≈ 56 m kvar).
    await context.setGeolocation({ latitude: BASE.lat - 0.0005, longitude: BASE.lng, accuracy: 5 });

    await expect(distance(page)).toHaveText('56 m');
    await expect(page.getByText('±5 m')).toBeVisible();
  });

  test('navigeringen är disabled i ändarna och följer hålen', async ({ page }) => {
    await openHoleView(page);
    const previous = page.getByRole('button', { name: 'Föregående hål' });
    const next = page.getByRole('button', { name: 'Nästa hål' });

    await expect(previous).toBeDisabled();
    await next.click();
    await expect(page.getByRole('heading', { name: 'Hål 2' })).toBeVisible();
    await expect(distance(page)).toHaveText('222 m');
    await expect(previous).toBeEnabled();

    for (let i = 0; i < 7; i++) {
      await next.click();
    }
    await expect(page.getByRole('heading', { name: 'Hål 9' })).toBeVisible();
    await expect(next).toBeDisabled();

    await previous.click();
    await expect(page.getByRole('heading', { name: 'Hål 8' })).toBeVisible();
  });

  test('hålvyn återanvänder bansökningens inläsning av ban-dokumentet', async ({ page }) => {
    let reads = 0;
    await page.route(RAW_URL, (route) => {
      reads += 1;
      return route.fulfill({ status: 200, contentType: 'text/plain', body: JSON.stringify(coursesDocument) });
    });
    await page.goto('/');
    await page.evaluate((owner) => {
      localStorage.setItem('yardage.dataRepo', JSON.stringify({ owner, name: 'yardage-data' }));
    }, OWNER);
    await page.getByRole('link', { name: 'Spelläge' }).click();

    await page.getByRole('link', { name: /Ullna GK/ }).click();

    await expect(distance(page)).toHaveText('111 m');
    expect(reads).toBe(1);
  });

  test('stäng återgår till banvalet', async ({ page }) => {
    await openHoleView(page);

    await page.getByRole('link', { name: 'Stäng' }).click();

    await expect(page).toHaveURL(/\/play$/);
    await expect(page.getByLabel('Sök bana')).toBeVisible();
  });
});
