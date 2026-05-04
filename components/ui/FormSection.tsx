"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";
import { unifiedSectionShellClass, unifiedSectionBodyClass } from "./styles";

export type FormSectionProps = {
  children: ReactNode;
  className?: string;
  paddingClassName?: string;
};

/** Bloc formulaire — une seule carte continue. */
export default function FormSection({ children, className, paddingClassName }: FormSectionProps) {
  return (
    <div className={cn(unifiedSectionShellClass, className)}>
      <div className={cn("space-y-6", paddingClassName ?? unifiedSectionBodyClass)}>{children}</div>
    </div>
  );
}
