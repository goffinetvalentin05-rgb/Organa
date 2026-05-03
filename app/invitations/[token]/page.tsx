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

const ROLE_LABELS: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Co-administrateur",
  committee: "Comité",
  member: "Membre",
};

const STATUS_MESSAGES: Record<InvitationPublic["status"], string> = {
  pending: "",
  accepted: "Cette invitation a déjà été acceptée.",
  cancelled: "Cette invitation a été annulée par le club.",
  expired: "Cette invitation a expiré. Demandez au club d'en générer une nouvelle.",
};

export default function AcceptInvitationPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const rawToken = params?.token;
  const token =
    typeof rawToken === "string" ? rawToken : Array.isArray(rawToken) ? rawToken[0] : "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationPublic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        // 1. Charge l'invitation publique
        const res = await fetch(
          `/api/invitations/${encodeURIComponent(token)}`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(j?.error || "Invitation introuvable");
          return;
        }
        const data = await res.json();
        setInvitation(data.invitation as InvitationPublic);

        // 2. Charge l'utilisateur courant (si connecté)
        const supabase = createClient();
        const { data: u } = await supabase.auth.getUser();
        if (u?.user?.email) {
          setUserEmail(u.user.email);
          setUserId(u.user.id);
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
  const emailMatches = !!userEmail && currentEmail === expectedEmail;
  const wrongEmail = !!userEmail && !emailMatches;

  const acceptInvitation = async () => {
    if (!invitation || invitation.status !== "pending") return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/invitations/${encodeURIComponent(token)}`,
        { method: "POST" }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      toast.success("Invitation acceptée ! Bienvenue dans le club.");
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
    setUserId(null);
    // Reste sur la page → l'utilisateur peut se reconnecter avec le bon email
    router.refresh();
  };

  // ============================================
  // Renders
  // ============================================
  if (loading) {
    return (
      <Shell>
        <div className="text-center text-slate-500">Chargement de l'invitation...</div>
      </Shell>
    );
  }

  if (error || !invitation) {
    return (
      <Shell>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Invitation introuvable</h1>
          <p className="text-slate-600">
            {error || "Le lien d'invitation est invalide ou a déjà été utilisé."}
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

  return (
    <Shell>
      <div className="space-y-5">
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

        {isPending && !userEmail && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Pour accepter cette invitation, connectez-vous ou créez un compte
              avec l'email <strong>{invitation.email}</strong>.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href={`/connexion?next=${encodeURIComponent(`/invitations/${token}`)}&email=${encodeURIComponent(invitation.email)}`}
                className="inline-flex flex-1 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Se connecter
              </Link>
              <Link
                href={`/inscription?next=${encodeURIComponent(`/invitations/${token}`)}&email=${encodeURIComponent(invitation.email)}`}
                className="inline-flex flex-1 items-center justify-center rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                Créer un compte
              </Link>
            </div>
          </div>
        )}

        {isPending && wrongEmail && (
          <div className="space-y-3">
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
              Vous êtes connecté avec <strong>{userEmail}</strong>, mais cette
              invitation est destinée à <strong>{invitation.email}</strong>.
              Veuillez vous déconnecter et vous reconnecter avec le bon email.
            </div>
            <button
              onClick={switchAccount}
              className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Se déconnecter
            </button>
          </div>
        )}

        {isPending && emailMatches && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Vous êtes connecté en tant que <strong>{userEmail}</strong>. Cliquez
              sur le bouton ci-dessous pour rejoindre {invitation.clubName}.
            </p>
            <button
              onClick={acceptInvitation}
              disabled={submitting}
              className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting
                ? "Acceptation..."
                : `Rejoindre ${invitation.clubName}`}
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
