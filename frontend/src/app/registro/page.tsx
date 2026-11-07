"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { isPasswordValid, saveSession, type Session } from "@/lib/auth";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Card, CardContent, CardHeader } from "@/app/components/ui/Card";

export default function RegistroPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"CLIENT" | "PROVIDER">("CLIENT");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isPasswordValid(password)) {
      setPasswordError(
        "La contraseña debe tener mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número",
      );
      return;
    }
    setLoading(true);
    try {
      const session = await api<Session>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, fullName, phone, role }),
      });
      saveSession(session);
      if (session.role === "PROVIDER") {
        router.push("/proveedor");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al registrar la cuenta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[85vh] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md shadow-md border-gray-200">
        <CardHeader>
          <h1 className="text-xl font-bold text-gray-900">Crear cuenta en SportHub</h1>
          <p className="text-xs text-gray-500 mt-1">
            Únete a la plataforma para reservar o prestar servicios profesionales (HU-01, HU-06).
          </p>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="mb-4 rounded-md bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200" role="alert">
              {error}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {/* Account Type Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700">Tipo de Cuenta</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("CLIENT")}
                  className={`rounded-lg py-2 px-3 text-xs font-semibold transition-all ${
                    role === "CLIENT"
                      ? "bg-primary-700 text-white shadow-xs"
                      : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  👤 Cliente (Reservar)
                </button>
                <button
                  type="button"
                  onClick={() => setRole("PROVIDER")}
                  className={`rounded-lg py-2 px-3 text-xs font-semibold transition-all ${
                    role === "PROVIDER"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  🏢 Proveedor (Negocio)
                </button>
              </div>
            </div>

            <Input
              label="Nombre completo o Razón Social"
              name="fullName"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              label="Correo electrónico"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Teléfono de contacto"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              label="Contraseña"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              error={passwordError ?? undefined}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(null);
              }}
            />
            <p className="text-[11px] text-gray-500 leading-normal">
              Al registrarte aceptas los Términos y Condiciones y autorizas el tratamiento de tus datos personales conforme a la Ley 1581 de 2012 (Habeas Data Colombia).
            </p>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando cuenta…" : `Registrarme como ${role === "PROVIDER" ? "Proveedor" : "Cliente"}`}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-600">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-semibold text-primary-700 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
