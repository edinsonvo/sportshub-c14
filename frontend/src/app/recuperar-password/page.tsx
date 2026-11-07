"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { isPasswordValid } from "@/lib/auth";

export default function RecuperarPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Step 1: Request reset token
  async function handleRequestToken(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ message: string; resetToken?: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
      setSuccessMsg(res.message || "Se ha emitido el token de restablecimiento.");
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al solicitar restablecimiento");
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Confirm new password
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas ingresadas no coinciden.");
      return;
    }

    if (!isPasswordValid(newPassword)) {
      setError("La contraseña debe tener mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número.");
      return;
    }

    setLoading(true);
    try {
      const res = await api<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token: resetToken,
          newPassword,
        }),
      });
      setSuccessMsg(res.message || "¡Contraseña actualizada exitosamente! Ya puedes iniciar sesión.");
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "El token es inválido o ha expirado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xl font-bold">
            🔑
          </div>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">
            Recuperar Contraseña (HU-15)
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            {step === 1
              ? "Ingresa tu correo registrado para recibir tu enlace o token de acceso."
              : "Ingresa el código/token y tu nueva contraseña segura."}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-xs font-medium text-red-800 border border-red-200">
            ⚠ {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 rounded-md bg-emerald-50 p-3 text-xs font-medium text-emerald-800 border border-emerald-200">
            ✓ {successMsg}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestToken} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                placeholder="ejemplo@sporthub.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary-700 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 transition-colors shadow-xs disabled:opacity-50"
            >
              {loading ? "Generando solicitud…" : "Enviar Enlace de Recuperación"}
            </button>
            <div className="text-center pt-2">
              <Link href="/login" className="text-xs text-gray-500 hover:text-primary-700">
                ← Volver a Iniciar Sesión
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Token de Recuperación
              </label>
              <textarea
                rows={2}
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Pega aquí el token recibido"
                className="w-full rounded-lg border border-gray-300 p-2 text-xs font-mono focus:border-primary-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nueva Contraseña
              </label>
              <input
                type="password"
                required
                placeholder="Mínimo 8 caracteres, mayúscula y número"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                required
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary-700 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 transition-colors shadow-xs disabled:opacity-50"
            >
              {loading ? "Actualizando…" : "Restablecer y Entrar"}
            </button>

            <div className="flex justify-between items-center pt-2 text-xs">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-gray-500 hover:text-gray-800"
              >
                ← Usar otro correo
              </button>
              <Link href="/login" className="text-primary-700 hover:underline">
                Iniciar Sesión
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
