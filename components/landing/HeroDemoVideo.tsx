"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";

type PlayState = "idle" | "playing" | "paused" | "ended";

function useIsCompact() {
  const [compact, setCompact] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 768px)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return compact;
}

export default function HeroDemoVideo() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const isCompact = useIsCompact();

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [playState, setPlayState] = useState<PlayState>("idle");
  const [muted, setMuted] = useState(true);
  const [userPaused, setUserPaused] = useState(false);
  const [inViewDeep, setInViewDeep] = useState(false);

  const userPausedRef = useRef(false);
  const mutedRef = useRef(true);
  const playStateRef = useRef<PlayState>("idle");

  useEffect(() => {
    userPausedRef.current = userPaused;
  }, [userPaused]);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);
  useEffect(() => {
    playStateRef.current = playState;
  }, [playState]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    /* Mobile : progress bas tant que la vidéo est en bas d’écran (reste inclinée) */
    offset: isCompact
      ? ["start 0.9", "start 0.32"]
      : ["start 0.62", "start 0.22"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: isCompact ? 140 : 120,
    damping: isCompact ? 32 : 28,
    restDelta: 0.001,
    mass: 0.35,
  });

  const progress = reduceMotion ? scrollYProgress : smoothProgress;

  const rotateX = useTransform(
    progress,
    [0, 1],
    reduceMotion || isCompact ? [0, 0] : [8.5, 0]
  );
  const scale = useTransform(
    progress,
    [0, 1],
    reduceMotion || isCompact ? [1, 1] : [0.935, 1]
  );
  const y = useTransform(
    progress,
    [0, 1],
    reduceMotion || isCompact ? [0, 0] : [28, 0]
  );
  const opacity = useTransform(
    progress,
    [0, 1],
    reduceMotion || isCompact ? [1, 1] : [0.94, 1]
  );

  const syncFromVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.ended) {
      setPlayState("ended");
      return;
    }
    if (video.paused) {
      setPlayState(video.currentTime > 0.05 ? "paused" : "idle");
      return;
    }
    setPlayState("playing");
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setPlayState("playing");
    const onPause = () => syncFromVideo();
    const onEnded = () => setPlayState("ended");

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
    };
  }, [syncFromVideo]);

  const tryAutoplayMuted = useCallback(async () => {
    const video = videoRef.current;
    if (!video || userPausedRef.current) return;
    if (playStateRef.current === "ended") return;
    if (!video.paused && !video.ended) return;

    video.muted = true;
    setMuted(true);
    try {
      await video.play();
    } catch {
      /* Autoplay policy — l’utilisateur pourra lancer manuellement */
    }
  }, []);

  const pauseFromScroll = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.paused || video.ended) return;
    /* Pause douce sans marquer comme pause utilisateur */
    video.pause();
  }, []);

  useMotionValueEvent(progress, "change", (value) => {
    if (reduceMotion || isCompact) return;
    if (value >= 0.82) {
      void tryAutoplayMuted();
    }
  });

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const ratio = entry.intersectionRatio;
        const deep = ratio >= 0.45;
        setInViewDeep(deep);

        if (reduceMotion) {
          if (deep) void tryAutoplayMuted();
          else if (ratio < 0.18) pauseFromScroll();
          return;
        }

        /* Hystérésis : éviter play/pause au moindre scroll */
        if (ratio < 0.18) {
          pauseFromScroll();
        }
      },
      { threshold: [0, 0.18, 0.45, 0.7, 0.9] }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [pauseFromScroll, reduceMotion, tryAutoplayMuted]);

  const togglePlayback = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      if (video.ended) video.currentTime = 0;
      setUserPaused(false);
      /* Clic utilisateur → son activé */
      video.muted = false;
      setMuted(false);
      try {
        await video.play();
      } catch {
        /* ignore */
      }
      return;
    }

    setUserPaused(true);
    video.pause();
  }, []);

  const toggleMute = useCallback(async (e: MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const next = !mutedRef.current;
    video.muted = next;
    setMuted(next);

    if (!next && video.paused && !userPausedRef.current) {
      try {
        await video.play();
      } catch {
        /* ignore */
      }
    }
  }, []);

  const isPlaying = playState === "playing";
  const showCenterPlay =
    playState === "idle" ||
    playState === "ended" ||
    (playState === "paused" && userPaused);

  return (
    <div ref={containerRef} className="landing-hero-video">
      <div className="landing-hero-video__stage">
        <span className="landing-hero-video__glow" aria-hidden />

        <motion.div
          className={[
            "landing-hero-video__shell",
            isPlaying ? "is-playing" : "",
            playState === "paused" ? "is-paused" : "",
            inViewDeep ? "is-in-view" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={
            reduceMotion || isCompact
              ? undefined
              : {
                  rotateX,
                  scale,
                  y,
                  opacity,
                  transformPerspective: 1200,
                  transformOrigin: "center top",
                }
          }
        >
          <div className="landing-hero-video__frame">
            <video
              ref={videoRef}
              className="landing-hero-video__media"
              playsInline
              muted={muted}
              preload="metadata"
              poster="/video/obillz-poster.webp"
              controls={false}
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              onClick={() => void togglePlayback()}
            >
              <source src="/video/obillz-demo.webm" type="video/webm" />
              <source src="/video/obillz-demo.mp4" type="video/mp4" />
            </video>

            {showCenterPlay ? (
              <button
                type="button"
                className={[
                  "landing-hero-video__play",
                  playState === "paused" ? "landing-hero-video__play--resume" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => void togglePlayback()}
                aria-label={
                  playState === "ended"
                    ? t("marketing.hero.videoReplay")
                    : t("marketing.hero.videoPlay")
                }
              >
                <span className="landing-hero-video__play-ring" aria-hidden />
                <span className="landing-hero-video__play-core" aria-hidden>
                  <Play
                    className="landing-hero-video__play-icon"
                    strokeWidth={2.25}
                  />
                </span>
              </button>
            ) : null}

            {isPlaying || (playState === "paused" && !userPaused) ? (
              <div className="landing-hero-video__controls">
                <button
                  type="button"
                  className="landing-hero-video__ctrl"
                  onClick={() => void togglePlayback()}
                  aria-label={
                    isPlaying
                      ? t("marketing.hero.videoPause")
                      : t("marketing.hero.videoPlay")
                  }
                >
                  {isPlaying ? (
                    <Pause className="h-3.5 w-3.5" strokeWidth={2.25} />
                  ) : (
                    <Play className="h-3.5 w-3.5" strokeWidth={2.25} />
                  )}
                </button>
                <button
                  type="button"
                  className="landing-hero-video__ctrl"
                  onClick={(e) => void toggleMute(e)}
                  aria-label={
                    muted
                      ? t("marketing.hero.videoUnmute")
                      : t("marketing.hero.videoMute")
                  }
                >
                  {muted ? (
                    <VolumeX className="h-3.5 w-3.5" strokeWidth={2.25} />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                  )}
                </button>
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
