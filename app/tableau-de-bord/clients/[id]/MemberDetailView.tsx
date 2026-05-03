"use client";

import Link from "next/link";
import { ArrowLeft, Edit } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import CreatedByBadge from "@/components/CreatedByBadge";
import type { MemberFieldsMerged } from "@/lib/member-fields/types";
import {
  participationStatusLabelFr,
  type MemberParticipationStatus,
} from "@/lib/planning/participationStatus";

export interface MemberPlanningParticipation {
  id: string;
  planningId: string;
  eventTitle: string;
  eventDate: string | null;
  participationStatus: MemberParticipationStatus;
  createdAt: string;
}

export interface MemberDetailModel {
  id: string;
  nom: string | null;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  postal_code: string | null;
  city: string | null;
  role: string;
  category: string | null;
  date_of_birth: string | null;
  /** Masqué ; null si champ désactivé ou vide */
  avs_masked: string | null;
  fieldVisibility: MemberFieldsMerged;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

interface MemberDetailViewProps {
  member: MemberDetailModel;
  canManageMembers: boolean;
  planningParticipations?: MemberPlanningParticipation[];
}

function formatDateTime(iso: string | null | undefined, locale: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function formatDateOnly(iso: string | null | undefined, locale: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function displayOrDash(v: string | null | undefined, tMissing: string) {
  if (v == null || String(v).trim() === "") return tMissing;
  return String(v);
}

export default function MemberDetailView({
  member,
  canManageMembers,
  planningParticipations = [],
}: MemberDetailViewProps) {
  const { t, locale } = useI18n();
  const loc = locale === "en" ? "en-CH" : locale === "de" ? "de-CH" : "fr-CH";
  const v = member.fieldVisibility;
  const missing = t("dashboard.clients.memberDetail.missing");

  const addressLine = [
    member.adresse,
    [member.postal_code, member.city].filter(Boolean).join(" ").trim(),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/tableau-de-bord/clients"
          className="inline-flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("dashboard.clients.memberDetail.back")}
        </Link>
        {canManageMembers && (
          <Link
            href={`/tableau-de-bord/clients/${member.id}/edit`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <Edit className="w-4 h-4" />
            {t("dashboard.clients.memberDetail.editAction")}
          </Link>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div
          className="px-6 py-8 sm:px-8 sm:py-10 text-white"
          style={{ backgroundColor: "var(--obillz-hero-blue)" }}
        >
          <p className="text-sm font-medium text-white/80 uppercase tracking-wide">
            {t("dashboard.clients.memberDetail.title")}
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold break-words">
            {member.prenom ? `${member.prenom} ` : ""}
            {member.nom?.trim() || t("dashboard.clients.noName")}
          </h1>
        </div>

        <dl className="divide-y divide-slate-100">
          {member.prenom ? (
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8">
              <dt className="text-sm font-medium text-slate-500">
                {t("dashboard.clients.memberDetail.firstName")}
              </dt>
              <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0 break-words">
                {member.prenom}
              </dd>
            </div>
          ) : null}
          <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8">
            <dt className="text-sm font-medium text-slate-500">
              {t("dashboard.clients.memberDetail.lastName")}
            </dt>
            <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0 break-words">
              {member.nom?.trim() || missing}
            </dd>
          </div>

          {v.email.enabled && (
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8">
              <dt className="text-sm font-medium text-slate-500">
                {t("dashboard.clients.memberDetail.email")}
              </dt>
              <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0 break-all">
                {displayOrDash(member.email, missing)}
              </dd>
            </div>
          )}

          {v.phone.enabled && (
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8">
              <dt className="text-sm font-medium text-slate-500">
                {t("dashboard.clients.memberDetail.phone")}
              </dt>
              <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0">
                {displayOrDash(member.telephone, missing)}
              </dd>
            </div>
          )}

          {v.address.enabled && (
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8">
              <dt className="text-sm font-medium text-slate-500">
                {t("dashboard.clients.memberDetail.address")}
              </dt>
              <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0 break-words">
                {addressLine || missing}
              </dd>
            </div>
          )}

          {v.birth_date.enabled && (
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8">
              <dt className="text-sm font-medium text-slate-500">
                {t("dashboard.clients.memberDetail.birthDate")}
              </dt>
              <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0">
                {member.date_of_birth
                  ? formatDateOnly(member.date_of_birth, loc)
                  : missing}
              </dd>
            </div>
          )}

          {v.role.enabled && (
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8">
              <dt className="text-sm font-medium text-slate-500">
                {t("dashboard.clients.memberDetail.role")}
              </dt>
              <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0">
                {t(`dashboard.clients.roles.${member.role}`) || member.role}
              </dd>
            </div>
          )}

          {v.category.enabled && (
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8">
              <dt className="text-sm font-medium text-slate-500">
                {t("dashboard.clients.memberDetail.category")}
              </dt>
              <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0">
                {member.category
                  ? t(`dashboard.clients.categories.${member.category}`) ||
                    member.category
                  : missing}
              </dd>
            </div>
          )}

          {v.avs_number.enabled && (
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8">
              <dt className="text-sm font-medium text-slate-500">
                {t("dashboard.clients.memberDetail.avsNumber")}
              </dt>
              <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0">
                <span className="font-mono tracking-wide">
                  {member.avs_masked || missing}
                </span>
                {member.avs_masked ? (
                  <span className="block text-xs text-slate-500 mt-1">
                    {t("dashboard.clients.memberDetail.avsMaskedHint")}
                  </span>
                ) : null}
              </dd>
            </div>
          )}

          <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8">
            <dt className="text-sm font-medium text-slate-500">
              {t("dashboard.clients.memberDetail.addedAt")}
            </dt>
            <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0">
              {formatDateTime(member.created_at, loc)}
            </dd>
          </div>
          <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8">
            <dt className="text-sm font-medium text-slate-500">
              {t("dashboard.clients.memberDetail.lastModified")}
            </dt>
            <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0">
              {formatDateTime(member.updated_at, loc)}
            </dd>
          </div>
        </dl>

        {(member.created_by || member.updated_by) && (
          <div className="px-6 py-5 sm:px-8 bg-slate-50 border-t border-slate-100">
            <CreatedByBadge
              createdBy={member.created_by}
              updatedBy={member.updated_by}
              createdAt={member.created_at}
              updatedAt={member.updated_at}
              createdLabel={t("dashboard.clients.memberDetail.auditCreatedBy")}
              updatedLabel={t("dashboard.clients.memberDetail.auditUpdatedBy")}
              showUpdated
              className="text-sm text-slate-600"
            />
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div
          className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
          style={{ background: "linear-gradient(135deg, rgba(124, 92, 255, 0.08) 0%, rgba(15, 23, 42, 0.03) 100%)" }}
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Participations</h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              Historique des plannings / événements (inscription interne, publique reconnue ou
              rattachement admin).
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Total</span>
            <span
              className="inline-flex min-w-[2.25rem] justify-center rounded-full px-2.5 py-1 text-sm font-semibold text-white shadow-sm"
              style={{ backgroundColor: "var(--obillz-hero-blue, #4f46e5)" }}
            >
              {planningParticipations.length}
            </span>
          </div>
        </div>

        {planningParticipations.length === 0 ? (
          <div className="px-5 sm:px-6 py-10 sm:py-12 text-center">
            <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              Aucune participation enregistrée pour ce membre. Les inscriptions liées à un planning
              apparaîtront ici automatiquement.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {planningParticipations.map((p) => {
              const status = p.participationStatus;
              const badgeClass =
                status === "present"
                  ? "bg-emerald-100 text-emerald-900"
                  : status === "absent"
                    ? "bg-slate-200 text-slate-800"
                    : status === "cancelled"
                      ? "bg-rose-100 text-rose-900"
                      : "bg-violet-100 text-violet-900";
              return (
                <li
                  key={p.id}
                  className="px-4 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/tableau-de-bord/plannings/${p.planningId}`}
                      className="font-medium text-violet-700 hover:text-violet-900 hover:underline break-words"
                    >
                      {p.eventTitle}
                    </Link>
                    <p className="text-sm text-slate-600 mt-1">
                      {p.eventDate ? formatDateOnly(p.eventDate, loc) : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}
                    >
                      {participationStatusLabelFr(status)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
