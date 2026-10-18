'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AgendarCitaPage() {
  const [servicioSeleccionado, setServicioSeleccionado] = useState<string>('ENTRENAMIENTO FUNCIONAL');
  const [personalSeleccionado, setPersonalSeleccionado] = useState<string>('Sofía Narváez');
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>('22');
  const [horaSeleccionada, setHoraSeleccionada] = useState<string>('08:00 AM');
  
  const [mensajeExito, setMensajeExito] = useState<string>('');
  const [mensajeError, setMensajeError] = useState<string>('');
  const [provocarError, setProvocarError] = useState<boolean>(false);
  const [servicioCreado, setServicioCreado] = useState<string>('');

  useEffect(() => {
    const nombreGuardado = localStorage.getItem('servicio_a_activar_nombre');
    if (nombreGuardado) {
      setServicioCreado(nombreGuardado.toUpperCase());
    }
  }, []);

  function handleConfirmarCita() {
    setMensajeExito('');
    setMensajeError('');

    if (provocarError) {
      setMensajeError('El horario seleccionado ya no se encuentra disponible. Por favor, elija otra opción.');
      return;
    }

    setMensajeExito(`¡Cita agendada con éxito! Servicio: ${servicioSeleccionado}, Personal: ${personalSeleccionado}, Fecha: Día ${diaSeleccionado} a las ${horaSeleccionada}.`);
  }
  return (
    <div style={{ display: 'flex', backgroundColor: '#080d1a', minHeight: '100vh', width: '100vw', margin: 0, padding: 0, color: '#ffffff', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      
      <aside style={{ width: '260px', backgroundColor: '#0c1324', borderRight: '1px solid #1e293b', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexShrink: 0, boxSizing: 'border-box' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <img src="/logo.png" alt="SportsHub" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
            <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '0.5px' }}>SportsHub</span>
          </div>
          
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button type="button" style={{ textAlign: 'left', padding: '8px 12px', backgroundColor: 'transparent', color: '#94a3b8', fontSize: '14px', fontWeight: '500', border: '0', cursor: 'pointer' }}>
              🏠 Inicio / Principal
            </button>
            <button type="button" style={{ textAlign: 'left', padding: '8px 12px', backgroundColor: 'transparent', color: '#94a3b8', fontSize: '14px', fontWeight: '500', border: '0', cursor: 'pointer' }}>
              📅 Catálogo de Servicios
            </button>
            <button type="button" style={{ textAlign: 'left', padding: '8px 12px', backgroundColor: 'rgba(37, 99, 235, 0.15)', color: '#3b82f6', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: '0', cursor: 'pointer' }}>
              🎟️ Mis Citas
            </button>
            <button type="button" style={{ textAlign: 'left', padding: '8px 12px', backgroundColor: 'transparent', color: '#94a3b8', fontSize: '14px', fontWeight: '500', border: '0', cursor: 'pointer' }}>
              👤 Mi Perfil
            </button>
          </nav>
        </div>

        <div style={{ paddingTop: '16px', borderTop: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#ffffff', fontSize: '12px' }}>CC</div>
          <div>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>Juan Pérez</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Cliente</p>
          </div>
        </div>
      </aside>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        <header style={{ height: '56px', backgroundColor: '#0c1324', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', boxSizing: 'border-box' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            ORGANIZACIÓN: <span style={{ color: '#ffffff', fontWeight: 'bold' }}>Centro Deportivo Norte</span>
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>
            S1 - CLIENTE
          </div>
        </header>

        <main style={{ flexGrow: 1, padding: '32px', backgroundColor: '#080d1a', display: 'flex', gap: '24px', overflowY: 'auto', boxSizing: 'border-box' }}>
          
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <p style={{ fontSize: '11px', color: '#3b82f6', marginBottom: '4px', fontWeight: 'bold' }}>PORTAL DE CLIENTE</p>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>AGENDA TU PRÓXIMA CITA</h3>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0 0' }}>Elige el servicio, encargado y horario en unos pocos pasos.</p>
            </div>

            {mensajeExito && (
              <div style={{ padding: '12px', border: '1px solid #10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', borderRadius: '8px', fontSize: '14px' }}>{mensajeExito}</div>
            )}
            {mensajeError && (
              <div style={{ padding: '12px', border: '1px solid #ef4444', backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#f87171', borderRadius: '8px', fontSize: '14px' }}>{mensajeError}</div>
            )}

            <div>
              <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '12px' }}>1. Selecciona el servicio</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {['ENTRENAMIENTO FUNCIONAL', 'CANCHA DE FÚTBOL', 'CLASE DE NATACIÓN', servicioCreado].filter(Boolean).map((serv) => (
                  <button key={serv} type="button" onClick={() => setServicioSeleccionado(serv)} style={{ padding: '16px', backgroundColor: servicioSeleccionado === serv ? 'rgba(37, 99, 235, 0.15)' : '#0c1324', border: servicioSeleccionado === serv ? '1px solid #2563eb' : '1px solid #1e293b', borderRadius: '8px', color: '#ffffff', textAlign: 'left', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>{serv}</button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '12px' }}>2. Personal disponible</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {['Sofía Narváez', 'Diego Mendoza', 'Valentina Cruz'].map((pers) => (
                  <button key={pers} type="button" onClick={() => setPersonalSeleccionado(pers)} style={{ padding: '12px', backgroundColor: personalSeleccionado === pers ? 'rgba(37, 99, 235, 0.15)' : '#0c1324', border: personalSeleccionado === pers ? '1px solid #2563eb' : '1px solid #1e293b', borderRadius: '8px', color: '#ffffff', cursor: 'pointer', fontSize: '13px' }}>{pers}</button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '12px' }}>3. Fecha y hora</p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {['21', '22', '23', '24', '25'].map((d) => (
                  <button key={d} type="button" onClick={() => setDiaSeleccionado(d)} style={{ width: '45px', height: '45px', backgroundColor: diaSeleccionado === d ? '#2563eb' : '#0c1324', border: '1px solid #1e293b', borderRadius: '8px', color: '#ffffff', cursor: 'pointer', fontWeight: 'bold' }}>{d}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['08:00 AM', '10:30 AM', '02:00 PM', '04:30 PM'].map((h) => (
                  <button key={h} type="button" onClick={() => setHoraSeleccionada(h)} style={{ padding: '8px 16px', backgroundColor: horaSeleccionada === h ? 'rgba(37, 99, 235, 0.15)' : '#0c1324', border: horaSeleccionada === h ? '1px solid #2563eb' : '1px solid #1e293b', borderRadius: '8px', color: '#ffffff', cursor: 'pointer', fontSize: '12px' }}>{h}</button>
                ))}
              </div>
            </div>
          </div>

          <aside style={{ width: '280px', backgroundColor: '#0c1324', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box', height: 'fit-content' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>CONFIRMACIÓN</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div><span style={{ color: '#64748b', display: 'block', fontSize: '10px', fontWeight: 'bold' }}>SERVICIO</span><span style={{ color: '#ffffff', fontWeight: '500' }}>{servicioSeleccionado}</span></div>
              <div><span style={{ color: '#64748b', display: 'block', fontSize: '10px', fontWeight: 'bold' }}>ENCARGADO</span><span style={{ color: '#ffffff', fontWeight: '500' }}>{personalSeleccionado}</span></div>
              <div><span style={{ color: '#64748b', display: 'block', fontSize: '10px', fontWeight: 'bold' }}>FECHA Y HORA</span><span style={{ color: '#ffffff', fontWeight: '500' }}>Día {diaSeleccionado} • {horaSeleccionada}</span></div>
            </div>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#94a3b8', cursor: 'pointer', borderTop: '1px solid #1e293b', paddingTop: '12px' }}>
              <input type="checkbox" checked={provocarError} onChange={(e) => setProvocarError(e.target.checked)} />
              Simular ocupación (Escenario 2)
            </label>

            <button type="button" onClick={handleConfirmarCita} style={{ padding: '12px', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '13px', fontWeight: 'bold', width: '100%', borderRadius: '8px', border: '0', cursor: 'pointer' }}>Confirmar mi Cita</button>
            <Link href="/consultar-disponibilidad" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none', textAlign: 'center' }}>&larr; Volver al catálogo</Link>
          </aside>

        </main>
      </div>
    </div>
  );
}

