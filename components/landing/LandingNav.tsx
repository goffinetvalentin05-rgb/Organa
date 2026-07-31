"use client";

import ObillzFloatingNav from "@/components/ObillzFloatingNav";
import { useI18n } from "@/components/I18nProvider";

export default function LandingNav() {
  const { t } = useI18n();

  return (
    <ObillzFloatingNav
      product="sport"
      homeHref="/"
      links={[
        { href: "#comment-ca-marche", label: t("marketing.nav.howItWorks") },
        { href: "#modules", label: t("marketing.nav.modules") },
        { href: "#tarifs", label: t("marketing.nav.pricing") },
        { href: "#faq", label: t("marketing.nav.faq") },
      ]}
      cta={{
        href: "/inscription",
        label: t("marketing.nav.cta"),
      }}
    />
  );
}
