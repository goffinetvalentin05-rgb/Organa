import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/rbac";
import { getMfaStatus } from "@/lib/auth/mfa";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SecuritePage() {
  const ctx = await requireAuthContext();
  const supabase = await createClient();

  // L'utilisateur peut être membre de plusieurs clubs ; on prend le current.
  const current = ctx.current;

  const mfaStatus = await getMfaStatus();

  // Compter les membres du club
  const memberCounts: Record<string, number> = {};
  if (current) {
    const { count: total } = await supabase
      .from("club_memberships")
      .select("*", { count: "exact", head: true })
      .eq("club_id", current.clubId)
      .is("deleted_at", null);
    memberCounts.total = total || 0;
  }

  // Derniers logs d'audit (30 derniers)
  const { data: recentLogs } = current
    ? await supabase
        .from("audit_logs")
        .select("id, action, resource_type, outcome, created_at, actor_email")
        .eq("club_id", current.clubId)
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: null };

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold text-white drop-shadow-sm">Sécurité du compte</h1>
        <p className="mt-1 text-sm text-white/80">
          Authentification à deux facteurs, gestion des accès et journal d&apos;audit.
        </p>
      </div>

      {/* Carte 1 : MFA */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Double authentification (TOTP)
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Ajoute une deuxième couche de protection à votre compte.
            </p>
          </div>
          <div>
            {mfaStatus.hasVerifiedTotp ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                Activée
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                Non activée
              </span>
            )}
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-600">
          Pour protéger les données du club, la double authentification est
          obligatoire pour tout accès au tableau de bord.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/tableau-de-bord/securite/mfa"
            className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Gérer la 2FA
          </Link>
        </div>
      </section>

      {/* Carte 2 : Membres et rôles */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Comptes du club
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {memberCounts.total ?? 0} compte(s) actif(s). Votre rôle :{" "}
          <strong>{current?.role ?? "—"}</strong>.
        </p>
        <div className="mt-3 grid gap-2 text-xs text-slate-500">
          <div>
            <strong className="text-slate-700">owner</strong> — propriétaire,
            droits complets
          </div>
          <div>
            <strong className="text-slate-700">admin</strong> — gestion complète
            (sauf actions critiques de propriété)
          </div>
          <div>
            <strong className="text-slate-700">committee</strong> — saisie
            opérationnelle (factures, dépenses, planning)
          </div>
          <div>
            <strong className="text-slate-700">member</strong> — lecture seule
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          La gestion des invitations et changements de rôle sera disponible
          dans une page dédiée prochainement.
        </p>
      </section>

      {/* Carte 3 : Audit logs */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Journal d'audit (20 dernières actions)
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Toutes les actions sensibles du club sont tracées. Cette table est
          append-only : aucune modification ni suppression possible.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Action</th>
                <th className="py-2 pr-3">Ressource</th>
                <th className="py-2 pr-3">Acteur</th>
                <th className="py-2 pr-3">Résultat</th>
              </tr>
            </thead>
            <tbody>
              {(recentLogs ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    Aucune entrée pour le moment.
                  </td>
                </tr>
              )}
              {(recentLogs ?? []).map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="py-2 pr-3 text-xs text-slate-500">
                    {new Date(log.created_at).toLocaleString("fr-CH")}
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs text-slate-700">
                    {log.action}
                  </td>
                  <td className="py-2 pr-3 text-slate-600">
                    {log.resource_type ?? "—"}
                  </td>
                  <td className="py-2 pr-3 text-slate-600">
                    {log.actor_email ?? "—"}
                  </td>
                  <td className="py-2 pr-3">
                    <span
                      className={
                        log.outcome === "success"
                          ? "text-green-700"
                          : log.outcome === "denied"
                          ? "text-amber-700"
                          : "text-red-700"
                      }
                    >
                      {log.outcome}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
