"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { clearSession, loadSession } from "@/lib/auth";
import type { UserProfile } from "@/lib/types";

export default function PerfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const session = loadSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    loadProfile();
  }, [router]);

  async function loadProfile() {
    setLoading(true);
    setError(null);
    const token = loadSession()?.accessToken;
    try {
      const data = await api<UserProfile>("/users/profile", { token });
      setProfile(data);
      setFullName(data.fullName);
      setPhone(data.phone || "");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cargar información de perfil");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const token = loadSession()?.accessToken;
    try {
      const updated = await api<UserProfile>("/users/profile", {
        method: "PUT",
        token,
        body: JSON.stringify({ fullName, phone }),
      });
      setProfile(updated);
      setSuccessMsg("¡Datos de perfil actualizados correctamente! (HU-02)");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al actualizar perfil");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivateAccount() {
    if (
      !confirm(
        "¿Estás seguro de desactivar tu cuenta? Tu usuario no podrá iniciar sesión y tus reservas activas serán suspendidas (HU-04)."
      )
    ) {
      return;
    }
    const token = loadSession()?.accessToken;
    try {
      await api("/users/deactivate", {
        method: "PUT",
        token,
      });
      clearSession();
      alert("Tu cuenta ha sido desactivada satisfactoriamente.");
      router.push("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo desactivar la cuenta.");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Mi Perfil de Usuario
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Gestiona tus datos personales de contacto y opciones de tu cuenta en SportHub (HU-02, HU-04).
        </p>
      </div>

      {successMsg && (
        <div className="mb-4 rounded-md bg-emerald-50 p-3 text-sm font-medium text-emerald-800 border border-emerald-200">
          ✓ {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm font-medium text-red-800 border border-red-200">
          ⚠ {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Cargando perfil…</div>
      ) : profile ? (
        <div className="space-y-6">
          {/* Personal Info Form */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
            <h3 className="text-base font-bold text-gray-900 mb-4">Información de Contacto</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Correo Electrónico (Inmutable)</label>
                <input
                  type="email"
                  disabled
                  value={profile.email}
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Número de Teléfono</label>
                <input
                  type="tel"
                  placeholder="+57 300 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary-700 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-800 shadow-xs disabled:opacity-50"
                >
                  {saving ? "Guardando…" : "Guardar Cambios (HU-02)"}
                </button>
              </div>
            </form>
          </div>

          {/* Account Security & Role Status */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
            <h3 className="text-base font-bold text-gray-900 mb-4">Seguridad y Permisos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-gray-500 font-medium">Rol Asignado</p>
                <p className="mt-1 text-sm font-bold text-purple-700">{profile.role}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-gray-500 font-medium">Autenticación en Dos Pasos (MFA)</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {profile.mfaEnabled ? "🔒 Habilitado" : "🔓 Deshabilitado"}
                </p>
                <Link href="/ajustes" className="mt-1 inline-block text-primary-700 hover:underline">
                  Configurar método MFA →
                </Link>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 shadow-xs">
            <h3 className="text-base font-bold text-red-900 mb-2">Zona de Peligro</h3>
            <p className="text-xs text-red-700 mb-4">
              Si desactivas tu cuenta no podrás agendar nuevas citas ni acceder a tus reservas activas (HU-04).
            </p>
            <button
              onClick={handleDeactivateAccount}
              className="rounded-lg border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 shadow-xs"
            >
              Desactivar mi cuenta definitivamente
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
