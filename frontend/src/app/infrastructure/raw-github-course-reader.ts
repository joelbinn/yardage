import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CourseReadResult, ICourseReader } from '../application/ports';
import { parseCoursesDocument } from '../domain/courses-document';
import { DataRepo, rawCoursesUrl } from '../domain/data-repo';

/**
 * Adapter: läser `courses.json` via raw.githubusercontent.com utan autentisering
 * (ADR-0001). Översätter HTTP-utfall till domänens CourseReadResult.
 */
@Injectable({ providedIn: 'root' })
export class RawGitHubCourseReader implements ICourseReader {
  private readonly http = inject(HttpClient);

  async read(repo: DataRepo): Promise<CourseReadResult> {
    let body: string;
    try {
      // Hämtas som text så att trasig JSON blir 'invalid' och inte ett nätverksfel.
      body = await firstValueFrom(this.http.get(rawCoursesUrl(repo), { responseType: 'text' }));
    } catch (e) {
      return toFailure(e);
    }
    return toResult(body);
  }
}

function toFailure(error: unknown): CourseReadResult {
  const notFound = error instanceof HttpErrorResponse && error.status === 404;
  return notFound ? { kind: 'missing' } : { kind: 'unreachable' };
}

function toResult(body: string): CourseReadResult {
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return { kind: 'invalid', error: 'Dokumentet är inte giltig JSON.' };
  }
  const parsed = parseCoursesDocument(json);
  return parsed.ok ? { kind: 'loaded', courses: parsed.courses } : { kind: 'invalid', error: parsed.error };
}
