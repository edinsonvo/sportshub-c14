"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { loadSession, type Session } from "@/lib/auth";
import {
  calcularBeneficio,
  comprarMembresia,
  crearPlan,
  getGestionMembresias,
  getMisMembresias,
  getPlanes,
  suspenderMembresia,
  type Beneficio,
  type CrearPlanBody,
  type Membresia,
  type MembresiaGestion,
  type PlanMembresia,
} from "@/lib/deportes";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Card, CardContent, CardHeader } from "@/app/components/ui/Card";
import { DeportesNav } from "@/app/components/DeportesNav";

const money = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(v);

export default function MembresiasPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [planes, setPlanes] = useState<PlanMembresia[]>([]);
  const [mis, setMis] = useState<Membresia[]>([]);
  const [gestion, setGestion] = useState<MembresiaGestion[]>([]);
  const [crear, setCrear] = useState<CrearPlanBody>({
    nombre: "",
    vigenciaDias: 30,
    descuentoPorcentaje: 10,
    precio: 50000,
    beneficios: "",
  });
  const [tarifa, setTarifa] = useState("");
  const [beneficio, setBeneficio] = useState<Beneficio | null>(null);
  const [motivo, setMotivo] = useState("");
  const [suspenderId, setSuspenderId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (s?: Session | null, token?: string) => {
    const tk = token ?? s?.accessToken ?? loadSession()?.accessToken;
    if (!tk) return;
    try {
      const p = await getPlanes(tk);
      setPlanes(p);
      if (s?.role === "CLIENT") {
        setMis(await getMisMembresias(tk));
      }
      if (s?.role === "PROVIDER" || s?.role === "ADMIN") {
        setGestion(await getGestionMembresias(tk));
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) router.replace("/login");
      else setError(err instanceof Error ? err.message : "Error al cargar membresías");
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

  async function onComprar(planId: string) {
    const token = session?.accessToken;
    if (!token) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await comprarMembresia(planId, token);
      setMessage("Membresía comprada o renovada.");
      await refresh(null, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo comprar la membresía");
    } finally {
      setBusy(false);
    }
  }

  async function onCreatePlan() {
    const token = session?.accessToken;
    if (!token) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await crearPlan({ ...crear, descuentoPorcentaje: Number(crear.descuentoPorcentaje) }, token);
      setMessage("Plan creado correctamente.");
      setCrear({ nombre: "", vigenciaDias: 30, descuentoPorcentaje: 10, precio: 50000, beneficios: "" });
      await refresh(null, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el plan");
    } finally {
      setBusy(false);
    }
  }

  async function onCalcularBeneficio() {
    const token = session?.accessToken;
    if (!token || !tarifa) return;
    setError(null);
    setMessage(null);
    try {
      setBeneficio(await calcularBeneficio(Number(tarifa), token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo calcular el beneficio");
    }
  }

  async function onSuspender() {
    const token = session?.accessToken;
    if (!token || !suspenderId) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await suspenderMembresia(suspenderId, motivo, token);
      setMessage("Membresía suspendida.");
      setMotivo("");
      setSuspenderId("");
      await refresh(null, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo suspender la membresía");
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
        <h1 className="text-2xl font-bold">Membresías</h1>
        <p className="text-sm text-gray-500">Planes con descuentos por vigencia · rol {role}</p>
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
            <h2 className="font-semibold">Crear plan de membresía</h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input label="Nombre" name="nombre" value={crear.nombre} onChange={(e) => setCrear({ ...crear, nombre: e.target.value })} />
              <Input label="Vigencia (días)" name="vigencia" type="number" min={1} value={crear.vigenciaDias} onChange={(e) => setCrear({ ...crear, vigenciaDias: Number(e.target.value) })} />
              <Input label="Descuento (%)" name="descuento" type="number" min={0} max={100} value={crear.descuentoPorcentaje} onChange={(e) => setCrear({ ...crear, descuentoPorcentaje: Number(e.target.value) })} />
              <Input label="Precio (COP)" name="precio" type="number" min={0} value={crear.precio} onChange={(e) => setCrear({ ...crear, precio: Number(e.target.value) })} />
              <Input label="Beneficios" name="beneficios" value={crear.beneficios} onChange={(e) => setCrear({ ...crear, beneficios: e.target.value })} />
            </div>
            <div>
              <Button onClick={onCreatePlan} disabled={busy || !crear.nombre}>
                {busy ? "Procesando…" : "Crear plan"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold">Planes disponibles</h2>
        </CardHeader>
        <CardContent>
          {planes.length === 0 ? (
            <p className="text-sm text-gray-500">No hay planes publicados.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-gray-100">
              {planes.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {p.nombre} <span className="text-xs text-gray-400">· {p.vigenciaDias} días · {p.descuentoPorcentaje}% dcto</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {money(Number(p.precio))}{p.beneficios ? ` · ${p.beneficios}` : ""}
                    </p>
                  </div>
                  {role === "CLIENT" ? (
                    <Button onClick={() => onComprar(p.id)} disabled={busy}>Comprar</Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {role === "CLIENT" ? (
        <>
          <Card className="mb-6">
            <CardHeader>
              <h2 className="font-semibold">Mis membresías</h2>
            </CardHeader>
            <CardContent>
              {mis.length === 0 ? (
                <p className="text-sm text-gray-500">Aún no tienes membresías.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-gray-100">
                  {mis.map((m) => (
                    <li key={m.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium">{m.planNombre}</p>
                        <p className="text-xs text-gray-500">{m.fechaInicio} → {m.fechaFin}{m.motivo ? ` · ${m.motivo}` : ""}</p>
                      </div>
                      <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                        {m.estado}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <h2 className="font-semibold">Calcular beneficio sobre una tarifa</h2>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Input label="Tarifa (COP)" name="tarifa" type="number" min={0} value={tarifa} onChange={(e) => setTarifa(e.target.value)} placeholder="Ej. 80000" />
                <div className="flex items-end">
                  <Button variant="secondary" onClick={onCalcularBeneficio} disabled={!tarifa}>Calcular</Button>
                </div>
              </div>
              {beneficio ? (
                <p className="rounded-md bg-gray-50 p-3 text-sm">
                  Tarifa original: <span className="font-medium">{money(Number(beneficio.tarifaOriginal))}</span>
                  {" · "}Con tu membresía ({beneficio.descuentoPorcentaje}%):{" "}
                  <span className="font-semibold text-primary-700">{money(Number(beneficio.tarifaFinal))}</span>
                </p>
              ) : null}
            </CardContent>
          </Card>
        </>
      ) : null}

      {esGestor ? (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Membresías vendidas (gestión)</h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {gestion.length === 0 ? (
              <p className="text-sm text-gray-500">No hay membresías para gestionar.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-gray-100">
                {gestion.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{m.clientNombre} · {m.planNombre}</p>
                      <p className="text-xs text-gray-500">
                        {m.fechaInicio} → {m.fechaFin}{m.motivo ? ` · ${m.motivo}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                        {m.estado}
                      </span>
                      {m.estado === "ACTIVA" ? (
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setSuspenderId(m.id);
                            setMotivo("");
                          }}
                          disabled={busy}
                        >
                          Suspender
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {suspenderId ? (
              <div className="flex flex-col gap-3 rounded-md border border-gray-200 p-4">
                <p className="text-sm font-medium">Motivo de la suspensión</p>
                <Input label="Motivo" name="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                <div className="flex gap-2">
                  <Button onClick={onSuspender} disabled={busy || !motivo}>
                    {busy ? "Procesando…" : "Confirmar suspensión"}
                  </Button>
                  <Button variant="ghost" onClick={() => setSuspenderId("")}>Cancelar</Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </main>
  ) : null;
}