"use client";

import { useRouter } from "next/navigation";
import { X, Users, FilePlus } from "@/lib/icons";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";

type NewFeaturesAnnouncementModalProps = {
  onDismiss: () => void;
  onDiscover: () => void;
};

export default function NewFeaturesAnnouncementModal({
  onDismiss,
  onDiscover,
}: NewFeaturesAnnouncementModalProps) {
  const router = useRouter();

  const handleDiscover = () => {
    onDiscover();
    router.push("/tableau-de-bord/clients");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onDismiss}
      />
      <div
        role="dialog"
        aria-labelledby="new-features-title"
        aria-modal="true"
        className="relative flex max-h-[min(90dvh,52rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-blue-400/25 bg-gradient-to-br from-[#0a0f2e]/98 via-[#0d1238]/98 to-[#111827]/98 shadow-[0_0_0_1px_rgba(147,197,253,0.12),0_24px_64px_rgba(0,0,0,0.55),0_0_80px_rgba(26,35,255,0.25)] backdrop-blur-2xl"
      >
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="overflow-y-auto px-6 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300/80">
            Annonce
          </p>
          <h2
            id="new-features-title"
            className="mt-2 pr-8 text-2xl font-bold text-white sm:text-3xl"
          >
            Nouveautés Obillz
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-base">
            Deux nouvelles fonctionnalités sont maintenant disponibles pour simplifier encore plus
            la gestion de votre club.
          </p>

          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-blue-400/20 bg-white/[0.04] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1A23FF]/20 ring-1 ring-blue-400/25">
                  <Users className="h-5 w-5 text-blue-300" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-white">Import de membres</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/65">
                    Ajoutez rapidement plusieurs membres depuis un fichier Excel ou CSV. Obillz
                    détecte les colonnes, vous laisse les faire correspondre aux champs du club et
                    importe les membres en quelques clics.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-blue-400/20 bg-white/[0.04] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1A23FF]/20 ring-1 ring-blue-400/25">
                  <FilePlus className="h-5 w-5 text-blue-300" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-white">PV de séances</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/65">
                    Créez vos procès-verbaux directement dans Obillz. Ajoutez les participants, les
                    points discutés, les décisions, les tâches à suivre, puis exportez un PDF propre
                    et prêt à partager.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <DashboardPrimaryButton
              type="button"
              icon="none"
              className="flex-1 justify-center"
              onClick={handleDiscover}
            >
              Découvrir
            </DashboardPrimaryButton>
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex flex-1 items-center justify-center rounded-full border border-white/20 bg-white/[0.05] px-5 py-2.5 text-sm font-semibold text-white/90 transition hover:border-white/30 hover:bg-white/[0.1]"
            >
              J&apos;ai compris
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
