"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";

/* ----- Grid d'arrière-plan (hero bleu) ----- */
function GridBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-30"
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
      }}
    />
  );
}

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
        await new Promise(resolve => setTimeout(resolve, 100));
        window.location.href = "/tableau-de-bord";
      }
    } catch (err: any) {
      const msg = err?.message || "Erreur lors de la connexion";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-md"
        style={{ backgroundColor: "var(--obillz-hero-blue)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 md:px-6">
          <Link
            href="/"
            className="relative flex items-center transition-opacity hover:opacity-90"
            aria-label="Obillz - Accueil"
          >
            <Image
              src="/logo-obillz.png"
              alt="Obillz"
              width={140}
              height={40}
              className="h-9 w-auto object-contain object-left md:h-10"
              priority
            />
          </Link>

          <Link
            href="/inscription"
            className="rounded-full border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            Créer un compte
          </Link>
        </div>
      </nav>

      {/* Hero Section avec formulaire */}
      <section
        className="relative min-h-screen overflow-hidden px-4 pt-20 md:px-6"
        style={{ backgroundColor: "var(--obillz-hero-blue)" }}
      >
        <GridBackground />

        <div className="relative z-20 mx-auto flex max-w-6xl flex-col items-center justify-center py-16 md:py-24">
          {/* Titre */}
          <h1 className="max-w-2xl text-center text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl">
            Bon retour sur Obillz
          </h1>
          <p className="mt-4 max-w-lg text-center text-sm leading-relaxed text-white/80 md:text-base">
            Connectez-vous pour accéder à votre espace de gestion
          </p>

          {/* Carte de connexion */}
          <div className="mt-10 w-full max-w-md">
            <div className="rounded-3xl border border-white/20 bg-white p-8 shadow-2xl md:p-10">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900">Connexion</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Entrez vos identifiants pour continuer
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                {errorMessage && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    Adresse email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--obillz-hero-blue)] focus:border-transparent transition-all disabled:opacity-50"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                    Mot de passe
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--obillz-hero-blue)] focus:border-transparent transition-all disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl py-3.5 text-base font-semibold text-white transition-all duration-300 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  style={{ backgroundColor: "var(--obillz-hero-blue)" }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Connexion en cours...
                    </span>
                  ) : (
                    "Se connecter"
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-center text-sm text-slate-600">
                  Pas encore de compte ?{" "}
                  <Link
                    href="/inscription"
                    className="font-semibold transition-colors hover:underline"
                    style={{ color: "var(--obillz-hero-blue)" }}
                  >
                    Créer un compte gratuitement
                  </Link>
                </p>
              </div>
            </div>

            {/* Badge de confiance */}
            <div className="mt-6 flex items-center justify-center gap-2 text-white/70">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm">Connexion sécurisée SSL</span>
            </div>
          </div>
        </div>

        {/* Courbe de transition */}
        <div className="absolute bottom-0 left-0 right-0 z-10 h-20 w-full" aria-hidden>
          <svg
            className="h-full w-full"
            viewBox="0 0 1440 80"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M0 80 L0 40 Q400 0 720 20 Q1040 40 1440 30 L1440 80 Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* Footer minimaliste */}
      <footer className="bg-white px-4 py-6 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-sm text-slate-500 sm:flex-row sm:justify-between">
          <p>© 2024 Obillz — Gestion simplifiée pour les clubs</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/mentions-legales" className="hover:text-slate-700 transition-colors">
              Mentions légales
            </Link>
            <Link href="/politique-confidentialite" className="hover:text-slate-700 transition-colors">
              Confidentialité
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
