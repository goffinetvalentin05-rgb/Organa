"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
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

async function resolvePostLoginHome() {
  const res = await fetch("/api/auth/post-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ intendedProduct: "association" }),
  });
  if (!res.ok) return "/associations/espace";
  const data = (await res.json()) as { home?: string };
  return typeof data.home === "string" && data.home.startsWith("/")
    ? data.home
    : "/associations/espace";
}

export default function AssociationsConnexionPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;

    setErrorMessage(null);

    if (!email || !email.includes("@")) {
      toast.error("Veuillez entrer une adresse email valide");
      return;
    }

    if (!password || password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const message = error.message?.toLowerCase().includes("invalid login credentials")
          ? "Email ou mot de passe incorrect"
          : error.message || "Erreur de connexion";

        setErrorMessage(message);
        toast.error(message);
        return;
      }

      if (data.user) {
        await supabase.auth.getSession();
        toast.success("Connexion réussie");
        const home = await resolvePostLoginHome();
        await new Promise((resolve) => setTimeout(resolve, 100));
        window.location.href = home;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de connexion";
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
              title="Connexion Obillz Associations"
              subtitle="Accédez à l’espace dédié aux associations."
            />

            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage ? <AuthError message={errorMessage} /> : null}

              <AuthField id="email" label="Adresse email">
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

              <AuthField id="password" label="Mot de passe">
                <AuthInput
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                />
              </AuthField>

              <AuthSubmitButton loading={loading} loadingLabel="Connexion…">
                Se connecter
              </AuthSubmitButton>
            </form>

            <AuthFooterLink
              prompt="Pas encore de compte ?"
              linkHref="/associations/inscription"
              linkLabel="Créer un compte Associations"
            />

            <p className="mt-4 text-center text-xs text-blue-100/45">
              Vous cherchez Obillz Sport ?{" "}
              <Link
                href="/connexion"
                className="text-blue-100/70 underline-offset-2 hover:text-white hover:underline"
              >
                Connexion Sport
              </Link>
            </p>
          </AuthCard>
        </div>
      </AuthPageMotion>
    </AuthPageLayout>
  );
}
