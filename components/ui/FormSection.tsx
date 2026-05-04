"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";
import { glassFrameClass, innerContentClass } from "./styles";

export type FormSectionProps = {
  children: ReactNode;
  className?: string;
  /** Padding du panneau intérieur. */
  paddingClassName?: string;
};

/** Bloc formulaire dans le cadre glass (paramètres, sponsoring, etc.). */
export default function FormSection({
  children,
  className,
  paddingClassName = "p-5 sm:p-6 md:p-8",
}: FormSectionProps) {
  return (
    <div className={cn(glassFrameClass, className)}>
      <div className={cn(innerContentClass, paddingClassName, "space-y-6")}>{children}</div>
    </div>
  );
}
