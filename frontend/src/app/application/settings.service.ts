import { computed, inject, Injectable, signal } from '@angular/core';
import { createDataRepo, DataRepo, DataRepoResult } from '../domain/data-repo';
import { createGitHubToken, GitHubTokenResult } from '../domain/github-token';
import { SETTINGS_STORE } from './ports';

/**
 * Application Service för inställningar: validerar via domänen, persisterar via
 * ISettingsStore och exponerar aktuellt tillstånd som signals.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly store = inject(SETTINGS_STORE);
  private readonly repoState = signal<DataRepo | null>(this.store.loadDataRepo());
  private readonly tokenState = signal<string | null>(this.store.loadToken());

  readonly dataRepo = this.repoState.asReadonly();
  readonly hasToken = computed(() => this.tokenState() !== null);

  /** Tokenen för skrivning till data-repot; används endast av Redigeringslägets sparning. */
  token(): string | null {
    return this.tokenState();
  }

  saveDataRepo(owner: string, name: string): DataRepoResult {
    const result = createDataRepo(owner, name);
    if (result.ok) {
      this.store.saveDataRepo(result.value);
      this.repoState.set(result.value);
    }
    return result;
  }

  saveToken(raw: string): GitHubTokenResult {
    const result = createGitHubToken(raw);
    if (result.ok) {
      this.store.saveToken(result.value);
      this.tokenState.set(result.value);
    }
    return result;
  }

  clearToken(): void {
    this.store.clearToken();
    this.tokenState.set(null);
  }
}
