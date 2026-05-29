"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Calendar,
  ExternalLink,
  Globe,
  Instagram,
  Facebook,
  FileText,
  QrCode,
} from "@/lib/icons";
import { getClubBrandPalette } from "@/lib/public-page/colors";
import type { PublicClubPageData } from "@/lib/public-page/types";

interface ClubPublicPageProps {
  initialData: PublicClubPageData;
}

function ClubLogo({
  logoUrl,
  title,
  accent,
  accentText,
}: {
  logoUrl: string | null;
  title: string;
  accent: string;
  accentText: string;
}) {
  const [imgError, setImgError] = useState(false);
  const showImage = Boolean(logoUrl) && !imgError;
  const initial = (title.trim().charAt(0) || "C").toUpperCase();

  if (showImage && logoUrl) {
    return (
      <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-2 border-white/40 bg-white shadow-lg ring-2 ring-black/5">
        <Image
          src={logoUrl}
          alt={title}
          fill
          className="object-contain p-2"
          sizes="80px"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-white/35 text-2xl font-bold shadow-lg ring-2 ring-black/5"
      style={{ backgroundColor: accent, color: accentText }}
      aria-hidden={!title}
    >
      {initial}
    </div>
  );
}

function ActionCard({
  href,
  label,
  description,
  accent,
  accentText,
  external,
  icon: Icon,
}: {
  href: string;
  label: string;
  description: string;
  accent: string;
  accentText: string;
  external?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const className =
    "group flex w-full items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md active:scale-[0.99]";

  const IconComponent = Icon || Calendar;

  const content = (
    <>
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm"
        style={{ backgroundColor: accent, color: accentText }}
      >
        <IconComponent className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">{label}</p>
        {description ? (
          <p className="mt-0.5 text-sm leading-snug text-slate-600">{description}</p>
        ) : null}
      </div>
      <ExternalLink className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:text-slate-600" />
    </>
  );

  if (external || href.startsWith("http") || href.startsWith("mailto:")) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

export default function ClubPublicPage({ initialData }: ClubPublicPageProps) {
  const brand = getClubBrandPalette(initialData.primaryColor);
  const buvetteHref = initialData.buvetteSlug
    ? `/club/${initialData.buvetteSlug}/buvette`
    : null;

  const actions: {
    key: string;
    href: string;
    label: string;
    description: string;
    external?: boolean;
    icon?: React.ComponentType<{ className?: string }>;
  }[] = [];

  if (initialData.showBuvette && buvetteHref) {
    actions.push({
      key: "buvette",
      href: buvetteHref,
      label: "Réserver la buvette",
      description: "Choisissez une date et envoyez votre demande en ligne.",
    });
  }

  if (initialData.matchProgram) {
    actions.push({
      key: "match-program",
      href: initialData.matchProgram.href,
      label: initialData.matchProgram.label,
      description: "Consultez le calendrier des matchs de la saison.",
      external: initialData.matchProgram.external,
      icon: FileText,
    });
  }

  for (const link of initialData.publicLinks) {
    actions.push({
      key: link.id,
      href: link.url,
      label: link.title,
      description: link.description || "Accéder au formulaire ou à l'inscription.",
      external: link.external,
      icon: QrCode,
    });
  }

  const socials = [
    { url: initialData.instagramUrl, label: "Instagram", Icon: Instagram },
    { url: initialData.facebookUrl, label: "Facebook", Icon: Facebook },
    { url: initialData.websiteUrl, label: "Site internet", Icon: Globe },
  ].filter((s) => s.url);

  const hasContent = actions.length > 0 || socials.length > 0;

  return (
    <div className="min-h-screen" style={{ background: brand.pageBackground }}>
      <header className="px-4 pb-16 pt-10 sm:px-6" style={{ background: brand.headerGradient }}>
        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
          <ClubLogo
            logoUrl={initialData.logoUrl}
            title={initialData.title}
            accent={brand.accent}
            accentText={brand.accentText}
          />
          <h1
            className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: brand.headerText }}
          >
            {initialData.title}
          </h1>
          {initialData.description ? (
            <p
              className="mt-3 max-w-md text-sm leading-relaxed sm:text-base"
              style={{ color: brand.headerTextMuted }}
            >
              {initialData.description}
            </p>
          ) : null}
        </div>
      </header>

      <main className="relative mx-auto -mt-10 max-w-lg px-4 pb-12 sm:px-6">
        {actions.length > 0 ? (
          <div className="space-y-3">
            {actions.map((action) => (
              <ActionCard
                key={action.key}
                href={action.href}
                label={action.label}
                description={action.description}
                accent={brand.accent}
                accentText={brand.accentText}
                external={action.external}
                icon={action.icon}
              />
            ))}
          </div>
        ) : null}

        {!hasContent ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-600 shadow-sm">
            Aucun lien actif pour le moment. Revenez bientôt.
          </div>
        ) : null}

        {socials.length > 0 ? (
          <div
            className={`flex items-center justify-center gap-4 ${actions.length > 0 ? "mt-10" : ""}`}
            style={{ ["--club-accent" as string]: brand.accent }}
          >
            {socials.map(({ url, label, Icon }) => (
              <a
                key={label}
                href={url!}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-[var(--club-accent)] hover:text-[var(--club-accent)] hover:shadow-md"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        ) : null}

        <p className="mt-10 text-center text-xs text-slate-400">
          Propulsé par{" "}
          <a
            href="https://obillz.com"
            className="font-medium text-slate-500 hover:text-slate-700"
            target="_blank"
            rel="noopener noreferrer"
          >
            Obillz
          </a>
        </p>
      </main>
    </div>
  );
}
