import { expect, Page, test } from '@playwright/test';

const OWNER = 'testare';
const RAW_URL = `https://raw.githubusercontent.com/${OWNER}/yardage-data/main/courses.json`;

// Spelaren står i centrala Stockholm; banornas greenpunkter ligger på verkliga orter.
const STOCKHOLM = { latitude: 59.3293, longitude: 18.0686 };

const greens = (lat: number, lng: number, count: number) =>
  Array.from({ length: count }, (_, i) => ({ number: i + 1, green: { lat: lat + i / 10000, lng: lng + i / 10000 } }));

const coursesDocument = {
  version: 1,
  courses: [
    { id: 'albatross', name: 'Albatross GK', holes: greens(57.7089, 11.9746, 18) }, // Göteborg
    { id: 'bergs', name: 'Bergs GK', holes: greens(59.8586, 17.6389, 9) }, // Uppsala
    { id: 'ullna', name: 'Ullna GK', holes: greens(59.48, 18.16, 18) }, // Åkersberga
  ],
};

async function openPlayModeWithCourses(page: Page) {
  await page.route(RAW_URL, (route) =>
    route.fulfill({ status: 200, contentType: 'text/plain', body: JSON.stringify(coursesDocument) }),
  );
  await page.goto('/');
  await page.evaluate((owner) => {
    localStorage.setItem('yardage.dataRepo', JSON.stringify({ owner, name: 'yardage-data' }));
  }, OWNER);
  await page.goto('/play');
}

const courseItems = (page: Page) => page.getByRole('list', { name: 'Banor' }).getByRole('listitem');

test.describe('Ticket 03: Spelläge — bansökning närmast-först', () => {
  test.describe('med platsåtkomst', () => {
    test.use({ geolocation: STOCKHOLM, permissions: ['geolocation'] });

    test('banorna sorteras närmast-först utifrån spelarens position', async ({ page }) => {
      await openPlayModeWithCourses(page);

      await expect(courseItems(page)).toHaveText([/Ullna GK/, /Bergs GK/, /Albatross GK/]);
    });

    test('textfiltret visar bara banor vars namn matchar', async ({ page }) => {
      await openPlayModeWithCourses(page);
      await expect(courseItems(page)).toHaveCount(3);

      await page.getByLabel('Sök bana').fill('berg');
      await expect(courseItems(page)).toHaveText([/Bergs GK/]);

      await page.getByLabel('Sök bana').fill('finns inte');
      await expect(courseItems(page)).toHaveCount(0);
      await expect(page.getByText('Inga banor matchar sökningen.')).toBeVisible();
    });

    test('val av bana navigerar vidare i spelläget', async ({ page }) => {
      await openPlayModeWithCourses(page);

      await page.getByRole('link', { name: /Ullna GK/ }).click();

      await expect(page).toHaveURL(/\/play\/ullna$/);
      await expect(page.getByRole('heading', { name: 'Hål 1' })).toBeVisible();
    });
  });

  test.describe('utan platsåtkomst', () => {
    test.use({ permissions: [] });

    test('nekad platsåtkomst ger alfabetisk lista', async ({ page }) => {
      await openPlayModeWithCourses(page);

      await expect(courseItems(page)).toHaveText([/Albatross GK/, /Bergs GK/, /Ullna GK/]);
      await expect(page.getByText('Platsåtkomst saknas — banorna visas i bokstavsordning.')).toBeVisible();
    });
  });
});
