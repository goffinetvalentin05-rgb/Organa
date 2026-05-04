"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";
import { glassFrameClass, innerContentClass } from "./styles";

export type ListCardProps = {
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

/** Liste ou bloc de rangées dans un conteneur glass (filtres, résumés). */
export default function ListCard({ children, className, bodyClassName }: ListCardProps) {
  return (
    <div className={cn(glassFrameClass, className)}>
      <div className={cn(innerContentClass, "p-4 sm:p-5", bodyClassName)}>{children}</div>
    </div>
  );
}
