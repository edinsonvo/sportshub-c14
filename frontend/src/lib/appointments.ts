import { api } from './api';

export type AppointmentStatus =
  | 'SOLICITADA'
  | 'CONFIRMADA'
  | 'COMPLETADA'
  | 'CANCELADA'
  | 'CANCELADA_POR_IMPREVISTO'
  | 'REPROGRAMADA';

export interface Appointment {
  id: string;
  providerServiceId: string;
  providerId: string;
  clientId: string;
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  cancellationReason: string | null;
  completedAt: string | null;
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  active: boolean;
}

export interface ClientItem {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  createdAt: string | null;
}

export type EstadoAgenda =
  | 'Finalizada'
  | 'En progreso'
  | 'Pendiente'
  | 'Cancelada';

export type EstadoCliente =
  | 'Pendiente'
  | 'Confirmada'
  | 'Cancelada'
  | 'Finalizada';

export type EstadoHistorial = 'Agendada' | 'Realizada' | 'Cancelada';

function query(params?: { status?: string; from?: string; to?: string }): string {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.from) search.set('from', params.from);
  if (params?.to) search.set('to', params.to);
  const value = search.toString();
  return value ? `?${value}` : '';
}

export async function getAppointments(
  token: string,
  params?: { status?: string; from?: string; to?: string },
): Promise<Appointment[]> {
  return api<Appointment[]>(`/appointments${query(params)}`, { token });
}

export async function getMyServices(token: string): Promise<ServiceItem[]> {
  return api<ServiceItem[]>('/services/mine', { token });
}

export async function getClients(token: string): Promise<ClientItem[]> {
  return api<ClientItem[]>('/appointments/clients', { token });
}

export type AppointmentAction = 'confirm' | 'complete' | 'cancel';

export async function changeAppointmentStatus(
  token: string,
  appointmentId: string,
  action: AppointmentAction,
): Promise<Appointment> {
  return api<Appointment>(`/appointments/${appointmentId}/${action}`, {
    method: 'PATCH',
    token,
  });
}

export function initials(name?: string | null): string {
  if (!name) return '??';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return day && month && year ? `${day}/${month}/${year}` : iso;
}

export function formatTime(time: string): string {
  return time.slice(0, 5);
}

export function mapEstadoAgenda(
  status: AppointmentStatus,
  date: string,
  endTime: string,
  now: Date = new Date(),
): EstadoAgenda {
  if (status === 'COMPLETADA') return 'Finalizada';
  if (status === 'CANCELADA' || status === 'CANCELADA_POR_IMPREVISTO') {
    return 'Cancelada';
  }
  // El backend interpreta la hora de Colombia (UTC-5).
  const fin = new Date(`${date}T${endTime}:00-05:00`);
  if (status === 'CONFIRMADA' && now >= fin) return 'Finalizada';
  if (status === 'CONFIRMADA' && now >= new Date(fin.getTime() - 60 * 60 * 1000)) {
    return 'En progreso';
  }
  return 'Pendiente';
}

export function mapEstadoCliente(status: AppointmentStatus): EstadoCliente {
  switch (status) {
    case 'COMPLETADA':
      return 'Finalizada';
    case 'CANCELADA':
    case 'CANCELADA_POR_IMPREVISTO':
      return 'Cancelada';
    case 'CONFIRMADA':
    case 'REPROGRAMADA':
      return 'Confirmada';
    default:
      return 'Pendiente';
  }
}

export function mapEstadoHistorial(status: AppointmentStatus): EstadoHistorial {
  if (status === 'COMPLETADA') return 'Realizada';
  if (status === 'CANCELADA' || status === 'CANCELADA_POR_IMPREVISTO') {
    return 'Cancelada';
  }
  return 'Agendada';
}
