"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { TRIAL_DURATION_DAYS } from "@/lib/billing/pricing";

function SwissFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Drapeau suisse"
      role="img"
    >
      <rect width="32" height="32" fill="#DA291C" />
      <path d="M13.5 7h5v5.5H24v5h-5.5V23h-5v-5.5H8v-5h5.5z" fill="#FFFFFF" />
    </svg>
  );
}

function FooterLinkColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/90">{title}</p>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  const isAnchor = href.startsWith("#");
  const className =
    "text-sm text-blue-100/60 transition-colors duration-200 hover:text-white";

  if (isAnchor) {
    return (
      <li>
        <a href={href} className={className}>
          {children}
        </a>
      </li>
    );
  }

  return (
    <li>
      <Link href={href} className={className}>
        {children}
      </Link>
    </li>
  );
}

export default function LandingFooter() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  const productLinks = [
    { href: "#comment-ca-marche", label: t("marketing.nav.howItWorks") },
    { href: "#modules", label: t("marketing.nav.modules") },
    { href: "/tarifs", label: t("marketing.nav.pricing") },
    { href: "#faq", label: t("marketing.nav.faq") },
  ];

  return (
    <footer className="relative z-10 mt-4 overflow-hidden border-t border-white/[0.06] bg-[#020617]/95 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_100%,rgba(26,35,255,0.14),transparent_55%)]"
        aria-hidden
      />

      <div className="relative mx-auto w-[94%] max-w-[1160px] py-14 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.35fr)_repeat(3,minmax(0,1fr))] lg:gap-10 xl:gap-14">
          <div className="max-w-md">
            <Link href="/" className="inline-block opacity-95 transition hover:opacity-100">
              <Image src="/logo-obillz.png" alt="Obillz" width={130} height={34} className="h-8 w-auto" />
            </Link>

            <p className="mt-5 text-sm leading-relaxed text-blue-100/55">
              {t("marketing.footer.description")}
            </p>

            <div className="mt-4 flex items-center gap-2.5">
              <SwissFlag className="h-5 w-5 shrink-0 rounded-[3px]" />
              <span className="text-xs text-blue-100/45">{t("marketing.footer.swissMade")}</span>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/inscription"
                className="landing-hero-cta group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-3 text-sm font-bold text-white shadow-[0_0_40px_rgba(26,35,255,0.5),inset_0_1px_0_rgba(255,255,255,0.18)] transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_56px_rgba(26,35,255,0.65),inset_0_1px_0_rgba(255,255,255,0.22)] sm:w-auto"
              >
                <span
                  className="pointer-events-none absolute -inset-1.5 rounded-full bg-[radial-gradient(circle,rgba(26,35,255,0.45),transparent_70%)] opacity-60 blur-xl transition duration-300 group-hover:opacity-90"
                  aria-hidden
                />
                <span className="relative">{t("marketing.footer.cta")}</span>
                <ArrowRight
                  className="relative h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  strokeWidth={2.5}
                  aria-hidden
                />
              </Link>
              <Link
                href="/connexion"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/25 bg-white/[0.06] px-6 py-3 text-sm font-semibold text-white/90 shadow-[0_0_20px_rgba(26,35,255,0.1),inset_0_1px_0_rgba(255,255,255,0.08)] transition duration-200 hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/[0.1] hover:text-white hover:shadow-[0_0_28px_rgba(26,35,255,0.18)] sm:w-auto"
              >
                {t("marketing.footer.login")}
              </Link>
            </div>
          </div>

          <FooterLinkColumn title={t("marketing.footer.product")}>
            {productLinks.map((link) => (
              <FooterLink key={link.href} href={link.href}>
                {link.label}
              </FooterLink>
            ))}
          </FooterLinkColumn>

          <FooterLinkColumn title={t("marketing.footer.account")}>
            <FooterLink href="/inscription">{t("marketing.footer.createAccount")}</FooterLink>
            <FooterLink href="/connexion">{t("marketing.footer.login")}</FooterLink>
          </FooterLinkColumn>

          <FooterLinkColumn title={t("marketing.footer.contact")}>
            <li>
              <a
                href="mailto:contact@obillz.com"
                className="text-sm text-blue-100/60 transition-colors hover:text-white"
              >
                contact@obillz.com
              </a>
            </li>
            <FooterLink href="/mentions-legales">{t("marketing.footer.legalMentions")}</FooterLink>
            <FooterLink href="/conditions-utilisation">{t("marketing.footer.legalTerms")}</FooterLink>
            <FooterLink href="/politique-confidentialite">{t("marketing.footer.legalPrivacy")}</FooterLink>
            <FooterLink href="/politique-cookies">{t("marketing.footer.legalCookies")}</FooterLink>
          </FooterLinkColumn>
        </div>
      </div>

      <div className="relative border-t border-white/[0.06]">
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center overflow-hidden"
          aria-hidden
        >
          <span className="translate-y-[28%] select-none whitespace-nowrap text-[clamp(5rem,22vw,13rem)] font-black uppercase leading-none tracking-[-0.04em] text-white/[0.035]">
            {t("marketing.footer.watermark")}
          </span>
        </div>

        <div className="relative mx-auto flex w-[94%] max-w-[1160px] flex-col gap-4 py-6 text-xs text-blue-100/40 sm:flex-row sm:items-center sm:justify-between md:py-7">
          <p>{t("marketing.footer.copyright", { year })}</p>
          <p className="text-blue-100/45">
            {t("marketing.footer.trialNote", { days: TRIAL_DURATION_DAYS })}
          </p>
        </div>
      </div>
    </footer>
  );
}
