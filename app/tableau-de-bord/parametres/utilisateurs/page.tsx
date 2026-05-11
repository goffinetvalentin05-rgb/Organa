"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ALL_PERMISSIONS,
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  emptyPermissionMap,
  fullPermissionMap,
  suggestedDefaultPermissions,
  type Permission,
} from "@/lib/auth/permissions-shared";
import { usePermissions } from "@/lib/auth/permissions-client";

interface MemberDTO {
  id: string;
  userId: string | null;
  email: string | null;
  name: string | null;
  functionTitle: string | null;
  role: "owner" | "admin" | "committee" | "member";
  status: "invited" | "active" | "disabled";
  permissions: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

interface InvitationDTO {
  id: string;
  email: string;
  name: string | null;
  functionTitle: string | null;
  role: "owner" | "admin" | "committee" | "member";
  status: "pending" | "accepted" | "cancelled" | "expired";
  expiresAt: string;
  createdAt: string;
  lastSentAt: string | null;
  sendCount: number;
  invitationUrl?: string;
}

interface FormState {
  name: string;
  email: string;
  functionTitle: string;
  role: "member" | "committee" | "admin";
  permissions: Record<Permission, boolean>;
}

const ROLE_LABELS: Record<MemberDTO["role"], string> = {
  owner: "Propriétaire",
  admin: "Co-administrateur",
  committee: "Comité",
  member: "Membre",
};

const STATUS_LABELS: Record<MemberDTO["status"], string> = {
  invited: "Invité",
  active: "Actif",
  disabled: "Désactivé",
};

const STATUS_BADGE_CLASSES: Record<MemberDTO["status"], string> = {
  invited: "bg-amber-100 text-amber-700",
  active: "bg-emerald-100 text-emerald-700",
  disabled: "bg-slate-200 text-slate-600",
};

function buildEmptyForm(): FormState {
  return {
    name: "",
    email: "",
    functionTitle: "",
    role: "member",
    permissions: suggestedDefaultPermissions(),
  };
}

interface EmailStatus {
  canSend: boolean;
  mode: "custom" | "obillz" | null;
  reason: "ok" | "no_global_key" | "custom_disabled" | "custom_invalid";
  globalConfigured: boolean;
  custom: {
    enabled: boolean;
    hasKey: boolean;
    hasSender: boolean;
    validSender: boolean;
  };
}

interface PendingInvite {
  email: string;
  url: string;
  emailOk: boolean;
  reason?: string;
}

export default function UtilisateursPage() {
  const myPerms = usePermissions();
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [invitations, setInvitations] = useState<InvitationDTO[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(buildEmptyForm());
  const [editing, setEditing] = useState<{ id: string; member: MemberDTO } | null>(
    null
  );
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
  const [lastInvite, setLastInvite] = useState<PendingInvite | null>(null);

  const canManage = myPerms.has("manage_users");

  const fetchAll = async () => {
    setLoadingMembers(true);
    try {
      const [resM, resI, resE] = await Promise.all([
        fetch("/api/club/members", { cache: "no-store" }),
        fetch("/api/club/invitations", { cache: "no-store" }),
        fetch("/api/club/email-status", { cache: "no-store" }),
      ]);
      if (!resM.ok) {
        const j = await resM.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${resM.status}`);
      }
      const dataM = await resM.json();
      setMembers((dataM.members ?? []) as MemberDTO[]);

      if (resI.ok) {
        const dataI = await resI.json();
        setInvitations((dataI.invitations ?? []) as InvitationDTO[]);
      }
      if (resE.ok) {
        const dataE = await resE.json();
        setEmailStatus(dataE as EmailStatus);
      }
    } catch (e: any) {
      console.error("[utilisateurs] fetch KO:", e);
      toast.error(e?.message ?? "Erreur de chargement");
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (!myPerms.loading && canManage) {
      fetchAll();
    } else if (!myPerms.loading) {
      setLoadingMembers(false);
    }
  }, [myPerms.loading, canManage]);

  // ============================================
  // Helpers UI
  // ============================================
  const togglePermission = (perm: Permission, value: boolean) => {
    setForm((f) => ({ ...f, permissions: { ...f.permissions, [perm]: value } }));
  };

  const setAllPermissions = (value: boolean) => {
    setForm((f) => ({
      ...f,
      permissions: value ? fullPermissionMap() : emptyPermissionMap(),
    }));
  };

  const startEdit = (m: MemberDTO) => {
    if (m.role === "owner") {
      toast.error("Le propriétaire ne peut pas être modifié");
      return;
    }
    const perms = emptyPermissionMap();
    for (const p of ALL_PERMISSIONS) {
      perms[p] = m.permissions?.[p] === true;
    }
    setEditing({ id: m.id, member: m });
    setForm({
      name: m.name ?? "",
      email: m.email ?? "",
      functionTitle: m.functionTitle ?? "",
      role: m.role as FormState["role"],
      permissions: perms,
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(buildEmptyForm());
  };

  // ============================================
  // Submit (create / update)
  // ============================================
  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Nom requis");
      return;
    }
    if (!editing && !form.email.trim()) {
      toast.error("Email requis");
      return;
    }

    setCreating(true);
    try {
      let res: Response;
      if (editing) {
        res = await fetch(`/api/club/members/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            functionTitle: form.functionTitle.trim(),
            role: form.role,
            permissions: form.permissions,
          }),
        });
      } else {
        res = await fetch("/api/club/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            functionTitle: form.functionTitle.trim(),
            role: form.role,
            permissions: form.permissions,
          }),
        });
      }

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }

      // En création (pas en édition), la réponse peut être :
      //  - { member: ... } si l'email correspondait à un compte existant
      //  - { invitation: ..., email: { ok, ... } } si on a créé une invitation
      if (!editing) {
        const data = await res.json().catch(() => ({}));
        if (data?.invitation) {
          const url = data.invitation.invitationUrl as string | undefined;
          if (data.email?.ok) {
            toast.success(`Invitation envoyée à ${data.invitation.email}`);
            setLastInvite(null);
          } else if (url) {
            try {
              await navigator.clipboard.writeText(url);
              toast(
                "Invitation créée. Email non envoyé : lien copié dans le presse-papier."
              );
            } catch {
              toast(
                "Invitation créée. Email non envoyé : copiez le lien depuis l'encadré ci-dessous."
              );
            }
            setLastInvite({
              email: data.invitation.email,
              url,
              emailOk: false,
              reason: data.email?.reason,
            });
          } else {
            toast.success("Invitation créée.");
            setLastInvite(null);
          }
        } else {
          toast.success("Accès créé");
          setLastInvite(null);
        }
      } else {
        toast.success("Accès mis à jour");
      }

      cancelForm();
      await fetchAll();
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (m: MemberDTO) => {
    const next = m.status === "active" ? "disabled" : "active";
    try {
      const res = await fetch(`/api/club/members/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      toast.success(next === "active" ? "Accès réactivé" : "Accès désactivé");
      await fetchAll();
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    }
  };

  const removeMember = async (m: MemberDTO) => {
    if (!confirm(`Supprimer l'accès de ${m.name ?? m.email} ?`)) return;
    try {
      const res = await fetch(`/api/club/members/${m.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      toast.success("Accès supprimé");
      await fetchAll();
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    }
  };

  // ============================================
  // Actions sur les invitations
  // ============================================
  const resendInvitation = async (inv: InvitationDTO) => {
    try {
      const res = await fetch(
        `/api/club/invitations/${inv.id}?action=resend`,
        { method: "POST" }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      const data = await res.json().catch(() => ({}));
      if (data.email?.ok) {
        toast.success(`Email renvoyé à ${inv.email}`);
        setLastInvite(null);
      } else if (data.invitationUrl) {
        try {
          await navigator.clipboard.writeText(data.invitationUrl);
          toast("Lien copié (l'envoi email a échoué)");
        } catch {
          toast("Lien généré (copie manuelle nécessaire)");
        }
        setLastInvite({
          email: inv.email,
          url: data.invitationUrl,
          emailOk: false,
          reason: data.email?.reason,
        });
      } else {
        toast.success("Invitation relancée");
      }
      await fetchAll();
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    }
  };

  const cancelInvitation = async (inv: InvitationDTO) => {
    if (!confirm(`Annuler l'invitation de ${inv.email} ?`)) return;
    try {
      const res = await fetch(`/api/club/invitations/${inv.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      toast.success("Invitation annulée");
      await fetchAll();
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    }
  };

  const copyInvitationLink = async (inv: InvitationDTO) => {
    // L'API GET ne renvoie pas le token complet (sécurité). On relance
    // l'invitation pour récupérer l'URL.
    try {
      const res = await fetch(
        `/api/club/invitations/${inv.id}?action=resend`,
        { method: "POST" }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.invitationUrl) {
        await navigator.clipboard.writeText(data.invitationUrl);
        toast.success("Lien d'invitation copié (un email a aussi été renvoyé)");
      }
      await fetchAll();
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    }
  };

  // ============================================
  // Renders conditionnels
  // ============================================
  if (myPerms.loading) {
    return (
      <div className="text-white/80 text-sm">Chargement des permissions...</div>
    );
  }

  if (!canManage) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800">
          Utilisateurs / Accès
        </h1>
        <p className="mt-3 text-slate-600">
          Vous n'avez pas la permission <code>manage_users</code>. Demandez au
          propriétaire de votre club de vous donner cet accès.
        </p>
        <Link
          href="/tableau-de-bord/parametres"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          ← Retour aux paramètres
        </Link>
      </div>
    );
  }

  // ============================================
  // Render principal
  // ============================================
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white drop-shadow-sm">Utilisateurs / Accès</h1>
          <p className="mt-1 text-sm text-white/80">
            Donnez à chaque personne de votre club les droits qu&apos;elle doit
            avoir : caissier, secrétaire, comité, entraîneur, etc.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setEditing(null);
              setForm(buildEmptyForm());
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-900/25 transition hover:opacity-95"
          >
            + Ajouter une personne
          </button>
        )}
      </header>

      {emailStatus && !emailStatus.canSend && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-800 font-bold"
            >
              !
            </span>
            <div className="flex-1 space-y-2 text-sm text-amber-900">
              <p className="font-semibold">
                L'envoi d'emails d'invitation n'est pas actif pour ce club.
              </p>
              {emailStatus.reason === "no_global_key" && (
                <p>
                  Aucun service d'envoi n'est configuré (ni Resend personnalisé
                  côté club, ni clé Resend globale Obillz). Vous pouvez créer
                  des invitations, mais le lien devra être transmis
                  manuellement (copier/coller).
                </p>
              )}
              {emailStatus.reason === "custom_invalid" && (
                <p>
                  Votre configuration Resend personnalisée semble incomplète
                  (clé API ou adresse expéditeur manquante / invalide).
                  Corrigez-la dans{" "}
                  <Link
                    href="/tableau-de-bord/parametres"
                    className="underline font-semibold"
                  >
                    Paramètres → Email expéditeur
                  </Link>
                  , ou désactivez l'envoi personnalisé pour utiliser Obillz par
                  défaut.
                </p>
              )}
              <p className="text-xs text-amber-800">
                Pour activer l'envoi automatique d'emails : ajoutez{" "}
                <code className="rounded bg-amber-100 px-1">RESEND_API_KEY</code>{" "}
                et{" "}
                <code className="rounded bg-amber-100 px-1">
                  RESEND_FROM_EMAIL
                </code>{" "}
                dans le fichier{" "}
                <code className="rounded bg-amber-100 px-1">.env.local</code>{" "}
                puis redémarrez le serveur, ou configurez Resend côté club.
              </p>
            </div>
          </div>
        </div>
      )}

      {lastInvite && !lastInvite.emailOk && (
        <div className="rounded-2xl border border-blue-300 bg-blue-50 p-5">
          <div className="flex flex-col gap-3">
            <div>
              <p className="font-semibold text-blue-900">
                Lien d'invitation à transmettre manuellement
              </p>
              <p className="mt-1 text-sm text-blue-800">
                L'email n'a pas pu être envoyé à{" "}
                <strong>{lastInvite.email}</strong>. Copiez le lien ci-dessous
                et envoyez-le à la personne par le moyen de votre choix
                (WhatsApp, SMS, email perso…).
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                readOnly
                value={lastInvite.url}
                className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs text-slate-700 font-mono"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(lastInvite.url);
                    toast.success("Lien copié");
                  } catch {
                    toast.error("Impossible de copier — sélectionnez le lien.");
                  }
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Copier
              </button>
              <button
                type="button"
                onClick={() => setLastInvite(null)}
                className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={submitForm}
          className="rounded-2xl bg-white p-6 shadow-sm space-y-5"
        >
          <h2 className="text-lg font-semibold text-slate-800">
            {editing ? "Modifier l'accès" : "Nouvel accès"}
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Nom</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="ex. Jean Dupont"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
                placeholder="ex. jean@club.ch"
                required={!editing}
                disabled={!!editing}
              />
              {editing && (
                <p className="mt-1 text-xs text-slate-500">
                  L'email ne peut pas être modifié après création.
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Fonction (libre)
              </label>
              <input
                type="text"
                value={form.functionTitle}
                onChange={(e) =>
                  setForm((f) => ({ ...f, functionTitle: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="ex. Caissier, Secrétaire, Entraîneur..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Rôle</label>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    role: e.target.value as FormState["role"],
                  }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="member">Membre</option>
                <option value="committee">Comité</option>
                {myPerms.isOwner && (
                  <option value="admin">Co-administrateur</option>
                )}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Les co-administrateurs ont automatiquement toutes les
                permissions (équivalent d'un co-président).
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">
                Permissions
              </h3>
              {form.role !== "admin" && (
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setAllPermissions(true)}
                    className="rounded-md bg-slate-100 px-3 py-1 font-medium text-slate-600 hover:bg-slate-200"
                  >
                    Tout cocher
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllPermissions(false)}
                    className="rounded-md bg-slate-100 px-3 py-1 font-medium text-slate-600 hover:bg-slate-200"
                  >
                    Tout décocher
                  </button>
                </div>
              )}
            </div>

            {form.role === "admin" ? (
              <p className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                Un co-administrateur reçoit automatiquement{" "}
                <strong>toutes les permissions</strong>. Pour ajuster
                finement, choisissez le rôle « Membre » ou « Comité ».
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                {PERMISSION_GROUPS.map((group) => (
                  <fieldset
                    key={group.title}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <legend className="px-2 text-sm font-semibold text-slate-700">
                      {group.title}
                    </legend>
                    <div className="space-y-2">
                      {group.permissions.map((p) => (
                        <label
                          key={p}
                          className="flex items-center gap-2 text-sm text-slate-700"
                        >
                          <input
                            type="checkbox"
                            checked={form.permissions[p] === true}
                            onChange={(e) =>
                              togglePermission(p, e.target.checked)
                            }
                            className="h-4 w-4 rounded border-slate-300"
                          />
                          {PERMISSION_LABELS[p]}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={cancelForm}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {creating
                ? "Enregistrement..."
                : editing
                  ? "Enregistrer les modifications"
                  : "Créer l'accès"}
            </button>
          </div>
        </form>
      )}

      {/* Invitations en attente */}
      {invitations.filter((i) => i.status === "pending").length > 0 && (
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Invitations en attente
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Les personnes ci-dessous ont reçu un email d'invitation. Le lien
                expire automatiquement après 14 jours.
              </p>
            </div>
          </div>
          <ul className="divide-y divide-slate-100">
            {invitations
              .filter((i) => i.status === "pending")
              .map((inv) => {
                const expired = new Date(inv.expiresAt) < new Date();
                return (
                  <li
                    key={inv.id}
                    className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-800">
                          {inv.name ?? inv.email}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            expired
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {expired ? "Expirée" : "En attente"}
                        </span>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                          {ROLE_LABELS[inv.role]}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {inv.email}
                        {inv.functionTitle ? ` · ${inv.functionTitle}` : ""}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        Expire le{" "}
                        {new Date(inv.expiresAt).toLocaleDateString("fr-CH", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                        {inv.sendCount > 1
                          ? ` · ${inv.sendCount} envois`
                          : ""}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => resendInvitation(inv)}
                        className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
                      >
                        Renvoyer l'email
                      </button>
                      <button
                        onClick={() => copyInvitationLink(inv)}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
                      >
                        Copier le lien
                      </button>
                      <button
                        onClick={() => cancelInvitation(inv)}
                        className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
                      >
                        Annuler
                      </button>
                    </div>
                  </li>
                );
              })}
          </ul>
        </div>
      )}

      {/* Liste des membres */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Personnes du club
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {loadingMembers
              ? "Chargement..."
              : `${members.length} accès configurés.`}
          </p>
        </div>

        {loadingMembers ? (
          <div className="p-6 text-sm text-slate-500">Chargement...</div>
        ) : members.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            Aucun accès. Ajoutez votre première personne pour commencer.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-800">
                      {m.name ?? m.email ?? "—"}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[m.status]}`}
                    >
                      {STATUS_LABELS[m.status]}
                    </span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                      {ROLE_LABELS[m.role]}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {m.email}
                    {m.functionTitle ? ` · ${m.functionTitle}` : ""}
                  </div>
                </div>

                {m.role !== "owner" && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => startEdit(m)}
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => toggleStatus(m)}
                      className="rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-200"
                    >
                      {m.status === "active" ? "Désactiver" : "Réactiver"}
                    </button>
                    <button
                      onClick={() => removeMember(m)}
                      className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
                    >
                      Supprimer
                    </button>
                  </div>
                )}
                {m.role === "owner" && (
                  <span className="text-xs text-slate-400">
                    Compte propriétaire — non modifiable
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="text-xs text-white/50">
        Si la personne n'a pas encore de compte Obillz, elle recevra un email
        d'invitation. Le lien lui permet de créer son compte avec l'email
        invité, puis de rejoindre le club d'un clic.
      </div>
    </div>
  );
}
