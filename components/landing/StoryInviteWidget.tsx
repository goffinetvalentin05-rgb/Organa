"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useI18n } from "@/components/I18nProvider";

type StoryInviteWidgetProps = {
  open: boolean;
  onDismiss: () => void;
};

function StoryMark() {
  return (
    <span className="landing-story-widget__mark" aria-hidden>
      <span className="landing-story-widget__mark-ring" />
      <span className="landing-story-widget__mark-core" />
      <span className="landing-story-widget__mark-spark" />
    </span>
  );
}

export default function StoryInviteWidget({ open, onDismiss }: StoryInviteWidgetProps) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="landing-story-widget-root">
      <AnimatePresence>
        {open ? (
          <motion.aside
            key="obillz-story-widget"
            className="landing-story-widget"
            role="dialog"
            aria-modal="false"
            aria-labelledby="story-invite-title"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -36, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -18, scale: 0.98 }}
            transition={
              reduceMotion
                ? { duration: 0.15 }
                : { type: "spring", stiffness: 420, damping: 30, mass: 0.85 }
            }
          >
            <span className="landing-story-widget__glow" aria-hidden />
            <span className="landing-story-widget__shine" aria-hidden />

            <button
              type="button"
              className="landing-story-widget__close"
              onClick={onDismiss}
              aria-label={t("marketing.storyInvite.close")}
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
            </button>

            <div className="landing-story-widget__body">
              <StoryMark />

              <div className="landing-story-widget__copy">
                <p className="landing-story-widget__label">
                  {t("marketing.storyInvite.label")}
                </p>
                <p id="story-invite-title" className="landing-story-widget__title">
                  {t("marketing.storyInvite.title")}
                </p>
                <p className="landing-story-widget__subtitle">
                  {t("marketing.storyInvite.description")}
                </p>
              </div>
            </div>

            <Link
              href="/notre-histoire"
              className="landing-story-widget__cta"
              onClick={onDismiss}
            >
              <span>{t("marketing.storyInvite.cta")}</span>
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
            </Link>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </div>,
    document.body
  );
}
