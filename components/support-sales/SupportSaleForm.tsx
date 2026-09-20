"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import {
  ActionButton,
  FormSection,
  GlassCard,
  PageHeader,
  PageLayout,
  dashboardInputClass,
  dashboardLabelClass,
  dashboardTabActiveClass,
  dashboardTabInactiveClass,
  cn,
} from "@/components/ui";
import { useI18n } from "@/components/I18nProvider";
import { formatCategoryLabel, buildCategoryFilterOptions } from "@/lib/members/taxonomy";
import { usePermissions } from "@/lib/auth/permissions-client";
import SupportSaleAppearanceSettings from "@/components/support-sales/SupportSaleAppearanceSettings";
import type { SupportSale, SupportSaleMemberOption, SupportSaleMemberScope } from "@/lib/support-sales/types";

type FormState = {
  name: string;
  productName: string;
  description: string;
  price: string;
  availableQuantity: string;
  startDate: string;
  reservationDeadline: string;
  distributionInfo: string;
  memberScope: SupportSaleMemberScope;
  goalPerMember: string;
  categories: string[];
  memberIds: string[];
  sponsorName: string;
  sponsorText: string;
  sponsorUrl: string;
};

function saleToForm(sale?: SupportSale | null): FormState {
  return {
    name: sale?.name || "",
    productName: sale?.productName || "",
    description: sale?.description || "",
    price: sale ? (sale.priceCents / 100).toString() : "",
    availableQuantity: sale?.availableQuantity != null ? String(sale.availableQuantity) : "",
    startDate: sale?.startDate || "",
    reservationDeadline: sale?.reservationDeadline || "",
    distributionInfo: sale?.distributionInfo || "",
    memberScope: sale?.memberScope || "all",
    goalPerMember: sale?.goalPerMember != null ? String(sale.goalPerMember) : "",
    categories: sale?.categories || [],
    memberIds: sale?.memberIds || [],
    sponsorName: sale?.sponsorName || "",
    sponsorText: sale?.sponsorText || "",
    sponsorUrl: sale?.sponsorUrl || "",
  };
}

export default function SupportSaleForm({
  mode,
  sale,
}: {
  mode: "create" | "edit";
  sale?: SupportSale | null;
}) {
  const { t } = useI18n();
  const { has } = usePermissions();
  const canManage = has("manage_support_sales");
  const router = useRouter();
  const [form, setForm] = useState<FormState>(saleToForm(sale));
  const [members, setMembers] = useState<SupportSaleMemberOption[]>([]);
  const [memberQuery, setMemberQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [sponsorFile, setSponsorFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(sale?.imageUrl || null);
  const [sponsorPreview, setSponsorPreview] = useState<string | null>(sale?.sponsorLogoUrl || null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/support-sales/member-options", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setMembers(data.members || []);
    })();
  }, []);

  const categoryOptions = useMemo(
    () => buildCategoryFilterOptions(members.map((m) => ({ category: m.category })), t),
    [members, t]
  );

  const filteredMembers = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const category = formatCategoryLabel(m.category, t).toLowerCase();
      return m.name.toLowerCase().includes(q) || category.includes(q);
    });
  }, [memberQuery, members, t]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCategory = (value: string) => {
    update(
      "categories",
      form.categories.includes(value)
        ? form.categories.filter((c) => c !== value)
        : [...form.categories, value]
    );
  };

  const toggleMember = (id: string) => {
    update(
      "memberIds",
      form.memberIds.includes(id)
        ? form.memberIds.filter((m) => m !== id)
        : [...form.memberIds, id]
    );
  };

  const uploadMedia = async (saleId: string) => {
    if (imageFile) {
      const fd = new FormData();
      fd.append("file", imageFile);
      const res = await fetch(`/api/support-sales/${saleId}/media?kind=image`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload de l’image impossible");
    }
    if (sponsorFile) {
      const fd = new FormData();
      fd.append("file", sponsorFile);
      const res = await fetch(`/api/support-sales/${saleId}/media?kind=sponsor`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload du logo sponsor impossible");
    }
  };

  const submit = async (publish: boolean) => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        productName: form.productName,
        description: form.description,
        price: form.price,
        availableQuantity: form.availableQuantity || null,
        startDate: form.startDate || null,
        reservationDeadline: form.reservationDeadline || null,
        distributionInfo: form.distributionInfo,
        memberScope: form.memberScope,
        goalPerMember: form.goalPerMember || null,
        categories: form.categories,
        memberIds: form.memberIds,
        sponsorName: form.sponsorName,
        sponsorText: form.sponsorText,
        sponsorUrl: form.sponsorUrl,
        status: publish ? "active" : sale?.status || "draft",
      };
      const res = await fetch(
        mode === "edit" && sale ? `/api/support-sales/${sale.id}` : "/api/support-sales",
        {
          method: mode === "edit" ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enregistrement impossible");
      await uploadMedia(data.sale.id);
      toast.success(mode === "edit" ? "Vente mise à jour" : "Vente créée");
      router.push(`/tableau-de-bord/ventes-soutien/${data.sale.id}`);
      router.refresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout>
      <PageHeader
        title={mode === "edit" ? "Modifier la vente" : "Créer une vente"}
        subtitle="Une opération simple : le club lance la vente, les membres vendent à leur entourage."
      />

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(false);
        }}
      >
        <FormSection>
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A]">Produit</h2>
            <p className="mt-1 text-sm text-[#64748B]">Les informations visibles sur la page publique.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={`${dashboardLabelClass} mb-2 block`}>Nom de la vente</span>
              <input
                className={dashboardInputClass}
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Vente de fondue 2026"
                required
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={`${dashboardLabelClass} mb-2 block`}>Nom du produit</span>
              <input
                className={dashboardInputClass}
                value={form.productName}
                onChange={(e) => update("productName", e.target.value)}
                placeholder="Paquet de fondue 400 g"
                required
              />
            </label>
            <label className="block">
              <span className={`${dashboardLabelClass} mb-2 block`}>Prix unitaire (CHF)</span>
              <input
                className={dashboardInputClass}
                inputMode="decimal"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                placeholder="25"
                required
              />
            </label>
            <label className="block">
              <span className={`${dashboardLabelClass} mb-2 block`}>Quantité disponible (facultatif)</span>
              <input
                className={dashboardInputClass}
                inputMode="numeric"
                value={form.availableQuantity}
                onChange={(e) => update("availableQuantity", e.target.value)}
                placeholder="Illimitée"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={`${dashboardLabelClass} mb-2 block`}>Description</span>
              <textarea
                className={`${dashboardInputClass} min-h-28`}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Paquets de fondue à retirer auprès du joueur qui vous a proposé la vente."
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={`${dashboardLabelClass} mb-2 block`}>Image principale</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setImageFile(file);
                  setImagePreview(file ? URL.createObjectURL(file) : sale?.imageUrl || null);
                }}
                className="block w-full text-sm text-[#64748B]"
              />
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="" className="mt-3 h-36 w-full rounded-2xl object-cover" />
              ) : null}
            </label>
          </div>
        </FormSection>

        <FormSection>
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A]">Dates</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={`${dashboardLabelClass} mb-2 block`}>Date de début</span>
              <input
                type="date"
                className={dashboardInputClass}
                value={form.startDate}
                onChange={(e) => update("startDate", e.target.value)}
              />
            </label>
            <label className="block">
              <span className={`${dashboardLabelClass} mb-2 block`}>Date limite de réservation</span>
              <input
                type="date"
                className={dashboardInputClass}
                value={form.reservationDeadline}
                onChange={(e) => update("reservationDeadline", e.target.value)}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={`${dashboardLabelClass} mb-2 block`}>Distribution (facultatif)</span>
              <textarea
                className={`${dashboardInputClass} min-h-24`}
                value={form.distributionInfo}
                onChange={(e) => update("distributionInfo", e.target.value)}
                placeholder="Les produits seront remis aux joueurs le samedi 12 avril."
              />
            </label>
          </div>
        </FormSection>

        <FormSection>
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A]">Membres</h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Chaque réservation sera attribuée au membre qui a proposé la vente.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "Tous les membres"],
                ["categories", "Certaines équipes"],
                ["members", "Certains membres"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => update("memberScope", value)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold",
                  form.memberScope === value ? dashboardTabActiveClass : dashboardTabInactiveClass
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {form.memberScope === "categories" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {categoryOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex min-h-11 items-center gap-3 rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC] px-4 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={form.categories.includes(option.value)}
                    onChange={() => toggleCategory(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          ) : null}
          {form.memberScope === "members" ? (
            <div className="space-y-3">
              <input
                className={dashboardInputClass}
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                placeholder="Rechercher un membre…"
              />
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {filteredMembers.map((member) => (
                  <label
                    key={member.id}
                    className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC] px-4 text-sm"
                  >
                    <span>
                      <span className="font-medium text-[#0F172A]">{member.name}</span>
                      {member.category ? (
                        <span className="ml-2 text-[#64748B]">{formatCategoryLabel(member.category, t)}</span>
                      ) : null}
                    </span>
                    <input
                      type="checkbox"
                      checked={form.memberIds.includes(member.id)}
                      onChange={() => toggleMember(member.id)}
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : null}
          <label className="block max-w-xs">
            <span className={`${dashboardLabelClass} mb-2 block`}>Objectif par membre (facultatif)</span>
            <input
              className={dashboardInputClass}
              inputMode="numeric"
              value={form.goalPerMember}
              onChange={(e) => update("goalPerMember", e.target.value)}
              placeholder="5"
            />
          </label>
        </FormSection>

        <FormSection>
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A]">Sponsor</h2>
            <p className="mt-1 text-sm text-[#64748B]">Facultatif. Exemple : Cette vente est soutenue par Garage Müller.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={`${dashboardLabelClass} mb-2 block`}>Nom du sponsor</span>
              <input
                className={dashboardInputClass}
                value={form.sponsorName}
                onChange={(e) => update("sponsorName", e.target.value)}
                placeholder="Garage Müller"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={`${dashboardLabelClass} mb-2 block`}>Texte (facultatif)</span>
              <input
                className={dashboardInputClass}
                value={form.sponsorText}
                onChange={(e) => update("sponsorText", e.target.value)}
                placeholder="Garage Müller accompagne le club dans cette vente de soutien."
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={`${dashboardLabelClass} mb-2 block`}>Lien du site (facultatif)</span>
              <input
                className={dashboardInputClass}
                value={form.sponsorUrl}
                onChange={(e) => update("sponsorUrl", e.target.value)}
                placeholder="https://garage-muller.ch"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={`${dashboardLabelClass} mb-2 block`}>Logo ou image du sponsor</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setSponsorFile(file);
                  setSponsorPreview(file ? URL.createObjectURL(file) : sale?.sponsorLogoUrl || null);
                }}
                className="block w-full text-sm text-[#64748B]"
              />
              {sponsorPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sponsorPreview} alt="" className="mt-3 h-28 w-full max-w-md rounded-2xl object-contain bg-[#F8FAFC]" />
              ) : null}
            </label>
          </div>
        </FormSection>

        {mode === "edit" && sale ? (
          <SupportSaleAppearanceSettings saleId={sale.id} saleName={form.name || sale.name} canManage={canManage} />
        ) : null}

        <GlassCard className="flex flex-wrap items-center justify-end gap-3">
          <ActionButton
            type="button"
            variant="ghost"
            onClick={() => router.push(sale ? `/tableau-de-bord/ventes-soutien/${sale.id}` : "/tableau-de-bord/ventes-soutien")}
          >
            Annuler
          </ActionButton>
          <ActionButton type="submit" variant="surface" disabled={saving}>
            {mode === "edit" ? "Enregistrer" : "Enregistrer en brouillon"}
          </ActionButton>
          <DashboardPrimaryButton
            type="button"
            icon="none"
            loading={saving}
            onClick={() => void submit(true)}
          >
            Publier la vente
          </DashboardPrimaryButton>
        </GlassCard>
      </form>
    </PageLayout>
  );
}
