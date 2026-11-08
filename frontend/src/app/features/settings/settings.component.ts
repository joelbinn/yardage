import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SettingsService } from '../../application/settings.service';
import { DEFAULT_DATA_REPO_NAME } from '../../domain/data-repo';

/** Inställningssidan: data-repo (owner + namn) och GitHub-token (ADR-0003). */
@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  private readonly settings = inject(SettingsService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly hasToken = this.settings.hasToken;
  readonly repoMessage = signal<{ text: string; error: boolean } | null>(null);
  readonly tokenMessage = signal<{ text: string; error: boolean } | null>(null);

  readonly repoForm = this.fb.group({
    owner: this.settings.dataRepo()?.owner ?? '',
    name: this.settings.dataRepo()?.name ?? DEFAULT_DATA_REPO_NAME,
  });

  readonly tokenForm = this.fb.group({ token: '' });

  saveRepo(): void {
    const { owner, name } = this.repoForm.getRawValue();
    const result = this.settings.saveDataRepo(owner, name);
    if (result.ok) {
      this.repoForm.setValue({ owner: result.value.owner, name: result.value.name });
    }
    this.repoMessage.set(result.ok ? { text: 'Data-repot är sparat.', error: false } : { text: result.error, error: true });
  }

  saveToken(): void {
    const result = this.settings.saveToken(this.tokenForm.getRawValue().token);
    if (result.ok) {
      // Tokenen visas aldrig igen efter att den sparats.
      this.tokenForm.reset();
    }
    this.tokenMessage.set(result.ok ? { text: 'Token är sparad.', error: false } : { text: result.error, error: true });
  }

  clearToken(): void {
    this.settings.clearToken();
    this.tokenMessage.set({ text: 'Token är raderad från den här webbläsaren.', error: false });
  }
}
