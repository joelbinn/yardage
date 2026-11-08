/**
 * GitHub-token (fine-grained PAT) som redigeringsläget använder för att skriva till
 * data-repot (ADR-0003). Appen kan inte verifiera scope — endast formen kontrolleras.
 */
export type GitHubTokenResult =
  | { readonly ok: true; readonly value: string }
  | { readonly ok: false; readonly error: string };

export function createGitHubToken(raw: string): GitHubTokenResult {
  const token = raw.trim();
  if (token === '') {
    return { ok: false, error: 'Ange en token.' };
  }
  if (/\s/.test(token)) {
    return { ok: false, error: 'En token får inte innehålla mellanslag.' };
  }
  return { ok: true, value: token };
}
