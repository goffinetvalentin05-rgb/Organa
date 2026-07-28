"use client";

import { cn } from "@/components/ui/cn";

type PremiumSwitchProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

/**
 * Switch premium (200–250 ms) — design system dashboard clair.
 */
export default function PremiumSwitch({
  checked,
  onChange,
  id,
  disabled = false,
  className,
  "aria-label": ariaLabel,
}: PremiumSwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-250 ease-out",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A23FF]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked
          ? "bg-gradient-to-r from-[#2563EB] via-[#1A23FF] to-[#151dd9] shadow-[0_2px_8px_rgba(26,35,255,0.28)]"
          : "bg-[#CBD5E1]",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-250 ease-out",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}
