"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useI18n } from "@/components/I18nProvider";
import { scrollReveal, viewportOnce } from "@/components/landing/landing-motion";
import { landingPremiumCardClass, landingPremiumCardDescClass } from "@/components/ui/styles";
import { landingSectionShellClass } from "@/components/landing/LandingSectionIntro";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export default function AskChatGptSection() {
  const { t } = useI18n();
  const whatsappUrl = buildWhatsAppUrl(
    t("marketing.askChatGpt.whatsappPhone"),
    t("marketing.askChatGpt.message")
  );

  return (
    <section id="demander-chatgpt" className={landingSectionShellClass()}>
      <motion.div
        variants={scrollReveal}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="relative mx-auto w-[94%] max-w-[820px]"
      >
        <div className={`${landingPremiumCardClass} landing-premium-card--flat-shadow px-6 py-10 text-center sm:px-8 sm:py-12 md:px-12 md:py-14`}>
          <div className="relative z-10 flex flex-col items-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/[0.06] px-3.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <Image
                src="/obillz-logo.png"
                alt={t("marketing.askChatGpt.logoAlt")}
                width={72}
                height={20}
                className="h-4 w-auto opacity-90"
              />
            </span>

            <h2 className="mt-6 max-w-xl text-balance text-2xl font-black leading-[1.12] tracking-tight text-[#F8FAFC] md:text-3xl lg:text-4xl">
              {t("marketing.askChatGpt.title")}
            </h2>

            <p className={`mt-4 max-w-lg text-sm md:text-base ${landingPremiumCardDescClass}`}>
              {t("marketing.askChatGpt.subtitle")}
            </p>

            <div className="mt-8">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 rounded-full border border-white/16 bg-[linear-gradient(180deg,#030B1F_0%,#06122E_100%)] px-7 py-3.5 text-base font-bold text-[#F8FAFC] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-white/22 md:px-8 md:py-4"
              >
                <WhatsAppIcon className="h-5 w-5 shrink-0" />
                <span>{t("marketing.askChatGpt.cta")}</span>
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
