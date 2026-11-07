import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Hero Section */}
      <section className="text-center py-8 sm:py-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-3.5 py-1 text-xs font-semibold text-primary-800 mb-6">
          <span>🚀 Fase 3 Final</span>
          <span className="text-gray-400">·</span>
          <span>Despliegue Render Cloud 100% Funcional</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
          Reserva de Servicios & Centros Deportivos{" "}
          <span className="text-primary-700 block sm:inline">en Tiempo Real</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-gray-600 leading-relaxed">
          La solución integral (Caso 14) para agendamiento en salones, consultorios médicos,
          clínicas y clubes deportivos. Con disponibilidad real, seguridad MFA y autoservicio por roles.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/servicios"
            className="rounded-lg bg-primary-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-800 transition-colors"
          >
            Explorar Servicios Disponibles →
          </Link>
          <Link
            href="/deportes"
            className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 transition-colors"
          >
            Módulos Deportivos (Canchas/Torneos)
          </Link>
          <Link
            href="/registro"
            className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            Crear Cuenta Gratis
          </Link>
        </div>
      </section>

      {/* Role Portals Showcase */}
      <section className="mt-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Portales Integrados por Perfil de Usuario</h2>
          <p className="text-xs text-gray-500 mt-1">
            Prueba cada uno de los flujos del sistema con las cuentas preconfiguradas en la barra superior.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Admin */}
          <div className="rounded-xl border border-purple-200 bg-white p-6 shadow-xs hover:border-purple-400 transition-all flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-xl text-purple-700">
                👑
              </div>
              <h3 className="mt-4 text-base font-bold text-gray-900">Panel Administrador</h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Gestión de usuarios, verificación de identidad mercantil de proveedores, métricas de negocio y registro de auditoría.
              </p>
              <div className="mt-3 text-[11px] font-mono text-purple-700 bg-purple-50 p-2 rounded">
                admin@sporthub.co
              </div>
            </div>
            <Link
              href="/admin"
              className="mt-4 block text-center rounded-md bg-purple-700 py-2 text-xs font-semibold text-white hover:bg-purple-800"
            >
              Ir a Administración →
            </Link>
          </div>

          {/* Provider */}
          <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-xl text-blue-700">
                🏢
              </div>
              <h3 className="mt-4 text-base font-bold text-gray-900">Portal de Proveedor</h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Administración de catálogo de servicios, precios, franjas horarias semanales, gestión de equipo y confirmación de citas.
              </p>
              <div className="mt-3 text-[11px] font-mono text-blue-700 bg-blue-50 p-2 rounded">
                deportes@sporthub.co
              </div>
            </div>
            <Link
              href="/proveedor"
              className="mt-4 block text-center rounded-md bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Ir a Portal Proveedor →
            </Link>
          </div>

          {/* Staff */}
          <div className="rounded-xl border border-amber-200 bg-white p-6 shadow-xs hover:border-amber-400 transition-all flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-xl text-amber-700">
                🏃
              </div>
              <h3 className="mt-4 text-base font-bold text-gray-900">Agenda de Empleados</h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Agenda diaria de atención personalizada, asignación de turnos, y registro de citas completadas en un clic.
              </p>
              <div className="mt-3 text-[11px] font-mono text-amber-700 bg-amber-50 p-2 rounded">
                entrenador@sporthub.co
              </div>
            </div>
            <Link
              href="/empleado"
              className="mt-4 block text-center rounded-md bg-amber-600 py-2 text-xs font-semibold text-white hover:bg-amber-700"
            >
              Ir a Mi Agenda →
            </Link>
          </div>

          {/* Client */}
          <div className="rounded-xl border border-emerald-200 bg-white p-6 shadow-xs hover:border-emerald-400 transition-all flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-xl text-emerald-700">
                👤
              </div>
              <h3 className="mt-4 text-base font-bold text-gray-900">Autoservicio Cliente</h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Reserva con disponibilidad en vivo, consulta de citas, cancelación justificada y reprogramación autónoma.
              </p>
              <div className="mt-3 text-[11px] font-mono text-emerald-700 bg-emerald-50 p-2 rounded">
                cliente@sporthub.co
              </div>
            </div>
            <Link
              href="/dashboard"
              className="mt-4 block text-center rounded-md bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Ir a Mis Citas →
            </Link>
          </div>
        </div>
      </section>

      {/* Security & Reliability Section */}
      <section className="mt-16 rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          <div className="space-y-2">
            <span className="text-2xl">🔒</span>
            <h4 className="font-bold text-gray-900 text-sm">Autenticación Segura & MFA</h4>
            <p className="text-xs text-gray-600">
              Tokens JWT HMAC-SHA512 con rotación y soporte MFA TOTP (Google Authenticator) y OTP vía correo.
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-2xl">⚡</span>
            <h4 className="font-bold text-gray-900 text-sm">Disponibilidad en Tiempo Real</h4>
            <p className="text-xs text-gray-600">
              Algoritmo de cálculo de franjas horarias sin solapamientos ni doble reserva en citas e instalaciones.
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-2xl">☁</span>
            <h4 className="font-bold text-gray-900 text-sm">Despliegue Render Cloud</h4>
            <p className="text-xs text-gray-600">
              Arquitectura de microservicios con PostgreSQL gestionado y despliegue continuo vía GitLab / Azure DevOps.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
