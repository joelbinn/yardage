import { createCourseDraft } from './course-draft';

describe('createCourseDraft', () => {
  it('should_create_course_with_holes_numbered_from_1_when_input_is_valid', () => {
    const result = createCourseDraft('Ullna GK', 9, []);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe('Ullna GK');
      expect(result.value.holes.map((h) => h.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(result.value.holes[0].green).toBeNull();
    }
  });

  it('should_create_18_holes_when_hole_count_is_18', () => {
    const result = createCourseDraft('Ullna GK', 18, []);

    expect(result.ok && result.value.holes.length).toBe(18);
    expect(result.ok && result.value.holes[17].number).toBe(18);
  });

  it.each([0, 10, 17, 19, 2.5])('should_reject_when_hole_count_is_%s', (count) => {
    const result = createCourseDraft('Ullna GK', count, []);

    expect(result).toEqual({ ok: false, error: 'Hålantalet måste vara 9 eller 18.' });
  });

  it.each(['', '   '])('should_reject_when_name_is_blank (%j)', (name) => {
    expect(createCourseDraft(name, 9, [])).toEqual({ ok: false, error: 'Ange ett namn på banan.' });
  });

  it('should_trim_name', () => {
    const result = createCourseDraft('  Ullna GK ', 9, []);

    expect(result.ok && result.value.name).toBe('Ullna GK');
  });

  it('should_derive_url_safe_id_from_name', () => {
    const result = createCourseDraft('Åkersberga Golfklubb – Gula', 9, []);

    expect(result.ok && result.value.id).toBe('akersberga-golfklubb-gula');
  });

  it('should_make_id_unique_when_id_already_exists', () => {
    const result = createCourseDraft('Ullna GK', 9, ['ullna-gk', 'ullna-gk-2']);

    expect(result.ok && result.value.id).toBe('ullna-gk-3');
  });

  it('should_fall_back_to_generic_id_when_name_has_no_letters_or_digits', () => {
    const result = createCourseDraft('!!!', 9, []);

    expect(result.ok && result.value.id).toBe('bana');
  });

  it('should_return_immutable_draft', () => {
    const result = createCourseDraft('Ullna GK', 9, []);

    expect(result.ok && Object.isFrozen(result.value)).toBe(true);
    expect(result.ok && Object.isFrozen(result.value.holes)).toBe(true);
    expect(result.ok && Object.isFrozen(result.value.holes[0])).toBe(true);
  });
});
