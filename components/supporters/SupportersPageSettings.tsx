"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import PremiumSwitch from "@/components/public-page/PremiumSwitch";
import {
  ActionButton,
  GlassCard,
  cn,
  dashboardHintClass,
  dashboardInputClass,
  dashboardInnerPanelClass,
  dashboardLabelClass,
  dashboardSecondaryButtonClass,
} from "@/components/ui";
import { Loader, Trash, Upload } from "@/lib/icons";
import {
  DEFAULT_SUPPORTERS_SUBTITLE,
  defaultSupportersTitle,
  resolvedSupportersCopy,
  type SupportersBackgroundMode,
  type SupportersPageSettings,
} from "@/lib/supporters/page-settings";
import { getClubBrandPalette } from "@/lib/public-page/colors";

const MODES: Array<{ id: SupportersBackgroundMode; label: string }> = [
  { id: "gradient", label: "Dégradé" },
  { id: "solid", label: "Uni" },
  { id: "image", label: "Image" },
];

export default function SupportersPageSettings({ canManage }: { canManage: boolean }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [form, setForm] = useState<SupportersPageSettings | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/supporters/page-settings", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible de charger les paramètres");
      setForm(data);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Impossible de charger les paramètres");
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
      const res = await fetch("/api/supporters/page-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          subtitle: form.subtitle,
          message: form.message,
          primaryColor: form.primaryColor,
          secondaryColor: form.secondaryColor,
          backgroundMode: form.backgroundMode,
          showStats: form.showStats,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enregistrement impossible");
      setForm(data);
      toast.success("Personnalisation enregistrée");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  const uploadMedia = async (
    kind: "banner" | "background",
    file: File,
    setBusy: (v: boolean) => void
  ) => {
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`/api/supporters/media?kind=${kind}`, { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload impossible");
      await load();
      toast.success(kind === "banner" ? "Bannière mise à jour" : "Image de fond mise à jour");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Upload impossible");
    } finally {
      setBusy(false);
    }
  };

  const deleteMedia = async (kind: "banner" | "background") => {
    try {
      const res = await fetch(`/api/supporters/media?kind=${kind}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Suppression impossible");
      await load();
      toast.success("Image retirée");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Suppression impossible");
    }
  };

  if (loading || !form) {
    return (
      <GlassCard className="p-5">
        <p className="text-sm text-[#64748B]">Chargement de la personnalisation…</p>
      </GlassCard>
    );
  }

  const copy = resolvedSupportersCopy(form);
  const palette = getClubBrandPalette(form.primaryColor, form.secondaryColor);
  const previewBg = form.bannerUrl
    ? undefined
    : form.backgroundMode === "solid"
      ? form.primaryColor
      : palette.headerGradient;

  return (
    <GlassCard className="p-5 sm:p-6">
      <h2 className="text-base font-semibold">Personnalisation de la page publique</h2>
      <p className="mt-1 text-sm text-[#64748B]">
        Adaptez le hero, les couleurs et les visuels pour que la page ressemble à votre club.
      </p>
      {form.publicPath ? (
        <a
          href={form.publicPath}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex text-sm font-semibold text-[#1A23FF]"
        >
          Voir la page publique
        </a>
      ) : null}

      <div className="mt-5 overflow-hidden rounded-2xl border border-[rgba(15,23,42,0.08)]">
        <div className="relative min-h-[9.5rem] px-5 py-6 text-center text-white">
          {form.bannerUrl ? (
            <>
              <Image src={form.bannerUrl} alt="" fill className="object-cover" unoptimized sizes="640px" />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(180deg, ${form.primaryColor}99 0%, #0b1220e6 100%)`,
                }}
              />
            </>
          ) : (
            <div className="absolute inset-0" style={{ background: previewBg }} />
          )}
          <div className="relative">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/70">Aperçu</p>
            <p className="mt-2 text-lg font-semibold">{copy.title}</p>
            <p className="mt-1 text-xs text-white/80">{copy.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className={dashboardLabelClass}>Titre public</span>
          <input
            className={dashboardInputClass}
            value={form.title || ""}
            disabled={!canManage}
            onChange={(e) => setForm({ ...form, title: e.target.value || null })}
            placeholder={defaultSupportersTitle(form.clubName)}
          />
        </label>
        <label className="block">
          <span className={dashboardLabelClass}>Sous-titre</span>
          <input
            className={dashboardInputClass}
            value={form.subtitle || ""}
            disabled={!canManage}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value || null })}
            placeholder={DEFAULT_SUPPORTERS_SUBTITLE}
          />
        </label>
        <label className="block">
          <span className={dashboardLabelClass}>Message complémentaire (optionnel)</span>
          <textarea
            className={cn(dashboardInputClass, "min-h-[72px] resize-y")}
            value={form.message || ""}
            disabled={!canManage}
            onChange={(e) => setForm({ ...form, message: e.target.value || null })}
            placeholder="Chaque soutien compte pour faire grandir notre club, nos équipes et nos projets."
            rows={3}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={dashboardLabelClass}>Couleur principale</span>
            <div className="mt-1.5 flex items-center gap-3">
              <input
                type="color"
                value={form.primaryColor}
                disabled={!canManage}
                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                className="h-10 w-12 cursor-pointer rounded-xl border border-[#E5E7EB] bg-white p-1"
              />
              <input
                className={dashboardInputClass}
                value={form.primaryColor}
                disabled={!canManage}
                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
              />
            </div>
          </label>
          <label className="block">
            <span className={dashboardLabelClass}>Couleur secondaire</span>
            <div className="mt-1.5 flex items-center gap-3">
              <input
                type="color"
                value={form.secondaryColor || form.primaryColor}
                disabled={!canManage}
                onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
                className="h-10 w-12 cursor-pointer rounded-xl border border-[#E5E7EB] bg-white p-1"
              />
              <input
                className={dashboardInputClass}
                value={form.secondaryColor || ""}
                disabled={!canManage}
                onChange={(e) => setForm({ ...form, secondaryColor: e.target.value || null })}
                placeholder="Optionnel"
              />
            </div>
          </label>
        </div>

        <div>
          <p className={dashboardLabelClass}>Type de fond</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                disabled={!canManage}
                onClick={() => setForm({ ...form, backgroundMode: mode.id })}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-sm font-medium",
                  form.backgroundMode === mode.id
                    ? "border-[#1A23FF] bg-[rgba(26,35,255,0.08)] text-[#1A23FF]"
                    : "border-[rgba(15,23,42,0.1)] bg-white text-[#64748B]"
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`${dashboardInnerPanelClass} p-4`}>
          <p className="text-sm font-medium">Image de bannière / couverture</p>
          <p className={cn(dashboardHintClass, "mt-1")}>
            Photo d’équipe, stade ou ambiance. Utilisée dans le hero.
          </p>
          {form.bannerUrl ? (
            <div className="relative mt-3 aspect-[16/6] overflow-hidden rounded-xl bg-white">
              <Image src={form.bannerUrl} alt="" fill className="object-cover" unoptimized sizes="640px" />
            </div>
          ) : null}
          {canManage ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <label className={cn(dashboardSecondaryButtonClass, "cursor-pointer rounded-full px-4 py-2 text-sm")}>
                {uploadingBanner ? <Loader className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {form.bannerUrl ? "Remplacer" : "Ajouter"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                  disabled={uploadingBanner}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadMedia("banner", file, setUploadingBanner);
                    e.target.value = "";
                  }}
                />
              </label>
              {form.bannerUrl ? (
                <ActionButton variant="dangerSoft" type="button" onClick={() => void deleteMedia("banner")}>
                  <Trash className="h-4 w-4" /> Retirer
                </ActionButton>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className={`${dashboardInnerPanelClass} p-4`}>
          <p className="text-sm font-medium">Image d’ambiance (optionnelle)</p>
          <p className={cn(dashboardHintClass, "mt-1")}>
            Texture discrète derrière le contenu, sous le hero.
          </p>
          {form.bgImageUrl ? (
            <div className="relative mt-3 aspect-[16/6] overflow-hidden rounded-xl bg-white">
              <Image src={form.bgImageUrl} alt="" fill className="object-cover" unoptimized sizes="640px" />
            </div>
          ) : null}
          {canManage ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <label className={cn(dashboardSecondaryButtonClass, "cursor-pointer rounded-full px-4 py-2 text-sm")}>
                {uploadingBg ? <Loader className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {form.bgImageUrl ? "Remplacer" : "Ajouter"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                  disabled={uploadingBg}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadMedia("background", file, setUploadingBg);
                    e.target.value = "";
                  }}
                />
              </label>
              {form.bgImageUrl ? (
                <ActionButton variant="dangerSoft" type="button" onClick={() => void deleteMedia("background")}>
                  <Trash className="h-4 w-4" /> Retirer
                </ActionButton>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC] px-4 py-2.5">
          <span className="text-sm font-medium">Afficher les statistiques sur la page publique</span>
          <PremiumSwitch
            checked={form.showStats}
            onChange={(v) => canManage && setForm({ ...form, showStats: v })}
            disabled={!canManage}
            aria-label="Afficher les statistiques"
          />
        </div>
      </div>

      {canManage ? (
        <div className="mt-6">
          <DashboardPrimaryButton type="button" icon="none" loading={saving} onClick={() => void save()}>
            Enregistrer la personnalisation
          </DashboardPrimaryButton>
        </div>
      ) : (
        <p className="mt-4 text-sm text-[#64748B]">Vous n’avez pas la permission de modifier ces paramètres.</p>
      )}
    </GlassCard>
  );
}
