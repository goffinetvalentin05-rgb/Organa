"use client";

import { useRef, useState } from "react";
import Header from "@/components/Header";
import Link from "next/link";

function CtaIcon() {
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-current/10">
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-current" fill="none" stroke="currentColor">
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

/** Positions relatives au bloc mockup (pas au hero entier) : md = tablette, lg+ = desktop premium */
const heroSideCards = [
  {
    title: "Membres du club",
    line: "+284 membres actifs",
    floatClass:
      "-left-1 top-[14%] -translate-x-1 -rotate-6 md:-left-0.5 md:top-[16%] md:scale-[0.92] md:-translate-x-1 md:-rotate-5 lg:-left-2 lg:top-[18%] lg:scale-100 lg:-translate-x-3 lg:-rotate-6 animate-float [animation-delay:80ms]",
  },
  {
    title: "Cotisations payées",
    line: "92% ce mois",
    floatClass:
      "-right-1 top-[12%] translate-x-1 rotate-6 md:-right-0.5 md:top-[14%] md:scale-[0.92] md:translate-x-1 md:rotate-5 lg:-right-2 lg:top-[16%] lg:scale-100 lg:translate-x-3 lg:rotate-6 animate-float [animation-delay:160ms]",
  },
  {
    title: "Événements",
    line: "4 à venir",
    floatClass:
      "left-[2%] bottom-[18%] -rotate-3 md:left-[3%] md:bottom-[16%] md:scale-[0.92] md:-rotate-2 lg:left-[5%] lg:bottom-[14%] lg:scale-100 lg:-rotate-3 animate-float [animation-delay:240ms]",
  },
  {
    title: "Finances",
    line: "Vue claire du solde",
    floatClass:
      "right-[2%] bottom-[16%] rotate-3 md:right-[3%] md:bottom-[14%] md:scale-[0.92] md:rotate-2 lg:right-[5%] lg:bottom-[12%] lg:scale-100 lg:rotate-3 animate-float [animation-delay:320ms]",
  },
] as const;

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
    <div id="apercu-plateforme" className="relative mx-auto w-full max-w-6xl" data-reveal>
      <div className="pointer-events-none absolute inset-x-[12%] top-[18%] -z-10 h-[62%] rounded-full bg-[radial-gradient(circle,rgba(147,197,253,0.32),rgba(147,197,253,0)_70%)] blur-3xl" />
      <div className="rounded-[1.9rem] border border-white/20 bg-white/10 p-2 shadow-[0_34px_80px_rgba(2,6,23,0.35)] backdrop-blur-sm sm:p-3 md:p-4 [transform:perspective(1100px)_rotateX(3deg)]">
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
    <div className="bg-[#2563EB] pt-5 text-white">
      <Header />

      <section
        id="hero-obillz"
        className="relative isolate overflow-visible px-4 pb-12 pt-10 sm:px-8 md:pb-20 md:pt-16"
      >
        <div className="pointer-events-none absolute -left-20 top-12 h-[18rem] w-[18rem] rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-24 h-[22rem] w-[22rem] rounded-full bg-[#60A5FA]/30 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-[35%] h-[18rem] w-[36rem] -translate-x-1/2 rounded-full bg-[#1D4ED8]/60 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="relative z-20 mx-auto max-w-4xl text-center">
            <h1 className="mx-auto mt-8 max-w-5xl text-balance text-[2rem] font-extrabold leading-[1.03] tracking-[-0.03em] sm:text-5xl md:text-6xl lg:text-[4.1rem]">
              Gérer un club sportif ne devrait pas être un casse-tête administratif.
            </h1>

            <p className="mx-auto mt-7 max-w-3xl text-pretty text-base leading-relaxed text-blue-50 sm:text-lg">
              Moins d&apos;Excel.
              <br />
              Moins de messages WhatsApp.
              <br />
              Plus de temps pour votre club.
            </p>

            <ul className="mx-auto mt-7 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
              {[
                "Centralisez les membres",
                "Suivez les cotisations",
                "Organisez événements et bénévoles",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm font-medium text-white/95 backdrop-blur-sm">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#2563EB]">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/inscription"
                  className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-white px-8 py-4 text-base font-semibold text-[#1D4ED8] shadow-[0_18px_35px_rgba(2,6,23,0.2)] transition duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_26px_50px_rgba(2,6,23,0.3)] sm:w-auto"
                >
                  <span>Créer mon club gratuitement</span>
                  <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                    <CtaIcon />
                  </span>
                </Link>
                <a
                  href="#comment-ca-marche"
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/45 bg-transparent px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10 sm:w-auto"
                >
                  Voir comment ça fonctionne
                </a>
              </div>
              <p className="mt-3 text-sm text-blue-100">Sans engagement • aucune carte bancaire requise</p>
            </div>

            {/* < md : cartes dans le flux (alternative responsive). ≥ md : même infos en flottant autour du mockup. */}
            <div className="mx-auto mt-10 grid w-full max-w-lg grid-cols-1 gap-3 sm:max-w-2xl sm:grid-cols-2 md:hidden">
              {heroSideCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-xl border border-white/25 bg-white/12 px-4 py-3 text-left text-sm text-white shadow-[0_14px_30px_rgba(2,6,23,0.22)] backdrop-blur-sm"
                >
                  <p className="font-semibold">{card.title}</p>
                  <p className="text-xs text-blue-100 sm:text-sm">{card.line}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tablette + desktop : cartes flottantes au-dessus du mockup (ancrage sur la zone visuelle) */}
          <div className="relative mx-auto mt-14 w-full max-w-6xl max-md:mt-10">
            <MockupFrame />
            <div className="pointer-events-none absolute inset-0 z-10 hidden md:block">
              {heroSideCards.map((card) => (
                <div
                  key={`float-${card.title}`}
                  className={`absolute rounded-xl border border-white/25 bg-white/12 px-3 py-2.5 text-sm text-white shadow-[0_12px_26px_rgba(2,6,23,0.2)] backdrop-blur-sm md:px-3.5 md:py-3 md:text-[0.8125rem] lg:px-4 lg:py-3 lg:text-sm ${card.floatClass}`}
                >
                  <p className="font-semibold">{card.title}</p>
                  <p className="text-blue-100">{card.line}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
