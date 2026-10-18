"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { clearSession, loadSession } from "@/lib/auth";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Card, CardContent, CardHeader } from "@/app/components/ui/Card";

interface Me {
  id: string;
  email: string;
  fullName: string;
  mfaRequired: boolean;
  mfaMethod: string | null;
}

interface Setup {
  secret: string;
  otpauthUri: string;
}

export default function AjustesPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [enableCode, setEnableCode] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = loadSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await api<Me>("/auth/me", { token: session.accessToken });
        if (!cancelled) setMe(data);
      } catch {
        clearSession();
        router.replace("/login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const generateQr = useCallback(async () => {
    const session = loadSession();
    if (!session) return;
    setError(null);
    setMessage(null);
    try {
      const data = await api<Setup>("/auth/mfa/setup", { token: session.accessToken });
      setSetup(data);
      const QRCode = (await import("qrcode")).default;
      const url = await QRCode.toDataURL(data.otpauthUri, { width: 220, margin: 1 });
      setQrDataUrl(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo generar el QR");
    }
  }, []);

  async function sendEnableEmailCode() {
    const session = loadSession();
    if (!session) return;
    setError(null);
    setMessage(null);
    try {
      await api<{ expiresInSeconds: number }>("/auth/mfa/enable/send-code", {
        method: "POST",
        token: session.accessToken,
      });
      setMessage("Código enviado a tu correo. Revísalo en la bandeja o en el log del backend.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo enviar el código");
    }
  }

  async function enableMfa(method: "TOTP" | "EMAIL") {
    const session = loadSession();
    if (!session || !enableCode) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await api<{ message: string }>("/auth/mfa/enable", {
        method: "POST",
        token: session.accessToken,
        body: JSON.stringify({ method, code: enableCode }),
      });
      const data = await api<Me>("/auth/me", { token: session.accessToken });
      setMe(data);
      setSetup(null);
      setQrDataUrl(null);
      setEnableCode("");
      setMessage("MFA activado correctamente.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo activar MFA");
    } finally {
      setLoading(false);
    }
  }

  async function disableMfa() {
    const session = loadSession();
    if (!session) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await api<{ message: string }>("/auth/mfa/disable", {
        method: "POST",
        token: session.accessToken,
        body: JSON.stringify({ password }),
      });
      const data = await api<Me>("/auth/me", { token: session.accessToken });
      setMe(data);
      setPassword("");
      setMessage("MFA desactivado.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo desactivar MFA");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Seguridad · MFA</h1>
        <p className="text-sm text-gray-500">
          {me ? `Cuenta de ${me.fullName} (${me.email})` : "Configura la verificación en dos pasos"}
        </p>
      </header>

      {error ? (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700" role="status">
          {message}
        </p>
      ) : null}

      {me?.mfaRequired ? (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Estado</h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-gray-700">
              La verificación en dos pasos está{" "}
              <span className="font-medium text-green-700">activada</span> con el método{" "}
              <span className="font-medium">
                {me.mfaMethod === "TOTP" ? "TOTP (app de autenticación)" : "correo electrónico"}.
              </span>
            </p>
            <p className="text-xs text-gray-500">
              En tu próximo inicio de sesión se te pedirá un código adicional.
            </p>
            <div className="mt-2 flex flex-col gap-3 rounded-md border border-gray-200 p-4">
              <p className="text-sm font-medium">Desactivar MFA</p>
              <Input
                label="Contraseña"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button variant="secondary" onClick={disableMfa} disabled={loading || !password}>
                {loading ? "Procesando…" : "Desactivar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <h2 className="font-semibold">App de autenticación (TOTP)</h2>
              <p className="mt-1 text-sm text-gray-500">
                Google Authenticator, Authy, Microsoft Authenticator, 1Password, entre otras.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {!setup ? (
                <Button onClick={generateQr}>Generar código QR</Button>
              ) : (
                <>
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrDataUrl}
                      alt="Código QR para configurar la app de autenticación"
                      className="h-56 w-56 self-center rounded-md border border-gray-200"
                    />
                  ) : null}
                  <p className="text-xs text-gray-500">
                    Escanea el QR con tu app o escribe la clave manualmente:
                  </p>
                  <p className="rounded-md bg-gray-100 p-2 font-mono text-xs break-all">{setup.secret}</p>
                  <Input
                    label="Código de 6 dígitos"
                    name="totp-code"
                    inputMode="numeric"
                    value={enableCode}
                    onChange={(e) => setEnableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                  <Button onClick={() => enableMfa("TOTP")} disabled={loading || enableCode.length !== 6}>
                    {loading ? "Activando…" : "Activar MFA"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setSetup(null);
                      setQrDataUrl(null);
                      setEnableCode("");
                    }}
                    className="text-center text-sm text-gray-500 hover:underline"
                  >
                    Cancelar
                  </button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold">Correo electrónico (OTP)</h2>
              <p className="mt-1 text-sm text-gray-500">
                Recibirás un código de 6 dígitos en tu correo cada vez que inicies sesión.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button variant="secondary" onClick={sendEnableEmailCode}>
                Enviar código de verificación al correo
              </Button>
              <Input
                label="Código recibido"
                name="email-code"
                inputMode="numeric"
                value={enableCode}
                onChange={(e) => setEnableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              <Button onClick={() => enableMfa("EMAIL")} disabled={loading || enableCode.length !== 6}>
                {loading ? "Activando…" : "Activar MFA"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}