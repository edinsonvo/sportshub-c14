"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { loadSession } from "@/lib/auth";
import type { AdminUser, AdminProvider, SystemStats, AuditLogEntry, Role } from "@/lib/types";

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"users" | "providers" | "stats" | "audit">("stats");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Data states
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [providers, setProviders] = useState<AdminProvider[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // User filters
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    const session = loadSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    if (session.role !== "ADMIN") {
      setError("Acceso denegado: este módulo está reservado exclusivamente para Administradores de la plataforma.");
      setLoading(false);
      return;
    }
    loadData();
  }, [router]);

  async function loadData() {
    setLoading(true);
    setError(null);
    const token = loadSession()?.accessToken;
    try {
      const [u, p, s, a] = await Promise.all([
        api<AdminUser[]>("/admin/users", { token }).catch(() => []),
        api<AdminProvider[]>("/admin/providers", { token }).catch(() => []),
        api<SystemStats>("/admin/stats", { token }).catch(() => null),
        api<AuditLogEntry[]>("/admin/audit-logs", { token }).catch(() => []),
      ]);
      setUsers(u);
      setProviders(p);
      setStats(s);
      setAuditLogs(a);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cargar datos administrativos");
    } finally {
      setLoading(false);
    }
  }

  // User Actions
  async function toggleUserStatus(userId: string, currentActive: boolean) {
    const token = loadSession()?.accessToken;
    try {
      await api(`/admin/users/${userId}/status?active=${!currentActive}`, {
        method: "PUT",
        token,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, active: !currentActive } : u))
      );
      setSuccessMsg(`Usuario ${!currentActive ? "activado" : "desactivado"} correctamente`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al actualizar estado del usuario");
    }
  }

  async function deleteUser(userId: string, email: string) {
    if (!confirm(`¿Confirmas la eliminación permanente del usuario ${email}? Esta acción no se puede deshacer.`)) {
      return;
    }
    const token = loadSession()?.accessToken;
    try {
      await api(`/admin/users/${userId}`, {
        method: "DELETE",
        token,
      });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setSuccessMsg(`Usuario ${email} eliminado correctamente`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al eliminar usuario");
    }
  }

  // Provider Verification Action
  async function toggleProviderVerification(providerId: string, currentVerified: boolean) {
    const token = loadSession()?.accessToken;
    try {
      await api(`/admin/providers/${providerId}/verify?verified=${!currentVerified}`, {
        method: "PUT",
        token,
      });
      setProviders((prev) =>
        prev.map((p) =>
          p.id === providerId
            ? { ...p, identityVerified: !currentVerified, verifiedAt: !currentVerified ? new Date().toISOString() : null }
            : p
        )
      );
      setSuccessMsg(`Proveedor ${!currentVerified ? "verificado con distintivo oficial" : "desmarcado"} con éxito`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al verificar proveedor");
    }
  }

  // CSV Export for Statistics
  function exportStatsCSV() {
    if (!stats) return;
    const rows = [
      ["Métrica", "Valor"],
      ["Total Usuarios", stats.totalUsers],
      ["Clientes Registrados", stats.totalClients],
      ["Proveedores Registrados", stats.totalProviders],
      ["Empleados / Staff", stats.totalStaff],
      ["Total Citas", stats.totalAppointments],
      ["Citas Completadas", stats.completedAppointments],
      ["Citas Canceladas", stats.cancelledAppointments],
      ["Instalaciones Deportivas", stats.totalFacilities],
      ["Clases Grupales", stats.totalClasses],
      ["Torneos", stats.totalTournaments],
      ["Ingresos Estimados ($ COP)", stats.estimatedRevenue],
      ["Fecha de Reporte", new Date().toLocaleString("es-CO")],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SportHub_Reporte_Ejecutivo_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // CSV Export for Audit Log
  function exportAuditCSV() {
    if (auditLogs.length === 0) return;
    const header = ["ID", "Fecha", "Acción", "Usuario ID", "Entidad", "Entidad ID", "Detalles", "IP"];
    const rows = auditLogs.map((a) => [
      a.id,
      `"${a.timestamp}"`,
      `"${a.action}"`,
      `"${a.userId ?? ""}"`,
      `"${a.entityType ?? ""}"`,
      `"${a.entityId ?? ""}"`,
      `"${(a.details ?? "").replace(/"/g, '""')}"`,
      `"${a.ipAddress ?? ""}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SportHub_Auditoria_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.phone && u.phone.includes(userSearch));
      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && u.active) ||
        (statusFilter === "INACTIVE" && !u.active);
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, userSearch, roleFilter, statusFilter]);

  if (error && !users.length && !stats) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-lg font-semibold text-red-800">{error}</p>
          <p className="mt-2 text-sm text-red-600">
            Usa el selector superior para iniciar sesión como <strong>admin@sporthub.co</strong>.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Page Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Panel de Administración General
            </h1>
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-800">
              ADMIN
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Supervisión integral de usuarios, verificación de proveedores, métricas de negocio y auditoría del sistema (HU-04, 05, 08, 09, 10, 43, 48, 50).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-xs"
          >
            {loading ? "Actualizando…" : "🔄 Refrescar"}
          </button>
          <button
            onClick={exportStatsCSV}
            className="inline-flex items-center rounded-md bg-purple-700 px-4 py-2 text-sm font-medium text-white hover:bg-purple-800 shadow-xs"
          >
            📊 Exportar Métricas (CSV)
          </button>
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

      {/* Navigation Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("stats")}
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-semibold transition-colors ${
              activeTab === "stats"
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            📊 Métricas & Indicadores (HU-48)
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-semibold transition-colors ${
              activeTab === "users"
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            👥 Gestión de Usuarios ({users.length}) (HU-04, 05, 43)
          </button>
          <button
            onClick={() => setActiveTab("providers")}
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-semibold transition-colors ${
              activeTab === "providers"
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            🏢 Verificación de Proveedores ({providers.length}) (HU-08..10)
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-semibold transition-colors ${
              activeTab === "audit"
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            📜 Registro de Auditoría (HU-50)
          </button>
        </nav>
      </div>

      {/* TAB 1: METRICS & KPI */}
      {activeTab === "stats" && (
        <div className="space-y-6">
          {stats ? (
            <>
              {/* Primary KPIs */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase text-gray-500">Total Usuarios</p>
                    <span className="text-xl">👥</span>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {stats.totalClients} clientes · {stats.totalProviders} proveedores · {stats.totalStaff} empleados
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase text-gray-500">Citas Registradas</p>
                    <span className="text-xl">📅</span>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalAppointments}</p>
                  <p className="mt-1 text-xs text-emerald-600 font-medium">
                    {stats.completedAppointments} completadas · {stats.cancelledAppointments} canceladas
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase text-gray-500">Proveedores Activos</p>
                    <span className="text-xl">🏢</span>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalProviders}</p>
                  <p className="mt-1 text-xs text-blue-600 font-medium">
                    {providers.filter((p) => p.identityVerified).length} verificados con distintivo
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase text-gray-500">Ingresos Estimados</p>
                    <span className="text-xl">💰</span>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    ${Number(stats.estimatedRevenue).toLocaleString("es-CO")}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Moneda legal colombiana (COP)</p>
                </div>
              </div>

              {/* Secondary Stats Grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs">
                  <h3 className="text-base font-bold text-gray-900">Módulos Deportivos Activos</h3>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-md bg-gray-50 p-3">
                      <p className="text-2xl font-bold text-purple-700">{stats.totalFacilities}</p>
                      <p className="text-xs font-medium text-gray-600">Instalaciones</p>
                    </div>
                    <div className="rounded-md bg-gray-50 p-3">
                      <p className="text-2xl font-bold text-purple-700">{stats.totalClasses}</p>
                      <p className="text-xs font-medium text-gray-600">Clases Grupales</p>
                    </div>
                    <div className="rounded-md bg-gray-50 p-3">
                      <p className="text-2xl font-bold text-purple-700">{stats.totalTournaments}</p>
                      <p className="text-xs font-medium text-gray-600">Torneos</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs">
                  <h3 className="text-base font-bold text-gray-900">Distribución de Citas por Estado</h3>
                  <div className="mt-4 space-y-3">
                    {Object.entries(stats.appointmentsByStatus || {}).map(([st, cnt]) => {
                      const total = stats.totalAppointments || 1;
                      const pct = Math.round((Number(cnt) / total) * 100);
                      return (
                        <div key={st}>
                          <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                            <span>{st}</span>
                            <span>{cnt} citas ({pct}%)</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                st === "COMPLETADA"
                                  ? "bg-emerald-500"
                                  : st === "CONFIRMADA"
                                  ? "bg-blue-500"
                                  : st === "SOLICITADA"
                                  ? "bg-amber-500"
                                  : "bg-red-400"
                              }`}
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">Cargando métricas del sistema…</p>
          )}
        </div>
      )}

      {/* TAB 2: USERS MANAGEMENT */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-xs">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar por nombre, correo o teléfono…"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-600 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-600 focus:outline-none"
              >
                <option value="ALL">Todos los roles</option>
                <option value="ADMIN">ADMIN</option>
                <option value="PROVIDER">PROVIDER</option>
                <option value="STAFF">STAFF</option>
                <option value="CLIENT">CLIENT</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-600 focus:outline-none"
              >
                <option value="ALL">Todos los estados</option>
                <option value="ACTIVE">Activos</option>
                <option value="INACTIVE">Inactivos</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-xs">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Usuario / Nombre</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Teléfono</th>
                  <th className="px-4 py-3">MFA</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                      No se encontraron usuarios coincidentes con los filtros.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{u.fullName}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            u.role === "ADMIN"
                              ? "bg-purple-100 text-purple-800"
                              : u.role === "PROVIDER"
                              ? "bg-blue-100 text-blue-800"
                              : u.role === "STAFF"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.phone || "—"}</td>
                      <td className="px-4 py-3">
                        {u.mfaEnabled ? (
                          <span className="inline-flex items-center text-xs font-medium text-emerald-700">
                            🔒 Activado
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Inactivo</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.active ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleUserStatus(u.id, u.active)}
                            className={`rounded px-2.5 py-1 text-xs font-medium ${
                              u.active
                                ? "border border-amber-300 text-amber-800 hover:bg-amber-50"
                                : "border border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                            }`}
                          >
                            {u.active ? "Desactivar" : "Activar"}
                          </button>
                          <button
                            onClick={() => deleteUser(u.id, u.email)}
                            className="rounded border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                          >
                            Eliminar
                          </button>
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

      {/* TAB 3: PROVIDER VERIFICATION */}
      {activeTab === "providers" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            <strong>Verificación y Cumplimiento de Proveedores (HU-08..HU-10):</strong> El distintivo de verificación oficial certifica que la identidad mercantil, NIT y habilitación del proveedor fueron validados por la administración.
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {providers.map((p) => (
              <div key={p.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{p.businessName}</h3>
                      <p className="text-xs text-gray-500">Documento / NIT: {p.documentNumber || "No especificado"}</p>
                    </div>
                    {p.identityVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                        ✓ Verificado Oficial
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                        ⏳ Pendiente de Verificación
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-b border-gray-100 py-2 my-2 text-gray-600">
                    <div>
                      <span className="font-medium">Contacto:</span> {p.userFullName}
                      <p className="text-gray-400">{p.userEmail}</p>
                    </div>
                    <div>
                      <span className="font-medium">Equipo:</span> {p.staffCount} colaboradores
                      <p className="font-medium">Servicios: <span className="text-purple-700">{p.servicesCount}</span></p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2">
                  <span className="text-xs text-gray-400">
                    {p.identityVerified ? "Distintivo visible en catálogo público" : "Requiere validación de RUT"}
                  </span>
                  <button
                    onClick={() => toggleProviderVerification(p.id, p.identityVerified)}
                    className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      p.identityVerified
                        ? "border border-gray-300 text-gray-700 hover:bg-gray-50"
                        : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                    }`}
                  >
                    {p.identityVerified ? "Revocar Verificación" : "✓ Verificar Proveedor"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOG */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Pista inmutable de auditoría para trazabilidad de eventos y seguridad de la información (HU-50).
            </p>
            <button
              onClick={exportAuditCSV}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-xs"
            >
              Descargar Pista de Auditoría (CSV)
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-xs">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Fecha y Hora</th>
                  <th className="px-4 py-3">Acción</th>
                  <th className="px-4 py-3">Usuario ID</th>
                  <th className="px-4 py-3">Entidad</th>
                  <th className="px-4 py-3">Detalles</th>
                  <th className="px-4 py-3">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                      No hay registros de auditoría almacenados aún.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-mono text-gray-600">
                        {new Date(log.timestamp).toLocaleString("es-CO")}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-gray-900">{log.action}</td>
                      <td className="px-4 py-2.5 font-mono text-gray-500">{log.userId ?? "—"}</td>
                      <td className="px-4 py-2.5 text-gray-600">
                        {log.entityType ? `${log.entityType} (${log.entityId ?? ""})` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-gray-700 max-w-xs truncate" title={log.details ?? ""}>
                        {log.details ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 font-mono">{log.ipAddress ?? "local"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
