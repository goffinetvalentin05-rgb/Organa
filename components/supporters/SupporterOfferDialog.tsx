"use client";

import { useEffect } from "react";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import PremiumSwitch from "@/components/public-page/PremiumSwitch";
import {
  ActionButton,
  BodyPortal,
  cn,
  dashboardInputClass,
  dashboardLabelClass,
  dashboardModalClass,
  dashboardSelectClass,
} from "@/components/ui";
import { ChevronDown, Plus, Trash, X } from "@/lib/icons";
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

const benefitIconBtnClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#94A3B8] transition hover:bg-[#F1F5F9] hover:text-[#0F172A] disabled:pointer-events-none disabled:opacity-30";

export default function SupporterOfferDialog({
  open,
  mode,
  form,
  saving,
  onChange,
  onClose,
  onSubmit,
}: SupporterOfferDialogProps) {
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const { overflow: prevHtmlOverflow } = html.style;
    const { overflow: prevBodyOverflow } = document.body.style;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, saving, onClose]);

  const needsDates = form.durationType !== "year";
  const set = (patch: Partial<OfferFormState>) => onChange({ ...form, ...patch });

  const moveBenefit = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= form.benefits.length) return;
    const benefits = [...form.benefits];
    [benefits[index], benefits[target]] = [benefits[target], benefits[index]];
    set({ benefits });
  };

  return (
    <BodyPortal open={open}>
      <div
        className="pointer-events-auto fixed inset-0 z-[9999] flex items-center justify-center bg-[#071634]/30 p-2 backdrop-blur-[2px] sm:p-5"
        role="presentation"
        onClick={(event) => {
          if (saving) return;
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div className="flex max-h-full min-h-0 w-full max-w-[calc(100vw-16px)] sm:max-w-[min(680px,calc(100vw-32px))] flex-col">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="supporter-offer-dialog-title"
            aria-busy={saving || undefined}
            className={cn(dashboardModalClass, "flex max-h-full min-h-0 w-full flex-col overflow-hidden")}
            onClick={(event) => event.stopPropagation()}
          >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[rgba(15,23,42,0.06)] px-5 py-3.5 sm:px-6">
            <h2 id="supporter-offer-dialog-title" className="text-lg font-semibold">
              {mode === "edit" ? "Modifier l’offre" : "Nouvelle offre"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Fermer"
              className="rounded-lg p-1.5 text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#0F172A] disabled:opacity-40"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
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
                  className={cn(dashboardInputClass, "min-h-[64px] max-h-28 resize-y py-2")}
                  value={form.description}
                  onChange={(e) => set({ description: e.target.value })}
                  placeholder="Soutenez le club tout au long de la saison."
                  rows={2}
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
                    inputMode="decimal"
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
                <label className={dashboardLabelClass}>
                  Nombre maximum de supporters (optionnel)
                </label>
                <input
                  className={dashboardInputClass}
                  value={form.maxSupporters}
                  onChange={(e) => set({ maxSupporters: e.target.value })}
                  placeholder="Illimité"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-2">
                <p className={dashboardLabelClass}>Avantages</p>
                <div className="space-y-1.5">
                  {form.benefits.map((label, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <input
                        className={cn(dashboardInputClass, "min-w-0 flex-1")}
                        value={label}
                        onChange={(e) => {
                          const benefits = [...form.benefits];
                          benefits[index] = e.target.value;
                          set({ benefits });
                        }}
                        placeholder="Nom sur le mur des supporters"
                      />
                      <div className="flex shrink-0 items-center">
                        <button
                          type="button"
                          className={benefitIconBtnClass}
                          onClick={() => moveBenefit(index, -1)}
                          disabled={index === 0}
                          aria-label="Monter"
                        >
                          <ChevronDown className="h-4 w-4 rotate-180" />
                        </button>
                        <button
                          type="button"
                          className={benefitIconBtnClass}
                          onClick={() => moveBenefit(index, 1)}
                          disabled={index >= form.benefits.length - 1}
                          aria-label="Descendre"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className={cn(benefitIconBtnClass, "hover:text-rose-600")}
                          onClick={() =>
                            set({ benefits: form.benefits.filter((_, i) => i !== index) })
                          }
                          aria-label="Supprimer"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <ActionButton
                  variant="ghost"
                  type="button"
                  className="min-h-9 px-2 py-1.5 text-[#1A23FF] hover:bg-[rgba(26,35,255,0.06)] hover:text-[#1A23FF]"
                  onClick={() => set({ benefits: [...form.benefits, ""] })}
                >
                  <Plus className="h-4 w-4" /> Ajouter un avantage
                </ActionButton>
              </div>
              <div className="divide-y divide-[rgba(15,23,42,0.06)] overflow-hidden rounded-xl border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC]">
                <div className="flex items-center justify-between gap-3 px-3.5 py-1.5">
                  <span className="text-sm font-medium">Offre active</span>
                  <PremiumSwitch
                    checked={form.isActive}
                    onChange={(v) => set({ isActive: v })}
                    aria-label="Offre active"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 px-3.5 py-1.5">
                  <span className="text-sm font-medium">Mettre l’offre en avant</span>
                  <PremiumSwitch
                    checked={form.isFeatured}
                    onChange={(v) => set({ isFeatured: v })}
                    aria-label="Mettre en avant"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 px-3.5 py-1.5">
                  <span className="text-sm font-medium">Afficher le nombre de supporters</span>
                  <PremiumSwitch
                    checked={form.showSupporterCount}
                    onChange={(v) => set({ showSupporterCount: v })}
                    aria-label="Afficher le nombre"
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            className="flex shrink-0 items-center justify-end gap-2 border-t border-[rgba(15,23,42,0.06)] bg-[#FAFBFD] px-5 py-3 sm:px-6"
            style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
          >
            <ActionButton variant="surface" type="button" onClick={onClose} disabled={saving}>
              Annuler
            </ActionButton>
            <DashboardPrimaryButton
              type="button"
              icon="none"
              loading={saving}
              disabled={saving}
              loadingLabel={mode === "edit" ? "Enregistrement..." : "Création..."}
              onClick={onSubmit}
            >
              {mode === "edit" ? "Enregistrer" : "Créer l’offre"}
            </DashboardPrimaryButton>
          </div>
          </div>
        </div>
      </div>
    </BodyPortal>
  );
}
