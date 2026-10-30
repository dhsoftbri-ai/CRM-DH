import { Injectable, computed, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { APP_SETTINGS } from '../app.settings';
import { CrmBackend } from './crm-backend';
import { Client, ClientInput } from './models';

/** Estado compartido de clientes y estatus. Las pantallas leen de aquí. */
@Injectable({ providedIn: 'root' })
export class CrmStore {
  private readonly backend = inject(CrmBackend);
  private readonly snack = inject(MatSnackBar);

  readonly clients = signal<Client[]>([]);
  readonly statuses = signal<string[]>([]);
  readonly loading = signal(false);
  readonly loaded = signal(false);

  /** Estatus visibles como columnas del pipeline. */
  readonly pipelineStatuses = computed(() =>
    this.statuses().filter((s) => !(APP_SETTINGS.crm.hiddenStatuses as readonly string[]).includes(s)),
  );

  readonly byStatus = computed(() => {
    const map = new Map<string, Client[]>();
    for (const s of this.pipelineStatuses()) map.set(s, []);
    for (const c of this.clients()) map.get(c.status)?.push(c);
    return map;
  });

  async ensureLoaded(): Promise<void> {
    if (!this.loaded() && !this.loading()) await this.refresh();
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      const [statuses, clients] = await Promise.all([this.backend.statuses(), this.backend.listClients()]);
      this.statuses.set(statuses);
      this.clients.set(clients);
      this.loaded.set(true);
    } catch (e) {
      this.fail(e);
    } finally {
      this.loading.set(false);
    }
  }

  find(id: string): Client | undefined {
    return this.clients().find((c) => c.id === id);
  }

  async create(input: ClientInput): Promise<Client | null> {
    try {
      const c = await this.backend.createClient(input);
      this.clients.update((list) => [c, ...list]);
      this.toast(`${c.fullName} agregado`);
      return c;
    } catch (e) {
      this.fail(e);
      return null;
    }
  }

  /** Cambia el estatus de forma optimista y revierte si Zoho falla. */
  async setStatus(client: Client, status: string): Promise<void> {
    const previous = client.status;
    if (previous === status) return;
    this.patchLocal(client.id, { status });
    try {
      await this.backend.setStatus(client.id, status);
      this.toast(`${client.fullName} → ${status}`);
    } catch (e) {
      this.patchLocal(client.id, { status: previous });
      this.fail(e);
    }
  }

  patchLocal(id: string, patch: Partial<Client>): void {
    this.clients.update((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  toast(msg: string): void {
    this.snack.open(msg, undefined, { duration: 2500 });
  }

  fail(e: unknown): void {
    const msg = e instanceof Error ? e.message : 'Algo salió mal';
    this.snack.open(msg, 'Cerrar', { duration: 6000 });
    console.error(e);
  }
}
