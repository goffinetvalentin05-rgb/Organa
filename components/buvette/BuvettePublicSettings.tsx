"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ChevronDown, Copy, ExternalLink, Loader, Trash, Upload } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import { cn, unifiedSectionBodyClass, unifiedSectionShellClass } from "@/components/ui";
import { normalizeBuvetteSlug } from "@/lib/buvette/slug";
import type { BuvettePublicSettings } from "@/lib/buvette/settings";

export default function BuvettePublicSettingsPanel() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [deletingBanner, setDeletingBanner] = useState(false);
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
          title: form.title,
          description: form.description,
          primaryColor: form.primaryColor,
          accentColor: form.accentColor,
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

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      e.target.value = "";
    }
  };

  const handleBannerDelete = async () => {
    if (!form?.bannerUrl) return;
    if (!confirm(t("dashboard.buvette.settings.bannerDeleteConfirm"))) return;
    setDeletingBanner(true);
    try {
      const res = await fetch("/api/buvette/banner", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("dashboard.buvette.settings.bannerDeleteError"));
      await load();
      toast.success(t("dashboard.buvette.settings.bannerDeleteSuccess"));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t("dashboard.buvette.settings.bannerDeleteError"));
    } finally {
      setDeletingBanner(false);
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
    <div className={cn(unifiedSectionShellClass, "mt-2")}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left transition hover:bg-white/20 sm:px-6 sm:py-5"
      >
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
            {t("dashboard.buvette.settings.accordionTitle")}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            {t("dashboard.buvette.settings.subtitle")}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "mt-1 h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div className={cn(unifiedSectionBodyClass, "border-t border-white/30 space-y-6")}>
          {loading || !form ? (
            <p className="text-sm text-slate-600">{t("dashboard.common.loading")}</p>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-800">
                  {t("dashboard.buvette.settings.slugLabel")}
                </label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="shrink-0 text-sm font-medium text-slate-600">/club/</span>
                  <input
                    className="input-obillz flex-1"
                    value={form.slug || ""}
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
                  <span className="shrink-0 text-sm font-medium text-slate-600">/buvette</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">{t("dashboard.buvette.settings.slugHint")}</p>
              </div>

              {publicUrl ? (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-3">
                  <span className="min-w-0 flex-1 break-all text-sm font-medium text-emerald-900">
                    {publicUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => void copyLink()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-50"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {t("dashboard.buvette.copy")}
                  </button>
                  <a
                    href={form.publicUrlPath || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-50"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t("dashboard.buvette.open")}
                  </a>
                </div>
              ) : null}

              <label className="block text-sm font-medium text-slate-800">
                {t("dashboard.buvette.settings.pageTitleLabel")}
                <input
                  className="input-obillz mt-1.5 w-full"
                  value={form.title || ""}
                  onChange={(e) => setForm({ ...form, title: e.target.value || null })}
                  placeholder={t("dashboard.buvette.settings.pageTitlePlaceholder")}
                />
              </label>

              <label className="block text-sm font-medium text-slate-800">
                {t("dashboard.buvette.settings.descriptionLabel")}
                <textarea
                  className="input-obillz mt-1.5 min-h-[88px] w-full"
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value || null })}
                  placeholder={t("dashboard.buvette.settings.descriptionPlaceholder")}
                  rows={3}
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-800">
                  {t("dashboard.buvette.settings.primaryColorLabel")}
                  <div className="mt-1.5 flex items-center gap-3">
                    <input
                      type="color"
                      value={form.primaryColor}
                      onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                      className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                    />
                    <input
                      className="input-obillz flex-1"
                      value={form.primaryColor}
                      onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                    />
                  </div>
                </label>
                <label className="block text-sm font-medium text-slate-800">
                  {t("dashboard.buvette.settings.accentColorLabel")}
                  <div className="mt-1.5 flex items-center gap-3">
                    <input
                      type="color"
                      value={form.accentColor || form.primaryColor}
                      onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                      className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                    />
                    <input
                      className="input-obillz flex-1"
                      value={form.accentColor || ""}
                      onChange={(e) => setForm({ ...form, accentColor: e.target.value || null })}
                      placeholder={t("dashboard.buvette.settings.accentColorPlaceholder")}
                    />
                  </div>
                </label>
              </div>

              <div className="rounded-xl border border-slate-200/70 bg-white/50 p-4">
                <p className="mb-3 text-sm font-medium text-slate-800">
                  {t("dashboard.buvette.settings.logoLabel")}
                </p>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {form.logoUrl ? (
                      <Image
                        src={form.logoUrl}
                        alt={form.companyName}
                        fill
                        className="object-contain p-2"
                        sizes="80px"
                        unoptimized={form.logoUrl.includes("supabase.co")}
                      />
                    ) : (
                      <span className="text-2xl font-bold text-slate-400">
                        {(form.companyName.charAt(0) || "C").toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
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
                        disabled={uploadingLogo}
                        className="hidden"
                      />
                    </label>
                    <p className="mt-2 text-xs text-slate-500">{t("dashboard.buvette.settings.logoHint")}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/70 bg-white/50 p-4">
                <p className="text-sm font-medium text-slate-800">
                  {t("dashboard.buvette.settings.bannerLabel")}
                </p>
                <p className="mt-1 text-sm text-slate-600">{t("dashboard.buvette.settings.bannerDescription")}</p>

                {form.bannerUrl ? (
                  <div className="relative mt-4 aspect-[3/1] w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <Image
                      src={form.bannerUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 576px"
                      unoptimized={form.bannerUrl.includes("supabase.co")}
                    />
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    {uploadingBanner ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        {t("dashboard.buvette.settings.bannerUploading")}
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        {form.bannerUrl
                          ? t("dashboard.buvette.settings.bannerReplace")
                          : t("dashboard.buvette.settings.bannerUpload")}
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleBannerUpload}
                      disabled={uploadingBanner}
                      className="hidden"
                    />
                  </label>
                  {form.bannerUrl ? (
                    <button
                      type="button"
                      onClick={() => void handleBannerDelete()}
                      disabled={deletingBanner}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      {deletingBanner ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash className="h-4 w-4" />
                      )}
                      {t("dashboard.buvette.settings.bannerDelete")}
                    </button>
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-slate-500">{t("dashboard.buvette.settings.bannerHint")}</p>
              </div>

              <DashboardPrimaryButton type="button" icon="none" disabled={saving} onClick={() => void save()}>
                {saving ? t("dashboard.common.saving") : t("dashboard.buvette.settings.saveAction")}
              </DashboardPrimaryButton>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
