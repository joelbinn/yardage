import { expect, Page, test } from '@playwright/test';
import {
  configure,
  ESRI_TILES,
  GIT_API,
  RAW_URL,
  stubGitDataApi,
  TEST_TOKEN,
  TILE_PNG,
  TWO_COURSES,
} from './support/github-api-stub';

async function openEditMode(page: Page, token: string | null) {
  await page.route(RAW_URL, (route) =>
    route.fulfill({ status: 200, contentType: 'text/plain', body: JSON.stringify(TWO_COURSES) }),
  );
  await page.route(ESRI_TILES, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: TILE_PNG }),
  );
  await page.goto('/');
  await configure(page, token);
  await page.goto('/edit');
  await expect(page.getByRole('button', { name: 'Redigera Ullna GK' })).toBeVisible();
}

const saveSection = (page: Page) => page.getByRole('region', { name: 'Spara' });

test.describe('Ticket 07: Redigeringsläge — spara via Git Data API', () => {
  test('spara skriver blob → tree → commit utan parent → force-update av main', async ({ page }) => {
    const requests = await stubGitDataApi(page);
    await openEditMode(page, TEST_TOKEN);

    await page.getByRole('button', { name: 'Ta bort Lida GK' }).click();
    await saveSection(page).getByRole('button', { name: 'Spara banor' }).click();

    await expect(saveSection(page).getByRole('status')).toHaveText('Banorna är sparade i data-repot.');
    expect(requests.map((r) => `${r.method} ${r.url}`)).toEqual([
      `POST ${GIT_API}/blobs`,
      `POST ${GIT_API}/trees`,
      `POST ${GIT_API}/commits`,
      `PATCH ${GIT_API}/refs/heads/main`,
    ]);
    expect(requests.every((r) => r.authorization === `Bearer ${TEST_TOKEN}`)).toBe(true);
    const [blob, tree, commit, ref] = requests.map((r) => r.body);
    const saved = JSON.parse(blob['content'] as string);
    expect(saved.version).toBe(1);
    expect(saved.courses.map((c: { name: string }) => c.name)).toEqual(['Ullna GK']);
    expect(tree['tree']).toEqual([{ path: 'courses.json', mode: '100644', type: 'blob', sha: 'blob-sha' }]);
    expect(commit).toMatchObject({ tree: 'tree-sha', parents: [] });
    expect(ref).toEqual({ sha: 'commit-sha', force: true });

    // Spelläget speglar det sparade dokumentet trots att raw-URL:en fortfarande svarar med det gamla.
    await page.getByRole('link', { name: 'Tillbaka till start' }).click();
    await page.getByRole('link', { name: 'Spelläge' }).click();
    await expect(page.getByRole('list', { name: 'Banor' }).getByRole('listitem')).toHaveText([/Ullna GK/]);
  });

  test('saknad token ger vägledning till inställningssidan utan att anropa GitHub', async ({ page }) => {
    const requests = await stubGitDataApi(page);
    await openEditMode(page, null);

    await saveSection(page).getByRole('button', { name: 'Spara banor' }).click();

    await expect(saveSection(page).getByRole('alert')).toContainText('Ingen GitHub-token är inställd');
    await saveSection(page).getByRole('link', { name: 'Gå till Inställningar' }).click();
    await expect(page).toHaveURL(/\/settings$/);
    expect(requests).toEqual([]);
  });

  test('ogiltig token ger vägledning till inställningssidan', async ({ page }) => {
    await stubGitDataApi(page, 401);
    await openEditMode(page, TEST_TOKEN);

    await saveSection(page).getByRole('button', { name: 'Spara banor' }).click();

    await expect(saveSection(page).getByRole('alert')).toContainText('GitHub avvisade tokenen');
    await expect(saveSection(page).getByRole('link', { name: 'Gå till Inställningar' })).toBeVisible();
  });

  test('bana med hål utan greenpunkt sparas inte', async ({ page }) => {
    const requests = await stubGitDataApi(page);
    await openEditMode(page, TEST_TOKEN);

    await page.getByLabel('Namn').fill('Kortbanan');
    await page.getByLabel('9 hål', { exact: true }).check();
    await page.getByRole('button', { name: 'Skapa bana' }).click();
    await saveSection(page).getByRole('button', { name: 'Spara banor' }).click();

    await expect(saveSection(page).getByRole('alert')).toHaveText(
      'Kortbanan saknar greenpunkt för hål 1, 2, 3, 4, 5, 6, 7, 8, 9.',
    );
    expect(requests).toEqual([]);
  });
});
