"use client";

import { useId, type ReactNode } from "react";
import { cn } from "./cn";
import { dashboardCheckboxClass } from "./styles";

type CheckboxRowProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  id?: string;
  className?: string;
};

/**
 * Ligne entière cliquable, label relié, hit area confortable.
 * L’état visuel suit `checked` immédiatement (optimistic côté parent).
 */
export default function CheckboxRow({
  checked,
  onChange,
  label,
  description,
  disabled,
  id,
  className,
}: CheckboxRowProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "flex min-h-11 cursor-pointer items-start gap-3 rounded-xl px-1 py-2",
        disabled && "cursor-not-allowed opacity-70",
        className
      )}
    >
      <input
        id={inputId}
        type="checkbox"
        className={cn(dashboardCheckboxClass, "mt-0.5")}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-[#0F172A]">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-[#64748B]">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
