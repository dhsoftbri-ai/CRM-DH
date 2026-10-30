import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, firstValueFrom, map } from 'rxjs';
import { isDemoMode } from '../app.settings';
import { CrmBackend } from '../core/crm-backend';
import { CrmStore } from '../core/crm-store';
import { DemoBackend } from '../core/demo-backend';
import { ZohoAuth } from '../core/zoho-auth.service';
import { NewClientDialog } from '../dialogs/new-client.dialog';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly auth = inject(ZohoAuth);
  private readonly backend = inject(CrmBackend);
  protected readonly store = inject(CrmStore);
  protected readonly demo = isDemoMode();

  protected readonly compact = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 839.98px)')
      .pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  /** En la ficha de un cliente el FAB móvil estorba con la caja de notas. */
  protected readonly showMobileFab = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => !/^\/clientes\/.+/.test(this.router.url)),
    ),
    { initialValue: !/^\/clientes\/.+/.test(this.router.url) },
  );

  protected readonly nav = [
    { path: '/pipeline', icon: 'view_kanban', label: 'Pipeline' },
    { path: '/clientes', icon: 'group', label: 'Clientes' },
    { path: '/agenda', icon: 'event_note', label: 'Agenda' },
  ];

  constructor() {
    this.store.ensureLoaded();
  }

  async newClient(): Promise<void> {
    await this.store.ensureLoaded();
    const ref = this.dialog.open(NewClientDialog, {
      width: '560px',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
    });
    const created = await firstValueFrom(ref.afterClosed());
    if (created) this.router.navigate(['/clientes', created.id]);
  }

  resetDemo(): void {
    if (this.backend instanceof DemoBackend) {
      this.backend.reset();
      this.store.refresh();
      this.router.navigate(['/pipeline']);
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
