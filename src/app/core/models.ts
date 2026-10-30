export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  company: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  description: string;
  modifiedTime: string;
}

export interface ClientInput {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  description: string;
}

export interface Note {
  id: string;
  content: string;
  createdTime: string;
}

export type TaskPriority = 'Highest' | 'High' | 'Normal' | 'Low' | 'Lowest';

export interface CrmTask {
  id: string;
  subject: string;
  dueDate: string | null; // yyyy-MM-dd
  status: string;
  priority: TaskPriority | string;
  clientId: string | null;
  clientName: string | null;
}

export interface TaskInput {
  subject: string;
  dueDate: string | null;
  priority: TaskPriority;
  description: string;
}

export interface Meeting {
  id: string;
  title: string;
  start: string; // ISO con zona horaria
  end: string;
  venue: string;
  description: string;
  clientId: string | null;
  clientName: string | null;
}

export interface MeetingInput {
  title: string;
  start: Date;
  end: Date;
  venue: string;
  description: string;
}

export const TASK_DONE = 'Completed';
