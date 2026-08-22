"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { easePremium, viewportOnce } from "@/components/landing/landing-motion";

function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export default function FinalCtaSection() {
  const { t } = useI18n();
  const whatsappUrl = buildWhatsAppUrl(
    t("marketing.askChatGpt.whatsappPhone"),
    t("marketing.askChatGpt.message")
  );

  return (
    <section id="cta-final" className="lp-section lp-section--soft">
      <div className="lp-wrap">
        <motion.div
          className="lp-cta relative py-8 md:py-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.7, ease: easePremium }}
        >
          <div className="lp-cta__glow" aria-hidden />
          <div className="relative z-10">
            <h2 className="lp-title">{t("marketing.finalCta.title")}</h2>
            <p className="lp-lead">{t("marketing.finalCta.subtitle")}</p>
            <div className="lp-hero-ctas mt-8">
              <Link
                href="/inscription"
                className="landing-hero-cta group inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-[0.9375rem] font-semibold text-white sm:px-9 sm:py-4"
              >
                {t("marketing.finalCta.cta")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/#modules" className="lp-hero-secondary">
                {t("marketing.finalCta.discover")}
              </Link>
            </div>
            <p className="mt-5 text-sm font-medium text-slate-500">
              <a href={whatsappUrl} className="underline-offset-2 hover:text-slate-800 hover:underline">
                {t("marketing.askChatGpt.cta")}
              </a>
              <span className="mx-2 text-slate-300">·</span>
              <Link href="/connexion" className="underline-offset-2 hover:text-slate-800 hover:underline">
                {t("marketing.finalCta.loginPrompt")}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
