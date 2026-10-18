"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { saveSession, type Session } from "@/lib/auth";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Card, CardContent, CardHeader } from "@/app/components/ui/Card";

type MfaMethod = "TOTP" | "EMAIL";

interface LoginResult extends Session {
  mfaRequired: boolean;
  mfaMethods: MfaMethod[];
  challengeToken: string | null;
}

interface MfaChallenge {
  challengeToken: string;
  methods: MfaMethod[];
  email: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [challenge, setChallenge] = useState<MfaChallenge | null>(null);
  const [method, setMethod] = useState<MfaMethod>("TOTP");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await api<LoginResult>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (result.mfaRequired && result.challengeToken) {
        setChallenge({
          challengeToken: result.challengeToken,
          methods: result.mfaMethods,
          email: result.email,
        });
        setMethod(result.mfaMethods.includes("TOTP") ? "TOTP" : "EMAIL");
        return;
      }
      saveSession({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        userId: result.userId,
        email: result.email,
        role: result.role,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendCode() {
    if (!challenge) return;
    setError(null);
    setCodeSent(false);
    try {
      await api<{ expiresInSeconds: number }>("/auth/mfa/send-code", {
        method: "POST",
        body: JSON.stringify({ challengeToken: challenge.challengeToken }),
      });
      setCodeSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo enviar el código");
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!challenge) return;
    setError(null);
    setLoading(true);
    try {
      const result = await api<LoginResult>("/auth/mfa/verify", {
        method: "POST",
        body: JSON.stringify({ challengeToken: challenge.challengeToken, method, code }),
      });
      saveSession({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        userId: result.userId,
        email: result.email,
        role: result.role,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Código inválido");
    } finally {
      setLoading(false);
    }
  }

  function resetFlow() {
    setChallenge(null);
    setCode("");
    setCodeSent(false);
    setError(null);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-xl font-semibold">
            {challenge ? "Verificación en dos pasos" : "Iniciar sesión"}
          </h1>
          <p className="text-sm text-gray-500">
            {challenge
              ? `Se requiere un código adicional para ${challenge.email}.`
              : "Accede a tu cuenta de SportHub"}
          </p>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          {!challenge ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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
                label="Contraseña"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" disabled={loading}>
                {loading ? "Ingresando…" : "Ingresar"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="flex flex-col gap-4" noValidate>
              {challenge.methods.length > 1 ? (
                <div className="flex gap-2">
                  {challenge.methods.map((m) => (
                    <Button
                      key={m}
                      type="button"
                      variant={method === m ? "primary" : "secondary"}
                      onClick={() => {
                        setMethod(m);
                        setCode("");
                        setCodeSent(false);
                      }}
                    >
                      {m === "TOTP" ? "App de autenticación" : "Correo electrónico"}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  Método:{" "}
                  {challenge.methods[0] === "TOTP"
                    ? "app de autenticación"
                    : "correo electrónico"}
                </p>
              )}

              {method === "EMAIL" ? (
                <div className="flex flex-col gap-2">
                  <Button type="button" variant="secondary" onClick={handleSendCode}>
                    Enviar código al correo
                  </Button>
                  {codeSent ? (
                    <p className="text-xs text-gray-500" role="status">
                      Código enviado. Revisa tu bandeja (en desarrollo aparece en el log del backend).
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  Abre tu app de autenticación y escribe el código que cambia cada 30 segundos.
                </p>
              )}

              <Input
                label="Código de 6 dígitos"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              <Button type="submit" disabled={loading}>
                {loading ? "Verificando…" : "Verificar y entrar"}
              </Button>
              <button
                type="button"
                onClick={resetFlow}
                className="text-center text-sm text-gray-500 hover:underline"
              >
                Usar otro correo
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-gray-600">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="font-medium text-primary-700 hover:underline">
              Regístrate
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}