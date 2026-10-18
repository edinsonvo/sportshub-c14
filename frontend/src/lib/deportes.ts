import { api } from "@/lib/api";

export type TipoInstalacion = "CANCHA" | "SALA" | "PISCINA" | "GIMNASIO";
export type FormatoTorneo = "ELIMINATORIA_DIRECTA" | "LIGA";
export type TorneoEstado = "PROXIMO" | "EN_CURSO" | "FINALIZADO";
export type MembresiaEstado = "ACTIVA" | "SUSPENDIDA" | "VENCIDA";
export type CondicionImplemento = "BUENO" | "DANADO" | "PERDIDO";

export interface Instalacion {
  id: string;
  providerId: string;
  nombre: string;
  tipo: TipoInstalacion;
  capacidad: number;
  tarifaPorHora: number;
  horaApertura: string;
  horaCierre: string;
  activa: boolean;
}

export interface Franja {
  inicio: string;
  fin: string;
  disponibles: number;
}

export interface ReservaInstalacion {
  id: string;
  instalacionId: string;
  clientId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
}

export interface MantenimientoInstalacion {
  id: string;
  instalacionId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo: string | null;
  activo: boolean;
}

export interface ListaEspera {
  id: string;
  instalacionId: string;
  clientId: string;
  fecha: string;
  horaInicio: string;
  estado: string;
}

export interface CrearInstalacionBody {
  nombre: string;
  tipo: TipoInstalacion;
  capacidad: number;
  tarifaPorHora: number;
  horaApertura: string;
  horaCierre: string;
}

export interface Clase {
  id: string;
  providerId: string;
  instalacionId: string;
  entrenadorStaffId: string;
  nombre: string;
  nivel: string;
  fecha: string;
  hora: string;
  duracionMin: number;
  cupo: number;
  inscritos: number;
  activa: boolean;
}

export interface InscripcionClase {
  id: string;
  claseGrupalId: string;
  clientId: string;
  estado: string;
}

export interface CrearClaseBody {
  nombre: string;
  nivel: string;
  instalacionId: string;
  entrenadorStaffId: string;
  fecha: string;
  hora: string;
  duracionMin: number;
  cupo: number;
}

export interface PlanMembresia {
  id: string;
  providerId: string;
  nombre: string;
  vigenciaDias: number;
  descuentoPorcentaje: number;
  precio: number;
  beneficios: string | null;
  activo: boolean;
}

export interface Membresia {
  id: string;
  planId: string;
  planNombre: string;
  clientId: string;
  fechaInicio: string;
  fechaFin: string;
  estado: MembresiaEstado;
  motivo: string | null;
}

export interface MembresiaGestion {
  id: string;
  clientId: string;
  clientNombre: string;
  planId: string;
  planNombre: string;
  fechaInicio: string;
  fechaFin: string;
  estado: MembresiaEstado;
  motivo: string | null;
}

export interface Beneficio {
  tarifaOriginal: number;
  tarifaFinal: number;
  descuentoPorcentaje: number;
}

export interface CrearPlanBody {
  nombre: string;
  vigenciaDias: number;
  descuentoPorcentaje: number;
  precio: number;
  beneficios: string;
}

export interface Implemento {
  id: string;
  providerId: string;
  nombre: string;
  tipo: string;
  cantidadTotal: number;
  tarifa: number;
  activo: boolean;
}

export interface ReservaImplemento {
  id: string;
  implementoId: string;
  clientId: string;
  fecha: string;
  cantidad: number;
  estado: string;
  condicion: CondicionImplemento | null;
}

export interface ReservaImplementoGestion {
  id: string;
  implementoId: string;
  implementoNombre: string;
  clientId: string;
  clientNombre: string;
  fecha: string;
  cantidad: number;
  estado: string;
  condicion: CondicionImplemento | null;
}

export interface CrearImplementoBody {
  nombre: string;
  tipo: string;
  cantidadTotal: number;
  tarifa: number;
}

export interface Torneo {
  id: string;
  providerId: string;
  nombre: string;
  categoria: string;
  formato: FormatoTorneo;
  fechaInicio: string;
  fechaFin: string;
  cupo: number;
  estado: TorneoEstado;
}

export interface Participante {
  id: string;
  torneoId: string;
  clientId: string;
  nombreEquipo: string | null;
  estado: string;
}

export interface Partido {
  id: string;
  torneoId: string;
  ronda: number;
  participanteAId: string;
  participanteBId: string;
  fecha: string;
  marcadorA: number | null;
  marcadorB: number | null;
  ganadorId: string | null;
  estado: string;
}

export interface RankingEntry {
  participanteId: string;
  nombre: string;
  jugados: number;
  ganados: number;
  puntos: number;
}

export interface CrearTorneoBody {
  nombre: string;
  categoria: string;
  formato: FormatoTorneo;
  fechaInicio: string;
  fechaFin: string;
  cupo: number;
}

export interface StaffOption {
  id: string;
  fullName: string;
  posicion: string | null;
}

export interface ProveedorMe {
  providerId: string;
  businessName: string;
  logoUrl: string | null;
  activo: boolean;
  staff: StaffOption[];
}

type Opts = { token?: string; body?: unknown; method?: string };

function req<T>(path: string, opts: Opts = {}) {
  return api<T>(path, {
    token: opts.token,
    method: opts.method,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
}

// Instalaciones
export const getInstalaciones = (token?: string) =>
  req<Instalacion[]>("/deportes/instalaciones", { token });
export const getDisponibilidad = (id: string, fecha: string, token?: string) =>
  req<Franja[]>(`/deportes/instalaciones/${id}/disponibilidad?fecha=${fecha}`, { token });
export const crearInstalacion = (body: CrearInstalacionBody, token?: string) =>
  req<Instalacion>("/deportes/instalaciones", { token, method: "POST", body });
export const reservarInstalacion = (
  id: string,
  body: { fecha: string; horaInicio: string },
  token?: string,
) => req<ReservaInstalacion>(`/deportes/instalaciones/${id}/reservas`, { token, method: "POST", body });
export const cancelarReservaInstalacion = (reservaId: string, token?: string) =>
  req<ReservaInstalacion>(`/deportes/instalaciones/reservas/${reservaId}/cancelar`, {
    token,
    method: "PATCH",
  });
export const getMisReservasInstalaciones = (token?: string) =>
  req<ReservaInstalacion[]>("/deportes/instalaciones/reservas", { token });
export const bloquearMantenimiento = (
  id: string,
  body: { fecha: string; horaInicio: string; horaFin: string; motivo: string },
  token?: string,
) =>
  req<MantenimientoInstalacion>(`/deportes/instalaciones/${id}/mantenimiento`, {
    token,
    method: "POST",
    body,
  });
export const solicitarListaEspera = (
  id: string,
  body: { fecha: string; horaInicio: string },
  token?: string,
) => req<ListaEspera>(`/deportes/instalaciones/${id}/lista-espera`, { token, method: "POST", body });

// Clases
export const getClases = (token?: string, instalacionId?: string) =>
  req<Clase[]>(
    `/deportes/clases${instalacionId ? `?instalacionId=${instalacionId}` : ""}`,
    { token },
  );
export const crearClase = (body: CrearClaseBody, token?: string) =>
  req<Clase>("/deportes/clases", { token, method: "POST", body });
export const inscribirClase = (id: string, token?: string) =>
  req<InscripcionClase>(`/deportes/clases/${id}/inscripciones`, { token, method: "POST" });
export const getMisInscripciones = (token?: string) =>
  req<InscripcionClase[]>("/deportes/clases/mias", { token });
export const cancelarInscripcion = (inscripcionId: string, token?: string) =>
  req<InscripcionClase>(`/deportes/clases/inscripciones/${inscripcionId}/cancelar`, {
    token,
    method: "PATCH",
  });
export const completarClase = (id: string, token?: string) =>
  req<number>(`/deportes/clases/${id}/completar`, { token, method: "PATCH" });

// Membresías
export const getPlanes = (token?: string) =>
  req<PlanMembresia[]>("/deportes/membresias/planes", { token });
export const crearPlan = (body: CrearPlanBody, token?: string) =>
  req<PlanMembresia>("/deportes/membresias/planes", { token, method: "POST", body });
export const comprarMembresia = (planId: string, token?: string) =>
  req<Membresia>("/deportes/membresias/comprar", { token, method: "POST", body: { planId } });
export const getMisMembresias = (token?: string) =>
  req<Membresia[]>("/deportes/membresias/mias", { token });
export const getGestionMembresias = (token?: string) =>
  req<MembresiaGestion[]>("/deportes/membresias/gestion", { token });
export const suspenderMembresia = (id: string, motivo: string, token?: string) =>
  req<Membresia>(`/deportes/membresias/${id}/suspender`, { token, method: "PATCH", body: { motivo } });
export const calcularBeneficio = (tarifa: number, token?: string) =>
  req<Beneficio>("/deportes/membresias/beneficio", { token, method: "POST", body: { tarifa } });

// Implementos
export const getImplementos = (token?: string) =>
  req<Implemento[]>("/deportes/implementos", { token });
export const crearImplemento = (body: CrearImplementoBody, token?: string) =>
  req<Implemento>("/deportes/implementos", { token, method: "POST", body });
export const getDisponibilidadImplemento = (id: string, fecha: string, token?: string) =>
  req<number>(`/deportes/implementos/${id}/disponibilidad?fecha=${fecha}`, { token });
export const reservarImplemento = (
  id: string,
  body: { fecha: string; cantidad: number },
  token?: string,
) => req<ReservaImplemento>(`/deportes/implementos/${id}/reservas`, { token, method: "POST", body });
export const getMisReservasImplementos = (token?: string) =>
  req<ReservaImplemento[]>("/deportes/implementos/mias", { token });
export const getGestionReservasImplementos = (token?: string) =>
  req<ReservaImplementoGestion[]>("/deportes/implementos/reservas", { token });
export const prestarImplemento = (reservaId: string, token?: string) =>
  req<ReservaImplemento>(`/deportes/implementos/reservas/${reservaId}/prestar`, {
    token,
    method: "PATCH",
  });
export const devolverImplemento = (reservaId: string, condicion: CondicionImplemento, token?: string) =>
  req<ReservaImplemento>(`/deportes/implementos/reservas/${reservaId}/devolver`, {
    token,
    method: "PATCH",
    body: { condicion },
  });

// Torneos
export const getTorneos = (token?: string) => req<Torneo[]>("/deportes/torneos", { token });
export const crearTorneo = (body: CrearTorneoBody, token?: string) =>
  req<Torneo>("/deportes/torneos", { token, method: "POST", body });
export const inscribirTorneo = (id: string, nombreEquipo: string, token?: string) =>
  req<Participante>(`/deportes/torneos/${id}/inscripciones`, {
    token,
    method: "POST",
    body: { nombreEquipo },
  });
export const abrirTorneo = (id: string, token?: string) =>
  req<Torneo>(`/deportes/torneos/${id}/abrir`, { token, method: "PATCH" });
export const finalizarTorneo = (id: string, token?: string) =>
  req<Torneo>(`/deportes/torneos/${id}/finalizar`, { token, method: "PATCH" });
export const getPartidos = (id: string, token?: string) =>
  req<Partido[]>(`/deportes/torneos/${id}/partidos`, { token });
export const registrarResultado = (
  partidoId: string,
  marcadorA: number,
  marcadorB: number,
  token?: string,
) =>
  req<Partido>(`/deportes/torneos/partidos/${partidoId}/resultado`, {
    token,
    method: "PATCH",
    body: { marcadorA, marcadorB },
  });
export const getRanking = (id: string, token?: string) =>
  req<RankingEntry[]>(`/deportes/torneos/${id}/ranking`, { token });

// Proveedor
export const getProveedorMe = (token?: string) =>
  req<ProveedorMe>("/deportes/proveedor/me", { token });
