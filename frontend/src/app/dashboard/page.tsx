"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { loadSession } from "@/lib/auth";
import type { AppointmentItem } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState(typeof window !== "undefined" ? loadSession() : null);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Status Filter
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Cancel Modal State
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Reschedule Modal State
  const [rescheduleModalId, setRescheduleModalId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("09:00");
  const [rescheduling, setRescheduling] = useState(false);

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    setSession(s);
    loadAppointments();
  }, [router]);

  async function loadAppointments() {
    setLoading(true);
    setError(null);
    const token = loadSession()?.accessToken;
    try {
      const data = await api<AppointmentItem[]>("/appointments", { token });
      setAppointments(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
      } else {
        setError(err instanceof Error ? err.message : "Error al cargar las citas");
      }
    } finally {
      setLoading(false);
    }
  }

  // Handle Client Cancellation (HU-37)
  async function handleCancelAppointment() {
    if (!cancelModalId) return;
    setCancelling(true);
    const token = loadSession()?.accessToken;
    try {
      const updated = await api<AppointmentItem>(`/appointments/${cancelModalId}/cancel`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ reason: cancelReason }),
      });
      setAppointments((prev) => prev.map((a) => (a.id === cancelModalId ? updated : a)));
      setCancelModalId(null);
      setCancelReason("");
      setSuccessMsg("Cita cancelada con éxito (HU-37).");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cancelar la cita.");
    } finally {
      setCancelling(false);
    }
  }

  // Handle Reschedule Appointment (HU-36)
  async function handleRescheduleAppointment() {
    if (!rescheduleModalId || !rescheduleDate || !rescheduleTime) return;
    setRescheduling(true);
    const token = loadSession()?.accessToken;
    try {
      const updated = await api<AppointmentItem>(`/appointments/${rescheduleModalId}/reschedule`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          newDate: rescheduleDate,
          newStartTime: rescheduleTime,
        }),
      });
      setAppointments((prev) => prev.map((a) => (a.id === rescheduleModalId ? updated : a)));
      setRescheduleModalId(null);
      setSuccessMsg("Cita reprogramada exitosamente (HU-36).");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo reprogramar la cita.");
    } finally {
      setRescheduling(false);
    }
  }

  const filteredAppointments = appointments.filter((a) => {
    if (statusFilter === "ALL") return true;
    return a.status === statusFilter;
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Welcome Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Panel de Mis Citas & Reservas
            </h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              {session?.role ?? "CLIENT"}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {session?.email} · Gestiona el estado de tus citas, cancela o reprograma turnos en línea (HU-35..HU-37).
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/servicios"
            className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-800 transition-colors"
          >
            + Agendar Nuevo Servicio
          </Link>
          <Link
            href="/deportes/instalaciones"
            className="rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-xs hover:bg-gray-50 transition-colors"
          >
            Reservar Canchas →
          </Link>
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

      {/* Filters Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <div className="flex flex-wrap gap-2">
          {["ALL", "SOLICITADA", "CONFIRMADA", "COMPLETADA", "CANCELADA"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? "bg-primary-700 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {st === "ALL" ? `Todas (${appointments.length})` : st}
            </button>
          ))}
        </div>
        <button
          onClick={loadAppointments}
          className="text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Cargando citas programadas…</div>
      ) : filteredAppointments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-base font-semibold text-gray-900">No tienes citas en esta sección</p>
          <p className="mt-1 text-sm text-gray-500">
            Explora los servicios disponibles para agendar tu primera cita con especialistas o canchas.
          </p>
          <div className="mt-4">
            <Link
              href="/servicios"
              className="inline-flex rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800"
            >
              Explorar Catálogo →
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((a) => (
            <div
              key={a.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-primary-50 text-primary-900 font-bold border border-primary-200">
                  <span className="text-xs uppercase">{a.date.slice(5, 7)}</span>
                  <span className="text-lg leading-none">{a.date.slice(8, 10)}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold text-gray-900">
                      {a.date} · {a.startTime} – {a.endTime}
                    </p>
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
                  </div>
                  <p className="mt-1 text-xs text-gray-500 font-mono">Folio: {a.id}</p>
                  {a.cancellationReason && (
                    <p className="mt-1 text-xs text-red-600">
                      <strong>Motivo cancelación:</strong> {a.cancellationReason}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {a.status !== "CANCELADA" && a.status !== "COMPLETADA" && (
                  <>
                    <button
                      onClick={() => {
                        setRescheduleModalId(a.id);
                        setRescheduleDate(a.date);
                        setRescheduleTime(a.startTime);
                      }}
                      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-xs"
                    >
                      Reprogramar (HU-36)
                    </button>
                    <button
                      onClick={() => {
                        setCancelModalId(a.id);
                        setCancelReason("");
                      }}
                      className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 shadow-xs"
                    >
                      Cancelar (HU-37)
                    </button>
                  </>
                )}
                {a.status === "COMPLETADA" && (
                  <span className="text-xs font-semibold text-emerald-700">✓ Servicio Concluido</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: CANCEL APPOINTMENT */}
      {cancelModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cancelar Cita (HU-37)</h3>
            <p className="text-xs text-gray-600 mb-4">
              ¿Seguro que deseas cancelar esta cita? Por favor indica el motivo para el proveedor.
            </p>
            <div className="space-y-3">
              <textarea
                rows={3}
                placeholder="Motivo de cancelación (ej. cambio de horario de trabajo)..."
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
                  disabled={cancelling}
                  onClick={handleCancelAppointment}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {cancelling ? "Cancelando…" : "Confirmar Cancelación"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESCHEDULE APPOINTMENT */}
      {rescheduleModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reprogramar Cita (HU-36)</h3>
            <p className="text-xs text-gray-600 mb-4">
              Selecciona una nueva fecha y hora de atención para tu reserva.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nueva Fecha</label>
                <input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nueva Hora de Inicio</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setRescheduleModalId(null)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  disabled={rescheduling || !rescheduleDate || !rescheduleTime}
                  onClick={handleRescheduleAppointment}
                  className="rounded-md bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50"
                >
                  {rescheduling ? "Guardando…" : "Confirmar Reprogramación"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
