"use client";

import { useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "@/lib/icons";
import { cn } from "@/components/ui/cn";

type SettingsAccordionProps = {
  title: string;
  /** Seul accordéon ouvert par défaut sur la page (réduit le scroll). */
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
};

export default function SettingsAccordion({
  title,
  defaultOpen = false,
  children,
  className = "",
}: SettingsAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const reduceMotion = useReducedMotion();
  const baseId = useId();
  const panelId = `${baseId}-panel`;
  const btnId = `${baseId}-btn`;

  const panelTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC]",
        "transition-[border-color,box-shadow,background-color] duration-250 ease-out",
        open
          ? "border-[rgba(26,35,255,0.16)] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.05)]"
          : "hover:border-[rgba(26,35,255,0.14)] hover:bg-white hover:shadow-[0_4px_14px_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      <button
        id={btnId}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex min-h-[3.75rem] w-full touch-manipulation items-center justify-between gap-4 px-5 py-4 text-left",
          "transition-colors duration-250 sm:min-h-[4rem] sm:px-6 sm:py-5",
          open ? "bg-transparent" : "hover:bg-white/70",
        )}
      >
        <span className="text-[0.975rem] font-semibold leading-snug tracking-tight text-[#0F172A] sm:text-base">
          {title}
        </span>
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-250",
            open
              ? "border-[rgba(26,35,255,0.2)] bg-[rgba(26,35,255,0.08)] text-[#1A23FF]"
              : "border-[rgba(15,23,42,0.08)] bg-white text-[#94A3B8]",
          )}
        >
          <ChevronDown
            className={cn(
              "h-[18px] w-[18px] transition-transform duration-250 ease-out",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={btnId}
            key="panel"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={panelTransition}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 sm:px-5 sm:pb-5">
              <motion.div
                initial={reduceMotion ? false : { y: -6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={reduceMotion ? undefined : { y: -4, opacity: 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.22, delay: 0.04, ease: "easeOut" }
                }
                className="rounded-2xl border border-[rgba(15,23,42,0.06)] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-5"
              >
                {children}
              </motion.div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
