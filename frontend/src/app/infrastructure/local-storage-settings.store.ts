import { Injectable } from '@angular/core';
import { ISettingsStore } from '../application/ports';
import { createDataRepo, DataRepo } from '../domain/data-repo';

export const DATA_REPO_KEY = 'yardage.dataRepo';
export const TOKEN_KEY = 'yardage.token';

/**
 * Adapter: ISettingsStore ovanpå localStorage (ADR-0003).
 * Lagrat data-repo valideras om vid läsning så att manipulerade värden avvisas.
 */
@Injectable({ providedIn: 'root' })
export class LocalStorageSettingsStore implements ISettingsStore {
  loadDataRepo(): DataRepo | null {
    const parsed = safeJson(read(DATA_REPO_KEY)) as { owner?: unknown; name?: unknown } | null;
    if (typeof parsed?.owner !== 'string' || typeof parsed.name !== 'string') {
      return null;
    }
    const result = createDataRepo(parsed.owner, parsed.name);
    return result.ok ? result.value : null;
  }

  saveDataRepo(repo: DataRepo): void {
    write(DATA_REPO_KEY, JSON.stringify({ owner: repo.owner, name: repo.name }));
  }

  loadToken(): string | null {
    return read(TOKEN_KEY) || null;
  }

  saveToken(token: string): void {
    write(TOKEN_KEY, token);
  }

  clearToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // localStorage otillgängligt (t.ex. privat läge) — inget att radera.
    }
  }
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  localStorage.setItem(key, value);
}

function safeJson(raw: string | null): unknown {
  if (raw === null) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
