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

  const palette = getClubBrandPalette(card.primaryColor);

  return (
    <div className="min-h-[100dvh] px-4 py-8 sm:py-12" style={{ background: palette.pageBackground }}>
      <div className="mx-auto max-w-md">
        <SupporterDigitalCard card={card} />
        <div className="mt-8 text-center">
          <p className="text-sm font-semibold text-[#0F172A]">{card.clubName}</p>
          <p className="mt-1 text-sm text-[#64748B]">{card.offerName}</p>
          <p className="mt-1 text-sm font-medium text-[#0F172A]">{card.statusLabel}</p>
          {card.endDateLabel ? (
            <p className="mt-1 text-sm text-[#64748B]">Valable jusqu’au {card.endDateLabel}</p>
          ) : null}
        </div>
        {card.benefits.length > 0 ? (
          <div className="mt-8 rounded-[1.25rem] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Vos avantages</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {card.benefits.map((b, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-emerald-600">✓</span>
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
