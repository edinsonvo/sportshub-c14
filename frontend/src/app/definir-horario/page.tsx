'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function DefinirHorarioPage() {
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);
  const [horaInicio, setHoraInicio] = useState<string>('');
  const [horaFin, setHoraFin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  const listaDias = [
    { id: 'Lu', nombre: 'Lunes' },
    { id: 'Ma', nombre: 'Martes' },
    { id: 'Mi', nombre: 'Miércoles' },
    { id: 'Ju', nombre: 'Jueves' },
    { id: 'Vi', nombre: 'Viernes' },
    { id: 'Sa', nombre: 'Sábado' },
    { id: 'Do', nombre: 'Domingo' }
  ];

  function handleCheckboxChange(id: string) {
    if (diasSeleccionados.includes(id)) {
      setDiasSeleccionados(diasSeleccionados.filter(item => item !== id));
    } else {
      setDiasSeleccionados([...diasSeleccionados, id]);
    }
  }

  function handleGuardarHorario(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (diasSeleccionados.length === 0 || horaInicio === '' || horaFin === '') {
      setError('Todos los campos son obligatorios para guardar el horario.');
      return;
    }

    if (horaFin <= horaInicio) {
      setError('La hora de finalización debe ser posterior a la hora de inicio.');
      return;
    }

    const textoDias = diasSeleccionados.join(', ');
    const nuevoHorario = `${textoDias} (${horaInicio} - ${horaFin})`;
    
    const horariosActuales = JSON.parse(localStorage.getItem('horarios_servicios') || '[]');
    horariosActuales.push(nuevoHorario);
    localStorage.setItem('horarios_servicios', JSON.stringify(horariosActuales));

    setSuccess(true);
    setDiasSeleccionados([]);
    setHoraInicio('');
    setHoraFin('');
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
              📊 Resumen / Dashboard
            </button>
            <button type="button" style={{ textAlign: 'left', padding: '8px 12px', backgroundColor: 'rgba(37, 99, 235, 0.15)', color: '#3b82f6', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: '0', cursor: 'pointer' }}>
              ▶️ Catálogo de Servicios
            </button>
            <button type="button" style={{ textAlign: 'left', padding: '8px 12px', backgroundColor: 'transparent', color: '#94a3b8', fontSize: '14px', fontWeight: '500', border: '0', cursor: 'pointer' }}>
              👥 Personal Operativo
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
          <div style={{ maxWidth: '650px', margin: '0 auto', width: '100%' }}>
            
            <p style={{ fontSize: '12px', color: '#2563eb', marginBottom: '4px' }}>Catálogo de Servicios &gt; Configuración de Agenda</p>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 32px 0', color: '#ffffff' }}>Definir horario del servicio</h3>

            <form onSubmit={handleGuardarHorario} style={{ padding: '24px', borderRadius: '12px', border: '1px solid #1e293b', backgroundColor: '#0c1324', marginBottom: '52px', boxSizing: 'border-box' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '24px' }}>
                <div>
                  <h6 style={{ fontWeight: 'bold', fontSize: '14px', color: '#ffffff', margin: '0 0 2px 0' }}>Configuración de la Agenda</h6>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Determina los días y el rango de horas válidas para la reserva.</p>
                </div>
              </div>

              {error && (
                <div style={{ textAlign: 'center', fontSize: '14px', padding: '12px', marginBottom: '16px', borderRadius: '8px', border: '1px solid #ef4444', backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#f87171', fontWeight: '500' }}>
                  {error}
                </div>
              )}

              {success && (
                <div style={{ textAlign: 'center', fontSize: '14px', padding: '12px', marginBottom: '16px', borderRadius: '8px', border: '1px solid #10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', fontWeight: '500' }}>
                  La disponibilidad se almacenó exitosamente y habilitará las franjas horarias correspondientes.
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '12px', color: '#ffffff' }}>Seleccione los días de servicio *</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {listaDias.map((dia) => {
                    const seleccionado = diasSeleccionados.includes(dia.id);
                    return (
                      <label
                        key={dia.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          backgroundColor: seleccionado ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                          border: seleccionado ? '1px solid #2563eb' : '1px solid #334155',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          userSelect: 'none',
                          color: seleccionado ? '#3b82f6' : '#ffffff'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={seleccionado}
                          onChange={() => handleCheckboxChange(dia.id)}
                          style={{ cursor: 'pointer' }}
                        />
                        {dia.nombre}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#ffffff' }}>Hora de inicio *</label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', borderRadius: '8px', border: error.includes('posterior') || (error && !horaInicio) ? '1px solid #ef4444' : '1px solid #334155', color: '#ffffff', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#ffffff' }}>Hora de fin *</label>
                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', borderRadius: '8px', border: error.includes('posterior') || (error && !horaFin) ? '1px solid #ef4444' : '1px solid #334155', color: '#ffffff', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
                <Link href="/activar-servicio" style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#94a3b8', fontSize: '12px', fontWeight: 'bold', borderRadius: '8px', border: '1px solid #334155', cursor: 'pointer', textDecoration: 'none', textAlign: 'center' }}>
                  Volver al servicio
                </Link>
                <button type="submit" style={{ padding: '8px 20px', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '12px', fontWeight: 'bold', borderRadius: '8px', border: '0', cursor: 'pointer' }}>
                  Guardar Horario
                </button>
              </div>

            </form>
          </div>
        </main>
      </div>

    </div>
  );
}

