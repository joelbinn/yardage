import { Course, Hole } from './course';
import { GeoPoint, haversineMeters } from './geo';

/** Avståndet i hela meter från spelarens position till hålets greenpunkt. */
export function distanceToGreen(position: GeoPoint, hole: Hole): number {
  return Math.round(haversineMeters(position, hole.green));
}

/** Det aktiva hålet och om navigering bakåt/framåt är möjlig (ingen wrap). */
export interface HoleNavigation {
  readonly hole: Hole;
  readonly hasPrevious: boolean;
  readonly hasNext: boolean;
}

/** Hålnavigering i Spelläget: indexet kläms till banans hål, ändarna stänger navigeringen. */
export function holeNavigation(course: Course, index: number): HoleNavigation {
  const last = course.holes.length - 1;
  const clamped = Math.min(Math.max(index, 0), last);
  return Object.freeze({ hole: course.holes[clamped], hasPrevious: clamped > 0, hasNext: clamped < last });
}
