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
  DEFAULT_SUPPORTERS_LABEL,
  DEFAULT_SUPPORTERS_SUBTITLE,
  defaultSupportersTitle,
  resolvedSecondaryColor,
  resolvedSupportersCopy,
  type SupportersImagePosition,
  type SupportersOverlayIntensity,
  type SupportersPageSettings,
  type SupportersPageStyle,
} from "@/lib/supporters/page-settings";
import { bannerOverlay, clubColorsHeroStyle, effectivePageStyle } from "@/lib/supporters/theme";

const STYLES: Array<{ id: SupportersPageStyle; label: string; hint: string }> = [
  { id: "colors", label: "Couleurs du club", hint: "Dégradé premium" },
  { id: "banner", label: "Bannière", hint: "Image dans le hero" },
  { id: "fullscreen", label: "Plein écran", hint: "Image sur toute la page" },
];

const POSITIONS: Array<{ id: SupportersImagePosition; label: string }> = [
  { id: "top", label: "Haut" },
  { id: "center", label: "Centre" },
  { id: "bottom", label: "Bas" },
];

const INTENSITIES: Array<{ id: SupportersOverlayIntensity; label: string }> = [
  { id: "light", label: "Clair" },
  { id: "normal", label: "Normal" },
  { id: "dark", label: "Sombre" },
];

function ChoiceChip<T extends string>({
  options,
  value,
  disabled,
  onChange,
}: {
  options: Array<{ id: T; label: string }>;
  value: T;
  disabled?: boolean;
  onChange: (id: T) => void;
}) {
  return (
    <div className="mt-1.5 flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.id)}
          className={cn(
            "rounded-full border px-3.5 py-2 text-sm font-medium",
            value === option.id
              ? "border-[#1A23FF] bg-[rgba(26,35,255,0.08)] text-[#1A23FF]"
              : "border-[rgba(15,23,42,0.1)] bg-white text-[#64748B]"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default function SupportersPageSettings({ canManage }: { canManage: boolean }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
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
          label: form.label,
          title: form.title,
          subtitle: form.subtitle,
          primaryColor: form.primaryColor,
          secondaryColor: form.secondaryColor,
          pageStyle: form.pageStyle,
          imagePosition: form.imagePosition,
          overlayIntensity: form.overlayIntensity,
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

  const uploadBanner = async (file: File) => {
    setUploadingBanner(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/supporters/media?kind=banner", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload impossible");
      await load();
      toast.success("Image mise à jour");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Upload impossible");
    } finally {
      setUploadingBanner(false);
    }
  };

  const deleteBanner = async () => {
    try {
      const res = await fetch("/api/supporters/media?kind=banner", { method: "DELETE" });
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
  const secondary = resolvedSecondaryColor(form.primaryColor, form.secondaryColor);
  const previewStyle = effectivePageStyle(form.pageStyle, form.bannerUrl);
  const needsImage = form.pageStyle === "banner" || form.pageStyle === "fullscreen";

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Apparence de la page publique</h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Style, couleurs et visuel du club. Le supporter doit reconnaître votre identité.
          </p>
        </div>
        {form.publicPath ? (
          <a
            href={form.publicPath}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(dashboardSecondaryButtonClass, "rounded-full px-4 py-2 text-sm")}
          >
            Aperçu
          </a>
        ) : null}
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-[rgba(15,23,42,0.08)]">
        <div className="relative min-h-[8.5rem] px-5 py-5 text-center text-white">
          {previewStyle === "banner" && form.bannerUrl ? (
            <>
              <Image
                src={form.bannerUrl}
                alt=""
                fill
                className="object-cover"
                style={{
                  objectPosition:
                    form.imagePosition === "top"
                      ? "center top"
                      : form.imagePosition === "bottom"
                        ? "center bottom"
                        : "center",
                }}
                unoptimized
                sizes="640px"
              />
              <div
                className="absolute inset-0"
                style={{ background: bannerOverlay(form.primaryColor, secondary, form.overlayIntensity) }}
              />
            </>
          ) : (
            <div className="absolute inset-0" style={clubColorsHeroStyle(form.primaryColor, secondary)} />
          )}
          <div className="relative mx-auto max-w-md">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/70">{copy.label}</p>
            <p className="mt-1.5 text-lg font-semibold">{copy.title}</p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-white/80">{copy.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <section>
          <p className={dashboardLabelClass}>Style de page</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                disabled={!canManage}
                onClick={() => setForm({ ...form, pageStyle: style.id })}
                className={cn(
                  "rounded-2xl border p-3 text-left transition",
                  form.pageStyle === style.id
                    ? "border-[#1A23FF] bg-[rgba(26,35,255,0.06)]"
                    : "border-[rgba(15,23,42,0.1)] bg-white hover:border-[rgba(26,35,255,0.25)]"
                )}
              >
                <span
                  className="mb-2 block h-10 overflow-hidden rounded-xl"
                  style={
                    style.id === "colors" || !form.bannerUrl
                      ? clubColorsHeroStyle(form.primaryColor, secondary)
                      : {
                          backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.25), rgba(15,23,42,0.55)), url(${form.bannerUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                  }
                />
                <p className="text-sm font-semibold">{style.label}</p>
                <p className="mt-0.5 text-xs text-[#64748B]">{style.hint}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
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
        </section>

        {needsImage ? (
          <section className={`${dashboardInnerPanelClass} space-y-4 p-4`}>
            <div>
              <p className="text-sm font-medium">Image</p>
              <p className={cn(dashboardHintClass, "mt-1")}>
                Photo d’équipe, stade ou ambiance. JPG ou PNG, max. 5 Mo.
              </p>
              {form.bannerUrl ? (
                <div className="relative mt-3 aspect-[16/6] overflow-hidden rounded-xl bg-[#0B1220]">
                  <Image src={form.bannerUrl} alt="" fill className="object-cover" unoptimized sizes="640px" />
                </div>
              ) : (
                <p className="mt-3 rounded-xl border border-dashed border-[rgba(15,23,42,0.12)] bg-white px-4 py-6 text-center text-sm text-[#64748B]">
                  Sans image, le style « Couleurs du club » est utilisé automatiquement.
                </p>
              )}
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
                        if (file) void uploadBanner(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {form.bannerUrl ? (
                    <ActionButton variant="dangerSoft" type="button" onClick={() => void deleteBanner()}>
                      <Trash className="h-4 w-4" /> Retirer
                    </ActionButton>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div>
              <p className={dashboardLabelClass}>Position de l’image</p>
              <ChoiceChip
                options={POSITIONS}
                value={form.imagePosition}
                disabled={!canManage}
                onChange={(imagePosition) => setForm({ ...form, imagePosition })}
              />
            </div>
            <div>
              <p className={dashboardLabelClass}>Intensité</p>
              <ChoiceChip
                options={INTENSITIES}
                value={form.overlayIntensity}
                disabled={!canManage}
                onChange={(overlayIntensity) => setForm({ ...form, overlayIntensity })}
              />
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          <p className="text-sm font-semibold">Contenu</p>
          <label className="block">
            <span className={dashboardLabelClass}>Petit label</span>
            <input
              className={dashboardInputClass}
              value={form.label || ""}
              disabled={!canManage}
              onChange={(e) => setForm({ ...form, label: e.target.value || null })}
              placeholder={DEFAULT_SUPPORTERS_LABEL}
            />
          </label>
          <label className="block">
            <span className={dashboardLabelClass}>Titre</span>
            <input
              className={dashboardInputClass}
              value={form.title || ""}
              disabled={!canManage}
              onChange={(e) => setForm({ ...form, title: e.target.value || null })}
              placeholder={defaultSupportersTitle(form.clubName)}
            />
          </label>
          <label className="block">
            <span className={dashboardLabelClass}>Description</span>
            <textarea
              className={cn(dashboardInputClass, "min-h-[72px] resize-y")}
              value={form.subtitle || ""}
              disabled={!canManage}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value || null })}
              placeholder={DEFAULT_SUPPORTERS_SUBTITLE}
              rows={3}
            />
          </label>
        </section>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC] px-4 py-2.5">
          <span className="text-sm font-medium">Afficher le prix minimum dans le hero</span>
          <PremiumSwitch
            checked={form.showStats}
            onChange={(v) => canManage && setForm({ ...form, showStats: v })}
            disabled={!canManage}
            aria-label="Afficher le prix minimum"
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
