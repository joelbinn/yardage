import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CourseWriteResult, ICourseWriter } from '../application/ports';
import { Course } from '../domain/course';
import { serializeCoursesDocument } from '../domain/courses-document';
import { DataRepo } from '../domain/data-repo';

const API_ORIGIN = 'https://api.github.com';
const DOCUMENT_PATH = 'courses.json';
const BRANCH = 'main';
const BRANCH_REF = `refs/heads/${BRANCH}`;
const COMMIT_MESSAGE = 'Uppdatera banor';

interface ShaResponse {
  readonly sha: string;
}

/**
 * Adapter: skriver ban-dokumentet via GitHubs Git Data API (ADR-0002).
 *
 * blob → tree → commit **utan parent** → force-update av `refs/heads/main`. Force-pushen
 * är avsiktlig: data-repot ska alltid innehålla exakt en root-commit (ingen historik,
 * last-write-wins). Trädet innehåller bara `courses.json` — data-repot har inga andra filer.
 *
 * Ett helt tomt data-repo (spec: Förutsättningar) saknar git-databas, och Git Data API:t
 * svarar då 409. Första sparningen skapar i stället repots första commit via Contents API:t
 * (`PUT contents/courses.json`); den har ingen parent, så "exakt en commit" gäller även då.
 * Därefter fungerar orphan-commit-flödet ovan som vanligt.
 */
@Injectable({ providedIn: 'root' })
export class GitHubCourseWriter implements ICourseWriter {
  private readonly http = inject(HttpClient);

  async write(repo: DataRepo, token: string, courses: readonly Course[]): Promise<CourseWriteResult> {
    const git = new GitHubRepoApi(this.http, repo, token);
    const document = serializeCoursesDocument(courses);
    try {
      await writeOrphanCommit(git, document).catch((e: unknown) => {
        if (!isEmptyRepository(e)) {
          throw e;
        }
        return git.createInitialCommit(document);
      });
      return { kind: 'saved' };
    } catch (e) {
      return toFailure(e);
    }
  }
}

/** blob → tree → commit utan parent → force-update av main. */
async function writeOrphanCommit(git: GitHubRepoApi, document: string): Promise<void> {
  const blob = await git.post<ShaResponse>('blobs', { content: document, encoding: 'utf-8' });
  const tree = await git.post<ShaResponse>('trees', {
    tree: [{ path: DOCUMENT_PATH, mode: '100644', type: 'blob', sha: blob.sha }],
  });
  const commit = await git.post<ShaResponse>('commits', {
    message: COMMIT_MESSAGE,
    tree: tree.sha,
    parents: [],
  });
  await git.pointMainAt(commit.sha);
}

const isEmptyRepository = (e: unknown): boolean => e instanceof HttpErrorResponse && e.status === 409;

/** Base64 av UTF-8-bytes, som Contents API:t kräver (btoa klarar bara Latin-1). */
function toBase64Utf8(text: string): string {
  const binary = Array.from(new TextEncoder().encode(text), (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary);
}

/** Tunn klient för `/repos/{owner}/{repo}` (Git Data- och Contents-API) med token-autentisering. */
class GitHubRepoApi {
  private readonly repoBase: string;
  private readonly base: string;
  private readonly headers: HttpHeaders;

  constructor(
    private readonly http: HttpClient,
    repo: DataRepo,
    token: string,
  ) {
    const owner = encodeURIComponent(repo.owner);
    const name = encodeURIComponent(repo.name);
    this.repoBase = `${API_ORIGIN}/repos/${owner}/${name}`;
    this.base = `${this.repoBase}/git`;
    this.headers = new HttpHeaders({
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    });
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return firstValueFrom(this.http.post<T>(`${this.base}/${path}`, body, { headers: this.headers }));
  }

  /** Skapar ett tomt repos första (och enda) commit med ban-dokumentet på main. */
  async createInitialCommit(document: string): Promise<void> {
    const body = { message: COMMIT_MESSAGE, content: toBase64Utf8(document), branch: BRANCH };
    await firstValueFrom(
      this.http.put(`${this.repoBase}/contents/${DOCUMENT_PATH}`, body, { headers: this.headers }),
    );
  }

  /** Force-uppdaterar main; finns grenen inte ännu (422) skapas den. */
  async pointMainAt(sha: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.patch(`${this.base}/${BRANCH_REF}`, { sha, force: true }, { headers: this.headers }),
      );
    } catch (e) {
      if (!(e instanceof HttpErrorResponse && e.status === 422)) {
        throw e;
      }
      await this.post('refs', { ref: BRANCH_REF, sha });
    }
  }
}

const UNAUTHORIZED_STATUSES = [401, 403, 404];

function toFailure(error: unknown): CourseWriteResult {
  if (!(error instanceof HttpErrorResponse)) {
    throw error;
  }
  if (UNAUTHORIZED_STATUSES.includes(error.status)) {
    // GitHub svarar 404 när tokenen inte har åtkomst till repot.
    return { kind: 'unauthorized' };
  }
  return { kind: 'failed', error: failureMessage(error.status) };
}

function failureMessage(status: number): string {
  if (status === 0) {
    return 'GitHub kunde inte nås. Kontrollera nätverket och försök igen.';
  }
  return `GitHub kunde inte spara ban-dokumentet (HTTP ${status}).`;
}
