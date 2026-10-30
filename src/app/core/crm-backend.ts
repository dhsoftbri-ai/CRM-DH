import { Client, ClientInput, CrmTask, Meeting, MeetingInput, Note, TaskInput } from './models';

/** Contrato que cumplen tanto Zoho como el modo demo. */
export abstract class CrmBackend {
  abstract statuses(): Promise<string[]>;

  abstract listClients(): Promise<Client[]>;
  abstract getClient(id: string): Promise<Client>;
  abstract createClient(input: ClientInput): Promise<Client>;
  abstract setStatus(id: string, status: string): Promise<void>;

  abstract listNotes(clientId: string): Promise<Note[]>;
  abstract addNote(clientId: string, content: string): Promise<Note>;

  abstract listTasks(clientId: string): Promise<CrmTask[]>;
  abstract listOpenTasks(): Promise<CrmTask[]>;
  abstract createTask(client: Client, input: TaskInput): Promise<CrmTask>;
  abstract completeTask(taskId: string): Promise<void>;

  abstract listMeetings(clientId: string): Promise<Meeting[]>;
  abstract listUpcomingMeetings(): Promise<Meeting[]>;
  abstract createMeeting(client: Client, input: MeetingInput): Promise<Meeting>;
}

/** Fecha y hora local con zona horaria, formato que espera Zoho: 2026-10-30T10:00:00-05:00 */
export function toZohoDateTime(d: Date): string {
  const pad = (n: number) => String(Math.abs(n)).padStart(2, '0');
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:00` +
    `${sign}${pad(Math.floor(Math.abs(off) / 60))}:${pad(Math.abs(off) % 60)}`
  );
}

export function toDateOnly(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
