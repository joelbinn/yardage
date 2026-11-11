import { BrowserContext, expect, Page, test } from '@playwright/test';

// Körs i projektet 'offline' mot produktionsbygget (service worker aktiv), se playwright.config.ts.

const OWNER = 'testare';
const RAW_URL = `https://raw.githubusercontent.com/${OWNER}/yardage-data/main/courses.json`;

// Spelaren står 0,001° (≈ 111 m) söder om green på hål 1.
const BASE = { lat: 59.48, lng: 18.16 };
const PLAYER = { latitude: BASE.lat - 0.001, longitude: BASE.lng, accuracy: 8 };

const documentWith = (courseName: string) => ({
  version: 1,
  courses: [
    {
      id: 'ullna',
      name: courseName,
      holes: Array.from({ length: 9 }, (_, i) => ({
        number: i + 1,
        green: { lat: BASE.lat + i / 1000, lng: BASE.lng },
      })),
    },
  ],
});

// context.route fångar även service workerns egna nätverksanrop (Chromium).
async function serveCourses(context: BrowserContext, courseName: string) {
  await context.unroute(RAW_URL);
  await context.route(RAW_URL, (route) =>
    route.fulfill({ status: 200, contentType: 'text/plain', body: JSON.stringify(documentWith(courseName)) }),
  );
}

async function goOffline(context: BrowserContext) {
  await context.unroute(RAW_URL);
  await context.setOffline(true);
}

/** Första besöket: konfigurera data-repo och vänta tills service workern styr sidan. */
async function firstVisit(page: Page) {
  await page.goto('./');
  await page.evaluate((owner) => {
    localStorage.setItem('yardage.dataRepo', JSON.stringify({ owner, name: 'yardage-data' }));
  }, OWNER);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
}

/** Öppnar Spelläget så att ban-dokumentet hämtas (genom service workern). */
async function openPlay(page: Page) {
  await page.goto('play');
  return courseItems(page);
}

const courseItems = (page: Page) => page.getByRole('list', { name: 'Banor' }).getByRole('listitem');
const distance = (page: Page) => page.getByRole('status', { name: 'Avstånd till green' });

test.describe('Ticket 08: Offline — cachad bandata i Spelläge', () => {
  test.use({ geolocation: PLAYER, permissions: ['geolocation'] });

  test('bansökning och hålvy fungerar med nätverket avstängt efter första laddningen', async ({ page, context }) => {
    await serveCourses(context, 'Ullna GK');
    await firstVisit(page);
    await expect(await openPlay(page)).toHaveText([/Ullna GK/]);

    await goOffline(context);
    await page.reload();

    await page.getByLabel('Sök bana').fill('ullna');
    await expect(courseItems(page)).toHaveText([/Ullna GK/]);
    await page.getByRole('link', { name: /Ullna GK/ }).click();
    await expect(page.getByRole('heading', { name: 'Hål 1' })).toBeVisible();
    await expect(distance(page)).toHaveText('111 m');

    // GPS fungerar utan nätverk: Avståndet följer spelaren även offline.
    await context.setGeolocation({ latitude: BASE.lat - 0.0005, longitude: BASE.lng, accuracy: 5 });
    await expect(distance(page)).toHaveText('56 m');
  });

  test('cachen uppdateras när ny bandata hämtas med nätverk', async ({ page, context }) => {
    await serveCourses(context, 'Ullna GK');
    await firstVisit(page);
    await expect(await openPlay(page)).toHaveText([/Ullna GK/]);

    await serveCourses(context, 'Ullna Golfklubb');
    await expect(await openPlay(page)).toHaveText([/Ullna Golfklubb/]);

    await goOffline(context);
    await page.reload();

    await expect(courseItems(page)).toHaveText([/Ullna Golfklubb/]);
  });
});
