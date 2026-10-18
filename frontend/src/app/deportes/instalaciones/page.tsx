"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { loadSession, type Session } from "@/lib/auth";
import {
  cancelarReservaInstalacion,
  crearInstalacion,
  getDisponibilidad,
  getInstalaciones,
  getMisReservasInstalaciones,
  reservarInstalacion,
  solicitarListaEspera,
  bloquearMantenimiento,
  type CrearInstalacionBody,
  type Franja,
  type Instalacion,
  type ReservaInstalacion,
  type TipoInstalacion,
} from "@/lib/deportes";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { Card, CardContent, CardHeader } from "@/app/components/ui/Card";
import { DeportesNav } from "@/app/components/DeportesNav";

const TIPOS: TipoInstalacion[] = ["CANCHA", "SALA", "PISCINA", "GIMNASIO"];

const money = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(v);
const hora = (t: string | null | undefined) =>
  t ? t.slice(0, 5) : "";
const hoy = () => new Date().toISOString().slice(0, 10);

export default function InstalacionesPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [instalaciones, setInstalaciones] = useState<Instalacion[]>([]);
  const [misReservas, setMisReservas] = useState<ReservaInstalacion[]>([]);
  const [franjas, setFranjas] = useState<Franja[]>([]);
  const [availInst, setAvailInst] = useState("");
  const [availDate, setAvailDate] = useState(hoy());
  const [crear, setCrear] = useState<CrearInstalacionBody>({
    nombre: "",
    tipo: "CANCHA",
    capacidad: 20,
    tarifaPorHora: 50000,
    horaApertura: "06:00",
    horaCierre: "22:00",
  });
  const [mant, setMant] = useState<{ instalacionId: string; fecha: string; horaInicio: string; horaFin: string; motivo: string }>({
    instalacionId: "",
    fecha: hoy(),
    horaInicio: "06:00",
    horaFin: "07:00",
    motivo: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (s?: Session | null, token?: string) => {
    const tk = token ?? s?.accessToken ?? loadSession()?.accessToken;
    if (!tk) return;
    try {
      const l = await getInstalaciones(tk);
      setInstalaciones(l);
      if (s?.role === "CLIENT") {
        setMisReservas(await getMisReservasInstalaciones(tk));
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) router.replace("/login");
      else setError(err instanceof Error ? err.message : "Error al cargar instalaciones");
    }
  }, [router]);

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    setSession(s);
    refresh(s);
  }, [router, refresh]);

  async function consultarDisponibilidad() {
    const token = session?.accessToken;
    if (!token || !availInst) return;
    setError(null);
    try {
      setFranjas(await getDisponibilidad(availInst, availDate, token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo consultar la disponibilidad");
    }
  }

  async function onReservar(franja: Franja) {
    const token = session?.accessToken;
    if (!token) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await reservarInstalacion(availInst, { fecha: availDate, horaInicio: franja.inicio }, token);
      setMessage("Turno reservado correctamente.");
      await Promise.all([consultarDisponibilidad(), refresh(null, token)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reservar el turno");
    } finally {
      setBusy(false);
    }
  }

  async function onListaEspera(franja: Franja) {
    const token = session?.accessToken;
    if (!token) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const solicitud = await solicitarListaEspera(availInst, { fecha: availDate, horaInicio: franja.inicio }, token);
      setMessage(`Solicitud creada en la lista de espera (${solicitud.id.slice(0, 8)}…).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo solicitar la lista de espera");
    } finally {
      setBusy(false);
    }
  }

  async function onCancelarReserva(reservaId: string) {
    const token = session?.accessToken;
    if (!token) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await cancelarReservaInstalacion(reservaId, token);
      setMessage("Reserva cancelada. Si había lista de espera, se promovió automáticamente.");
      await refresh(null, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cancelar la reserva");
    } finally {
      setBusy(false);
    }
  }

  async function onCreateInstalacion() {
    const token = session?.accessToken;
    if (!token) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await crearInstalacion({ ...crear, tarifaPorHora: Number(crear.tarifaPorHora) }, token);
      setMessage("Instalación registrada correctamente.");
      setCrear({ nombre: "", tipo: "CANCHA", capacidad: 20, tarifaPorHora: 50000, horaApertura: "06:00", horaCierre: "22:00" });
      await refresh(null, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la instalación");
    } finally {
      setBusy(false);
    }
  }

  async function onMantenimiento() {
    const token = session?.accessToken;
    if (!token || !mant.instalacionId) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await bloquearMantenimiento(mant.instalacionId, mant, token);
      setMessage("Mantenimiento agendado, la franja quedó bloqueada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agendar el mantenimiento");
    } finally {
      setBusy(false);
    }
  }

  const role = session?.role;
  const puedeCrear = role === "PROVIDER";
  const puedeBloquear = role === "PROVIDER" || role === "ADMIN";

  return session ? (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Instalaciones deportivas</h1>
          <p className="text-sm text-gray-500">Reserva por turnos de una hora · rol {role}</p>
        </div>
      </header>
      <DeportesNav />

      {error ? (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>
      ) : null}
      {message ? (
        <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700" role="status">{message}</p>
      ) : null}

      {puedeCrear ? (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-semibold">Registrar instalación</h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input label="Nombre" name="nombre" value={crear.nombre} onChange={(e) => setCrear({ ...crear, nombre: e.target.value })} />
              <Select label="Tipo" name="tipo" value={crear.tipo} onChange={(e) => setCrear({ ...crear, tipo: e.target.value as TipoInstalacion })}>
                {TIPOS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
              <Input label="Capacidad" name="capacidad" type="number" min={1} value={crear.capacidad} onChange={(e) => setCrear({ ...crear, capacidad: Number(e.target.value) })} />
              <Input label="Tarifa por hora (COP)" name="tarifa" type="number" min={0} value={crear.tarifaPorHora} onChange={(e) => setCrear({ ...crear, tarifaPorHora: Number(e.target.value) })} />
              <Input label="Apertura" name="apertura" type="time" value={crear.horaApertura} onChange={(e) => setCrear({ ...crear, horaApertura: e.target.value })} />
              <Input label="Cierre" name="cierre" type="time" value={crear.horaCierre} onChange={(e) => setCrear({ ...crear, horaCierre: e.target.value })} />
            </div>
            <div>
              <Button onClick={onCreateInstalacion} disabled={busy || !crear.nombre}>
                {busy ? "Procesando…" : "Registrar instalación"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {puedeBloquear ? (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-semibold">Bloquear por mantenimiento</h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Select label="Instalación" name="mant-inst" value={mant.instalacionId} onChange={(e) => setMant({ ...mant, instalacionId: e.target.value })}>
                <option value="">Selecciona…</option>
                {instalaciones.map((i) => (
                  <option key={i.id} value={i.id}>{i.nombre}</option>
                ))}
              </Select>
              <Input label="Fecha" name="mant-fecha" type="date" value={mant.fecha} onChange={(e) => setMant({ ...mant, fecha: e.target.value })} />
              <Input label="Desde" name="mant-desde" type="time" value={mant.horaInicio} onChange={(e) => setMant({ ...mant, horaInicio: e.target.value })} />
              <Input label="Hasta" name="mant-hasta" type="time" value={mant.horaFin} onChange={(e) => setMant({ ...mant, horaFin: e.target.value })} />
              <Input label="Motivo" name="mant-motivo" value={mant.motivo} onChange={(e) => setMant({ ...mant, motivo: e.target.value })} />
            </div>
            <div>
              <Button variant="secondary" onClick={onMantenimiento} disabled={busy || !mant.instalacionId}>
                Agendar mantenimiento
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold">Consultar disponibilidad</h2>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Instalación" name="disp-inst" value={availInst} onChange={(e) => setAvailInst(e.target.value)}>
              <option value="">Selecciona…</option>
              {instalaciones.map((i) => (
                <option key={i.id} value={i.id}>{i.nombre}</option>
              ))}
            </Select>
            <Input label="Fecha" name="disp-date" type="date" value={availDate} onChange={(e) => setAvailDate(e.target.value)} />
            <div className="flex items-end">
              <Button variant="secondary" onClick={consultarDisponibilidad} disabled={!availInst}>
                Consultar
              </Button>
            </div>
          </div>
          {franjas.length > 0 ? (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {franjas.map((f) => (
                <li key={f.inicio} className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium">{hora(f.inicio)}–{hora(f.fin)}</span>
                    <span className="ml-2 text-xs text-gray-500">
                      {f.disponibles > 0 ? `${f.disponibles} cupo(s)` : "sin cupo"}
                    </span>
                  </div>
                  {role === "CLIENT" ? (
                    f.disponibles > 0 ? (
                      <Button onClick={() => onReservar(f)} disabled={busy}>Reservar</Button>
                    ) : (
                      <Button variant="ghost" onClick={() => onListaEspera(f)} disabled={busy}>
                        Lista de espera
                      </Button>
                    )
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold">Instalaciones</h2>
        </CardHeader>
        <CardContent>
          {instalaciones.length === 0 ? (
            <p className="text-sm text-gray-500">No hay instalaciones.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-gray-100">
              {instalaciones.map((i) => (
                <li key={i.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {i.nombre} <span className="text-xs text-gray-400">· {i.tipo}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Capacidad {i.capacidad} · {hora(i.horaApertura)}–{hora(i.horaCierre)} · {money(Number(i.tarifaPorHora))}/hora
                      {i.activa ? "" : " · inactiva"}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${i.activa ? "bg-primary-50 text-primary-700" : "bg-gray-100 text-gray-500"}`}>
                    {i.activa ? "Activa" : "Inactiva"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {role === "CLIENT" ? (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Mis reservas</h2>
          </CardHeader>
          <CardContent>
            {misReservas.length === 0 ? (
              <p className="text-sm text-gray-500">Aún no tienes reservas.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-gray-100">
                {misReservas.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{r.fecha} · {hora(r.horaInicio)}–{hora(r.horaFin)}</p>
                      <p className="text-xs text-gray-500">Folio {r.id.slice(0, 8)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                        {r.estado.replaceAll("_", " ")}
                      </span>
                      {r.estado === "RESERVADA" ? (
                        <Button variant="ghost" onClick={() => onCancelarReserva(r.id)} disabled={busy}>
                          Cancelar
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}
    </main>
  ) : null;
}