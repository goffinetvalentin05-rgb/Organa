"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "@/lib/icons";
import { CLUB_PUBLIC_PAGE_ANNOUNCEMENT_KEY } from "@/lib/public-page/constants";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";

export default function ClubPublicPageAnnouncementModal() {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(
          `/api/feature-announcements?key=${encodeURIComponent(CLUB_PUBLIC_PAGE_ANNOUNCEMENT_KEY)}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && !data.seen) {
          setOpen(true);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setChecked(true);
      }
    };

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  const markSeen = async () => {
    try {
      await fetch("/api/feature-announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: CLUB_PUBLIC_PAGE_ANNOUNCEMENT_KEY }),
      });
    } catch {
      /* ignore */
    }
  };

  const handleLater = async () => {
    await markSeen();
    setOpen(false);
  };

  const handleDiscover = async () => {
    await markSeen();
    setOpen(false);
  };

  if (!checked || !open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={() => void handleLater()}
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900/95 via-[#1A23FF]/90 to-slate-900/95 p-6 shadow-2xl text-white">
        <button
          type="button"
          onClick={() => void handleLater()}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">
          Nouveauté
        </p>
        <h2 className="mt-2 pr-8 text-xl font-bold sm:text-2xl">
          Nouvelle fonctionnalité disponible
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-white/85">
          Votre club dispose maintenant d&apos;une page publique personnalisée. Partagez un seul
          lien sur Instagram, Facebook ou WhatsApp pour permettre aux membres, supporters et
          visiteurs d&apos;accéder rapidement aux informations importantes de votre club.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/tableau-de-bord/parametres/page-publique"
            onClick={() => void handleDiscover()}
            className="flex-1"
          >
            <DashboardPrimaryButton type="button" className="w-full justify-center">
              Découvrir la fonctionnalité
            </DashboardPrimaryButton>
          </Link>
          <button
            type="button"
            onClick={() => void handleLater()}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
