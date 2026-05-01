"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

function MfaVerifyForm() {
  const router = useRouter();
  const search = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const next = search?.get("next") || "/tableau-de-bord";
  const mfaErr = search?.get("mfa_err");

  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const { data, error: lfErr } = await supabase.auth.mfa.listFactors();
        if (lfErr) {
          setError(lfErr.message);
          return;
        }
        const verifiedTotp = data?.totp?.find(
          (f: { status: string }) => f.status === "verified"
        );
        if (!verifiedTotp) {
          router.replace(
            `/tableau-de-bord/securite/mfa/configurer?next=${encodeURIComponent(next)}`
          );
          return;
        }
        setFactorId(verifiedTotp.id);
      } catch (e: unknown) {
        setError(
          e instanceof Error
            ? e.message
            : "Impossible de charger les facteurs MFA."
        );
      }
    })();
  }, [supabase]);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!factorId || code.length < 6) return;
    setLoading(true);
    setError(null);
    try {
      const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({
        factorId,
      });
      if (chErr || !ch) throw chErr || new Error("Challenge MFA échoué");
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: ch.id,
        code,
      });
      if (vErr) throw vErr;
      toast.success("Session sécurisée — double authentification validée.");
      router.replace(next);
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Code invalide ou expiré.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
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
          obligatoire. Saisissez votre code pour poursuivre.
        </p>
      </div>

      {mfaErr === "service" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Le contrôle MFA côté serveur a échoué. Réessayez, ou déconnectez-vous
          puis reconnectez-vous. Si le problème persiste, contactez le support.
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">
          Vérification de sécurité
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Entrez le code à 6 chiffres affiché par votre application
          d&apos;authentification.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-slate-700"
            >
              Code TOTP
            </label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="123456"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-lg tracking-widest"
            />
          </div>
          <button
            type="submit"
            disabled={loading || code.length < 6 || !factorId}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? "Vérification…" : "Valider"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/connexion" className="underline hover:text-slate-700">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function MfaVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md p-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
            <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      }
    >
      <MfaVerifyForm />
    </Suspense>
  );
}
