"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

interface InvitationPublic {
  id: string;
  clubId: string;
  email: string;
  name: string | null;
  functionTitle: string | null;
  role: string;
  status: "pending" | "accepted" | "cancelled" | "expired";
  expiresAt: string;
  clubName: string;
}

interface AccountStatus {
  email: string;
  status: string;
  isPending: boolean;
  accountExists: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Co-administrateur",
  committee: "Comité",
  member: "Membre",
};

const STATUS_MESSAGES: Record<InvitationPublic["status"], string> = {
  pending: "",
  accepted: "Cette invitation a déjà été acceptée. Connectez-vous directement.",
  cancelled: "Cette invitation a été annulée par le club.",
  expired:
    "Cette invitation a expiré. Demandez au club d'en générer une nouvelle.",
};

const PASSWORD_MIN_LENGTH = 8;

export default function AcceptInvitationPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const rawToken = params?.token;
  const token =
    typeof rawToken === "string"
      ? rawToken
      : Array.isArray(rawToken)
        ? rawToken[0]
        : "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationPublic | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Champs du formulaire
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        const [resInv, resStatus] = await Promise.all([
          fetch(`/api/invitations/${encodeURIComponent(token)}`, {
            cache: "no-store",
          }),
          fetch(
            `/api/invitations/${encodeURIComponent(token)}/account-status`,
            { cache: "no-store" }
          ),
        ]);

        if (!resInv.ok) {
          const j = await resInv.json().catch(() => ({}));
          setError(j?.error || "Invitation introuvable");
          return;
        }
        const data = await resInv.json();
        setInvitation(data.invitation as InvitationPublic);

        if (resStatus.ok) {
          const s = await resStatus.json();
          setAccountStatus(s as AccountStatus);
        }

        const supabase = createClient();
        const { data: u } = await supabase.auth.getUser();
        if (u?.user?.email) {
          setUserEmail(u.user.email);
        }
      } catch (e: any) {
        setError(e?.message ?? "Erreur");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const expectedEmail = invitation?.email?.toLowerCase() ?? "";
  const currentEmail = userEmail?.toLowerCase() ?? "";
  const alreadyLoggedAsRightUser =
    !!userEmail && currentEmail === expectedEmail;
  const alreadyLoggedAsWrongUser = !!userEmail && currentEmail !== expectedEmail;

  // ============================================
  // Helpers
  // ============================================
  const acceptOnly = async () => {
    const res = await fetch(`/api/invitations/${encodeURIComponent(token)}`, {
      method: "POST",
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.error || `HTTP ${res.status}`);
    }
  };

  const signInThenAccept = async (pwd: string) => {
    const supabase = createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: expectedEmail,
      password: pwd,
    });
    if (signInErr) {
      throw new Error(
        signInErr.message?.includes("Invalid login")
          ? "Mot de passe incorrect."
          : signInErr.message || "Erreur de connexion"
      );
    }
    await acceptOnly();
  };

  // ============================================
  // Submit : création de compte
  // ============================================
  const submitSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < PASSWORD_MIN_LENGTH) {
      toast.error(
        `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`
      );
      return;
    }
    if (password !== passwordConfirm) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/invitations/${encodeURIComponent(token)}/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        }
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data?.code === "ACCOUNT_EXISTS") {
          // Bascule automatique vers le mode connexion
          setAccountStatus((s) => (s ? { ...s, accountExists: true } : s));
          setPassword("");
          setPasswordConfirm("");
          toast(
            "Un compte existe déjà pour cette adresse. Connectez-vous avec votre mot de passe."
          );
          return;
        }
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      await signInThenAccept(password);
      toast.success(`Bienvenue dans ${invitation?.clubName ?? "le club"} !`);
      router.push("/tableau-de-bord");
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur lors de la création du compte");
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // Submit : connexion
  // ============================================
  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Mot de passe requis");
      return;
    }
    setSubmitting(true);
    try {
      await signInThenAccept(password);
      toast.success(`Bienvenue dans ${invitation?.clubName ?? "le club"} !`);
      router.push("/tableau-de-bord");
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // Submit : déjà connecté avec le bon email
  // ============================================
  const acceptWhenLogged = async () => {
    setSubmitting(true);
    try {
      await acceptOnly();
      toast.success(`Bienvenue dans ${invitation?.clubName ?? "le club"} !`);
      router.push("/tableau-de-bord");
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur lors de l'acceptation");
    } finally {
      setSubmitting(false);
    }
  };

  const switchAccount = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserEmail(null);
    router.refresh();
  };

  // ============================================
  // Renders
  // ============================================
  if (loading) {
    return (
      <Shell>
        <div className="text-center text-slate-500">
          Chargement de l'invitation...
        </div>
      </Shell>
    );
  }

  if (error || !invitation) {
    return (
      <Shell>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">
            Invitation introuvable
          </h1>
          <p className="text-slate-600">
            {error ||
              "Le lien d'invitation est invalide ou a déjà été utilisé."}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </Shell>
    );
  }

  const statusBlock = STATUS_MESSAGES[invitation.status];
  const isPending = invitation.status === "pending";
  const accountExists = accountStatus?.accountExists === true;

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
            Invitation
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {invitation.clubName}
          </h1>
          <p className="mt-1 text-slate-600">
            vous invite à rejoindre son espace Obillz.
          </p>
        </div>

        <dl className="rounded-xl bg-slate-50 p-4 text-sm space-y-2">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Email invité</dt>
            <dd className="font-medium text-slate-900">{invitation.email}</dd>
          </div>
          {invitation.name && (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Nom</dt>
              <dd className="font-medium text-slate-900">{invitation.name}</dd>
            </div>
          )}
          {invitation.functionTitle && (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Fonction</dt>
              <dd className="font-medium text-slate-900">
                {invitation.functionTitle}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Rôle</dt>
            <dd className="font-medium text-slate-900">
              {ROLE_LABELS[invitation.role] ?? invitation.role}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Lien valable jusqu'au</dt>
            <dd className="font-medium text-slate-900">
              {new Date(invitation.expiresAt).toLocaleDateString("fr-CH", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </dd>
          </div>
        </dl>

        {!isPending && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            {statusBlock}
          </div>
        )}

        {/* CAS 1 — Pas connecté + pas de compte existant : créer le compte */}
        {isPending && !userEmail && !accountExists && (
          <form onSubmit={submitSignup} className="space-y-4">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
              Bienvenue ! Pour rejoindre <strong>{invitation.clubName}</strong>,
              créez votre mot de passe ci-dessous. Votre compte sera créé
              automatiquement avec l'email <strong>{invitation.email}</strong>.
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Adresse email
              </label>
              <input
                type="email"
                value={invitation.email}
                disabled
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Choisissez un mot de passe
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={PASSWORD_MIN_LENGTH}
                required
                autoComplete="new-password"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder={`Au moins ${PASSWORD_MIN_LENGTH} caractères`}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Confirmer le mot de passe
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                minLength={PASSWORD_MIN_LENGTH}
                required
                autoComplete="new-password"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="h-3.5 w-3.5"
              />
              Afficher le mot de passe
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting
                ? "Création en cours..."
                : `Créer mon compte et rejoindre ${invitation.clubName}`}
            </button>
          </form>
        )}

        {/* CAS 2 — Pas connecté + compte existant : se connecter */}
        {isPending && !userEmail && accountExists && (
          <form onSubmit={submitLogin} className="space-y-4">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
              Vous avez déjà un compte Obillz avec cette adresse. Connectez-vous
              pour rejoindre <strong>{invitation.clubName}</strong>.
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Adresse email
              </label>
              <input
                type="email"
                value={invitation.email}
                disabled
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Mot de passe
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="h-3.5 w-3.5"
              />
              Afficher le mot de passe
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting
                ? "Connexion..."
                : `Se connecter et rejoindre ${invitation.clubName}`}
            </button>

            <p className="text-center text-xs text-slate-500">
              Mot de passe oublié ? Demandez au club de relancer une invitation
              ou contactez le support.
            </p>
          </form>
        )}

        {/* CAS 3 — Déjà connecté avec le bon email */}
        {isPending && alreadyLoggedAsRightUser && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Vous êtes connecté en tant que <strong>{userEmail}</strong>.
              Cliquez sur le bouton ci-dessous pour rejoindre{" "}
              {invitation.clubName}.
            </p>
            <button
              onClick={acceptWhenLogged}
              disabled={submitting}
              className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting
                ? "Acceptation..."
                : `Rejoindre ${invitation.clubName}`}
            </button>
          </div>
        )}

        {/* CAS 4 — Connecté mais avec le mauvais email */}
        {isPending && alreadyLoggedAsWrongUser && (
          <div className="space-y-3">
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
              Vous êtes connecté avec <strong>{userEmail}</strong>, mais cette
              invitation est destinée à <strong>{invitation.email}</strong>.
              Déconnectez-vous puis utilisez le mot de passe associé à{" "}
              {invitation.email}.
            </div>
            <button
              onClick={switchAccount}
              className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Se déconnecter
            </button>
          </div>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-obillz.png"
              alt="Obillz"
              width={120}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-xl px-4 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
          {children}
        </div>
      </main>
    </div>
  );
}
