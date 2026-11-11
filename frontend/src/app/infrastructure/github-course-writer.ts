import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CourseWriteResult, ICourseWriter } from '../application/ports';
import { Course } from '../domain/course';
import { serializeCoursesDocument } from '../domain/courses-document';
import { DataRepo } from '../domain/data-repo';

const API_ORIGIN = 'https://api.github.com';
const DOCUMENT_PATH = 'courses.json';
const BRANCH_REF = 'refs/heads/main';
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
 */
@Injectable({ providedIn: 'root' })
export class GitHubCourseWriter implements ICourseWriter {
  private readonly http = inject(HttpClient);

  async write(repo: DataRepo, token: string, courses: readonly Course[]): Promise<CourseWriteResult> {
    const git = new GitDataApi(this.http, repo, token);
    try {
      const blob = await git.post<ShaResponse>('blobs', {
        content: serializeCoursesDocument(courses),
        encoding: 'utf-8',
      });
      const tree = await git.post<ShaResponse>('trees', {
        tree: [{ path: DOCUMENT_PATH, mode: '100644', type: 'blob', sha: blob.sha }],
      });
      const commit = await git.post<ShaResponse>('commits', {
        message: COMMIT_MESSAGE,
        tree: tree.sha,
        parents: [],
      });
      await git.pointMainAt(commit.sha);
      return { kind: 'saved' };
    } catch (e) {
      return toFailure(e);
    }
  }
}

/** Tunn klient för `/repos/{owner}/{repo}/git/*` med token-autentisering. */
class GitDataApi {
  private readonly base: string;
  private readonly headers: HttpHeaders;

  constructor(
    private readonly http: HttpClient,
    repo: DataRepo,
    token: string,
  ) {
    const owner = encodeURIComponent(repo.owner);
    const name = encodeURIComponent(repo.name);
    this.base = `${API_ORIGIN}/repos/${owner}/${name}/git`;
    this.headers = new HttpHeaders({
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    });
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return firstValueFrom(this.http.post<T>(`${this.base}/${path}`, body, { headers: this.headers }));
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
  if (status === 409) {
    return 'Data-repot är tomt. Skapa det med en första commit (t.ex. en README) och försök igen.';
  }
  return `GitHub kunde inte spara ban-dokumentet (HTTP ${status}).`;
}
