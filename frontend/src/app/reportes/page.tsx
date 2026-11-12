'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ServicioReporte {
  id: string;
  nombre: string;
  categoria: string;
  solicitudes: number;
  tendencia: string;
}

const DATOS_MOCK_REPORTES: ServicioReporte[] = [
  {
    id: '1',
    nombre: 'Entrenamiento Funcional',
    categoria: 'Entrenamiento',
    solicitudes: 98,
    tendencia: '+12%',
  },
  {
    id: '2',
    nombre: 'Cancha de Fútbol',
    categoria: 'Alquiler de espacios',
    solicitudes: 150,
    tendencia: '+18%',
  },
  {
    id: '3',
    nombre: 'Clase de Natación',
    categoria: 'Clases dirigidas',
    solicitudes: 45,
    tendencia: '+6%',
  },
];

export default function ReporteUsoServiciosPage() {
  const [fechaInicio, setFechaInicio] = useState<string>('2025-01-01');
  const [fechaFin, setFechaFin] = useState<string>('2025-01-31');
  const [resultados, setResultados] = useState<ServicioReporte[]>([]);
  const [reporteGenerado, setReporteGenerado] = useState<boolean>(false);
  const [errorFecha, setErrorFecha] = useState<string>('');

  function handleGenerarReporte(e: React.FormEvent) {
    e.preventDefault();
    setErrorFecha('');

    if (!fechaInicio || !fechaFin) {
      setErrorFecha('Por favor selecciona una fecha de inicio y una fecha de fin.');
      return;
    }

    if (fechaInicio > fechaFin) {
      setErrorFecha('La fecha de inicio no puede ser mayor a la fecha de fin.');
      return;
    }

    setReporteGenerado(true);

    if (!fechaInicio.startsWith('2025-01')) {
      setResultados([]);
      return;
    }

    const ordenados = [...DATOS_MOCK_REPORTES].sort(
      (a, b) => b.solicitudes - a.solicitudes
    );
    setResultados(ordenados);
  }

  return (
    <div style={{ display: 'flex', backgroundColor: '#080d1a', minHeight: '100vh', width: '100vw', margin: 0, padding: 0, color: '#ffffff', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      
      <aside style={{ width: '260px', backgroundColor: '#0c1324', borderRight: '1px solid #1e293b', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexShrink: 0, boxSizing: 'border-box' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <img src="/logo.png" alt="SportsHub" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
            <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '0.5px' }}>SportsHub</span>
          </div>
          
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button type="button" style={{ textAlign: 'left', padding: '8px 12px', backgroundColor: 'transparent', color: '#94a3b8', fontSize: '14px', fontWeight: '500', border: '0', cursor: 'pointer' }}>
              📊 Resumen / Dashboard
            </button>
            <Link href="/registrar-servicio" style={{ textDecoration: 'none', textAlign: 'left', padding: '8px 12px', backgroundColor: 'transparent', color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>
              ▶️ Catálogo de Servicios
            </Link>
            <button type="button" style={{ textAlign: 'left', padding: '8px 12px', backgroundColor: 'transparent', color: '#94a3b8', fontSize: '14px', fontWeight: '500', border: '0', cursor: 'pointer' }}>
              👥 Personal Operativo
            </button>
            <button type="button" style={{ textAlign: 'left', padding: '8px 12px', backgroundColor: 'rgba(37, 99, 235, 0.15)', color: '#3b82f6', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: '0', cursor: 'pointer' }}>
              📈 Reportes
            </button>
            <button type="button" style={{ textAlign: 'left', padding: '8px 12px', backgroundColor: 'transparent', color: '#94a3b8', fontSize: '14px', fontWeight: '500', border: '0', cursor: 'pointer' }}>
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
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Proveedor</p>
          </div>
        </div>
      </aside>
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        <header style={{ height: '56px', backgroundColor: '#0c1324', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', boxSizing: 'border-box' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            ORGANIZACIÓN: <span style={{ color: '#ffffff', fontWeight: 'bold' }}>Centro Deportivo Norte</span>
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>
            02 - PROVEEDOR
          </div>
        </header>

        <main style={{ flexGrow: 1, padding: '40px', backgroundColor: '#080d1a', overflowY: 'auto', boxSizing: 'border-box' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
            <p style={{ fontSize: '12px', color: '#2563eb', marginBottom: '4px' }}>Catálogo de Servicios &gt; Reportes</p>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 6px 0', color: '#ffffff' }}>Reporte de uso de servicios</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 28px 0' }}>Consulta la demanda y solicitudes de tus servicios deportivos.</p>

            <form onSubmit={handleGenerarReporte} style={{ padding: '24px', borderRadius: '12px', border: '1px solid #1e293b', backgroundColor: '#0c1324', marginBottom: '24px', boxSizing: 'border-box' }}>
              <div style={{ marginBottom: '16px' }}>
                <h6 style={{ fontWeight: 'bold', fontSize: '14px', color: '#ffffff', margin: '0 0 4px 0' }}>Periodo del reporte</h6>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Selecciona el rango de fechas que deseas consultar.</p>
              </div>

              {errorFecha && (
                <div style={{ fontSize: '13px', padding: '10px 14px', marginBottom: '16px', borderRadius: '8px', border: '1px solid #ef4444', backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#f87171' }}>
                  {errorFecha}
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 220px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#cbd5e1' }}>
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', backgroundColor: '#080d1a', borderRadius: '8px', border: '1px solid #334155', color: '#ffffff', fontSize: '13px', boxSizing: 'border-box', outline: 'none', colorScheme: 'dark' }}
                  />
                </div>

                <div style={{ flex: '1 1 220px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#cbd5e1' }}>
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', backgroundColor: '#080d1a', borderRadius: '8px', border: '1px solid #334155', color: '#ffffff', fontSize: '13px', boxSizing: 'border-box', outline: 'none', colorScheme: 'dark' }}
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    style={{ padding: '11px 24px', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '13px', fontWeight: 'bold', borderRadius: '8px', border: '0', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Generar reporte de uso de servicios
                  </button>
                </div>
              </div>
            </form>

            {reporteGenerado && (
              <>
                {resultados.length === 0 ? (
                  <div style={{ padding: '48px 24px', borderRadius: '12px', border: '1px solid #1e293b', backgroundColor: '#0c1324', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '15px', color: '#94a3b8', fontWeight: '500' }}>
                      No se registran solicitudes de servicios en el periodo seleccionado
                    </p>
                  </div>
                ) : (
                  <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid #1e293b', backgroundColor: '#0c1324', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div>
                        <h6 style={{ fontWeight: 'bold', fontSize: '15px', color: '#ffffff', margin: '0 0 4px 0' }}>Servicios con mayor demanda</h6>
                        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Ordenados por solicitudes recibidas (de mayor a menor).</p>
                      </div>
                      <span style={{ fontSize: '11px', padding: '4px 10px', backgroundColor: '#1e293b', color: '#94a3b8', borderRadius: '6px', fontWeight: 'bold' }}>
                        {resultados.length} servicios
                      </span>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #1e293b', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            <th style={{ padding: '12px 16px' }}>Nombre del Servicio</th>
                            <th style={{ padding: '12px 16px' }}>Categoría</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Solicitudes Recibidas</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Tendencia</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resultados.map((servicio, idx) => (
                            <tr key={servicio.id} style={{ borderBottom: '1px solid #1e293b', fontSize: '13px' }}>
                              <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 'bold', color: '#ffffff' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '6px', backgroundColor: 'rgba(37, 99, 235, 0.15)', color: '#3b82f6', fontSize: '11px', fontWeight: 'bold' }}>
                                  {String(idx + 1).padStart(2, '0')}
                                </span>
                                {servicio.nombre}
                              </td>
                              <td style={{ padding: '16px' }}>
                                <span style={{ padding: '4px 10px', backgroundColor: '#080d1a', border: '1px solid #1e293b', borderRadius: '6px', fontSize: '12px', color: '#cbd5e1' }}>
                                  {servicio.categoria}
                                </span>
                              </td>
                              <td style={{ padding: '16px', textAlign: 'right' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#ffffff' }}>{servicio.solicitudes}</span>{' '}
                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>solicitudes</span>
                              </td>
                              <td style={{ padding: '16px', textAlign: 'right' }}>
                                <span style={{ padding: '4px 8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                                  {servicio.tendencia}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '12px', color: '#94a3b8' }}>
                      <span>Mostrando {resultados.length} de {resultados.length} resultados</span>
                      <span>Última actualización: hoy</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
