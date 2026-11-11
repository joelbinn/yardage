import { Course, GreenPoint } from './course';
import { GeoPoint, haversineMeters } from './geo';

/** Banans centroid: medelvärdet av banans registrerade greenpunkter; `null` om inga finns. */
export function courseCentroid(course: Course): GeoPoint | null {
  const greens = course.holes.map((h) => h.green).filter((g): g is GreenPoint => g !== null);
  if (greens.length === 0) {
    return null;
  }
  const sum = greens.reduce((acc, g) => ({ lat: acc.lat + g.lat, lng: acc.lng + g.lng }), { lat: 0, lng: 0 });
  return Object.freeze({ lat: sum.lat / greens.length, lng: sum.lng / greens.length });
}

const swedishCollator = new Intl.Collator('sv', { sensitivity: 'base' });

const matchesQuery =
  (query: string) =>
  (course: Course): boolean =>
    course.name.toLocaleLowerCase('sv').includes(query.trim().toLocaleLowerCase('sv'));

const sortAlphabetically = (courses: readonly Course[]): readonly Course[] =>
  [...courses].sort((a, b) => swedishCollator.compare(a.name, b.name));

// Banor utan greenpunkter har ingen position och hamnar sist.
const distanceToCourse = (position: GeoPoint, course: Course): number => {
  const centroid = courseCentroid(course);
  return centroid ? haversineMeters(position, centroid) : Number.POSITIVE_INFINITY;
};

const sortNearestFirst = (courses: readonly Course[], position: GeoPoint): readonly Course[] =>
  courses
    .map((course) => ({ course, distance: distanceToCourse(position, course) }))
    .sort((a, b) => a.distance - b.distance)
    .map((x) => x.course);

/**
 * Bansökning i Spelläget: behåller banor vars namn innehåller söktexten och
 * sorterar närmast-först efter avståndet från spelarens position till banans
 * centroid. Utan känd position (platsåtkomst nekad/saknas) sorteras banorna
 * alfabetiskt enligt svensk ordning.
 */
export function searchCourses(
  courses: readonly Course[],
  query: string,
  position: GeoPoint | null,
): readonly Course[] {
  const matching = courses.filter(matchesQuery(query));
  return position ? sortNearestFirst(matching, position) : sortAlphabetically(matching);
}
