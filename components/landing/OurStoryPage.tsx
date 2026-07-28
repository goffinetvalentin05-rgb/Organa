"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  FileSpreadsheet,
  Lightbulb,
  MessageCircle,
  Sparkles,
  Trophy,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useRef } from "react";
import { useI18n } from "@/components/I18nProvider";
import {
  LandingPrimaryButton,
} from "@/components/landing/LandingButtons";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingNav from "@/components/landing/LandingNav";
import { easePremium } from "@/components/landing/landing-motion";
import { obillzLandingRootClass } from "@/components/ui/styles";

type StepAlign = "left" | "right" | "center";
type StepSize = "sm" | "md" | "lg";

type FloatIcon = {
  Icon: LucideIcon;
  className: string;
};

type StoryStep = {
  key: "grandir" | "observer" | "idee" | "creer" | "construire";
  align: StepAlign;
  size: StepSize;
  Icon: LucideIcon;
  floats: FloatIcon[];
};

const STORY_STEPS: StoryStep[] = [
  {
    key: "grandir",
    align: "left",
    size: "lg",
    Icon: Trophy,
    floats: [
      { Icon: Trophy, className: "our-story-float our-story-float--a" },
      { Icon: Users, className: "our-story-float our-story-float--b" },
      { Icon: CalendarDays, className: "our-story-float our-story-float--c" },
    ],
  },
  {
    key: "observer",
    align: "right",
    size: "md",
    Icon: FileSpreadsheet,
    floats: [
      { Icon: FileSpreadsheet, className: "our-story-float our-story-float--d" },
      { Icon: MessageCircle, className: "our-story-float our-story-float--e" },
      { Icon: ClipboardList, className: "our-story-float our-story-float--f" },
    ],
  },
  {
    key: "idee",
    align: "center",
    size: "lg",
    Icon: Lightbulb,
    floats: [
      { Icon: Lightbulb, className: "our-story-float our-story-float--g" },
      { Icon: Sparkles, className: "our-story-float our-story-float--h" },
    ],
  },
  {
    key: "creer",
    align: "left",
    size: "md",
    Icon: Sparkles,
    floats: [
      { Icon: Wallet, className: "our-story-float our-story-float--i" },
      { Icon: CalendarDays, className: "our-story-float our-story-float--j" },
      { Icon: Users, className: "our-story-float our-story-float--k" },
    ],
  },
  {
    key: "construire",
    align: "right",
    size: "lg",
    Icon: Users,
    floats: [
      { Icon: MessageCircle, className: "our-story-float our-story-float--l" },
      { Icon: ClipboardList, className: "our-story-float our-story-float--m" },
      { Icon: Sparkles, className: "our-story-float our-story-float--n" },
    ],
  },
];

function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function StoryStepCard({
  step,
  index,
  total,
  t,
  reduceMotion,
  progress,
}: {
  step: StoryStep;
  index: number;
  total: number;
  t: (key: string) => string;
  reduceMotion: boolean | null;
  progress: MotionValue<number>;
}) {
  const start = index / total;
  const mid = (index + 0.45) / total;
  const nodeOpacity = useTransform(progress, [start, mid], [0.25, 1]);
  const nodeScale = useTransform(progress, [start, mid], [0.7, 1]);
  const baseRotate =
    step.align === "right" ? 0.8 : step.align === "left" ? -0.7 : 0;
  const hoverRotate =
    step.align === "right" ? -1.4 : step.align === "left" ? 1.5 : 1.2;

  return (
    <li
      className={`our-story-step our-story-step--${step.align} our-story-step--${step.size}`}
    >
      <div className="our-story-step__rail" aria-hidden>
        <motion.span
          className="our-story-step__node"
          style={
            reduceMotion
              ? undefined
              : { opacity: nodeOpacity, scale: nodeScale }
          }
        />
      </div>

      <div className={`our-story-step__stage our-story-step__stage--${step.align}`}>
        <motion.article
          className="our-story-card"
          initial={
            reduceMotion
              ? false
              : { opacity: 0, y: 48, scale: 0.96, rotate: baseRotate }
          }
          whileInView={{ opacity: 1, y: 0, scale: 1, rotate: baseRotate }}
          viewport={{ once: true, amount: 0.35, margin: "-8% 0px -12% 0px" }}
          transition={{ duration: reduceMotion ? 0.2 : 0.7, ease: easePremium }}
          whileHover={
            reduceMotion
              ? undefined
              : {
                  y: -6,
                  rotate: hoverRotate,
                  transition: { duration: 0.28, ease: easePremium },
                }
          }
        >
          <span className="our-story-card__glow" aria-hidden />
          <span className="our-story-card__shine" aria-hidden />

          <div className="our-story-card__top">
            <span className="our-story-card__icon" aria-hidden>
              <step.Icon className="h-5 w-5" strokeWidth={2.1} />
            </span>
            <span className="our-story-card__index">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>

          <h2 className="our-story-card__title">
            {t(`marketing.ourStory.steps.${step.key}.title`)}
          </h2>
          <p className="our-story-card__text">
            {t(`marketing.ourStory.steps.${step.key}.body`)}
          </p>
        </motion.article>

        <div className="our-story-step__floats" aria-hidden>
          {step.floats.map(({ Icon, className }, floatIndex) => (
            <motion.span
              key={`${step.key}-float-${floatIndex}`}
              className={className}
              animate={
                reduceMotion
                  ? undefined
                  : {
                      y: [0, floatIndex % 2 === 0 ? -10 : 8, 0],
                      opacity: [0.28, 0.45, 0.28],
                    }
              }
              transition={{
                duration: 5.5 + floatIndex * 0.7,
                repeat: Infinity,
                ease: "easeInOut",
                delay: floatIndex * 0.4,
              }}
            >
              <Icon className="h-full w-full" strokeWidth={1.6} />
            </motion.span>
          ))}
        </div>
      </div>
    </li>
  );
}

export default function OurStoryPage() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const timelineRef = useRef<HTMLElement>(null);
  const whatsappUrl = buildWhatsAppUrl(
    t("marketing.askChatGpt.whatsappPhone"),
    t("marketing.askChatGpt.message")
  );

  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 0.55", "end 0.55"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 28,
    restDelta: 0.001,
  });

  const lineHeight = useTransform(
    reduceMotion ? scrollYProgress : smoothProgress,
    [0, 1],
    ["0%", "100%"]
  );

  return (
    <main className={`${obillzLandingRootClass} our-story-page`}>
      <div className="our-story-atmosphere" aria-hidden>
        <span className="our-story-atmosphere__orb our-story-atmosphere__orb--1" />
        <span className="our-story-atmosphere__orb our-story-atmosphere__orb--2" />
        <span className="our-story-atmosphere__orb our-story-atmosphere__orb--3" />
        <span className="our-story-atmosphere__grain" />
      </div>

      <div className="relative z-10">
        <LandingNav />

        <section className="our-story-hero">
          <div className="landing-container our-story-hero__inner">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: easePremium }}
            >
              <p className="landing-section-label">{t("marketing.ourStory.label")}</p>
              <h1 className="our-story-hero__title display-title">
                {t("marketing.ourStory.title")}
              </h1>
              <p className="our-story-hero__subtitle">
                {t("marketing.ourStory.subtitle")}
              </p>
              <Link href="/" className="our-story-back">
                <ArrowLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                <span>{t("marketing.ourStory.backToLanding")}</span>
              </Link>
            </motion.div>
          </div>
        </section>

        <section
          ref={timelineRef}
          className="our-story-timeline"
          aria-label={t("marketing.ourStory.timelineLabel")}
        >
          <div className="our-story-timeline__track" aria-hidden>
            <span className="our-story-timeline__track-base" />
            <motion.span
              className="our-story-timeline__track-fill"
              style={{ height: lineHeight }}
            />
            <motion.span
              className="our-story-timeline__track-head"
              style={{ top: lineHeight }}
            />
          </div>

          <ol className="our-story-timeline__list">
            {STORY_STEPS.map((step, index) => (
              <StoryStepCard
                key={step.key}
                step={step}
                index={index}
                total={STORY_STEPS.length}
                t={t}
                reduceMotion={reduceMotion}
                progress={reduceMotion ? scrollYProgress : smoothProgress}
              />
            ))}
          </ol>
        </section>

        <section className="our-story-cta-section">
          <div className="landing-container">
            <motion.div
              className="our-story-cta-panel"
              initial={reduceMotion ? false : { opacity: 0, y: 32, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.7, ease: easePremium }}
            >
              <p className="our-story-cta-panel__quote">
                {t("marketing.ourStory.manifesto")}
              </p>
              <h2 className="our-story-cta-panel__title display-title">
                {t("marketing.ourStory.ctaTitle")}
              </h2>
              <p className="our-story-cta-panel__text">
                {t("marketing.ourStory.ctaSubtitle")}
              </p>
              <div className="our-story-cta-panel__actions">
                <LandingPrimaryButton href="/#modules" variant="dark">
                  {t("marketing.ourStory.ctaDiscover")}
                </LandingPrimaryButton>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="our-story-cta-secondary"
                >
                  {t("marketing.ourStory.ctaFounder")}
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        <LandingFooter />
      </div>
    </main>
  );
}
