'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ServicioRegistrado {
  id: number;
  nombre: string;
  descripcion: string;
  estado: string;
}

export default function RegistrarServicioPage() {
  const [nombre, setNombre] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [mensaje, setMensaje] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [serviciosRegistrados, setServiciosRegistrados] = useState<ServicioRegistrado[]>([]);

  function manejarEnvio(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMensaje('');
    setError('');

    if (nombre.trim() === '') {
      setError('El nombre del servicio es obligatorio.');
      return;
    }

    localStorage.setItem('servicio_a_activar_nombre', nombre);
    localStorage.setItem('servicio_a_activar_descripcion', descripcion || 'Sin descripción');

    const nuevoServicio: ServicioRegistrado = {
      id: Date.now(),
      nombre: nombre,
      descripcion: descripcion || 'Sin descripción',
      estado: 'Incompleto'
    };

    setServiciosRegistrados([...serviciosRegistrados, nuevoServicio]);
    setMensaje('¡Servicio registrado con éxito! Estado: Incompleto.');
    setNombre('');
    setDescripcion('');
  }
  return (
    <div style={{ display: 'flex', backgroundColor: '#080d1a', minHeight: '100vh', width: '100vw', margin: 0, padding: 0, color: '#ffffff', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      
      <aside style={{ width: '260px', backgroundColor: '#0c1324', borderRight: '1px solid #1e293b', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexShrink: 0, boxSizing: 'border-box' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <img 
              src="/logo.png" 
              alt="SportsHub" 
              style={{ width: '56px', height: '56px', objectFit: 'contain' }} 
            />
            <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '0.5px' }}>
              SportsHub
            </span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button type="button" style={{ textAlign: 'left', padding: '8px 12px', backgroundColor: 'transparent', color: '#94a3b8', fontSize: '14px', fontWeight: '500', border: '0', cursor: 'pointer' }}>
              📊 Resumen / Dashboard
            </button>
            <button type="button" style={{ textAlign: 'left', padding: '8px 12px', backgroundColor: 'rgba(37, 99, 235, 0.15)', color: '#3b82f6', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: '0', cursor: 'pointer' }}>
              📂 Catálogo de Servicios
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
            S2 - PROVEEDOR
          </div>
        </header>

        <main style={{ flexGrow: 1, padding: '40px', backgroundColor: '#080d1a', overflowY: 'auto', boxSizing: 'border-box' }}>
          <div style={{ maxWidth: '650px', margin: '0 auto', width: '100%' }}>
            
            <p style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '4px', fontWeight: '500' }}>Catálogo de servicios &gt; Registrar Nuevo Servicio</p>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px', color: '#ffffff', marginTop: 0 }}>Registrar nuevo servicio</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '32px', marginTop: 0 }}>Crea un servicio básico para comenzar a configurar su disponibilidad y tarifas.</p>

            <form onSubmit={manejarEnvio} style={{ padding: '24px', borderRadius: '12px', border: '1px solid #1e293b', backgroundColor: '#0c1324', marginBottom: '32px', boxSizing: 'border-box' }}>
              
              <div style={{ display: 'flex', padding: '16px', borderRadius: '8px', backgroundColor: 'rgba(37, 99, 235, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '24px', boxSizing: 'border-box' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: '#2563eb', fontSize: '12px', fontWeight: 'bold', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: '16px' }}>01</span>
                <div>
                  <h6 style={{ fontWeight: 'bold', fontSize: '14px', color: '#ffffff', margin: '0 0 2px 0' }}>Información general</h6>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Define los datos básicos con los que se identificará tu servicio.</p>
                </div>
              </div>

              {error && (
                <div style={{ textAlign: 'center', fontSize: '14px', padding: '12px', marginBottom: '16px', borderRadius: '8px', border: '1px solid #ef4444', backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#f87171', fontWeight: '500' }}>
                  {error}
                </div>
              )}

              {mensaje && (
                <div style={{ textAlign: 'center', fontSize: '14px', padding: '12px', marginBottom: '16px', borderRadius: '8px', border: '1px solid #10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', fontWeight: '500' }}>
                  {mensaje}
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#e2e8f0' }}>Nombre del Servicio *</label>
                <input 
                  type="text" 
                  style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', borderRadius: '8px', border: '1px solid #334155', color: '#ffffff', fontSize: '14px', boxSizing: 'border-box' }}
                  placeholder="Ej. El Club de Tenis"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#e2e8f0' }}>Descripción</label>
                <textarea 
                  style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', borderRadius: '8px', border: '1px solid #334155', color: '#ffffff', fontSize: '14px', height: '128px', resize: 'none', boxSizing: 'border-box' }}
                  placeholder="Ej. El sector de entrenamiento personalizado..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
                <span style={{ color: '#64748b', fontSize: '12px' }}>* Todos los campos son obligatorios</span>
                <button type="submit" style={{ padding: '8px 20px', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '12px', fontWeight: 'bold', borderRadius: '8px', border: '0', cursor: 'pointer' }}>
                  Guardar Servicio &gt;
                </button>
              </div>

            </form>

            {serviciosRegistrados.length > 0 && (
              <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid #1e293b', backgroundColor: '#0c1324', boxSizing: 'border-box' }}>
                <h5 style={{ fontWeight: 'bold', marginBottom: '16px', color: '#ffffff', fontSize: '16px', marginTop: 0 }}>Panel de Administración: Servicios Registrados</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {serviciosRegistrados.map(function(serv: ServicioRegistrado) {
                    return (
                      <div key={serv.id} style={{ padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#080d1a', border: '1px solid #1e293b', boxSizing: 'border-box' }}>
                        <div>
                          <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#ffffff', fontSize: '14px' }}>{serv.nombre}</p>
                          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{serv.descripcion}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '12px', border: '1px solid rgba(234, 179, 8, 0.2)', color: '#facc15', backgroundColor: 'rgba(234, 179, 8, 0.1)', fontWeight: '500' }}>
                            {serv.estado}
                          </span>
                          <Link 
                            href="/activar-servicio" 
                            style={{ padding: '6px 14px', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '12px', fontWeight: 'bold', borderRadius: '6px', border: '0', cursor: 'pointer', textDecoration: 'none' }}
                          >
                            Configurar y Activar
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
