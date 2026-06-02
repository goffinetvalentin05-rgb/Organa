"use client";

import { useCallback, useEffect, useState } from "react";
import { OBILLZ_BRAND_PRIMARY } from "@/lib/public-page/colors";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Copy, ExternalLink, Loader } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import MatchProgramSettings from "@/components/public-page/MatchProgramSettings";
import PublicLinksSettings, { linksToInputs } from "@/components/public-page/PublicLinksSettings";
import {
  ppCheckboxClass,
  ppHintClass,
  ppInputClass,
  ppLabelClass,
  ppSecondaryButtonClass,
  ppSuccessBannerClass,
  ppSuccessBannerTextClass,
  ppToggleHintClass,
  ppToggleRowClass,
  ppToggleTitleClass,
} from "@/components/public-page/settings-styles";
import { PageLayout, PageHeader, SectionCard, GlassCard, cn } from "@/components/ui";
import type { PublicPageLinkInput, PublicPageSettings } from "@/lib/public-page/types";
import { normalizePublicPageSlug } from "@/lib/public-page/slug";

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
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
      {showImage && logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          fill
          className="object-contain p-1.5"
          sizes="64px"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="text-xl font-bold" style={{ color: accent }}>
          {initial}
        </span>
      )}
    </div>
  );
}

export default function PublicPageSettingsPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PublicPageSettings | null>(null);
  const [links, setLinks] = useState<PublicPageLinkInput[]>([]);
  const [qrcodeOptions, setQrcodeOptions] = useState<
    { id: string; name: string; code: string; registrationPath: string }[]
  >([]);

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
      toast.success(t("dashboard.settings.publicPage.linkCopied"));
    } catch {
      toast.error(t("dashboard.settings.publicPage.linkCopyError"));
    }
  };

  if (loading || !form) {
    return (
      <PageLayout maxWidth="3xl">
        <div className="flex items-center justify-center py-20 text-white/80">
          <Loader className="h-6 w-6 animate-spin" />
          <span className="ml-2 text-sm">{t("dashboard.settings.publicPage.loading")}</span>
        </div>
      </PageLayout>
    );
  }

  const previewDisabled = !form.enabled || !form.slug;

  return (
    <PageLayout maxWidth="3xl">
      <div className="mb-4">
        <Link
          href="/tableau-de-bord"
          className="inline-flex items-center gap-2 text-sm text-white/75 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("dashboard.nav.dashboard")}
        </Link>
      </div>

      <PageHeader
        title={t("dashboard.settings.publicPage.title")}
        subtitle={t("dashboard.settings.publicPage.subtitle")}
      />

      <div className="mt-6 space-y-5">
        <SectionCard
          title={t("dashboard.settings.publicPage.activationTitle")}
          description={t("dashboard.settings.publicPage.activationDescription")}
        >
          <label className={ppToggleRowClass}>
            <span className={ppToggleTitleClass}>
              {t("dashboard.settings.publicPage.enabledLabel")}
            </span>
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              className={ppCheckboxClass}
            />
          </label>

          {form.enabled ? (
            <div className="mt-4 space-y-4">
              <div>
                <label className={ppLabelClass}>
                  {t("dashboard.settings.publicPage.slugLabel")}
                </label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="shrink-0 text-sm font-medium text-slate-600">
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

              {form.publicUrlPath && (
                <div className={ppSuccessBannerClass}>
                  <span className={ppSuccessBannerTextClass}>
                    {typeof window !== "undefined"
                      ? `${window.location.origin}${form.publicUrlPath}`
                      : form.publicUrlPath}
                  </span>
                  <button
                    type="button"
                    onClick={() => void copyPublicLink()}
                    className={ppSecondaryButtonClass}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {t("dashboard.settings.publicPage.copyLink")}
                  </button>
                  {!previewDisabled && (
                    <a
                      href={form.publicUrlPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={ppSecondaryButtonClass}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {t("dashboard.settings.publicPage.preview")}
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className={ppHintClass}>{t("dashboard.settings.publicPage.pageDisabledHint")}</p>
          )}
        </SectionCard>

        <SectionCard
          title={t("dashboard.settings.publicPage.contentTitle")}
          description={t("dashboard.settings.publicPage.contentDescription")}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <LogoPreview logoUrl={form.logoUrl} title={form.title} primaryColor={form.primaryColor} />
              <p className="text-sm leading-relaxed text-slate-600">
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
                className={cn(ppInputClass, "min-h-[88px] resize-y")}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
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
                  className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white"
                />
                <input
                  className={cn(ppInputClass, "flex-1")}
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                />
              </div>
              <p className={ppHintClass}>
                {t("dashboard.settings.publicPage.colorHint")}
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={t("dashboard.settings.publicPage.blocksTitle")}
          description={t("dashboard.settings.publicPage.blocksDescription")}
        >
          <label className={ppToggleRowClass}>
            <div>
              <span className={ppToggleTitleClass}>
                {t("dashboard.settings.publicPage.showBuvette")}
              </span>
              <p className={ppToggleHintClass}>
                {t("dashboard.settings.publicPage.showBuvetteHint")}
              </p>
            </div>
            <input
              type="checkbox"
              checked={form.showBuvette}
              onChange={(e) => setForm({ ...form, showBuvette: e.target.checked })}
              className={ppCheckboxClass}
            />
          </label>
        </SectionCard>

        <SectionCard
          title={t("dashboard.settings.publicPage.matchProgram.sectionTitle")}
          description={t("dashboard.settings.publicPage.matchProgram.sectionDescription")}
        >
          <MatchProgramSettings form={form} setForm={setForm} />
        </SectionCard>

        <SectionCard
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
          title={t("dashboard.settings.publicPage.socialTitle")}
          description={t("dashboard.settings.publicPage.socialDescription")}
        >
          <div className="space-y-4">
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

        <GlassCard className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/80">{t("dashboard.settings.publicPage.saveHint")}</p>
          <DashboardPrimaryButton
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="shrink-0"
          >
            {saving
              ? t("dashboard.settings.publicPage.saving")
              : t("dashboard.settings.publicPage.save")}
          </DashboardPrimaryButton>
        </GlassCard>
      </div>
    </PageLayout>
  );
}
