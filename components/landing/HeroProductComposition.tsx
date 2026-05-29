"use client";

import { motion } from "framer-motion";
import HeroProductPreview from "@/components/landing/HeroProductPreview";
import { heroSatelliteWidgets } from "@/components/landing/hero-widgets";
import { ProductWidgetCard } from "@/components/landing/ProductWidget";

/**
 * Composition hero : dashboard central + 4 satellites max, sans chevauchement.
 * Desktop : grille 3 colonnes. Mobile : dashboard puis grille 2×2.
 */
export default function HeroProductComposition() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto mt-10 w-full max-w-[960px] md:mt-12"
    >
      <div
        className="pointer-events-none absolute inset-x-[5%] top-[18%] -z-10 h-[50%] rounded-full bg-[radial-gradient(ellipse,rgba(255,255,255,0.22),transparent_68%)] blur-3xl"
        aria-hidden
      />

      {/* Desktop : grille alignée */}
      <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr_auto] lg:items-center lg:gap-x-5 lg:gap-y-4">
        <div className="lg:col-start-1 lg:row-start-1 lg:justify-self-end lg:self-end">
          <SatelliteCard widget={heroSatelliteWidgets[0]} delay={0.35} />
        </div>
        <div className="lg:col-start-3 lg:row-start-1 lg:justify-self-start lg:self-end">
          <SatelliteCard widget={heroSatelliteWidgets[1]} delay={0.45} />
        </div>

        <div className="relative z-10 lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:self-center">
          <HeroProductPreview embedded />
        </div>

        <div className="lg:col-start-1 lg:row-start-2 lg:justify-self-end">
          <SatelliteCard widget={heroSatelliteWidgets[2]} delay={0.55} />
        </div>
        <div className="lg:col-start-3 lg:row-start-2 lg:justify-self-start">
          <SatelliteCard widget={heroSatelliteWidgets[3]} delay={0.65} />
        </div>
      </div>

      {/* Tablette / mobile */}
      <div className="lg:hidden">
        <HeroProductPreview embedded />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
          {heroSatelliteWidgets.map((widget, index) => (
            <motion.div
              key={widget.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <ProductWidgetCard {...widget} icon={widget.icon} compact />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function SatelliteCard({
  widget,
  delay,
}: {
  widget: (typeof heroSatelliteWidgets)[number];
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[200px] will-change-transform landing-float-subtle"
      style={{ animationDelay: `${delay * 1000}ms` }}
    >
      <ProductWidgetCard {...widget} icon={widget.icon} />
    </motion.div>
  );
}
