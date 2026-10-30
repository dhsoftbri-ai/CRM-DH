import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CrmBackend } from '../core/crm-backend';
import { CrmStore } from '../core/crm-store';
import { Client, CrmTask, Meeting, Note, TASK_DONE } from '../core/models';
import { MeetingDialog } from '../dialogs/meeting.dialog';
import { TaskDialog } from '../dialogs/task.dialog';
import { PRIORITY_LABEL, dayDiff, initials, parseDateOnly, statusColor, whatsappUrl } from '../shared/ui';

@Component({
  selector: 'app-client-detail-page',
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './client-detail.page.html',
  styleUrl: './client-detail.page.scss',
})
export class ClientDetailPage {
  readonly id = input.required<string>();

  private readonly backend = inject(CrmBackend);
  private readonly dialog = inject(MatDialog);
  protected readonly store = inject(CrmStore);

  protected readonly fetched = signal<Client | null>(null);
  /** Prefiere la versión del store (se actualiza al mover estatus). */
  protected readonly client = computed(() => this.store.find(this.id()) ?? this.fetched());
  protected readonly notes = signal<Note[]>([]);
  protected readonly tasks = signal<CrmTask[]>([]);
  protected readonly meetings = signal<Meeting[]>([]);
  protected readonly busy = signal(true);
  protected readonly noteDraft = signal('');
  protected readonly savingNote = signal(false);

  protected readonly openTasks = computed(() => this.tasks().filter((t) => t.status !== TASK_DONE));
  protected readonly doneTasks = computed(() => this.tasks().filter((t) => t.status === TASK_DONE));
  protected readonly upcoming = computed(() => {
    const now = Date.now();
    return this.meetings()
      .filter((m) => new Date(m.end).getTime() >= now)
      .sort((a, b) => a.start.localeCompare(b.start));
  });
  protected readonly past = computed(() => {
    const now = Date.now();
    return this.meetings().filter((m) => new Date(m.end).getTime() < now);
  });

  protected readonly initials = initials;
  protected readonly whatsappUrl = whatsappUrl;
  protected readonly priorityLabel = PRIORITY_LABEL;
  protected readonly parseDate = parseDateOnly;

  constructor() {
    effect(() => {
      const id = this.id();
      this.load(id);
    });
  }

  private async load(id: string): Promise<void> {
    this.busy.set(true);
    try {
      const [client, notes, tasks, meetings] = await Promise.all([
        this.store.find(id) ? Promise.resolve(null) : this.backend.getClient(id),
        this.backend.listNotes(id),
        this.backend.listTasks(id),
        this.backend.listMeetings(id),
      ]);
      if (client) this.fetched.set(client);
      this.notes.set(notes);
      this.tasks.set(tasks);
      this.meetings.set(meetings);
    } catch (e) {
      this.store.fail(e);
    } finally {
      this.busy.set(false);
    }
  }

  protected color(s: string): string {
    return statusColor(s, this.store.statuses());
  }

  protected dueLabel(t: CrmTask): { text: string; tone: 'late' | 'today' | 'soon' | '' } {
    if (!t.dueDate) return { text: 'Sin fecha', tone: '' };
    const d = dayDiff(t.dueDate);
    if (d < 0) return { text: `Vencida hace ${-d} ${d === -1 ? 'día' : 'días'}`, tone: 'late' };
    if (d === 0) return { text: 'Hoy', tone: 'today' };
    if (d === 1) return { text: 'Mañana', tone: 'soon' };
    return { text: '', tone: '' };
  }

  async changeStatus(status: string): Promise<void> {
    const c = this.client();
    if (!c) return;
    if (!this.store.find(c.id)) this.fetched.set({ ...c, status });
    await this.store.setStatus(c, status);
  }

  async addNote(): Promise<void> {
    const c = this.client();
    const text = this.noteDraft().trim();
    if (!c || !text) return;
    this.savingNote.set(true);
    try {
      const n = await this.backend.addNote(c.id, text);
      this.notes.update((list) => [n, ...list]);
      this.noteDraft.set('');
    } catch (e) {
      this.store.fail(e);
    } finally {
      this.savingNote.set(false);
    }
  }

  async newTask(): Promise<void> {
    const c = this.client();
    if (!c) return;
    const input = await firstValueFrom(this.dialog.open(TaskDialog, { maxWidth: '95vw' }).afterClosed());
    if (!input) return;
    try {
      const t = await this.backend.createTask(c, input);
      this.tasks.update((list) => [...list, t].sort((a, b) => (a.dueDate ?? '9').localeCompare(b.dueDate ?? '9')));
      this.store.toast('Tarea creada');
    } catch (e) {
      this.store.fail(e);
    }
  }

  async complete(t: CrmTask): Promise<void> {
    this.tasks.update((list) => list.map((x) => (x.id === t.id ? { ...x, status: TASK_DONE } : x)));
    try {
      await this.backend.completeTask(t.id);
      this.store.toast('Tarea completada');
    } catch (e) {
      this.tasks.update((list) => list.map((x) => (x.id === t.id ? t : x)));
      this.store.fail(e);
    }
  }

  async newMeeting(): Promise<void> {
    const c = this.client();
    if (!c) return;
    const input = await firstValueFrom(
      this.dialog.open(MeetingDialog, { width: '560px', maxWidth: '95vw', data: { clientName: c.fullName } }).afterClosed(),
    );
    if (!input) return;
    try {
      const m = await this.backend.createMeeting(c, input);
      this.meetings.update((list) => [...list, m]);
      this.store.toast('Reunión agendada');
    } catch (e) {
      this.store.fail(e);
    }
  }
}
