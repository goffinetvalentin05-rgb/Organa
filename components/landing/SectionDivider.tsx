"use client";

/** Séparation visuelle entre grandes sections */
export default function SectionDivider() {
  return (
    <div className="relative mx-auto my-16 w-[94%] max-w-[1160px] md:my-24" aria-hidden>
      <div className="h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 shadow-[0_0_12px_rgba(255,255,255,0.5)]" />
    </div>
  );
}
