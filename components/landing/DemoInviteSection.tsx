"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/I18nProvider";

function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function useIsCompact() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899px)");
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return compact;
}

function FounderAtmosphere({
  progress,
  reduceMotion,
  compact,
}: {
  progress: MotionValue<number>;
  reduceMotion: boolean;
  compact: boolean;
}) {
  const still = reduceMotion;
  const s = compact ? 0.42 : 1;

  // Courbe principale : traverse le bloc de gauche→droite au scroll
  const ribbonAX = useTransform(progress, [0, 1], still ? [0, 0] : [-160 * s, 110 * s]);
  const ribbonAY = useTransform(progress, [0, 1], still ? [0, 0] : [50 * s, -70 * s]);
  const ribbonAR = useTransform(progress, [0, 1], still ? [0, 0] : [-7 * s, 4 * s]);

  // Masse droite : descend / glisse
  const ribbonBX = useTransform(progress, [0, 1], still ? [0, 0] : [120 * s, -90 * s]);
  const ribbonBY = useTransform(progress, [0, 0.55, 1], still ? [0, 0, 0] : [-130 * s, -20 * s, 70 * s]);
  const ribbonBR = useTransform(progress, [0, 1], still ? [0, 0] : [6 * s, -4 * s]);

  // Accent bas : léger pivot
  const ribbonCX = useTransform(progress, [0, 1], still ? [0, 0] : [-80 * s, 95 * s]);
  const ribbonCY = useTransform(progress, [0, 1], still ? [0, 0] : [60 * s, -45 * s]);
  const ribbonCR = useTransform(progress, [0, 1], still ? [0, 0] : [-3 * s, 5 * s]);

  // Voile de dégradé qui se décale
  const washX = useTransform(progress, [0, 1], still ? [0, 0] : [-40 * s, 50 * s]);
  const washY = useTransform(progress, [0, 1], still ? [0, 0] : [30 * s, -35 * s]);
  const washOpacity = useTransform(progress, [0, 0.45, 1], still ? [0.55, 0.55, 0.55] : [0.35, 0.7, 0.5]);

  return (
    <div className="lp-demo-invite__atmosphere" aria-hidden>
      <motion.div
        className="lp-demo-invite__wash"
        style={{ x: washX, y: washY, opacity: washOpacity }}
      />

      <motion.svg
        className="lp-demo-invite__ribbon lp-demo-invite__ribbon--a"
        viewBox="0 0 1400 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        style={{ x: ribbonAX, y: ribbonAY, rotate: ribbonAR }}
      >
        <path
          d="M-200 560C60 180 280 120 480 280C700 460 900 500 1280 240C1420 120 1520 60 1600 20"
          stroke="rgba(59, 130, 246, 0.42)"
          strokeWidth="180"
          strokeLinecap="round"
        />
      </motion.svg>

      <motion.svg
        className="lp-demo-invite__ribbon lp-demo-invite__ribbon--b"
        viewBox="0 0 1200 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        style={{ x: ribbonBX, y: ribbonBY, rotate: ribbonBR }}
      >
        <path
          d="M1360 -60C1060 40 960 200 820 340C640 520 400 580 80 500C-40 460 -120 430 -200 410"
          stroke="rgba(26, 35, 255, 0.38)"
          strokeWidth="150"
          strokeLinecap="round"
        />
      </motion.svg>

      {!compact ? (
        <motion.svg
          className="lp-demo-invite__ribbon lp-demo-invite__ribbon--c"
          viewBox="0 0 1000 700"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          style={{ x: ribbonCX, y: ribbonCY, rotate: ribbonCR }}
        >
          <path
            d="M-120 520C140 380 320 460 520 420C740 370 900 260 1180 320"
            stroke="rgba(125, 211, 252, 0.28)"
            strokeWidth="110"
            strokeLinecap="round"
          />
        </motion.svg>
      ) : null}
    </div>
  );
}

export default function DemoInviteSection() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const compact = useIsCompact();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const still = Boolean(reduceMotion);
  const amp = compact ? 0.45 : 1;

  const contentY = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7],
    still ? [0, 0, 0] : [22 * amp, 0, -10 * amp]
  );
  const contentOpacity = useTransform(
    scrollYProgress,
    [0, 0.18, 0.85],
    still ? [1, 1, 1] : [0.55, 1, 1]
  );

  const whatsappUrl = buildWhatsAppUrl(
    t("marketing.askChatGpt.whatsappPhone"),
    t("marketing.demoInvite.whatsappMessage")
  );

  const titleLines = t("marketing.demoInvite.title").split("\n").filter(Boolean);

  return (
    <section className="lp-demo-invite" id="demo" ref={sectionRef}>
      <div className="lp-wrap">
        <div className="lp-demo-invite__stage">
          <div className="lp-demo-invite__panel">
            <FounderAtmosphere
              progress={scrollYProgress}
              reduceMotion={still}
              compact={compact}
            />

            <motion.div
              className="lp-demo-invite__copy"
              style={{ y: contentY, opacity: contentOpacity }}
            >
              <p className="lp-demo-invite__label">{t("marketing.demoInvite.label")}</p>

              <h2 className="lp-demo-invite__title display-title">
                {titleLines.map((line) => (
                  <span key={line} className="lp-demo-invite__title-line">
                    {line}
                  </span>
                ))}
              </h2>

              <p className="lp-demo-invite__lead">{t("marketing.demoInvite.description")}</p>

              <div className="lp-demo-invite__actions">
                <a
                  href={whatsappUrl}
                  className="lp-demo-invite__cta"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="lp-demo-invite__wa" aria-hidden>
                    <WhatsAppIcon className="lp-demo-invite__wa-icon" />
                  </span>
                  <span className="lp-demo-invite__cta-label">{t("marketing.demoInvite.cta")}</span>
                  <span className="lp-demo-invite__cta-arrow" aria-hidden>
                    <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                  </span>
                </a>
                <p className="lp-demo-invite__note">{t("marketing.demoInvite.note")}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
