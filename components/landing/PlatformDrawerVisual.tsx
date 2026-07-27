"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  CalendarRange,
  CreditCard,
  FileText,
  Handshake,
  Megaphone,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useRef } from "react";
import { useI18n } from "@/components/I18nProvider";
import { getTranslationValue } from "@/lib/i18n";

type DrawerTile = { id: string; label: string };

const tileIcons: Record<string, LucideIcon> = {
  membres: Users,
  cotisations: Wallet,
  finances: TrendingUp,
  factures: Receipt,
  charges: CreditCard,
  procesVerbaux: FileText,
  plannings: CalendarRange,
  manifestations: Megaphone,
  sponsors: Handshake,
};

const tileOrder = [
  "membres",
  "cotisations",
  "finances",
  "factures",
  "charges",
  "procesVerbaux",
  "plannings",
  "manifestations",
  "sponsors",
] as const;

type PlatformDrawerVisualProps = {
  scrollProgress: MotionValue<number>;
};

export default function PlatformDrawerVisual({ scrollProgress }: PlatformDrawerVisualProps) {
  const { locale, t } = useI18n();
  const reduceMotion = useReducedMotion();
  const raw = getTranslationValue(locale, "marketing.modules.drawerTiles");
  const tilesFromI18n = (Array.isArray(raw) ? raw : []) as DrawerTile[];

  const tiles = tileOrder.map((id) => {
    const found = tilesFromI18n.find((tile) => tile.id === id);
    return { id, label: found?.label ?? id };
  });

  const progress = reduceMotion ? null : scrollProgress;

  const drawerPull = useTransform(progress ?? scrollProgress, [0.08, 0.72], [0, 1]);
  const drawerY = useTransform(drawerPull, [0, 1], [-196, 220]);
  const drawerZ = useTransform(drawerPull, [0, 1], [-20, 140]);
  const drawerRotateX = useTransform(drawerPull, [0, 1], [18, -4]);
  const interiorGlow = useTransform(drawerPull, [0, 0.35, 1], [0.15, 0.55, 1]);
  const handleGlow = useTransform(drawerPull, [0, 0.25, 1], [0.35, 0.75, 1]);
  const shadowStrength = useTransform(drawerPull, [0, 1], [0.12, 0.38]);

  return (
    <div
      className="platform-console-scene relative mx-auto w-full max-w-[980px]"
      aria-label={t("marketing.modules.drawerAriaLabel")}
    >
      <div
        className="pointer-events-none absolute -inset-x-10 -bottom-16 top-8 rounded-[3rem] bg-[radial-gradient(ellipse_at_50%_65%,rgba(37,99,235,0.12),rgba(56,189,248,0.04)_42%,transparent_72%)]"
        aria-hidden
      />

      <div className="platform-console-cabinet relative">
        <div className="platform-console-top relative overflow-hidden rounded-t-[1.35rem] border border-white/[0.08] bg-gradient-to-b from-[#071634] via-[#0A1F4D] to-[#0c2554] px-6 py-10 shadow-[0_28px_80px_rgba(7,22,52,0.28),inset_0_1px_0_rgba(255,255,255,0.08)] sm:rounded-t-[1.75rem] sm:px-10 sm:py-12 md:py-14">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.14),transparent_58%)]"
            aria-hidden
          />
          <div className="relative mx-auto max-w-[680px] text-center">
            <h2 className="text-[clamp(1.35rem,3.2vw,2rem)] font-bold leading-[1.15] tracking-tight text-white">
              {t("marketing.modules.panelTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-[540px] text-[clamp(0.875rem,1.6vw,1.05rem)] leading-relaxed text-blue-100/72 sm:mt-4">
              {t("marketing.modules.panelSubtitle")}
            </p>
          </div>
        </div>

        <div className="platform-console-slot relative h-[420px] overflow-x-hidden overflow-y-visible sm:h-[460px] md:h-[500px]">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-0 h-8 bg-gradient-to-b from-[#0c2554] to-[#081a3d]"
            aria-hidden
          />

          <div
            className="platform-console-perspective absolute inset-x-0 top-0 z-[1] flex justify-center"
            style={{ perspective: "1400px", perspectiveOrigin: "50% 20%" }}
          >
            <motion.div
              className="platform-console-drawer relative w-[min(94vw,900px)]"
              style={{
                y: reduceMotion ? 200 : drawerY,
                z: reduceMotion ? 120 : drawerZ,
                rotateX: reduceMotion ? -2 : drawerRotateX,
                transformStyle: "preserve-3d",
                transformPerspective: 1400,
              }}
            >
              <motion.div
                className="platform-console-drawer-front relative z-[3] rounded-[1.1rem] border border-white/[0.1] bg-gradient-to-b from-[#0d1f45] via-[#0a1938] to-[#081530] px-6 py-5 shadow-[0_18px_40px_rgba(2,6,23,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] sm:rounded-[1.25rem] sm:px-8 sm:py-6"
                style={{ transform: "translateZ(24px)" }}
              >
                <div className="mx-auto flex max-w-[280px] flex-col items-center gap-3">
                  <motion.div
                    className="relative h-[7px] w-[min(52vw,220px)] overflow-hidden rounded-full bg-[#061022]"
                    style={{ opacity: handleGlow }}
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#1A23FF]/20 via-[#38BDF8] to-[#1A23FF]/20 shadow-[0_0_18px_rgba(56,189,248,0.85),0_0_36px_rgba(26,35,255,0.45)]" />
                  </motion.div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-200/45">
                    Obillz
                  </span>
                </div>
                <div
                  className="pointer-events-none absolute inset-x-4 bottom-0 h-[3px] rounded-full bg-gradient-to-r from-transparent via-[#38BDF8]/35 to-transparent blur-[1px]"
                  aria-hidden
                />
              </motion.div>

              <div
                className="platform-console-drawer-body relative z-[2] -mt-[2px] overflow-hidden rounded-b-[1.35rem] border border-t-0 border-white/[0.08] bg-gradient-to-b from-[#07142e] via-[#061022] to-[#040b18] sm:rounded-b-[1.5rem]"
                style={{ transform: "translateZ(8px)" }}
              >
                <div
                  className="pointer-events-none absolute -left-[3px] top-0 z-[1] h-full w-[6px] bg-gradient-to-r from-[#030712] via-[#0a1628] to-transparent"
                  style={{ transform: "rotateY(22deg) translateZ(-6px)" }}
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -right-[3px] top-0 z-[1] h-full w-[6px] bg-gradient-to-l from-[#030712] via-[#0a1628] to-transparent"
                  style={{ transform: "rotateY(-22deg) translateZ(-6px)" }}
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-black/40 to-transparent"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-black/40 to-transparent"
                  aria-hidden
                />

                <motion.div
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.22),transparent_62%)]"
                  style={{ opacity: interiorGlow }}
                  aria-hidden
                />

                <div className="relative px-4 pb-5 pt-4 sm:px-6 sm:pb-7 sm:pt-5 md:px-7 md:pb-8">
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 md:gap-4">
                    {tiles.map((tile, index) => (
                      <PhysicalKey
                        key={tile.id}
                        icon={tileIcons[tile.id] ?? FileText}
                        label={tile.label}
                        index={index}
                        scrollProgress={progress ?? scrollProgress}
                        reduceMotion={!!reduceMotion}
                      />
                    ))}
                  </div>
                </div>

                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-black/40 to-transparent"
                  aria-hidden
                />
              </div>

              <motion.div
                className="pointer-events-none absolute -bottom-8 left-[8%] right-[8%] h-10 rounded-[50%] bg-[#020617]/50 blur-2xl"
                style={{ opacity: shadowStrength }}
                aria-hidden
              />
            </motion.div>
          </div>
        </div>

        <div
          className="platform-console-base relative -mt-1 h-5 rounded-b-[1.35rem] border border-t-0 border-white/[0.06] bg-gradient-to-b from-[#071634] to-[#050f22] shadow-[0_20px_48px_rgba(7,22,52,0.22)] sm:rounded-b-[1.75rem]"
          aria-hidden
        />
      </div>
    </div>
  );
}

function PhysicalKey({
  icon: Icon,
  label,
  index,
  scrollProgress,
  reduceMotion,
}: {
  icon: LucideIcon;
  label: string;
  index: number;
  scrollProgress: MotionValue<number>;
  reduceMotion: boolean;
}) {
  const start = 0.22 + index * 0.055;
  const end = start + 0.12;
  const keyOpacity = useTransform(scrollProgress, [start, end], [0, 1]);
  const keyY = useTransform(scrollProgress, [start, end], [18, 0]);
  const keyGlow = useTransform(scrollProgress, [start, end], [0, 1]);

  if (reduceMotion) {
    return (
      <div className="platform-console-key">
        <div className="platform-console-key__face platform-console-key__face--lit">
          <Icon className="platform-console-key__icon" strokeWidth={1.65} aria-hidden />
          <span className="platform-console-key__label">{label}</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div className="platform-console-key" style={{ opacity: keyOpacity, y: keyY }}>
      <div className="platform-console-key__face">
        <motion.div
          className="platform-console-key__glow"
          style={{ opacity: keyGlow }}
          aria-hidden
        />
        <Icon className="platform-console-key__icon" strokeWidth={1.65} aria-hidden />
        <span className="platform-console-key__label">{label}</span>
      </div>
    </motion.div>
  );
}

export function usePlatformScrollProgress() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return { containerRef, scrollYProgress };
}
