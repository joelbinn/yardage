import { Course } from './course';
import { distanceToGreen, holeNavigation } from './hole-play';

const course: Course = {
  id: 'c',
  name: 'C',
  holes: Array.from({ length: 9 }, (_, i) => ({ number: i + 1, green: { lat: 59 + i / 1000, lng: 18 } })),
};

describe('distanceToGreen', () => {
  it('should_return_whole_meters_when_player_is_south_of_green', () => {
    // 0,001° breddgrad ≈ 111,2 m → avrundas till 111.
    const hole = course.holes[0];
    expect(distanceToGreen({ lat: 58.999, lng: 18 }, hole)).toBe(111);
  });

  it('should_return_zero_when_player_stands_on_green_point', () => {
    expect(distanceToGreen({ lat: 59, lng: 18 }, course.holes[0])).toBe(0);
  });
});

describe('holeNavigation', () => {
  it('should_disable_previous_when_on_first_hole', () => {
    expect(holeNavigation(course, 0)).toEqual({ index: 0, hole: course.holes[0], hasPrevious: false, hasNext: true });
  });

  it('should_disable_next_when_on_last_hole', () => {
    expect(holeNavigation(course, 8)).toEqual({ index: 8, hole: course.holes[8], hasPrevious: true, hasNext: false });
  });

  it('should_clamp_index_when_outside_course', () => {
    expect(holeNavigation(course, 42)).toMatchObject({ index: 8, hole: { number: 9 } });
    expect(holeNavigation(course, -1)).toMatchObject({ index: 0, hole: { number: 1 } });
  });
});
