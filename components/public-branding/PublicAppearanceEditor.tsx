"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import {
  ActionButton,
  cn,
  dashboardHintClass,
  dashboardInputClass,
  dashboardInnerPanelClass,
  dashboardLabelClass,
  dashboardSecondaryButtonClass,
} from "@/components/ui";
import { Loader, Trash, Upload } from "@/lib/icons";
import {
  bannerOverlay,
  clubColorsHeroStyle,
  effectivePageStyle,
  resolvedBrandColors,
} from "@/lib/public-branding/theme";
import type {
  PublicImagePosition,
  PublicOverlayIntensity,
  PublicPageStyle,
} from "@/lib/public-branding/types";

export type PublicAppearanceForm = {
  clubName: string;
  label: string | null;
  title: string | null;
  subtitle: string | null;
  introText?: string | null;
  primaryColor: string;
  secondaryColor: string | null;
  accentColor?: string | null;
  pageStyle: PublicPageStyle;
  imagePosition: PublicImagePosition;
  overlayIntensity: PublicOverlayIntensity;
  bannerUrl: string | null;
  publicPath: string | null;
};

export type PublicAppearancePlaceholders = {
  label: string;
  title: string;
  subtitle: string;
  intro?: string;
};

const STYLES: Array<{ id: PublicPageStyle; label: string; hint: string }> = [
  { id: "colors", label: "Couleurs du club", hint: "Dégradé premium" },
  { id: "banner", label: "Bannière", hint: "Image dans le hero" },
  { id: "fullscreen", label: "Plein écran", hint: "Image sur toute la page" },
];

const POSITIONS: Array<{ id: PublicImagePosition; label: string }> = [
  { id: "top", label: "Haut" },
  { id: "center", label: "Centre" },
  { id: "bottom", label: "Bas" },
];

const INTENSITIES: Array<{ id: PublicOverlayIntensity; label: string }> = [
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

type Props = {
  form: PublicAppearanceForm;
  onChange: (patch: Partial<PublicAppearanceForm>) => void;
  canManage: boolean;
  uploadingBanner: boolean;
  onUploadBanner: (file: File) => void;
  onDeleteBanner: () => void;
  placeholders: PublicAppearancePlaceholders;
  showAccent?: boolean;
  showIntro?: boolean;
  extra?: ReactNode;
};

export default function PublicAppearanceEditor({
  form,
  onChange,
  canManage,
  uploadingBanner,
  onUploadBanner,
  onDeleteBanner,
  placeholders,
  showAccent = false,
  showIntro = false,
  extra,
}: Props) {
  const colors = resolvedBrandColors(form.primaryColor, form.secondaryColor, form.accentColor);
  const previewStyle = effectivePageStyle(form.pageStyle, form.bannerUrl);
  const needsImage = form.pageStyle === "banner" || form.pageStyle === "fullscreen";
  const previewLabel = form.label?.trim() || placeholders.label;
  const previewTitle = form.title?.trim() || placeholders.title;
  const previewSubtitle = form.subtitle?.trim() || placeholders.subtitle;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-[rgba(15,23,42,0.08)]">
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
                style={{ background: bannerOverlay(form.primaryColor, colors.secondary, form.overlayIntensity) }}
              />
            </>
          ) : (
            <div className="absolute inset-0" style={clubColorsHeroStyle(form.primaryColor, colors.secondary)} />
          )}
          <div className="relative mx-auto max-w-md">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/70">{previewLabel}</p>
            <p className="mt-1.5 text-lg font-semibold">{previewTitle}</p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-white/80">{previewSubtitle}</p>
          </div>
        </div>
      </div>

      <section>
        <p className={dashboardLabelClass}>Style de page</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              disabled={!canManage}
              onClick={() => onChange({ pageStyle: style.id })}
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
                    ? clubColorsHeroStyle(form.primaryColor, colors.secondary)
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

      <section className={cn("grid gap-4", showAccent ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        <label className="block">
          <span className={dashboardLabelClass}>Couleur principale</span>
          <div className="mt-1.5 flex items-center gap-3">
            <input
              type="color"
              value={form.primaryColor}
              disabled={!canManage}
              onChange={(e) => onChange({ primaryColor: e.target.value })}
              className="h-10 w-12 cursor-pointer rounded-xl border border-[#E5E7EB] bg-white p-1"
            />
            <input
              className={dashboardInputClass}
              value={form.primaryColor}
              disabled={!canManage}
              onChange={(e) => onChange({ primaryColor: e.target.value })}
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
              onChange={(e) => onChange({ secondaryColor: e.target.value })}
              className="h-10 w-12 cursor-pointer rounded-xl border border-[#E5E7EB] bg-white p-1"
            />
            <input
              className={dashboardInputClass}
              value={form.secondaryColor || ""}
              disabled={!canManage}
              onChange={(e) => onChange({ secondaryColor: e.target.value || null })}
              placeholder="Optionnel"
            />
          </div>
        </label>
        {showAccent ? (
          <label className="block">
            <span className={dashboardLabelClass}>Couleur d’accent</span>
            <div className="mt-1.5 flex items-center gap-3">
              <input
                type="color"
                value={form.accentColor || form.primaryColor}
                disabled={!canManage}
                onChange={(e) => onChange({ accentColor: e.target.value })}
                className="h-10 w-12 cursor-pointer rounded-xl border border-[#E5E7EB] bg-white p-1"
              />
              <input
                className={dashboardInputClass}
                value={form.accentColor || ""}
                disabled={!canManage}
                onChange={(e) => onChange({ accentColor: e.target.value || null })}
                placeholder="Optionnel"
              />
            </div>
          </label>
        ) : null}
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
                      if (file) onUploadBanner(file);
                      e.target.value = "";
                    }}
                  />
                </label>
                {form.bannerUrl ? (
                  <ActionButton variant="dangerSoft" type="button" onClick={onDeleteBanner}>
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
              onChange={(imagePosition) => onChange({ imagePosition })}
            />
          </div>
          <div>
            <p className={dashboardLabelClass}>Intensité</p>
            <ChoiceChip
              options={INTENSITIES}
              value={form.overlayIntensity}
              disabled={!canManage}
              onChange={(overlayIntensity) => onChange({ overlayIntensity })}
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
            onChange={(e) => onChange({ label: e.target.value || null })}
            placeholder={placeholders.label}
          />
        </label>
        <label className="block">
          <span className={dashboardLabelClass}>Titre public</span>
          <input
            className={dashboardInputClass}
            value={form.title || ""}
            disabled={!canManage}
            onChange={(e) => onChange({ title: e.target.value || null })}
            placeholder={placeholders.title}
          />
        </label>
        <label className="block">
          <span className={dashboardLabelClass}>Sous-titre public</span>
          <textarea
            className={cn(dashboardInputClass, "min-h-[72px] resize-y")}
            value={form.subtitle || ""}
            disabled={!canManage}
            onChange={(e) => onChange({ subtitle: e.target.value || null })}
            placeholder={placeholders.subtitle}
            rows={3}
          />
        </label>
        {showIntro ? (
          <label className="block">
            <span className={dashboardLabelClass}>Texte d’introduction</span>
            <textarea
              className={cn(dashboardInputClass, "min-h-[72px] resize-y")}
              value={form.introText || ""}
              disabled={!canManage}
              onChange={(e) => onChange({ introText: e.target.value })}
              placeholder={placeholders.intro || "Optionnel — affiché sous le sous-titre s’il est différent."}
              rows={3}
            />
          </label>
        ) : null}
      </section>

      {extra}
    </div>
  );
}
