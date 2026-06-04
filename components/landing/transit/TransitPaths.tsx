"use client";

import { motion } from "framer-motion";
import { TransitNode } from "@/components/landing/transit/TransitNode";
import { easePremium } from "@/components/landing/landing-motion";
import { TRANSIT_SOURCES, transitCurvePath, type TransitSource } from "@/lib/landing/hero-transit";

type TransitPathsProps = {
  uid: string;
  paths: { id: string; d: string; delay: number }[];
  inView: boolean;
  motionOn: boolean;
  reduceMotion: boolean;
};

function TransitNodeTravel({ source }: { source: TransitSource }) {
  return <TransitNode source={source} variant="travel" />;
}

export default function TransitPaths({ uid, paths, inView, motionOn, reduceMotion }: TransitPathsProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <filter id={`tp-blur-${uid}`}>
          <feGaussianBlur stdDeviation="0.8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={`tp-stroke-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#64748b" stopOpacity="0.08" />
          <stop offset="35%" stopColor="#93c5fd" stopOpacity="0.35" />
          <stop offset="55%" stopColor="#c4b5fd" stopOpacity="0.5" />
          <stop offset="75%" stopColor="#93c5fd" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#1A23FF" stopOpacity="0.25" />
        </linearGradient>
      </defs>

      {paths.map((p) => (
        <g key={p.id}>
          <motion.path
            d={p.d}
            fill="none"
            stroke={`url(#tp-stroke-${uid})`}
            strokeWidth="0.28"
            strokeLinecap="round"
            filter={`url(#tp-blur-${uid})`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: inView ? 1 : 0,
              opacity: inView ? (motionOn ? [0.08, 0.32, 0.08] : 0.22) : 0,
            }}
            transition={{
              pathLength: { duration: 1.6, delay: p.delay, ease: easePremium },
              opacity: motionOn
                ? { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: p.delay }
                : { duration: 0.5, delay: p.delay },
            }}
          />
          {!reduceMotion && motionOn ? (
            <>
              <circle r="0.35" fill="#e0e7ff" opacity="0.9" filter={`url(#tp-blur-${uid})`}>
                <animateMotion dur="3.2s" repeatCount="indefinite" path={p.d} begin={`${p.delay}s`} />
              </circle>
              <circle r="0.22" fill="#a5b4fc" opacity="0.6">
                <animateMotion dur="3.2s" repeatCount="indefinite" path={p.d} begin={`${p.delay + 0.5}s`} />
              </circle>
            </>
          ) : null}
        </g>
      ))}

      {!reduceMotion &&
        motionOn &&
        TRANSIT_SOURCES.map((source) => {
          const d = transitCurvePath(source.anchorX, source.anchorY);
          const pathId = `tp-motion-${uid}-${source.id}`;
          return (
            <g key={`travel-${source.id}`}>
              <path id={pathId} d={d} fill="none" stroke="none" />
              <foreignObject width="5.5" height="3" x="-2.75" y="-1.5" className="overflow-visible">
                <div className="flex h-full w-full items-center justify-center [&]:overflow-visible">
                  <div className="origin-center scale-[0.34] sm:scale-[0.38]">
                    <TransitNodeTravel source={source} />
                  </div>
                </div>
                <animateMotion
                  dur={`${source.duration}s`}
                  repeatCount="indefinite"
                  begin={`${source.delay}s`}
                  href={`#${pathId}`}
                />
              </foreignObject>
            </g>
          );
        })}
    </svg>
  );
}
