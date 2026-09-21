"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/components/ui/cn";

function ObillzMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      className={className}
      fill="none"
    >
      <rect width="32" height="32" rx="9" className="fill-[#EEF2FF]" />
      <circle
        cx="16"
        cy="16"
        r="7.25"
        className="stroke-[#1A23FF]"
        strokeWidth="2.25"
      />
    </svg>
  );
}

export type ProcessingOverlayProps = {
  visible?: boolean;
  open?: boolean;
  title?: string;
  /** Alias de `title` — conservé pour les usages existants. */
  message?: string;
  description?: string;
};

export function ProcessingOverlay({
  visible,
  open,
  title,
  message,
  description,
}: ProcessingOverlayProps) {
  const shown = open ?? visible ?? false;
  const label = (title || message || "").trim();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!shown) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [shown]);

  return (
    <AnimatePresence>
      {shown ? (
        <motion.div
          key="processing-overlay"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.08 : 0.18 }}
          className="fixed inset-0 z-[9999] flex cursor-wait items-center justify-center bg-[#0F172A]/25 p-4 backdrop-blur-[6px]"
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label={label || "Traitement en cours"}
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 4 }}
            transition={{ duration: reduceMotion ? 0.08 : 0.2 }}
            className="flex w-[min(92vw,20.5rem)] flex-col items-center rounded-[1.5rem] border border-[#E5E7EB] bg-white px-7 py-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_rgba(15,23,42,0.1)]"
            onClick={(event) => event.stopPropagation()}
          >
            <ObillzMark className="h-10 w-10" />
            {label ? (
              <p className="mt-4 text-[0.95rem] font-semibold tracking-tight text-[#0F172A]">
                {label}
              </p>
            ) : null}
            {description ? (
              <p className="mt-1.5 text-sm leading-relaxed text-[#64748B]">
                {description}
              </p>
            ) : null}
            <span
              aria-hidden
              className={cn(
                "mt-5 h-[22px] w-[22px] rounded-full border-[1.5px] border-[#E5E7EB] border-t-[#1A23FF] motion-reduce:animate-none",
                !reduceMotion && "animate-spin"
              )}
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/** Nom historique — même composant. */
export default function SubmittingOverlay(props: ProcessingOverlayProps) {
  return <ProcessingOverlay {...props} />;
}
