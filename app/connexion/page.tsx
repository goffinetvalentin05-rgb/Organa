"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export default function ConnexionPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Nettoyer l'erreur précédente
    setErrorMessage(null);

    // Validation
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
        // Ne pas throw, ne pas console.error pour éviter l'overlay Next.js
        const message =
          error.message && error.message.toLowerCase().includes("invalid login credentials")
            ? "Email ou mot de passe incorrect"
            : error.message || "Erreur lors de la connexion";
        setErrorMessage(message);
        return;
      }

      if (data.user) {
        console.log("[AUTH][Login] Connexion réussie", {
          id: data.user.id,
          email: data.user.email,
        });
        toast.success("Connexion réussie !");
        router.push("/tableau-de-bord");
        router.refresh();
      }
    } catch (error: any) {
      // Erreurs réseau ou inattendues uniquement
      setErrorMessage(error.message || "Erreur lors de la connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen text-white flex items-center justify-center px-6 relative overflow-hidden">
      {/* FOND - DÉGRADÉ BLEU NOIR */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: "linear-gradient(180deg, #0a0e2e 0%, #080b1f 40%, #050616 70%, #000000 100%)",
        }}
      ></div>
      
      {/* Overlay très léger pour la lisibilité du texte */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-black/20"></div>

      {/* Grille subtile en arrière-plan */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm relative z-10">
        <h1 className="text-3xl font-bold">Connexion</h1>

        <p className="mt-2 text-sm text-white/70">
          Connectez-vous pour accéder à votre espace Organa.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {errorMessage && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
              {errorMessage}
            </div>
          )}

          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-lg bg-black border border-white/20 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7C5CFF] disabled:opacity-50"
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={loading}
              className="w-full rounded-lg bg-black border border-white/20 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7C5CFF] disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white text-black py-2 font-medium hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-6 text-sm text-white/70">
          Pas de compte ?{" "}
          <a href="/inscription" className="underline text-white hover:text-white/80">
            Créer un compte
          </a>
        </p>
      </div>
    </main>
  );
}
