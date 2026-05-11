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
      <div className="mx-auto max-w-2xl px-4 py-2 sm:px-6">
        <div className="rounded-2xl border border-white/20 bg-white/95 p-8 shadow-xl backdrop-blur-sm">
          <div className="h-7 w-72 max-w-full animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-4 max-w-md animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-2 sm:px-6 lg:py-0">
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

      <div className="overflow-hidden rounded-2xl border border-white/25 bg-white/95 shadow-xl backdrop-blur-sm">
        <div
          className="border-b border-slate-100 px-5 py-5 sm:px-8 sm:py-6"
          style={{ background: "linear-gradient(135deg, rgba(26,35,255,0.06) 0%, transparent 55%)" }}
        >
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Configurer la double authentification
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
            Pour protéger les données de votre club, la double authentification est obligatoire. Elle
            ajoute une sécurité supplémentaire lors de vos connexions.
          </p>
        </div>

        <div className="space-y-6 px-5 py-6 sm:px-8 sm:py-7">
          {mfaErr === "service" && (
            <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              Le service de vérification MFA est temporairement indisponible ou a renvoyé une erreur.
              Réessayez dans quelques instants. Si le problème persiste, déconnectez-vous puis
              reconnectez-vous.
            </div>
          )}

          <section className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 sm:px-5 sm:py-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Comment faire ?
            </h2>
            <ol className="mt-3 list-decimal space-y-3 pl-4 text-sm leading-relaxed text-slate-700 sm:text-[15px]">
              <li>
                Installez une application d&apos;authentification sur votre téléphone, par exemple :
                <ul className="mt-2 list-disc space-y-1 pl-4 text-slate-600">
                  <li>Google Authenticator</li>
                  <li>Microsoft Authenticator</li>
                  <li>2FAS</li>
                  <li>Authy</li>
                </ul>
              </li>
              <li>
                Ouvrez l&apos;application et scannez le QR code affiché ci-dessous.{" "}
                {!pendingFactor && (
                  <span className="text-slate-500">
                    (Utilisez d&apos;abord le bouton « Afficher le QR code » pour l&apos;afficher.)
                  </span>
                )}
              </li>
              <li>L&apos;application affichera un code à 6 chiffres.</li>
              <li>
                Entrez ce code dans le champ ci-dessous, puis cliquez sur « Valider et continuer ».
              </li>
            </ol>
          </section>

          {!pendingFactor && (
            <button
              type="button"
              onClick={startEnroll}
              disabled={enrolling}
              className="inline-flex w-full items-center justify-center rounded-xl px-4 py-3.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50 sm:text-base"
              style={{ backgroundColor: "var(--obillz-hero-blue)" }}
            >
              {enrolling ? "Préparation…" : "Afficher le QR code"}
            </button>
          )}

          {pendingFactor && (
            <div className="space-y-5 border-t border-slate-100 pt-6">
              <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pendingFactor.qr}
                  alt="QR code à scanner avec votre application d’authentification"
                  width={216}
                  height={216}
                  className="h-52 w-52 sm:h-56 sm:w-56"
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p className="font-medium text-slate-800">Secret (saisie manuelle)</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
                  Si vous ne pouvez pas scanner le QR code, copiez ce code dans votre application
                  d&apos;authentification.
                </p>
                <code className="mt-2 block break-all rounded-lg bg-white px-3 py-2 font-mono text-xs text-slate-900 ring-1 ring-slate-200/80 sm:text-sm">
                  {pendingFactor.secret}
                </code>
              </div>
              <div>
                <label htmlFor="totp-code" className="block text-sm font-medium text-slate-800">
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
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-lg font-medium tracking-[0.35em] text-slate-900 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--obillz-hero-blue)]"
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <button
                  type="button"
                  onClick={confirmEnroll}
                  disabled={verifying || verifyCode.length < 6}
                  className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50 sm:text-base"
                  style={{ backgroundColor: "var(--obillz-hero-blue)" }}
                >
                  {verifying ? "Vérification…" : "Valider et continuer"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingFactor(null);
                    setVerifyCode("");
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          <p className="border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
            <Link
              href="/connexion"
              className="font-medium underline decoration-slate-300 underline-offset-2 hover:text-slate-800"
            >
              Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ConfigurerMfaPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
          <div className="rounded-2xl border border-white/20 bg-white/95 p-8 shadow-xl backdrop-blur-sm">
            <div className="h-7 w-64 max-w-full animate-pulse rounded-lg bg-slate-200" />
          </div>
        </div>
      }
    >
      <ConfigurerMfaForm />
    </Suspense>
  );
}
