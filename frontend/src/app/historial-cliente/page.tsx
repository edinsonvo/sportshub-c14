'use client';

import React, { useState } from 'react';
import Link from 'next/link';

type EstadoCita = 'Agendada' | 'Realizada' | 'Cancelada';

interface Cita {
  id: string;
  fecha: string; // YYYY-MM-DD
  hora: string;
  servicio: string;
  estado: EstadoCita;
  centro: string;
}

const CENTRO_PROVEEDOR = 'Centro Deportivo Norte';

const CLIENTE_MOCK = {
  nombre: 'Laura Gómez',
  iniciales: 'LG',
  email: 'laura.gomez@email.com',
  telefono: '+34 612 458 219',
  desde: 'mar 2025',
};

const DATOS_MOCK_CITAS: Cita[] = [
  { id: '1', fecha: '2026-12-05', hora: '10:00', servicio: 'Clase de Natación', estado: 'Agendada', centro: 'Centro Deportivo Norte' },
  { id: '2', fecha: '2026-11-28', hora: '16:30', servicio: 'Entrenamiento Funcional', estado: 'Agendada', centro: 'Centro Deportivo Norte' },
  { id: '3', fecha: '2026-11-25', hora: '08:00', servicio: 'Cancha de Fútbol', estado: 'Agendada', centro: 'Centro Deportivo Norte' },
  { id: '4', fecha: '2026-11-12', hora: '18:00', servicio: 'Entrenamiento Funcional', estado: 'Realizada', centro: 'Centro Deportivo Norte' },
  { id: '5', fecha: '2026-10-30', hora: '09:00', servicio: 'Clase de Natación', estado: 'Realizada', centro: 'Centro Deportivo Norte' },
  { id: '6', fecha: '2026-10-15', hora: '19:00', servicio: 'Cancha de Fútbol', estado: 'Cancelada', centro: 'Centro Deportivo Norte' },
  { id: '7', fecha: '2026-09-20', hora: '07:30', servicio: 'Entrenamiento Funcional', estado: 'Realizada', centro: 'Centro Deportivo Norte' },
  { id: '8', fecha: '2026-08-02', hora: '17:00', servicio: 'Clase de Natación', estado: 'Cancelada', centro: 'Centro Deportivo Norte' },
  { id: '9', fecha: '2026-03-14', hora: '11:00', servicio: 'Clase de Natación', estado: 'Realizada', centro: 'Centro Deportivo Norte' },
  // Cita de otro centro: no debe mostrarse (Escenario 2)
  { id: '10', fecha: '2026-10-10', hora: '12:00', servicio: 'Yoga', estado: 'Realizada', centro: 'Centro Deportivo Sur' },
];

const COLORES_ESTADO: Record<EstadoCita, { fondo: string; texto: string }> = {
  Agendada: { fondo: 'rgba(59, 130, 246, 0.15)', texto: '#60a5fa' },
  Realizada: { fondo: 'rgba(16, 185, 129, 0.15)', texto: '#34d399' },
  Cancelada: { fondo: 'rgba(239, 68, 68, 0.15)', texto: '#f87171' },
};

function formatearFecha(iso: string): string {
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}

const estiloInput: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  backgroundColor: '#080d1a',
  borderRadius: '10px',
  border: '1px solid #334155',
  color: '#ffffff',
  fontSize: '14px',
  boxSizing: 'border-box',
  outline: 'none',
  colorScheme: 'dark',
};

const estiloLabel: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 'bold',
  marginBottom: '8px',
  color: '#cbd5e1',
};

export default function HistorialCitasClientePage() {
  // Escenario 2: solo las citas del centro del proveedor
  const citasDelCentro = DATOS_MOCK_CITAS.filter((c) => c.centro === CENTRO_PROVEEDOR);

  const [fechaInicio, setFechaInicio] = useState<string>('2026-01-01');
  const [fechaFin, setFechaFin] = useState<string>('2026-12-31');
  const [estado, setEstado] = useState<'Todos' | EstadoCita>('Todos');
  const [errorFecha, setErrorFecha] = useState<string>('');

  // Escenario 1: al ingresar se muestran todas las citas del cliente
  const [resultados, setResultados] = useState<Cita[]>(
    [...citasDelCentro].sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`))
  );

  const resumen = {
    total: citasDelCentro.length,
    realizadas: citasDelCentro.filter((c) => c.estado === 'Realizada').length,
    agendadas: citasDelCentro.filter((c) => c.estado === 'Agendada').length,
    canceladas: citasDelCentro.filter((c) => c.estado === 'Cancelada').length,
  };

  const tarjetas = [
    { valor: resumen.total, etiqueta: 'Total', color: '#ffffff' },
    { valor: resumen.realizadas, etiqueta: 'Realizadas', color: '#34d399' },
    { valor: resumen.agendadas, etiqueta: 'Agendadas', color: '#60a5fa' },
    { valor: resumen.canceladas, etiqueta: 'Canceladas', color: '#f87171' },
  ];

  const itemsNav = [
    { icono: '📊', texto: 'Resumen / Dashboard', activo: false },
    { icono: '📋', texto: 'Catálogo de Servicios', activo: false },
    { icono: '👥', texto: 'Personal Operativo', activo: false },
    { icono: '👤', texto: 'Clientes', activo: true },
    { icono: '📈', texto: 'Reportes', activo: false },
    { icono: '⚙️', texto: 'Configuración', activo: false },
  ];

  function handleFiltrar(e: React.FormEvent) {
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

    const filtradas = citasDelCentro
      .filter(
        (c) =>
          c.fecha >= fechaInicio &&
          c.fecha <= fechaFin &&
          (estado === 'Todos' || c.estado === estado)
      )
      .sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`));

    setResultados(filtradas);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#080d1a', minHeight: '100vh', width: '100vw', margin: 0, padding: 0, color: '#ffffff', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>

      <header style={{ height: '64px', backgroundColor: '#0c1324', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', boxSizing: 'border-box', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '48px', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.png" alt="SportsHub" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>SportsHub</span>
          </div>
          <nav style={{ display: 'flex', gap: '32px', height: '100%' }}>
            {['Inicio', 'Agenda', 'Servicios', 'Gestión'].map((item) => (
              <button
                key={item}
                type="button"
                style={{ background: 'transparent', border: '0', borderBottom: item === 'Gestión' ? '2px solid #3b82f6' : '2px solid transparent', color: item === 'Gestión' ? '#ffffff' : '#94a3b8', fontWeight: item === 'Gestión' ? 'bold' : '500', fontSize: '14px', cursor: 'pointer', height: '100%' }}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#ffffff' }}>María López</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Administrador</p>
          </div>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#1e3a8a', border: '1px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#93c5fd', fontSize: '12px' }}>
            ML
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flexGrow: 1 }}>

        <aside style={{ width: '260px', backgroundColor: '#0c1324', borderRight: '1px solid #1e293b', padding: '24px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexShrink: 0, boxSizing: 'border-box' }}>
          <div>
            <p style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#64748b', fontWeight: 'bold', margin: '0 0 16px 12px' }}>GESTIÓN</p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {itemsNav.map((item) => (
                <button
                  key={item.texto}
                  type="button"
                  style={{ textAlign: 'left', padding: '12px 14px', backgroundColor: item.activo ? 'rgba(37, 99, 235, 0.25)' : 'transparent', border: item.activo ? '1px solid #2563eb' : '1px solid transparent', borderRadius: '10px', color: item.activo ? '#ffffff' : '#94a3b8', fontSize: '14px', fontWeight: item.activo ? 'bold' : '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <span>{item.icono}</span>
                  {item.texto}
                </button>
              ))}
            </nav>
          </div>

          <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #1e293b', backgroundColor: '#0f172a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34d399' }} />
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffff' }}>Centro operativo</span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
              Todos los servicios funcionan con normalidad.
            </p>
          </div>
        </aside>

        <main style={{ flexGrow: 1, padding: '40px', backgroundColor: '#080d1a', overflowY: 'auto', boxSizing: 'border-box' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>

            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0' }}>
              <Link href="/clientes" style={{ color: '#64748b', textDecoration: 'none' }}>Clientes</Link>
              {' / '}
              <span>{CLIENTE_MOCK.nombre}</span>
              {' / '}
              <span style={{ color: '#ffffff', fontWeight: 'bold' }}>Historial de citas</span>
            </p>

            <h3 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#ffffff' }}>Historial de citas</h3>
            <p style={{ fontSize: '15px', color: '#94a3b8', margin: '0 0 28px 0' }}>
              Consulta todas las citas que ha solicitado el cliente en tu centro deportivo.
            </p>

            <section style={{ padding: '24px', borderRadius: '16px', border: '1px solid #1e293b', backgroundColor: '#0c1324', marginBottom: '24px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#1e3a8a', border: '1px solid #2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#93c5fd', fontSize: '22px', flexShrink: 0 }}>
                  {CLIENTE_MOCK.iniciales}
                </div>
                <div>
                  <p style={{ margin: '0 0 2px 0', fontSize: '11px', letterSpacing: '1.5px', color: '#64748b', fontWeight: 'bold' }}>CLIENTE</p>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: 'bold', color: '#ffffff' }}>{CLIENTE_MOCK.nombre}</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                    {CLIENTE_MOCK.email} &nbsp;•&nbsp; {CLIENTE_MOCK.telefono} &nbsp;•&nbsp; Cliente desde {CLIENTE_MOCK.desde}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                {tarjetas.map((t) => (
                  <div key={t.etiqueta} style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid #1e293b', backgroundColor: '#080d1a' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '26px', fontWeight: 'bold', color: t.color }}>{t.valor}</p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>{t.etiqueta}</p>
                  </div>
                ))}
              </div>
            </section>

            <form onSubmit={handleFiltrar} style={{ padding: '24px', borderRadius: '16px', border: '1px solid #1e293b', backgroundColor: '#0c1324', marginBottom: '24px', boxSizing: 'border-box' }}>
              <h6 style={{ fontWeight: 'bold', fontSize: '18px', color: '#ffffff', margin: '0 0 6px 0' }}>Filtrar historial</h6>
              <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#94a3b8' }}>
                Selecciona el rango de fechas y el estado que deseas consultar
              </p>

              {errorFecha && (
                <div style={{ fontSize: '13px', padding: '10px 14px', marginBottom: '16px', borderRadius: '8px', border: '1px solid #ef4444', backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#f87171' }}>
                  {errorFecha}
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={estiloLabel}>Fecha Inicio</label>
                  <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} style={estiloInput} />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={estiloLabel}>Fecha Fin</label>
                  <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} style={estiloInput} />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={estiloLabel}>Estado</label>
                  <select value={estado} onChange={(e) => setEstado(e.target.value as 'Todos' | EstadoCita)} style={estiloInput}>
                    <option value="Todos">Todos</option>
                    <option value="Agendada">Agendada</option>
                    <option value="Realizada">Realizada</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>
                <div>
                  <button
                    type="submit"
                    style={{ padding: '13px 28px', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '14px', fontWeight: 'bold', borderRadius: '10px', border: '0', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Filtrar
                  </button>
                </div>
              </div>
            </form>

            {resultados.length === 0 ? (
              <div style={{ padding: '48px 24px', borderRadius: '16px', border: '1px solid #1e293b', backgroundColor: '#0c1324', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '15px', color: '#94a3b8', fontWeight: '500' }}>
                  No se encontraron citas para el periodo y estado seleccionados
                </p>
              </div>
            ) : (
              <div style={{ padding: '24px', borderRadius: '16px', border: '1px solid #1e293b', backgroundColor: '#0c1324', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h6 style={{ fontWeight: 'bold', fontSize: '18px', color: '#ffffff', margin: '0 0 4px 0' }}>Citas del cliente</h6>
                    <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Ordenadas de la más reciente a la más antigua.</p>
                  </div>
                  <span style={{ fontSize: '11px', padding: '4px 10px', backgroundColor: '#1e293b', color: '#94a3b8', borderRadius: '6px', fontWeight: 'bold' }}>
                    {resultados.length} citas
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #1e293b', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <th style={{ padding: '12px 16px' }}>Fecha</th>
                        <th style={{ padding: '12px 16px' }}>Hora</th>
                        <th style={{ padding: '12px 16px' }}>Servicio</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultados.map((cita) => (
                        <tr key={cita.id} style={{ borderBottom: '1px solid #1e293b', fontSize: '14px' }}>
                          <td style={{ padding: '16px', fontWeight: 'bold', color: '#ffffff' }}>{formatearFecha(cita.fecha)}</td>
                          <td style={{ padding: '16px', color: '#cbd5e1' }}>{cita.hora}</td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ padding: '4px 10px', backgroundColor: '#080d1a', border: '1px solid #1e293b', borderRadius: '6px', fontSize: '13px', color: '#cbd5e1' }}>
                              {cita.servicio}
                            </span>
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right' }}>
                            <span style={{ padding: '4px 10px', backgroundColor: COLORES_ESTADO[cita.estado].fondo, color: COLORES_ESTADO[cita.estado].texto, borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                              {cita.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '16px', fontSize: '12px', color: '#94a3b8' }}>
                  Mostrando {resultados.length} de {resultados.length} resultados
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
