"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Copy, ExternalLink, Loader } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import { PageLayout, PageHeader, SectionCard, GlassCard, cn } from "@/components/ui";
import type { PublicPageSettings } from "@/lib/public-page/types";
import { normalizePublicPageSlug } from "@/lib/public-page/slug";

const inputClass =
  "w-full rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20";

export default function PublicPageSettingsPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PublicPageSettings | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/public-page", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur de chargement");
      setForm(data.settings);
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
          contactUrl: form.contactUrl,
          showBuvette: form.showBuvette,
          showMatches: form.showMatches,
          showContact: form.showContact,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur de sauvegarde");
      setForm(data.settings);
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
          href="/tableau-de-bord/parametres"
          className="inline-flex items-center gap-2 text-sm text-white/75 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("dashboard.settings.publicPage.backToSettings")}
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
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
            <span className="text-sm font-medium text-white">
              {t("dashboard.settings.publicPage.enabledLabel")}
            </span>
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              className="h-5 w-5 rounded border-white/30 accent-[#2563EB]"
            />
          </label>

          {form.enabled && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">
                  {t("dashboard.settings.publicPage.slugLabel")}
                </label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="shrink-0 text-sm text-white/60">obillz.com/p/</span>
                  <input
                    className={inputClass}
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
                <p className="mt-1.5 text-xs text-white/50">
                  {t("dashboard.settings.publicPage.slugHint")}
                </p>
              </div>

              {form.publicUrlPath && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3">
                  <span className="min-w-0 flex-1 truncate text-sm text-emerald-100">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}${form.publicUrlPath}`
                      : form.publicUrlPath}
                  </span>
                  <button
                    type="button"
                    onClick={() => void copyPublicLink()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {t("dashboard.settings.publicPage.copyLink")}
                  </button>
                  {!previewDisabled && (
                    <a
                      href={form.publicUrlPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {t("dashboard.settings.publicPage.preview")}
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title={t("dashboard.settings.publicPage.contentTitle")}
          description={t("dashboard.settings.publicPage.contentDescription")}
        >
          <div className="space-y-4">
            {form.logoUrl && (
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-white/20 bg-white">
                  <Image
                    src={form.logoUrl}
                    alt=""
                    fill
                    className="object-contain p-1"
                    sizes="56px"
                  />
                </div>
                <p className="text-xs text-white/60">
                  {t("dashboard.settings.publicPage.logoHint")}
                </p>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/70">
                {t("dashboard.settings.publicPage.titleLabel")}
              </label>
              <input
                className={inputClass}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/70">
                {t("dashboard.settings.publicPage.descriptionLabel")}
              </label>
              <textarea
                className={cn(inputClass, "min-h-[88px] resize-y")}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/70">
                {t("dashboard.settings.publicPage.colorLabel")}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-white/20 bg-transparent"
                />
                <input
                  className={cn(inputClass, "flex-1")}
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={t("dashboard.settings.publicPage.blocksTitle")}
          description={t("dashboard.settings.publicPage.blocksDescription")}
        >
          <div className="space-y-3">
            {[
              {
                key: "showBuvette" as const,
                label: t("dashboard.settings.publicPage.showBuvette"),
                hint: t("dashboard.settings.publicPage.showBuvetteHint"),
              },
              {
                key: "showMatches" as const,
                label: t("dashboard.settings.publicPage.showMatches"),
                hint: t("dashboard.settings.publicPage.showMatchesHint"),
              },
              {
                key: "showContact" as const,
                label: t("dashboard.settings.publicPage.showContact"),
                hint: t("dashboard.settings.publicPage.showContactHint"),
              },
            ].map((item) => (
              <label
                key={item.key}
                className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-white/15 bg-white/5 px-4 py-3"
              >
                <div>
                  <span className="text-sm font-medium text-white">{item.label}</span>
                  <p className="mt-0.5 text-xs text-white/55">{item.hint}</p>
                </div>
                <input
                  type="checkbox"
                  checked={form[item.key]}
                  onChange={(e) => setForm({ ...form, [item.key]: e.target.checked })}
                  className="mt-1 h-5 w-5 shrink-0 rounded accent-[#2563EB]"
                />
              </label>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title={t("dashboard.settings.publicPage.linksTitle")}
          description={t("dashboard.settings.publicPage.linksDescription")}
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/70">Instagram</label>
              <input
                className={inputClass}
                value={form.instagramUrl}
                onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
                placeholder="https://instagram.com/..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/70">Facebook</label>
              <input
                className={inputClass}
                value={form.facebookUrl}
                onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })}
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/70">
                {t("dashboard.settings.publicPage.websiteLabel")}
              </label>
              <input
                className={inputClass}
                value={form.websiteUrl}
                onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/70">
                {t("dashboard.settings.publicPage.contactLabel")}
              </label>
              <input
                className={inputClass}
                value={form.contactUrl}
                onChange={(e) => setForm({ ...form, contactUrl: e.target.value })}
                placeholder="mailto:contact@club.ch ou https://..."
              />
            </div>
          </div>
        </SectionCard>

        <GlassCard className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/60">{t("dashboard.settings.publicPage.saveHint")}</p>
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
