import { Injectable } from '@angular/core';
import { CrmBackend, toDateOnly, toZohoDateTime } from './crm-backend';
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

const KEY = 'dhcrm.demo.v1';

interface DemoDb {
  statuses: string[];
  clients: Client[];
  notes: Record<string, Note[]>;
  tasks: CrmTask[];
  meetings: Meeting[];
}

const uid = () => crypto.randomUUID().slice(0, 8);
const wait = (ms = 180) => new Promise((r) => setTimeout(r, ms));

function daysFromNow(d: number, hour = 10): Date {
  const x = new Date();
  x.setDate(x.getDate() + d);
  x.setHours(hour, 0, 0, 0);
  return x;
}

function seed(): DemoDb {
  const statuses = ['Nuevo', 'Contactado', 'Calificado', 'Propuesta enviada', 'Ganado', 'Perdido'];
  const raw: [string, string, string, string, string, string][] = [
    ['Mariana', 'Ortiz', 'Hotel Boutique Xaman', 'Nuevo', 'Sitio web', 'Quiere migrar reservaciones a Zoho.'],
    ['Luis', 'Pacheco', 'Ferretera del Caribe', 'Nuevo', 'Recomendación', 'Necesita tienda en línea.'],
    ['Andrea', 'Canché', 'Clínica Dental Sonrisa', 'Contactado', 'Facebook', 'Agenda de citas y recordatorios.'],
    ['Roberto', 'Medina', 'Inmobiliaria Kanai', 'Contactado', 'Evento', 'CRM para 6 asesores.'],
    ['Paola', 'Herrera', 'Café Ixi', 'Calificado', 'Instagram', 'Punto de venta + inventario en Odoo.'],
    ['Diego', 'Villanueva', 'Tulum Tours', 'Calificado', 'Sitio web', 'Integrar WhatsApp con Zoho Desk.'],
    ['Sofía', 'Chan', 'Despacho Chan & Asociados', 'Propuesta enviada', 'Recomendación', 'Zoho Books + facturación CFDI.'],
    ['Héctor', 'Ramírez', 'Constructora Itzá', 'Propuesta enviada', 'LinkedIn', 'Portal de avance de obra.'],
    ['Valeria', 'Gómez', 'Spa Sak Nah', 'Ganado', 'Sitio web', 'Sitio web + reservas en línea.'],
    ['Jorge', 'Uc', 'Distribuidora Maya', 'Perdido', 'Llamada en frío', 'Eligió otro proveedor por precio.'],
  ];
  const clients: Client[] = raw.map(([f, l, company, status, source, description], i) => ({
    id: `c${i + 1}`,
    firstName: f,
    lastName: l,
    fullName: `${f} ${l}`,
    company,
    email: `${f}.${l}@ejemplo.mx`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\s]/g, ''),
    phone: `+52 984 ${String(100 + i * 37).padStart(3, '0')} ${String(2000 + i * 413).slice(0, 4)}`,
    status,
    source,
    description,
    modifiedTime: daysFromNow(-i).toISOString(),
  }));
  const byId = (id: string) => clients.find((c) => c.id === id)!;
  const task = (cid: string, subject: string, d: number, priority = 'Normal'): CrmTask => ({
    id: uid(),
    subject,
    dueDate: toDateOnly(daysFromNow(d)),
    status: 'Not Started',
    priority,
    clientId: cid,
    clientName: byId(cid).fullName,
  });
  const meeting = (cid: string, title: string, d: number, h: number, venue: string): Meeting => ({
    id: uid(),
    title,
    start: toZohoDateTime(daysFromNow(d, h)),
    end: toZohoDateTime(daysFromNow(d, h + 1)),
    venue,
    description: '',
    clientId: cid,
    clientName: byId(cid).fullName,
  });
  return {
    statuses,
    clients,
    notes: {
      c4: [
        { id: uid(), content: 'Llamada inicial: usan Excel compartido, pierden seguimiento de prospectos.', createdTime: daysFromNow(-3).toISOString() },
        { id: uid(), content: 'Pidió demo de Zoho CRM con pipeline por desarrollo.', createdTime: daysFromNow(-1).toISOString() },
      ],
      c7: [{ id: uid(), content: 'Propuesta enviada por correo. Revisan con su contador.', createdTime: daysFromNow(-2).toISOString() }],
    },
    tasks: [
      task('c4', 'Preparar demo de pipeline', 1, 'High'),
      task('c7', 'Dar seguimiento a la propuesta', 0, 'High'),
      task('c1', 'Enviar cuestionario de levantamiento', 2),
      task('c3', 'Llamar para confirmar presupuesto', -1, 'High'),
      task('c8', 'Ajustar cotización con fase 2', 4),
    ],
    meetings: [
      meeting('c4', 'Demo Zoho CRM', 1, 11, 'Google Meet'),
      meeting('c6', 'Levantamiento de requerimientos', 3, 16, 'Oficina Tulum Tours'),
      meeting('c7', 'Revisión de propuesta', 5, 10, 'Café en 5ta Avenida'),
    ],
  };
}

/** Backend en memoria para probar la app sin Zoho. Guarda cambios en este navegador. */
@Injectable()
export class DemoBackend extends CrmBackend {
  private db: DemoDb = this.load();

  private load(): DemoDb {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw) as DemoDb;
    } catch {
      /* ignore */
    }
    return seed();
  }

  private save(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.db));
    } catch {
      /* ignore */
    }
  }

  reset(): void {
    this.db = seed();
    this.save();
  }

  async statuses() {
    await wait();
    return [...this.db.statuses];
  }

  async listClients() {
    await wait();
    return structuredClone(this.db.clients);
  }

  async getClient(id: string) {
    await wait(80);
    const c = this.db.clients.find((x) => x.id === id);
    if (!c) throw new Error('Cliente no encontrado');
    return structuredClone(c);
  }

  async createClient(input: ClientInput) {
    await wait();
    const c: Client = {
      id: uid(),
      ...input,
      fullName: [input.firstName, input.lastName].filter(Boolean).join(' '),
      status: input.status || this.db.statuses[0],
      modifiedTime: new Date().toISOString(),
    };
    this.db.clients.unshift(c);
    this.save();
    return structuredClone(c);
  }

  async setStatus(id: string, status: string) {
    await wait(120);
    const c = this.db.clients.find((x) => x.id === id);
    if (c) {
      c.status = status;
      c.modifiedTime = new Date().toISOString();
    }
    this.save();
  }

  async listNotes(clientId: string) {
    await wait(80);
    return structuredClone(this.db.notes[clientId] ?? []).sort((a, b) => b.createdTime.localeCompare(a.createdTime));
  }

  async addNote(clientId: string, content: string) {
    await wait(120);
    const n: Note = { id: uid(), content, createdTime: new Date().toISOString() };
    (this.db.notes[clientId] ??= []).unshift(n);
    this.save();
    return n;
  }

  async listTasks(clientId: string) {
    await wait(80);
    return structuredClone(this.db.tasks.filter((t) => t.clientId === clientId)).sort((a, b) =>
      (a.dueDate ?? '9').localeCompare(b.dueDate ?? '9'),
    );
  }

  async listOpenTasks() {
    await wait();
    return structuredClone(this.db.tasks.filter((t) => t.status !== TASK_DONE)).sort((a, b) =>
      (a.dueDate ?? '9').localeCompare(b.dueDate ?? '9'),
    );
  }

  async createTask(client: Client, input: TaskInput) {
    await wait(120);
    const t: CrmTask = {
      id: uid(),
      subject: input.subject,
      dueDate: input.dueDate,
      priority: input.priority,
      status: 'Not Started',
      clientId: client.id,
      clientName: client.fullName,
    };
    this.db.tasks.push(t);
    this.save();
    return t;
  }

  async completeTask(taskId: string) {
    await wait(120);
    const t = this.db.tasks.find((x) => x.id === taskId);
    if (t) t.status = TASK_DONE;
    this.save();
  }

  async listMeetings(clientId: string) {
    await wait(80);
    return structuredClone(this.db.meetings.filter((m) => m.clientId === clientId)).sort((a, b) =>
      b.start.localeCompare(a.start),
    );
  }

  async listUpcomingMeetings() {
    await wait();
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    return structuredClone(this.db.meetings.filter((m) => new Date(m.start) >= from)).sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
    );
  }

  async createMeeting(client: Client, input: MeetingInput) {
    await wait(120);
    const m: Meeting = {
      id: uid(),
      title: input.title,
      start: toZohoDateTime(input.start),
      end: toZohoDateTime(input.end),
      venue: input.venue,
      description: input.description,
      clientId: client.id,
      clientName: client.fullName,
    };
    this.db.meetings.push(m);
    this.save();
    return m;
  }
}
