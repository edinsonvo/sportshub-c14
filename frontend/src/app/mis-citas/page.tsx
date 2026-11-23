'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { loadSession } from '@/lib/auth';

interface Appointment {
  id: string;
  providerServiceId: string;
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  cancellationReason: string | null;

  staffName?: string;
  confirmationCode?: string;
  notes?: string;
}

interface ServiceResponse {
  id: string;
  name: string;
}

export default function MisCitasPage() {
  const router = useRouter();

  const [citas, setCitas] = useState<Appointment[]>([]);
  const [servicios, setServicios] = useState<Record<string, string>>({});
  const [citaSeleccionada, setCitaSeleccionada] =
    useState<Appointment | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function cargarCitas() {
      const session = loadSession();

      if (!session?.accessToken) {
        router.replace('/login');
        return;
      }

      try {
        const data = await api<Appointment[]>('/appointments', {
          token: session.accessToken,
        });

        setCitas(data);

        const idsServicios = Array.from(
          new Set(data.map((cita) => cita.providerServiceId)),
        );

        const respuestas = await Promise.all(
          idsServicios.map(async (id) => {
            try {
              const servicio = await api<ServiceResponse>(
                `/services/${id}`,
                {
                  token: session.accessToken,
                },
              );

              return [id, servicio.name] as const;
            } catch {
              return [id, 'Servicio'] as const;
            }
          }),
        );

        setServicios(Object.fromEntries(respuestas));
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : 'No fue posible consultar tus citas.',
        );
      } finally {
        setLoading(false);
      }
    }

    cargarCitas();
  }, [router]);

  function formatearFecha(fecha: string) {
    const date = new Date(`${fecha}T00:00:00`);

    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  function formatearHora(hora: string) {
    const [hours, minutes] = hora.split(':');

    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);

    return new Intl.DateTimeFormat('es-CO', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  }

  function nombreEstado(estado: string) {
    const estados: Record<string, string> = {
      SOLICITADA: 'Solicitada',
      CONFIRMADA: 'Confirmada',
      CANCELADA: 'Cancelada',
      CANCELADA_POR_IMPREVISTO: 'Cancelada',
      COMPLETADA: 'Finalizada',
    };

    return estados[estado] ?? estado;
  }

  function colorEstado(estado: string) {
    if (estado === 'CONFIRMADA') return '#34d399';
    if (estado === 'COMPLETADA') return '#60a5fa';
    if (
      estado === 'CANCELADA' ||
      estado === 'CANCELADA_POR_IMPREVISTO'
    )
      return '#f87171';

    return '#fbbf24';
  }

  return (
    <div
      style={{
        display: 'flex',
        backgroundColor: '#080d1a',
        minHeight: '100vh',
        width: '100vw',
        color: '#ffffff',
        fontFamily: 'sans-serif',
      }}
    >
      <aside
        style={{
          width: '260px',
          backgroundColor: '#0c1324',
          borderRight: '1px solid #1e293b',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '32px',
            }}
          >
            <img
              src="/logo.png"
              alt="SportsHub"
              style={{
                width: '56px',
                height: '56px',
                objectFit: 'contain',
              }}
            />

            <span
              style={{
                fontSize: '22px',
                fontWeight: 'bold',
              }}
            >
              SportsHub
            </span>
          </div>

          <nav
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <Link href="/dashboard" style={estiloMenu}>
              🏠 Inicio / Principal
            </Link>

            <Link href="/servicios" style={estiloMenu}>
              📅 Catálogo de Servicios
            </Link>

            <Link
              href="/mis-citas"
              style={{
                ...estiloMenu,
                backgroundColor: 'rgba(37, 99, 235, 0.15)',
                color: '#3b82f6',
                fontWeight: 'bold',
              }}
            >
              🎟️ Mis Citas
            </Link>

            <Link href="/perfil" style={estiloMenu}>
              👤 Mi Perfil
            </Link>
          </nav>
        </div>

        <div
          style={{
            paddingTop: '16px',
            borderTop: '1px solid #1e293b',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            Cliente
          </p>

          <p
            style={{
              margin: '3px 0 0',
              fontSize: '12px',
              color: '#94a3b8',
            }}
          >
            Portal de cliente
          </p>
        </div>
      </aside>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <header
          style={{
            height: '56px',
            backgroundColor: '#0c1324',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: '#94a3b8',
            }}
          >
            ORGANIZACIÓN:{' '}
            <span
              style={{
                color: '#ffffff',
                fontWeight: 'bold',
              }}
            >
              Centro Deportivo Norte
            </span>
          </div>

          <div
            style={{
              fontSize: '12px',
              color: '#94a3b8',
            }}
          >
            S1 - CLIENTE
          </div>
        </header>

        <main
          style={{
            flex: 1,
            padding: '32px',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              maxWidth: '1000px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '28px',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: '11px',
                    color: '#3b82f6',
                    margin: '0 0 4px',
                    fontWeight: 'bold',
                  }}
                >
                  PORTAL DE CLIENTE
                </p>

                <h1
                  style={{
                    fontSize: '24px',
                    margin: 0,
                  }}
                >
                  MIS CITAS
                </h1>

                <p
                  style={{
                    color: '#94a3b8',
                    fontSize: '13px',
                    marginTop: '6px',
                  }}
                >
                  Consulta tus citas agendadas y revisa sus detalles.
                </p>
              </div>

              <Link
                href="/agendar-cita"
                style={{
                  padding: '11px 18px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 'bold',
                }}
              >
                + Agendar nueva cita
              </Link>
            </div>

            {loading && (
              <div style={estiloTarjeta}>
                Consultando tus citas...
              </div>
            )}

            {!loading && error && (
              <div
                style={{
                  ...estiloTarjeta,
                  borderColor: '#ef4444',
                  color: '#f87171',
                }}
              >
                {error}
              </div>
            )}

            {!loading && !error && citas.length === 0 && (
              <div
                style={{
                  ...estiloTarjeta,
                  textAlign: 'center',
                  padding: '50px',
                }}
              >
                <h2
                  style={{
                    fontSize: '20px',
                    marginBottom: '10px',
                  }}
                >
                  Aún no tienes citas agendadas
                </h2>

                <p
                  style={{
                    color: '#94a3b8',
                    fontSize: '13px',
                    marginBottom: '22px',
                  }}
                >
                  Agenda una nueva cita para verla posteriormente en esta
                  sección.
                </p>

                <Link
                  href="/agendar-cita"
                  style={{
                    padding: '11px 18px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: 'bold',
                  }}
                >
                  Agendar una nueva cita
                </Link>
              </div>
            )}

            {!loading && !error && citas.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {citas.map((cita) => (
                  <button
                    key={cita.id}
                    type="button"
                    onClick={() => setCitaSeleccionada(cita)}
                    style={{
                      ...estiloTarjeta,
                      display: 'grid',
                      gridTemplateColumns: '2fr 1.5fr 1.3fr 1fr',
                      gap: '18px',
                      alignItems: 'center',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: '#ffffff',
                    }}
                  >
                    <div>
                      <p style={tituloDato}>SERVICIO</p>

                      <strong>
                        {servicios[cita.providerServiceId] ??
                          'Servicio'}
                      </strong>

                      <p
                        style={{
                          margin: '6px 0 0',
                          color: '#94a3b8',
                          fontSize: '11px',
                        }}
                      >
                        Profesional:{' '}
                        {cita.staffName ?? 'No disponible'}
                      </p>
                    </div>

                    <div>
                      <p style={tituloDato}>FECHA</p>
                      <span>{formatearFecha(cita.date)}</span>
                    </div>

                    <div>
                      <p style={tituloDato}>HORARIO</p>

                      <span>
                        {formatearHora(cita.startTime)} -{' '}
                        {formatearHora(cita.endTime)}
                      </span>
                    </div>

                    <div>
                      <p style={tituloDato}>ESTADO</p>

                      <span
                        style={{
                          color: colorEstado(cita.status),
                          fontWeight: 'bold',
                        }}
                      >
                        {nombreEstado(cita.status)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {citaSeleccionada && (
        <div
          onClick={() => setCitaSeleccionada(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '550px',
              backgroundColor: '#0c1324',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: '22px',
              }}
            >
              Detalle de la cita
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
              }}
            >
              <Detalle
                titulo="Servicio"
                valor={
                  servicios[
                    citaSeleccionada.providerServiceId
                  ] ?? 'Servicio'
                }
              />

              <Detalle
                titulo="Profesional asignado"
                valor={
                  citaSeleccionada.staffName ??
                  'No disponible'
                }
              />

              <Detalle
                titulo="Fecha"
                valor={formatearFecha(
                  citaSeleccionada.date,
                )}
              />

              <Detalle
                titulo="Horario"
                valor={`${formatearHora(
                  citaSeleccionada.startTime,
                )} - ${formatearHora(
                  citaSeleccionada.endTime,
                )}`}
              />

              <Detalle
                titulo="Estado actual"
                valor={nombreEstado(
                  citaSeleccionada.status,
                )}
              />

              <Detalle
                titulo="Código de confirmación"
                valor={
                  citaSeleccionada.confirmationCode ??
                  'No disponible'
                }
              />
            </div>

            <div
              style={{
                marginTop: '14px',
                padding: '14px',
                backgroundColor: '#080d1a',
                border: '1px solid #1e293b',
                borderRadius: '8px',
              }}
            >
              <p style={tituloDato}>NOTAS ADICIONALES</p>

              <p
                style={{
                  margin: 0,
                  fontSize: '13px',
                  color: '#cbd5e1',
                }}
              >
                {citaSeleccionada.notes ??
                  'No hay notas adicionales registradas.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCitaSeleccionada(null)}
              style={{
                marginTop: '22px',
                width: '100%',
                padding: '11px',
                backgroundColor: '#2563eb',
                border: 0,
                borderRadius: '8px',
                color: '#ffffff',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Detalle({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div
      style={{
        padding: '14px',
        backgroundColor: '#080d1a',
        border: '1px solid #1e293b',
        borderRadius: '8px',
      }}
    >
      <p style={tituloDato}>{titulo.toUpperCase()}</p>

      <p
        style={{
          margin: 0,
          fontSize: '13px',
        }}
      >
        {valor}
      </p>
    </div>
  );
}

const estiloMenu: React.CSSProperties = {
  padding: '8px 12px',
  backgroundColor: 'transparent',
  color: '#94a3b8',
  fontSize: '14px',
  fontWeight: '500',
  textDecoration: 'none',
  borderRadius: '8px',
};

const estiloTarjeta: React.CSSProperties = {
  padding: '18px',
  backgroundColor: '#0c1324',
  border: '1px solid #1e293b',
  borderRadius: '10px',
};

const tituloDato: React.CSSProperties = {
  margin: '0 0 6px',
  fontSize: '10px',
  color: '#64748b',
  fontWeight: 'bold',
};