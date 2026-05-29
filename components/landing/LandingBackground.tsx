"use client";

/** Lueurs et matière visuelle partagées entre les sections landing. */
export default function LandingBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-[20%] top-[8%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.14),transparent_65%)] blur-3xl" />
      <div className="absolute -right-[15%] top-[35%] h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.18),transparent_68%)] blur-3xl" />
      <div className="absolute bottom-[5%] left-1/2 h-[400px] w-[min(100%,720px)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(26,35,255,0.35),transparent_70%)] blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
    </div>
  );
}
