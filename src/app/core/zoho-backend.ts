import { Injectable, inject } from '@angular/core';
import { APP_SETTINGS } from '../app.settings';
import { CrmBackend, toZohoDateTime } from './crm-backend';
import {
  Client,
  ClientInput,
  CrmTask,
  Meeting,
  MeetingInput,
  Note,
  TASK_DONE,
  TaskInput,
} from './models';
import { ZohoAuth } from './zoho-auth.service';

type ZRec = Record<string, any>;

const MODULE = APP_SETTINGS.crm.clientsModule;
const STATUS = APP_SETTINGS.crm.statusField;
const CLIENT_FIELDS = [
  'First_Name',
  'Last_Name',
  'Full_Name',
  'Company',
  'Email',
  'Phone',
  'Mobile',
  STATUS,
  'Lead_Source',
  'Description',
  'Modified_Time',
].join(',');
const TASK_FIELDS = 'Subject,Due_Date,Status,Priority,What_Id';
const EVENT_FIELDS = 'Event_Title,Start_DateTime,End_DateTime,Venue,Description,What_Id';

export class ZohoApiError extends Error {}

/** Conexión directa del navegador con la API v8 de Zoho CRM (CORS habilitado para clientes JS). */
@Injectable()
export class ZohoBackend extends CrmBackend {
  private readonly auth = inject(ZohoAuth);

  private async api<T = ZRec>(path: string, init: RequestInit = {}): Promise<T | null> {
    const token = this.auth.accessToken;
    if (!token) {
      this.auth.login(location.pathname);
      throw new ZohoApiError('Sesión de Zoho vencida. Redirigiendo…');
    }
    const res = await fetch(`${this.auth.apiDomain}/crm/v8/${path}`, {
      ...init,
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });
    if (res.status === 204) return null;
    if (res.status === 401) {
      this.auth.logout();
      this.auth.login(location.pathname);
      throw new ZohoApiError('Sesión de Zoho vencida. Redirigiendo…');
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new ZohoApiError(body?.message || body?.code || `Error ${res.status} en Zoho`);
    }
    return body as T;
  }

  /** POST/PUT con {data:[...]}; devuelve el id creado o lanza el mensaje de Zoho. */
  private async write(path: string, method: 'POST' | 'PUT', record: ZRec): Promise<string> {
    const body = await this.api<ZRec>(path, { method, body: JSON.stringify({ data: [record] }) });
    const r = body?.['data']?.[0];
    if (!r || r['status'] === 'error') {
      const field = r?.['details']?.['api_name'];
      throw new ZohoApiError(`${r?.['message'] ?? 'Zoho rechazó el registro'}${field ? ` (${field})` : ''}`);
    }
    return r['details']?.['id'];
  }

  private async coql(query: string): Promise<ZRec[]> {
    const body = await this.api<ZRec>('coql', {
      method: 'POST',
      body: JSON.stringify({ select_query: query }),
    });
    return body?.['data'] ?? [];
  }

  // ---------- Mapeos ----------

  private toClient(r: ZRec): Client {
    return {
      id: r['id'],
      firstName: r['First_Name'] ?? '',
      lastName: r['Last_Name'] ?? '',
      fullName: r['Full_Name'] ?? [r['First_Name'], r['Last_Name']].filter(Boolean).join(' '),
      company: r['Company'] ?? r['Account_Name']?.['name'] ?? '',
      email: r['Email'] ?? '',
      phone: r['Phone'] || r['Mobile'] || '',
      status: r[STATUS] ?? '',
      source: r['Lead_Source'] ?? '',
      description: r['Description'] ?? '',
      modifiedTime: r['Modified_Time'] ?? '',
    };
  }

  private toTask(r: ZRec): CrmTask {
    return {
      id: r['id'],
      subject: r['Subject'] ?? '',
      dueDate: r['Due_Date'] ?? null,
      status: r['Status'] ?? '',
      priority: r['Priority'] ?? 'Normal',
      clientId: r['What_Id']?.['id'] ?? null,
      clientName: r['What_Id']?.['name'] ?? null,
    };
  }

  private toMeeting(r: ZRec): Meeting {
    return {
      id: r['id'],
      title: r['Event_Title'] ?? '',
      start: r['Start_DateTime'],
      end: r['End_DateTime'],
      venue: r['Venue'] ?? '',
      description: r['Description'] ?? '',
      clientId: r['What_Id']?.['id'] ?? null,
      clientName: r['What_Id']?.['name'] ?? null,
    };
  }

  // ---------- Clientes ----------

  async statuses(): Promise<string[]> {
    const body = await this.api<ZRec>(`settings/fields?module=${MODULE}`);
    const field = (body?.['fields'] ?? []).find((f: ZRec) => f['api_name'] === STATUS);
    return (field?.['pick_list_values'] ?? []).map((v: ZRec) => v['actual_value'] as string);
  }

  async listClients(): Promise<Client[]> {
    const all: Client[] = [];
    let token: string | undefined;
    // Hasta 1,000 registros (5 páginas de 200)
    for (let i = 0; i < 5; i++) {
      const qs = new URLSearchParams({
        fields: CLIENT_FIELDS,
        per_page: '200',
        sort_by: 'Modified_Time',
        sort_order: 'desc',
      });
      if (token) qs.set('page_token', token);
      const body = await this.api<ZRec>(`${MODULE}?${qs}`);
      all.push(...(body?.['data'] ?? []).map((r: ZRec) => this.toClient(r)));
      token = body?.['info']?.['next_page_token'];
      if (!body?.['info']?.['more_records'] || !token) break;
    }
    return all;
  }

  async getClient(id: string): Promise<Client> {
    const body = await this.api<ZRec>(`${MODULE}/${id}?fields=${CLIENT_FIELDS}`);
    const r = body?.['data']?.[0];
    if (!r) throw new ZohoApiError('Cliente no encontrado');
    return this.toClient(r);
  }

  async createClient(input: ClientInput): Promise<Client> {
    const id = await this.write(MODULE, 'POST', {
      First_Name: input.firstName || undefined,
      Last_Name: input.lastName,
      Company: input.company,
      Email: input.email || undefined,
      Phone: input.phone || undefined,
      [STATUS]: input.status || undefined,
      Lead_Source: input.source || undefined,
      Description: input.description || undefined,
    });
    return this.getClient(id);
  }

  async setStatus(id: string, status: string): Promise<void> {
    await this.write(`${MODULE}/${id}`, 'PUT', { [STATUS]: status });
  }

  // ---------- Notas ----------

  async listNotes(clientId: string): Promise<Note[]> {
    const body = await this.api<ZRec>(
      `${MODULE}/${clientId}/Notes?fields=Note_Title,Note_Content,Created_Time&per_page=100`,
    );
    return (body?.['data'] ?? [])
      .map((r: ZRec) => ({ id: r['id'], content: r['Note_Content'] ?? '', createdTime: r['Created_Time'] }))
      .sort((a: Note, b: Note) => b.createdTime.localeCompare(a.createdTime));
  }

  async addNote(clientId: string, content: string): Promise<Note> {
    const id = await this.write(`${MODULE}/${clientId}/Notes`, 'POST', { Note_Content: content });
    return { id, content, createdTime: new Date().toISOString() };
  }

  // ---------- Tareas ----------

  async listTasks(clientId: string): Promise<CrmTask[]> {
    try {
      const rows = await this.coql(
        `select ${TASK_FIELDS} from Tasks where What_Id = '${clientId}' order by Due_Date asc limit 200`,
      );
      return rows.map((r) => this.toTask(r));
    } catch {
      // Respaldo si COQL no acepta el filtro: trae las últimas y filtra aquí
      const body = await this.api<ZRec>(`Tasks?fields=${TASK_FIELDS}&per_page=200&sort_by=Modified_Time`);
      return (body?.['data'] ?? []).map((r: ZRec) => this.toTask(r)).filter((t: CrmTask) => t.clientId === clientId);
    }
  }

  async listOpenTasks(): Promise<CrmTask[]> {
    const rows = await this.coql(
      `select ${TASK_FIELDS} from Tasks where Status != '${TASK_DONE}' order by Due_Date asc limit 200`,
    );
    return rows.map((r) => this.toTask(r));
  }

  async createTask(client: Client, input: TaskInput): Promise<CrmTask> {
    const id = await this.write('Tasks', 'POST', {
      Subject: input.subject,
      Due_Date: input.dueDate || undefined,
      Priority: input.priority,
      Status: 'Not Started',
      Description: input.description || undefined,
      What_Id: { id: client.id },
      $se_module: MODULE,
    });
    return {
      id,
      subject: input.subject,
      dueDate: input.dueDate,
      priority: input.priority,
      status: 'Not Started',
      clientId: client.id,
      clientName: client.fullName,
    };
  }

  async completeTask(taskId: string): Promise<void> {
    await this.write(`Tasks/${taskId}`, 'PUT', { Status: TASK_DONE });
  }

  // ---------- Reuniones ----------

  async listMeetings(clientId: string): Promise<Meeting[]> {
    try {
      const rows = await this.coql(
        `select ${EVENT_FIELDS} from Events where What_Id = '${clientId}' order by Start_DateTime desc limit 100`,
      );
      return rows.map((r) => this.toMeeting(r));
    } catch {
      const body = await this.api<ZRec>(`Events?fields=${EVENT_FIELDS}&per_page=200&sort_by=Modified_Time`);
      return (body?.['data'] ?? [])
        .map((r: ZRec) => this.toMeeting(r))
        .filter((m: Meeting) => m.clientId === clientId);
    }
  }

  async listUpcomingMeetings(): Promise<Meeting[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rows = await this.coql(
      `select ${EVENT_FIELDS} from Events where Start_DateTime >= '${toZohoDateTime(today)}' order by Start_DateTime asc limit 100`,
    );
    return rows.map((r) => this.toMeeting(r));
  }

  async createMeeting(client: Client, input: MeetingInput): Promise<Meeting> {
    const start = toZohoDateTime(input.start);
    const end = toZohoDateTime(input.end);
    const id = await this.write('Events', 'POST', {
      Event_Title: input.title,
      Start_DateTime: start,
      End_DateTime: end,
      Venue: input.venue || undefined,
      Description: input.description || undefined,
      What_Id: { id: client.id },
      $se_module: MODULE,
    });
    return {
      id,
      title: input.title,
      start,
      end,
      venue: input.venue,
      description: input.description,
      clientId: client.id,
      clientName: client.fullName,
    };
  }
}
