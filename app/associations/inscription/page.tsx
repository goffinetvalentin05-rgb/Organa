"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import toast from "react-hot-toast";
import AssociationsAuthShell from "@/components/associations/AssociationsAuthShell";

export default function AssociationsInscriptionPage() {
  const [associationName, setAssociationName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!associationName.trim()) {
      toast.error("Indiquez le nom de votre association");
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Indiquez votre prénom et votre nom");
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
      const res = await fetch("/api/associations/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          associationName: associationName.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
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
      const msg =
        err instanceof Error ? err.message : "Erreur lors de la création du compte";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "mt-1.5 w-full rounded-2xl border border-[#17211d]/12 bg-white px-4 py-3 text-sm font-medium text-[#17211d] shadow-sm outline-none transition placeholder:text-[#9aa49e] focus:border-[#ed7059]/50 focus:ring-2 focus:ring-[#ed7059]/20";

  return (
    <AssociationsAuthShell>
      <div className="w-full max-w-[520px]">
        <div className="rounded-[1.75rem] border border-[#17211d]/10 bg-white/85 p-7 shadow-[0_24px_60px_rgba(23,33,29,0.08)] backdrop-blur-md sm:p-9">
          {registrationComplete ? (
            <div className="text-center sm:text-left">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ed7059]/15 text-[#ed7059] sm:mx-0">
                <Check className="h-7 w-7" strokeWidth={2.5} aria-hidden />
              </span>
              <h1 className="mt-5 text-[1.75rem] font-extrabold tracking-[-0.04em] text-[#17211d]">
                Compte créé avec succès
              </h1>
              <p className="mt-3 text-sm font-medium leading-relaxed text-[#65716b]">
                Un email de confirmation vient de vous être envoyé. Cliquez sur le lien
                reçu pour activer votre espace Obillz Associations.
              </p>
              <p className="mt-2 text-xs text-[#9aa49e]">
                Pensez à vérifier vos courriers indésirables.
              </p>
              <Link
                href="/associations/connexion"
                className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-[#ed7059] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(237,112,89,.27)] transition hover:-translate-y-0.5 hover:bg-[#d85e48]"
              >
                Aller à la connexion
              </Link>
            </div>
          ) : (
            <>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b84e3a]">
                Obillz Associations
              </p>
              <h1 className="mt-3 text-[1.75rem] font-extrabold tracking-[-0.04em] text-[#17211d] sm:text-[2rem]">
                Créer votre espace Obillz Associations
              </h1>
              <p className="mt-3 text-sm font-medium leading-relaxed text-[#65716b]">
                Centralisez la gestion de votre association en quelques minutes
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                {errorMessage ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {errorMessage}
                  </div>
                ) : null}

                <div>
                  <label htmlFor="associationName" className="text-sm font-bold text-[#17211d]">
                    Nom de l’association *
                  </label>
                  <input
                    id="associationName"
                    value={associationName}
                    onChange={(e) => setAssociationName(e.target.value)}
                    disabled={loading}
                    placeholder="Ex. Chorale du village"
                    className={inputClass}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="text-sm font-bold text-[#17211d]">
                      Prénom *
                    </label>
                    <input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="text-sm font-bold text-[#17211d]">
                      Nom *
                    </label>
                    <input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="text-sm font-bold text-[#17211d]">
                    Adresse email *
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    placeholder="votre@email.com"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="text-sm font-bold text-[#17211d]">
                    Mot de passe *
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    placeholder="8 caractères minimum"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="text-sm font-bold text-[#17211d]">
                    Confirmer le mot de passe *
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-[#ed7059] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(237,112,89,.27)] transition hover:-translate-y-0.5 hover:bg-[#d85e48] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? "Création en cours…" : "Créer mon espace"}
                </button>

                <p className="text-center text-xs leading-relaxed text-[#9aa49e]">
                  En créant un compte, vous acceptez nos{" "}
                  <Link
                    href="/conditions-utilisation"
                    className="underline-offset-2 hover:text-[#17211d] hover:underline"
                  >
                    conditions d’utilisation
                  </Link>{" "}
                  et notre{" "}
                  <Link
                    href="/politique-confidentialite"
                    className="underline-offset-2 hover:text-[#17211d] hover:underline"
                  >
                    politique de confidentialité
                  </Link>
                  .
                </p>
              </form>

              <p className="mt-7 text-center text-sm text-[#65716b]">
                Vous avez déjà un compte ?{" "}
                <Link
                  href="/associations/connexion"
                  className="font-extrabold text-[#ed7059] underline-offset-2 hover:underline"
                >
                  Se connecter
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </AssociationsAuthShell>
  );
}
