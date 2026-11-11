import { Injectable } from '@angular/core';
import { IPlayerPositionReader } from '../application/ports';
import { GeoPoint } from '../domain/geo';

/** Hur länge bansökningen väntar på en GPS-position innan den faller tillbaka. */
const POSITION_TIMEOUT_MS = 10_000;
/** En position upp till fem minuter gammal räcker för att sortera banor. */
const MAX_POSITION_AGE_MS = 5 * 60_000;

/**
 * Adapter: IPlayerPositionReader ovanpå webbläsarens Geolocation API.
 * Nekad åtkomst, saknat API eller timeout ger `null` — aldrig ett fel.
 */
@Injectable({ providedIn: 'root' })
export class BrowserGeolocationPositionReader implements IPlayerPositionReader {
  currentPosition(): Promise<GeoPoint | null> {
    const geolocation = typeof navigator === 'undefined' ? undefined : navigator.geolocation;
    if (!geolocation) {
      return Promise.resolve(null);
    }
    return new Promise((resolve) =>
      geolocation.getCurrentPosition(
        ({ coords }) => resolve(Object.freeze({ lat: coords.latitude, lng: coords.longitude })),
        () => resolve(null),
        { timeout: POSITION_TIMEOUT_MS, maximumAge: MAX_POSITION_AGE_MS },
      ),
    );
  }
}
