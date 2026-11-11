import { TestBed } from '@angular/core/testing';
import { Course } from '../domain/course';
import { DataRepo } from '../domain/data-repo';
import { CourseCatalogService } from './course-catalog.service';
import { COURSE_READER, COURSE_WRITER, CourseReadResult, ICourseReader, ICourseWriter } from './ports';

const REPO: DataRepo = { owner: 'testare', name: 'yardage-data' };
const OTHER_REPO: DataRepo = { owner: 'annan', name: 'yardage-data' };

const course = (id: string): Course => ({
  id,
  name: id,
  holes: [{ number: 1, green: { lat: 59, lng: 18 } }],
});

class FakeCourseReader implements ICourseReader {
  readonly reads: DataRepo[] = [];
  constructor(public result: CourseReadResult) {}
  read(repo: DataRepo): Promise<CourseReadResult> {
    this.reads.push(repo);
    return Promise.resolve(this.result);
  }
}

const savingWriter: ICourseWriter = { write: () => Promise.resolve({ kind: 'saved' }) };

describe('CourseCatalogService', () => {
  let reader: FakeCourseReader;
  let catalog: CourseCatalogService;

  beforeEach(() => {
    reader = new FakeCourseReader({ kind: 'loaded', courses: [course('ullna')] });
    TestBed.configureTestingModule({
      providers: [
        { provide: COURSE_READER, useValue: reader },
        { provide: COURSE_WRITER, useValue: savingWriter },
      ],
    });
    catalog = TestBed.inject(CourseCatalogService);
  });

  it('should_report_not_configured_when_no_data_repo_is_set', async () => {
    expect(await catalog.load(null)).toEqual({ kind: 'not-configured' });
    expect(reader.reads).toEqual([]);
  });

  it('should_read_data_repo_once_when_loaded_repeatedly_for_same_repo', async () => {
    const [first, second] = await Promise.all([catalog.load(REPO), catalog.load({ ...REPO })]);
    const third = await catalog.load(REPO);

    expect(reader.reads).toHaveLength(1);
    expect(first).toEqual({ kind: 'loaded', courses: [course('ullna')] });
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  it('should_read_each_data_repo_separately_when_repos_differ', async () => {
    await catalog.load(REPO);
    await catalog.load(OTHER_REPO);

    expect(reader.reads).toEqual([REPO, OTHER_REPO]);
  });

  it('should_read_again_when_previous_read_found_data_repo_unreachable', async () => {
    reader.result = { kind: 'unreachable' };
    expect(await catalog.load(REPO)).toEqual({ kind: 'unreachable' });

    reader.result = { kind: 'loaded', courses: [course('lida')] };
    expect(await catalog.load(REPO)).toEqual({ kind: 'loaded', courses: [course('lida')] });
    expect(reader.reads).toHaveLength(2);
  });

  it('should_answer_with_saved_courses_when_save_succeeded', async () => {
    await catalog.load(REPO);

    await catalog.save(REPO, 'token', [course('kortbanan')]);

    expect(await catalog.load(REPO)).toEqual({ kind: 'loaded', courses: [course('kortbanan')] });
    expect(reader.reads).toHaveLength(1);
  });

  it('should_read_data_repo_again_when_refreshed', async () => {
    await catalog.load(REPO);
    reader.result = { kind: 'loaded', courses: [course('lida')] };

    expect(await catalog.refresh(REPO)).toEqual({ kind: 'loaded', courses: [course('lida')] });
    expect(await catalog.load(REPO)).toEqual({ kind: 'loaded', courses: [course('lida')] });
    expect(reader.reads).toHaveLength(2);
  });

  it('should_drop_saved_override_when_refreshed', async () => {
    await catalog.save(REPO, 'token', [course('kortbanan')]);

    expect(await catalog.refresh(REPO)).toEqual({ kind: 'loaded', courses: [course('ullna')] });
  });
});
