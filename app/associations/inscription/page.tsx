"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import toast from "react-hot-toast";
import AuthPageLayout from "@/components/auth/AuthPageLayout";
import {
  AuthCard,
  AuthError,
  AuthField,
  AuthFooterLink,
  AuthFormHeader,
  AuthInput,
  AuthPageMotion,
  AuthSubmitButton,
} from "@/components/auth/AuthForm";

/**
 * Inscription Obillz Associations.
 * N'appelle pas signUp côté navigateur avec un product_type libre :
 * POST /api/associations/inscription fixe product=association côté serveur.
 */
export default function AssociationsInscriptionPage() {
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
      const res = await fetch("/api/associations/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!res.ok) {
        const msg = data?.error || "Erreur lors de la création du compte";
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }

      setRegistrationComplete(true);
    } catch (err: unknown) {
      console.error("Erreur inscription Associations:", err);
      const msg =
        err instanceof Error ? err.message : "Erreur lors de la création du compte";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      <AuthPageMotion>
        <div className="mx-auto w-full max-w-[560px]">
          <AuthCard>
            {registrationComplete ? (
              <div className="flex h-full flex-col justify-center text-center lg:text-left">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1A23FF]/30 text-white shadow-[0_0_28px_rgba(26,35,255,0.45)] ring-1 ring-blue-400/35 lg:mx-0">
                  <Check className="h-7 w-7" strokeWidth={2.5} aria-hidden />
                </span>
                <h2 className="mt-6 text-xl font-bold text-white sm:text-2xl">
                  Compte Associations créé
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-blue-100/75">
                  Un email de confirmation vient de vous être envoyé. Cliquez sur le lien reçu pour
                  activer votre compte Obillz Associations.
                </p>
                <p className="mt-3 text-xs leading-relaxed text-blue-100/50">
                  Pensez à vérifier vos courriers indésirables — l&apos;email peut s&apos;y trouver.
                </p>
                <Link
                  href="/associations/connexion"
                  className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#1A23FF] via-[#2563EB] to-[#1A23FF] bg-[length:160%_100%] py-3.5 text-base font-bold text-white shadow-[0_0_36px_rgba(26,35,255,0.45)] transition hover:shadow-[0_0_48px_rgba(26,35,255,0.65)]"
                >
                  Retour à la connexion
                </Link>
                <p className="mt-4 text-center text-xs text-blue-100/45">
                  <Link href="/associations" className="underline-offset-2 hover:text-white hover:underline">
                    Retour à Obillz Associations
                  </Link>
                </p>
              </div>
            ) : (
              <>
                <AuthFormHeader
                  badge={
                    <div className="relative inline-flex">
                      <span
                        className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.28),transparent_68%)] blur-xl"
                        aria-hidden
                      />
                      <Image
                        src="/logo-symbole.png"
                        alt="Symbole Obillz"
                        width={64}
                        height={64}
                        className="relative h-14 w-14 object-contain"
                        priority
                      />
                    </div>
                  }
                  title="Créer votre compte Obillz Associations"
                  subtitle="Inscription dédiée aux associations — distincte d'Obillz Sport."
                />

                <form onSubmit={handleSubmit} className="space-y-5">
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
                    Créer mon compte Associations
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
                  linkHref="/associations/connexion"
                  linkLabel="Se connecter"
                />

                <p className="mt-4 text-center text-xs text-blue-100/45">
                  Vous cherchez Obillz Sport ?{" "}
                  <Link
                    href="/inscription"
                    className="text-blue-100/70 underline-offset-2 hover:text-white hover:underline"
                  >
                    Inscription Sport
                  </Link>
                </p>
              </>
            )}
          </AuthCard>
        </div>
      </AuthPageMotion>
    </AuthPageLayout>
  );
}
