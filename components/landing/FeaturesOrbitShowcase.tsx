"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  Coffee,
  CreditCard,
  FilePlus,
  Globe,
  Handshake,
  LayoutDashboard,
  Mail,
  QrCode,
  Receipt,
  Settings,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";
import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useI18n } from "@/components/I18nProvider";
import { featureOrbitMocks } from "@/components/landing/FeaturesOrbitMocks";
import { easePremium } from "@/components/landing/landing-motion";
import { getTranslationValue } from "@/lib/i18n";

export type OrbitFeatureId =
  | "statistiques"
  | "membres"
  | "cotisations"
  | "factures"
  | "encaissements"
  | "revenus"
  | "charges"
  | "sponsors"
  | "evenements"
  | "buvette"
  | "plannings"
  | "pv"
  | "qrcodes"
  | "communication"
  | "pagePublique"
  | "parametres";

type OrbitFeatureContent = {
  id: OrbitFeatureId;
  label: string;
  description: string;
  before: string;
  after: string;
  result: string;
};

const FEATURE_ORDER: OrbitFeatureId[] = [
  "statistiques",
  "membres",
  "cotisations",
  "factures",
  "encaissements",
  "revenus",
  "charges",
  "sponsors",
  "evenements",
  "buvette",
  "plannings",
  "pv",
  "qrcodes",
  "communication",
  "pagePublique",
  "parametres",
];

const FEATURE_ICONS: Record<OrbitFeatureId, LucideIcon> = {
  statistiques: LayoutDashboard,
  membres: Users,
  cotisations: Wallet,
  factures: Receipt,
  encaissements: CreditCard,
  revenus: ShoppingBag,
  charges: Building2,
  sponsors: Handshake,
  evenements: CalendarDays,
  buvette: Coffee,
  plannings: ClipboardList,
  pv: FilePlus,
  qrcodes: QrCode,
  communication: Mail,
  pagePublique: Globe,
  parametres: Settings,
};

type OrbitSlot = {
  angle: number;
  counterAngle: number;
  size: "sm" | "md";
  floatDelay: number;
};

/** Répartition parfaitement régulière sur une orbite circulaire unique. */
function buildOrbitLayout(count: number): OrbitSlot[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = -90 + (i * 360) / count;
    return {
      angle,
      counterAngle: -angle,
      size: "sm",
      floatDelay: i * 0.18,
    };
  });
}

const ORBIT_SLOTS = buildOrbitLayout(FEATURE_ORDER.length);

function highlightPhrase(
  full: string,
  hours: string,
  minutes: string
): ReactNode {
  const hIdx = full.indexOf(hours);
  const mIdx = full.indexOf(minutes);

  if (hIdx === -1 || mIdx === -1 || mIdx < hIdx) {
    return full;
  }

  return (
    <>
      {full.slice(0, hIdx)}
      <span className="features-orbit-em">{hours}</span>
      {full.slice(hIdx + hours.length, mIdx)}
      <span className="features-orbit-em">{minutes}</span>
      {full.slice(mIdx + minutes.length)}
    </>
  );
}

function highlightTemplate(
  template: string,
  hours: string,
  minutes: string
): ReactNode {
  const parts = template.split(/\{hours\}|\{minutes\}/);
  if (parts.length < 3) {
    return highlightPhrase(template, hours, minutes);
  }
  return (
    <>
      {parts[0]}
      <span className="features-orbit-em">{hours}</span>
      {parts[1]}
      <span className="features-orbit-em">{minutes}</span>
      {parts[2]}
    </>
  );
}

type BubbleProps = {
  feature: OrbitFeatureContent;
  Icon: LucideIcon;
  isActive: boolean;
  index: number;
  floatDelay: number;
  size?: "sm" | "md";
  inView: boolean;
  reduceMotion: boolean | null;
  onSelect: () => void;
  variant?: "orbit" | "mobile";
};

function FeatureBubble({
  feature,
  Icon,
  isActive,
  index,
  floatDelay,
  size = "sm",
  inView,
  reduceMotion,
  onSelect,
  variant = "orbit",
}: BubbleProps) {
  const isMobile = variant === "mobile";

  return (
    <motion.button
      type="button"
      className={`features-orbit-bubble__hit ${isMobile ? "features-orbit-mobile-bubble__hit" : ""}`}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.7, y: isMobile ? 16 : 20 }}
      animate={inView ? { opacity: 1, scale: 1, y: 0 } : undefined}
      transition={{
        duration: isMobile ? 0.45 : 0.55,
        delay: reduceMotion ? 0 : (isMobile ? 0.12 : 0.28) + index * (isMobile ? 0.035 : 0.045),
        ease: easePremium,
      }}
      whileHover={
        reduceMotion ? undefined : { scale: isMobile ? 1.04 : 1.1, y: isMobile ? -3 : -5 }
      }
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      aria-pressed={isActive}
      aria-label={feature.label}
    >
      <motion.span
        className="features-orbit-bubble__float"
        animate={
          reduceMotion || !inView
            ? undefined
            : {
                y: [0, isMobile ? -4 : -6 - (index % 3), 0],
                x: isMobile ? [0, index % 2 === 0 ? 1.5 : -1.5, 0] : [0, index % 2 === 0 ? 2.5 : -2.5, 0],
                scale: [1, isMobile ? 1.02 : 1.035, 1],
              }
        }
        transition={{
          duration: (isMobile ? 5.2 : 4.6) + (index % 5) * 0.35,
          repeat: Infinity,
          ease: "easeInOut",
          delay: floatDelay,
        }}
      >
        <span
          className={`features-orbit-bubble__glass features-orbit-bubble__glass--${size} ${
            isMobile ? "features-orbit-mobile-bubble__glass" : ""
          } ${isActive ? "features-orbit-bubble__glass--active" : ""}`}
        >
          <motion.span
            className="features-orbit-bubble__glow"
            aria-hidden
            animate={
              reduceMotion
                ? undefined
                : { opacity: isActive ? [0.85, 1, 0.85] : [0.45, 0.75, 0.45] }
            }
            transition={{
              duration: isActive ? 2.2 : 5.2 + (index % 3) * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <span className="features-orbit-bubble__shine" aria-hidden />
          <span className="features-orbit-bubble__icon">
            <Icon strokeWidth={1.75} aria-hidden />
          </span>
          <span className="features-orbit-bubble__label">{feature.label}</span>
        </span>
      </motion.span>
    </motion.button>
  );
}

export default function FeaturesOrbitShowcase() {
  const { locale, t } = useI18n();
  const reduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const stageInView = useInView(stageRef, { once: true, amount: 0.2 });
  const mobileInView = useInView(mobileRef, { once: true, amount: 0.15 });
  const [activeId, setActiveId] = useState<OrbitFeatureId | null>(null);

  const raw = getTranslationValue(locale, "marketing.modules.orbitFeatures");
  const fromI18n = (Array.isArray(raw) ? raw : []) as OrbitFeatureContent[];

  const features = useMemo(
    () =>
      FEATURE_ORDER.map((id) => {
        const found = fromI18n.find((f) => f.id === id);
        return {
          id,
          label: found?.label ?? id,
          description: found?.description ?? "",
          before: found?.before ?? "",
          after: found?.after ?? "",
          result: found?.result ?? "",
        } satisfies OrbitFeatureContent;
      }),
    [fromI18n]
  );

  const active = features.find((f) => f.id === activeId) ?? null;
  const ActiveIcon = active ? FEATURE_ICONS[active.id] : null;

  const titleAccent = t("marketing.modules.titleAccent");
  const accentHours = t("marketing.modules.titleAccentHours");
  const accentMinutes = t("marketing.modules.titleAccentMinutes");
  const subtitleTemplate = t("marketing.modules.subtitle");
  const hoursWord = t("marketing.modules.subtitleHours");
  const minutesWord = t("marketing.modules.subtitleMinutes");

  const handleSelect = (id: OrbitFeatureId) => {
    const next = activeId === id ? null : id;
    setActiveId(next);
    if (next && typeof window !== "undefined" && window.innerWidth < 960) {
      window.requestAnimationFrame(() => {
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
  };

  const centerCopy = (
    <>
      <p className="landing-section-label">{t("marketing.modules.label")}</p>
      <h2 className="features-orbit-center__title display-title">
        <span className="features-orbit-center__title-block">
          <span className="block">{t("marketing.modules.titleLine1")}</span>
          <span className="block">{t("marketing.modules.titleLine2")}</span>
        </span>
        <span className="features-orbit-center__title-accent block">
          {highlightPhrase(titleAccent, accentHours, accentMinutes)}
        </span>
      </h2>
      <p className="features-orbit-center__desc">
        {highlightTemplate(subtitleTemplate, hoursWord, minutesWord)}
      </p>
    </>
  );

  return (
    <div className="features-orbit">
      {/* ── Desktop orbit ── */}
      <div ref={stageRef} className="features-orbit-stage features-orbit-stage--desktop">
        <motion.div
          className="features-orbit-stage__glow features-orbit-stage__glow--core"
          aria-hidden
          animate={
            reduceMotion || !stageInView
              ? undefined
              : { opacity: [0.6, 0.95, 0.6], scale: [1, 1.08, 1] }
          }
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="features-orbit-stage__glow features-orbit-stage__glow--drift"
          aria-hidden
          animate={
            reduceMotion || !stageInView
              ? undefined
              : { x: [0, 32, -20, 0], y: [0, -18, 14, 0], opacity: [0.4, 0.65, 0.45, 0.4] }
          }
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="features-orbit-stage__glow features-orbit-stage__glow--accent"
          aria-hidden
          animate={
            reduceMotion || !stageInView
              ? undefined
              : { x: [0, -26, 16, 0], y: [0, 20, -12, 0], opacity: [0.35, 0.58, 0.4, 0.35] }
          }
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        />
        <motion.div
          className="features-orbit-stage__glow features-orbit-stage__glow--soft"
          aria-hidden
          animate={
            reduceMotion || !stageInView
              ? undefined
              : { opacity: [0.25, 0.45, 0.25], scale: [0.95, 1.05, 0.95] }
          }
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        />
        <div className="features-orbit-stage__ring" aria-hidden />
        <div className="features-orbit-stage__ring features-orbit-stage__ring--inner" aria-hidden />
        <div className="features-orbit-stage__connection" aria-hidden />

        <motion.div
          className="features-orbit-center"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={stageInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.75, ease: easePremium }}
        >
          {centerCopy}
        </motion.div>

        <div className="features-orbit-bubbles" role="list">
          {features.map((feature, index) => {
            const layout = ORBIT_SLOTS[index]!;
            const Icon = FEATURE_ICONS[feature.id];
            const isActive = activeId === feature.id;

            return (
              <div
                key={feature.id}
                className={`features-orbit-bubble features-orbit-bubble--${layout.size} ${
                  isActive ? "features-orbit-bubble--active" : ""
                }`}
                style={
                  {
                    "--orbit-angle": `${layout.angle}deg`,
                    "--orbit-counter-angle": `${layout.counterAngle}deg`,
                  } as CSSProperties
                }
                role="listitem"
              >
                <FeatureBubble
                  feature={feature}
                  Icon={Icon}
                  isActive={isActive}
                  index={index}
                  floatDelay={layout.floatDelay}
                  size={layout.size}
                  inView={stageInView}
                  reduceMotion={reduceMotion}
                  onSelect={() => handleSelect(feature.id)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Mobile layout (pensé nativement) ── */}
      <div ref={mobileRef} className="features-orbit-mobile">
        <div className="features-orbit-mobile__glow" aria-hidden />
        <motion.div
          className="features-orbit-mobile__intro"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={mobileInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.65, ease: easePremium }}
        >
          {centerCopy}
        </motion.div>

        <div className="features-orbit-mobile__grid" role="list">
          {features.map((feature, index) => {
            const Icon = FEATURE_ICONS[feature.id];
            const isActive = activeId === feature.id;
            return (
              <div
                key={feature.id}
                className={`features-orbit-mobile-bubble ${
                  isActive ? "features-orbit-mobile-bubble--active" : ""
                }`}
                role="listitem"
              >
                <FeatureBubble
                  feature={feature}
                  Icon={Icon}
                  isActive={isActive}
                  index={index}
                  floatDelay={index * 0.15}
                  size="sm"
                  inView={mobileInView}
                  reduceMotion={reduceMotion}
                  onSelect={() => handleSelect(feature.id)}
                  variant="mobile"
                />
              </div>
            );
          })}
        </div>
      </div>

      <div ref={detailRef} className="features-orbit-detail-slot" aria-live="polite">
        <AnimatePresence mode="wait">
          {active && ActiveIcon ? (
            <motion.article
              key={active.id}
              className="features-orbit-detail"
              initial={
                reduceMotion ? false : { opacity: 0, y: 28, scale: 0.975, filter: "blur(5px)" }
              }
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 16, scale: 0.985, filter: "blur(3px)" }}
              transition={{ duration: 0.52, ease: easePremium }}
            >
              <div className="features-orbit-detail__glow" aria-hidden />
              <div className="features-orbit-detail__grid">
                <div className="features-orbit-detail__copy">
                  <div className="features-orbit-detail__heading">
                    <span className="features-orbit-detail__badge">
                      <ActiveIcon className="h-5 w-5" strokeWidth={1.85} aria-hidden />
                    </span>
                    <div>
                      <h3 className="features-orbit-detail__title">{active.label}</h3>
                      <p className="features-orbit-detail__text">{active.description}</p>
                    </div>
                  </div>

                  <div className="features-orbit-journey">
                    <div className="features-orbit-journey__step features-orbit-journey__step--before">
                      <p className="features-orbit-journey__label">
                        {t("marketing.modules.compareBefore")}
                      </p>
                      <p className="features-orbit-journey__text">{active.before}</p>
                    </div>
                    <div className="features-orbit-journey__connector" aria-hidden>
                      <span />
                    </div>
                    <div className="features-orbit-journey__step features-orbit-journey__step--after">
                      <p className="features-orbit-journey__label">
                        {t("marketing.modules.compareAfter")}
                      </p>
                      <p className="features-orbit-journey__text">{active.after}</p>
                    </div>
                    <div className="features-orbit-journey__connector" aria-hidden>
                      <span />
                    </div>
                    <div className="features-orbit-journey__step features-orbit-journey__step--result">
                      <p className="features-orbit-journey__label">
                        {t("marketing.modules.compareResult")}
                      </p>
                      <p className="features-orbit-journey__text">{active.result}</p>
                    </div>
                  </div>
                </div>

                <div className="features-orbit-detail__visual">
                  {featureOrbitMocks[active.id]?.() ?? featureOrbitMocks.generic?.() ?? null}
                </div>
              </div>
            </motion.article>
          ) : (
            <motion.p
              key="hint"
              className="features-orbit-hint"
              initial={false}
              animate={{ opacity: 1 }}
            >
              {t("marketing.modules.orbitHint")}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
