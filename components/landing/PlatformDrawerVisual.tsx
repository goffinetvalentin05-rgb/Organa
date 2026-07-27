"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  CalendarRange,
  FileText,
  Handshake,
  Megaphone,
  Receipt,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { getTranslationValue } from "@/lib/i18n";
import { easePremium, staggerContainer, staggerItem, viewportOnce } from "@/components/landing/landing-motion";

type DrawerTile = { id: string; label: string };

const tileIcons: Record<string, LucideIcon> = {
  membres: Users,
  cotisations: Wallet,
  evenements: CalendarDays,
  sponsors: Handshake,
  comite: UsersRound,
  facture: Receipt,
  planning: CalendarRange,
  procesVerbal: FileText,
  manifestation: Megaphone,
};

const tileOrder = [
  "membres",
  "cotisations",
  "evenements",
  "sponsors",
  "comite",
  "facture",
  "planning",
  "procesVerbal",
  "manifestation",
] as const;

export default function PlatformDrawerVisual() {
  const { locale, t } = useI18n();
  const reduceMotion = useReducedMotion();
  const raw = getTranslationValue(locale, "marketing.modules.drawerTiles");
  const tilesFromI18n = (Array.isArray(raw) ? raw : []) as DrawerTile[];

  const tiles = tileOrder.map((id) => {
    const found = tilesFromI18n.find((tile) => tile.id === id);
    return { id, label: found?.label ?? id };
  });

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.75, ease: easePremium }}
      className="platform-drawer relative mx-auto w-full max-w-[920px]"
      aria-label={t("marketing.modules.drawerAriaLabel")}
    >
      <div
        className="pointer-events-none absolute -inset-x-6 -inset-y-8 rounded-[3rem] bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.14),rgba(56,189,248,0.06)_45%,transparent_72%)] blur-2xl"
        aria-hidden
      />

      <div className="platform-drawer__shell relative overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80 shadow-[0_24px_64px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,0.9)_inset,0_0_48px_rgba(37,99,235,0.08)] sm:rounded-[2rem]">
        <motion.div
          initial={reduceMotion ? false : { y: 0 }}
          whileInView={{ y: reduceMotion ? 0 : 8 }}
          viewport={viewportOnce}
          transition={{ duration: 0.85, delay: 0.12, ease: easePremium }}
          className="platform-drawer__lip relative z-[2] border-b border-slate-200/80 bg-gradient-to-b from-slate-50/95 to-white px-6 py-4 sm:px-8 sm:py-5"
        >
          <div className="mx-auto flex w-full max-w-[220px] flex-col items-center gap-2">
            <span
              className="h-1 w-14 rounded-full bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
              aria-hidden
            />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Obillz
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={
            reduceMotion
              ? false
              : { opacity: 0, scaleY: 0.72, transformOrigin: "top center" }
          }
          whileInView={{ opacity: 1, scaleY: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 0.88, delay: 0.28, ease: easePremium }}
          className="platform-drawer__body relative overflow-hidden"
        >
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-3 sm:gap-3 sm:p-6 md:gap-3.5 md:p-7"
          >
            {tiles.map((tile) => {
              const Icon = tileIcons[tile.id] ?? FileText;
              return (
                <motion.div key={tile.id} variants={staggerItem}>
                  <DrawerTileCard icon={Icon} label={tile.label} reduceMotion={!!reduceMotion} />
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function DrawerTileCard({
  icon: Icon,
  label,
  reduceMotion,
}: {
  icon: LucideIcon;
  label: string;
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -3,
              transition: { duration: 0.28, ease: easePremium },
            }
      }
      className="platform-drawer__tile group flex flex-col items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white px-3 py-4 shadow-[0_2px_8px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.95)] transition-[border-color,box-shadow] duration-300 hover:border-blue-200/80 hover:shadow-[0_8px_24px_rgba(37,99,235,0.1),0_0_0_1px_rgba(37,99,235,0.06)] sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-5"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100/80 bg-gradient-to-br from-blue-50 to-slate-50 text-[#2563EB] shadow-[0_0_20px_rgba(37,99,235,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] transition duration-300 group-hover:border-blue-200/90 group-hover:from-blue-100/70 group-hover:to-blue-50/90 group-hover:shadow-[0_0_24px_rgba(37,99,235,0.16)] sm:h-11 sm:w-11">
        <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="text-center text-[11px] font-semibold leading-tight tracking-tight text-slate-700 sm:text-xs">
        {label}
      </span>
    </motion.div>
  );
}
