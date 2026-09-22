"use client";

import Link from "next/link";
import { useId, type ReactNode } from "react";

export function formatHourValue(minutes: number) {
  const hours = Math.round((Math.max(0, minutes) / 60) * 10) / 10;
  return hours.toLocaleString("fr-CH", {
    minimumFractionDigits: Number.isInteger(hours) ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

export function formatCardDuration(minutes: number, period: string) {
  const safe = Math.max(0, minutes);
  if (safe < 60) return `≈ ${Math.round(safe)} min / ${period}`;
  return `≈ ${formatHourValue(safe)} h / ${period}`;
}

export function formatChf(amount: number) {
  return Math.round(Math.max(0, amount)).toLocaleString("fr-CH");
}

export function SimHero({ title, lead }: { title: string; lead: string }) {
  return (
    <header className="lp-calc__hero">
      <Link href="/" className="lp-calc__back">
        <svg viewBox="0 0 16 16" aria-hidden>
          <path d="M13 8H3M7 4 3 8l4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Retour
      </Link>
      <h1>{title}</h1>
      <p>{lead}</p>
    </header>
  );
}

export function SimSwitch({ on, label, onToggle }: { on: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={on ? "lp-calc__switch is-on" : "lp-calc__switch"}
      role="switch"
      aria-checked={on}
      aria-label={`${on ? "Désactiver" : "Activer"} ${label}`}
      onClick={onToggle}
    >
      <span />
    </button>
  );
}

export function SimCard({
  title,
  when,
  on,
  onToggle,
  result,
  hint,
  children,
}: {
  title: string;
  when: string;
  on: boolean;
  onToggle: () => void;
  result: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <article className={on ? "lp-calc__card" : "lp-calc__card is-off"}>
      <div className="lp-calc__card-head">
        <div>
          <h2>{title}</h2>
          <p>{when}</p>
        </div>
        <SimSwitch on={on} label={title} onToggle={onToggle} />
      </div>
      {hint ? <p className="lp-calc__hint">{hint}</p> : null}
      <div className="lp-calc__body">
        {children}
        <p className="lp-calc__card-result">{result}</p>
      </div>
    </article>
  );
}

export function SimStepper({
  label,
  value,
  min,
  max,
  onChange,
  suffix,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  suffix?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const clamp = (next: number) => Math.min(max, Math.max(min, Math.round(next)));

  return (
    <div className="lp-calc__field">
      <label htmlFor={id}>{label}</label>
      <div className="lp-calc__stepper">
        <button type="button" aria-label={`Diminuer ${label}`} disabled={disabled || value <= min} onClick={() => onChange(clamp(value - 1))}>
          −
        </button>
        <div className="lp-calc__value">
          <input
            id={id}
            inputMode="numeric"
            disabled={disabled}
            value={value}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => {
              const raw = event.target.value.replace(/[^\d]/g, "");
              if (raw === "") return;
              onChange(clamp(Number(raw)));
            }}
          />
          {suffix ? <span className="lp-calc__suffix">{suffix}</span> : null}
        </div>
        <button type="button" aria-label={`Augmenter ${label}`} disabled={disabled || value >= max} onClick={() => onChange(clamp(value + 1))}>
          +
        </button>
      </div>
      {max - min >= 50 ? (
        <input
          className="lp-calc__range"
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          disabled={disabled}
          aria-label={label}
          onChange={(event) => onChange(clamp(Number(event.target.value)))}
        />
      ) : null}
    </div>
  );
}

export function SimBars({ rows }: { rows: { label: string; value: number; text: string }[] }) {
  const total = rows.reduce((sum, row) => sum + Math.max(0, row.value), 0);
  return (
    <ul className="lp-calc__bars">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="lp-calc__bar-meta">
            <span>{row.label}</span>
            <span>{row.text}</span>
          </div>
          <div className="lp-calc__track" aria-hidden>
            <span style={{ width: total > 0 ? `${(Math.max(0, row.value) / total) * 100}%` : "0%" }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
