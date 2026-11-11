import { Injectable } from '@angular/core';
import type * as Leaflet from 'leaflet';
import {
  CourseMapEvents,
  GreenPointMarker,
  ICourseMap,
  ICourseMapFactory,
} from '../application/ports';
import { GreenPoint } from '../domain/course';

/**
 * Esri World Imagery — nyckellös satellitbild. Tile-origin `https://server.arcgisonline.com`
 * måste tillåtas i CSP:ns `img-src` (ticket 07).
 */
export const ESRI_WORLD_IMAGERY_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ESRI_ATTRIBUTION =
  'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, ' +
  'Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
const MAX_ZOOM = 19;
const FIT_MAX_ZOOM = 17;
/** Startvy när banan saknar greenpunkter: Sverige. */
const DEFAULT_CENTER: Leaflet.LatLngTuple = [62, 15];
const DEFAULT_ZOOM = 5;

type LeafletModule = typeof Leaflet;

/** Leaflet laddas först när en karta skapas, så att den inte belastar initial bundle. */
const loadLeaflet = (): Promise<LeafletModule> => import('leaflet');

const toGreenPoint = (latLng: Leaflet.LatLng): GreenPoint => ({ lat: latLng.lat, lng: latLng.lng });
const markerLabel = (holeNumber: number): string => `Greenpunkt för hål ${holeNumber}`;

const ACTIVE_CLASS = 'green-point-marker--active';

/** Numrerad markör som divIcon — inga bildfiler, så inget extra `img-src` behövs. */
function greenPointIcon(L: LeafletModule, holeNumber: number): Leaflet.DivIcon {
  return L.divIcon({
    className: 'green-point-marker',
    html: `<span aria-hidden="true">${holeNumber}</span>`,
    iconSize: [28, 28],
  });
}

/** Adapter: översätter karteditorns port till Leaflet. */
class LeafletCourseMap implements ICourseMap {
  private readonly layer: Leaflet.LayerGroup;
  /** Markörer per hålnummer; uppdateras på plats så att DOM-element och fokus består. */
  private readonly markers = new Map<number, Leaflet.Marker>();

  constructor(
    private readonly L: LeafletModule,
    private readonly map: Leaflet.Map,
    private readonly events: CourseMapEvents,
  ) {
    this.layer = L.layerGroup().addTo(map);
    map.on('click', (e: Leaflet.LeafletMouseEvent) => events.mapClicked(toGreenPoint(e.latlng)));
  }

  showMarkers(markers: readonly GreenPointMarker[]): void {
    const wanted = new Set(markers.map((m) => m.holeNumber));
    [...this.markers.keys()]
      .filter((holeNumber) => !wanted.has(holeNumber))
      .forEach((holeNumber) => this.removeMarker(holeNumber));
    markers.forEach((m) =>
      this.updateMarker(this.markers.get(m.holeNumber) ?? this.addMarker(m), m),
    );
  }

  fitTo(points: readonly GreenPoint[]): void {
    if (points.length === 0) {
      return;
    }
    const bounds = this.L.latLngBounds(points.map((p): Leaflet.LatLngTuple => [p.lat, p.lng]));
    this.map.fitBounds(bounds, { padding: [32, 32], maxZoom: FIT_MAX_ZOOM });
  }

  destroy(): void {
    this.map.remove();
  }

  private addMarker(m: GreenPointMarker): Leaflet.Marker {
    const label = markerLabel(m.holeNumber);
    const marker = this.L.marker([m.green.lat, m.green.lng], {
      draggable: true,
      title: label,
      icon: greenPointIcon(this.L, m.holeNumber),
    });
    marker.on('dragend', () =>
      this.events.markerMoved(m.holeNumber, toGreenPoint(marker.getLatLng())),
    );
    this.layer.addLayer(marker);
    marker.getElement()?.setAttribute('aria-label', label);
    this.markers.set(m.holeNumber, marker);
    return marker;
  }

  private updateMarker(marker: Leaflet.Marker, m: GreenPointMarker): void {
    const current = marker.getLatLng();
    if (current.lat !== m.green.lat || current.lng !== m.green.lng) {
      marker.setLatLng([m.green.lat, m.green.lng]);
    }
    marker.getElement()?.classList.toggle(ACTIVE_CLASS, m.active);
    marker.setZIndexOffset(m.active ? 1000 : 0);
  }

  private removeMarker(holeNumber: number): void {
    const marker = this.markers.get(holeNumber);
    if (marker) {
      this.layer.removeLayer(marker);
    }
    this.markers.delete(holeNumber);
  }
}

/** Abstract Factory-implementation: skapar Leaflet-kartor med Esri-satellitbild. */
@Injectable({ providedIn: 'root' })
export class LeafletCourseMapFactory implements ICourseMapFactory {
  async create(host: HTMLElement, events: CourseMapEvents): Promise<ICourseMap> {
    const L = await loadLeaflet();
    const map = L.map(host, { maxZoom: MAX_ZOOM }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    L.tileLayer(ESRI_WORLD_IMAGERY_URL, {
      maxZoom: MAX_ZOOM,
      attribution: ESRI_ATTRIBUTION,
    }).addTo(map);
    return new LeafletCourseMap(L, map, events);
  }
}
