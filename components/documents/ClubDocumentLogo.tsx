"use client";

import { useState } from "react";

type ClubDocumentLogoProps = {
  logoUrl?: string | null;
  clubName?: string;
  className?: string;
};

/**
 * Logo club sur les aperçus facture/cotisation : masqué si absent ou en erreur de chargement.
 */
export default function ClubDocumentLogo({
  logoUrl,
  clubName,
  className = "h-12 w-auto object-contain",
}: ClubDocumentLogoProps) {
  const [imgError, setImgError] = useState(false);
  const src = logoUrl?.trim();

  if (!src || imgError) return null;

  return (
    <img
      src={src}
      alt={clubName ? `Logo ${clubName}` : "Logo"}
      className={className}
      onError={() => setImgError(true)}
    />
  );
}
