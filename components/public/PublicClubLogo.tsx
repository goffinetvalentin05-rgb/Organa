"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/components/ui";

type PublicClubLogoProps = {
  logoUrl: string | null;
  clubName: string;
  accentColor?: string;
  className?: string;
  /** Taille du conteneur (défaut : standard buvette / pages publiques). */
  size?: "md" | "lg";
};

const sizeClasses = {
  md: "h-20 w-20 sm:h-24 sm:w-24",
  lg: "h-28 w-28 sm:h-32 sm:w-32",
};

const initialTextClasses = {
  md: "text-2xl sm:text-3xl",
  lg: "text-3xl sm:text-4xl",
};

const imagePaddingClasses = {
  md: "p-2.5 sm:p-3",
  lg: "p-3 sm:p-4",
};

/**
 * Logo club pour pages publiques : toujours visible en entier (object-contain),
 * dans un cadre carré arrondi — jamais coupé par un cercle object-cover.
 */
export default function PublicClubLogo({
  logoUrl,
  clubName,
  accentColor = "#1A23FF",
  className,
  size = "lg",
}: PublicClubLogoProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = Boolean(logoUrl) && !imgError;
  const initial = (clubName.trim().charAt(0) || "C").toUpperCase();

  const boxClass = cn(
    "relative mx-auto flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
    sizeClasses[size]
  );

  if (showImage && logoUrl) {
    return (
      <div className={className}>
        <div className={boxClass}>
          <Image
            src={logoUrl}
            alt={clubName ? `Logo ${clubName}` : "Logo du club"}
            fill
            className={cn("object-contain", imagePaddingClasses[size])}
            sizes={size === "lg" ? "(max-width: 640px) 112px, 128px" : "(max-width: 640px) 80px, 96px"}
            onError={() => setImgError(true)}
            unoptimized={logoUrl.includes("supabase.co")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        className={cn(boxClass, "font-bold text-white", initialTextClasses[size])}
        style={{ backgroundColor: accentColor }}
        aria-hidden={!clubName}
      >
        {initial}
      </div>
    </div>
  );
}
