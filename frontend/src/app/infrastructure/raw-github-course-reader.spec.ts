import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RawGitHubCourseReader } from './raw-github-course-reader';

const URL = 'https://raw.githubusercontent.com/joel/yardage-data/main/courses.json';
const repo = { owner: 'joel', name: 'yardage-data' };

describe('RawGitHubCourseReader', () => {
  let reader: RawGitHubCourseReader;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    reader = TestBed.inject(RawGitHubCourseReader);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should_return_loaded_when_document_is_valid', async () => {
    const pending = reader.read(repo);
    const req = http.expectOne(URL);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush(JSON.stringify({ version: 1, courses: [] }));

    expect(await pending).toEqual({ kind: 'loaded', courses: [] });
  });

  it('should_return_missing_when_404', async () => {
    const pending = reader.read(repo);
    http.expectOne(URL).flush('404: Not Found', { status: 404, statusText: 'Not Found' });

    expect(await pending).toEqual({ kind: 'missing' });
  });

  it('should_return_unreachable_when_network_fails', async () => {
    const pending = reader.read(repo);
    http.expectOne(URL).error(new ProgressEvent('error'));

    expect(await pending).toEqual({ kind: 'unreachable' });
  });

  it('should_return_invalid_when_body_is_not_json', async () => {
    const pending = reader.read(repo);
    http.expectOne(URL).flush('{trasig');

    expect((await pending).kind).toBe('invalid');
  });

  it('should_return_invalid_when_document_fails_validation', async () => {
    const pending = reader.read(repo);
    http.expectOne(URL).flush(JSON.stringify({ version: 9, courses: [] }));

    expect(await pending).toEqual({ kind: 'invalid', error: 'version: måste vara 1' });
  });
});
