"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Clock, CreditCard, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import AuthPageLayout from "@/components/auth/AuthPageLayout";
import {
  AuthCard,
  AuthError,
  AuthField,
  AuthFooterLink,
  AuthInput,
  AuthPageMotion,
  AuthSubmitButton,
  AuthTrustPills,
} from "@/components/auth/AuthForm";
import { TRIAL_DURATION_DAYS } from "@/lib/billing/pricing";

export default function InscriptionPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.includes("@")) {
      toast.error("Veuillez entrer une adresse email valide");
      return;
    }

    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({ email, password });

      if (signUpError) {
        setErrorMessage(signUpError.message);
        toast.error(signUpError.message);
        setLoading(false);
        return;
      }

      setRegistrationComplete(true);
    } catch (err: unknown) {
      console.error("Erreur inscription:", err);
      const msg = err instanceof Error ? err.message : "Erreur lors de la création du compte";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout variant="signup">
      <AuthPageMotion>
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300/80">
            Inscription
          </p>
          <h1 className="mt-3 text-balance text-2xl font-black text-white md:text-3xl">
            {registrationComplete ? "Presque terminé" : "Commencez gratuitement"}
          </h1>
          <p className="mt-3 text-sm text-blue-100/75 md:text-base">
            {registrationComplete
              ? "Encore une étape pour activer votre compte"
              : "Créez votre espace club en quelques secondes"}
          </p>
          {!registrationComplete ? (
            <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-200 shadow-[0_0_20px_rgba(52,211,153,0.2)]">
              <Check className="h-3.5 w-3.5" aria-hidden />
              {TRIAL_DURATION_DAYS} jours d&apos;essai gratuit
            </span>
          ) : null}
        </div>

        <div className="mt-8">
          <AuthCard>
            {registrationComplete ? (
              <div className="text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1A23FF]/30 text-white shadow-[0_0_28px_rgba(26,35,255,0.45)] ring-1 ring-blue-400/35">
                  <Check className="h-7 w-7" strokeWidth={2.5} aria-hidden />
                </span>
                <h2 className="mt-6 text-xl font-bold text-white">Compte créé avec succès</h2>
                <p className="mt-4 text-sm leading-relaxed text-blue-100/75">
                  Un email de confirmation vient de vous être envoyé. Cliquez sur le lien reçu
                  pour activer votre compte.
                </p>
                <p className="mt-3 text-xs leading-relaxed text-blue-100/50">
                  Pensez à vérifier vos courriers indésirables — l&apos;email peut s&apos;y
                  trouver.
                </p>
                <Link
                  href="/connexion"
                  className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-white py-3.5 text-base font-bold text-[#1A23FF] shadow-[0_0_36px_rgba(26,35,255,0.55)] transition hover:shadow-[0_0_48px_rgba(26,35,255,0.7)]"
                >
                  Retour à la connexion
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <h2 className="text-lg font-bold text-white">Créer un compte</h2>
                  <p className="mt-1 text-sm text-blue-100/65">
                    Remplissez les informations ci-dessous
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                  {errorMessage ? <AuthError message={errorMessage} /> : null}

                  <AuthField id="email" label="Adresse email *">
                    <AuthInput
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      autoComplete="email"
                    />
                  </AuthField>

                  <AuthField id="password" label="Mot de passe *">
                    <AuthInput
                      id="password"
                      type="password"
                      placeholder="8 caractères minimum"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      autoComplete="new-password"
                    />
                  </AuthField>

                  <AuthField id="confirmPassword" label="Confirmer le mot de passe *">
                    <AuthInput
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      autoComplete="new-password"
                    />
                  </AuthField>

                  <AuthSubmitButton loading={loading} loadingLabel="Création en cours...">
                    Créer mon compte
                  </AuthSubmitButton>

                  <p className="text-center text-xs leading-relaxed text-blue-100/45">
                    En créant un compte, vous acceptez nos{" "}
                    <Link
                      href="/conditions-utilisation"
                      className="text-blue-100/70 underline-offset-2 hover:text-white hover:underline"
                    >
                      conditions d&apos;utilisation
                    </Link>{" "}
                    et notre{" "}
                    <Link
                      href="/politique-confidentialite"
                      className="text-blue-100/70 underline-offset-2 hover:text-white hover:underline"
                    >
                      politique de confidentialité
                    </Link>
                    .
                  </p>
                </form>

                <AuthFooterLink
                  prompt="Déjà un compte ?"
                  linkHref="/connexion"
                  linkLabel="Se connecter"
                />
              </>
            )}
          </AuthCard>

          {!registrationComplete ? (
            <AuthTrustPills
              items={[
                {
                  label: "Inscription en 2 min",
                  icon: <Clock className="h-4 w-4" aria-hidden />,
                },
                {
                  label: "Sans carte bancaire",
                  icon: <CreditCard className="h-4 w-4" aria-hidden />,
                },
                {
                  label: "Données sécurisées",
                  icon: <Shield className="h-4 w-4" aria-hidden />,
                },
              ]}
            />
          ) : null}

          <p className="mt-4 text-center sm:hidden">
            <Link href="/" className="text-xs text-blue-100/50 hover:text-white">
              ← Retour à l&apos;accueil
            </Link>
          </p>
        </div>
      </AuthPageMotion>
    </AuthPageLayout>
  );
}
