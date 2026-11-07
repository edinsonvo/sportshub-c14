"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession, loadSession, saveSession, type Session } from "@/lib/auth";
import { api } from "@/lib/api";

const DEMO_ACCOUNTS = [
  { label: "👑 Admin", email: "admin@sporthub.co", role: "ADMIN", path: "/admin" },
  { label: "🏢 Prov. Deportes", email: "deportes@sporthub.co", role: "PROVIDER", path: "/proveedor" },
  { label: "💅 Prov. Belleza", email: "belleza@sporthub.co", role: "PROVIDER", path: "/proveedor" },
  { label: "🏃 Staff Entrenador", email: "entrenador@sporthub.co", role: "STAFF", path: "/empleado" },
  { label: "💆 Staff Estilista", email: "laura@sporthub.co", role: "STAFF", path: "/empleado" },
  { label: "👤 Cliente Demo", email: "cliente@sporthub.co", role: "CLIENT", path: "/dashboard" },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    setSession(loadSession());
    const handleStorage = () => setSession(loadSession());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [pathname]);

  async function handleDemoSwitch(account: typeof DEMO_ACCOUNTS[0]) {
    try {
      setSwitching(account.email);
      const res = await api<{
        accessToken: string;
        refreshToken: string;
        userId: string;
        email: string;
        role: string;
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: account.email, password: "password" }),
      });
      const newSession: Session = {
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        userId: res.userId,
        email: res.email,
        role: res.role,
      };
      saveSession(newSession);
      setSession(newSession);
      router.push(account.path);
    } catch (err) {
      console.error("Error cambiando a cuenta demo:", err);
    } finally {
      setSwitching(null);
    }
  }

  function handleLogout() {
    clearSession();
    setSession(null);
    router.push("/login");
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">ADMIN</span>;
      case "PROVIDER":
        return <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">PROVEEDOR</span>;
      case "STAFF":
        return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">EMPLEADO</span>;
      case "CLIENT":
      default:
        return <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">CLIENTE</span>;
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md shadow-xs">
      {/* Demo Quick Switcher Top Bar */}
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-1 text-xs">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium text-gray-600">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Acceso Rápido Fase 3 (Contraseña: password):</span>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {DEMO_ACCOUNTS.map((acc) => {
              const isActive = session?.email === acc.email;
              return (
                <button
                  key={acc.email}
                  disabled={switching !== null}
                  onClick={() => handleDemoSwitch(acc)}
                  className={`rounded px-2 py-0.5 transition-all text-xs font-medium ${
                    isActive
                      ? "bg-primary-700 text-white shadow-xs"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                  }`}
                  title={`Iniciar sesión como ${acc.email}`}
                >
                  {switching === acc.email ? "Cargando…" : acc.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-700 text-white font-bold shadow-sm group-hover:bg-primary-800 transition-colors">
              ⚡
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-gray-900">SportHub</span>
              <span className="hidden sm:inline-block ml-2 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 uppercase">
                Fase 3 Final
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
          <Link
            href="/servicios"
            className={`hover:text-primary-700 transition-colors ${
              pathname === "/servicios" ? "text-primary-700 font-semibold" : ""
            }`}
          >
            Servicios
          </Link>
          <Link
            href="/deportes"
            className={`hover:text-primary-700 transition-colors ${
              pathname.startsWith("/deportes") ? "text-primary-700 font-semibold" : ""
            }`}
          >
            Deportes
          </Link>

          {/* Role-Specific Portal Links */}
          {session?.role === "ADMIN" && (
            <Link
              href="/admin"
              className={`rounded-md px-2.5 py-1 text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors ${
                pathname === "/admin" ? "ring-2 ring-purple-600 font-bold" : ""
              }`}
            >
              👑 Panel Admin
            </Link>
          )}

          {session?.role === "PROVIDER" && (
            <Link
              href="/proveedor"
              className={`rounded-md px-2.5 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors ${
                pathname === "/proveedor" ? "ring-2 ring-blue-600 font-bold" : ""
              }`}
            >
              🏢 Portal Proveedor
            </Link>
          )}

          {session?.role === "STAFF" && (
            <Link
              href="/empleado"
              className={`rounded-md px-2.5 py-1 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors ${
                pathname === "/empleado" ? "ring-2 ring-amber-600 font-bold" : ""
              }`}
            >
              🏃 Mi Agenda
            </Link>
          )}

          {session?.role === "CLIENT" && (
            <Link
              href="/dashboard"
              className={`rounded-md px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors ${
                pathname === "/dashboard" ? "ring-2 ring-emerald-600 font-bold" : ""
              }`}
            >
              📅 Mis Citas
            </Link>
          )}
        </div>

        {/* User Status / Auth Actions */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  {getRoleBadge(session.role)}
                </div>
                <p className="text-xs text-gray-500 truncate max-w-[150px]">{session.email}</p>
              </div>
              <Link
                href="/perfil"
                className="rounded-md border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                title="Mi Perfil"
              >
                👤
              </Link>
              <Link
                href="/ajustes"
                className="rounded-md border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                title="Seguridad MFA"
              >
                🔒
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Salir
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-md border border-gray-300 px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="rounded-md bg-primary-700 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-primary-800 transition-colors shadow-xs"
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          {session && getRoleBadge(session.role)}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100 focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-3 md:hidden space-y-2">
          <Link
            href="/servicios"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-gray-700 hover:text-primary-700"
          >
            Servicios
          </Link>
          <Link
            href="/deportes"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-gray-700 hover:text-primary-700"
          >
            Deportes
          </Link>

          {session?.role === "ADMIN" && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-purple-700"
            >
              👑 Panel Administrador
            </Link>
          )}

          {session?.role === "PROVIDER" && (
            <Link
              href="/proveedor"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-blue-700"
            >
              🏢 Portal Proveedor
            </Link>
          )}

          {session?.role === "STAFF" && (
            <Link
              href="/empleado"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-amber-700"
            >
              🏃 Mi Agenda de Citas
            </Link>
          )}

          {session?.role === "CLIENT" && (
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-emerald-700"
            >
              📅 Mis Citas
            </Link>
          )}

          <div className="border-t border-gray-100 pt-2">
            {session ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{session.email}</span>
                  {getRoleBadge(session.role)}
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/perfil"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 rounded-md border border-gray-200 py-1.5 text-center text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Mi Perfil
                  </Link>
                  <Link
                    href="/ajustes"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 rounded-md border border-gray-200 py-1.5 text-center text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Seguridad MFA
                  </Link>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full rounded-md bg-gray-100 py-2 text-center text-xs font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md border border-gray-300 py-2 text-center text-sm font-medium text-gray-700"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/registro"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md bg-primary-700 py-2 text-center text-sm font-medium text-white"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
