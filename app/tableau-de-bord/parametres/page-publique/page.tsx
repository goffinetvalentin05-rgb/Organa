"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { OBILLZ_BRAND_PRIMARY } from "@/lib/public-page/colors";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Loader,
  Globe,
  FileText,
  ShoppingBag,
  Calendar2,
  QrCode,
  Instagram,
  CheckCircle,
  Eye,
} from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import DraftAutosaveHint from "@/components/DraftAutosaveHint";
import MatchProgramSettings from "@/components/public-page/MatchProgramSettings";
import PublicLinksSettings, { linksToInputs } from "@/components/public-page/PublicLinksSettings";
import PremiumSwitch from "@/components/public-page/PremiumSwitch";
import {
  ppHintClass,
  ppInputClass,
  ppLabelClass,
  ppSecondaryButtonClass,
  ppToggleHintClass,
  ppToggleRowClass,
  ppToggleTitleClass,
} from "@/components/public-page/settings-styles";
import {
  PageLayout,
  PageHeader,
  SectionCard,
  cn,
  dashboardGlassCardClass,
  dashboardInfoPanelClass,
} from "@/components/ui";
import type { PublicPageLinkInput, PublicPageSettings } from "@/lib/public-page/types";
import { normalizePublicPageSlug } from "@/lib/public-page/slug";
import { useAutoDraft } from "@/hooks/useAutoDraft";
import { usePermissions } from "@/lib/auth/permissions-client";
import {
  publicPageDraftStore,
  toPublicPageDraftPayload,
  type PublicPageDraftData,
} from "@/lib/drafts/publicPageDraft";

function LogoPreview({
  logoUrl,
  title,
  primaryColor,
}: {
  logoUrl: string | null;
  title: string;
  primaryColor: string;
}) {
  const [imgError, setImgError] = useState(false);
  const showImage = Boolean(logoUrl) && !imgError;
  const initial = (title.trim().charAt(0) || "C").toUpperCase();
  const accent = primaryColor || OBILLZ_BRAND_PRIMARY;

  return (
    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {showImage && logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          fill
          className="object-contain p-2"
          sizes="80px"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="text-2xl font-bold" style={{ color: accent }}>
          {initial}
        </span>
      )}
    </div>
  );
}

export default function PublicPageSettingsPage() {
  const { t } = useI18n();
  const { clubId, loading: clubLoading } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState<PublicPageSettings | null>(null);
  const [links, setLinks] = useState<PublicPageLinkInput[]>([]);
  const [qrcodeOptions, setQrcodeOptions] = useState<
    { id: string; name: string; code: string; registrationPath: string }[]
  >([]);
  const [origin, setOrigin] = useState("");

  const draftData = useMemo(
    () =>
      form
        ? toPublicPageDraftPayload(form, links)
        : toPublicPageDraftPayload(
            {
              enabled: false,
              slug: null,
              title: "",
              description: "",
              primaryColor: "",
              logoUrl: null,
              instagramUrl: "",
              facebookUrl: "",
              websiteUrl: "",
              showBuvette: false,
              showMatchProgram: false,
              matchProgramType: null,
              matchProgramUrl: null,
              matchProgramPdfPath: null,
              matchProgramPdfName: null,
              matchProgramPdfUrl: null,
              showPublicLinks: false,
              publicUrlPath: null,
              buvetteSlug: null,
            },
            []
          ),
    [form, links]
  );

  const applyDraftData = useCallback((data: PublicPageDraftData) => {
    setForm((prev) =>
      prev
        ? { ...prev, ...data.form }
        : ({ ...data.form } as PublicPageSettings)
    );
    setLinks(data.links);
  }, []);

  const { clearDraft, showDraftStatus, draftStatusLabel } = useAutoDraft({
    store: publicPageDraftStore,
    clubId,
    clubLoading,
    data: draftData,
    enabled: !loading && form !== null,
    onRestore: applyDraftData,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/public-page", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur de chargement");
      setForm(data.settings);
      setLinks(linksToInputs(data.links || []));
      setQrcodeOptions(data.qrcodeOptions || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/public-page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: form.enabled,
          slug: form.slug,
          title: form.title,
          description: form.description,
          primaryColor: form.primaryColor,
          instagramUrl: form.instagramUrl,
          facebookUrl: form.facebookUrl,
          websiteUrl: form.websiteUrl,
          showBuvette: form.showBuvette,
          showMatchProgram: form.showMatchProgram,
          matchProgramType: form.matchProgramType,
          matchProgramUrl: form.matchProgramUrl,
          showPublicLinks: form.showPublicLinks,
          links: links.map((l, i) => ({ ...l, sortOrder: i })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur de sauvegarde");
      clearDraft();
      setForm(data.settings);
      setLinks(linksToInputs(data.links || []));
      setQrcodeOptions(data.qrcodeOptions || []);
      toast.success(t("dashboard.settings.publicPage.saveSuccess"));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const copyPublicLink = async () => {
    if (!form?.publicUrlPath) return;
    const url = `${window.location.origin}${form.publicUrlPath}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t("dashboard.settings.publicPage.linkCopied"));
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("dashboard.settings.publicPage.linkCopyError"));
    }
  };

  if (loading || !form) {
    return (
      <PageLayout maxWidth="5xl">
        <div className="flex items-center justify-center gap-3 py-20 text-[#64748B]">
          <Loader className="h-6 w-6 animate-spin" />
          <span className="text-sm">{t("dashboard.settings.publicPage.loading")}</span>
        </div>
      </PageLayout>
    );
  }

  const previewDisabled = !form.enabled || !form.slug;
  const publicUrl = form.publicUrlPath
    ? `${origin || ""}${form.publicUrlPath}`
    : null;

  return (
    <PageLayout maxWidth="5xl">
      <div>
        <Link
          href="/tableau-de-bord"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748B] transition-colors duration-250 hover:text-[#1A23FF]"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("dashboard.nav.dashboard")}
        </Link>
      </div>

      <PageHeader
        title={t("dashboard.settings.publicPage.title")}
        subtitle={t("dashboard.settings.publicPage.subtitle")}
      />

      <DraftAutosaveHint show={showDraftStatus} label={draftStatusLabel} />

      <SectionCard
        icon={Globe}
        title={t("dashboard.settings.publicPage.activationTitle")}
        description={t("dashboard.settings.publicPage.activationDescription")}
      >
        <div
          className={cn(
            ppToggleRowClass,
            form.enabled &&
              "border-[rgba(26,35,255,0.18)] bg-white shadow-[0_4px_16px_rgba(26,35,255,0.06)]",
          )}
        >
          <div className="min-w-0">
            <p className="text-base font-semibold tracking-tight text-[#0F172A]">
              {t("dashboard.settings.publicPage.enabledLabel")}
            </p>
            {!form.enabled ? (
              <p className={cn(ppToggleHintClass, "mt-1.5")}>
                {t("dashboard.settings.publicPage.pageDisabledHint")}
              </p>
            ) : null}
          </div>
          <PremiumSwitch
            checked={form.enabled}
            onChange={(enabled) => setForm({ ...form, enabled })}
            aria-label={t("dashboard.settings.publicPage.enabledLabel")}
          />
        </div>

        {form.enabled ? (
          <div className="mt-5 space-y-5">
            <div>
              <label className={ppLabelClass}>
                {t("dashboard.settings.publicPage.slugLabel")}
              </label>
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <span className="shrink-0 rounded-xl border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC] px-3.5 py-3 text-sm font-medium text-[#64748B]">
                  obillz.com/p/
                </span>
                <input
                  className={ppInputClass}
                  value={form.slug || ""}
                  onChange={(e) => {
                    const nextSlug = normalizePublicPageSlug(e.target.value) || null;
                    setForm({
                      ...form,
                      slug: nextSlug,
                      publicUrlPath:
                        form.enabled && nextSlug ? `/p/${nextSlug}` : null,
                    });
                  }}
                  placeholder="fc-mon-club"
                />
              </div>
              <p className={ppHintClass}>{t("dashboard.settings.publicPage.slugHint")}</p>
            </div>

            {form.publicUrlPath && publicUrl ? (
              <div
                className={cn(
                  dashboardInfoPanelClass,
                  "relative overflow-hidden p-4 transition-all duration-300 sm:p-5",
                  "before:pointer-events-none before:absolute before:-inset-px before:rounded-2xl",
                  "before:bg-[radial-gradient(ellipse_at_top_right,rgba(26,35,255,0.1),transparent_55%)]",
                )}
              >
                <div className="relative z-[1] flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                  <div className="flex min-w-0 flex-1 items-start gap-3.5 sm:items-center">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F57FF] via-[#1A23FF] to-[#151dd9] text-white shadow-[0_4px_12px_rgba(26,35,255,0.22)]"
                      aria-hidden
                    >
                      <ExternalLink className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">
                        {t("dashboard.settings.publicPage.publicLinkLabel")}
                      </p>
                      <p className="mt-1 break-all font-mono text-sm font-medium text-[#1A23FF] sm:truncate sm:break-normal">
                        {publicUrl}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => void copyPublicLink()}
                      className={cn(
                        ppSecondaryButtonClass,
                        copied &&
                          "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800",
                      )}
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 transition-transform duration-250" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copied
                        ? t("dashboard.settings.publicPage.copiedShort")
                        : t("dashboard.settings.publicPage.copyLink")}
                    </button>
                    {!previewDisabled ? (
                      <a
                        href={form.publicUrlPath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          ppSecondaryButtonClass,
                          "border-transparent bg-gradient-to-r from-[#2563EB] via-[#1A23FF] to-[#151dd9] text-white shadow-[0_4px_14px_rgba(26,35,255,0.22)] hover:border-transparent hover:bg-none hover:opacity-95 hover:text-white",
                        )}
                      >
                        <ExternalLink className="h-4 w-4" />
                        {t("dashboard.settings.publicPage.preview")}
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        icon={FileText}
        title={t("dashboard.settings.publicPage.contentTitle")}
        description={t("dashboard.settings.publicPage.contentDescription")}
      >
        <div className="space-y-5 sm:space-y-6">
          <div className="flex items-center gap-4 rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC] p-4 sm:gap-5 sm:p-5">
            <LogoPreview logoUrl={form.logoUrl} title={form.title} primaryColor={form.primaryColor} />
            <p className="text-sm leading-relaxed text-[#64748B] sm:text-[0.9375rem]">
              {t("dashboard.settings.publicPage.logoHint")}
            </p>
          </div>

          <div>
            <label className={ppLabelClass}>
              {t("dashboard.settings.publicPage.titleLabel")}
            </label>
            <input
              className={ppInputClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <label className={ppLabelClass}>
              {t("dashboard.settings.publicPage.descriptionLabel")}
            </label>
            <textarea
              className={cn(ppInputClass, "min-h-[104px] resize-y")}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
            />
          </div>

          <div>
            <label className={ppLabelClass}>
              {t("dashboard.settings.publicPage.colorLabel")}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                className="h-12 w-14 cursor-pointer rounded-xl border border-[rgba(15,23,42,0.12)] bg-white"
              />
              <input
                className={cn(ppInputClass, "flex-1 font-mono")}
                value={form.primaryColor}
                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
              />
            </div>
            <p className={ppHintClass}>{t("dashboard.settings.publicPage.colorHint")}</p>
          </div>
        </div>
      </SectionCard>

      {!previewDisabled && form.publicUrlPath ? (
        <SectionCard
          icon={Eye}
          title={t("dashboard.settings.publicPage.preview")}
          description={t("dashboard.settings.publicPage.subtitle")}
        >
          <div className="overflow-hidden rounded-2xl border border-[rgba(15,23,42,0.1)] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-3 border-b border-[rgba(15,23,42,0.08)] bg-[#F8FAFC] px-4 py-3">
              <div className="flex items-center gap-1.5" aria-hidden>
                <span className="h-2.5 w-2.5 rounded-full bg-[#F87171]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#FBBF24]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#34D399]" />
              </div>
              <div className="min-w-0 flex-1 truncate rounded-lg border border-[rgba(15,23,42,0.08)] bg-white px-3 py-1.5 font-mono text-xs text-[#64748B]">
                {publicUrl}
              </div>
              <a
                href={form.publicUrlPath}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-[#1A23FF] transition-opacity duration-250 hover:opacity-80"
                title={t("dashboard.settings.publicPage.preview")}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <iframe
              title={t("dashboard.settings.publicPage.preview")}
              src={form.publicUrlPath}
              className="h-[min(62vh,560px)] w-full min-h-[360px] border-0 bg-white"
            />
          </div>
        </SectionCard>
      ) : null}

      <SectionCard
        icon={ShoppingBag}
        title={t("dashboard.settings.publicPage.blocksTitle")}
        description={t("dashboard.settings.publicPage.blocksDescription")}
      >
        <div className={ppToggleRowClass}>
          <div className="min-w-0">
            <p className={ppToggleTitleClass}>
              {t("dashboard.settings.publicPage.showBuvette")}
            </p>
            <p className={ppToggleHintClass}>
              {t("dashboard.settings.publicPage.showBuvetteHint")}
            </p>
          </div>
          <PremiumSwitch
            checked={form.showBuvette}
            onChange={(showBuvette) => setForm({ ...form, showBuvette })}
            aria-label={t("dashboard.settings.publicPage.showBuvette")}
          />
        </div>
      </SectionCard>

      <SectionCard
        icon={Calendar2}
        title={t("dashboard.settings.publicPage.matchProgram.sectionTitle")}
        description={t("dashboard.settings.publicPage.matchProgram.sectionDescription")}
      >
        <MatchProgramSettings form={form} setForm={setForm} />
      </SectionCard>

      <SectionCard
        icon={QrCode}
        title={t("dashboard.settings.publicPage.publicLinks.sectionTitle")}
        description={t("dashboard.settings.publicPage.publicLinks.sectionDescription")}
      >
        <PublicLinksSettings
          enabled={form.showPublicLinks}
          onEnabledChange={(value) => setForm({ ...form, showPublicLinks: value })}
          links={links}
          onLinksChange={setLinks}
          qrcodeOptions={qrcodeOptions}
        />
      </SectionCard>

      <SectionCard
        icon={Instagram}
        title={t("dashboard.settings.publicPage.socialTitle")}
        description={t("dashboard.settings.publicPage.socialDescription")}
      >
        <div className="space-y-5">
          <div>
            <label className={ppLabelClass}>Instagram</label>
            <input
              className={ppInputClass}
              value={form.instagramUrl}
              onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
              placeholder="https://instagram.com/..."
            />
          </div>
          <div>
            <label className={ppLabelClass}>Facebook</label>
            <input
              className={ppInputClass}
              value={form.facebookUrl}
              onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })}
              placeholder="https://facebook.com/..."
            />
          </div>
          <div>
            <label className={ppLabelClass}>
              {t("dashboard.settings.publicPage.websiteLabel")}
            </label>
            <input
              className={ppInputClass}
              value={form.websiteUrl}
              onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
      </SectionCard>

      <div
        className={cn(
          dashboardGlassCardClass,
          "flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6",
        )}
      >
        <p className="text-sm leading-relaxed text-[#64748B]">
          {t("dashboard.settings.publicPage.saveHint")}
        </p>
        <DashboardPrimaryButton
          type="button"
          onClick={() => void save()}
          disabled={saving}
          icon="none"
          className="w-full justify-center sm:w-auto"
        >
          {saving
            ? t("dashboard.settings.publicPage.saving")
            : t("dashboard.settings.publicPage.save")}
        </DashboardPrimaryButton>
      </div>
    </PageLayout>
  );
}
