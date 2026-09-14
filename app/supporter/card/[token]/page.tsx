import { getCardByToken } from "@/lib/supporters/public";
import SupporterDigitalCard from "@/components/supporters/public/SupporterDigitalCard";
import { getClubBrandPalette } from "@/lib/public-page/colors";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Carte supporter",
  robots: { index: false, follow: false },
};

export default async function SupporterCardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const card = await getCardByToken(token);

  if (!card) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#0f172a] px-6 text-center text-white">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">Carte</p>
          <h1 className="mt-3 text-2xl font-semibold">Carte introuvable</h1>
        </div>
      </div>
    );
  }

  const palette = getClubBrandPalette(card.primaryColor, card.secondaryColor);

  return (
    <div
      className="min-h-[100dvh] px-4 py-8 sm:py-12"
      style={{ background: palette.pageBackground }}
    >
      <div className="mx-auto max-w-md">
        <p className="mb-5 text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-[#94A3B8]">
          Carte digitale
        </p>
        <SupporterDigitalCard card={card} />
        <div className="mt-8 text-center">
          <p className="text-base font-semibold text-[#0F172A]">{card.clubName}</p>
          <p className="mt-1 text-sm text-[#64748B]">{card.offerName}</p>
          <p className="mt-2 text-sm font-medium text-[#0F172A]">{card.statusLabel}</p>
          {card.endDateLabel ? (
            <p className="mt-1 text-sm text-[#64748B]">Valable jusqu’au {card.endDateLabel}</p>
          ) : null}
        </div>
        {card.benefits.length > 0 ? (
          <div className="mt-8 rounded-[1.5rem] border border-[rgba(15,23,42,0.06)] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <h2 className="text-sm font-semibold">Vos avantages</h2>
            <ul className="mt-3 space-y-2.5 text-sm">
              {card.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ backgroundColor: card.primaryColor }}
                  >
                    ✓
                  </span>
                  <span>{b.label}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
