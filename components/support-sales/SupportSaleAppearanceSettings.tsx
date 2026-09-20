"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import PublicAppearanceEditor from "@/components/public-branding/PublicAppearanceEditor";
import { GlassCard, cn, dashboardSecondaryButtonClass } from "@/components/ui";
import {
  DEFAULT_SUPPORT_SALE_LABEL,
  DEFAULT_SUPPORT_SALE_SUBTITLE,
  defaultSupportSaleTitle,
  type SupportSaleAppearanceForm,
} from "@/lib/support-sales/page-settings";

export default function SupportSaleAppearanceSettings({
  saleId,
  saleName,
  canManage,
}: {
  saleId: string;
  saleName: string;
  canManage: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [form, setForm] = useState<SupportSaleAppearanceForm | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/support-sales/${saleId}/appearance`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible de charger l’apparence");
      setForm(data.appearance);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Impossible de charger l’apparence");
    } finally {
      setLoading(false);
    }
  }, [saleId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/support-sales/${saleId}/appearance`, {
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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enregistrement impossible");
      setForm(data.appearance);
      toast.success("Apparence enregistrée");
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
      const res = await fetch(`/api/support-sales/${saleId}/media?kind=banner`, {
        method: "POST",
        body,
      });
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
      const res = await fetch(`/api/support-sales/${saleId}/media?kind=banner`, { method: "DELETE" });
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
        <p className="text-sm text-[#64748B]">Chargement de l’apparence…</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#0F172A]">Apparence de la page</h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Couleurs, image et aperçu de la page publique, comme pour Boutique et Supporters.
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
        ) : (
          <p className="text-sm text-[#64748B]">Publiez la vente pour voir l’aperçu public.</p>
        )}
      </div>

      <div className="mt-5">
        <PublicAppearanceEditor
          form={form}
          onChange={(patch) => setForm({ ...form, ...patch })}
          canManage={canManage}
          uploadingBanner={uploadingBanner}
          onUploadBanner={(file) => void uploadBanner(file)}
          onDeleteBanner={() => void deleteBanner()}
          placeholders={{
            label: DEFAULT_SUPPORT_SALE_LABEL,
            title: defaultSupportSaleTitle(saleName || form.clubName),
            subtitle: DEFAULT_SUPPORT_SALE_SUBTITLE,
          }}
        />
      </div>

      {canManage ? (
        <div className="mt-6">
          <DashboardPrimaryButton type="button" icon="none" loading={saving} onClick={() => void save()}>
            Enregistrer l’apparence
          </DashboardPrimaryButton>
        </div>
      ) : (
        <p className="mt-4 text-sm text-[#64748B]">
          Vous n’avez pas la permission de modifier ces paramètres.
        </p>
      )}
    </GlassCard>
  );
}
