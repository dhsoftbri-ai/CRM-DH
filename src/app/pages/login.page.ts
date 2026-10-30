import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { isDemoMode } from '../app.settings';
import { ZohoAuth } from '../core/zoho-auth.service';

@Component({
  selector: 'app-login-page',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <section class="card">
      <img src="logo.png" alt="DH Softbri" class="logo" />
      <h1>DH CRM</h1>
      <p>Tus clientes, estatus, notas, tareas y reuniones, sincronizados con Zoho CRM.</p>
      <button mat-flat-button (click)="connect()">
        <mat-icon>login</mat-icon> Conectar con Zoho
      </button>
      <small>Se abrirá la página de Zoho para que autorices el acceso.</small>
    </section>
  `,
  styles: `
    :host { min-height: 100dvh; display: grid; place-items: center; padding: 24px; background: var(--mat-sys-surface-container); }
    .card { max-width: 420px; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center;
      padding: 40px 32px; border-radius: var(--mat-sys-corner-extra-large); background: var(--mat-sys-surface); }
    .logo { width: 200px; }
    h1 { margin: 0; font: var(--mat-sys-headline-medium); }
    p { margin: 0; color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-large); }
    small { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-small); }
  `,
})
export class LoginPage {
  private readonly auth = inject(ZohoAuth);
  private readonly router = inject(Router);

  constructor() {
    if (isDemoMode() || this.auth.isLoggedIn()) this.router.navigate(['/']);
  }

  connect(): void {
    this.auth.login('/');
  }
}
