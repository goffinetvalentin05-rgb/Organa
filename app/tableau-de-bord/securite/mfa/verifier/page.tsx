"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

export default function MfaVerifyPage() {
  const router = useRouter();
  const search = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const next = search?.get("next") || "/tableau-de-bord";

  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data, error: lfErr } = await supabase.auth.mfa.listFactors();
      if (lfErr) {
        setError(lfErr.message);
        return;
      }
      const verifiedTotp = data?.totp?.find((f) => f.status === "verified");
      if (!verifiedTotp) {
        setError("Aucun facteur TOTP vérifié. Activez la 2FA d'abord.");
        return;
      }
      setFactorId(verifiedTotp.id);
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
      if (chErr || !ch) throw chErr || new Error("Challenge échoué");
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: ch.id,
        code,
      });
      if (vErr) throw vErr;
      toast.success("Authentification renforcée OK");
      router.replace(next);
      router.refresh();
    } catch (err: any) {
      const msg = err?.message || "Code invalide";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">
          Vérification de sécurité
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Saisissez le code à 6 chiffres généré par votre application
          d'authentification.
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
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
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
      </div>
    </div>
  );
}
