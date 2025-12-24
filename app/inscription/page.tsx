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

    // Validation
    if (!nomEntreprise || nomEntreprise.trim().length === 0) {
      toast.error("Le nom de l'entreprise est obligatoire");
      return;
    }

    if (!email || !email.includes("@")) {
      toast.error("Veuillez entrer une adresse email valide");
      return;
    }

    if (!password || password.length < 8) {
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

      // Créer l'utilisateur
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Erreur lors de la création du compte");
      }

      console.log("[AUTH][Signup] Compte créé avec succès", {
        id: authData.user.id,
        email: authData.user.email,
      });

      // Créer l'organisation pour cet utilisateur
      const { error: orgError } = await supabase
        .from("organizations")
        .insert({
          user_id: authData.user.id,
          nom_entreprise: nomEntreprise.trim(),
          email: email,
        });

      if (orgError) {
        // Si l'organisation n'a pas pu être créée, supprimer l'utilisateur
        await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {});
        throw orgError;
      }

      toast.success("Compte créé avec succès !");
      router.push("/tableau-de-bord");
      router.refresh();
    } catch (error: any) {
      console.error("Erreur d'inscription:", error);
      toast.error(error.message || "Erreur lors de la création du compte");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
        <h1 className="text-3xl font-bold">Créer un compte</h1>

        <p className="mt-2 text-sm text-white/70">
          Créez votre entreprise sur Organa. Votre espace sera vide au départ.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <input
              type="text"
              placeholder="Nom de l'entreprise *"
              value={nomEntreprise}
              onChange={(e) => setNomEntreprise(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-lg bg-black border border-white/20 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7C5CFF] disabled:opacity-50"
            />
          </div>

          <div>
            <input
              type="email"
              placeholder="Email *"
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
              placeholder="Mot de passe (min. 8 caractères) *"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={loading}
              className="w-full rounded-lg bg-black border border-white/20 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7C5CFF] disabled:opacity-50"
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Confirmer le mot de passe *"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-6 text-sm text-white/70">
          Déjà un compte ?{" "}
          <a href="/connexion" className="underline text-white hover:text-white/80">
            Se connecter
          </a>
        </p>
      </div>
    </main>
  );
}
