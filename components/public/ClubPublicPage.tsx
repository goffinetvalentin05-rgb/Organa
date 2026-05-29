"use client";

import Image from "next/image";
import Link from "next/link";
import { Calendar, ExternalLink, Globe, Instagram, Facebook } from "@/lib/icons";
import type { PublicClubPageData } from "@/lib/public-page/types";

interface ClubPublicPageProps {
  slug: string;
  initialData: PublicClubPageData;
}

function ClubLogo({
  logoUrl,
  title,
  color,
}: {
  logoUrl: string | null;
  title: string;
  color: string;
}) {
  if (logoUrl) {
    return (
      <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-2 border-white/30 bg-white shadow-lg">
        <Image src={logoUrl} alt={title} fill className="object-contain p-2" sizes="80px" />
      </div>
    );
  }

  return (
    <div
      className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-white/30 text-2xl font-bold text-white shadow-lg"
      style={{ backgroundColor: color }}
    >
      {title.charAt(0).toUpperCase()}
    </div>
  );
}

function ActionCard({
  href,
  label,
  description,
  color,
  external,
}: {
  href: string;
  label: string;
  description: string;
  color: string;
  external?: boolean;
}) {
  const className =
    "group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md active:scale-[0.99]";

  const content = (
    <>
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
        style={{ backgroundColor: color }}
      >
        <Calendar className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">{label}</p>
        <p className="mt-0.5 text-sm text-slate-600">{description}</p>
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

export default function ClubPublicPage({ slug, initialData }: ClubPublicPageProps) {
  const color = initialData.primaryColor || "#1A23FF";
  const buvetteHref = initialData.buvetteSlug
    ? `/club/${initialData.buvetteSlug}/buvette`
    : null;

  const actions: { href: string; label: string; description: string; external?: boolean }[] = [];

  if (initialData.showBuvette && buvetteHref) {
    actions.push({
      href: buvetteHref,
      label: "Réserver la buvette",
      description: "Choisissez une date et envoyez votre demande en ligne.",
    });
  }

  if (initialData.showMatches) {
    actions.push({
      href: `/p/${slug}/evenements`,
      label: "Planning des matchs",
      description: "Consultez les prochains événements du club.",
    });
  }

  if (initialData.showContact && initialData.contactUrl) {
    const isExternal =
      initialData.contactUrl.startsWith("http") ||
      initialData.contactUrl.startsWith("mailto:");
    actions.push({
      href: initialData.contactUrl,
      label: "Contacter le club",
      description: "Écrivez-nous pour toute question.",
      external: isExternal,
    });
  }

  const socials = [
    { url: initialData.instagramUrl, label: "Instagram", Icon: Instagram },
    { url: initialData.facebookUrl, label: "Facebook", Icon: Facebook },
    { url: initialData.websiteUrl, label: "Site internet", Icon: Globe },
  ].filter((s) => s.url);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header
        className="px-4 pb-16 pt-10 sm:px-6"
        style={{
          background: `linear-gradient(160deg, ${color} 0%, ${color}dd 55%, #0f172a 100%)`,
        }}
      >
        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
          <ClubLogo logoUrl={initialData.logoUrl} title={initialData.title} color={color} />
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {initialData.title}
          </h1>
          {initialData.description ? (
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/90 sm:text-base">
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
                key={action.href}
                href={action.href}
                label={action.label}
                description={action.description}
                color={color}
                external={action.external}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-600">
            Aucun lien actif pour le moment. Revenez bientôt.
          </div>
        )}

        {socials.length > 0 ? (
          <div className="mt-10 flex items-center justify-center gap-4">
            {socials.map(({ url, label, Icon }) => (
              <a
                key={label}
                href={url!}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 hover:shadow"
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
