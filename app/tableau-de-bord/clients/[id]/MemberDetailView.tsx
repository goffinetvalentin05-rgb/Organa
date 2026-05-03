"use client";

import Link from "next/link";
import { ArrowLeft, Edit } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import CreatedByBadge from "@/components/CreatedByBadge";

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
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

interface MemberDetailViewProps {
  member: MemberDetailModel;
  canManageMembers: boolean;
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

export default function MemberDetailView({
  member,
  canManageMembers,
}: MemberDetailViewProps) {
  const { t, locale } = useI18n();
  const loc = locale === "en" ? "en-CH" : locale === "de" ? "de-CH" : "fr-CH";

  const addressLine = [member.adresse, [member.postal_code, member.city].filter(Boolean).join(" ").trim()]
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
              {member.nom?.trim() || t("dashboard.clients.memberDetail.missing")}
            </dd>
          </div>
          <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8">
            <dt className="text-sm font-medium text-slate-500">
              {t("dashboard.clients.memberDetail.email")}
            </dt>
            <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0 break-all">
              {member.email || t("dashboard.clients.memberDetail.missing")}
            </dd>
          </div>
          <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8">
            <dt className="text-sm font-medium text-slate-500">
              {t("dashboard.clients.memberDetail.phone")}
            </dt>
            <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0">
              {member.telephone || t("dashboard.clients.memberDetail.missing")}
            </dd>
          </div>
          <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8">
            <dt className="text-sm font-medium text-slate-500">
              {t("dashboard.clients.memberDetail.address")}
            </dt>
            <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0 break-words">
              {addressLine || t("dashboard.clients.memberDetail.missing")}
            </dd>
          </div>
          <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8">
            <dt className="text-sm font-medium text-slate-500">
              {t("dashboard.clients.memberDetail.role")}
            </dt>
            <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0">
              {t(`dashboard.clients.roles.${member.role}`) || member.role}
            </dd>
          </div>
          <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8">
            <dt className="text-sm font-medium text-slate-500">
              {t("dashboard.clients.memberDetail.category")}
            </dt>
            <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0">
              {member.category
                ? t(`dashboard.clients.categories.${member.category}`) || member.category
                : t("dashboard.clients.memberDetail.missing")}
            </dd>
          </div>
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
    </div>
  );
}
