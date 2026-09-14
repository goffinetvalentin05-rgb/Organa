"use client";

import Link from "next/link";
import {
  Calendar,
  ExternalLink,
  Globe,
  Instagram,
  Facebook,
  FileText,
  QrCode,
} from "@/lib/icons";
import { cn } from "@/components/ui";
import PublicBrandingHero from "@/components/public-branding/PublicBrandingHero";
import PublicPageCanvas from "@/components/public-branding/PublicPageCanvas";
import { ctaColors, resolvePublicLayout } from "@/lib/public-branding/theme";
import { buildPublicClubTheme } from "@/lib/public-page/branding";
import type { PublicClubPageData } from "@/lib/public-page/types";

interface ClubPublicPageProps {
  initialData: PublicClubPageData;
}

function ActionCard({
  href,
  label,
  description,
  iconBackground,
  iconColor,
  external,
  icon: Icon,
  surfaceClass,
}: {
  href: string;
  label: string;
  description: string;
  iconBackground: string;
  iconColor: string;
  external?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  surfaceClass: string;
}) {
  const className = cn(
    "group flex w-full min-h-[4.75rem] items-center gap-4 rounded-[1.35rem] p-4 text-left transition duration-200 sm:p-5",
    "hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(15,23,42,0.12)] active:scale-[0.99]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    surfaceClass
  );

  const IconComponent = Icon || Calendar;

  const content = (
    <>
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[0_6px_16px_rgba(15,23,42,0.16)] sm:h-[3.25rem] sm:w-[3.25rem]"
        style={{ backgroundColor: iconBackground, color: iconColor }}
      >
        <IconComponent className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold leading-snug tracking-tight text-[#0F172A] sm:text-base">
          {label}
        </p>
        {description ? (
          <p className="mt-1 text-sm leading-snug text-[#64748B]">{description}</p>
        ) : null}
      </div>
      <ExternalLink className="h-5 w-5 shrink-0 text-[#94A3B8] transition group-hover:translate-x-0.5 group-hover:text-[#64748B]" />
    </>
  );

  if (external || href.startsWith("http") || href.startsWith("mailto:")) {
    return (
      <a
        href={href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
        style={{ ["--tw-ring-color" as string]: iconBackground }}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className} style={{ ["--tw-ring-color" as string]: iconBackground }}>
      {content}
    </Link>
  );
}

export default function ClubPublicPage({ initialData }: ClubPublicPageProps) {
  const theme =
    initialData.theme ||
    buildPublicClubTheme({
      title: initialData.title,
      description: initialData.description,
      primaryColor: initialData.primaryColor,
      label: null,
      secondaryColor: null,
      accentColor: null,
      pageStyle: "colors",
      imagePosition: "center",
      overlayIntensity: "normal",
      bannerUrl: null,
      clubName: initialData.clubName || initialData.title,
    });
  const layout = resolvePublicLayout(theme);
  const cta = ctaColors(theme.primaryColor, theme.secondaryColor, theme.accentColor);
  const clubName = initialData.clubName || theme.title;
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
      icon: Calendar,
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
  const footerColor = layout.immersive ? "rgba(255,255,255,0.65)" : "#94A3B8";
  const footerLinkColor = layout.immersive ? "rgba(255,255,255,0.82)" : "#64748B";

  return (
    <PublicPageCanvas theme={theme} priority>
      <PublicBrandingHero clubName={clubName} logoUrl={initialData.logoUrl} theme={theme} />

      <main className="relative z-10 mx-auto w-full max-w-lg px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="-mt-8 space-y-3 sm:-mt-10">
          {actions.length > 0
            ? actions.map((action) => (
                <ActionCard
                  key={action.key}
                  href={action.href}
                  label={action.label}
                  description={action.description}
                  iconBackground={cta.background}
                  iconColor={cta.color}
                  external={action.external}
                  icon={action.icon}
                  surfaceClass={layout.surfaceClass}
                />
              ))
            : null}

          {!hasContent ? (
            <div
              className={cn(
                "rounded-[1.35rem] px-6 py-8 text-center text-sm text-[#64748B]",
                layout.surfaceClass
              )}
            >
              Aucun lien actif pour le moment. Revenez bientôt.
            </div>
          ) : null}
        </div>

        {socials.length > 0 ? (
          <div
            className={cn(
              "mx-auto mt-8 flex w-fit items-center justify-center gap-1.5 rounded-full px-2 py-2 sm:mt-10",
              layout.surfaceClass
            )}
          >
            {socials.map(({ url, label, Icon }) => (
              <a
                key={label}
                href={url!}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-12 w-12 items-center justify-center rounded-full text-[#334155] transition hover:bg-[rgba(15,23,42,0.05)] hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ ["--tw-ring-color" as string]: cta.background }}
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        ) : null}

        <p className="mt-10 text-center text-xs" style={{ color: footerColor }}>
          Propulsé par{" "}
          <a
            href="https://obillz.com"
            className="font-medium transition hover:opacity-80"
            style={{ color: footerLinkColor }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Obillz
          </a>
        </p>
      </main>
    </PublicPageCanvas>
  );
}
