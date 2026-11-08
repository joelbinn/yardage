import { parseCoursesDocument } from './courses-document';

const hole = (number: number, extra: Record<string, unknown> = {}) => ({
  number,
  green: { lat: (59300 + number) / 1000, lng: (18000 + number) / 1000 },
  ...extra,
});

const holes = (count: number) => Array.from({ length: count }, (_, i) => hole(i + 1));

const course = (overrides: Record<string, unknown> = {}) => ({
  id: 'ullna',
  name: 'Ullna GK',
  holes: holes(18),
  ...overrides,
});

const document = (courses: unknown[]) => ({ version: 1, courses });

const expectInvalid = (input: unknown, fragment: string) => {
  const result = parseCoursesDocument(input);
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error).toContain(fragment);
  }
};

describe('parseCoursesDocument', () => {
  it('should_return_courses_when_document_is_valid', () => {
    const result = parseCoursesDocument(
      document([course(), course({ id: 'nine', name: 'Niohålsbanan', holes: holes(9) })]),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.courses.map((c) => c.name)).toEqual(['Ullna GK', 'Niohålsbanan']);
      expect(result.courses[1].holes).toHaveLength(9);
      expect(result.courses[0].holes[0].green).toEqual({ lat: 59.301, lng: 18.001 });
    }
  });

  it('should_accept_empty_course_list', () => {
    expect(parseCoursesDocument(document([]))).toEqual({ ok: true, courses: [] });
  });

  it('should_keep_optional_par_when_present', () => {
    const withPar = course({ holes: holes(9).map((h) => ({ ...h, par: 4 })) });
    const result = parseCoursesDocument(document([withPar]));

    expect(result.ok && result.courses[0].holes[0].par).toBe(4);
  });

  it('should_drop_unknown_fields', () => {
    const result = parseCoursesDocument(document([course({ secret: 'x' })]));

    expect(result.ok && Object.keys(result.courses[0])).toEqual(['id', 'name', 'holes']);
  });

  it('should_return_immutable_courses', () => {
    const result = parseCoursesDocument(document([course()]));

    expect(result.ok && Object.isFrozen(result.courses)).toBe(true);
    expect(result.ok && Object.isFrozen(result.courses[0].holes[0].green)).toBe(true);
  });

  it.each([
    [null, 'objekt'],
    ['text', 'objekt'],
    [[], 'objekt'],
  ])('should_reject_non_object_document (%j)', (input, fragment) => {
    expectInvalid(input, fragment);
  });

  it('should_reject_unsupported_version', () => {
    expectInvalid({ version: 2, courses: [] }, 'version');
  });

  it('should_reject_missing_courses_array', () => {
    expectInvalid({ version: 1 }, 'courses');
  });

  it('should_reject_course_without_name', () => {
    expectInvalid(document([course({ name: '  ' })]), 'courses[0].name');
  });

  it('should_reject_course_without_id', () => {
    expectInvalid(document([course({ id: 7 })]), 'courses[0].id');
  });

  it('should_reject_duplicate_course_ids', () => {
    expectInvalid(document([course(), course()]), 'courses[1].id');
  });

  it.each([0, 10, 17, 19])('should_reject_hole_count_%i', (count) => {
    expectInvalid(document([course({ holes: holes(count) })]), 'courses[0].holes');
  });

  it('should_reject_holes_out_of_order', () => {
    const swapped = holes(9);
    [swapped[0], swapped[1]] = [swapped[1], swapped[0]];

    expectInvalid(document([course({ holes: swapped })]), 'courses[0].holes[0].number');
  });

  it('should_reject_hole_without_green', () => {
    const broken = holes(9).map((h, i) => (i === 2 ? { number: 3 } : h));

    expectInvalid(document([course({ holes: broken })]), 'courses[0].holes[2].green');
  });

  it.each([
    [{ lat: 91, lng: 18 }, 'green.lat'],
    [{ lat: 59, lng: -181 }, 'green.lng'],
    [{ lat: '59', lng: 18 }, 'green.lat'],
    [{ lat: 59, lng: Number.NaN }, 'green.lng'],
  ])('should_reject_invalid_green_point %j', (green, fragment) => {
    const broken = holes(9).map((h, i) => (i === 0 ? { ...h, green } : h));

    expectInvalid(document([course({ holes: broken })]), `courses[0].holes[0].${fragment}`);
  });

  it.each([0, 2.5, '4'])('should_reject_invalid_par %j', (par) => {
    const broken = holes(9).map((h, i) => (i === 0 ? { ...h, par } : h));

    expectInvalid(document([course({ holes: broken })]), 'courses[0].holes[0].par');
  });
});
