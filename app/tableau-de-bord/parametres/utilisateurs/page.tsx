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

export default function UtilisateursPage() {
  const myPerms = usePermissions();
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(buildEmptyForm());
  const [editing, setEditing] = useState<{ id: string; member: MemberDTO } | null>(
    null
  );

  const canManage = myPerms.has("manage_users");

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await fetch("/api/club/members", { cache: "no-store" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setMembers((data.members ?? []) as MemberDTO[]);
    } catch (e: any) {
      console.error("[utilisateurs] fetch KO:", e);
      toast.error(e?.message ?? "Erreur de chargement");
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (!myPerms.loading && canManage) {
      fetchMembers();
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

      toast.success(editing ? "Accès mis à jour" : "Accès créé");
      cancelForm();
      await fetchMembers();
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
      await fetchMembers();
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
      await fetchMembers();
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
          <h1 className="text-2xl font-bold text-white">Utilisateurs / Accès</h1>
          <p className="mt-1 text-sm text-white/70">
            Donnez à chaque personne de votre club les droits qu'elle doit
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
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-100"
          >
            + Ajouter une personne
          </button>
        )}
      </header>

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
        ℹ️ Phase 1 : la personne doit déjà avoir un compte Obillz pour pouvoir
        être ajoutée. Le système d'invitation par email arrive bientôt.
      </div>
    </div>
  );
}
