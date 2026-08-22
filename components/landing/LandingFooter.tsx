"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/components/I18nProvider";
import { TRIAL_DURATION_DAYS } from "@/lib/billing/pricing";
import { easePremium, viewportOnce } from "@/components/landing/landing-motion";

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

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.2" cy="6.8" r="1.05" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M14.5 8.5V6.8c0-.7.5-1.3 1.2-1.3H17V3h-2.1C12.5 3 11 4.5 11 6.4v2.1H9v2.7h2V21h3.5v-9.8h2.2l.3-2.7h-2.5z" />
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

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="footer-social-link"
      whileHover={reduceMotion ? undefined : { y: -2, scale: 1.06 }}
      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
      transition={{ duration: 0.2, ease: easePremium }}
    >
      {children}
    </motion.a>
  );
}

export default function LandingFooter() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  const productLinks = [
    { href: "/#modules", label: t("marketing.nav.modules") },
    { href: "/#en-pratique", label: t("marketing.nav.inPractice") },
    { href: "/tarifs", label: t("marketing.nav.pricing") },
    { href: "/#faq", label: t("marketing.nav.faq") },
  ];

  const legalLinks = [
    { href: "/mentions-legales", label: t("marketing.footer.legalMentions") },
    { href: "/conditions-utilisation", label: t("marketing.footer.legalTerms") },
    { href: "/politique-confidentialite", label: t("marketing.footer.legalPrivacy") },
    { href: "/politique-cookies", label: t("marketing.footer.legalCookies") },
  ];

  return (
    <footer className="site-footer">
      <div className="footer-body">
        <motion.div
          className="footer-content"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6, ease: easePremium }}
        >
          <div className="footer-brand">
            <Link href="/" className="footer-brand__logo inline-block transition hover:opacity-90">
              <Image
                src="/logo-symbole.png"
                alt="Obillz"
                width={120}
                height={120}
                className="h-14 w-auto sm:h-16 md:h-[4.5rem]"
                priority={false}
              />
            </Link>

            <div className="mt-5 flex items-center gap-2.5">
              <SwissFlag className="h-5 w-5 shrink-0 rounded-[3px]" />
              <span className="footer-meta text-xs">{t("marketing.footer.swissMade")}</span>
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
            <FooterLink href="/inscription">{t("marketing.footer.cta")}</FooterLink>
          </FooterLinkColumn>
        </motion.div>

        <div className="footer-closing">
          <div className="footer-watermark" aria-hidden="true">
            {t("marketing.footer.watermark")}
          </div>

          <div className="footer-bottom">
            <div className="footer-bottom__social">
              <SocialLink href={t("marketing.footer.instagramUrl")} label="Instagram Obillz">
                <InstagramIcon className="h-[18px] w-[18px]" />
              </SocialLink>
              <SocialLink href={t("marketing.footer.facebookUrl")} label="Facebook Obillz">
                <FacebookIcon className="h-[18px] w-[18px]" />
              </SocialLink>
            </div>

            <nav className="footer-bottom__legal" aria-label="Liens légaux">
              {legalLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="footer-copyright">
            <p>{t("marketing.footer.copyright", { year })}</p>
            <p>{t("marketing.footer.trialNote", { days: TRIAL_DURATION_DAYS })}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
