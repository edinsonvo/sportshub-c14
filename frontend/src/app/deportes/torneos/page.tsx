"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { loadSession, type Session } from "@/lib/auth";
import {
  abrirTorneo,
  crearTorneo,
  finalizarTorneo,
  getPartidos,
  getRanking,
  getTorneos,
  inscribirTorneo,
  registrarResultado,
  type CrearTorneoBody,
  type FormatoTorneo,
  type Partido,
  type RankingEntry,
  type Torneo,
} from "@/lib/deportes";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { Card, CardContent, CardHeader } from "@/app/components/ui/Card";
import { DeportesNav } from "@/app/components/DeportesNav";

const hora = (t: string | null | undefined) => (t ? t.slice(0, 10) : "");
const hoy = () => new Date().toISOString().slice(0, 10);

export default function TorneosPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [crear, setCrear] = useState<CrearTorneoBody>({
    nombre: "",
    categoria: "FUTBOL",
    formato: "ELIMINATORIA_DIRECTA",
    fechaInicio: hoy(),
    fechaFin: hoy(),
    cupo: 8,
  });
  const [inscripcion, setInscripcion] = useState<{ torneoId: string; nombreEquipo: string }>({
    torneoId: "",
    nombreEquipo: "",
  });
  const [detalleId, setDetalleId] = useState("");
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [resultados, setResultados] = useState<Record<string, { a: string; b: string }>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (s?: Session | null, token?: string) => {
    const tk = token ?? s?.accessToken ?? loadSession()?.accessToken;
    if (!tk) return;
    try {
      setTorneos(await getTorneos(tk));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) router.replace("/login");
      else setError(err instanceof Error ? err.message : "Error al cargar torneos");
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

  async function onCreate() {
    const token = session?.accessToken;
    if (!token) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await crearTorneo({ ...crear, cupo: Number(crear.cupo) }, token);
      setMessage("Torneo creado correctamente.");
      setCrear({ ...crear, nombre: "" });
      await refresh(null, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el torneo");
    } finally {
      setBusy(false);
    }
  }

  async function onInscribir() {
    const token = session?.accessToken;
    if (!token || !inscripcion.torneoId) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const p = await inscribirTorneo(inscripcion.torneoId, inscripcion.nombreEquipo, token);
      setMessage(`Inscrito al torneo (${p.id.slice(0, 8)}…).`);
      setInscripcion({ torneoId: "", nombreEquipo: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo inscribir al torneo");
    } finally {
      setBusy(false);
    }
  }

  async function onAbrir(torneoId: string) {
    const token = session?.accessToken;
    if (!token) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await abrirTorneo(torneoId, token);
      setMessage("Torneo abierto, llaves generadas.");
      await refresh(null, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir el torneo");
    } finally {
      setBusy(false);
    }
  }

  async function onFinalizar(torneoId: string) {
    const token = session?.accessToken;
    if (!token) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await finalizarTorneo(torneoId, token);
      setMessage("Torneo finalizado.");
      await refresh(null, token);
      await cargarDetalle(torneoId, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo finalizar el torneo");
    } finally {
      setBusy(false);
    }
  }

  async function cargarDetalle(torneoId: string, token?: string) {
    const tk = token ?? session?.accessToken;
    if (!tk) return;
    setDetalleId(torneoId);
    try {
      const [p, r] = await Promise.all([getPartidos(torneoId, tk), getRanking(torneoId, tk)]);
      setPartidos(p);
      setRanking(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el detalle del torneo");
    }
  }

  function guardarResultado(partidoId: string, campo: "a" | "b", valor: string) {
    setResultados((prev) => {
      const actual = prev[partidoId] ?? { a: "", b: "" };
      return { ...prev, [partidoId]: { ...actual, [campo]: valor } };
    });
  }

  async function onRegistrarResultado(partidoId: string) {
    const token = session?.accessToken;
    if (!token) return;
    const r = resultados[partidoId];
    if (!r) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await registrarResultado(partidoId, Number(r.a), Number(r.b), token);
      setMessage("Resultado registrado.");
      await cargarDetalle(detalleId, token);
      await refresh(null, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el resultado");
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
        <h1 className="text-2xl font-bold">Torneos y eventos</h1>
        <p className="text-sm text-gray-500">Llaves, resultados y ranking · rol {role}</p>
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
            <h2 className="font-semibold">Crear torneo</h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input label="Nombre" name="nombre" value={crear.nombre} onChange={(e) => setCrear({ ...crear, nombre: e.target.value })} />
              <Input label="Categoría" name="categoria" value={crear.categoria} onChange={(e) => setCrear({ ...crear, categoria: e.target.value })} />
              <Select label="Formato" name="formato" value={crear.formato} onChange={(e) => setCrear({ ...crear, formato: e.target.value as FormatoTorneo })}>
                <option value="ELIMINATORIA_DIRECTA">Eliminatoria directa</option>
                <option value="LIGA">Liga</option>
              </Select>
              <Input label="Fecha inicio" name="fi" type="date" value={crear.fechaInicio} onChange={(e) => setCrear({ ...crear, fechaInicio: e.target.value })} />
              <Input label="Fecha fin" name="ff" type="date" value={crear.fechaFin} onChange={(e) => setCrear({ ...crear, fechaFin: e.target.value })} />
              <Input label="Cupo" name="cupo" type="number" min={2} value={crear.cupo} onChange={(e) => setCrear({ ...crear, cupo: Number(e.target.value) })} />
            </div>
            <div>
              <Button onClick={onCreate} disabled={busy || !crear.nombre}>
                {busy ? "Procesando…" : "Crear torneo"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {role === "CLIENT" ? (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-semibold">Inscribirme a un torneo</h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Select label="Torneo" name="torneo" value={inscripcion.torneoId} onChange={(e) => setInscripcion({ ...inscripcion, torneoId: e.target.value })}>
                <option value="">Selecciona…</option>
                {torneos.filter((t) => t.estado === "PROXIMO").map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </Select>
              <Input label="Nombre del equipo (opcional)" name="equipo" value={inscripcion.nombreEquipo} onChange={(e) => setInscripcion({ ...inscripcion, nombreEquipo: e.target.value })} />
              <div className="flex items-end">
                <Button onClick={onInscribir} disabled={busy || !inscripcion.torneoId}>
                  {busy ? "Procesando…" : "Inscribirme"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold">Torneos</h2>
        </CardHeader>
        <CardContent>
          {torneos.length === 0 ? (
            <p className="text-sm text-gray-500">No hay torneos.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-gray-100">
              {torneos.map((t) => (
                <li key={t.id} className="py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">
                        {t.nombre} <span className="text-xs text-gray-400">· {t.categoria} · {t.formato.replaceAll("_", " ")}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {hora(t.fechaInicio)} → {hora(t.fechaFin)} · cupo {t.cupo}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                        {t.estado.replaceAll("_", " ")}
                      </span>
                      <Button variant="ghost" onClick={() => cargarDetalle(t.id)} disabled={busy}>
                        Detalle
                      </Button>
                      {esGestor && t.estado === "PROXIMO" ? (
                        <Button variant="secondary" onClick={() => onAbrir(t.id)} disabled={busy}>Abrir</Button>
                      ) : null}
                      {esGestor && t.estado === "EN_CURSO" ? (
                        <Button variant="secondary" onClick={() => onFinalizar(t.id)} disabled={busy}>Finalizar</Button>
                      ) : null}
                    </div>
                  </div>
                  {detalleId === t.id ? (
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-md border border-gray-200 p-4">
                        <p className="mb-2 text-sm font-medium">Partidos</p>
                        {partidos.length === 0 ? (
                          <p className="text-xs text-gray-500">Sin partidos (abre el torneo para generar llaves).</p>
                        ) : (
                          <ul className="flex flex-col gap-2">
                            {partidos.map((p) => (
                              <li key={p.id} className="rounded-md bg-gray-50 p-2 text-sm">
                                <p className="text-xs text-gray-500">Ronda {p.ronda} · {p.estado}</p>
                                <p className="flex items-center gap-2">
                                  {p.estado === "PROGRAMADO" ? (
                                    <>
                                      <Input label="A" name={`a-${p.id}`} className="w-16" value={resultados[p.id]?.a ?? ""} onChange={(e) => guardarResultado(p.id, "a", e.target.value.replace(/\D/g, ""))} />
                                      <span>–</span>
                                      <Input label="B" name={`b-${p.id}`} className="w-16" value={resultados[p.id]?.b ?? ""} onChange={(e) => guardarResultado(p.id, "b", e.target.value.replace(/\D/g, ""))} />
                                      <Button variant="secondary" disabled={busy} onClick={() => onRegistrarResultado(p.id)}>
                                        Registrar
                                      </Button>
                                    </>
                                  ) : (
                                    <span>
                                      {p.marcadorA ?? "-"} – {p.marcadorB ?? "-"}
                                      {p.ganadorId ? ` · ganó ${p.ganadorId.slice(0, 8)}` : ""}
                                    </span>
                                  )}
                                </p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="rounded-md border border-gray-200 p-4">
                        <p className="mb-2 text-sm font-medium">Ranking</p>
                        {ranking.length === 0 ? (
                          <p className="text-xs text-gray-500">Sin posiciones registradas.</p>
                        ) : (
                          <ol className="flex flex-col gap-1 text-sm">
                            {ranking.map((r, idx) => (
                              <li key={r.participanteId} className="flex items-center justify-between">
                                <span>{idx + 1}. {r.nombre}</span>
                                <span className="text-xs text-gray-500">
                                  J {r.jugados} · G {r.ganados} · {r.puntos} pts
                                </span>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  ) : null;
}