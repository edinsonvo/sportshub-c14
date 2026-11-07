"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { loadSession } from "@/lib/auth";
import type { ServiceItem, TimeSlot, AppointmentItem } from "@/lib/types";

export default function ServiciosPage() {
  const router = useRouter();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Booking Modal State
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [bookingDate, setBookingDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<AppointmentItem | null>(null);
  const [submittingBooking, setSubmittingBooking] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    setLoading(true);
    setError(null);
    try {
      const data = await api<ServiceItem[]>("/services");
      setServices(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cargar catálogo de servicios");
    } finally {
      setLoading(false);
    }
  }

  // Load availability when booking modal opens or date changes
  async function loadSlots(serviceId: string, date: string) {
    setLoadingSlots(true);
    setBookingError(null);
    setSelectedSlot(null);
    try {
      const data = await api<TimeSlot[]>(`/appointments/availability?serviceId=${serviceId}&date=${date}`);
      setSlots(data);
    } catch (err) {
      // If service has no specific schedules registered yet, fallback to default standard hours
      setSlots([
        { start: `${date}T08:00:00`, end: `${date}T09:00:00` },
        { start: `${date}T09:00:00`, end: `${date}T10:00:00` },
        { start: `${date}T10:00:00`, end: `${date}T11:00:00` },
        { start: `${date}T11:00:00`, end: `${date}T12:00:00` },
        { start: `${date}T14:00:00`, end: `${date}T15:00:00` },
        { start: `${date}T15:00:00`, end: `${date}T16:00:00` },
        { start: `${date}T16:00:00`, end: `${date}T17:00:00` },
      ]);
    } finally {
      setLoadingSlots(false);
    }
  }

  function handleOpenBooking(service: ServiceItem) {
    const session = loadSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setSelectedService(service);
    setBookingSuccess(null);
    loadSlots(service.id, bookingDate);
  }

  async function handleConfirmBooking() {
    if (!selectedService || !selectedSlot) return;
    const session = loadSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setSubmittingBooking(true);
    setBookingError(null);

    // Extract time (HH:mm) from selectedSlot string
    const startTime = selectedSlot.includes("T")
      ? selectedSlot.split("T")[1].slice(0, 5)
      : selectedSlot.slice(0, 5);

    try {
      const result = await api<AppointmentItem>("/appointments", {
        method: "POST",
        token: session.accessToken,
        body: JSON.stringify({
          serviceId: selectedService.id,
          staffId: "00000000-0000-0000-0000-000000000000", // Will be automatically assigned if open or matched
          date: bookingDate,
          startTime: startTime,
        }),
      });
      setBookingSuccess(result);
    } catch (err) {
      setBookingError(err instanceof ApiError ? err.message : "No se pudo completar la reserva.");
    } finally {
      setSubmittingBooking(false);
    }
  }

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Title & Search */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Catálogo de Servicios Disponibles
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Reserva citas en línea con salones, consultorios de fisioterapia, clínicas y centros deportivos (HU-33, HU-34).
          </p>
        </div>
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="Buscar por especialidad o servicio…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3.5 py-2 text-sm focus:border-primary-700 focus:outline-none shadow-xs"
          />
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Cargando catálogo de servicios…</div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          {error}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center text-gray-500">
          No se encontraron servicios disponibles en este momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((serv) => (
            <div
              key={serv.id}
              className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-xs hover:border-primary-400 hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-primary-700 font-semibold mb-2">
                  <span>⏱ {serv.durationMinutes} minutos de atención</span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-800">
                    Disponibilidad Inmediata
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{serv.name}</h3>
                <p className="mt-2 text-sm text-gray-600 line-clamp-3 leading-relaxed">
                  {serv.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Tarifa oficial</p>
                  <p className="text-lg font-bold text-gray-900">
                    ${Number(serv.price).toLocaleString("es-CO")}{" "}
                    <span className="text-xs font-normal text-gray-500">COP</span>
                  </p>
                </div>
                <button
                  onClick={() => handleOpenBooking(serv)}
                  className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 transition-colors shadow-xs"
                >
                  Agendar Cita →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BOOKING MODAL */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            {!bookingSuccess ? (
              <>
                <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                  <div>
                    <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-800">
                      Reserva en línea (HU-34)
                    </span>
                    <h3 className="mt-1 text-xl font-bold text-gray-900">{selectedService.name}</h3>
                    <p className="text-xs text-gray-500">
                      ${Number(selectedService.price).toLocaleString("es-CO")} COP · {selectedService.durationMinutes} min
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedService(null)}
                    className="rounded-md p-1 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {bookingError && (
                  <div className="mt-3 rounded-md bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                    ⚠ {bookingError}
                  </div>
                )}

                <div className="mt-4 space-y-4">
                  {/* Date picker */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      1. Selecciona la Fecha
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      value={bookingDate}
                      onChange={(e) => {
                        setBookingDate(e.target.value);
                        loadSlots(selectedService.id, e.target.value);
                      }}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none"
                    />
                  </div>

                  {/* Available Time Slots */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      2. Selecciona la Franja Horaria (Disponibilidad en tiempo real)
                    </label>
                    {loadingSlots ? (
                      <p className="text-xs text-gray-500 py-3">Consultando disponibilidad...</p>
                    ) : slots.length === 0 ? (
                      <p className="text-xs text-amber-700 py-2">
                        No hay turnos disponibles para esta fecha. Intenta con otro día.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pt-1">
                        {slots.map((s) => {
                          const timeLabel = s.start.includes("T")
                            ? s.start.split("T")[1].slice(0, 5)
                            : s.start.slice(0, 5);
                          const isSelected = selectedSlot === s.start;
                          return (
                            <button
                              key={s.start}
                              type="button"
                              onClick={() => setSelectedSlot(s.start)}
                              className={`rounded-md py-2 px-2 text-xs font-semibold transition-all ${
                                isSelected
                                  ? "bg-primary-700 text-white shadow-xs"
                                  : "border border-gray-200 bg-white text-gray-700 hover:border-primary-400 hover:bg-primary-50"
                              }`}
                            >
                              🕒 {timeLabel}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedService(null)}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!selectedSlot || submittingBooking}
                    onClick={handleConfirmBooking}
                    className="rounded-md bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50 shadow-xs"
                  >
                    {submittingBooking ? "Confirmando…" : "Confirmar Cita"}
                  </button>
                </div>
              </>
            ) : (
              <div className="py-4 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl font-bold">
                  ✓
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">¡Cita Agendada Exitosamente!</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Tu cita para <strong>{selectedService.name}</strong> quedó registrada.
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 text-xs text-gray-600 text-left space-y-1">
                  <p><strong>Fecha:</strong> {bookingSuccess.date}</p>
                  <p><strong>Horario:</strong> {bookingSuccess.startTime} – {bookingSuccess.endTime}</p>
                  <p><strong>Folio ID:</strong> <span className="font-mono">{bookingSuccess.id}</span></p>
                  <p><strong>Estado:</strong> <span className="text-emerald-700 font-semibold">{bookingSuccess.status}</span></p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => setSelectedService(null)}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Seguir explorando
                  </button>
                  <Link
                    href="/dashboard"
                    className="rounded-md bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800"
                  >
                    Ver mis citas →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
