"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { loadSession, type Session } from "@/lib/auth";
import {
  cancelarInscripcion,
  completarClase,
  crearClase,
  getClases,
  getInstalaciones,
  getMisInscripciones,
  getProveedorMe,
  inscribirClase,
  type Clase,
  type CrearClaseBody,
  type InscripcionClase,
  type Instalacion,
  type ProveedorMe,
} from "@/lib/deportes";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { Card, CardContent, CardHeader } from "@/app/components/ui/Card";
import { DeportesNav } from "@/app/components/DeportesNav";

const hora = (t: string | null | undefined) => (t ? t.slice(0, 5) : "");
const hoy = () => new Date().toISOString().slice(0, 10);

export default function ClasesPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [clases, setClases] = useState<Clase[]>([]);
  const [inscripciones, setInscripciones] = useState<InscripcionClase[]>([]);
  const [instalaciones, setInstalaciones] = useState<Instalacion[]>([]);
  const [proveedor, setProveedor] = useState<ProveedorMe | null>(null);
  const [filtroInstalacion, setFiltroInstalacion] = useState("");
  const [crear, setCrear] = useState<CrearClaseBody>({
    nombre: "",
    nivel: "PRINCIPIANTE",
    instalacionId: "",
    entrenadorStaffId: "",
    fecha: hoy(),
    hora: "18:00",
    duracionMin: 60,
    cupo: 15,
  });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (s?: Session | null, token?: string) => {
    const tk = token ?? s?.accessToken ?? loadSession()?.accessToken;
    if (!tk) return;
    try {
      const [l, m, inst] = await Promise.all([getClases(tk), getMisInscripciones(tk), getInstalaciones(tk)]);
      setClases(l);
      setInscripciones(m);
      setInstalaciones(inst);
      if (s?.role === "PROVIDER" || s?.role === "STAFF") {
        setProveedor(await getProveedorMe(tk));
      }
      // eslint-disable-next-line no-empty
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) router.replace("/login");
      else setError(err instanceof Error ? err.message : "Error al cargar clases");
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

  async function filtrar(instalacionId: string) {
    const token = session?.accessToken;
    if (!token) return;
    setFiltroInstalacion(instalacionId);
    try {
      setClases(await getClases(token, instalacionId || undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron filtrar las clases");
    }
  }

  async function onInscribir(claseId: string) {
    const token = session?.accessToken;
    if (!token) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await inscribirClase(claseId, token);
      setMessage("Inscripción registrada (confirmada o en espera según el cupo).");
      await refresh(null, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo inscribir a la clase");
    } finally {
      setBusy(false);
    }
  }

  async function onCancelarInscripcion(inscripcionId: string) {
    const token = session?.accessToken;
    if (!token) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await cancelarInscripcion(inscripcionId, token);
      setMessage("Inscripción cancelada.");
      await refresh(null, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cancelar la inscripción");
    } finally {
      setBusy(false);
    }
  }

  async function onCrear() {
    const token = session?.accessToken;
    if (!token) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await crearClase(crear, token);
      setMessage("Clase creada correctamente.");
      setCrear({ ...crear, nombre: "" });
      await refresh(session, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la clase");
    } finally {
      setBusy(false);
    }
  }

  async function onCompletar(claseId: string) {
    const token = session?.accessToken;
    if (!token) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const cerradas = await completarClase(claseId, token);
      setMessage(`Clase completada, ${cerradas} inscripción(es) confirmada(s) cerrada(s).`);
      await refresh(null, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar la clase");
    } finally {
      setBusy(false);
    }
  }

  const role = session?.role;
  const canCreate = role === "PROVIDER";
  const canComplete = role === "PROVIDER" || role === "ADMIN";
  const esCliente = role === "CLIENT";

  return session ? (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Clases grupales</h1>
        <p className="text-sm text-gray-500">Inscripción con cupo y lista de espera · rol {role}</p>
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
            <h2 className="font-semibold">Registrar clase grupal</h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input label="Nombre" name="nombre" value={crear.nombre} onChange={(e) => setCrear({ ...crear, nombre: e.target.value })} />
              <Select label="Nivel" name="nivel" value={crear.nivel} onChange={(e) => setCrear({ ...crear, nivel: e.target.value })}>
                <option value="PRINCIPIANTE">Principiante</option>
                <option value="INTERMEDIO">Intermedio</option>
                <option value="AVANZADO">Avanzado</option>
              </Select>
              <Select label="Instalación" name="inst" value={crear.instalacionId} onChange={(e) => setCrear({ ...crear, instalacionId: e.target.value })}>
                <option value="">Selecciona…</option>
                {instalaciones.map((i) => (
                  <option key={i.id} value={i.id}>{i.nombre}</option>
                ))}
              </Select>
              <Select label="Entrenador (staff)" name="entrenador" value={crear.entrenadorStaffId} onChange={(e) => setCrear({ ...crear, entrenadorStaffId: e.target.value })}>
                <option value="">Selecciona…</option>
                {proveedor?.staff.map((st) => (
                  <option key={st.id} value={st.id}>{st.fullName}{st.posicion ? ` (${st.posicion})` : ""}</option>
                ))}
              </Select>
              <Input label="Fecha" name="fecha" type="date" value={crear.fecha} onChange={(e) => setCrear({ ...crear, fecha: e.target.value })} />
              <Input label="Hora" name="hora" type="time" value={crear.hora} onChange={(e) => setCrear({ ...crear, hora: e.target.value })} />
              <Input label="Duración (min)" name="duracion" type="number" min={15} value={crear.duracionMin} onChange={(e) => setCrear({ ...crear, duracionMin: Number(e.target.value) })} />
              <Input label="Cupo" name="cupo" type="number" min={1} value={crear.cupo} onChange={(e) => setCrear({ ...crear, cupo: Number(e.target.value) })} />
            </div>
            <div>
              <Button onClick={onCrear} disabled={busy || !crear.nombre || !crear.instalacionId || !crear.entrenadorStaffId}>
                {busy ? "Procesando…" : "Crear clase"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {esCliente ? (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-semibold">Mis inscripciones</h2>
          </CardHeader>
          <CardContent>
            {inscripciones.length === 0 ? (
              <p className="text-sm text-gray-500">Aún no estás inscrito a ninguna clase.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-gray-100">
                {inscripciones.map((i) => (
                  <li key={i.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">Clase {i.claseGrupalId.slice(0, 8)}</p>
                      <p className="text-xs text-gray-500">Folio inscripción {i.id.slice(0, 8)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                        {i.estado.replaceAll("_", " ")}
                      </span>
                      {["CONFIRMADA", "EN_ESPERA"].includes(i.estado) ? (
                        <Button variant="ghost" onClick={() => onCancelarInscripcion(i.id)} disabled={busy}>
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

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Clases</h2>
            {esCliente ? (
              <Select label="Filtrar por instalación" name="filtro" value={filtroInstalacion} onChange={(e) => filtrar(e.target.value)} className="w-56">
                <option value="">Todas</option>
                {instalaciones.map((i) => (
                  <option key={i.id} value={i.id}>{i.nombre}</option>
                ))}
              </Select>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {clases.length === 0 ? (
            <p className="text-sm text-gray-500">No hay clases.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-gray-100">
              {clases.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {c.nombre} <span className="text-xs text-gray-400">· {c.nivel}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {c.fecha} {hora(c.hora)} · {c.duracionMin} min · {c.inscritos}/{c.cupo} inscritos
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!c.activa ? (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">cerrada</span>
                    ) : esCliente && c.fecha >= hoy() ? (
                      <Button onClick={() => onInscribir(c.id)} disabled={busy}>Inscribirme</Button>
                    ) : canComplete ? (
                      <Button variant="secondary" onClick={() => onCompletar(c.id)} disabled={busy}>Completar</Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  ) : null;
}