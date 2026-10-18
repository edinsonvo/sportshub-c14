"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loadSession } from "@/lib/auth";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/app/components/ui/Card";
import { DeportesNav } from "@/app/components/DeportesNav";

export default function DeportesPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const session = loadSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setRole(session.role);
  }, [router]);

  if (!role) return null;

  const modulos: {
    href: string;
    titulo: string;
    descripcion: string;
    tareas: Record<string, string>;
  }[] = [
    {
      href: "/deportes/instalaciones",
      titulo: "Instalaciones",
      descripcion: "Canchas, piscinas, salas y gimnasios con reserva por turno.",
      tareas: {
        CLIENT: "Consultar disponibilidad y reservar tu turno.",
        PROVIDER: "Registrar instalaciones y agendar mantenimientos.",
        STAFF: "Consultar las instalaciones de tu proveedor.",
        ADMIN: "Supervisar instalaciones y bloquear mantenimientos.",
      },
    },
    {
      href: "/deportes/clases",
      titulo: "Clases grupales",
      descripcion: "Entrenamientos y clases con cupo limitado.",
      tareas: {
        CLIENT: "Inscribirte o cancelar tu inscripción.",
        PROVIDER: "Crear clases, asignar entrenador y completar las realizadas.",
        STAFF: "Ver las clases de tu proveedor y cancelar inscripciones.",
        ADMIN: "Supervisar clases y completar las realizadas.",
      },
    },
    {
      href: "/deportes/membresias",
      titulo: "Membresías",
      descripcion: "Planes con descuentos por vigencia.",
      tareas: {
        CLIENT: "Comprar o renovar y calcular tu beneficio.",
        PROVIDER: "Crear planes y suspender membresías por incumplimiento.",
        STAFF: "Consultar los planes publicados y sus beneficios.",
        ADMIN: "Supervisar membresías vendidas y suspender por incumplimiento.",
      },
    },
    {
      href: "/deportes/implementos",
      titulo: "Alquiler de implementos",
      descripcion: "Balones, raquetas y más por día y cantidad.",
      tareas: {
        CLIENT: "Ver stock y reservar unidades.",
        PROVIDER: "Registrar implementos, prestar y registrar devoluciones.",
        STAFF: "Consultar el inventario de tu proveedor.",
        ADMIN: "Supervisar inventario y gestionar préstamos y devoluciones.",
      },
    },
    {
      href: "/deportes/torneos",
      titulo: "Torneos y eventos",
      descripcion: "Eliminatorias o ligas con ranking.",
      tareas: {
        CLIENT: "Inscribirte a torneos abiertos y ver el ranking.",
        PROVIDER: "Crear torneos, abrir llaves, registrar resultados y finalizar.",
        STAFF: "Ver torneos, llaves y ranking.",
        ADMIN: "Supervisar torneos, abrir/cerrar y registrar resultados.",
      },
    },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Deportes</h1>
        <p className="text-sm text-gray-500">
          Módulo deportivo · rol {role}
        </p>
      </header>
      <DeportesNav />
      <div className="grid gap-4 sm:grid-cols-1">
        {modulos.map((m) => (
          <Card key={m.href}>
            <CardHeader>
              <h2 className="font-semibold">{m.titulo}</h2>
              <p className="mt-1 text-sm text-gray-500">{m.descripcion}</p>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                {m.tareas[role] ?? m.descripcion}
              </p>
              <Link href={m.href}>
                <Button variant="secondary">Entrar</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}