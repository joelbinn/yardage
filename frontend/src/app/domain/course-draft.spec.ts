import { createCourseDraft, placeGreenPoint, renameCourse, setHolePar } from './course-draft';

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

const nineHoles = () => {
  const result = createCourseDraft('Kortbanan', 9, []);
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

describe('placeGreenPoint', () => {
  it('should_set_green_point_of_given_hole_only_when_hole_exists', () => {
    const draft = nineHoles();

    const updated = placeGreenPoint(draft, 3, { lat: 59.4, lng: 18.1 });

    expect(updated.holes[2].green).toEqual({ lat: 59.4, lng: 18.1 });
    expect(updated.holes.filter((h) => h.green !== null)).toHaveLength(1);
    expect(draft.holes[2].green).toBeNull();
    expect(Object.isFrozen(updated)).toBe(true);
    expect(Object.isFrozen(updated.holes[2])).toBe(true);
  });

  it('should_keep_par_when_green_point_is_moved', () => {
    const withPar = setHolePar(nineHoles(), 1, 4);
    if (!withPar.ok) throw new Error(withPar.error);

    const updated = placeGreenPoint(withPar.value, 1, { lat: 1, lng: 2 });

    expect(updated.holes[0]).toEqual({ number: 1, green: { lat: 1, lng: 2 }, par: 4 });
  });

  it('should_return_same_draft_when_hole_does_not_exist', () => {
    const draft = nineHoles();

    expect(placeGreenPoint(draft, 10, { lat: 1, lng: 2 })).toBe(draft);
  });
});

describe('setHolePar', () => {
  it('should_set_par_of_given_hole_when_par_is_positive_integer', () => {
    const result = setHolePar(nineHoles(), 2, 5);

    expect(result.ok && result.value.holes[1]).toEqual({ number: 2, green: null, par: 5 });
  });

  it('should_clear_par_when_par_is_null', () => {
    const withPar = setHolePar(nineHoles(), 2, 5);
    if (!withPar.ok) throw new Error(withPar.error);

    const result = setHolePar(withPar.value, 2, null);

    expect(result.ok && result.value.holes[1]).toEqual({ number: 2, green: null });
  });

  it.each([0, -3, 3.5, Number.NaN])('should_reject_par_%s', (par) => {
    expect(setHolePar(nineHoles(), 2, par)).toEqual({
      ok: false,
      error: 'Par måste vara ett positivt heltal.',
    });
  });
});

describe('renameCourse', () => {
  it('should_change_name_and_keep_id_and_holes_when_name_is_valid', () => {
    const draft = nineHoles();

    const result = renameCourse(draft, '  Kortbanan Gul ');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe('Kortbanan Gul');
      expect(result.value.id).toBe(draft.id);
      expect(result.value.holes).toBe(draft.holes);
      expect(Object.isFrozen(result.value)).toBe(true);
    }
    expect(draft.name).toBe('Kortbanan');
  });

  it.each(['', '   '])('should_reject_empty_name %j', (name) => {
    expect(renameCourse(nineHoles(), name)).toEqual({ ok: false, error: 'Ange ett namn på banan.' });
  });
});
