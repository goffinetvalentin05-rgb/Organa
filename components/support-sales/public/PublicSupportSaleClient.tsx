"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PublicPageCanvas from "@/components/public-branding/PublicPageCanvas";
import PublicBrandingHero from "@/components/public-branding/PublicBrandingHero";
import { cn } from "@/components/ui";
import { ctaColors, resolvePublicLayout } from "@/lib/public-branding/theme";
import { useI18n } from "@/components/I18nProvider";
import { formatCategoryLabel } from "@/lib/members/taxonomy";
import { formatChf, lineTotalCents } from "@/lib/shop/money";
import type { PublicReservationResult, PublicSupportSale } from "@/lib/support-sales/types";

export default function PublicSupportSaleClient({ slug }: { slug: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetMember = searchParams.get("member");
  const [sale, setSale] = useState<PublicSupportSale | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buyerFirstName, setBuyerFirstName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [memberId, setMemberId] = useState(presetMember || "");
  const [memberQuery, setMemberQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/public/support-sales/${slug}`, { cache: "no-store" });
      if (!res.ok) {
        setError("Cette vente n’est pas disponible.");
        return;
      }
      const data = await res.json();
      setSale(data.sale);
      const members: PublicSupportSale["members"] = data.sale.members || [];
      if (presetMember && members.some((m) => m.id === presetMember)) {
        setMemberId(presetMember);
      }
    })();
  }, [slug, presetMember]);

  const selectedMember = sale?.members.find((m) => m.id === memberId) || null;
  const filteredMembers = useMemo(() => {
    if (!sale) return [];
    const q = memberQuery.trim().toLowerCase();
    if (!q) return sale.members;
    return sale.members.filter((m) => {
      const category = (m.category || "").toLowerCase();
      return m.name.toLowerCase().includes(q) || category.includes(q);
    });
  }, [sale, memberQuery]);

  if (error) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F4F7FB] px-4 text-center text-sm text-[#64748B]">
        {error}
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F4F7FB] text-sm text-[#64748B]">
        Chargement…
      </div>
    );
  }

  const theme = sale.theme || {
    label: "Vente de soutien",
    title: sale.name,
    subtitle: sale.productName,
    introText: sale.description,
    primaryColor: sale.primaryColor,
    secondaryColor: sale.secondaryColor,
    accentColor: sale.primaryColor,
    pageStyle: "colors" as const,
    imagePosition: "center" as const,
    overlayIntensity: "normal" as const,
    bannerUrl: null,
  };
  const layout = resolvePublicLayout(theme);
  const cta = ctaColors(theme.primaryColor, theme.secondaryColor);
  const totalCents = lineTotalCents(sale.priceCents, quantity);
  const hasSponsor = Boolean(sale.sponsorName || sale.sponsorText || sale.sponsorLogoUrl);

  const submit = async () => {
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/support-sales/${slug}/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerFirstName,
          quantity,
          memberId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Réservation impossible");
      const reservation = data.reservation as PublicReservationResult;
      const params = new URLSearchParams({
        n: reservation.buyerFirstName,
        q: String(reservation.quantity),
        m: reservation.memberName,
        t: String(reservation.totalCents),
        p: reservation.productName,
      });
      router.push(`/vente/${slug}/succes?${params.toString()}`);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Réservation impossible");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicPageCanvas theme={theme}>
      <PublicBrandingHero clubName={sale.clubName} logoUrl={sale.logoUrl} theme={theme} />

      <main className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:-mt-8 sm:pb-20">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className={cn("overflow-hidden rounded-[1.5rem]", layout.surfaceClass)}>
            {sale.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sale.imageUrl} alt={sale.productName} className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square items-center justify-center bg-[#F1F5F9] text-sm text-[#94A3B8]">
                {sale.productName}
              </div>
            )}
          </div>

          <div className={cn("rounded-[1.5rem] p-5 sm:p-6", layout.surfaceClass)}>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{sale.name}</h1>
            <p className="mt-1 text-sm text-[#64748B]">{sale.productName}</p>
            <p className="mt-3 text-2xl font-semibold" style={{ color: theme.primaryColor }}>
              {formatChf(sale.priceCents)}
            </p>
            {sale.reservationDeadline ? (
              <p className="mt-2 text-sm text-[#64748B]">
                Date limite :{" "}
                {new Date(`${sale.reservationDeadline}T00:00:00`).toLocaleDateString("fr-CH")}
              </p>
            ) : null}
            {sale.description ? (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#64748B]">
                {sale.description}
              </p>
            ) : null}

            {sale.acceptsReservations ? (
              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Votre prénom</span>
                  <input
                    className="h-12 w-full rounded-xl border border-[rgba(15,23,42,0.12)] bg-white px-4 text-sm"
                    value={buyerFirstName}
                    onChange={(e) => setBuyerFirstName(e.target.value)}
                    placeholder="Marie"
                    autoComplete="given-name"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Quantité</span>
                  <input
                    type="number"
                    min={1}
                    max={sale.remainingQuantity ?? 99}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="h-12 w-24 rounded-xl border border-[rgba(15,23,42,0.12)] bg-white px-3 text-center text-sm"
                  />
                </label>

                <div>
                  <p className="mb-2 text-sm font-medium">Cette vente vous a été proposée par</p>
                  {selectedMember ? (
                    <div className="mb-2 flex items-center justify-between rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC] px-4 py-3">
                      <div>
                        <p className="font-semibold text-[#0F172A]">{selectedMember.name}</p>
                        {selectedMember.category ? (
                          <p className="text-sm text-[#64748B]">
                            {formatCategoryLabel(selectedMember.category, t)}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className="text-sm font-medium text-[#1A23FF]"
                        onClick={() => setMemberId("")}
                      >
                        Modifier
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        className="mb-2 h-12 w-full rounded-xl border border-[rgba(15,23,42,0.12)] bg-white px-4 text-sm"
                        value={memberQuery}
                        onChange={(e) => setMemberQuery(e.target.value)}
                        placeholder="Rechercher un membre…"
                      />
                      <div className="max-h-56 space-y-2 overflow-y-auto">
                        {filteredMembers.map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => setMemberId(member.id)}
                            className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white px-4 text-left"
                          >
                            <span className="font-medium text-[#0F172A]">{member.name}</span>
                            {member.category ? (
                              <span className="text-sm text-[#64748B]">
                                {formatCategoryLabel(member.category, t)}
                              </span>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-[#F8FAFC] px-4 py-3">
                  <span className="text-sm text-[#64748B]">Total</span>
                  <span className="text-lg font-semibold text-[#0F172A]">{formatChf(totalCents)}</span>
                </div>

                {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void submit()}
                  className="flex h-12 w-full items-center justify-center rounded-full px-5 text-sm font-semibold disabled:opacity-50"
                  style={{ backgroundColor: cta.background, color: cta.color }}
                >
                  {submitting ? "Réservation…" : "Réserver"}
                </button>
              </div>
            ) : (
              <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Les réservations sont terminées pour cette vente.
              </p>
            )}
          </div>
        </div>

        {hasSponsor ? (
          <section className={cn("mt-10 overflow-hidden rounded-[1.75rem] sm:mt-12", layout.surfaceClass)}>
            <div className="px-5 pt-6 sm:px-8 sm:pt-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#94A3B8]">
                Cette vente est soutenue par
              </p>
              {sale.sponsorName ? (
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0F172A] sm:text-3xl">
                  {sale.sponsorName}
                </h2>
              ) : null}
            </div>
            {sale.sponsorLogoUrl ? (
              sale.sponsorUrl ? (
                <a
                  href={sale.sponsorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 block px-5 sm:px-8"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sale.sponsorLogoUrl}
                    alt={sale.sponsorName || "Sponsor"}
                    className="mx-auto max-h-56 w-full rounded-2xl object-contain sm:max-h-72"
                  />
                </a>
              ) : (
                <div className="mt-5 px-5 sm:px-8">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sale.sponsorLogoUrl}
                    alt={sale.sponsorName || "Sponsor"}
                    className="mx-auto max-h-56 w-full rounded-2xl object-contain sm:max-h-72"
                  />
                </div>
              )
            ) : null}
            <div className="px-5 py-6 sm:px-8 sm:py-8">
              {sale.sponsorText ? (
                <p className="text-base leading-relaxed text-[#475569] sm:text-lg">{sale.sponsorText}</p>
              ) : sale.sponsorName ? (
                <p className="text-base leading-relaxed text-[#475569] sm:text-lg">
                  {sale.sponsorName} accompagne {sale.clubName} dans cette vente de soutien.
                </p>
              ) : null}
              {sale.sponsorUrl ? (
                <a
                  href={sale.sponsorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex text-sm font-semibold"
                  style={{ color: theme.primaryColor }}
                >
                  Découvrir le sponsor
                </a>
              ) : null}
            </div>
          </section>
        ) : null}
      </main>
    </PublicPageCanvas>
  );
}
