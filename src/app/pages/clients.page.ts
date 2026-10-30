import { Component, computed, inject, signal } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { CrmStore } from '../core/crm-store';
import { initials, statusColor } from '../shared/ui';

@Component({
  selector: 'app-clients-page',
  imports: [RouterLink, MatFormFieldModule, MatInputModule, MatIconModule, MatChipsModule, MatButtonModule],
  template: `
    <div class="head">
      <h1>Clientes</h1>
      <mat-form-field class="search" subscriptSizing="dynamic">
        <mat-icon matPrefix>search</mat-icon>
        <input matInput placeholder="Buscar por nombre, empresa, correo o teléfono" [value]="query()" (input)="query.set($any($event.target).value)" />
        @if (query()) {
          <button matSuffix mat-icon-button aria-label="Limpiar" (click)="query.set('')"><mat-icon>close</mat-icon></button>
        }
      </mat-form-field>
    </div>

    <mat-chip-listbox class="filters" aria-label="Filtrar por estatus" [value]="status()" (change)="status.set($event.value ?? null)">
      @for (s of store.statuses(); track s) {
        <mat-chip-option [value]="s">{{ s }}</mat-chip-option>
      }
    </mat-chip-listbox>

    <p class="count">{{ filtered().length }} de {{ store.clients().length }}</p>

    <ul class="list">
      @for (c of filtered(); track c.id) {
        <li>
          <a [routerLink]="['/clientes', c.id]" class="row">
            <span class="avatar" [style.background]="color(c.status)">{{ initials(c.fullName) }}</span>
            <span class="main">
              <strong>{{ c.fullName }}</strong>
              <span>{{ c.company }}</span>
            </span>
            <span class="contact">
              @if (c.phone) { <span><mat-icon>call</mat-icon>{{ c.phone }}</span> }
              @if (c.email) { <span><mat-icon>mail</mat-icon>{{ c.email }}</span> }
            </span>
            <span class="status"><span class="dot" [style.background]="color(c.status)"></span>{{ c.status || 'Sin estatus' }}</span>
            <mat-icon class="chev">chevron_right</mat-icon>
          </a>
        </li>
      } @empty {
        <li class="empty">
          @if (store.loaded()) { No hay clientes que coincidan. } @else { Cargando… }
        </li>
      }
    </ul>
  `,
  styleUrl: './clients.page.scss',
})
export class ClientsPage {
  protected readonly store = inject(CrmStore);
  protected readonly initials = initials;
  protected readonly query = signal('');
  protected readonly status = signal<string | null>(null);

  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const st = this.status();
    return this.store.clients().filter(
      (c) =>
        (!st || c.status === st) &&
        (!q || [c.fullName, c.company, c.email, c.phone].some((v) => v.toLowerCase().includes(q))),
    );
  });

  protected color(s: string): string {
    return statusColor(s, this.store.statuses());
  }
}
