"use client";

import { useRef, useState } from "react";
import Header from "@/components/Header";
import Link from "next/link";

function HighlightedWord({ children }: { children: string }) {
  return (
    <span className="relative inline-block px-1 text-[#60A5FA]">
      <span className="relative z-10">{children}</span>
      <svg
        viewBox="0 0 210 52"
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-3 left-0 z-0 h-[0.7em] w-full translate-y-1 rotate-[-1.2deg]"
      >
        <path
          d="M5 34C31 22 60 16 97 16C136 16 167 22 205 33"
          stroke="#60A5FA"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
          strokeOpacity="0.45"
        />
        <path
          d="M8 38C49 26 87 22 127 24C157 26 182 30 202 36"
          stroke="#2563EB"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          strokeOpacity="0.9"
        />
      </svg>
    </span>
  );
}

function CtaIcon() {
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor">
        <path
          d="M7 17L17 7M17 7H9M17 7V15"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function MockupFrame() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <div id="apercu-plateforme" className="mx-auto mt-14 w-full max-w-5xl">
      <div className="rounded-[1.9rem] border border-white/20 bg-white/10 p-2 shadow-[0_34px_80px_rgba(2,6,23,0.35)] backdrop-blur-sm sm:p-3 md:p-4">
        <div className="overflow-hidden rounded-[1.35rem] border border-white/15 bg-[#0A1128] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="flex items-center justify-between border-b border-white/10 bg-black/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/90" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300/90" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
            </div>
            <div className="h-2 w-24 rounded-full bg-white/10" />
          </div>
          <div className="group relative aspect-video overflow-hidden">
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_22%_18%,rgba(37,99,235,0.3),transparent_52%),radial-gradient(circle_at_80%_82%,rgba(59,130,246,0.22),transparent_58%)]" />
            <video
              ref={videoRef}
              autoPlay
              muted={isMuted}
              loop
              playsInline
              preload="metadata"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="relative z-10 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.015]"
            >
              <source src="/video-obillz-landingpage.mov" type="video/mp4" />
              <source src={encodeURI("/Vidéo-obillz-landingpage.MOV")} type="video/mp4" />
            </video>
            <div className="absolute bottom-4 right-4 z-20 flex gap-2 sm:bottom-5 sm:right-5">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Mettre en pause" : "Lire la vidéo"}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white shadow-[0_8px_20px_rgba(2,6,23,0.35)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/20 sm:h-11 sm:w-11"
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4 translate-x-[1px]" fill="currentColor" aria-hidden="true">
                    <path d="M8 6.5a1 1 0 0 1 1.54-.84l8.2 5.5a1 1 0 0 1 0 1.68l-8.2 5.5A1 1 0 0 1 8 17.5v-11z" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={toggleSound}
                aria-label={isMuted ? "Activer le son" : "Couper le son"}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white shadow-[0_8px_20px_rgba(2,6,23,0.35)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/20 sm:h-11 sm:w-11"
              >
                {isMuted ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" aria-hidden="true">
                    <path
                      d="M14 8.5v7a.5.5 0 0 1-.85.35L10.3 13H7.5A1.5 1.5 0 0 1 6 11.5v-1A1.5 1.5 0 0 1 7.5 9h2.8l2.85-2.85A.5.5 0 0 1 14 6.5z"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <path d="M17 10l4 4M21 10l-4 4" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" aria-hidden="true">
                    <path
                      d="M14 8.5v7a.5.5 0 0 1-.85.35L10.3 13H7.5A1.5 1.5 0 0 1 6 11.5v-1A1.5 1.5 0 0 1 7.5 9h2.8l2.85-2.85A.5.5 0 0 1 14 6.5z"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <path d="M17 9.5a4.5 4.5 0 0 1 0 5" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M19.5 7a8 8 0 0 1 0 10" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <div className="bg-white pt-5">
      <Header />

      <section
        id="hero-obillz"
        className="relative isolate overflow-hidden px-4 pb-10 pt-10 text-slate-900 sm:px-8 md:pb-16 md:pt-16"
      >
        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mx-auto mt-8 max-w-5xl text-balance text-[2rem] font-extrabold leading-[1.03] tracking-[-0.03em] sm:text-5xl md:text-6xl lg:text-[4.1rem]">
              La plateforme qui <HighlightedWord>simplifie</HighlightedWord> la gestion des clubs
              sportifs
            </h1>

            <p className="mx-auto mt-7 max-w-3xl text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
              Gérez membres, cotisations, événements, bénévoles et finances depuis une seule
              plateforme simple.
            </p>

            <div className="mt-10">
              <Link
                href="/inscription"
                className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-8 py-4 text-base font-semibold text-white shadow-[0_18px_35px_rgba(37,99,235,0.38)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(37,99,235,0.44)] sm:w-auto"
              >
                <span>Démarrer gratuitement</span>
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                  <CtaIcon />
                </span>
              </Link>
              <p className="mt-3 text-sm text-slate-500">Sans engagement • aucune carte bancaire requise</p>
            </div>
          </div>

          <MockupFrame />
        </div>
      </section>
    </div>
  );
}
