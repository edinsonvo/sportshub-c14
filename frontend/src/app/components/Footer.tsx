import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-700 text-white font-bold text-xs">
                ⚡
              </span>
              <span className="text-lg font-bold text-gray-900">SportHub</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Plataforma integral de reserva de servicios para centros deportivos, consultorios médicos,
              clínicas y centros de estética con disponibilidad en tiempo real.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Render Cloud · Estado Operativo (100%)</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-900">Portales</h4>
            <ul className="mt-3 space-y-2 text-xs text-gray-600">
              <li>
                <Link href="/admin" className="hover:text-primary-700 transition-colors">
                  Panel Administrador (HU-04..10, 48, 50)
                </Link>
              </li>
              <li>
                <Link href="/proveedor" className="hover:text-primary-700 transition-colors">
                  Portal Proveedor (HU-17..32, 38..41)
                </Link>
              </li>
              <li>
                <Link href="/empleado" className="hover:text-primary-700 transition-colors">
                  Agenda Empleados (HU-25, 35, 39)
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-primary-700 transition-colors">
                  Autoservicio Cliente (HU-33..38)
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-900">Servicios & Deportes</h4>
            <ul className="mt-3 space-y-2 text-xs text-gray-600">
              <li>
                <Link href="/servicios" className="hover:text-primary-700 transition-colors">
                  Catálogo General de Servicios
                </Link>
              </li>
              <li>
                <Link href="/deportes/instalaciones" className="hover:text-primary-700 transition-colors">
                  Reserva de Canchas e Instalaciones
                </Link>
              </li>
              <li>
                <Link href="/deportes/clases" className="hover:text-primary-700 transition-colors">
                  Clases Grupales e Instructores
                </Link>
              </li>
              <li>
                <Link href="/deportes/torneos" className="hover:text-primary-700 transition-colors">
                  Torneos y Competencias
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-900">Seguridad & Normativa</h4>
            <ul className="mt-3 space-y-2 text-xs text-gray-600">
              <li>
                <Link href="/ajustes" className="hover:text-primary-700 transition-colors">
                  MFA / Doble Factor (TOTP & OTP)
                </Link>
              </li>
              <li>
                <Link href="/recuperar-password" className="hover:text-primary-700 transition-colors">
                  Recuperación de Contraseña (HU-15)
                </Link>
              </li>
              <li className="text-gray-400">
                Ley 1581 de 2012 (Habeas Data Colombia)
              </li>
              <li className="text-gray-400">
                CodeF@ctory UdeA V2.0 · Fase 3 Final
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
          <p>© 2026 SportHub Inc. · Universidad de Antioquia · Caso 14</p>
          <p>Despliegue Continuo Render Cloud via GitLab</p>
        </div>
      </div>
    </footer>
  );
}
