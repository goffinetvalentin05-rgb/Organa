"use client";

import { motion } from "framer-motion";
import HeroProductPreview from "@/components/landing/HeroProductPreview";
import { heroSatelliteWidgets } from "@/components/landing/hero-widgets";
import { easePremium } from "@/components/landing/landing-motion";
import { ProductWidgetCard } from "@/components/landing/ProductWidget";

export default function HeroProductComposition() {
  return (
    <div className="relative mx-auto mt-8 w-full max-w-[1000px] px-1 md:mt-10 md:px-0">
      <div
        className="pointer-events-none absolute inset-x-[2%] top-[15%] -z-10 h-[60%] rounded-full bg-[radial-gradient(ellipse,rgba(255,255,255,0.28),transparent_65%)] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-[15%] bottom-[5%] -z-10 h-24 rounded-full bg-[#1A23FF]/40 blur-[60px]"
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: 48, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.85, delay: 0.45, ease: easePremium }}
        className="hidden lg:grid lg:grid-cols-[minmax(0,200px)_minmax(0,1fr)_minmax(0,200px)] lg:grid-rows-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-x-6 lg:gap-y-5"
      >
        <div className="lg:col-start-1 lg:row-start-1 lg:justify-self-end">
          <Satellite widget={heroSatelliteWidgets[0]} delay={0.65} floatDelay="0s" />
        </div>
        <div className="lg:col-start-3 lg:row-start-1 lg:justify-self-start">
          <Satellite widget={heroSatelliteWidgets[1]} delay={0.72} floatDelay="1.2s" />
        </div>

        <div className="relative z-10 lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:self-center">
          <HeroProductPreview embedded />
        </div>

        <div className="lg:col-start-1 lg:row-start-2 lg:justify-self-end lg:self-center">
          <Satellite widget={heroSatelliteWidgets[2]} delay={0.79} floatDelay="0.6s" />
        </div>
        <div className="lg:col-start-3 lg:row-start-2 lg:justify-self-start lg:self-center">
          <Satellite widget={heroSatelliteWidgets[3]} delay={0.86} floatDelay="1.8s" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.5, ease: easePremium }}
        className="lg:hidden"
      >
        <HeroProductPreview embedded />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
          {heroSatelliteWidgets.map((widget, index) => (
            <motion.div
              key={widget.id}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 + index * 0.08, ease: easePremium }}
            >
              <ProductWidgetCard {...widget} icon={widget.icon} compact />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function Satellite({
  widget,
  delay,
  floatDelay,
}: {
  widget: (typeof heroSatelliteWidgets)[number];
  delay: number;
  floatDelay: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: easePremium }}
      className="w-full max-w-[200px] landing-float-subtle"
      style={{ animationDelay: floatDelay }}
    >
      <ProductWidgetCard {...widget} icon={widget.icon} />
    </motion.div>
  );
}
