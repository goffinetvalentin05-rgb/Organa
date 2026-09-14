"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/components/ui";

type PublicClubMarkProps = {
  logoUrl: string | null;
  clubName: string;
  accentColor?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  onDark?: boolean;
};

const sizeClasses = {
  sm: "h-12 w-12 sm:h-14 sm:w-14",
  md: "h-16 w-16 sm:h-20 sm:w-20",
  lg: "h-16 w-16 sm:h-[5.5rem] sm:w-[5.5rem] lg:h-[6.5rem] lg:w-[6.5rem]",
};

const initialText = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl sm:text-4xl",
};

export default function PublicClubMark({
  logoUrl,
  clubName,
  accentColor = "#1A23FF",
  className,
  size = "lg",
  onDark = true,
}: PublicClubMarkProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = Boolean(logoUrl) && !imgError;
  const initial = (clubName.trim().charAt(0) || "C").toUpperCase();

  return (
    <div
      className={cn(
        "relative mx-auto flex shrink-0 items-center justify-center",
        sizeClasses[size],
        className
      )}
    >
      {showImage && logoUrl ? (
        <Image
          src={logoUrl}
          alt={clubName ? `Logo ${clubName}` : "Logo du club"}
          fill
          className="object-contain [filter:drop-shadow(0_8px_18px_rgba(0,0,0,0.35))]"
          sizes={size === "lg" ? "104px" : size === "md" ? "80px" : "56px"}
          onError={() => setImgError(true)}
          unoptimized={logoUrl.includes("supabase.co")}
        />
      ) : (
        <span
          className={cn(
            "font-bold [filter:drop-shadow(0_6px_12px_rgba(0,0,0,0.28))]",
            initialText[size],
            onDark ? "text-white" : "text-[#0F172A]"
          )}
          style={!onDark ? { color: accentColor } : undefined}
          aria-hidden
        >
          {initial}
        </span>
      )}
    </div>
  );
}
