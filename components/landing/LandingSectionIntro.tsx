"use client";

import type { ReactNode } from "react";

type LandingSectionIntroProps = {
  label?: string;
  title: ReactNode;
  description?: string;
  secondaryDescription?: string;
  /** split = titre à gauche + action à droite ; centered = centré ; stack = bloc gauche */
  layout?: "split" | "centered" | "stack";
  action?: ReactNode;
  className?: string;
};

export function landingSectionShellClass(first = false) {
  return [
    "landing-section relative scroll-mt-24",
    first ? "landing-section--first" : "",
    "pb-16 md:pb-24 lg:pb-28",
  ]
    .filter(Boolean)
    .join(" ");
}

export default function LandingSectionIntro({
  label,
  title,
  description,
  secondaryDescription,
  layout = "stack",
  action,
  className = "",
}: LandingSectionIntroProps) {
  if (layout === "split") {
    return (
      <div
        className={`landing-section-intro landing-section-intro--split flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between lg:gap-14 ${className}`}
      >
        <div className="landing-section-intro__copy max-w-2xl lg:max-w-[44rem]">
          {label ? <p className="landing-section-label">{label}</p> : null}
          <h2 className="landing-section-title">{title}</h2>
          {description ? <p className="landing-section-desc">{description}</p> : null}
        </div>
        {action ? (
          <div className="landing-section-intro__action shrink-0 lg:pb-1">{action}</div>
        ) : null}
      </div>
    );
  }

  if (layout === "centered") {
    return (
      <div
        className={`landing-section-intro landing-section-intro--centered mx-auto max-w-3xl text-center ${className}`}
      >
        {label ? <p className="landing-section-label">{label}</p> : null}
        <h2 className="landing-section-title">{title}</h2>
        {description ? (
          <p className="landing-section-desc mx-auto">{description}</p>
        ) : null}
        {secondaryDescription ? (
          <p className="landing-section-desc-secondary mx-auto">{secondaryDescription}</p>
        ) : null}
        {action ? <div className="landing-section-intro__action mt-8">{action}</div> : null}
      </div>
    );
  }

  return (
    <div className={`landing-section-intro landing-section-intro--stack ${className}`}>
      {label ? <p className="landing-section-label">{label}</p> : null}
      <h2 className="landing-section-title">{title}</h2>
      {description ? <p className="landing-section-desc">{description}</p> : null}
      {secondaryDescription ? (
        <p className="landing-section-desc-secondary">{secondaryDescription}</p>
      ) : null}
      {action ? <div className="landing-section-intro__action mt-8">{action}</div> : null}
    </div>
  );
}
