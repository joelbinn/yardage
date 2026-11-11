import { BrowserContext, Page } from '@playwright/test';

export const OWNER = 'testare';
export const RAW_URL = `https://raw.githubusercontent.com/${OWNER}/yardage-data/main/courses.json`;
export const REPO_API = `https://api.github.com/repos/${OWNER}/yardage-data`;
export const GIT_API = `${REPO_API}/git`;
export const CONTENTS_API = `${REPO_API}/contents/courses.json`;
// Påhittat testvärde — GitHub API:t är mockat och nås aldrig på riktigt.
export const TEST_TOKEN = 'github_pat_e2e_test_value';

export interface RecordedRequest {
  readonly method: string;
  readonly url: string;
  readonly authorization: string | undefined;
  readonly body: Record<string, unknown>;
}

const SHAS: Record<string, string> = { blobs: 'blob-sha', trees: 'tree-sha', commits: 'commit-sha' };

export interface GitDataApiStubOptions {
  /** Svarar detta på alla anrop, t.ex. 401 för en ogiltig token. */
  readonly status?: number;
  /**
   * Data-repot är helt tomt: Git Data API:t svarar 409 tills en första commit skapats
   * via Contents API:t (`PUT contents/courses.json`), därefter som vanligt.
   */
  readonly emptyRepo?: boolean;
}

/**
 * Mockar GitHubs repo-API (Git Data: blob → tree → commit → ref, samt Contents för ett
 * tomt repos första commit). Returnerar de inspelade anropen.
 */
export async function stubGitDataApi(
  target: Page | BrowserContext,
  { status, emptyRepo = false }: GitDataApiStubOptions = {},
): Promise<RecordedRequest[]> {
  const requests: RecordedRequest[] = [];
  let empty = emptyRepo;
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
    if (request.url() === CONTENTS_API && request.method() === 'PUT') {
      empty = false;
      return route.fulfill({ status: 201, json: { commit: { sha: 'initial-sha' } } });
    }
    if (empty) {
      return route.fulfill({ status: 409, json: { message: 'Git Repository is empty.' } });
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
