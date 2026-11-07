"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { loadSession } from "@/lib/auth";
import type { AppointmentItem } from "@/lib/types";

export default function EmpleadoPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "CONFIRMED" | "COMPLETED">("ALL");

  useEffect(() => {
    const session = loadSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    if (session.role !== "STAFF" && session.role !== "PROVIDER" && session.role !== "ADMIN") {
      setError("Acceso exclusivo para Colaboradores y Personal Operativo (STAFF).");
      setLoading(false);
      return;
    }
    loadStaffAppointments();
  }, [router]);

  async function loadStaffAppointments() {
    setLoading(true);
    setError(null);
    const token = loadSession()?.accessToken;
    try {
      // First try /staff/me/appointments; fallback to /appointments
      const data = await api<AppointmentItem[]>("/staff/me/appointments", { token }).catch(() =>
        api<AppointmentItem[]>("/appointments", { token })
      );
      setAppointments(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cargar agenda");
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteAppointment(id: string) {
    const token = loadSession()?.accessToken;
    try {
      const updated = await api<AppointmentItem>(`/appointments/${id}/complete`, {
        method: "PATCH",
        token,
      });
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
      setSuccessMsg("¡Servicio registrado como completado con éxito! (HU-39)");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al completar la cita");
    }
  }

  const filteredAppointments = appointments.filter((a) => {
    if (filter === "CONFIRMED") return a.status === "CONFIRMADA" || a.status === "SOLICITADA";
    if (filter === "COMPLETED") return a.status === "COMPLETADA";
    return true;
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/60 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Agenda Operativa de Empleado
              </h1>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                STAFF
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Visualiza tus turnos diarios, citas programadas y registra la atención completada de clientes (HU-25, HU-35, HU-39).
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadStaffAppointments}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50"
            >
              🔄 Actualizar
            </button>
            <Link
              href="/deportes/clases"
              className="rounded-md bg-amber-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-800"
            >
              Ver Clases Grupales →
            </Link>
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

      {/* Filter Tabs */}
      <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("ALL")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === "ALL" ? "bg-amber-700 text-white" : "bg-white text-gray-700 border border-gray-200"
            }`}
          >
            Todas ({appointments.length})
          </button>
          <button
            onClick={() => setFilter("CONFIRMED")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === "CONFIRMED" ? "bg-amber-700 text-white" : "bg-white text-gray-700 border border-gray-200"
            }`}
          >
            Pendientes / Confirmadas
          </button>
          <button
            onClick={() => setFilter("COMPLETED")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === "COMPLETED" ? "bg-amber-700 text-white" : "bg-white text-gray-700 border border-gray-200"
            }`}
          >
            Completadas
          </button>
        </div>
        <p className="text-xs text-gray-500">Hoy: {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* Appointments List */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-gray-500">Cargando agenda de citas…</p>
        ) : filteredAppointments.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            No tienes citas asignadas en esta vista.
          </div>
        ) : (
          filteredAppointments.map((a) => (
            <div
              key={a.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-xs hover:border-amber-300 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-bold">
                  <span className="text-xs uppercase">{a.date.slice(5, 7)}</span>
                  <span className="text-base">{a.date.slice(8, 10)}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900">
                      {a.startTime} – {a.endTime}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
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
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Folio ID: <span className="font-mono">{a.id}</span></p>
                  <p className="text-xs text-gray-600">Cliente asignado: <span className="font-mono">{a.clientId}</span></p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {a.status !== "COMPLETADA" && a.status !== "CANCELADA" && (
                  <button
                    onClick={() => handleCompleteAppointment(a.id)}
                    className="rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
                  >
                    ✓ Marcar Completada (HU-39)
                  </button>
                )}
                {a.status === "COMPLETADA" && (
                  <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                    ✓ Finalizada y registrada
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
