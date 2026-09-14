"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/components/ui";

type SupportersClubMarkProps = {
  logoUrl: string | null;
  clubName: string;
  accentColor?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  /** glass = hero sombre ; light = fond clair. */
  tone?: "glass" | "light";
};

const sizeClasses = {
  sm: "h-14 w-14 sm:h-16 sm:w-16",
  md: "h-20 w-20 sm:h-24 sm:w-24",
  lg: "h-[5.5rem] w-[5.5rem] sm:h-28 sm:w-28",
};

const initialText = {
  sm: "text-xl",
  md: "text-2xl sm:text-3xl",
  lg: "text-3xl sm:text-4xl",
};

export default function SupportersClubMark({
  logoUrl,
  clubName,
  accentColor = "#1A23FF",
  className,
  size = "lg",
  tone = "glass",
}: SupportersClubMarkProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = Boolean(logoUrl) && !imgError;
  const initial = (clubName.trim().charAt(0) || "C").toUpperCase();
  const glass = tone === "glass";

  return (
    <div className={cn("relative mx-auto shrink-0", sizeClasses[size], className)}>
      <div
        className="absolute -inset-3 rounded-full opacity-70 blur-2xl"
        style={{ background: `${accentColor}55` }}
        aria-hidden
      />
      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center overflow-hidden rounded-[1.6rem] shadow-[0_12px_36px_rgba(2,6,23,0.22)]",
          glass
            ? "border border-white/25 bg-white/12 backdrop-blur-md"
            : "border border-white/80 bg-white/90"
        )}
      >
        {showImage && logoUrl ? (
          <Image
            src={logoUrl}
            alt={clubName ? `Logo ${clubName}` : "Logo du club"}
            fill
            className="object-contain p-2.5 sm:p-3"
            sizes={size === "lg" ? "112px" : size === "md" ? "96px" : "64px"}
            onError={() => setImgError(true)}
            unoptimized={logoUrl.includes("supabase.co")}
          />
        ) : (
          <span
            className={cn("font-bold", initialText[size], glass ? "text-white" : "text-[#0F172A]")}
            aria-hidden
          >
            {initial}
          </span>
        )}
      </div>
    </div>
  );
}
