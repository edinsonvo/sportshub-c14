'use client';

import React, { useState } from 'react';
import Link from 'next/link';

type EstadoCita = 'Finalizada' | 'En progreso' | 'Pendiente' | 'Cancelada';

interface CitaAgenda {
  id: string;
  cliente: string;
  iniciales: string;
  servicio: string;
  detalleServicio: string;
  horario: string;
  estado: EstadoCita;
}

const CITAS_INICIALES: CitaAgenda[] = [
  {
    id: '1',
    cliente: 'Juan Pérez',
    iniciales: 'JP',
    servicio: 'Cancha de Fútbol',
    detalleServicio: 'Cancha 2 · 60 min',
    horario: '14:00 - 15:00',
    estado: 'Finalizada',
  },
  {
    id: '2',
    cliente: 'Carlos Gómez',
    iniciales: 'CG',
    servicio: 'Clase de Natación',
    detalleServicio: 'Piscina principal · 60 min',
    horario: '16:00 - 17:00',
    estado: 'En progreso',
  },
  {
    id: '3',
    cliente: 'Ana Martínez',
    iniciales: 'AM',
    servicio: 'Entrenamiento Funcional',
    detalleServicio: 'Sala funcional · 60 min',
    horario: '18:00 - 19:00',
    estado: 'Pendiente',
  },
];

const ESTADOS_DISPONIBLES: EstadoCita[] = [
  'Finalizada',
  'En progreso',
  'Pendiente',
  'Cancelada',
];

export default function AdministracionAgendaPage() {
  const [citas, setCitas] = useState<CitaAgenda[]>(CITAS_INICIALES);
  const [busqueda, setBusqueda] = useState<string>('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('2026-11-12');
  const [mensajeAccesible, setMensajeAccesible] = useState<string>('');

  function handleCambiarEstado(id: string, nuevoEstado: EstadoCita, cliente: string) {
    setCitas((prev) =>
      prev.map((cita) =>
        cita.id === id ? { ...cita, estado: nuevoEstado } : cita
      )
    );
    setMensajeAccesible(
      `Estado de la cita de ${cliente} actualizado a "${nuevoEstado}".`
    );
  }

  function obtenerEstiloBadge(estado: EstadoCita) {
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
                    onChange={(e) => setFechaSeleccionada(e.target.value)}
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
                            <div role="group" aria-label={`Cambiar estado de ${cita.cliente}`} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {ESTADOS_DISPONIBLES.map((opcion) => {
                                const esActual = cita.estado === opcion;
                                return (
                                  <button
                                    key={opcion}
                                    type="button"
                                    aria-pressed={esActual}
                                    onClick={() => handleCambiarEstado(cita.id, opcion, cita.cliente)}
                                    style={{
                                      padding: '6px 10px',
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                      fontWeight: 'bold',
                                      cursor: 'pointer',
                                      backgroundColor: esActual ? '#ffffff' : '#080d1a',
                                      color: esActual ? '#080d1a' : '#f8fafc',
                                      border: esActual ? '3px solid #38bdf8' : '2px solid #64748b',
                                      textDecoration: esActual ? 'underline' : 'none',
                                    }}
                                  >
                                    {esActual ? `✓ ${opcion}` : opcion}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
