import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Course } from '../domain/course';
import { GitHubCourseWriter } from './github-course-writer';

const API = 'https://api.github.com/repos/joel/yardage-data/git';
const repo = { owner: 'joel', name: 'yardage-data' };
const TOKEN = 'github_pat_test';

const courses: readonly Course[] = [
  { id: 'a', name: 'A', holes: [{ number: 1, green: { lat: 59.5, lng: 18.25 } }] },
];

describe('GitHubCourseWriter', () => {
  let writer: GitHubCourseWriter;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    writer = TestBed.inject(GitHubCourseWriter);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /** Låter HttpClient skicka nästa anrop i kedjan innan testet förväntar sig det. */
  const tick = () => new Promise((resolve) => setTimeout(resolve));

  async function expectRequest(method: string, url: string) {
    await tick();
    const req = http.expectOne({ method, url });
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${TOKEN}`);
    expect(req.request.headers.get('Accept')).toBe('application/vnd.github+json');
    return req;
  }

  it('should_write_blob_tree_parentless_commit_and_force_update_main_when_saving', async () => {
    const pending = writer.write(repo, TOKEN, courses);

    const blob = await expectRequest('POST', `${API}/blobs`);
    expect(blob.request.body.encoding).toBe('utf-8');
    expect(JSON.parse(blob.request.body.content)).toEqual({ version: 1, courses });
    blob.flush({ sha: 'blob-sha' });

    const tree = await expectRequest('POST', `${API}/trees`);
    expect(tree.request.body).toEqual({
      tree: [{ path: 'courses.json', mode: '100644', type: 'blob', sha: 'blob-sha' }],
    });
    tree.flush({ sha: 'tree-sha' });

    const commit = await expectRequest('POST', `${API}/commits`);
    expect(commit.request.body.tree).toBe('tree-sha');
    expect(commit.request.body.parents).toEqual([]);
    expect(typeof commit.request.body.message).toBe('string');
    commit.flush({ sha: 'commit-sha' });

    const ref = await expectRequest('PATCH', `${API}/refs/heads/main`);
    expect(ref.request.body).toEqual({ sha: 'commit-sha', force: true });
    ref.flush({ ref: 'refs/heads/main' });

    expect(await pending).toEqual({ kind: 'saved' });
  });

  it('should_create_main_ref_when_it_does_not_exist', async () => {
    const pending = writer.write(repo, TOKEN, courses);
    (await expectRequest('POST', `${API}/blobs`)).flush({ sha: 'b' });
    (await expectRequest('POST', `${API}/trees`)).flush({ sha: 't' });
    (await expectRequest('POST', `${API}/commits`)).flush({ sha: 'c' });
    (await expectRequest('PATCH', `${API}/refs/heads/main`)).flush(
      { message: 'Reference does not exist' },
      { status: 422, statusText: 'Unprocessable Entity' },
    );

    const create = await expectRequest('POST', `${API}/refs`);
    expect(create.request.body).toEqual({ ref: 'refs/heads/main', sha: 'c' });
    create.flush({ ref: 'refs/heads/main' });

    expect(await pending).toEqual({ kind: 'saved' });
  });

  it.each([401, 403, 404])('should_return_unauthorized_when_github_answers_%s', async (status) => {
    const pending = writer.write(repo, TOKEN, courses);
    (await expectRequest('POST', `${API}/blobs`)).flush({}, { status, statusText: 'Nope' });

    expect(await pending).toEqual({ kind: 'unauthorized' });
  });

  it('should_explain_when_data_repo_is_empty', async () => {
    const pending = writer.write(repo, TOKEN, courses);
    (await expectRequest('POST', `${API}/blobs`)).flush(
      { message: 'Git Repository is empty.' },
      { status: 409, statusText: 'Conflict' },
    );

    expect(await pending).toEqual({
      kind: 'failed',
      error: 'Data-repot är tomt. Skapa det med en första commit (t.ex. en README) och försök igen.',
    });
  });

  it('should_return_failed_when_network_fails', async () => {
    const pending = writer.write(repo, TOKEN, courses);
    (await expectRequest('POST', `${API}/blobs`)).error(new ProgressEvent('error'));

    expect(await pending).toEqual({
      kind: 'failed',
      error: 'GitHub kunde inte nås. Kontrollera nätverket och försök igen.',
    });
  });
});
