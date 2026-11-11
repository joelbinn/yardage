import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IPlayerPositionWatcher } from '../application/ports';
import { PositionFix } from '../domain/geo';

const toFix = ({ coords }: GeolocationPosition): PositionFix =>
  Object.freeze({
    position: Object.freeze({ lat: coords.latitude, lng: coords.longitude }),
    accuracyMeters: coords.accuracy,
  });

/**
 * Adapter: IPlayerPositionWatcher ovanpå `navigator.geolocation.watchPosition`.
 * Hög noggrannhet och inga cachade positioner — Avståndet ska följa spelaren.
 * Nekad åtkomst eller saknat API ger `null`; tillfälliga fel (timeout, ingen
 * signal) ignoreras så att senaste kända Avstånd står kvar.
 */
@Injectable({ providedIn: 'root' })
export class BrowserGeolocationPositionWatcher implements IPlayerPositionWatcher {
  watch(): Observable<PositionFix | null> {
    return new Observable((subscriber) => {
      const geolocation = typeof navigator === 'undefined' ? undefined : navigator.geolocation;
      if (!geolocation) {
        subscriber.next(null);
        return undefined;
      }
      const id = geolocation.watchPosition(
        (position) => subscriber.next(toFix(position)),
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            subscriber.next(null);
          }
        },
        { enableHighAccuracy: true, maximumAge: 0 },
      );
      return () => geolocation.clearWatch(id);
    });
  }
}
