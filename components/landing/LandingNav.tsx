"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { easePremium } from "@/components/landing/landing-motion";

const links = [
  { href: "#probleme", label: "Problème" },
  { href: "#modules", label: "Modules" },
  { href: "#comment-ca-marche", label: "Comment ça marche" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#faq", label: "FAQ" },
];

export default function LandingNav() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-4 sm:pt-4 md:pt-5">
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: easePremium }}
        className="flex w-full max-w-[920px] items-center justify-between gap-2 rounded-full border border-white/25 bg-white/[0.12] px-3 py-2 shadow-[0_8px_40px_rgba(26,35,255,0.18),inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-2xl sm:gap-3 sm:px-4 sm:py-2.5 md:px-5 md:py-3"
      >
        <Link href="/" className="shrink-0 transition hover:opacity-90">
          <Image
            src="/logo-obillz.png"
            alt="Obillz"
            width={100}
            height={24}
            priority
            className="h-6 w-auto sm:h-7"
          />
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Navigation">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/connexion"
            className="rounded-full px-2.5 py-1.5 text-xs font-semibold text-white/85 transition hover:bg-white/10 hover:text-white sm:px-3.5 sm:py-2 sm:text-sm"
          >
            Connexion
          </Link>
          <Link
            href="/inscription"
            className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#1A23FF] shadow-[0_0_24px_rgba(26,35,255,0.45),inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(26,35,255,0.6)] sm:px-4 sm:py-2 sm:text-sm"
          >
            <span className="hidden sm:inline">Tester gratuitement</span>
            <span className="sm:hidden">Tester</span>
          </Link>
        </div>
      </motion.header>
    </div>
  );
}
