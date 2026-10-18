"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { clearSession, loadSession } from "@/lib/auth";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/app/components/ui/Card";

interface Appointment {
  id: string;
  providerServiceId: string;
  providerId: string;
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  cancellationReason?: string | null;
}

const DEMO_SERVICE_ID = process.env.NEXT_PUBLIC_DEMO_SERVICE_ID ?? "";

export default function DashboardPage() {
  const router = useRouter();
  const session = typeof window !== "undefined" ? loadSession() : null;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [slots, setSlots] = useState<Array<{ start: string; end: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loadSession()) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = loadSession()?.accessToken;
        const mine = await api<Appointment[]>("/appointments", { token });
        if (!cancelled) setAppointments(mine);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
        } else if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar citas");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function loadAvailability() {
    if (!DEMO_SERVICE_ID) {
      setError("Configura NEXT_PUBLIC_DEMO_SERVICE_ID para probar la disponibilidad");
      return;
    }
    setError(null);
    try {
      const date = new Date().toISOString().slice(0, 10);
      const token = loadSession()?.accessToken;
      const data = await api<Array<{ start: string; end: string }>>(
        `/appointments/availability?serviceId=${DEMO_SERVICE_ID}&date=${date}`,
        { token },
      );
      setSlots(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo consultar disponibilidad");
    }
  }

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mis citas</h1>
          {session ? (
            <p className="text-sm text-gray-500">{session.email} · {session.role}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={loadAvailability}>
            Ver disponibilidad
          </Button>
          <Button variant="ghost" onClick={() => router.push("/ajustes")}>
            Seguridad (MFA)
          </Button>
          <Button variant="ghost" onClick={() => router.push("/deportes")}>
            Deportes
          </Button>
          <Button variant="ghost" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </div>
      </header>

      {error ? (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {slots.length > 0 ? (
        <Card className="mb-8">
          <CardHeader>
            <h2 className="font-semibold">Franjas disponibles hoy</h2>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {slots.map((slot) => (
                <li
                  key={slot.start}
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                >
                  {new Date(slot.start).toLocaleTimeString("es-CO", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {loading ? (
        <p className="text-sm text-gray-500" role="status">
          Cargando citas…
        </p>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Citas programadas</h2>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="text-sm text-gray-500">Aún no tienes citas programadas.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-gray-100">
                {appointments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{a.date} · {a.startTime}–{a.endTime}</p>
                      <p className="text-xs text-gray-500">Folio {a.id}</p>
                    </div>
                    <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                      {a.status.replaceAll("_", " ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}