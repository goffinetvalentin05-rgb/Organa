"use client";

import { useRouter } from "next/navigation";

export default function InscriptionPage() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/tableau-de-bord");
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-3xl font-bold">Créer un compte</h1>

        <p className="mt-2 text-sm text-white/70">
          Créez votre entreprise sur Organa. Votre espace sera vide au départ.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="text"
            placeholder="Nom de l’entreprise"
            className="w-full rounded-lg bg-black border border-white/20 px-4 py-2"
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-lg bg-black border border-white/20 px-4 py-2"
          />

          <input
            type="password"
            placeholder="Mot de passe"
            className="w-full rounded-lg bg-black border border-white/20 px-4 py-2"
          />

          <button
            type="submit"
            className="w-full rounded-lg bg-white text-black py-2 font-medium"
          >
            Créer mon compte
          </button>
        </form>

        <p className="mt-6 text-sm text-white/70">
          Déjà un compte ?{" "}
          <a href="/connexion" className="underline text-white">
            Se connecter
          </a>
        </p>
      </div>
    </main>
  );
}
