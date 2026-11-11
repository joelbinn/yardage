import { haversineMeters } from './geo';

describe('haversineMeters', () => {
  it('should_return_zero_when_points_are_identical', () => {
    const p = { lat: 59.3293, lng: 18.0686 };
    expect(haversineMeters(p, p)).toBe(0);
  });

  it('should_return_about_111_km_when_points_differ_one_degree_latitude', () => {
    // En breddgrad ≈ 111 195 m med jordradien 6 371 km.
    expect(haversineMeters({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(111_195, 0);
  });

  it('should_return_known_distance_when_measuring_stockholm_to_uppsala', () => {
    // Stockholm (59.3293, 18.0686) → Uppsala (59.8586, 17.6389): ≈ 64 km.
    const d = haversineMeters({ lat: 59.3293, lng: 18.0686 }, { lat: 59.8586, lng: 17.6389 });
    expect(d).toBeGreaterThan(63_500);
    expect(d).toBeLessThan(64_500);
  });

  it('should_be_symmetric_when_swapping_points', () => {
    const a = { lat: 57.7089, lng: 11.9746 };
    const b = { lat: 59.48, lng: 18.16 };
    expect(haversineMeters(a, b)).toBeCloseTo(haversineMeters(b, a), 6);
  });
});
