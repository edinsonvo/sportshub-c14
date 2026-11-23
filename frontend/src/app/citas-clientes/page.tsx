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
  mapEstadoCliente,
  type AppointmentAction,
  type AppointmentStatus,
  type EstadoCliente,
} from '@/lib/appointments';

type EstadoCita = EstadoCliente;

interface OpcionEstado {
  estado: EstadoCita;
  accion?: AppointmentAction;
}

interface CitaCliente {
  id: string;
  cliente: string;
  iniciales: string;
  espacio: string;
  fecha: string;
  horario: string;
  estado: EstadoCita;
  status: AppointmentStatus;
}

const ESTADOS_DISPONIBLES: EstadoCita[] = [
  'Pendiente',
  'Confirmada',
  'Cancelada',
  'Finalizada',
];

function opcionesDeEstado(status: AppointmentStatus): OpcionEstado[] {
  switch (status) {
    case 'SOLICITADA':
      return [
        { estado: 'Pendiente' },
        { estado: 'Confirmada', accion: 'confirm' },
        { estado: 'Cancelada', accion: 'cancel' },
      ];
    case 'CONFIRMADA':
    case 'REPROGRAMADA':
      return [
        { estado: 'Confirmada' },
        { estado: 'Finalizada', accion: 'complete' },
        { estado: 'Cancelada', accion: 'cancel' },
      ];
    case 'COMPLETADA':
      return [{ estado: 'Finalizada' }];
    default:
      return [{ estado: 'Cancelada' }];
  }
}

export default function ConsultarCitasClientesPage() {
  const router = useRouter();
  const [citas, setCitas] = useState<CitaCliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string>('');
  const [guardando, setGuardando] = useState(false);

  const [busqueda, setBusqueda] = useState('');
  const [fecha, setFecha] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('Todos los estados');

  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [fechaAplicada, setFechaAplicada] = useState('');
  const [estadoAplicado, setEstadoAplicado] = useState('Todos los estados');

  const [citaEditando, setCitaEditando] = useState<string | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<EstadoCita>('Pendiente');

  const [paginaActual, setPaginaActual] = useState(1);

  const CITAS_POR_PAGINA = 5;

  async function cargarCitas() {
    const session = loadSession();
    if (!session?.accessToken) {
      router.replace('/login');
      return;
    }

    setCargando(true);
    setError('');
    try {
      const [appointments, clientes, servicios] = await Promise.all([
        getAppointments(session.accessToken),
        getClients(session.accessToken),
        getMyServices(session.accessToken),
      ]);

      const nombresClientes = new Map(clientes.map((c) => [c.id, c.fullName]));
      const nombresServicios = new Map(servicios.map((s) => [s.id, s.name]));

      setCitas(
        appointments.map((cita) => ({
          id: cita.id,
          cliente: nombresClientes.get(cita.clientId) ?? 'Cliente',
          iniciales: initials(nombresClientes.get(cita.clientId)),
          espacio: nombresServicios.get(cita.providerServiceId) ?? 'Servicio',
          fecha: cita.date,
          horario: `${formatTime(cita.startTime)} - ${formatTime(cita.endTime)}`,
          estado: mapEstadoCliente(cita.status),
          status: cita.status,
        })),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No fue posible cargar las citas.',
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarCitas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Filtrar citas
  const citasFiltradas = citas.filter((cita) => {
    const coincideCliente = cita.cliente
      .toLowerCase()
      .includes(busquedaAplicada.toLowerCase());

    const coincideFecha =
      !fechaAplicada || cita.fecha === fechaAplicada;

    const coincideEstado =
      estadoAplicado === 'Todos los estados' ||
      cita.estado === estadoAplicado;

    return coincideCliente && coincideFecha && coincideEstado;
  });

  // Paginación
  const totalPaginas = Math.max(
    1,
    Math.ceil(citasFiltradas.length / CITAS_POR_PAGINA)
  );

  const citasPagina = citasFiltradas.slice(
    (paginaActual - 1) * CITAS_POR_PAGINA,
    paginaActual * CITAS_POR_PAGINA
  );

  // Buscar citas
  function handleBuscar() {
    setBusquedaAplicada(busqueda);
    setFechaAplicada(fecha);
    setEstadoAplicado(estadoFiltro);
    setPaginaActual(1);
  }

  // Limpiar filtros
  function handleLimpiar() {
    setBusqueda('');
    setFecha('');
    setEstadoFiltro('Todos los estados');

    setBusquedaAplicada('');
    setFechaAplicada('');
    setEstadoAplicado('Todos los estados');

    setPaginaActual(1);
  }

  // Abrir modificación de estado
  function handleAbrirEdicion(cita: CitaCliente) {
    setCitaEditando(cita.id);
    setNuevoEstado(cita.estado);
  }

  // Guardar nuevo estado en el backend
  async function handleGuardarEstado(cita: CitaCliente) {
    const opcion = opcionesDeEstado(cita.status).find(
      (item) => item.estado === nuevoEstado,
    );

    if (!opcion?.accion) {
      setCitaEditando(null);
      return;
    }

    const session = loadSession();
    if (!session?.accessToken) {
      router.replace('/login');
      return;
    }

    setGuardando(true);
    setError('');
    try {
      await changeAppointmentStatus(
        session.accessToken,
        cita.id,
        opcion.accion,
      );
      await cargarCitas();
      setCitaEditando(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible actualizar el estado de la cita.',
      );
    } finally {
      setGuardando(false);
    }
  }

  // Estilos de los estados
  function obtenerEstiloEstado(estado: EstadoCita) {
    switch (estado) {
      case 'Pendiente':
        return {
          color: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid #b7791f',
        };

      case 'Confirmada':
        return {
          color: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid #059669',
        };

      case 'Cancelada':
        return {
          color: '#f87171',
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid #dc2626',
        };

      case 'Finalizada':
        return {
          color: '#93c5fd',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          border: '1px solid #3b82f6',
        };
    }
  }

  // Formato de fecha
  function formatearFecha(fecha: string) {
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${anio}`;
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#080f25',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        margin: 0,
      }}
    >

      {/* MENÚ LATERAL */}
      <aside
        style={{
          width: '188px',
          minHeight: '100vh',
          backgroundColor: '#0b142b',
          borderRight: '1px solid #233354',
          padding: '20px 10px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0,
          boxSizing: 'border-box',
        }}
      >
        <div>
          {/* LOGO */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '0 10px',
              marginBottom: '40px',
            }}
          >
            <span style={{ fontSize: '25px', color: '#2563eb' }}>
              ◖◗
            </span>

            <span
              style={{
                fontSize: '17px',
                fontWeight: 'bold',
                color: '#ffffff',
              }}
            >
              SportsHub
            </span>
          </div>

          <p
            style={{
              fontSize: '9px',
              letterSpacing: '2px',
              color: '#8da3c7',
              margin: '0 10px 20px',
              fontWeight: 'bold',
            }}
          >
            ESPACIO DE TRABAJO
          </p>

          {/* NAVEGACIÓN */}
          <nav
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <Link
              href="/dashboard"
              style={estiloMenu}
            >
              ▦ &nbsp; Resumen / Dashboard
            </Link>

            <Link
              href="/servicios"
              style={estiloMenu}
            >
              ☷ &nbsp; Catálogo de Servicios
            </Link>

            <Link
              href="/consultar-citas"
              style={{
                ...estiloMenu,
                backgroundColor: '#132b53',
                color: '#ffffff',
                border: '1px solid #25477c',
              }}
            >
              ▦ &nbsp; Citas de clientes
            </Link>

            <Link
              href="/personal-operativo"
              style={estiloMenu}
            >
              ♙ &nbsp; Personal Operativo
            </Link>

            <Link
              href="/configuracion"
              style={estiloMenu}
            >
              ⚙ &nbsp; Configuración
            </Link>
          </nav>
        </div>

        {/* USUARIO */}
        <div
          style={{
            borderTop: '1px solid #233354',
            paddingTop: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
          }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: '#1d4ed8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 'bold',
            }}
          >
            ML
          </div>

          <div>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 'bold' }}>
              María López
            </p>
            <p style={{ margin: '3px 0 0', fontSize: '9px', color: '#8da3c7' }}>
              Administradora
            </p>
          </div>

          <span style={{ marginLeft: 'auto', color: '#8da3c7' }}>
            •••
          </span>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >

        {/* BARRA SUPERIOR */}
        <header
          style={{
            height: '58px',
            backgroundColor: '#0b142b',
            borderBottom: '1px solid #233354',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 26px',
            boxSizing: 'border-box',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '9px',
                letterSpacing: '1.5px',
                color: '#93b4e9',
              }}
            >
              ORGANIZACIÓN
            </p>

            <p
              style={{
                margin: '3px 0 0',
                fontSize: '11px',
                fontWeight: 'bold',
              }}
            >
              Centro Deportivo Norte
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '10px',
              color: '#93b4e9',
            }}
          >
            <span style={estiloEtiqueta}>HU-38</span>
            <span style={estiloEtiqueta}>Inicial</span>
            <span>Validación</span>
            <span>Resultado</span>
            <span style={estiloEtiqueta}>♧</span>
          </div>
        </header>

        {/* ÁREA DE TRABAJO */}
        <main
          style={{
            flex: 1,
            padding: '24px 30px',
            boxSizing: 'border-box',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              maxWidth: '1100px',
              margin: '0 auto',
              width: '100%',
            }}
          >

            {/* TÍTULO */}
            <div style={{ marginBottom: '25px' }}>
              <p
                style={{
                  fontSize: '10px',
                  color: '#93b4e9',
                  marginBottom: '12px',
                }}
              >
                Gestión de Reservas &nbsp; › &nbsp;
                <span style={{ color: '#ffffff' }}>
                  Consultar Citas de Clientes
                </span>
              </p>

              <h2
                style={{
                  fontSize: '23px',
                  margin: '0 0 7px',
                  color: '#ffffff',
                }}
              >
                Consultar citas de clientes
              </h2>

              <p
                style={{
                  fontSize: '12px',
                  color: '#a8b9d6',
                  margin: 0,
                }}
              >
                Consulta las reservas realizadas por los clientes y verifica
                la información de cada cita.
              </p>
            </div>

            {cargando && (
              <div role="status" style={{ padding: '12px 16px', marginBottom: '14px', borderRadius: '8px', border: '1px solid #2a3c60', backgroundColor: '#111e3b', color: '#a8b9d6', fontSize: '12px' }}>
                Cargando citas desde el servidor...
              </div>
            )}
            {error && (
              <div role="alert" style={{ padding: '12px 16px', marginBottom: '14px', borderRadius: '8px', border: '1px solid #dc2626', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#fca5a5', fontSize: '12px' }}>
                ⚠️ {error}{' '}
                <button type="button" onClick={cargarCitas} style={{ background: 'transparent', border: 0, color: '#fca5a5', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px' }}>
                  Reintentar
                </button>
              </div>
            )}

            {/* FILTROS DE BÚSQUEDA */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr auto',
                gap: '16px',
                padding: '16px',
                backgroundColor: '#111e3b',
                border: '1px solid #2a3c60',
                borderRadius: '8px',
                marginBottom: '14px',
                alignItems: 'end',
                boxSizing: 'border-box',
              }}
            >

              <div>
                <label style={estiloLabel}>
                  Buscar cliente
                </label>

                <input
                  type="text"
                  placeholder="Nombre del cliente..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  style={estiloInput}
                />
              </div>

              <div>
                <label style={estiloLabel}>
                  Fecha de reserva
                </label>

                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  style={estiloInput}
                />
              </div>

              <div>
                <label style={estiloLabel}>
                  Estado de la reserva
                </label>

                <select
                  value={estadoFiltro}
                  onChange={(e) => setEstadoFiltro(e.target.value)}
                  style={estiloInput}
                >
                  <option>Todos los estados</option>
                  {ESTADOS_DISPONIBLES.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleBuscar}
                style={{
                  padding: '11px 20px',
                  backgroundColor: '#2563eb',
                  border: '1px solid #3b82f6',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                ⌕ &nbsp; Buscar citas
              </button>

              <button
                onClick={handleLimpiar}
                style={{
                  gridColumn: '1 / -1',
                  justifySelf: 'start',
                  background: 'transparent',
                  color: '#93b4e9',
                  border: 'none',
                  fontSize: '10px',
                  cursor: 'pointer',
                }}
              >
                Limpiar filtros
              </button>
            </div>

            {/* TABLA DE CITAS */}
            <div
              style={{
                backgroundColor: '#111e3b',
                border: '1px solid #2a3c60',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >

              {/* ENCABEZADO DE TABLA */}
              <div
                style={{
                  padding: '14px 17px',
                  borderBottom: '1px solid #2a3c60',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span style={{ color: '#2583ff', fontSize: '17px' }}>
                  ▦
                </span>

                <h3
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    color: '#ffffff',
                  }}
                >
                  Listado de Citas
                </h3>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    textAlign: 'left',
                    minWidth: '850px',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: '1px solid #2a3c60',
                        color: '#ffffff',
                        fontSize: '10px',
                      }}
                    >
                      <th style={estiloCelda}>Cliente</th>
                      <th style={estiloCelda}>Espacio deportivo</th>
                      <th style={estiloCelda}>Fecha</th>
                      <th style={estiloCelda}>Horario</th>
                      <th style={estiloCelda}>Estado</th>
                      <th style={estiloCelda}>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {citasPagina.map((cita) => (
                      <tr
                        key={cita.id}
                        style={{
                          borderBottom: '1px solid #293957',
                          fontSize: '10px',
                          color: '#e2e8f0',
                        }}
                      >

                        {/* CLIENTE */}
                        <td style={estiloCelda}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '9px',
                            }}
                          >
                            <span
                              style={{
                                width: '23px',
                                height: '23px',
                                borderRadius: '50%',
                                backgroundColor: '#1b3765',
                                border: '1px solid #315b9b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '8px',
                                color: '#bfdbfe',
                              }}
                            >
                              {cita.iniciales}
                            </span>

                            <span style={{ fontWeight: 'bold' }}>
                              {cita.cliente}
                            </span>
                          </div>
                        </td>

                        {/* ESPACIO */}
                        <td style={estiloCelda}>
                          {cita.espacio}
                        </td>

                        {/* FECHA */}
                        <td style={estiloCelda}>
                          {formatearFecha(cita.fecha)}
                        </td>

                        {/* HORARIO */}
                        <td style={estiloCelda}>
                          {cita.horario}
                        </td>

                        {/* ESTADO */}
                        <td style={estiloCelda}>
                          <span
                            style={{
                              ...obtenerEstiloEstado(cita.estado),
                              padding: '3px 9px',
                              borderRadius: '15px',
                              fontSize: '9px',
                              fontWeight: 'bold',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {cita.estado}
                          </span>
                        </td>

                        {/* ACCIONES */}
                        <td style={estiloCelda}>
                          {citaEditando === cita.id ? (
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                              }}
                            >
                              <select
                                value={nuevoEstado}
                                onChange={(e) =>
                                  setNuevoEstado(
                                    e.target.value as EstadoCita
                                  )
                                }
                                style={{
                                  ...estiloInput,
                                  padding: '6px',
                                  fontSize: '10px',
                                }}
                              >
                                {opcionesDeEstado(cita.status).map((opcion) => (
                                  <option key={opcion.estado} value={opcion.estado}>
                                    {opcion.estado}
                                  </option>
                                ))}
                              </select>

                              <div style={{ display: 'flex', gap: '5px' }}>
                                <button
                                  onClick={() => handleGuardarEstado(cita)}
                                  disabled={guardando}
                                  style={estiloBotonGuardar}
                                >
                                  {guardando ? 'Guardando...' : 'Guardar'}
                                </button>

                                <button
                                  onClick={() => setCitaEditando(null)}
                                  style={estiloBotonCancelar}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAbrirEdicion(cita)}
                              disabled={opcionesDeEstado(cita.status).every(
                                (opcion) => !opcion.accion,
                              )}
                              style={{
                                padding: '6px 11px',
                                backgroundColor: 'transparent',
                                border: '1px solid #2563eb',
                                borderRadius: '5px',
                                color: '#ffffff',
                                fontSize: '9px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                              }}
                            >
                              Modificar estado
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {/* SIN RESULTADOS */}
                    {citasPagina.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          style={{
                            padding: '35px',
                            textAlign: 'center',
                            color: '#93a9cc',
                            fontSize: '12px',
                          }}
                        >
                          No se encontraron citas con los filtros seleccionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* PIE Y PAGINACIÓN */}
              <div
                style={{
                  padding: '12px 17px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid #2a3c60',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    color: '#a8c0e8',
                  }}
                >
                  Mostrando{' '}
                  {citasFiltradas.length === 0
                    ? 0
                    : (paginaActual - 1) * CITAS_POR_PAGINA + 1}
                  {' - '}
                  {Math.min(
                    paginaActual * CITAS_POR_PAGINA,
                    citasFiltradas.length
                  )}
                  {' de '}
                  {citasFiltradas.length} citas
                </span>

                <div style={{ display: 'flex', gap: '7px' }}>
                  <button
                    disabled={paginaActual === 1}
                    onClick={() =>
                      setPaginaActual((prev) => Math.max(1, prev - 1))
                    }
                    style={estiloPaginacion}
                  >
                    ‹
                  </button>

                  {Array.from(
                    { length: totalPaginas },
                    (_, i) => i + 1
                  ).map((pagina) => (
                    <button
                      key={pagina}
                      onClick={() => setPaginaActual(pagina)}
                      style={{
                        ...estiloPaginacion,
                        backgroundColor:
                          paginaActual === pagina ? '#2563eb' : 'transparent',
                        color: '#ffffff',
                        border:
                          paginaActual === pagina
                            ? '1px solid #2563eb'
                            : '1px solid #2a3c60',
                      }}
                    >
                      {pagina}
                    </button>
                  ))}

                  <button
                    disabled={paginaActual === totalPaginas}
                    onClick={() =>
                      setPaginaActual((prev) =>
                        Math.min(totalPaginas, prev + 1)
                      )
                    }
                    style={estiloPaginacion}
                  >
                    ›
                  </button>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ESTILOS GENERALES

const estiloMenu: React.CSSProperties = {
  display: 'block',
  padding: '11px 10px',
  borderRadius: '5px',
  textDecoration: 'none',
  color: '#b5c4dd',
  fontSize: '10px',
  fontWeight: '500',
};

const estiloEtiqueta: React.CSSProperties = {
  padding: '8px',
  border: '1px solid #293957',
  borderRadius: '5px',
  color: '#ffffff',
  fontSize: '9px',
};

const estiloLabel: React.CSSProperties = {
  display: 'block',
  marginBottom: '7px',
  fontSize: '9px',
  fontWeight: 'bold',
  color: '#ffffff',
};

const estiloInput: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px',
  backgroundColor: '#0b1731',
  border: '1px solid #30466e',
  borderRadius: '5px',
  color: '#ffffff',
  fontSize: '10px',
  outline: 'none',
};

const estiloCelda: React.CSSProperties = {
  padding: '12px 14px',
  verticalAlign: 'middle',
};

const estiloBotonGuardar: React.CSSProperties = {
  padding: '5px 8px',
  backgroundColor: '#2563eb',
  border: 'none',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '9px',
  cursor: 'pointer',
};

const estiloBotonCancelar: React.CSSProperties = {
  padding: '5px 8px',
  backgroundColor: '#293957',
  border: '1px solid #405477',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '9px',
  cursor: 'pointer',
};

const estiloPaginacion: React.CSSProperties = {
  minWidth: '26px',
  height: '26px',
  borderRadius: '4px',
  border: '1px solid #2a3c60',
  backgroundColor: 'transparent',
  color: '#a8c0e8',
  cursor: 'pointer',
  fontSize: '11px',
};
