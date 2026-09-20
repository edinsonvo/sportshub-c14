import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SportHub — Reserva de servicios",
  description: "Plataforma de reservas de servicios (Caso 14): agenda, cita y disponibilidad en línea.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}