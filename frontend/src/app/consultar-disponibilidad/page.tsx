'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  dias: string;
  horario: string;
  estado: string;
}

export default function ConsultarDisponibilidadPage() {
  const [serviciosActivos, setServiciosActivos] = useState<Servicio[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const nombreGuardado = localStorage.getItem('servicio_a_activar_nombre');
      const descripcionGuardada = localStorage.getItem('servicio_a_activar_descripcion');
      const horarioGuardado = localStorage.getItem('horarios_servicios');

      const serviciosBase: Servicio[] = [
        { id: 101, nombre: 'ENTRENAMIENTO FUNCIONAL', descripcion: 'Mejora fuerza, movilidad y resistencia con rutinas guiadas de alta energía.', dias: 'Lunes a Sábado', horario: '06:00 AM - 08:30 PM', estado: 'ACTIVO' },
        { id: 102, nombre: 'CANCHA DE FÚTBOL', descripcion: 'Cancha sintética habilitada para entrenamientos, partidos y torneos.', dias: 'Lunes a Domingo', horario: '08:00 AM - 10:00 PM', estado: 'ACTIVO' },
        { id: 103, nombre: 'CLASE DE NATACIÓN', descripcion: 'Sesiones técnicas en piscina semiolímpica para todos los niveles.', dias: 'Martes, Jueves y Sábado', horario: '07:00 AM - 04:00 PM', estado: 'ACTIVO' }
      ];

      if (nombreGuardado) {
        let diasFormateados = 'Lunes a Viernes';
        let horasFormateadas = '08:00 AM - 10:00 AM';

        if (horarioGuardado) {
          const listaHorarios = JSON.parse(horarioGuardado);
          if (listaHorarios.length > 0) {
            const ultimoHorario = listaHorarios[listaHorarios.length - 1];
            if (ultimoHorario.includes(' (')) {
              const partes = ultimoHorario.split(' (');
              diasFormateados = partes[0];
              horasFormateadas = partes[1].replace(')', '');
            } else {
              horasFormateadas = ultimoHorario;
            }
          }
        }

        const nuevoServicio: Servicio = {
          id: Date.now(),
          nombre: nombreGuardado.toUpperCase(),
          descripcion: descripcionGuardada || 'Sin descripción disponible.',
          dias: diasFormateados,
          horario: horasFormateadas,
          estado: 'ACTIVO'
        };

        setServiciosActivos([...serviciosBase, nuevoServicio]);
      } else {
        setServiciosActivos(serviciosBase);
      }
      setCargando(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);
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
              🏠 Inicio / Principal
            </button>
            <button type="button" style={{ textAlign: 'left', padding: '8px 12px', backgroundColor: 'rgba(37, 99, 235, 0.15)', color: '#3b82f6', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: '0', cursor: 'pointer' }}>
              📅 Catálogo de Servicios
            </button>
            <button type="button" style={{ textAlign: 'left', padding: '8px 12px', backgroundColor: 'transparent', color: '#94a3b8', fontSize: '14px', fontWeight: '500', border: '0', cursor: 'pointer' }}>
              🎟️ Mis Citas
            </button>
            <button type="button" style={{ textAlign: 'left', padding: '8px 12px', backgroundColor: 'transparent', color: '#94a3b8', fontSize: '14px', fontWeight: '500', border: '0', cursor: 'pointer' }}>
              👤 Mi Perfil
            </button>
          </nav>
        </div>

        <div style={{ paddingTop: '16px', borderTop: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#ffffff', fontSize: '12px' }}>
            CC
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#ffffff' }}>Carlos Calle</p>
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

        <main style={{ flexGrow: 1, padding: '40px', backgroundColor: '#080d1a', overflowY: 'auto', boxSizing: 'border-box' }}>
          <div style={{ width: '100%', margin: '0 auto' }}>
            
            <p style={{ fontSize: '11px', color: '#3b82f6', marginBottom: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>PORTAL DE CLIENTE</p>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#ffffff', textTransform: 'uppercase' }}>SERVICIOS DISPONIBLES</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 32px 0' }}>Conoce los espacios disponibles y reserva tu entrenamiento.</p>

            {cargando ? (
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>Cargando catálogo de servicios...</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
                {serviciosActivos.map((servicio) => (
                  <div key={servicio.id} style={{ padding: '24px', borderRadius: '8px', border: '1px solid #1e293b', backgroundColor: '#0c1324', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box', minHeight: '180px' }}>
                    
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '0.5px' }}>
                          {servicio.nombre}
                        </h4>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          ● {servicio.estado}
                        </span>
                      </div>
                      
                      <p style={{ margin: '0 0 20px 0', fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }}>
                        {servicio.descripcion}
                      </p>
                    </div>

                    <div style={{ borderTop: '1px solid #1e293b', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>DÍAS</span>
                        <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: '500' }}>{servicio.dias}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>HORARIO</span>
                        <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: '500' }}>{servicio.horario}</span>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '32px' }}>
              <Link href="/registrar-servicio" style={{ fontSize: '13px', color: '#64748b', textDecoration: 'none' }}>
                &larr; Volver al Panel de Proveedor
              </Link>
            </div>

          </div>
        </main>
      </div>

    </div>
  );
}
