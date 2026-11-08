import { createDataRepo, DEFAULT_DATA_REPO_NAME, rawCoursesUrl } from './data-repo';

describe('createDataRepo', () => {
  it('should_create_data_repo_when_owner_and_name_are_valid', () => {
    expect(createDataRepo(' joel ', ' yardage-data ')).toEqual({
      ok: true,
      value: { owner: 'joel', name: 'yardage-data' },
    });
  });

  it('should_use_default_name_when_name_is_blank', () => {
    const result = createDataRepo('joel', '   ');

    expect(result.ok && result.value.name).toBe(DEFAULT_DATA_REPO_NAME);
    expect(DEFAULT_DATA_REPO_NAME).toBe('yardage-data');
  });

  it.each(['', '-joel', 'jo el', 'joel/x', 'a'.repeat(40)])(
    'should_reject_invalid_owner %j',
    (owner) => {
      const result = createDataRepo(owner, 'yardage-data');

      expect(result.ok).toBe(false);
      expect(!result.ok && result.field).toBe('owner');
    },
  );

  it.each(['my repo', 'x/y', '..', 'a'.repeat(101)])('should_reject_invalid_name %j', (name) => {
    const result = createDataRepo('joel', name);

    expect(result.ok).toBe(false);
    expect(!result.ok && result.field).toBe('name');
  });

  it('should_return_frozen_value', () => {
    const result = createDataRepo('joel', 'yardage-data');

    expect(result.ok && Object.isFrozen(result.value)).toBe(true);
  });
});

describe('rawCoursesUrl', () => {
  it('should_point_to_courses_json_on_main_branch', () => {
    expect(rawCoursesUrl({ owner: 'joel', name: 'yardage-data' })).toBe(
      'https://raw.githubusercontent.com/joel/yardage-data/main/courses.json',
    );
  });
});
