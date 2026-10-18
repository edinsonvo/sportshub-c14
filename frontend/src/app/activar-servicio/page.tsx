'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ActivarServicioPage() {
  const [nombreServicio, setNombreServicio] = useState<string>('Servicio General');
  const [descripcionServicio, setDescripcionServicio] = useState<string>('Sin descripción disponible.');
  const [precio, setPrecio] = useState<number>(45000);
  const [duracion, setDuracion] = useState<string>('60');
  const [horario, setHorario] = useState<string>('');
  const [listaHorarios, setListaHorarios] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [estado, setEstado] = useState<string>('Incompleto');

  useEffect(() => {
    const nombreGuardado = localStorage.getItem('servicio_a_activar_nombre');
    const descripcionGuardada = localStorage.getItem('servicio_a_activar_descripcion');
    
    if (nombreGuardado) setNombreServicio(nombreGuardado);
    if (descripcionGuardada) setDescripcionServicio(descripcionGuardada);

    const horariosGuardados = JSON.parse(localStorage.getItem('horarios_servicios') || '[]');
    setListaHorarios(horariosGuardados);
  }, []);

  function handleActivar(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (precio <= 0) {
      setError('Debe ingresar un precio, una duración y asignar un horario válido para activar el servicio.');
      return;
    }

    if (duracion === '') {
      setError('Debe ingresar un precio, una duración y asignar un horario válido para activar el servicio.');
      return;
    }

    if (horario === '') {
      setError('Debe ingresar un precio, una duración y asignar un horario válido para activar el servicio.');
      return;
    }

    setEstado('Activo');
    setSuccess(true);
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
            
            <p style={{ fontSize: '12px', color: '#2563eb', marginBottom: '4px' }}>Catálogo de Servicios &gt; Activar Servicio</p>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 32px 0', color: '#ffffff' }}>Activar servicio</h3>

            <form onSubmit={handleActivar} style={{ padding: '24px', borderRadius: '12px', border: '1px solid #1e293b', backgroundColor: '#0c1324', marginBottom: '52px', boxSizing: 'border-box' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '24px' }}>
                <div>
                  <h6 style={{ fontWeight: 'bold', fontSize: '14px', color: '#ffffff', margin: '0 0 2px 0' }}>Información General</h6>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Establece los datos de registro básicos de tu servicio en el sistema.</p>
                </div>
                <span style={{ fontSize: '12px', padding: '4px 10px', backgroundColor: '#1e293b', borderRadius: '4px', fontWeight: 'bold' }}>
                  {estado}
                </span>
              </div>

              <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#080d1a', border: '1px solid #1e293b', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>Nombre del Servicio</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#ffffff', fontWeight: '500' }}>{nombreServicio}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>Descripción</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#cbd5e1' }}>{descripcionServicio}</p>
                </div>
              </div>

              {error && (
                <div style={{ textAlign: 'center', fontSize: '14px', padding: '12px', marginBottom: '16px', borderRadius: '8px', border: '1px solid #ef4444', backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#f87171', fontWeight: '500' }}>
                  {error}
                </div>
              )}

              {success && (
                <div style={{ textAlign: 'center', fontSize: '14px', padding: '12px', marginBottom: '16px', borderRadius: '8px', border: '1px solid #10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', fontWeight: '500' }}>
                  ¡Servicio activado correctamente! Ahora es visible en el catálogo de cara al cliente.
                </div>
              )}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#ffffff' }}>Precio del Servicio (COP) *</label>
                <input
                  type="number"
                  value={precio}
                  onChange={(e) => setPrecio(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', borderRadius: '8px', border: '1px solid #334155', color: '#ffffff', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#ffffff' }}>Duración Estimada (Minutos) *</label>
                <input
                  type="text"
                  value={duracion}
                  onChange={(e) => setDuracion(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', borderRadius: '8px', border: '1px solid #334155', color: '#ffffff', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                  placeholder="Ej: 60"
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }}>Asignar Horario Disponible *</label>
                  <Link href="/definir-horario" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>
                    + Configurar nueva franja
                  </Link>
                </div>
                <select
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', borderRadius: '8px', border: '1px solid #334155', color: '#ffffff', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                >
                  <option value="" style={{ backgroundColor: '#0c1324' }}>-- Seleccionar horario configurado --</option>
                  {listaHorarios.map((item, index) => (
                    <option key={index} value={item} style={{ backgroundColor: '#0c1324' }}>
                      {item}
                    </option>
                  ))}
                </select>
                <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>Los horarios listados provienen de tu agenda de servicios previamente configurada.</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
                <Link href="/registrar-servicio" style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#94a3b8', fontSize: '12px', fontWeight: 'bold', borderRadius: '8px', border: '1px solid #334155', cursor: 'pointer', textDecoration: 'none', textAlign: 'center' }}>
                  Volver al catálogo
                </Link>
                <button type="submit" style={{ padding: '8px 20px', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '12px', fontWeight: 'bold', borderRadius: '8px', border: '0', cursor: 'pointer' }}>
                  Activar Servicio
                </button>
              </div>

            </form>
          </div>
        </main>
      </div>

    </div>
  );
}
