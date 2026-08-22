"use client";

import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Bell, CalendarDays, Check, FileSpreadsheet, Mail, MessageCircle } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useI18n } from "@/components/I18nProvider";
import { easePremium, viewportOnce } from "@/components/landing/landing-motion";
import { cn, dashboardGlassCardClass } from "@/components/ui";

function FloatCard({
  className,
  delay = 0,
  reduceMotion,
  children,
}: {
  className?: string;
  delay?: number;
  reduceMotion: boolean | null;
  children: ReactNode;
}) {
  return (
    <motion.div
      className={className}
      animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
      transition={{ duration: 8.2 + delay, repeat: Infinity, ease: "easeInOut", delay }}
    >
      {children}
    </motion.div>
  );
}

export default function TimeSavedSection() {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sceneRef, { once: true, amount: 0.4 });
  const reduceMotion = useReducedMotion();
  const [played, setPlayed] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const clusterY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [8, -10]);

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      setPlayed(true);
      return;
    }
    const id = window.setTimeout(() => setPlayed(true), 850);
    return () => window.clearTimeout(id);
  }, [inView, reduceMotion]);

  const collected = played ? 32 : 31;

  return (
    <section
      ref={sectionRef}
      id="pourquoi-obillz"
      className="lp-time-saved scroll-mt-32 md:scroll-mt-36"
    >
      <div className="lp-time-saved__stage">
        <div className="lp-time-saved__inner">
          <motion.div
            className="lp-time-saved__copy"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.7, ease: easePremium }}
          >
            <p className="lp-eyebrow">{t("marketing.timeSaved.label")}</p>
            <h2 className="lp-title lp-time-saved__title">{t("marketing.timeSaved.title")}</h2>
            <p className="lp-lead lp-time-saved__lead">{t("marketing.timeSaved.description")}</p>
            <p className="lp-time-saved__aside">{t("marketing.timeSaved.aside")}</p>
          </motion.div>

          <div ref={sceneRef} className="lp-time-saved__scene">
            <div className="lp-time-saved__atmosphere" aria-hidden>
              <div className="lp-time-saved__ghost lp-time-saved__ghost--wa">
                <span className="lp-time-saved__ghost-icon lp-time-saved__ghost-icon--wa">
                  <MessageCircle className="h-3.5 w-3.5" strokeWidth={2.4} />
                </span>
                <span>Coach U15 — tu relances les impayés ?</span>
              </div>
              <div className="lp-time-saved__ghost lp-time-saved__ghost--mail">
                <span className="lp-time-saved__ghost-icon">
                  <Mail className="h-3.5 w-3.5" strokeWidth={2.4} />
                </span>
                <span>3 relances en attente</span>
              </div>
              <div className="lp-time-saved__ghost lp-time-saved__ghost--excel">
                <span className="lp-time-saved__ghost-icon lp-time-saved__ghost-icon--excel">
                  <FileSpreadsheet className="h-3.5 w-3.5" strokeWidth={2.4} />
                </span>
                <span>cotisations.xlsx</span>
              </div>
              <div className="lp-time-saved__ghost lp-time-saved__ghost--late">
                <span className="lp-time-saved__ghost-icon">
                  <Bell className="h-3.5 w-3.5" strokeWidth={2.4} />
                </span>
                <span>12 cotisations en retard</span>
              </div>
              <div className="lp-time-saved__ghost lp-time-saved__ghost--agenda">
                <span className="lp-time-saved__ghost-icon">
                  <CalendarDays className="h-3.5 w-3.5" strokeWidth={2.4} />
                </span>
                <span>AG · mardi 20h</span>
              </div>
            </div>

            <div className="lp-time-saved__person">
              <Image
                src="/images/landing/time-saved-overwhelmed.png"
                alt={t("marketing.timeSaved.personAlt")}
                width={1024}
                height={1536}
                className="lp-time-saved__photo"
                sizes="(max-width: 760px) 92vw, (max-width: 1200px) 58vw, 720px"
                priority={false}
              />

              <motion.div className="lp-time-saved__cluster" style={{ y: clusterY }} aria-hidden>
                <FloatCard className="lp-time-saved__card lp-time-saved__card--fees" delay={0} reduceMotion={reduceMotion}>
                  <div className={cn(dashboardGlassCardClass, "p-4 sm:p-5")}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">
                      {t("marketing.timeSaved.collected")}
                    </p>
                    <p className="mt-1.5 text-[1.45rem] font-semibold tabular-nums tracking-tight text-[#0F172A]">
                      {collected} / 37
                    </p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EEF2FF]">
                      <motion.div
                        className="h-full rounded-full bg-[#1A23FF]"
                        initial={false}
                        animate={{ width: `${(collected / 37) * 100}%` }}
                        transition={{ duration: 0.75, ease: easePremium }}
                      />
                    </div>
                  </div>
                </FloatCard>

                <AnimatePresence>
                  {played ? (
                    <motion.div
                      className="lp-time-saved__card lp-time-saved__card--toast"
                      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.55, ease: easePremium }}
                    >
                      <div className="lp-time-saved__pill">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <Check className="h-3 w-3" strokeWidth={2.6} />
                        </span>
                        {t("marketing.timeSaved.paymentReceived")}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <FloatCard className="lp-time-saved__card lp-time-saved__card--ready" delay={1.1} reduceMotion={reduceMotion}>
                  <div className="lp-time-saved__pill">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <Check className="h-3 w-3" strokeWidth={2.6} />
                    </span>
                    {t("marketing.timeSaved.planningReady")}
                  </div>
                </FloatCard>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
