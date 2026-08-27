"use client";

import { useEffect, useId, useRef, type RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import BodyPortal from "@/components/ui/BodyPortal";
import { easePremium } from "@/components/landing/landing-motion";

const DEMO_POSTER = "/video/obillz-poster.webp";
const DEMO_WEBM = "/video/obillz-demo.webm";
const DEMO_MP4 = "/video/obillz-demo.mp4";

function lockPageScroll() {
  const root = document.documentElement;
  const previous = {
    overflow: root.style.overflow,
    paddingRight: document.body.style.paddingRight,
  };
  const scrollbar = window.innerWidth - root.clientWidth;
  root.style.overflow = "hidden";
  if (scrollbar > 0) {
    document.body.style.paddingRight = `${scrollbar}px`;
  }
  return () => {
    root.style.overflow = previous.overflow;
    document.body.style.paddingRight = previous.paddingRight;
  };
}

export default function HeroDemoVideo({
  open,
  onClose,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  triggerRef?: RefObject<HTMLButtonElement | null>;
}) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const unlock = lockPageScroll();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (document.fullscreenElement) return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 20);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKey);
      unlock();
      window.setTimeout(() => triggerRef?.current?.focus(), 20);
    };
  }, [onClose, open, triggerRef]);

  useEffect(() => {
    if (!open) return;
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.muted = false;
    void video.play().catch(() => {
      /* autoplay policy — l’utilisateur pourra lancer via les contrôles */
    });
  }, [open]);

  useEffect(() => {
    if (open) return;
    videoRef.current?.pause();
  }, [open]);

  return (
    <BodyPortal open={open}>
      <AnimatePresence>
        {open ? (
          <motion.div
            key="modal"
            className="landing-demo-modal pointer-events-auto"
            role="presentation"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.28, ease: easePremium }}
          >
            <button
              type="button"
              className="landing-demo-modal__backdrop"
              aria-label={t("marketing.hero.videoClose")}
              onClick={onClose}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="landing-demo-modal__dialog"
              initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: reduceMotion ? 0.12 : 0.32, ease: easePremium }}
            >
              <h2 id={titleId} className="sr-only">
                {t("marketing.hero.videoDialogLabel")}
              </h2>
              <button
                ref={closeRef}
                type="button"
                className="landing-demo-modal__close"
                onClick={onClose}
                aria-label={t("marketing.hero.videoClose")}
              >
                <X className="h-5 w-5" strokeWidth={2.25} />
              </button>
              <div className="landing-demo-modal__frame">
                <video
                  ref={videoRef}
                  className="landing-demo-modal__video"
                  disablePictureInPicture
                  playsInline
                  controls
                  controlsList="nodownload noplaybackrate"
                  preload="metadata"
                  poster={DEMO_POSTER}
                >
                  <source src={DEMO_WEBM} type="video/webm" />
                  <source src={DEMO_MP4} type="video/mp4" />
                </video>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </BodyPortal>
  );
}
