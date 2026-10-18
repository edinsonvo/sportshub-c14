"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/deportes", label: "Inicio" },
  { href: "/deportes/instalaciones", label: "Instalaciones" },
  { href: "/deportes/clases", label: "Clases" },
  { href: "/deportes/membresias", label: "Membresías" },
  { href: "/deportes/implementos", label: "Implementos" },
  { href: "/deportes/torneos", label: "Torneos" },
];

export function DeportesNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-8 flex flex-wrap items-center gap-2">
      <Link
        href="/dashboard"
        className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100"
      >
        ← Mis citas
      </Link>
      {LINKS.map((link) => {
        const active =
          link.href === "/deportes" ? pathname === "/deportes" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary-700 text-white"
                : "text-gray-600 hover:bg-gray-100",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}