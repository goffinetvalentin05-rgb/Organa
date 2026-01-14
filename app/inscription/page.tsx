"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export default function InscriptionPage() {
  const router = useRouter();

  const [nomEntreprise, setNomEntreprise] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomEntreprise.trim()) {
      toast.error("Le nom de l'entreprise est obligatoire");
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
        alert(error.message);
        setLoading(false);
        return;
      }
      
      if (!data.user) {
        alert("Utilisateur non créé");
        setLoading(false);
        return;
      }
      

      // 2️⃣ Créer l'organisation (alignée avec la DB)
      const { error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: nomEntreprise.trim(),
          email: data.user.email,
          owner_id: data.user.id,
        });

        if (orgError) {
          alert(orgError.message);
          setLoading(false);
          return;
        }
        

      toast.success("Compte créé avec succès 🎉");
      router.push("/tableau-de-bord");
      router.refresh();
    } catch (err: any) {
      console.error("Erreur inscription:", err);
      toast.error(err.message || "Erreur lors de la création du compte");
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
        <h1 className="text-3xl font-bold">Créer un compte</h1>

        <p className="mt-2 text-sm text-white/70">
          Créez votre entreprise sur Organa. Votre espace sera vide au départ.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="text"
            placeholder="Nom de l'entreprise *"
            value={nomEntreprise}
            onChange={(e) => setNomEntreprise(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg bg-black border border-white/20 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
          />

          <input
            type="email"
            placeholder="Email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg bg-black border border-white/20 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
          />

          <input
            type="password"
            placeholder="Mot de passe (min. 8 caractères) *"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg bg-black border border-white/20 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
          />

          <input
            type="password"
            placeholder="Confirmer le mot de passe *"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg bg-black border border-white/20 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white text-black py-2 font-medium hover:bg-white/90 transition disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-6 text-sm text-white/70">
          Déjà un compte ?{" "}
          <a href="/connexion" className="underline hover:text-white">
            Se connecter
          </a>
        </p>
      </div>
    </main>
  );
}
