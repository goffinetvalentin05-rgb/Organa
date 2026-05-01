"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

function ConfigurerMfaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/tableau-de-bord";
  const mfaErr = searchParams.get("mfa_err");

  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [alreadyVerified, setAlreadyVerified] = useState(false);

  const [enrolling, setEnrolling] = useState(false);
  const [pendingFactor, setPendingFactor] = useState<{
    id: string;
    qr: string;
    secret: string;
    uri: string;
  } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const { data: aal } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal?.currentLevel === "aal2") {
          setAlreadyVerified(true);
          return;
        }
        const { data: factors, error } = await supabase.auth.mfa.listFactors();
        if (error) throw error;
        const hasTotp = (factors?.totp ?? []).some(
          (f: { status: string }) => f.status === "verified"
        );
        if (hasTotp) {
          router.replace(
            `/tableau-de-bord/securite/mfa/verifier?next=${encodeURIComponent(nextPath)}`
          );
          return;
        }
      } catch {
        // ignoré — le flux principal affiche les erreurs à l’action
      } finally {
        setLoading(false);
      }
    })();
  }, [supabase, nextPath, router]);

  useEffect(() => {
    if (alreadyVerified) {
      router.replace(nextPath);
      router.refresh();
    }
  }, [alreadyVerified, nextPath, router]);

  async function startEnroll() {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Obillz-TOTP-${new Date().toISOString().slice(0, 10)}`,
      });
      if (error) throw error;
      if (!data) throw new Error("Réponse vide du serveur MFA");
      setPendingFactor({
        id: data.id,
        qr: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      });
      setVerifyCode("");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Impossible de préparer l’authentificateur. Réessayez.";
      toast.error(msg);
    } finally {
      setEnrolling(false);
    }
  }

  async function confirmEnroll() {
    if (!pendingFactor || verifyCode.length < 6) return;
    setVerifying(true);
    try {
      const { data: challenge, error: chErr } =
        await supabase.auth.mfa.challenge({
          factorId: pendingFactor.id,
        });
      if (chErr || !challenge) throw chErr || new Error("Challenge MFA échoué");

      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: pendingFactor.id,
        challengeId: challenge.id,
        code: verifyCode,
      });
      if (vErr) throw vErr;

      toast.success("Double authentification activée.");
      setPendingFactor(null);
      setVerifyCode("");
      router.replace(nextPath);
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Code invalide ou expiré.";
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  }

  if (loading || alreadyVerified) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="h-6 w-56 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div className="flex justify-center lg:hidden">
        <Image
          src="/logo-obillz.png"
          alt="Obillz"
          width={140}
          height={40}
          className="h-9 w-auto object-contain"
          priority
        />
      </div>

      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
        <p className="font-medium">
          Pour protéger les données du club, la double authentification est
          obligatoire.
        </p>
      </div>

      {mfaErr === "service" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Le service de vérification MFA est temporairement indisponible ou a
          renvoyé une erreur. Réessayez dans quelques instants. Si le problème
          persiste, déconnectez-vous puis reconnectez-vous.
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">
          Configurer la double authentification
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Scannez le QR code avec une application comme Google Authenticator,
          Authy ou 1Password, puis saisissez le code à 6 chiffres pour valider.
        </p>

        {!pendingFactor && (
          <button
            type="button"
            onClick={startEnroll}
            disabled={enrolling}
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {enrolling ? "Préparation…" : "Afficher le QR code"}
          </button>
        )}

        {pendingFactor && (
          <div className="mt-6 space-y-4">
            <div className="flex justify-center rounded-lg border border-slate-200 bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pendingFactor.qr}
                alt="QR code TOTP"
                width={200}
                height={200}
                className="h-48 w-48"
              />
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <div>Si vous ne pouvez pas scanner, saisissez ce secret :</div>
              <code className="mt-1 block break-all font-mono text-slate-800">
                {pendingFactor.secret}
              </code>
            </div>
            <div>
              <label
                htmlFor="totp-code"
                className="block text-sm font-medium text-slate-700"
              >
                Code à 6 chiffres
              </label>
              <input
                id="totp-code"
                value={verifyCode}
                onChange={(e) =>
                  setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tracking-widest"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={confirmEnroll}
                disabled={verifying || verifyCode.length < 6}
                className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {verifying ? "Vérification…" : "Valider et continuer"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingFactor(null);
                  setVerifyCode("");
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-slate-500">
          <Link href="/connexion" className="underline hover:text-slate-700">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ConfigurerMfaPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg p-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="h-6 w-56 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      }
    >
      <ConfigurerMfaForm />
    </Suspense>
  );
}
