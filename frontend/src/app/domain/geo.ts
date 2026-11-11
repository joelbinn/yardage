/** En geografisk position (WGS84), t.ex. spelarens GPS-position. */
export interface GeoPoint {
  readonly lat: number;
  readonly lng: number;
}

/** En GPS-avläsning: spelarens position och dess noggrannhet (radie i meter). */
export interface PositionFix {
  readonly position: GeoPoint;
  readonly accuracyMeters: number;
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
