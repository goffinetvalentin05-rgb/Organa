"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function InscriptionPage() {
  const router = useRouter();

  const [nomEntreprise, setNomEntreprise] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nomEntreprise.trim()) {
      toast.error("Le nom de l'organisation est obligatoire");
      return;
    }

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

      // 1️⃣ Créer l'utilisateur
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setErrorMessage("Utilisateur non créé");
        toast.error("Utilisateur non créé");
        setLoading(false);
        return;
      }

      // 2️⃣ Créer l'organisation
      const { error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: nomEntreprise.trim(),
          email: data.user.email,
          owner_id: data.user.id,
        });

      if (orgError) {
        setErrorMessage(orgError.message);
        toast.error(orgError.message);
        setLoading(false);
        return;
      }

      toast.success("Compte créé avec succès ! 🎉");
      router.push("/tableau-de-bord");
      router.refresh();
    } catch (err: any) {
      console.error("Erreur inscription:", err);
      const msg = err.message || "Erreur lors de la création du compte";
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
            href="/connexion"
            className="rounded-full border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            Se connecter
          </Link>
        </div>
      </nav>

      {/* Hero Section avec formulaire */}
      <section
        className="relative min-h-screen overflow-hidden px-4 pt-20 md:px-6"
        style={{ backgroundColor: "var(--obillz-hero-blue)" }}
      >
        <GridBackground />

        <div className="relative z-20 mx-auto flex max-w-6xl flex-col items-center justify-center py-12 md:py-20">
          {/* Titre */}
          <h1 className="max-w-2xl text-center text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl">
            Commencez gratuitement
          </h1>
          <p className="mt-4 max-w-lg text-center text-sm leading-relaxed text-white/80 md:text-base">
            Créez votre compte en quelques secondes et découvrez Obillz
          </p>

          {/* Badge essai gratuit */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2">
            <svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium text-white">7 jours d'essai gratuit</span>
          </div>

          {/* Carte d'inscription */}
          <div className="mt-8 w-full max-w-md">
            <div className="rounded-3xl border border-white/20 bg-white p-8 shadow-2xl md:p-10">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900">Créer un compte</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Remplissez les informations ci-dessous
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                {errorMessage && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                )}

                <div>
                  <label htmlFor="nomEntreprise" className="block text-sm font-medium text-slate-700 mb-2">
                    Nom de l'organisation *
                  </label>
                  <input
                    id="nomEntreprise"
                    type="text"
                    placeholder="FC Mon Club"
                    value={nomEntreprise}
                    onChange={(e) => setNomEntreprise(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--obillz-hero-blue)] focus:border-transparent transition-all disabled:opacity-50"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    Adresse email *
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
                    Mot de passe *
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="8 caractères minimum"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--obillz-hero-blue)] focus:border-transparent transition-all disabled:opacity-50"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                    Confirmer le mot de passe *
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                      Création en cours...
                    </span>
                  ) : (
                    "Créer mon compte"
                  )}
                </button>

                <p className="text-xs text-center text-slate-500 leading-relaxed">
                  En créant un compte, vous acceptez nos{" "}
                  <Link href="/conditions-utilisation" className="underline hover:text-slate-700">
                    conditions d'utilisation
                  </Link>{" "}
                  et notre{" "}
                  <Link href="/politique-confidentialite" className="underline hover:text-slate-700">
                    politique de confidentialité
                  </Link>
                </p>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-center text-sm text-slate-600">
                  Déjà un compte ?{" "}
                  <Link
                    href="/connexion"
                    className="font-semibold transition-colors hover:underline"
                    style={{ color: "var(--obillz-hero-blue)" }}
                  >
                    Se connecter
                  </Link>
                </p>
              </div>
            </div>

            {/* Avantages */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="mt-2 text-xs text-white/80">Inscription en 2 min</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <span className="mt-2 text-xs text-white/80">Sans carte bancaire</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="mt-2 text-xs text-white/80">Données sécurisées</span>
              </div>
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
