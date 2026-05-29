"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
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
} from "@/components/auth/AuthForm";

export default function ConnexionPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const message =
          error.message?.toLowerCase().includes("invalid login credentials")
            ? "Email ou mot de passe incorrect"
            : error.message || "Erreur lors de la connexion";

        setErrorMessage(message);
        toast.error(message);
        return;
      }

      if (data.user) {
        await supabase.auth.getSession();
        toast.success("Connexion réussie !");
        await new Promise((resolve) => setTimeout(resolve, 100));
        window.location.href = "/tableau-de-bord";
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erreur lors de la connexion";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout variant="login">
      <AuthPageMotion>
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300/80">
            Connexion
          </p>
          <h1 className="mt-3 text-balance text-2xl font-black text-white md:text-3xl">
            Bon retour sur Obillz
          </h1>
          <p className="mt-3 text-sm text-blue-100/75 md:text-base">
            Accédez à votre espace de gestion de club
          </p>
        </div>

        <div className="mt-8">
          <AuthCard>
            <div className="text-center">
              <h2 className="text-lg font-bold text-white">Identifiants</h2>
              <p className="mt-1 text-sm text-blue-100/65">
                Entrez votre email et votre mot de passe
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
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

              <AuthSubmitButton loading={loading} loadingLabel="Connexion en cours...">
                Se connecter
              </AuthSubmitButton>
            </form>

            <AuthFooterLink
              prompt="Pas encore de compte ?"
              linkHref="/inscription"
              linkLabel="Créer un compte gratuitement"
            />
          </AuthCard>

          <div className="mt-5 flex items-center justify-center gap-2 text-blue-100/55">
            <Shield className="h-4 w-4 shrink-0 text-blue-300/70" aria-hidden />
            <span className="text-xs">Connexion sécurisée · SSL</span>
          </div>

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
