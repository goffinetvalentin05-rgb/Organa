"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import AssociationsAuthShell from "@/components/associations/AssociationsAuthShell";

async function resolveAssociationsHome(): Promise<
  | { ok: true; home: string }
  | { ok: false; code: string; message: string }
> {
  const res = await fetch("/api/auth/post-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ intendedProduct: "association" }),
  });
  const data = (await res.json().catch(() => null)) as {
    home?: string;
    code?: string;
    error?: string;
  } | null;

  if (!res.ok) {
    return {
      ok: false,
      code: data?.code || "ERROR",
      message:
        data?.error ||
        "Aucun espace Obillz Associations n’est associé à ce compte.",
    };
  }

  if (typeof data?.home === "string" && data.home.startsWith("/associations/")) {
    return { ok: true, home: data.home };
  }

  return {
    ok: false,
    code: "NO_PRODUCT_ORG",
    message:
      "Aucun espace Obillz Associations n’est associé à ce compte.",
  };
}

export default function AssociationsConnexionPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [wrongProduct, setWrongProduct] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;

    setErrorMessage(null);
    setWrongProduct(false);

    if (!email.includes("@")) {
      toast.error("Veuillez entrer une adresse email valide");
      return;
    }
    if (password.length < 8) {
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
        const message = error.message
          ?.toLowerCase()
          .includes("invalid login credentials")
          ? "Email ou mot de passe incorrect"
          : error.message || "Erreur de connexion";
        setErrorMessage(message);
        toast.error(message);
        return;
      }

      if (!data.user) return;

      await supabase.auth.getSession();
      const dest = await resolveAssociationsHome();

      if (!dest.ok) {
        setWrongProduct(dest.code === "NO_PRODUCT_ORG");
        setErrorMessage(dest.message);
        toast.error(dest.message);
        await supabase.auth.signOut();
        return;
      }

      toast.success("Connexion réussie");
      await new Promise((r) => setTimeout(r, 80));
      window.location.href = dest.home;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de connexion";
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
      <div className="w-full max-w-[480px]">
        <div className="rounded-[1.75rem] border border-[#17211d]/10 bg-white/85 p-7 shadow-[0_24px_60px_rgba(23,33,29,0.08)] backdrop-blur-md sm:p-9">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b84e3a]">
            Obillz Associations
          </p>
          <h1 className="mt-3 text-[1.75rem] font-extrabold tracking-[-0.04em] text-[#17211d] sm:text-[2rem]">
            Bon retour sur Obillz Associations
          </h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-[#65716b]">
            Connectez-vous à l’espace de votre association
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {errorMessage ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {errorMessage}
              </div>
            ) : null}

            {wrongProduct ? (
              <div className="space-y-2 rounded-2xl border border-[#17211d]/10 bg-[#f4f0e7] px-4 py-3 text-sm text-[#17211d]">
                <p className="font-semibold">Que souhaitez-vous faire ?</p>
                <ul className="space-y-1.5 text-[#65716b]">
                  <li>
                    <Link
                      href="/associations/inscription"
                      className="font-bold text-[#ed7059] underline-offset-2 hover:underline"
                    >
                      Créer un compte Associations
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/associations"
                      className="font-bold text-[#17211d] underline-offset-2 hover:underline"
                    >
                      Retour à la landing Associations
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/connexion"
                      className="font-medium text-[#65716b] underline-offset-2 hover:underline"
                    >
                      Aller à la connexion Obillz Sport
                    </Link>
                  </li>
                </ul>
              </div>
            ) : null}

            <div>
              <label htmlFor="email" className="text-sm font-bold text-[#17211d]">
                Adresse email
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
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-[#65716b]">
            Pas encore de compte ?{" "}
            <Link
              href="/associations/inscription"
              className="font-extrabold text-[#ed7059] underline-offset-2 hover:underline"
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </AssociationsAuthShell>
  );
}
