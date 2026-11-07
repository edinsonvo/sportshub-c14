"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { loadSession } from "@/lib/auth";
import type {
  ProviderProfile,
  ServiceItem,
  ScheduleItem,
  StaffMember,
  AppointmentItem,
} from "@/lib/types";

export default function ProviderPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"services" | "schedules" | "staff" | "appointments" | "profile">("services");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Data states
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");

  // Create Service Form state
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState(60);
  const [newServicePrice, setNewServicePrice] = useState(50000);
  const [newServiceCapacity, setNewServiceCapacity] = useState(1);
  const [showNewServiceModal, setShowNewServiceModal] = useState(false);

  // Create Staff Form state
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffPosition, setNewStaffPosition] = useState("");
  const [showNewStaffModal, setShowNewStaffModal] = useState(false);

  // Create Schedule Form state
  const [schedDay, setSchedDay] = useState("MONDAY");
  const [schedStart, setSchedStart] = useState("08:00");
  const [schedEnd, setSchedEnd] = useState("12:00");
  const [schedStaffId, setSchedStaffId] = useState("");

  // Cancel reason state
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    const session = loadSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    if (session.role !== "PROVIDER" && session.role !== "ADMIN") {
      setError("Acceso reservado para Proveedores autorizados de la plataforma.");
      setLoading(false);
      return;
    }
    loadAll();
  }, [router]);

  async function loadAll() {
    setLoading(true);
    setError(null);
    const token = loadSession()?.accessToken;
    try {
      const [prof, serv, st, appts] = await Promise.all([
        api<ProviderProfile>("/providers/profile", { token }).catch(() => null),
        api<ServiceItem[]>("/services/my", { token }).catch(() => []),
        api<StaffMember[]>("/staff", { token }).catch(() => []),
        api<AppointmentItem[]>("/appointments", { token }).catch(() => []),
      ]);
      setProfile(prof);
      setServices(serv);
      setStaff(st);
      setAppointments(appts);
      if (serv.length > 0 && !selectedServiceId) {
        setSelectedServiceId(serv[0].id);
        loadSchedules(serv[0].id, token);
      }
      if (st.length > 0 && !schedStaffId) {
        setSchedStaffId(st[0].id);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cargar la información del proveedor");
    } finally {
      setLoading(false);
    }
  }

  async function loadSchedules(serviceId: string, customToken?: string) {
    const token = customToken ?? loadSession()?.accessToken;
    try {
      const data = await api<ScheduleItem[]>(`/services/${serviceId}/schedules`, { token });
      setSchedules(data);
    } catch {
      setSchedules([]);
    }
  }

  // Handle Create Service
  async function handleCreateService(e: React.FormEvent) {
    e.preventDefault();
    const token = loadSession()?.accessToken;
    try {
      const created = await api<ServiceItem>("/services", {
        method: "POST",
        token,
        body: JSON.stringify({
          name: newServiceName,
          description: newServiceDesc,
          durationMinutes: Number(newServiceDuration),
          price: Number(newServicePrice),
          maxCapacity: Number(newServiceCapacity),
        }),
      });
      setServices((prev) => [...prev, created]);
      setShowNewServiceModal(false);
      setNewServiceName("");
      setNewServiceDesc("");
      setSuccessMsg("¡Servicio creado exitosamente!");
      setTimeout(() => setSuccessMsg(null), 3000);
      if (!selectedServiceId) {
        setSelectedServiceId(created.id);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al crear el servicio");
    }
  }

  // Handle Toggle Service Active
  async function toggleServiceActive(service: ServiceItem) {
    const token = loadSession()?.accessToken;
    try {
      const updated = await api<ServiceItem>(`/services/${service.id}`, {
        method: "PUT",
        token,
        body: JSON.stringify({
          name: service.name,
          description: service.description,
          durationMinutes: service.durationMinutes,
          price: service.price,
          active: !service.active,
        }),
      });
      setServices((prev) => prev.map((s) => (s.id === service.id ? updated : s)));
      setSuccessMsg(`Servicio ${updated.active ? "activado" : "desactivado"} correctamente`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al actualizar servicio");
    }
  }

  // Handle Create Staff Member
  async function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    const token = loadSession()?.accessToken;
    try {
      const created = await api<StaffMember>("/staff", {
        method: "POST",
        token,
        body: JSON.stringify({
          email: newStaffEmail,
          fullName: newStaffName,
          phone: newStaffPhone,
          specialty: newStaffPosition,
        }),
      });
      setStaff((prev) => [...prev, created]);
      setShowNewStaffModal(false);
      setNewStaffEmail("");
      setNewStaffName("");
      setNewStaffPhone("");
      setNewStaffPosition("");
      setSuccessMsg("Colaborador / empleado vinculado correctamente.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al registrar miembro del staff");
    }
  }

  // Handle Create Schedule
  async function handleCreateSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedServiceId) return;
    const token = loadSession()?.accessToken;
    try {
      const created = await api<ScheduleItem>(`/services/${selectedServiceId}/schedules`, {
        method: "POST",
        token,
        body: JSON.stringify({
          dayOfWeek: schedDay,
          startTime: schedStart,
          endTime: schedEnd,
          staffId: schedStaffId || undefined,
          maxConcurrentSlots: 1,
        }),
      });
      setSchedules((prev) => [...prev, created]);
      setSuccessMsg("Franja de horario programada correctamente.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al programar horario");
    }
  }

  // Appointment Actions
  async function confirmAppointment(id: string) {
    const token = loadSession()?.accessToken;
    try {
      const updated = await api<AppointmentItem>(`/appointments/${id}/confirm`, {
        method: "PATCH",
        token,
      });
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
      setSuccessMsg("Cita confirmada correctamente.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al confirmar cita");
    }
  }

  async function completeAppointment(id: string) {
    const token = loadSession()?.accessToken;
    try {
      const updated = await api<AppointmentItem>(`/appointments/${id}/complete`, {
        method: "PATCH",
        token,
      });
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
      setSuccessMsg("Cita marcada como completada.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al completar cita");
    }
  }

  async function handleCancelUnforeseen() {
    if (!cancelModalId) return;
    const token = loadSession()?.accessToken;
    try {
      const updated = await api<AppointmentItem>(`/appointments/${cancelModalId}/cancel-unforeseen`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ reason: cancelReason }),
      });
      setAppointments((prev) => prev.map((a) => (a.id === cancelModalId ? updated : a)));
      setCancelModalId(null);
      setCancelReason("");
      setSuccessMsg("Cita cancelada por imprevisto y notificada al cliente.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cancelar cita");
    }
  }

  // Update Profile
  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    const token = loadSession()?.accessToken;
    try {
      const updated = await api<ProviderProfile>("/providers/profile", {
        method: "PUT",
        token,
        body: JSON.stringify({
          businessName: profile.businessName,
          nitOrTaxId: profile.documentNumber,
          description: profile.description,
          logoUrl: profile.logoUrl,
        }),
      });
      setProfile(updated);
      setSuccessMsg("Perfil comercial actualizado correctamente.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al actualizar perfil");
    }
  }

  if (error && !services.length && !profile) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-lg font-semibold text-red-800">{error}</p>
          <p className="mt-2 text-sm text-red-600">
            Inicia sesión como proveedor (por ejemplo: <strong>deportes@sporthub.co</strong> o <strong>belleza@sporthub.co</strong>).
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Provider Header Banner */}
      <div className="mb-6 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                {profile?.businessName || "Portal de Gestión de Proveedor"}
              </h1>
              {profile?.identityVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  ✓ Verificado Oficial
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                  ⏳ En proceso de verificación
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-600">
              NIT / Registro: {profile?.documentNumber || "No especificado"} · {services.length} servicios activos · {staff.length} colaboradores
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewServiceModal(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-700"
            >
              + Nuevo Servicio
            </button>
            <button
              onClick={() => setShowNewStaffModal(true)}
              className="rounded-md border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-xs hover:bg-gray-50"
            >
              + Vincular Empleado
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="mb-4 rounded-md bg-emerald-50 p-3 text-sm font-medium text-emerald-800 border border-emerald-200">
          ✓ {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm font-medium text-red-800 border border-red-200">
          ⚠ {error}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("services")}
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-semibold transition-colors ${
              activeTab === "services"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            📋 Catálogo de Servicios ({services.length}) (HU-17..22)
          </button>
          <button
            onClick={() => setActiveTab("schedules")}
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-semibold transition-colors ${
              activeTab === "schedules"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            🕒 Horarios & Franjas (HU-23..27)
          </button>
          <button
            onClick={() => setActiveTab("staff")}
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-semibold transition-colors ${
              activeTab === "staff"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            👥 Colaboradores / Staff ({staff.length}) (HU-28..32)
          </button>
          <button
            onClick={() => setActiveTab("appointments")}
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-semibold transition-colors ${
              activeTab === "appointments"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            📅 Citas Recibidas ({appointments.length}) (HU-38..41)
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-semibold transition-colors ${
              activeTab === "profile"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            ⚙ Perfil del Negocio (HU-07, 11)
          </button>
        </nav>
      </div>

      {/* TAB 1: SERVICES */}
      {activeTab === "services" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((serv) => (
              <div
                key={serv.id}
                className="flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-gray-900 text-base">{serv.name}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        serv.active ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {serv.active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-600 line-clamp-3">{serv.description}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                    <span>⏱ {serv.durationMinutes} minutos</span>
                    <span className="text-sm font-bold text-blue-700">
                      ${Number(serv.price).toLocaleString("es-CO")} COP
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                  <button
                    onClick={() => {
                      setSelectedServiceId(serv.id);
                      loadSchedules(serv.id);
                      setActiveTab("schedules");
                    }}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Ver Franjas Horarias →
                  </button>
                  <button
                    onClick={() => toggleServiceActive(serv)}
                    className={`rounded px-2.5 py-1 text-xs font-medium ${
                      serv.active
                        ? "border border-amber-300 text-amber-700 hover:bg-amber-50"
                        : "border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    {serv.active ? "Pausar" : "Reactivar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SCHEDULES */}
      {activeTab === "schedules" && (
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs">
            <h3 className="text-base font-bold text-gray-900 mb-4">
              Configurar Franja Horaria de Servicio (HU-23..HU-27)
            </h3>
            <form onSubmit={handleCreateSchedule} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Servicio</label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => {
                    setSelectedServiceId(e.target.value);
                    loadSchedules(e.target.value);
                  }}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Día de la Semana</label>
                <select
                  value={schedDay}
                  onChange={(e) => setSchedDay(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                >
                  <option value="MONDAY">Lunes</option>
                  <option value="TUESDAY">Martes</option>
                  <option value="WEDNESDAY">Miércoles</option>
                  <option value="THURSDAY">Jueves</option>
                  <option value="FRIDAY">Viernes</option>
                  <option value="SATURDAY">Sábado</option>
                  <option value="SUNDAY">Domingo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Colaborador / Staff</label>
                <select
                  value={schedStaffId}
                  onChange={(e) => setSchedStaffId(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                >
                  <option value="">(Cualquiera disponible)</option>
                  {staff.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} ({st.position})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Inicio</label>
                  <input
                    type="time"
                    value={schedStart}
                    onChange={(e) => setSchedStart(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fin</label>
                  <input
                    type="time"
                    value={schedEnd}
                    onChange={(e) => setSchedEnd(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full rounded-md bg-blue-600 py-2 px-4 text-sm font-semibold text-white shadow-xs hover:bg-blue-700"
                >
                  + Agregar Franja
                </button>
              </div>
            </form>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-xs">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Día</th>
                  <th className="px-4 py-3">Horario</th>
                  <th className="px-4 py-3">Staff Asignado</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                      No hay horarios registrados para este servicio aún.
                    </td>
                  </tr>
                ) : (
                  schedules.map((sc) => (
                    <tr key={sc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-800">{sc.dayOfWeek}</td>
                      <td className="px-4 py-3 text-gray-600">{sc.startTime} – {sc.endTime}</td>
                      <td className="px-4 py-3 text-gray-600">{sc.staffName || "Asignación abierta"}</td>
                      <td className="px-4 py-3">
                        {sc.blocked ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                            Bloqueado (Mantenimiento)
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                            Disponible
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STAFF */}
      {activeTab === "staff" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Personal operativo y especialistas habilitados para la prestación de servicios (HU-28..HU-32).
            </p>
            <button
              onClick={() => setShowNewStaffModal(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-700"
            >
              + Vincular Colaborador
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-xs">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Nombre / Cargo</th>
                  <th className="px-4 py-3">Correo</th>
                  <th className="px-4 py-3">Teléfono</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staff.map((st) => (
                  <tr key={st.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{st.fullName}</p>
                      <p className="text-xs text-blue-600">{st.position || "Especialista"}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{st.email}</td>
                    <td className="px-4 py-3 text-gray-600">{st.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                        {st.active ? "Activo" : "En Vacaciones"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: APPOINTMENTS */}
      {activeTab === "appointments" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Control del ciclo de vida de citas: confirmar solicitudes, registrar culminación o cancelar por fuerza mayor (HU-38..HU-41).
          </p>

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-xs">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Fecha & Hora</th>
                  <th className="px-4 py-3">Folio Cita</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                      No hay citas registradas para este proveedor aún.
                    </td>
                  </tr>
                ) : (
                  appointments.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{a.date}</p>
                        <p className="text-xs text-gray-500">{a.startTime} – {a.endTime}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{a.id}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            a.status === "COMPLETADA"
                              ? "bg-emerald-100 text-emerald-800"
                              : a.status === "CONFIRMADA"
                              ? "bg-blue-100 text-blue-800"
                              : a.status === "SOLICITADA"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {a.status}
                        </span>
                        {a.cancellationReason && (
                          <p className="mt-1 text-xs text-red-600">Motivo: {a.cancellationReason}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {a.status === "SOLICITADA" && (
                            <button
                              onClick={() => confirmAppointment(a.id)}
                              className="rounded bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                            >
                              Confirmar (HU-40)
                            </button>
                          )}
                          {a.status === "CONFIRMADA" && (
                            <button
                              onClick={() => completeAppointment(a.id)}
                              className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              Completar (HU-39)
                            </button>
                          )}
                          {a.status !== "CANCELADA" && a.status !== "COMPLETADA" && (
                            <button
                              onClick={() => {
                                setCancelModalId(a.id);
                                setCancelReason("");
                              }}
                              className="rounded border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                            >
                              Cancelar (HU-41)
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: PROFILE */}
      {activeTab === "profile" && profile && (
        <div className="max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow-xs">
          <h3 className="text-base font-bold text-gray-900 mb-4">
            Actualizar Datos Comerciales del Establecimiento (HU-07, HU-11)
          </h3>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nombre Comercial</label>
              <input
                type="text"
                required
                value={profile.businessName}
                onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">NIT / Cédula Tributaria</label>
              <input
                type="text"
                value={profile.documentNumber || ""}
                onChange={(e) => setProfile({ ...profile, documentNumber: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Descripción del Negocio</label>
              <textarea
                rows={3}
                value={profile.description || ""}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">URL del Logotipo</label>
              <input
                type="url"
                value={profile.logoUrl || ""}
                onChange={(e) => setProfile({ ...profile, logoUrl: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-700"
            >
              Guardar Cambios
            </button>
          </form>
        </div>
      )}

      {/* MODAL: NEW SERVICE */}
      {showNewServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Registrar Nuevo Servicio (HU-17)</h3>
            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre del Servicio</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Fisioterapia Deportiva"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Detalles del servicio, recomendaciones, etc."
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Duración (minutos)</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Precio ($ COP)</label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(Number(e.target.value))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowNewServiceModal(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-xs"
                >
                  Crear Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW STAFF */}
      {showNewStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Vincular Colaborador / Empleado (HU-29)</h3>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Laura Gómez"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="colaborador@sporthub.co"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  placeholder="+57 300 0000000"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Cargo / Especialidad</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Fisioterapeuta / Estilista"
                  value={newStaffPosition}
                  onChange={(e) => setNewStaffPosition(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowNewStaffModal(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-xs"
                >
                  Guardar y Vincular
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CANCEL UNFORESEEN */}
      {cancelModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cancelar Cita por Imprevisto (HU-41)</h3>
            <p className="text-xs text-gray-600 mb-4">
              Indica la justificación o causa de fuerza mayor para notificar al cliente.
            </p>
            <div className="space-y-3">
              <textarea
                rows={3}
                required
                placeholder="Ej: Daño en equipos técnicos / Indisposición de salud de especialista"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:border-red-600 focus:outline-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalId(null)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  disabled={!cancelReason.trim()}
                  onClick={handleCancelUnforeseen}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Confirmar Cancelación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
