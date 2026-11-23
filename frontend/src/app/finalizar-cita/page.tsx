'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface CitaCierre {
  id: string;
  codigo: string;
  cliente: string;
  iniciales: string;
  servicio: string;
  fechaHoraTexto: string;
  duracion: string;
  yaConcluyo: boolean;
  estado: 'Concluida' | 'Programada' | 'Finalizada';
  fechaHoraFinalizacion: string | null;
}

const CITAS_ESCENARIOS_MOCK: Record<'concluida' | 'futura', CitaCierre> = {
  concluida: {
    id: '101',
    codigo: 'ID: #SH-2026',
    cliente: 'Carlos Mendoza',
    iniciales: 'CM',
    servicio: 'Clase de Tenis',
    fechaHoraTexto: 'Hoy · Hace 1 hora',
    duracion: '60 minutos',
    yaConcluyo: true,
    estado: 'Concluida',
    fechaHoraFinalizacion: null,
  },
  futura: {
    id: '102',
    codigo: 'ID: #SH-2027',
    cliente: 'Valeria Gómez',
    iniciales: 'VG',
    servicio: 'Cancha de Fútbol 5',
    fechaHoraTexto: 'Mañana · 05:00 PM',
    duracion: '60 minutos',
    yaConcluyo: false,
    estado: 'Programada',
    fechaHoraFinalizacion: null,
  },
};

export default function RegistrarFinalizacionCitaPage() {
  const [escenarioActivo, setEscenarioActivo] = useState<'concluida' | 'futura'>('concluida');
  const [citaActual, setCitaActual] = useState<CitaCierre>(CITAS_ESCENARIOS_MOCK.concluida);
  const [errorValidacion, setErrorValidacion] = useState<string>('');
  const [mensajeExito, setMensajeExito] = useState<string>('');

  function cambiarEscenario(tipo: 'concluida' | 'futura') {
    setEscenarioActivo(tipo);
    setCitaActual({ ...CITAS_ESCENARIOS_MOCK[tipo] });
    setErrorValidacion('');
    setMensajeExito('');
  }

  function handleFinalizarCita() {
    setErrorValidacion('');
    setMensajeExito('');

    if (!citaActual.yaConcluyo) {
      setErrorValidacion('Se debe esperar a que la cita concluya para poder finalizarla');
      return;
    }

    const ahora = new Date();
    const marcaTiempo = ahora.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    setCitaActual({
      ...citaActual,
      estado: 'Finalizada',
      fechaHoraFinalizacion: marcaTiempo,
    });
    setMensajeExito(`Cita actualizada a "Finalizada" el ${marcaTiempo}.`);
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
            <button type="button" style={{ textAlign: 'left', padding: '8px 12px', backgroundColor: 'rgba(37, 99, 235, 0.15)', color: '#3b82f6', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: '0', cursor: 'pointer' }}>
              ✅ Cierre de Citas
            </button>
            <Link href="/citas-clientes" style={{ textDecoration: 'none', textAlign: 'left', padding: '8px 12px', backgroundColor: 'transparent', color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>
              📋 Citas de clientes
            </Link>
            <Link href="/reportes" style={{ textDecoration: 'none', textAlign: 'left', padding: '8px 12px', backgroundColor: 'transparent', color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>
              📈 Reportes
            </Link>
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
          <div style={{ maxWidth: '820px', margin: '0 auto', width: '100%' }}>
            <p style={{ fontSize: '12px', color: '#2563eb', marginBottom: '4px' }}>Catálogo de Servicios &gt; Gestión de citas</p>
            <h3 style={{ fontSize: '26px', fontWeight: 'bold', margin: '0 0 6px 0', color: '#ffffff' }}>Gestión y Cierre de Citas</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 24px 0' }}>Valida y completa las citas programadas en tu centro deportivo.</p>

            <div style={{ display: 'inline-flex', gap: '8px', padding: '4px', backgroundColor: '#0c1324', border: '1px solid #1e293b', borderRadius: '8px', marginBottom: '28px' }}>
              <button
                type="button"
                onClick={() => cambiarEscenario('concluida')}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '0', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: escenarioActivo === 'concluida' ? '#2563eb' : 'transparent', color: escenarioActivo === 'concluida' ? '#ffffff' : '#94a3b8' }}
              >
                ● Cita Concluida
              </button>
              <button
                type="button"
                onClick={() => cambiarEscenario('futura')}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '0', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: escenarioActivo === 'futura' ? '#2563eb' : 'transparent', color: escenarioActivo === 'futura' ? '#ffffff' : '#94a3b8' }}
              >
                ● Cita Futura (Error)
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h6 style={{ fontSize: '15px', fontWeight: 'bold', color: '#ffffff', margin: '0 0 2px 0' }}>Detalle de Cita</h6>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Información y estado actual de la reserva</p>
              </div>
              <span style={{ fontSize: '11px', padding: '4px 10px', backgroundColor: '#0c1324', border: '1px solid #1e293b', borderRadius: '6px', color: '#94a3b8', fontWeight: 'bold' }}>
                {citaActual.codigo}
              </span>
            </div>

            <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid #1e293b', backgroundColor: '#0c1324', boxSizing: 'border-box' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid #1e293b', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#1e293b', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' }}>
                    {citaActual.iniciales}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cliente</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '15px', fontWeight: 'bold', color: '#ffffff' }}>{citaActual.cliente}</p>
                  </div>
                </div>

                <span
                  style={{
                    padding: '5px 12px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: citaActual.estado === 'Finalizada' || citaActual.estado === 'Concluida' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: citaActual.estado === 'Finalizada' || citaActual.estado === 'Concluida' ? '#34d399' : '#fbbf24',
                    border: citaActual.estado === 'Finalizada' || citaActual.estado === 'Concluida' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                  }}
                >
                  ● {citaActual.estado}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid #1e293b', marginBottom: '20px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Servicio</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#ffffff' }}>🎾 {citaActual.servicio}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Fecha y Hora</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#ffffff' }}>🕒 {citaActual.fechaHoraTexto}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Duración</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#ffffff' }}>⏱️ {citaActual.duracion}</p>
                </div>
              </div>

              {citaActual.fechaHoraFinalizacion && (
                <div style={{ padding: '12px 16px', marginBottom: '16px', borderRadius: '8px', border: '1px solid #1e293b', backgroundColor: '#080d1a', fontSize: '13px', color: '#cbd5e1' }}>
                  <strong>Registro de cierre:</strong> Marcada como <em>Finalizada</em> el <span style={{ color: '#34d399', fontWeight: 'bold' }}>{citaActual.fechaHoraFinalizacion}</span>
                </div>
              )}

              {errorValidacion && (
                <div style={{ fontSize: '13px', padding: '12px 16px', marginBottom: '16px', borderRadius: '8px', border: '1px solid #ef4444', backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#f87171', fontWeight: '500' }}>
                  ⚠️ {errorValidacion}
                </div>
              )}

              {mensajeExito && (
                <div style={{ fontSize: '13px', padding: '12px 16px', marginBottom: '16px', borderRadius: '8px', border: '1px solid #10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', fontWeight: '500' }}>
                  ✓ {mensajeExito}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <Link
                  href="/citas-clientes"
                  style={{ padding: '10px 18px', backgroundColor: 'transparent', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', fontSize: '13px', fontWeight: 'bold', textDecoration: 'none' }}
                >
                  Cancelar
                </Link>
                <button
                  type="button"
                  onClick={handleFinalizarCita}
                  disabled={citaActual.estado === 'Finalizada'}
                  style={{
                    padding: '10px 22px',
                    backgroundColor: citaActual.estado === 'Finalizada' ? '#1e293b' : '#2563eb',
                    color: citaActual.estado === 'Finalizada' ? '#94a3b8' : '#ffffff',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                    border: '0',
                    cursor: citaActual.estado === 'Finalizada' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {citaActual.estado === 'Finalizada' ? 'Cita Finalizada ✓' : 'Finalizar Cita'}
                </button>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
