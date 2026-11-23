'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loadSession } from '@/lib/auth';
import {
  changeAppointmentStatus,
  formatTime,
  getAppointments,
  getClients,
  getMyServices,
  initials,
  mapEstadoAgenda,
  type AppointmentAction,
  type AppointmentStatus,
  type EstadoAgenda,
} from '@/lib/appointments';

type AccionCita = AppointmentAction;

const ACCIONES: { accion: AccionCita; etiqueta: string }[] = [
  { accion: 'confirm', etiqueta: 'Confirmar' },
  { accion: 'complete', etiqueta: 'Finalizar' },
  { accion: 'cancel', etiqueta: 'Cancelar' },
];

interface CitaAgenda {
  id: string;
  cliente: string;
  iniciales: string;
  servicio: string;
  detalleServicio: string;
  horario: string;
  estado: EstadoAgenda;
  status: AppointmentStatus;
}

function accionesDisponibles(status: AppointmentStatus): AccionCita[] {
  if (status === 'SOLICITADA') return ['confirm', 'cancel'];
  if (status === 'CONFIRMADA') return ['complete', 'cancel'];
  return [];
}

export default function AdministracionAgendaPage() {
  const router = useRouter();
  const [citas, setCitas] = useState<CitaAgenda[]>([]);
  const [busqueda, setBusqueda] = useState<string>('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('');
  const [mensajeAccesible, setMensajeAccesible] = useState<string>('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string>('');
  const [accionEnCurso, setAccionEnCurso] = useState<string>('');

  async function cargarCitas(fecha?: string) {
    const session = loadSession();
    if (!session?.accessToken) {
      router.replace('/login');
      return;
    }

    setCargando(true);
    setError('');
    try {
      const rango = fecha ? { from: fecha, to: fecha } : undefined;
      const [appointments, clientes, servicios] = await Promise.all([
        getAppointments(session.accessToken, rango),
        getClients(session.accessToken),
        getMyServices(session.accessToken),
      ]);

      const nombresClientes = new Map(clientes.map((c) => [c.id, c.fullName]));
      const nombresServicios = new Map(servicios.map((s) => [s.id, s.name]));
      const ahora = new Date();

      setCitas(
        appointments.map((cita) => ({
          id: cita.id,
          cliente: nombresClientes.get(cita.clientId) ?? 'Cliente',
          iniciales: initials(nombresClientes.get(cita.clientId)),
          servicio: nombresServicios.get(cita.providerServiceId) ?? 'Servicio',
          detalleServicio: `${formatTime(cita.startTime)} - ${formatTime(cita.endTime)}`,
          horario: cita.date,
          estado: mapEstadoAgenda(
            cita.status,
            cita.date,
            cita.endTime,
            ahora,
          ),
          status: cita.status,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar la agenda.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarCitas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleCambiarEstado(
    id: string,
    accion: AccionCita,
    cliente: string,
  ) {
    const session = loadSession();
    if (!session?.accessToken) {
      router.replace('/login');
      return;
    }

    setAccionEnCurso(id);
    setError('');
    try {
      await changeAppointmentStatus(session.accessToken, id, accion);
      await cargarCitas(fechaSeleccionada || undefined);
      const etiqueta =
        ACCIONES.find((opcion) => opcion.accion === accion)?.etiqueta ?? accion;
      setMensajeAccesible(
        `Cita de ${cliente} actualizada correctamente: ${etiqueta}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible actualizar la cita.');
    } finally {
      setAccionEnCurso('');
    }
  }

  function obtenerEstiloBadge(estado: EstadoAgenda) {
    switch (estado) {
      case 'Finalizada':
        return {
          border: '2px solid #4ade80',
          backgroundColor: 'rgba(22, 101, 52, 0.45)',
          color: '#dcfce7',
          icono: '✓',
        };
      case 'En progreso':
        return {
          border: '2px solid #60a5fa',
          backgroundColor: 'rgba(30, 64, 175, 0.45)',
          color: '#dbeafe',
          icono: '▶',
        };
      case 'Pendiente':
        return {
          border: '2px solid #facc15',
          backgroundColor: 'rgba(133, 77, 14, 0.45)',
          color: '#fef9c3',
          icono: '⏱',
        };
      case 'Cancelada':
        return {
          border: '2px dashed #f87171',
          backgroundColor: 'rgba(153, 27, 27, 0.45)',
          color: '#fee2e2',
          icono: '✕',
        };
    }
  }

  const citasFiltradas = citas.filter(
    (c) =>
      c.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.servicio.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalFinalizadas = citas.filter((c) => c.estado === 'Finalizada').length;
  const totalEnProgreso = citas.filter((c) => c.estado === 'En progreso').length;
  const totalPendientes = citas.filter((c) => c.estado === 'Pendiente').length;

  return (
    <div style={{ display: 'flex', backgroundColor: '#080d1a', minHeight: '100vh', width: '100vw', margin: 0, padding: 0, color: '#ffffff', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      
      <aside style={{ width: '260px', backgroundColor: '#0c1324', borderRight: '1px solid #1e293b', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexShrink: 0, boxSizing: 'border-box' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <img src="/logo.png" alt="SportsHub" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
            <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '0.5px' }}>SportsHub</span>
          </div>
          
          <nav aria-label="Menú principal" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button type="button" style={{ textAlign: 'left', padding: '8px 12px', backgroundColor: 'transparent', color: '#cbd5e1', fontSize: '14px', fontWeight: '500', border: '0', cursor: 'pointer' }}>
              📊 Resumen / Dashboard
            </button>
            <button type="button" style={{ textAlign: 'left', padding: '8px 12px', backgroundColor: 'rgba(37, 99, 235, 0.25)', color: '#93c5fd', borderLeft: '4px solid #3b82f6', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', borderTop: '0', borderRight: '0', borderBottom: '0', cursor: 'pointer' }}>
              📅 Agenda
            </button>
            <Link href="/registrar-servicio" style={{ textDecoration: 'none', textAlign: 'left', padding: '8px 12px', backgroundColor: 'transparent', color: '#cbd5e1', fontSize: '14px', fontWeight: '500' }}>
              ▶️ Catálogo de Servicios
            </Link>
            <button type="button" style={{ textAlign: 'left', padding: '8px 12px', backgroundColor: 'transparent', color: '#cbd5e1', fontSize: '14px', fontWeight: '500', border: '0', cursor: 'pointer' }}>
              👥 Personal Operativo
            </button>
            <Link href="/reportes" style={{ textDecoration: 'none', textAlign: 'left', padding: '8px 12px', backgroundColor: 'transparent', color: '#cbd5e1', fontSize: '14px', fontWeight: '500' }}>
              📈 Reportes
            </Link>
            <button type="button" style={{ textAlign: 'left', padding: '8px 12px', backgroundColor: 'transparent', color: '#cbd5e1', fontSize: '14px', fontWeight: '500', border: '0', cursor: 'pointer' }}>
              ⚙️ Configuración
            </button>
          </nav>
        </div>

        <div style={{ paddingTop: '16px', borderTop: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#ffffff', fontSize: '12px' }}>
            ML
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#ffffff' }}>María López</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1' }}>Proveedor</p>
          </div>
        </div>
      </aside>
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        <header style={{ height: '56px', backgroundColor: '#0c1324', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', boxSizing: 'border-box' }}>
          <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
            ORGANIZACIÓN: <span style={{ color: '#ffffff', fontWeight: 'bold' }}>Centro Deportivo Norte</span>
          </div>
          <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600' }}>
            02 - PROVEEDOR
          </div>
        </header>

        <main style={{ flexGrow: 1, padding: '40px', backgroundColor: '#080d1a', overflowY: 'auto', boxSizing: 'border-box' }}>
          <div style={{ maxWidth: '1050px', margin: '0 auto', width: '100%' }}>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '28px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#93c5fd', fontWeight: '600', marginBottom: '4px' }}>Gestión &gt; Agenda</p>
                <h3 style={{ fontSize: '26px', fontWeight: 'bold', margin: '0 0 6px 0', color: '#ffffff' }}>Administración de Agenda</h3>
                <p style={{ fontSize: '14px', color: '#cbd5e1', margin: 0 }}>Controla y gestiona el estado de las citas programadas con alto contraste visual.</p>
              </div>
              <Link
                href="/agendar-cita"
                style={{ padding: '10px 18px', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '13px', fontWeight: 'bold', borderRadius: '8px', border: '2px solid #93c5fd', textDecoration: 'none' }}
              >
                + Nueva cita
              </Link>
            </div>

            {cargando && (
              <div role="status" style={{ padding: '12px 16px', marginBottom: '20px', borderRadius: '8px', border: '2px solid #334155', backgroundColor: '#0c1324', color: '#cbd5e1', fontSize: '14px' }}>
                Cargando agenda desde el servidor...
              </div>
            )}
            {error && (
              <div role="alert" style={{ padding: '12px 16px', marginBottom: '20px', borderRadius: '8px', border: '2px solid #f87171', backgroundColor: 'rgba(153, 27, 27, 0.35)', color: '#fee2e2', fontSize: '14px', fontWeight: '600' }}>
                ⚠️ {error}{' '}
                <button type="button" onClick={() => cargarCitas(fechaSeleccionada || undefined)} style={{ background: 'transparent', border: 0, color: '#fecaca', textDecoration: 'underline', cursor: 'pointer', fontSize: '14px' }}>
                  Reintentar
                </button>
              </div>
            )}
            {mensajeAccesible && (
              <div
                role="status"
                aria-live="polite"
                style={{ padding: '12px 16px', marginBottom: '20px', borderRadius: '8px', border: '2px solid #60a5fa', backgroundColor: 'rgba(30, 58, 138, 0.45)', color: '#ffffff', fontSize: '14px', fontWeight: '600' }}
              >
                ℹ️ {mensajeAccesible}
              </div>
            )}

            <div style={{ padding: '24px', borderRadius: '12px', border: '2px solid #334155', backgroundColor: '#0c1324', boxSizing: 'border-box' }}>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid #334155', marginBottom: '20px' }}>
                <div>
                  <h6 style={{ fontWeight: 'bold', fontSize: '16px', color: '#ffffff', margin: '0 0 4px 0' }}>📅 Citas programadas</h6>
                  <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1' }}>Selecciona el nuevo estado directamente desde los controles de cada cita.</p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="text"
                    aria-label="Buscar cliente o servicio"
                    placeholder="Buscar cliente o servicio..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    style={{ padding: '9px 14px', backgroundColor: '#080d1a', borderRadius: '8px', border: '2px solid #475569', color: '#ffffff', fontSize: '13px', outline: 'none' }}
                  />
                  <input
                    type="date"
                    aria-label="Cambiar fecha de agenda"
                    value={fechaSeleccionada}
                    onChange={(e) => {
                      setFechaSeleccionada(e.target.value);
                      cargarCitas(e.target.value || undefined);
                    }}
                    style={{ padding: '8px 12px', backgroundColor: '#080d1a', borderRadius: '8px', border: '2px solid #475569', color: '#ffffff', fontSize: '13px', outline: 'none', colorScheme: 'dark' }}
                  />
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #334155', color: '#f1f5f9', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <th style={{ padding: '12px 14px' }}>Cliente</th>
                      <th style={{ padding: '12px 14px' }}>Servicio</th>
                      <th style={{ padding: '12px 14px' }}>Hora</th>
                      <th style={{ padding: '12px 14px' }}>Estado Actual</th>
                      <th style={{ padding: '12px 14px' }}>Cambiar Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citasFiltradas.map((cita) => {
                      const badge = obtenerEstiloBadge(cita.estado);
                      return (
                        <tr key={cita.id} style={{ borderBottom: '1px solid #334155', fontSize: '14px' }}>
                          <td style={{ padding: '16px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#1e293b', border: '2px solid #60a5fa', color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}>
                                {cita.iniciales}
                              </span>
                              <div>
                                <p style={{ margin: 0, fontWeight: 'bold', color: '#ffffff' }}>{cita.cliente}</p>
                                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#cbd5e1' }}>Cliente</p>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '16px 14px' }}>
                            <p style={{ margin: 0, fontWeight: 'bold', color: '#ffffff' }}>{cita.servicio}</p>
                            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#cbd5e1' }}>{cita.detalleServicio}</p>
                          </td>

                          <td style={{ padding: '16px 14px', fontWeight: 'bold', color: '#f8fafc', whiteSpace: 'nowrap' }}>
                            🕒 {cita.horario}
                          </td>

                          <td style={{ padding: '16px 14px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', border: badge.border, backgroundColor: badge.backgroundColor, color: badge.color, whiteSpace: 'nowrap' }}>
                              <span aria-hidden="true">{badge.icono}</span>
                              {cita.estado}
                            </span>
                          </td>

                          <td style={{ padding: '16px 14px' }}>
                            <div role="group" aria-label={`Acciones de la cita de ${cita.cliente}`} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {ACCIONES.filter((opcion) =>
                                accionesDisponibles(cita.status).includes(opcion.accion)
                              ).map((opcion) => (
                                <button
                                  key={opcion.accion}
                                  type="button"
                                  disabled={accionEnCurso === cita.id}
                                  onClick={() => handleCambiarEstado(cita.id, opcion.accion, cita.cliente)}
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    cursor: accionEnCurso === cita.id ? 'not-allowed' : 'pointer',
                                    backgroundColor: '#080d1a',
                                    color: '#f8fafc',
                                    border: '2px solid #64748b',
                                  }}
                                >
                                  {opcion.etiqueta}
                                </button>
                              ))}
                              {accionesDisponibles(cita.status).length === 0 && (
                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Sin acciones disponibles</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!cargando && citasFiltradas.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: '24px 14px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                          No hay citas para los filtros seleccionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #334155', fontSize: '13px', color: '#f1f5f9' }}>
                <span style={{ fontWeight: '600' }}>{citasFiltradas.length} citas programadas</span>
                <div style={{ display: 'flex', gap: '16px', fontWeight: '600' }}>
                  <span>✓ {totalFinalizadas} finalizadas</span>
                  <span>▶ {totalEnProgreso} en progreso</span>
                  <span>⏱ {totalPendientes} pendientes</span>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
