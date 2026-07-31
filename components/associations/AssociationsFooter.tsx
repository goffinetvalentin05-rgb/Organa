"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import styles from "./associations.module.css";

const INSTAGRAM_URL =
  "https://www.instagram.com/obillz.ch?igsh=MW5rcmdsbmFkYmVlNA==";
const FACEBOOK_URL =
  "https://www.facebook.com/share/1EEPuBdBRS/?mibextid=wwXIfr";

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
  const isExternal = href.startsWith("mailto:") || href.startsWith("http");

  if (isAnchor || isExternal) {
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
      className={styles.assoFooterSocial}
      whileHover={reduceMotion ? undefined : { y: -2, scale: 1.06 }}
      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.a>
  );
}

export default function AssociationsFooter() {
  const year = new Date().getFullYear();
  const reduceMotion = useReducedMotion();

  const productLinks = [
    { href: "#histoire", label: "Notre histoire" },
    { href: "#fonctionnalites", label: "Fonctionnalités" },
    { href: "#fonctionnement", label: "Comment ça marche" },
    { href: "#pourquoi", label: "Notre vision" },
  ];

  const legalLinks = [
    { href: "/mentions-legales", label: "Mentions légales" },
    { href: "/conditions-utilisation", label: "Conditions d'utilisation" },
    { href: "/politique-confidentialite", label: "Confidentialité" },
    { href: "/politique-cookies", label: "Cookies" },
  ];

  return (
    <footer className={styles.assoFooter}>
      <div className={styles.assoFooterBody}>
        <motion.div
          className={styles.assoFooterContent}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.assoFooterBrand}>
            <Link
              href="/associations"
              className={styles.assoFooterBrandLogo}
              aria-label="Obillz Associations"
            >
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
              <span className={styles.assoFooterMeta}>
                Conçu pour les associations en Suisse
              </span>
            </div>
          </div>

          <FooterLinkColumn title="Produit">
            {productLinks.map((link) => (
              <FooterLink key={link.href} href={link.href}>
                {link.label}
              </FooterLink>
            ))}
          </FooterLinkColumn>

          <FooterLinkColumn title="Compte">
            <FooterLink href="/inscription">Créer un compte</FooterLink>
            <FooterLink href="/connexion">Connexion</FooterLink>
          </FooterLinkColumn>

          <FooterLinkColumn title="Contact">
            <li>
              <a href="mailto:contact@obillz.com">contact@obillz.com</a>
            </li>
            <FooterLink href="mailto:contact@obillz.com?subject=Démonstration Obillz Associations">
              Réserver une démonstration
            </FooterLink>
          </FooterLinkColumn>
        </motion.div>

        <div className={styles.assoFooterClosing}>
          <div className={styles.assoFooterWatermark} aria-hidden="true">
            OBILLZ
          </div>

          <div className={styles.assoFooterBottom}>
            <div className={styles.assoFooterSocialRow}>
              <SocialLink href={INSTAGRAM_URL} label="Instagram Obillz">
                <InstagramIcon className="h-[18px] w-[18px]" />
              </SocialLink>
              <SocialLink href={FACEBOOK_URL} label="Facebook Obillz">
                <FacebookIcon className="h-[18px] w-[18px]" />
              </SocialLink>
            </div>

            <nav className={styles.assoFooterLegal} aria-label="Liens légaux">
              {legalLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className={styles.assoFooterCopyright}>
            <p>© {year} Obillz. Tous droits réservés.</p>
            <p>Essai gratuit · Sans carte bancaire pour démarrer</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
