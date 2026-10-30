import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { CrmBackend } from '../core/crm-backend';
import { CrmStore } from '../core/crm-store';
import { CrmTask, Meeting } from '../core/models';
import { dayDiff, parseDateOnly } from '../shared/ui';

interface Group {
  key: string;
  label: string;
  tone: string;
  tasks: CrmTask[];
}

@Component({
  selector: 'app-agenda-page',
  imports: [DatePipe, RouterLink, MatIconModule, MatCheckboxModule],
  template: `
    <div class="head"><h1>Agenda</h1></div>
    <div class="cols">
      <section>
        <h2><mat-icon>task_alt</mat-icon> Tareas pendientes</h2>
        @for (g of groups(); track g.key) {
          @if (g.tasks.length) {
            <h3 [class]="g.tone">{{ g.label }} · {{ g.tasks.length }}</h3>
            <ul class="items">
              @for (t of g.tasks; track t.id) {
                <li>
                  <mat-checkbox (change)="complete(t)" [attr.aria-label]="'Completar ' + t.subject" />
                  <div class="body">
                    <strong>{{ t.subject }}</strong>
                    <span class="meta">
                      @if (t.dueDate) { <span>{{ parse(t.dueDate) | date: 'EEE d MMM' }}</span> }
                      @if (t.clientId) {
                        <a [routerLink]="['/clientes', t.clientId]"><mat-icon>person</mat-icon>{{ t.clientName }}</a>
                      }
                    </span>
                  </div>
                </li>
              }
            </ul>
          }
        }
        @if (loaded() && !tasks().length) { <p class="empty">Nada pendiente. 🎉</p> }
      </section>

      <section>
        <h2><mat-icon>event</mat-icon> Próximas reuniones</h2>
        <ul class="items">
          @for (m of meetings(); track m.id) {
            <li class="meeting">
              <div class="date-box">
                <span class="mon">{{ m.start | date: 'EEE' }}</span>
                <span class="day">{{ m.start | date: 'd' }}</span>
              </div>
              <div class="body">
                <strong>{{ m.title }}</strong>
                <span class="meta">
                  <span><mat-icon>schedule</mat-icon>{{ m.start | date: 'h:mm a' }}</span>
                  @if (m.venue) { <span><mat-icon>place</mat-icon>{{ m.venue }}</span> }
                  @if (m.clientId) {
                    <a [routerLink]="['/clientes', m.clientId]"><mat-icon>person</mat-icon>{{ m.clientName }}</a>
                  }
                </span>
              </div>
            </li>
          } @empty {
            @if (loaded()) { <li class="empty">Sin reuniones agendadas.</li> }
          }
        </ul>
      </section>
    </div>
  `,
  styles: `
    :host { display: block; max-width: 1200px; }
    .head { margin: 8px 0 16px; }
    h1 { margin: 0; font: var(--mat-sys-headline-small); }
    .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
    section { padding: 20px 24px; border-radius: var(--mat-sys-corner-extra-large); background: var(--mat-sys-surface-container-low); }
    h2 { display: flex; align-items: center; gap: 8px; margin: 0 0 12px; font: var(--mat-sys-title-medium); mat-icon { color: var(--mat-sys-primary); } }
    h3 { margin: 16px 0 8px; font: var(--mat-sys-label-large); color: var(--mat-sys-on-surface-variant); }
    h3.late { color: var(--mat-sys-error); }
    h3.today { color: var(--mat-sys-primary); }
    .items { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    li { display: flex; align-items: center; gap: 12px; padding: 10px 16px 10px 8px; border-radius: var(--mat-sys-corner-medium); background: var(--mat-sys-surface-container-lowest); }
    li.meeting { padding-left: 12px; }
    .body { min-width: 0; display: flex; flex-direction: column; gap: 4px; strong { font: var(--mat-sys-title-small); } }
    .meta { display: flex; flex-wrap: wrap; gap: 4px 16px; font: var(--mat-sys-body-small); color: var(--mat-sys-on-surface-variant);
      span, a { display: inline-flex; align-items: center; gap: 4px; } span::first-letter { text-transform: uppercase; }
      a { color: var(--mat-sys-primary); text-decoration: none; &:hover { text-decoration: underline; } }
      mat-icon { font-size: 16px; width: 16px; height: 16px; } }
    .date-box { width: 48px; flex: none; display: flex; flex-direction: column; align-items: center; padding: 6px 0;
      border-radius: var(--mat-sys-corner-small); background: var(--mat-sys-primary-container); color: var(--mat-sys-on-primary-container);
      .mon { font: var(--mat-sys-label-small); text-transform: uppercase; } .day { font: var(--mat-sys-title-large); line-height: 1.1; } }
    .empty { color: var(--mat-sys-on-surface-variant); background: none; padding: 8px 0; }
    @media (max-width: 999.98px) { .cols { grid-template-columns: 1fr; } section { padding: 16px; } }
  `,
})
export class AgendaPage {
  private readonly backend = inject(CrmBackend);
  private readonly store = inject(CrmStore);
  protected readonly tasks = signal<CrmTask[]>([]);
  protected readonly meetings = signal<Meeting[]>([]);
  protected readonly loaded = signal(false);
  protected readonly parse = parseDateOnly;

  protected readonly groups = computed<Group[]>(() => {
    const g: Group[] = [
      { key: 'late', label: 'Vencidas', tone: 'late', tasks: [] },
      { key: 'today', label: 'Hoy', tone: 'today', tasks: [] },
      { key: 'week', label: 'Próximos 7 días', tone: '', tasks: [] },
      { key: 'later', label: 'Más adelante / sin fecha', tone: '', tasks: [] },
    ];
    for (const t of this.tasks()) {
      const d = t.dueDate ? dayDiff(t.dueDate) : null;
      const i = d === null ? 3 : d < 0 ? 0 : d === 0 ? 1 : d <= 7 ? 2 : 3;
      g[i]!.tasks.push(t);
    }
    return g;
  });

  constructor() {
    this.load();
  }

  private async load(): Promise<void> {
    try {
      const [tasks, meetings] = await Promise.all([this.backend.listOpenTasks(), this.backend.listUpcomingMeetings()]);
      this.tasks.set(tasks);
      this.meetings.set(meetings);
    } catch (e) {
      this.store.fail(e);
    } finally {
      this.loaded.set(true);
    }
  }

  async complete(t: CrmTask): Promise<void> {
    this.tasks.update((list) => list.filter((x) => x.id !== t.id));
    try {
      await this.backend.completeTask(t.id);
      this.store.toast('Tarea completada');
    } catch (e) {
      this.tasks.update((list) => [...list, t]);
      this.store.fail(e);
    }
  }
}
