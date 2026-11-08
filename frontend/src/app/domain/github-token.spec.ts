import { createGitHubToken } from './github-token';

describe('createGitHubToken', () => {
  it('should_trim_and_accept_token', () => {
    expect(createGitHubToken('  github_pat_abc123  ')).toEqual({
      ok: true,
      value: 'github_pat_abc123',
    });
  });

  it.each(['', '   ', 'github_pat abc'])('should_reject_invalid_token %j', (raw) => {
    expect(createGitHubToken(raw).ok).toBe(false);
  });
});
