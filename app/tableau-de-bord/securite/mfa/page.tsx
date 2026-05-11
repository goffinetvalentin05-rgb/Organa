"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

interface FactorInfo {
  id: string;
  status: "verified" | "unverified";
  factor_type: string;
  friendly_name: string | null;
  created_at: string;
}

export default function MfaPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [factors, setFactors] = useState<FactorInfo[]>([]);

  // Enrôlement
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
    void loadFactors();
  }, []);

  async function loadFactors() {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const all = data?.all ?? [];
      setFactors(
        all.map((f) => ({
          id: f.id,
          status: f.status as "verified" | "unverified",
          factor_type: f.factor_type,
          friendly_name: f.friendly_name ?? null,
          created_at: f.created_at,
        }))
      );
    } catch (err: any) {
      toast.error(err?.message || "Erreur chargement facteurs MFA");
    } finally {
      setLoading(false);
    }
  }

  async function startEnroll() {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `TOTP-${new Date().toISOString().slice(0, 10)}`,
      });
      if (error) throw error;
      if (!data) throw new Error("Réponse vide");
      setPendingFactor({
        id: data.id,
        qr: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      });
      setVerifyCode("");
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'enrôlement");
    } finally {
      setEnrolling(false);
    }
  }

  async function confirmEnroll() {
    if (!pendingFactor || verifyCode.length < 6) return;
    setVerifying(true);
    try {
      // Étape 1 : challenge
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({
        factorId: pendingFactor.id,
      });
      if (chErr || !challenge) throw chErr || new Error("Challenge échoué");

      // Étape 2 : verify
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: pendingFactor.id,
        challengeId: challenge.id,
        code: verifyCode,
      });
      if (vErr) throw vErr;

      toast.success("2FA activée !");
      setPendingFactor(null);
      setVerifyCode("");
      await loadFactors();
    } catch (err: any) {
      toast.error(err?.message || "Code invalide");
    } finally {
      setVerifying(false);
    }
  }

  async function unenroll(factorId: string) {
    if (!confirm("Voulez-vous vraiment désactiver ce facteur ?")) return;
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      toast.success("Facteur désactivé");
      await loadFactors();
    } catch (err: any) {
      toast.error(err?.message || "Erreur de désactivation");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <Link
          href="/tableau-de-bord/securite"
          className="text-sm text-white/70 hover:text-white hover:underline"
        >
          ← Retour Sécurité
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-white drop-shadow-sm">
          Double authentification (TOTP)
        </h1>
        <p className="mt-1 text-sm text-white/80">
          Utilisez une application comme Google Authenticator, Authy ou 1Password
          pour générer des codes à 6 chiffres.
        </p>
      </div>

      {/* Liste des facteurs */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Facteurs enrôlés
        </h2>
        {loading ? (
          <p className="mt-3 text-sm text-slate-500">Chargement…</p>
        ) : factors.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Aucun facteur. Enrôlez votre premier ci-dessous.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {factors.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 p-3 text-sm"
              >
                <div>
                  <div className="font-medium text-slate-800">
                    {f.friendly_name || f.factor_type}
                  </div>
                  <div className="text-xs text-slate-500">
                    Statut :{" "}
                    <span
                      className={
                        f.status === "verified"
                          ? "text-green-700"
                          : "text-amber-700"
                      }
                    >
                      {f.status}
                    </span>{" "}
                    · Créé le {new Date(f.created_at).toLocaleDateString("fr-CH")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => unenroll(f.id)}
                  className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
                >
                  Désactiver
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Enrôlement */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          {pendingFactor ? "Validation" : "Ajouter un facteur TOTP"}
        </h2>

        {!pendingFactor && (
          <button
            type="button"
            onClick={startEnroll}
            disabled={enrolling}
            className="mt-3 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {enrolling ? "Préparation…" : "Démarrer l'enrôlement"}
          </button>
        )}

        {pendingFactor && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-slate-600">
              Scannez ce QR code avec votre application d'authentification.
            </p>
            <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-4">
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
              <div>
                Si vous ne pouvez pas scanner, saisissez le secret manuellement :
              </div>
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
                placeholder="123456"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tracking-widest"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={confirmEnroll}
                disabled={verifying || verifyCode.length < 6}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {verifying ? "Vérification…" : "Valider"}
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
      </section>
    </div>
  );
}
