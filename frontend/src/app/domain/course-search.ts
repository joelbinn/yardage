import { Course, GreenPoint } from './course';

/** En geografisk position (WGS84), t.ex. spelarens GPS-position. */
export interface GeoPoint {
  readonly lat: number;
  readonly lng: number;
}

/** Banans centroid: medelvärdet av banans greenpunkter. */
export function courseCentroid(course: Course): GeoPoint {
  const greens: readonly GreenPoint[] = course.holes.map((h) => h.green);
  const sum = greens.reduce((acc, g) => ({ lat: acc.lat + g.lat, lng: acc.lng + g.lng }), { lat: 0, lng: 0 });
  return Object.freeze({ lat: sum.lat / greens.length, lng: sum.lng / greens.length });
}

const EARTH_RADIUS_METERS = 6_371_000;
const toRadians = (deg: number): number => (deg * Math.PI) / 180;

/** Storcirkelavstånd i meter mellan två punkter (haversine). */
export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

const swedishCollator = new Intl.Collator('sv', { sensitivity: 'base' });

const matchesQuery =
  (query: string) =>
  (course: Course): boolean =>
    course.name.toLocaleLowerCase('sv').includes(query.trim().toLocaleLowerCase('sv'));

const sortAlphabetically = (courses: readonly Course[]): readonly Course[] =>
  [...courses].sort((a, b) => swedishCollator.compare(a.name, b.name));

const sortNearestFirst = (courses: readonly Course[], position: GeoPoint): readonly Course[] =>
  courses
    .map((course) => ({ course, distance: haversineMeters(position, courseCentroid(course)) }))
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
