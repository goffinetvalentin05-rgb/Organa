"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import type { TransitSource } from "@/lib/landing/hero-transit";

function WhatsAppMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3 text-[#25D366]" aria-hidden>
      <path
        fill="currentColor"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      />
    </svg>
  );
}

type TransitNodeProps = {
  source: TransitSource;
  variant?: "anchor" | "travel";
  className?: string;
};

export function TransitNode({ source, variant = "anchor", className = "" }: TransitNodeProps) {
  const Icon = source.icon;
  const isTravel = variant === "travel";

  return (
    <div
      className={`group flex items-center gap-1.5 rounded-lg border backdrop-blur-md transition-shadow ${
        isTravel
          ? "border-white/20 bg-[#0c1229]/95 px-1.5 py-1 shadow-[0_0_24px_rgba(26,35,255,0.35),0_8px_24px_rgba(0,0,0,0.4)]"
          : "border-white/[0.08] bg-white/[0.04] px-1.5 py-1 shadow-[0_4px_16px_rgba(0,0,0,0.25)]"
      } ${className}`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
          source.brand === "whatsapp"
            ? "bg-[#25D366]/15 ring-1 ring-[#25D366]/25"
            : "bg-[#1A23FF]/15 ring-1 ring-[#1A23FF]/20"
        }`}
      >
        {source.brand === "whatsapp" ? (
          <WhatsAppMark />
        ) : Icon ? (
          <Icon className="h-3 w-3 text-blue-200/90" strokeWidth={2} aria-hidden />
        ) : null}
      </span>
      {!isTravel ? (
        <span className="hidden pr-1 text-[9px] font-medium text-white/45 sm:block">{source.label}</span>
      ) : null}
    </div>
  );
}

export function FloatingAnchor({
  source,
  motionOn,
  inView,
}: {
  source: TransitSource;
  motionOn: boolean;
  inView: boolean;
}) {
  return (
    <motion.div
      className="absolute z-[6]"
      style={{
        left: `${source.anchorX}%`,
        top: `${source.anchorY}%`,
        transform: "translate(-50%, -50%)",
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={
        inView
          ? {
              opacity: motionOn ? [0.35, 0.55, 0.35] : 0.45,
              y: motionOn ? [0, -3, 0] : 0,
              scale: 1,
            }
          : { opacity: 0 }
      }
      transition={{
        opacity: motionOn ? { duration: 4, repeat: Infinity, ease: "easeInOut", delay: source.delay } : { duration: 0.4 },
        y: motionOn ? { duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: source.delay * 0.5 } : undefined,
      }}
      whileHover={{ scale: 1.04 }}
    >
      <TransitNode source={source} variant="anchor" />
    </motion.div>
  );
}
