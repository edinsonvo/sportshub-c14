export type Role = "ADMIN" | "PROVIDER" | "STAFF" | "CLIENT";

export type AppointmentStatus =
  | "SOLICITADA"
  | "CONFIRMADA"
  | "COMPLETADA"
  | "CANCELADA";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: Role;
  mfaEnabled: boolean;
  active: boolean;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: Role;
  active: boolean;
  mfaEnabled: boolean;
  createdAt: string;
}

export interface AdminProvider {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  businessName: string;
  documentNumber: string;
  identityVerified: boolean;
  verifiedAt?: string | null;
  logoUrl?: string | null;
  active: boolean;
  staffCount: number;
  servicesCount: number;
}

export interface SystemStats {
  totalUsers: number;
  totalClients: number;
  totalProviders: number;
  totalStaff: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalFacilities: number;
  totalClasses: number;
  totalTournaments: number;
  estimatedRevenue: number;
  appointmentsByStatus: Record<string, number>;
}

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  userId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
}

export interface ProviderProfile {
  id: string;
  userId: string;
  businessName: string;
  documentNumber: string;
  description?: string | null;
  logoUrl?: string | null;
  identityVerified: boolean;
  active: boolean;
}

export interface ServiceItem {
  id: string;
  providerId: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  active: boolean;
  imageUrl?: string | null;
}

export interface ScheduleItem {
  id: string;
  providerServiceId: string;
  providerId: string;
  staffId: string;
  staffName?: string | null;
  dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
  startTime: string;
  endTime: string;
  blocked: boolean;
}

export interface StaffMember {
  id: string;
  providerId: string;
  userId: string;
  email: string;
  fullName: string;
  phone: string;
  position: string;
  active: boolean;
}

export interface AppointmentItem {
  id: string;
  providerServiceId: string;
  providerId: string;
  clientId: string;
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  cancellationReason?: string | null;
}

export interface TimeSlot {
  start: string;
  end: string;
}
