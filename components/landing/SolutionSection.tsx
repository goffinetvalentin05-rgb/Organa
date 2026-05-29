"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Coffee,
  Globe,
  Handshake,
  LayoutDashboard,
  QrCode,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";
import LandingSection from "@/components/landing/LandingSection";
import ScrollReveal from "@/components/landing/ScrollReveal";
import { DashboardMock } from "@/components/landing/product-mocks";
import { easePremium, scaleIn, viewportOnce } from "@/components/landing/landing-motion";

const modules: Array<{ icon: LucideIcon; label: string }> = [
  { icon: Users, label: "Membres" },
  { icon: Wallet, label: "Cotisations" },
  { icon: Receipt, label: "Factures" },
  { icon: Handshake, label: "Sponsoring" },
  { icon: CalendarDays, label: "Événements" },
  { icon: Coffee, label: "Buvette" },
  { icon: LayoutDashboard, label: "Encaissements" },
  { icon: QrCode, label: "QR codes" },
  { icon: Globe, label: "Page publique" },
];

export default function SolutionSection() {
  const reduceMotion = useReducedMotion();

  return (
    <LandingSection
      id="centralise"
      className="mt-24 md:mt-36 lg:mt-44"
      glow
      eyebrow="La solution"
      title="Tout le club, au même endroit."
      subtitle="Membres, finances, événements et communication — une seule plateforme claire pour votre comité."
    >
      <ScrollReveal className="relative mx-auto mt-12 max-w-[960px] md:mt-16" y={32}>
        <div
          className="pointer-events-none absolute inset-[-12%] rounded-full bg-[radial-gradient(ellipse,rgba(255,255,255,0.14),transparent_62%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-[-6%] rounded-full bg-[radial-gradient(ellipse,rgba(26,35,255,0.35),transparent_70%)] blur-2xl"
          aria-hidden
        />

        <div className="relative mx-auto aspect-square max-w-[min(100%,560px)]">
          {!reduceMotion ? (
            <motion.div
              className="pointer-events-none absolute inset-[18%] rounded-full border border-white/[0.08]"
              animate={{ rotate: 360 }}
              transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
              aria-hidden
            >
              <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40 shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
            </motion.div>
          ) : null}

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            custom={0.1}
            variants={scaleIn}
            className="absolute left-1/2 top-1/2 z-10 w-[min(100%,400px)] -translate-x-1/2 -translate-y-1/2"
          >
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="rounded-[1.35rem] border border-white/30 bg-gradient-to-b from-white/20 to-white/5 p-[3px] shadow-[0_40px_100px_rgba(2,6,23,0.5)] [transform:perspective(1200px)_rotateX(3deg)]">
                <DashboardMock compact />
              </div>
            </motion.div>
          </motion.div>

          {modules.map((mod, index) => (
            <ModuleOrb key={mod.label} mod={mod} index={index} total={modules.length} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6, delay: 0.45, ease: easePremium }}
          className="mt-12 flex flex-wrap justify-center gap-2 md:hidden"
        >
          {modules.map((mod) => (
            <ModuleChip key={mod.label} mod={mod} />
          ))}
        </motion.div>
      </ScrollReveal>
    </LandingSection>
  );
}

function ModuleOrb({
  mod,
  index,
  total,
}: {
  mod: (typeof modules)[number];
  index: number;
  total: number;
}) {
  const angle = (index / total) * 360 - 90;
  const radius = 47;
  const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
  const y = 50 + radius * Math.sin((angle * Math.PI) / 180);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.75 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={viewportOnce}
      transition={{ duration: 0.55, delay: 0.12 + index * 0.05, ease: easePremium }}
      whileHover={{ scale: 1.08, y: -4 }}
      className="absolute z-20 hidden md:block"
      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
    >
      <ModuleChip mod={mod} orb />
    </motion.div>
  );
}

function ModuleChip({ mod, orb }: { mod: (typeof modules)[number]; orb?: boolean }) {
  const Icon = mod.icon;
  return (
    <div
      className={`group flex cursor-default items-center gap-2 rounded-2xl border border-white/25 bg-white/[0.12] px-3 py-2.5 text-white shadow-[0_12px_32px_rgba(2,6,23,0.25)] backdrop-blur-md transition hover:border-white/40 hover:bg-white/[0.18] hover:shadow-[0_16px_40px_rgba(26,35,255,0.28)] ${
        orb ? "md:px-3.5 md:py-3" : ""
      }`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1A23FF]/35 ring-1 ring-white/20 transition group-hover:bg-[#1A23FF]/50 group-hover:ring-white/35">
        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="text-xs font-bold md:text-[0.8125rem]">{mod.label}</span>
    </div>
  );
}
