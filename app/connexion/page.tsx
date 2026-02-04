"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export default function ConnexionPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Utiliser le client SSR qui gère correctement les cookies
  const supabase = useMemo(() => createClient(), []);

  const handleSubmit = async () => {
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
      console.log("[LOGIN] Tentative de connexion...");
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("[LOGIN] Erreur:", error);
        const message =
          error.message?.toLowerCase().includes("invalid login credentials")
            ? "Email ou mot de passe incorrect"
            : error.message || "Erreur lors de la connexion";

        setErrorMessage(message);
        toast.error(message);
        return;
      }

      if (data.user) {
        console.log("[LOGIN] Connexion réussie, user:", data.user.id);
        console.log("[LOGIN] Session:", data.session ? "présente" : "absente");
        
        // Vérifier que la session est bien persistée
        const { data: sessionCheck } = await supabase.auth.getSession();
        console.log("[LOGIN] Vérification session après login:", sessionCheck.session ? "OK" : "PROBLÈME");
        
        // Vérifier les cookies
        console.log("[LOGIN] Cookies:", document.cookie);
        
        toast.success("Connexion réussie !");
        
        // Petit délai pour s'assurer que les cookies sont bien écrits
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Redirection HARD (fiable à 100 %)
        window.location.href = "/tableau-de-bord";
      }
    } catch (err: any) {
      console.error("[LOGIN] Exception:", err);
      const msg = err?.message || "Erreur lors de la connexion";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen text-white flex items-center justify-center px-6 relative overflow-hidden">
      {/* FOND */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "linear-gradient(180deg, #0a0e2e 0%, #080b1f 40%, #050616 70%, #000000 100%)",
        }}
      />
      <div className="fixed inset-0 pointer-events-none z-0 bg-black/20" />
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm relative z-10">
        <h1 className="text-3xl font-bold">Connexion</h1>

        <p className="mt-2 text-sm text-white/70">
          Connectez-vous pour accéder à votre espace Organa.
        </p>

        <div className="mt-6 space-y-4">
          {errorMessage && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
              {errorMessage}
            </div>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg bg-black border border-white/20 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7C5CFF] disabled:opacity-50"
          />

          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg bg-black border border-white/20 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7C5CFF] disabled:opacity-50"
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-lg bg-white text-black py-2 font-medium hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </div>

        <p className="mt-6 text-sm text-white/70">
          Pas de compte ?{" "}
          <a
            href="/inscription"
            className="underline text-white hover:text-white/80"
          >
            Créer un compte
          </a>
        </p>
      </div>
    </main>
  );
}
