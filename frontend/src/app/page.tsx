import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-8 px-4 text-center">
      <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
        SportHub
      </h1>
      <p className="max-w-xl text-lg text-gray-600">
        Reserva servicios de salones, consultorios, clínicas y centros deportivos
        con disponibilidad real en línea.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/registro"
          className="inline-flex h-10 items-center rounded-md bg-primary-700 px-4 text-sm font-medium text-white hover:bg-primary-800"
        >
          Crear cuenta
        </Link>
        <Link
          href="/login"
          className="inline-flex h-10 items-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 hover:bg-gray-50"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center rounded-md px-4 text-sm font-medium text-primary-700 hover:bg-primary-50"
        >
          Ver mis citas →
        </Link>
        <Link
          href="/ajustes"
          className="inline-flex h-10 items-center rounded-md px-4 text-sm font-medium text-primary-700 hover:bg-primary-50"
        >
          Seguridad (MFA)
        </Link>
        <Link
          href="/deportes"
          className="inline-flex h-10 items-center rounded-md border border-primary-200 bg-primary-50 px-4 text-sm font-medium text-primary-700 hover:bg-primary-100"
        >
          Deportes →
        </Link>
      </div>
    </main>
  );
}