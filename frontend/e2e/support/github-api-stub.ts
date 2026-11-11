import { BrowserContext, Page } from '@playwright/test';

export const OWNER = 'testare';
export const RAW_URL = `https://raw.githubusercontent.com/${OWNER}/yardage-data/main/courses.json`;
export const GIT_API = `https://api.github.com/repos/${OWNER}/yardage-data/git`;
// Påhittat testvärde — GitHub API:t är mockat och nås aldrig på riktigt.
export const TEST_TOKEN = 'github_pat_e2e_test_value';

export interface RecordedRequest {
  readonly method: string;
  readonly url: string;
  readonly authorization: string | undefined;
  readonly body: Record<string, unknown>;
}

const SHAS: Record<string, string> = { blobs: 'blob-sha', trees: 'tree-sha', commits: 'commit-sha' };

/**
 * Mockar Git Data API:t (blob → tree → commit → ref). Svarar `status` på alla anrop
 * när den anges, t.ex. 401 för en ogiltig token. Returnerar de inspelade anropen.
 */
export async function stubGitDataApi(
  target: Page | BrowserContext,
  status?: number,
): Promise<RecordedRequest[]> {
  const requests: RecordedRequest[] = [];
  await target.route('https://api.github.com/**', async (route) => {
    const request = route.request();
    requests.push({
      method: request.method(),
      url: request.url(),
      authorization: await request.headerValue('authorization') ?? undefined,
      body: request.postDataJSON() ?? {},
    });
    if (status !== undefined) {
      return route.fulfill({ status, json: { message: 'Bad credentials' } });
    }
    const kind = request.url().slice(GIT_API.length + 1);
    return route.fulfill({ status: 201, json: { sha: SHAS[kind] ?? 'ref-sha', ref: 'refs/heads/main' } });
  });
  return requests;
}

/** Sparar data-repo (och valfritt token) i localStorage som inställningssidan gör. */
export async function configure(page: Page, token: string | null) {
  await page.evaluate(
    ({ owner, token }) => {
      localStorage.setItem('yardage.dataRepo', JSON.stringify({ owner, name: 'yardage-data' }));
      if (token) localStorage.setItem('yardage.token', token);
    },
    { owner: OWNER, token },
  );
}

const course = (id: string, name: string, lat: number) => ({
  id,
  name,
  holes: Array.from({ length: 9 }, (_, i) => ({
    number: i + 1,
    green: { lat: lat + i / 1000, lng: 18.1 },
  })),
});

export const TWO_COURSES = {
  version: 1,
  courses: [course('ullna', 'Ullna GK', 59.4), course('lida', 'Lida GK', 59.3)],
};

export const ESRI_TILES = /^https:\/\/server\.arcgisonline\.com\/ArcGIS\/rest\/services\/World_Imagery\//;

// 1×1 px PNG — ersätter Esri-tiles så att testet aldrig går mot nätet.
export const TILE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);
