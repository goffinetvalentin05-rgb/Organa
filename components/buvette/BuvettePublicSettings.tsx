"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ChevronDown, Copy, ExternalLink, Globe, Loader, Upload } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import PublicAppearanceEditor from "@/components/public-branding/PublicAppearanceEditor";
import {
  cn,
  GlassCard,
  unifiedSectionBodyClass,
  dashboardCardDescriptionClass,
  dashboardCardTitleClass,
  dashboardInnerPanelClass,
  dashboardHintClass,
  dashboardSecondaryButtonClass,
} from "@/components/ui";
import { usePermissions } from "@/lib/auth/permissions-client";
import { normalizeBuvetteSlug } from "@/lib/buvette/slug";
import {
  DEFAULT_BUVETTE_LABEL,
  DEFAULT_BUVETTE_SUBTITLE,
  defaultBuvetteTitle,
  type BuvettePublicSettings,
} from "@/lib/buvette/settings";

export default function BuvettePublicSettingsPanel() {
  const { t } = useI18n();
  const { has } = usePermissions();
  const canManage = has("manage_plannings");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [form, setForm] = useState<BuvettePublicSettings | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/buvette/settings", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("dashboard.buvette.settings.loadError"));
      setForm(data);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t("dashboard.buvette.settings.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch("/api/buvette/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: form.slug || form.suggestedSlug,
          label: form.label,
          title: form.title,
          description: form.description,
          primaryColor: form.primaryColor,
          secondaryColor: form.secondaryColor,
          accentColor: form.accentColor,
          pageStyle: form.pageStyle,
          imagePosition: form.imagePosition,
          overlayIntensity: form.overlayIntensity,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("dashboard.buvette.settings.saveError"));
      setForm(data);
      toast.success(t("dashboard.buvette.settings.saveSuccess"));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t("dashboard.buvette.settings.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload/logo", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("dashboard.buvette.settings.logoUploadError"));
      await load();
      toast.success(t("dashboard.buvette.settings.logoUploadSuccess"));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t("dashboard.buvette.settings.logoUploadError"));
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const uploadBanner = async (file: File) => {
    setUploadingBanner(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/buvette/banner", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("dashboard.buvette.settings.bannerUploadError"));
      await load();
      toast.success(t("dashboard.buvette.settings.bannerUploadSuccess"));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t("dashboard.buvette.settings.bannerUploadError"));
    } finally {
      setUploadingBanner(false);
    }
  };

  const deleteBanner = async () => {
    try {
      const res = await fetch("/api/buvette/banner", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("dashboard.buvette.settings.bannerDeleteError"));
      await load();
      toast.success(t("dashboard.buvette.settings.bannerDeleteSuccess"));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t("dashboard.buvette.settings.bannerDeleteError"));
    }
  };

  const publicUrl =
    typeof window !== "undefined" && form?.publicUrlPath
      ? `${window.location.origin}${form.publicUrlPath}`
      : "";

  const copyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success(t("dashboard.buvette.settings.linkCopied"));
    } catch {
      toast.error(t("dashboard.buvette.settings.linkCopyError"));
    }
  };

  return (
    <GlassCard padding="none" className="overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-[#F8FAFC] sm:gap-4 sm:px-6 sm:py-5"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] text-[#1A23FF]">
          <Globe className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className={dashboardCardTitleClass}>{t("dashboard.buvette.settings.accordionTitle")}</p>
          <p className={dashboardCardDescriptionClass}>{t("dashboard.buvette.settings.subtitle")}</p>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#64748B] shadow-sm">
          <ChevronDown
            className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")}
            aria-hidden
          />
        </span>
      </button>

      {open ? (
        <div className={cn(unifiedSectionBodyClass, "space-y-8 border-t border-[rgba(15,23,42,0.06)]")}>
          {loading || !form ? (
            <p className="text-sm text-[#64748B]">{t("dashboard.common.loading")}</p>
          ) : (
            <>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">
                  Lien public
                </label>
                <div className="mt-3 flex min-w-0 flex-col overflow-hidden rounded-xl border border-[rgba(15,23,42,0.12)] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center">
                  <span className="shrink-0 px-3 pt-2.5 text-sm font-medium text-[#94A3B8] sm:pt-0">/club/</span>
                  <input
                    className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm text-[#0B1220] outline-none placeholder:text-[#94A3B8] focus:ring-0"
                    value={form.slug || ""}
                    disabled={!canManage}
                    onChange={(e) => {
                      const next = normalizeBuvetteSlug(e.target.value) || null;
                      setForm({
                        ...form,
                        slug: next,
                        publicUrlPath: next ? `/club/${next}/buvette` : null,
                      });
                    }}
                    placeholder={form.suggestedSlug}
                  />
                  <span className="shrink-0 px-3 pb-2.5 text-sm font-medium text-[#94A3B8] sm:pb-0">/buvette</span>
                </div>
                <p className={dashboardHintClass}>{t("dashboard.buvette.settings.slugHint")}</p>
              </div>

              {publicUrl ? (
                <div className="flex flex-col gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3 sm:flex-row sm:items-center">
                  <span className="min-w-0 flex-1 break-all text-sm font-medium text-[#334155]">{publicUrl}</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void copyLink()}
                      className={cn(dashboardSecondaryButtonClass, "rounded-full px-3 py-1.5 text-xs")}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {t("dashboard.buvette.copy")}
                    </button>
                    <a
                      href={form.publicUrlPath || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#1A23FF] px-3 py-1.5 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(26,35,255,0.22)] transition hover:bg-[#151dd9]"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Aperçu
                    </a>
                  </div>
                </div>
              ) : null}

              <div className={`${dashboardInnerPanelClass} p-4 sm:p-5`}>
                <p className="mb-3 text-sm font-medium text-[#0F172A]">Logo du club</p>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                    {form.logoUrl ? (
                      <Image
                        src={form.logoUrl}
                        alt={form.companyName}
                        fill
                        className="object-contain [filter:drop-shadow(0_6px_12px_rgba(0,0,0,0.18))]"
                        sizes="64px"
                        unoptimized={form.logoUrl.includes("supabase.co")}
                      />
                    ) : (
                      <span className="text-2xl font-bold text-[#94A3B8]">
                        {(form.companyName.charAt(0) || "C").toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <label
                      className={`inline-flex cursor-pointer items-center gap-2 ${dashboardSecondaryButtonClass} rounded-full px-4 py-2 text-sm`}
                    >
                      {uploadingLogo ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          {t("dashboard.buvette.settings.logoUploading")}
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          {t("dashboard.buvette.settings.logoUpload")}
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo || !canManage}
                        className="hidden"
                      />
                    </label>
                    <p className={cn(dashboardHintClass, "mt-2")}>{t("dashboard.buvette.settings.logoHint")}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold">Apparence</h3>
                <p className="mt-1 text-sm text-[#64748B]">
                  Même logique que Supporters et Boutique : style, couleurs et visuel du club.
                </p>
              </div>

              <PublicAppearanceEditor
                form={{
                  clubName: form.companyName,
                  label: form.label,
                  title: form.title,
                  subtitle: form.description,
                  primaryColor: form.primaryColor,
                  secondaryColor: form.secondaryColor,
                  accentColor: form.accentColor,
                  pageStyle: form.pageStyle || "colors",
                  imagePosition: form.imagePosition || "center",
                  overlayIntensity: form.overlayIntensity || "normal",
                  bannerUrl: form.bannerUrl,
                  publicPath: form.publicUrlPath,
                }}
                onChange={(patch) => {
                  const { subtitle, ...rest } = patch;
                  setForm({
                    ...form,
                    ...rest,
                    description: subtitle !== undefined ? subtitle : form.description,
                  });
                }}
                canManage={canManage}
                uploadingBanner={uploadingBanner}
                onUploadBanner={(file) => void uploadBanner(file)}
                onDeleteBanner={() => void deleteBanner()}
                placeholders={{
                  label: DEFAULT_BUVETTE_LABEL,
                  title: defaultBuvetteTitle(form.companyName),
                  subtitle: DEFAULT_BUVETTE_SUBTITLE,
                }}
                showAccent
              />

              {canManage ? (
                <DashboardPrimaryButton type="button" icon="none" disabled={saving} onClick={() => void save()}>
                  {saving ? t("dashboard.common.saving") : "Enregistrer la personnalisation"}
                </DashboardPrimaryButton>
              ) : (
                <p className="text-sm text-[#64748B]">Vous n’avez pas la permission de modifier ces paramètres.</p>
              )}
            </>
          )}
        </div>
      ) : null}
    </GlassCard>
  );
}
