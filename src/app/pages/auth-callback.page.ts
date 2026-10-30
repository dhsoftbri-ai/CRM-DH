import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { ZohoAuth } from '../core/zoho-auth.service';

@Component({
  selector: 'app-auth-callback',
  imports: [MatProgressSpinnerModule, MatButtonModule, RouterLink],
  template: `
    @if (error()) {
      <p class="err">{{ error() }}</p>
      <a mat-flat-button routerLink="/login">Volver a intentar</a>
    } @else {
      <mat-spinner diameter="40" />
      <p>Conectando con Zoho…</p>
    }
  `,
  styles: `
    :host { min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }
    .err { color: var(--mat-sys-error); max-width: 420px; text-align: center; }
  `,
})
export class AuthCallbackPage {
  protected readonly error = signal<string | null>(null);

  constructor() {
    const auth = inject(ZohoAuth);
    const router = inject(Router);
    try {
      const returnTo = auth.handleCallback();
      router.navigateByUrl(returnTo, { replaceUrl: true });
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo conectar con Zoho.');
    }
  }
}
