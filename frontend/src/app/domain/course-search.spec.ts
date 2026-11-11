import { Course } from './course';
import { courseCentroid, searchCourses } from './course-search';

const course = (id: string, name: string, greens: readonly [number, number][]): Course => ({
  id,
  name,
  holes: greens.map(([lat, lng], i) => ({ number: i + 1, green: { lat, lng } })),
});

describe('courseCentroid', () => {
  it('should_return_mean_of_green_points_when_course_has_holes', () => {
    const c = course('a', 'A', [
      [59.0, 18.0],
      [59.2, 18.4],
      [59.4, 18.2],
    ]);

    const centroid = courseCentroid(c);

    expect(centroid.lat).toBeCloseTo(59.2, 10);
    expect(centroid.lng).toBeCloseTo(18.2, 10);
  });
});

describe('searchCourses', () => {
  // Verkliga orter: spelaren står i centrala Stockholm.
  const stockholm = { lat: 59.3293, lng: 18.0686 };
  const goteborg = course('gbg', 'Albatross GK', [[57.7089, 11.9746]]);
  const uppsala = course('upp', 'Bergs GK', [[59.8586, 17.6389]]);
  const ullna = course('ullna', 'Ullna GK', [
    [59.47, 18.15],
    [59.49, 18.17],
  ]);
  const courses = [goteborg, uppsala, ullna];

  it('should_sort_nearest_first_when_position_is_known', () => {
    const result = searchCourses(courses, '', stockholm);

    expect(result.map((c) => c.id)).toEqual(['ullna', 'upp', 'gbg']);
  });

  it('should_sort_alphabetically_when_position_is_unknown', () => {
    const result = searchCourses(courses, '', null);

    expect(result.map((c) => c.name)).toEqual(['Albatross GK', 'Bergs GK', 'Ullna GK']);
  });

  it('should_sort_by_swedish_alphabet_when_position_is_unknown', () => {
    const names = ['Österåker', 'Årsta', 'Ängsö', 'Zenith'];
    const result = searchCourses(
      names.map((n) => course(n, n, [[59, 18]])),
      '',
      null,
    );

    expect(result.map((c) => c.name)).toEqual(['Zenith', 'Årsta', 'Ängsö', 'Österåker']);
  });

  it('should_keep_only_courses_whose_name_contains_query_ignoring_case_and_whitespace', () => {
    expect(searchCourses(courses, '  gK  ', null)).toHaveLength(3);
    expect(searchCourses(courses, ' uLLn ', stockholm).map((c) => c.id)).toEqual(['ullna']);
    expect(searchCourses(courses, 'finns inte', stockholm)).toEqual([]);
  });

  it('should_not_mutate_input_when_sorting', () => {
    const input = [...courses];

    searchCourses(input, '', stockholm);

    expect(input).toEqual(courses);
  });
});
