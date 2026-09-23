"use client";

import { useI18n } from "@/components/I18nProvider";

type TrustKind = "tool" | "club";

const ITEMS: { id: string; label: string; kind: TrustKind }[] = [
  { id: "stripe", label: "Stripe", kind: "tool" },
  { id: "fontenais", label: "FC Fontenais", kind: "club" },
  { id: "resend", label: "Resend", kind: "tool" },
  { id: "porrentruy", label: "FC Porrentruy", kind: "club" },
  { id: "vercel", label: "Vercel", kind: "tool" },
  { id: "fontenais-b", label: "FC Fontenais", kind: "club" },
  { id: "supabase", label: "Supabase", kind: "tool" },
  { id: "porrentruy-b", label: "FC Porrentruy", kind: "club" },
];

function TrustRow({ copy }: { copy: "a" | "b" }) {
  return (
    <ul className="lp-hero-trust__row" aria-hidden={copy === "b" ? true : undefined}>
      {ITEMS.map((item) => (
        <li key={`${copy}-${item.id}`} className={`lp-hero-trust__item lp-hero-trust__item--${item.kind}`}>
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export default function HeroTrustRibbon() {
  const { t } = useI18n();

  return (
    <div className="lp-hero-trust">
      <p className="lp-hero-trust__label">{t("marketing.hero.trustLine")}</p>
      <div className="lp-hero-trust__marquee" aria-label={t("marketing.hero.trustAria")}>
        <div className="lp-hero-trust__ribbon">
          <TrustRow copy="a" />
          <TrustRow copy="b" />
        </div>
      </div>
    </div>
  );
}
