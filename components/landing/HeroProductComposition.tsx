"use client";

import { motion } from "framer-motion";
import HeroProductPreview from "@/components/landing/HeroProductPreview";
import { heroSatelliteWidgets } from "@/components/landing/hero-widgets";
import { easePremium } from "@/components/landing/landing-motion";
import { ProductWidgetCard } from "@/components/landing/ProductWidget";

export default function HeroProductComposition() {
  return (
    <div className="relative mx-auto mt-10 w-full max-w-[1040px] px-1 md:mt-12 md:px-0">
      <div
        className="pointer-events-none absolute inset-x-[0%] top-[8%] -z-10 h-[70%] rounded-full bg-[radial-gradient(ellipse,rgba(255,255,255,0.32),transparent_62%)] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-[20%] bottom-[0%] -z-10 h-32 rounded-full bg-[#1A23FF]/50 blur-[72px]"
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: 56, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.42, ease: easePremium }}
        className="hidden lg:grid lg:grid-cols-[minmax(0,210px)_minmax(0,1fr)_minmax(0,210px)] lg:grid-rows-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-x-5 lg:gap-y-6"
      >
        <div className="lg:col-start-1 lg:row-start-1 lg:justify-self-end">
          <Satellite widget={heroSatelliteWidgets[0]} delay={0.68} floatIndex={0} />
        </div>
        <div className="lg:col-start-3 lg:row-start-1 lg:justify-self-start">
          <Satellite widget={heroSatelliteWidgets[1]} delay={0.76} floatIndex={1} />
        </div>

        <div className="relative z-10 lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:self-center">
          <HeroProductPreview embedded />
        </div>

        <div className="lg:col-start-1 lg:row-start-2 lg:justify-self-end lg:self-center">
          <Satellite widget={heroSatelliteWidgets[2]} delay={0.84} floatIndex={2} />
        </div>
        <div className="lg:col-start-3 lg:row-start-2 lg:justify-self-start lg:self-center">
          <Satellite widget={heroSatelliteWidgets[3]} delay={0.92} floatIndex={3} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 36 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.48, ease: easePremium }}
        className="lg:hidden"
      >
        <HeroProductPreview embedded />
        <div className="mt-5 grid grid-cols-2 gap-3">
          {heroSatelliteWidgets.map((widget, index) => (
            <motion.div
              key={widget.id}
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.62 + index * 0.09, ease: easePremium }}
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
  floatIndex,
}: {
  widget: (typeof heroSatelliteWidgets)[number];
  delay: number;
  floatIndex: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
      transition={{
        opacity: { duration: 0.6, delay, ease: easePremium },
        scale: { duration: 0.6, delay, ease: easePremium },
        y: {
          duration: 5 + floatIndex * 0.35,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay + 0.55,
        },
      }}
      className="w-full max-w-[210px]"
    >
      <ProductWidgetCard
        {...widget}
        icon={widget.icon}
        className="shadow-[0_20px_48px_rgba(2,6,23,0.22),0_0_0_1px_rgba(255,255,255,0.6)_inset]"
      />
    </motion.div>
  );
}
