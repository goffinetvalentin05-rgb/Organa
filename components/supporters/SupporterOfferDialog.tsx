"use client";

import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import PremiumSwitch from "@/components/public-page/PremiumSwitch";
import {
  ActionButton,
  cn,
  dashboardInputClass,
  dashboardLabelClass,
  dashboardModalClass,
  dashboardSelectClass,
} from "@/components/ui";
import { Plus, Trash, X } from "@/lib/icons";
import type { SupporterDurationType } from "@/lib/supporters/types";

export type OfferFormState = {
  name: string;
  description: string;
  price: string;
  durationType: SupporterDurationType;
  startDate: string;
  endDate: string;
  maxSupporters: string;
  isActive: boolean;
  isFeatured: boolean;
  showSupporterCount: boolean;
  benefits: string[];
};

export function defaultSeasonDates() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (month >= 6) {
    return { start: `${year}-07-01`, end: `${year + 1}-06-30` };
  }
  return { start: `${year - 1}-07-01`, end: `${year}-06-30` };
}

export function emptyOfferForm(): OfferFormState {
  const season = defaultSeasonDates();
  return {
    name: "",
    description: "",
    price: "",
    durationType: "season",
    startDate: season.start,
    endDate: season.end,
    maxSupporters: "",
    isActive: true,
    isFeatured: false,
    showSupporterCount: true,
    benefits: [""],
  };
}

type SupporterOfferDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  form: OfferFormState;
  saving: boolean;
  onChange: (next: OfferFormState) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function SupporterOfferDialog({
  open,
  mode,
  form,
  saving,
  onChange,
  onClose,
  onSubmit,
}: SupporterOfferDialogProps) {
  if (!open) return null;

  const needsDates = form.durationType !== "year";

  const set = (patch: Partial<OfferFormState>) => onChange({ ...form, ...patch });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#071634]/50 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="supporter-offer-dialog-title"
        className={cn(dashboardModalClass, "max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="supporter-offer-dialog-title" className="text-lg font-semibold">
            {mode === "edit" ? "Modifier l’offre" : "Nouvelle offre"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className={dashboardLabelClass}>Nom de l’offre</label>
            <input
              className={dashboardInputClass}
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="Supporter+"
            />
          </div>
          <div>
            <label className={dashboardLabelClass}>Courte description</label>
            <textarea
              className={cn(dashboardInputClass, "min-h-[72px]")}
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="Soutenez le club tout au long de la saison."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={dashboardLabelClass}>Prix (CHF)</label>
              <input
                className={dashboardInputClass}
                value={form.price}
                onChange={(e) => set({ price: e.target.value })}
                placeholder="50"
              />
            </div>
            <div>
              <label className={dashboardLabelClass}>Durée</label>
              <select
                className={dashboardSelectClass}
                value={form.durationType}
                onChange={(e) =>
                  set({ durationType: e.target.value as SupporterDurationType })
                }
              >
                <option value="season">Saison</option>
                <option value="year">1 année</option>
                <option value="custom">Période personnalisée</option>
              </select>
            </div>
          </div>
          {needsDates ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={dashboardLabelClass}>Date de début</label>
                <input
                  type="date"
                  className={dashboardInputClass}
                  value={form.startDate}
                  onChange={(e) => set({ startDate: e.target.value })}
                />
              </div>
              <div>
                <label className={dashboardLabelClass}>Date de fin</label>
                <input
                  type="date"
                  className={dashboardInputClass}
                  value={form.endDate}
                  onChange={(e) => set({ endDate: e.target.value })}
                />
              </div>
            </div>
          ) : null}
          <div>
            <label className={dashboardLabelClass}>Nombre maximum de supporters (optionnel)</label>
            <input
              className={dashboardInputClass}
              value={form.maxSupporters}
              onChange={(e) => set({ maxSupporters: e.target.value })}
              placeholder="Illimité"
            />
          </div>
          <div className="space-y-1">
            <p className={dashboardLabelClass}>Avantages</p>
            {form.benefits.map((label, index) => (
              <div key={index} className="flex gap-2">
                <input
                  className={dashboardInputClass}
                  value={label}
                  onChange={(e) => {
                    const benefits = [...form.benefits];
                    benefits[index] = e.target.value;
                    set({ benefits });
                  }}
                  placeholder="Nom sur le mur des supporters"
                />
                <button
                  type="button"
                  className="rounded-xl px-2 text-[#94A3B8] hover:text-[#0F172A]"
                  onClick={() => {
                    if (index === 0) return;
                    const benefits = [...form.benefits];
                    [benefits[index - 1], benefits[index]] = [benefits[index], benefits[index - 1]];
                    set({ benefits });
                  }}
                  aria-label="Monter"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="rounded-xl px-2 text-[#94A3B8] hover:text-[#0F172A]"
                  onClick={() => {
                    if (index >= form.benefits.length - 1) return;
                    const benefits = [...form.benefits];
                    [benefits[index + 1], benefits[index]] = [benefits[index], benefits[index + 1]];
                    set({ benefits });
                  }}
                  aria-label="Descendre"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="rounded-xl px-2 text-[#94A3B8] hover:text-rose-600"
                  onClick={() =>
                    set({ benefits: form.benefits.filter((_, i) => i !== index) })
                  }
                  aria-label="Supprimer"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            ))}
            <ActionButton
              variant="ghost"
              type="button"
              onClick={() => set({ benefits: [...form.benefits, ""] })}
            >
              <Plus className="h-4 w-4" /> Ajouter un avantage
            </ActionButton>
          </div>
          <div className="space-y-2 rounded-2xl bg-[#F8FAFC] p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Offre active</span>
              <PremiumSwitch
                checked={form.isActive}
                onChange={(v) => set({ isActive: v })}
                aria-label="Offre active"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Mettre l’offre en avant</span>
              <PremiumSwitch
                checked={form.isFeatured}
                onChange={(v) => set({ isFeatured: v })}
                aria-label="Mettre en avant"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Afficher le nombre de supporters</span>
              <PremiumSwitch
                checked={form.showSupporterCount}
                onChange={(v) => set({ showSupporterCount: v })}
                aria-label="Afficher le nombre"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <ActionButton variant="ghost" type="button" onClick={onClose}>
              Annuler
            </ActionButton>
            <DashboardPrimaryButton
              type="button"
              icon="none"
              loading={saving}
              loadingLabel="Création..."
              onClick={onSubmit}
            >
              {mode === "edit" ? "Enregistrer" : "Créer l’offre"}
            </DashboardPrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
