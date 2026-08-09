"use client";

type Props = {
  show: boolean;
  label: string;
  className?: string;
};

/** Indication discrète d’autosave / restauration — pas de toast. */
export default function DraftAutosaveHint({ show, label, className }: Props) {
  if (!show) return null;
  return (
    <p
      className={
        className ??
        "mb-2 flex items-center gap-2 text-xs font-medium tracking-wide text-white/55"
      }
      aria-live="polite"
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/90"
        aria-hidden
      />
      {label}
    </p>
  );
}
