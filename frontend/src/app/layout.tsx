import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";

export const metadata: Metadata = {
  title: "SportHub — Plataforma Integral de Reserva de Servicios",
  description:
    "Reserva servicios de salones, consultorios, clínicas y centros deportivos con disponibilidad real en línea (Caso 14 - Fase 3 Final).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased bg-gray-50 text-gray-900">
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
