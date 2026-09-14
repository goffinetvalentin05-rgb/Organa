"use client";

import { QRCodeSVG } from "qrcode.react";
import { getContrastTextColor } from "@/lib/public-page/colors";
import type { CardPublicData } from "@/lib/supporters/types";
import { supportersPalette } from "@/lib/supporters/theme";
import SupportersClubMark from "./SupportersClubMark";

export default function SupporterDigitalCard({ card }: { card: CardPublicData }) {
  const palette = supportersPalette({
    primaryColor: card.primaryColor,
    secondaryColor: card.secondaryColor || card.primaryColor,
  });
  const text = getContrastTextColor(card.primaryColor) === "#ffffff" ? "#ffffff" : "#0f172a";
  const muted = text === "#ffffff" ? "rgba(255,255,255,0.78)" : "rgba(15,23,42,0.68)";

  return (
    <article
      className="relative mx-auto w-full max-w-[22.5rem] overflow-hidden rounded-[1.85rem] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.28)]"
      style={{
        background: `linear-gradient(155deg, ${card.primaryColor} 0%, ${palette.primaryDark} 52%, ${card.secondaryColor || "#0f172a"} 125%)`,
        color: text,
      }}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full opacity-30 blur-2xl"
        style={{ background: "#fff" }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full opacity-20 blur-2xl"
        style={{ background: card.secondaryColor }}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <SupportersClubMark
            logoUrl={card.logoUrl}
            clubName={card.clubName}
            accentColor={card.primaryColor}
            size="sm"
            tone="glass"
            className="mx-0"
          />
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em]" style={{ color: muted }}>
              {card.clubName}
            </p>
            <p className="mt-1 text-xs font-semibold">{card.offerName}</p>
          </div>
        </div>

        <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: muted }}>
          Supporter
        </p>
        <p className="mt-1 text-[1.7rem] font-semibold leading-tight tracking-tight">
          {card.firstName} {card.lastName}
        </p>
        {card.supporterNumber ? (
          <p className="mt-1 text-lg font-medium tabular-nums" style={{ color: muted }}>
            {card.supporterNumber}
          </p>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: muted }}>
              Validité
            </p>
            <p className="mt-1 text-sm font-semibold">{card.durationLabel}</p>
          </div>
          {card.endDateLabel ? (
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: muted }}>
                Jusqu’au
              </p>
              <p className="mt-1 text-sm font-semibold">{card.endDateLabel}</p>
            </div>
          ) : null}
        </div>

        {card.qrUrl ? (
          <div className="mx-auto mt-6 w-fit rounded-2xl bg-white p-3 shadow-[0_8px_24px_rgba(2,6,23,0.18)]">
            <QRCodeSVG value={card.qrUrl} size={148} includeMargin={false} bgColor="#ffffff" fgColor="#0f172a" />
          </div>
        ) : null}
        <p className="mt-4 text-center text-[11px] font-medium" style={{ color: muted }}>
          {card.statusLabel}
        </p>
      </div>
    </article>
  );
}
