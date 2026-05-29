"use client";

import { motion } from "framer-motion";
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
  return (
    <LandingSection
      id="centralise"
      className="mt-24 md:mt-36 lg:mt-44"
      glow
      eyebrow="La plateforme"
      title="Tout le club, au même endroit."
      subtitle="Obillz rassemble les outils essentiels pour permettre au comité de gérer le club plus simplement, avec une meilleure visibilité."
    >
      <ScrollReveal className="relative mx-auto mt-12 max-w-[920px] md:mt-16" y={32}>
        <div
          className="pointer-events-none absolute inset-[-8%] rounded-full bg-[radial-gradient(ellipse,rgba(255,255,255,0.12),transparent_65%)]"
          aria-hidden
        />

        <div className="relative mx-auto aspect-square max-w-[min(100%,520px)]">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            custom={0.1}
            variants={scaleIn}
            className="absolute left-1/2 top-1/2 z-10 w-[min(100%,380px)] -translate-x-1/2 -translate-y-1/2"
          >
            <div className="rounded-[1.25rem] border border-white/30 bg-gradient-to-b from-white/20 to-white/5 p-[3px] shadow-[0_32px_80px_rgba(2,6,23,0.45)] [transform:perspective(1200px)_rotateX(2deg)]">
              <DashboardMock compact />
            </div>
          </motion.div>

          {modules.map((mod, index) => (
            <ModuleOrb key={mod.label} mod={mod} index={index} total={modules.length} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6, delay: 0.5, ease: easePremium }}
          className="mt-10 flex flex-wrap justify-center gap-2 md:hidden"
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
  const radius = 46;
  const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
  const y = 50 + radius * Math.sin((angle * Math.PI) / 180);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={viewportOnce}
      transition={{ duration: 0.55, delay: 0.15 + index * 0.06, ease: easePremium }}
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
    <motion.div
      whileHover={{ scale: 1.06, y: -4 }}
      transition={{ duration: 0.25, ease: easePremium }}
      className={`group flex cursor-default items-center gap-2 rounded-2xl border border-white/25 bg-white/[0.12] px-3 py-2.5 text-white shadow-[0_12px_32px_rgba(2,6,23,0.25)] backdrop-blur-md transition hover:border-white/40 hover:bg-white/[0.18] hover:shadow-[0_16px_40px_rgba(26,35,255,0.25)] ${
        orb ? "md:px-3.5 md:py-3" : ""
      }`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1A23FF]/30 ring-1 ring-white/20 transition group-hover:bg-[#1A23FF]/45 group-hover:ring-white/35">
        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="text-xs font-bold md:text-[0.8125rem]">{mod.label}</span>
    </motion.div>
  );
}
