"use client";

import { QRCodeSVG } from "qrcode.react";
import PublicClubLogo from "@/components/public/PublicClubLogo";
import { getClubBrandPalette, getContrastTextColor, lightenHex } from "@/lib/public-page/colors";
import type { CardPublicData } from "@/lib/supporters/types";

export default function SupporterDigitalCard({ card }: { card: CardPublicData }) {
  const palette = getClubBrandPalette(card.primaryColor);
  const text = getContrastTextColor(card.primaryColor);
  const muted = text === "#ffffff" ? "rgba(255,255,255,0.78)" : "rgba(15,23,42,0.7)";
  const surface = lightenHex(card.primaryColor, 0.92);

  return (
    <article
      className="relative mx-auto w-full max-w-[22rem] overflow-hidden rounded-[1.75rem] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.18)]"
      style={{
        background: `linear-gradient(160deg, ${card.primaryColor} 0%, ${palette.primaryDark} 58%, #0f172a 140%)`,
        color: text,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #fff 0.6px, transparent 0.7px), radial-gradient(circle at 80% 70%, #fff 0.5px, transparent 0.6px)",
          backgroundSize: "18px 18px, 22px 22px",
        }}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <PublicClubLogo
            logoUrl={card.logoUrl}
            clubName={card.clubName}
            accentColor={card.primaryColor}
            size="md"
          />
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: muted }}>
            {card.offerName}
          </p>
        </div>
        <p className="mt-8 text-2xl font-semibold tracking-tight">
          {card.firstName} {card.lastName}
        </p>
        {card.supporterNumber ? (
          <p className="mt-1 text-lg font-medium tabular-nums" style={{ color: muted }}>
            {card.supporterNumber}
          </p>
        ) : null}
        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: muted }}>
              Saison
            </p>
            <p className="mt-1 text-sm font-semibold">{card.durationLabel}</p>
          </div>
          {card.endDateLabel ? (
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: muted }}>
                Valable jusqu’au
              </p>
              <p className="mt-1 text-sm font-semibold">{card.endDateLabel}</p>
            </div>
          ) : null}
        </div>
        {card.qrUrl ? (
          <div
            className="mx-auto mt-6 w-fit rounded-2xl p-3"
            style={{ backgroundColor: "#ffffff" }}
          >
            <QRCodeSVG value={card.qrUrl} size={148} includeMargin={false} bgColor="#ffffff" fgColor="#0f172a" />
          </div>
        ) : null}
        <p className="mt-4 text-center text-[11px] font-medium" style={{ color: muted }}>
          {card.statusLabel}
        </p>
      </div>
      <span className="sr-only" style={{ color: surface }}>
        {card.clubName}
      </span>
    </article>
  );
}
