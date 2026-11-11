import { Course, Hole } from './course';
import { GeoPoint, haversineMeters } from './geo';

/** Avståndet i hela meter från spelarens position till hålets greenpunkt; `null` om den saknas. */
export function distanceToGreen(position: GeoPoint, hole: Hole): number | null {
  return hole.green ? Math.round(haversineMeters(position, hole.green)) : null;
}

/** Det aktiva hålet och om navigering bakåt/framåt är möjlig (ingen wrap). */
export interface HoleNavigation {
  /** Hålets index i banan, efter klämning. */
  readonly index: number;
  readonly hole: Hole;
  readonly hasPrevious: boolean;
  readonly hasNext: boolean;
}

/** Hålnavigering i Spelläget: indexet kläms till banans hål, ändarna stänger navigeringen. */
export function holeNavigation(course: Course, index: number): HoleNavigation {
  const last = course.holes.length - 1;
  const clamped = Math.min(Math.max(index, 0), last);
  return Object.freeze({
    index: clamped,
    hole: course.holes[clamped],
    hasPrevious: clamped > 0,
    hasNext: clamped < last,
  });
}
