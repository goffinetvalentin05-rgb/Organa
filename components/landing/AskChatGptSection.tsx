"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useI18n } from "@/components/I18nProvider";
import { scrollReveal, viewportOnce } from "@/components/landing/landing-motion";
import { landingSectionGlowClass } from "@/components/ui/styles";

function ChatGptIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.074.074 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.786a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.163a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
    </svg>
  );
}

export default function AskChatGptSection() {
  const { t } = useI18n();
  const prompt = t("marketing.askChatGpt.prompt");
  const chatGptUrl = `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;

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
                href={chatGptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center justify-center gap-2.5 rounded-full border border-white/20 bg-gradient-to-b from-slate-900 to-[#0a0f1e] px-7 py-3.5 text-base font-bold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_0_48px_rgba(26,35,255,0.45),0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)] transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-blue-300/40 hover:shadow-[0_0_0_1px_rgba(147,197,253,0.25),0_0_64px_rgba(26,35,255,0.6),0_12px_40px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.18)] md:px-8 md:py-4"
              >
                <span
                  className="pointer-events-none absolute -inset-1 rounded-full bg-[radial-gradient(circle,rgba(26,35,255,0.5),transparent_70%)] opacity-60 blur-xl transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden
                />
                <ChatGptIcon className="relative h-5 w-5 shrink-0" />
                <span className="relative">{t("marketing.askChatGpt.cta")}</span>
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
