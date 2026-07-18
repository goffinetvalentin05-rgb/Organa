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
      <h3>{title}</h3>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  const isAnchor = href.startsWith("#");

  if (isAnchor) {
    return (
      <li>
        <a href={href}>{children}</a>
      </li>
    );
  }

  return (
    <li>
      <Link href={href}>{children}</Link>
    </li>
  );
}

export default function LandingFooter() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  const productLinks = [
    { href: "#comment-ca-marche", label: t("marketing.nav.howItWorks") },
    { href: "#modules", label: t("marketing.nav.modules") },
    { href: "#tarifs", label: t("marketing.nav.pricing") },
    { href: "#faq", label: t("marketing.nav.faq") },
  ];

  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <Link href="/" className="inline-block opacity-95 transition hover:opacity-100">
            <Image src="/logo-obillz.png" alt="Obillz" width={130} height={34} className="h-8 w-auto" />
          </Link>

          <p className="mt-5 text-sm leading-relaxed">{t("marketing.footer.description")}</p>

          <div className="mt-4 flex items-center gap-2.5">
            <SwissFlag className="h-5 w-5 shrink-0 rounded-[3px]" />
            <span className="footer-meta text-xs">{t("marketing.footer.swissMade")}</span>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/inscription"
              className="landing-hero-cta group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-3 text-sm font-bold text-white shadow-[0_0_32px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.18)] transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_48px_rgba(37,99,235,0.55),inset_0_1px_0_rgba(255,255,255,0.22)] sm:w-auto"
            >
              <span
                className="pointer-events-none absolute -inset-1.5 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.35),transparent_70%)] opacity-60 blur-xl transition duration-300 group-hover:opacity-90"
                aria-hidden
              />
              <span className="relative">{t("marketing.footer.cta")}</span>
              <ArrowRight
                className="relative h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                strokeWidth={2.5}
                aria-hidden
              />
            </Link>
            <Link href="/connexion" className="footer-secondary-cta">
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
            <a href="mailto:contact@obillz.com">contact@obillz.com</a>
          </li>
          <FooterLink href="/mentions-legales">{t("marketing.footer.legalMentions")}</FooterLink>
          <FooterLink href="/conditions-utilisation">{t("marketing.footer.legalTerms")}</FooterLink>
          <FooterLink href="/politique-confidentialite">{t("marketing.footer.legalPrivacy")}</FooterLink>
          <FooterLink href="/politique-cookies">{t("marketing.footer.legalCookies")}</FooterLink>
        </FooterLinkColumn>
      </div>

      <div className="footer-bottom">
        <p>{t("marketing.footer.copyright", { year })}</p>
        <p>{t("marketing.footer.trialNote", { days: TRIAL_DURATION_DAYS })}</p>
      </div>

      <div className="footer-watermark" aria-hidden="true">
        OBILLZ
      </div>
    </footer>
  );
}
