"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import PublicAppearanceEditor from "@/components/public-branding/PublicAppearanceEditor";
import { GlassCard, cn, dashboardSecondaryButtonClass } from "@/components/ui";
import {
  DEFAULT_SHOP_LABEL,
  DEFAULT_SHOP_SUBTITLE,
  defaultShopTitle,
  type ShopAppearanceSettings as ShopAppearanceForm,
} from "@/lib/shop/page-settings";
import type { ShopSettings } from "@/lib/shop/types";

function formFromPayload(settings: ShopSettings, logoUrl: string | null): ShopAppearanceForm {
  return {
    clubName: settings.displayName,
    logoUrl,
    label: settings.label,
    title: settings.title,
    subtitle: settings.subtitle,
    introText: settings.introText,
    primaryColor: settings.publicPrimaryColor || "#1A23FF",
    secondaryColor: settings.publicSecondaryColor,
    accentColor: settings.publicAccentColor,
    pageStyle: settings.pageStyle || "colors",
    imagePosition: settings.imagePosition || "center",
    overlayIntensity: settings.overlayIntensity || "normal",
    bannerUrl: settings.bannerUrl,
    publicPath: settings.publicUrlPath,
  };
}

export default function ShopAppearanceSettings({ canManage }: { canManage: boolean }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [form, setForm] = useState<ShopAppearanceForm | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shop/settings", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible de charger les paramètres");
      setForm(data.appearance || formFromPayload(data.settings, data.logoUrl || null));
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
      const res = await fetch("/api/shop/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label,
          title: form.title,
          subtitle: form.subtitle,
          introText: form.introText,
          primaryColor: form.primaryColor,
          secondaryColor: form.secondaryColor,
          accentColor: form.accentColor,
          pageStyle: form.pageStyle,
          imagePosition: form.imagePosition,
          overlayIntensity: form.overlayIntensity,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enregistrement impossible");
      setForm(data.appearance || formFromPayload(data.settings, form.logoUrl));
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
      const res = await fetch("/api/shop/banner", { method: "POST", body });
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
      const res = await fetch("/api/shop/banner", { method: "DELETE" });
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

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Apparence de la boutique publique</h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Style, couleurs et visuel du club. La boutique doit donner envie d’acheter.
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

      <div className="mt-5">
        <PublicAppearanceEditor
          form={form}
          onChange={(patch) =>
            setForm({
              ...form,
              ...patch,
              introText: patch.introText !== undefined ? patch.introText || "" : form.introText,
            })
          }
          canManage={canManage}
          uploadingBanner={uploadingBanner}
          onUploadBanner={(file) => void uploadBanner(file)}
          onDeleteBanner={() => void deleteBanner()}
          placeholders={{
            label: DEFAULT_SHOP_LABEL,
            title: defaultShopTitle(form.clubName),
            subtitle: DEFAULT_SHOP_SUBTITLE,
          }}
          showAccent
          showIntro
        />
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
