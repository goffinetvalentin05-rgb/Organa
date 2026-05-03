"use client";

import Link from "next/link";
import { ArrowLeft, Edit, ClipboardList } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { GlassCard, SectionCard, ActionButton } from "@/components/dashboard-ui";
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
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      <GlassCard
        padding="sm"
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <Link
          href="/tableau-de-bord/clients"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors hover:text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          {t("dashboard.clients.memberDetail.back")}
        </Link>
        {canManageMembers ? (
          <ActionButton
            href={`/tableau-de-bord/clients/${member.id}/edit`}
            className="inline-flex items-center justify-center gap-2"
          >
            <Edit className="h-4 w-4" />
            {t("dashboard.clients.memberDetail.editAction")}
          </ActionButton>
        ) : null}
      </GlassCard>

      <GlassCard padding="none" className="shadow-md shadow-slate-200/40">
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
      </GlassCard>

      <SectionCard
        icon={ClipboardList}
        title="Participations"
        description="Historique des plannings / événements (inscription interne, publique reconnue ou rattachement admin)."
        headerRight={
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Total</span>
            <span className="inline-flex min-w-[2.25rem] justify-center rounded-full bg-gradient-to-r from-[#2563EB] to-[#1d4ed8] px-2.5 py-1 text-sm font-semibold text-white shadow-sm shadow-blue-600/20">
              {planningParticipations.length}
            </span>
          </div>
        }
      >
        {planningParticipations.length === 0 ? (
          <p className="mx-auto max-w-md text-center text-sm leading-relaxed text-slate-600">
            Aucune participation enregistrée pour ce membre. Les inscriptions liées à un planning
            apparaîtront ici automatiquement.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100/90 bg-white/50">
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
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/tableau-de-bord/plannings/${p.planningId}`}
                      className="break-words font-medium text-[#2563EB] hover:text-[#1d4ed8] hover:underline"
                    >
                      {p.eventTitle}
                    </Link>
                    <p className="mt-1 text-sm text-slate-600">
                      {p.eventDate ? formatDateOnly(p.eventDate, loc) : "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
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
      </SectionCard>
    </div>
  );
}
