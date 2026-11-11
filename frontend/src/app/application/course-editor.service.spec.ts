import { TestBed } from '@angular/core/testing';
import { Course } from '../domain/course';
import { DataRepo } from '../domain/data-repo';
import { CourseEditorService } from './course-editor.service';
import { COURSE_READER, CourseReadResult, ICourseReader } from './ports';

const REPO: DataRepo = { owner: 'testare', name: 'yardage-data' };

const course = (id: string, name: string, holeCount: number): Course => ({
  id,
  name,
  holes: Array.from({ length: holeCount }, (_, i) => ({
    number: i + 1,
    green: { lat: 59, lng: 18 },
    par: 4,
  })),
});

class FakeCourseReader implements ICourseReader {
  calls = 0;
  constructor(private readonly result: CourseReadResult) {}
  read(): Promise<CourseReadResult> {
    this.calls += 1;
    return Promise.resolve(this.result);
  }
}

function setup(
  result: CourseReadResult = { kind: 'loaded', courses: [course('ullna', 'Ullna GK', 18)] },
) {
  const reader = new FakeCourseReader(result);
  TestBed.configureTestingModule({ providers: [{ provide: COURSE_READER, useValue: reader }] });
  return { editor: TestBed.inject(CourseEditorService), reader };
}

describe('CourseEditorService', () => {
  it('should_list_courses_from_data_repo_when_loaded', async () => {
    const { editor } = setup();

    await editor.load(REPO);

    expect(editor.status()).toBe('loaded');
    expect(editor.courses().map((c) => [c.id, c.name, c.holes.length])).toEqual([
      ['ullna', 'Ullna GK', 18],
    ]);
    expect(editor.courses()[0].holes[0]).toEqual({
      number: 1,
      green: { lat: 59, lng: 18 },
      par: 4,
    });
  });

  it('should_allow_creating_first_course_when_document_is_missing', async () => {
    const { editor, reader } = setup({ kind: 'missing' });
    await editor.load(REPO);

    editor.create('Kortbanan', 9);
    await editor.load(REPO);

    expect(editor.status()).toBe('missing');
    expect(editor.canEdit()).toBe(true);
    expect(reader.calls).toBe(1);
    expect(editor.courses().map((c) => c.name)).toEqual(['Kortbanan']);
  });

  it.each([
    [{ kind: 'unreachable' } as CourseReadResult, 'unreachable'],
    [{ kind: 'invalid', error: 'x' } as CourseReadResult, 'invalid'],
  ])('should_expose_read_failure_when_reading_fails (%j)', async (result, status) => {
    const { editor } = setup(result);

    await editor.load(REPO);

    expect(editor.status()).toBe(status);
    expect(editor.canEdit()).toBe(false);
    expect(editor.courses()).toEqual([]);
  });

  it('should_report_not_configured_when_no_data_repo_is_set', async () => {
    const { editor } = setup();

    await editor.load(null);

    expect(editor.status()).toBe('not-configured');
  });

  it('should_keep_in_memory_changes_when_loading_same_repo_again', async () => {
    const { editor, reader } = setup();
    await editor.load(REPO);
    editor.create('Kortbanan', 9);

    await editor.load({ ...REPO });

    expect(reader.calls).toBe(1);
    expect(editor.courses().map((c) => c.name)).toEqual(['Ullna GK', 'Kortbanan']);
  });

  it('should_reload_when_data_repo_changes', async () => {
    const { editor, reader } = setup();
    await editor.load(REPO);
    editor.create('Kortbanan', 9);

    await editor.load({ owner: 'annan', name: 'yardage-data' });

    expect(reader.calls).toBe(2);
    expect(editor.courses().map((c) => c.name)).toEqual(['Ullna GK']);
  });

  it('should_add_created_course_with_unique_id', async () => {
    const { editor } = setup({ kind: 'loaded', courses: [course('ullna-gk', 'Ullna GK', 18)] });
    await editor.load(REPO);

    const result = editor.create('Ullna GK', 9);

    expect(result.ok && result.value.id).toBe('ullna-gk-2');
    expect(editor.courses().map((c) => [c.id, c.holes.length])).toEqual([
      ['ullna-gk', 18],
      ['ullna-gk-2', 9],
    ]);
  });

  it('should_leave_list_unchanged_when_create_is_invalid', async () => {
    const { editor } = setup();
    await editor.load(REPO);

    const result = editor.create('  ', 9);

    expect(result.ok).toBe(false);
    expect(editor.courses()).toHaveLength(1);
  });

  it('should_remove_course_from_list', async () => {
    const { editor } = setup();
    await editor.load(REPO);
    editor.create('Kortbanan', 9);

    editor.remove('ullna');

    expect(editor.courses().map((c) => c.name)).toEqual(['Kortbanan']);
  });

  it('should_select_course_for_editing', async () => {
    const { editor } = setup();
    await editor.load(REPO);

    editor.select('ullna');

    expect(editor.selected()?.name).toBe('Ullna GK');
  });

  it('should_clear_selection_when_selected_course_is_removed', async () => {
    const { editor } = setup();
    await editor.load(REPO);
    editor.select('ullna');

    editor.remove('ullna');

    expect(editor.selected()).toBeNull();
  });

  describe('karteditor', () => {
    async function editNewCourse() {
      const { editor } = setup({ kind: 'missing' });
      await editor.load(REPO);
      const result = editor.create('Kortbanan', 9);
      editor.select(result.ok ? result.value.id : '');
      return editor;
    }

    it('should_make_first_hole_active_when_course_is_selected', async () => {
      const editor = await editNewCourse();

      expect(editor.activeHole()?.number).toBe(1);
    });

    it('should_have_no_active_hole_when_no_course_is_selected', async () => {
      const { editor } = setup();
      await editor.load(REPO);

      expect(editor.activeHole()).toBeNull();
    });

    it('should_activate_chosen_hole', async () => {
      const editor = await editNewCourse();

      editor.activateHole(5);

      expect(editor.activeHole()?.number).toBe(5);
    });

    it('should_set_green_point_for_active_hole_and_advance_to_next_hole_when_map_is_clicked', async () => {
      const editor = await editNewCourse();
      editor.activateHole(2);

      editor.placeGreenPointForActiveHole({ lat: 59.4, lng: 18.1 });

      expect(editor.selected()?.holes[1].green).toEqual({ lat: 59.4, lng: 18.1 });
      expect(editor.courses()[0].holes[1].green).toEqual({ lat: 59.4, lng: 18.1 });
      expect(editor.activeHole()?.number).toBe(3);
    });

    it('should_stay_on_last_hole_when_its_green_point_is_set', async () => {
      const editor = await editNewCourse();
      editor.activateHole(9);

      editor.placeGreenPointForActiveHole({ lat: 1, lng: 2 });

      expect(editor.activeHole()?.number).toBe(9);
      expect(editor.activeHole()?.green).toEqual({ lat: 1, lng: 2 });
    });

    it('should_move_green_point_of_dragged_hole_without_changing_active_hole', async () => {
      const editor = await editNewCourse();
      editor.placeGreenPointForActiveHole({ lat: 1, lng: 2 });

      editor.moveGreenPoint(1, { lat: 3, lng: 4 });

      expect(editor.selected()?.holes[0].green).toEqual({ lat: 3, lng: 4 });
      expect(editor.activeHole()?.number).toBe(2);
    });

    it('should_set_and_clear_optional_par_per_hole', async () => {
      const editor = await editNewCourse();

      expect(editor.setPar(4, 3).ok).toBe(true);
      expect(editor.selected()?.holes[3].par).toBe(3);

      editor.setPar(4, null);
      expect(editor.selected()?.holes[3].par).toBeUndefined();
    });

    it('should_leave_course_unchanged_when_par_is_invalid', async () => {
      const editor = await editNewCourse();
      const before = editor.selected();

      const result = editor.setPar(4, 0);

      expect(result.ok).toBe(false);
      expect(editor.selected()).toBe(before);
    });

    it('should_ignore_map_click_when_no_course_is_selected', async () => {
      const { editor } = setup();
      await editor.load(REPO);
      const before = editor.courses();

      editor.placeGreenPointForActiveHole({ lat: 1, lng: 2 });

      expect(editor.courses()).toBe(before);
    });
  });
});
