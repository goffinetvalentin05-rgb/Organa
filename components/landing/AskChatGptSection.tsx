"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useI18n } from "@/components/I18nProvider";
import { scrollReveal, viewportOnce } from "@/components/landing/landing-motion";
import { landingSectionGlowClass } from "@/components/ui/styles";

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
    <section id="demander-chatgpt" className="relative scroll-mt-24 py-16 md:py-28">
      <div className={landingSectionGlowClass} aria-hidden />

      <motion.div
        variants={scrollReveal}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="relative mx-auto w-[94%] max-w-[820px]"
      >
        <div className="relative overflow-hidden rounded-[1.75rem] border border-blue-400/30 bg-gradient-to-br from-[#0a0f2e]/95 via-[#0d1238]/98 to-[#111827]/95 px-6 py-10 text-center shadow-[0_0_0_1px_rgba(147,197,253,0.1),0_12px_56px_rgba(0,0,0,0.55),0_0_100px_rgba(26,35,255,0.22)] backdrop-blur-2xl sm:px-8 sm:py-12 md:px-12 md:py-14">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle,rgba(148,163,184,0.9)_1px,transparent_1px)] [background-size:24px_24px]"
            aria-hidden
          />

          <div
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full border border-[#1A23FF]/20 bg-[radial-gradient(circle,rgba(26,35,255,0.18),transparent_70%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full border border-indigo-400/15 bg-[radial-gradient(circle,rgba(99,102,241,0.14),transparent_70%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[min(420px,80%)] w-[min(520px,95%)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(26,35,255,0.2),transparent_65%)] blur-3xl"
            aria-hidden
          />

          <div className="relative z-10 flex flex-col items-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-sm">
              <Image
                src="/obillz-logo.png"
                alt={t("marketing.askChatGpt.logoAlt")}
                width={72}
                height={20}
                className="h-4 w-auto opacity-90"
              />
            </span>

            <h2 className="mt-6 max-w-xl text-balance text-2xl font-black leading-[1.12] tracking-tight text-white md:text-3xl lg:text-4xl">
              {t("marketing.askChatGpt.title")}
            </h2>

            <p className="mt-4 max-w-lg text-sm leading-relaxed text-blue-100/75 md:text-base">
              {t("marketing.askChatGpt.subtitle")}
            </p>

            <div className="mt-8">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center justify-center gap-2.5 rounded-full border border-white/20 bg-gradient-to-b from-slate-900 to-[#0a0f1e] px-7 py-3.5 text-base font-bold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_0_48px_rgba(26,35,255,0.45),0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)] transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-blue-300/40 hover:shadow-[0_0_0_1px_rgba(147,197,253,0.25),0_0_64px_rgba(26,35,255,0.6),0_12px_40px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.18)] md:px-8 md:py-4"
              >
                <span
                  className="pointer-events-none absolute -inset-1 rounded-full bg-[radial-gradient(circle,rgba(26,35,255,0.5),transparent_70%)] opacity-60 blur-xl transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden
                />
                <WhatsAppIcon className="relative h-5 w-5 shrink-0" />
                <span className="relative">{t("marketing.askChatGpt.cta")}</span>
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
