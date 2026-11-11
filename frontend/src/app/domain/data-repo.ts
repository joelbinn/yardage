/**
 * Value Object för data-repot: det publika GitHub-repo som lagrar `courses.json`
 * (GLOSSARY.md, ADR-0001).
 */
export interface DataRepo {
  readonly owner: string;
  readonly name: string;
}

export const DEFAULT_DATA_REPO_NAME = 'yardage-data';

export type DataRepoResult =
  | { readonly ok: true; readonly value: DataRepo }
  | { readonly ok: false; readonly field: 'owner' | 'name'; readonly error: string };

// GitHub-användarnamn: 1–39 tecken, alfanumeriskt eller bindestreck, ej inledande bindestreck.
const OWNER_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
// Reponamn: 1–100 tecken av A–Z, 0–9, '-', '_' och '.', men inte '.' eller '..'.
const NAME_PATTERN = /^[A-Za-z0-9._-]{1,100}$/;

export function createDataRepo(rawOwner: string, rawName: string): DataRepoResult {
  const owner = rawOwner.trim();
  const name = rawName.trim() || DEFAULT_DATA_REPO_NAME;

  if (!OWNER_PATTERN.test(owner)) {
    return { ok: false, field: 'owner', error: 'Ange ett giltigt GitHub-användarnamn.' };
  }
  if (!NAME_PATTERN.test(name) || name === '.' || name === '..') {
    return { ok: false, field: 'name', error: 'Ange ett giltigt reponamn.' };
  }
  return { ok: true, value: Object.freeze({ owner, name }) };
}

/** Data-repots identitet som text, `owner/name` — nyckel för jämförelser och visning. */
export function dataRepoKey(repo: DataRepo): string {
  return `${repo.owner}/${repo.name}`;
}

/** Publik raw-URL till ban-dokumentet — läses utan autentisering. */
export function rawCoursesUrl(repo: DataRepo): string {
  const owner = encodeURIComponent(repo.owner);
  const name = encodeURIComponent(repo.name);
  return `https://raw.githubusercontent.com/${owner}/${name}/main/courses.json`;
}
