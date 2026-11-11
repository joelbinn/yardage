import { GeoPoint } from '../domain/geo';

/** Webbläsarens Geolocation API, eller `undefined` där det saknas (t.ex. utan `navigator`). */
export function browserGeolocation(): Geolocation | undefined {
  return typeof navigator === 'undefined' ? undefined : navigator.geolocation;
}

/** Översätter Geolocation API:ts koordinater till domänens GeoPoint. */
export function toGeoPoint(coords: GeolocationCoordinates): GeoPoint {
  return Object.freeze({ lat: coords.latitude, lng: coords.longitude });
}
