"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { loadSession, type Session } from "@/lib/auth";
import {
  crearImplemento,
  devolverImplemento,
  getDisponibilidadImplemento,
  getGestionReservasImplementos,
  getImplementos,
  getMisReservasImplementos,
  prestarImplemento,
  reservarImplemento,
  type CondicionImplemento,
  type CrearImplementoBody,
  type Implemento,
  type ReservaImplemento,
  type ReservaImplementoGestion,
} from "@/lib/deportes";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { Card, CardContent, CardHeader } from "@/app/components/ui/Card";
import { DeportesNav } from "@/app/components/DeportesNav";

const money = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(v);
const hoy = () => new Date().toISOString().slice(0, 10);
const CONDICIONES: CondicionImplemento[] = ["BUENO", "DANADO", "PERDIDO"];

export default function ImplementosPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [implementos, setImplementos] = useState<Implemento[]>([]);
  const [mis, setMis] = useState<ReservaImplemento[]>([]);
  const [gestion, setGestion] = useState<ReservaImplementoGestion[]>([]);
  const [crear, setCrear] = useState<CrearImplementoBody>({ nombre: "", tipo: "", cantidadTotal: 5, tarifa: 15000 });
  const [reserva, setReserva] = useState({ implementoId: "", fecha: hoy(), cantidad: 1 });
  const [disponible, setDisponible] = useState<number | null>(null);
  const [devolverId, setDevolverId] = useState("");
  const [condicion, setCondicion] = useState<CondicionImplemento>("BUENO");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (s?: Session | null, token?: string) => {
    const tk = token ?? s?.accessToken ?? loadSession()?.accessToken;
    if (!tk) return;
    try {
      const l = await getImplementos(tk);
      setImplementos(l);
      if (s?.role === "CLIENT") {
        setMis(await getMisReservasImplementos(tk));
      }
      if (s?.role === "PROVIDER" || s?.role === "ADMIN") {
        setGestion(await getGestionReservasImplementos(tk));
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) router.replace("/login");
      else setError(err instanceof Error ? err.message : "Error al cargar implementos");
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

  async function onConsultarDisponibilidad() {
    const token = session?.accessToken;
    if (!token || !reserva.implementoId) return;
    setError(null);
    try {
      setDisponible(await getDisponibilidadImplemento(reserva.implementoId, reserva.fecha, token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo consultar el stock");
    }
  }

  async function onReservar() {
    const token = session?.accessToken;
    if (!token || !reserva.implementoId) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await reservarImplemento(reserva.implementoId, { fecha: reserva.fecha, cantidad: reserva.cantidad }, token);
      setMessage("Reserva de implemento creada.");
      setDisponible(null);
      await refresh(null, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reservar el implemento");
    } finally {
      setBusy(false);
    }
  }

  async function onPrestar(reservaId: string) {
    const token = session?.accessToken;
    if (!token) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await prestarImplemento(reservaId, token);
      setMessage("Implemento marcado como prestado.");
      await refresh(null, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo prestar el implemento");
    } finally {
      setBusy(false);
    }
  }

  async function onDevolver() {
    const token = session?.accessToken;
    if (!token || !devolverId) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await devolverImplemento(devolverId, condicion, token);
      setMessage("Devolución registrada.");
      setDevolverId("");
      await refresh(null, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la devolución");
    } finally {
      setBusy(false);
    }
  }

  async function onCreate() {
    const token = session?.accessToken;
    if (!token) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await crearImplemento({ ...crear, cantidadTotal: Number(crear.cantidadTotal) }, token);
      setMessage("Implemento registrado.");
      setCrear({ nombre: "", tipo: "", cantidadTotal: 5, tarifa: 15000 });
      await refresh(null, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el implemento");
    } finally {
      setBusy(false);
    }
  }

  const role = session?.role;
  const canCreate = role === "PROVIDER";
  const esGestor = role === "PROVIDER" || role === "ADMIN";

  return session ? (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Alquiler de implementos</h1>
        <p className="text-sm text-gray-500">Stock diario y préstamo · rol {role}</p>
      </header>
      <DeportesNav />

      {error ? (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>
      ) : null}
      {message ? (
        <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700" role="status">{message}</p>
      ) : null}

      {canCreate ? (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-semibold">Registrar implemento</h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input label="Nombre" name="nombre" value={crear.nombre} onChange={(e) => setCrear({ ...crear, nombre: e.target.value })} />
              <Input label="Tipo" name="tipo" value={crear.tipo} onChange={(e) => setCrear({ ...crear, tipo: e.target.value })} placeholder="Ej. Balones" />
              <Input label="Cantidad total" name="cantidad" type="number" min={1} value={crear.cantidadTotal} onChange={(e) => setCrear({ ...crear, cantidadTotal: Number(e.target.value) })} />
              <Input label="Tarifa diaria (COP)" name="tarifa" type="number" min={0} value={crear.tarifa} onChange={(e) => setCrear({ ...crear, tarifa: Number(e.target.value) })} />
            </div>
            <div>
              <Button onClick={onCreate} disabled={busy || !crear.nombre || !crear.tipo}>
                {busy ? "Procesando…" : "Registrar implemento"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {role === "CLIENT" ? (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-semibold">Reservar implemento</h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Select label="Implemento" name="impl" value={reserva.implementoId} onChange={(e) => setReserva({ ...reserva, implementoId: e.target.value })}>
                <option value="">Selecciona…</option>
                {implementos.map((i) => (
                  <option key={i.id} value={i.id}>{i.nombre} ({money(Number(i.tarifa))})</option>
                ))}
              </Select>
              <Input label="Fecha" name="fecha" type="date" value={reserva.fecha} onChange={(e) => setReserva({ ...reserva, fecha: e.target.value })} />
              <Input label="Cantidad" name="cantidad" type="number" min={1} value={reserva.cantidad} onChange={(e) => setReserva({ ...reserva, cantidad: Number(e.target.value) })} />
              <div className="flex items-end gap-2">
                <Button variant="secondary" onClick={onConsultarDisponibilidad} disabled={!reserva.implementoId}>
                  Ver stock
                </Button>
              </div>
              <div className="flex items-end">
                <Button onClick={onReservar} disabled={busy || !reserva.implementoId || reserva.cantidad < 1}>
                  {busy ? "Procesando…" : "Reservar"}
                </Button>
              </div>
            </div>
            {disponible !== null ? (
              <p className="text-sm text-gray-600">
                Stock disponible para {reserva.fecha}:{" "}
                <span className={`font-semibold ${disponible > 0 ? "text-green-700" : "text-red-700"}`}>
                  {disponible}
                </span>{" "}
                unidades.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold">Implementos</h2>
        </CardHeader>
        <CardContent>
          {implementos.length === 0 ? (
            <p className="text-sm text-gray-500">No hay implementos.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-gray-100">
              {implementos.map((i) => (
                <li key={i.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{i.nombre} <span className="text-xs text-gray-400">· {i.tipo}</span></p>
                    <p className="text-xs text-gray-500">
                      Stock {i.cantidadTotal} · {money(Number(i.tarifa))}/día{i.activo ? "" : " · inactivo"}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${i.activo ? "bg-primary-50 text-primary-700" : "bg-gray-100 text-gray-500"}`}>
                    {i.activo ? "Disponible" : "Inactivo"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {role === "CLIENT" ? (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-semibold">Mis reservas de implementos</h2>
          </CardHeader>
          <CardContent>
            {mis.length === 0 ? (
              <p className="text-sm text-gray-500">Aún no tienes reservas de implementos.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-gray-100">
                {mis.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{r.fecha} · {r.cantidad} unidad(es)</p>
                      <p className="text-xs text-gray-500">Folio {r.id.slice(0, 8)}{r.condicion ? ` · ${r.condicion}` : ""}</p>
                    </div>
                    <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                      {r.estado}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}

      {esGestor ? (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Reservas por gestionar (préstamo y devolución)</h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {gestion.length === 0 ? (
              <p className="text-sm text-gray-500">No hay reservas para gestionar.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-gray-100">
                {gestion.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{r.clientNombre} · {r.implementoNombre}</p>
                      <p className="text-xs text-gray-500">
                        {r.fecha} · {r.cantidad} unidad(es) · {r.estado}
                      </p>
                    </div>
                    {r.estado === "RESERVADA" ? (
                      <Button variant="secondary" onClick={() => onPrestar(r.id)} disabled={busy}>Prestar</Button>
                    ) : r.estado === "PRESTADO" ? (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setDevolverId(devolverId === r.id ? "" : r.id);
                          setCondicion("BUENO");
                        }}
                        disabled={busy}
                      >
                        Registrar devolución
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            {devolverId ? (
              <div className="flex flex-col gap-3 rounded-md border border-gray-200 p-4">
                <p className="text-sm font-medium">Condición del implemento al devolverlo</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select label="Condición" name="condicion" value={condicion} onChange={(e) => setCondicion(e.target.value as CondicionImplemento)}>
                    {CONDICIONES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={onDevolver} disabled={busy}>
                    {busy ? "Procesando…" : "Confirmar devolución"}
                  </Button>
                  <Button variant="ghost" onClick={() => setDevolverId("")}>Cancelar</Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </main>
  ) : null;
}