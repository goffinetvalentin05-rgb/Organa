"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import ProductSwitcher from "@/components/ProductSwitcher";

export type ObillzFloatingNavLink = {
  href: string;
  label: string;
};

export type ObillzFloatingNavCta = {
  href: string;
  label: string;
  external?: boolean;
};

type ObillzFloatingNavProps = {
  product: "sport" | "associations";
  homeHref: string;
  links: ObillzFloatingNavLink[];
  cta: ObillzFloatingNavCta;
};

function isAnchor(href: string) {
  return href.startsWith("#");
}

function NavCta({
  cta,
  className,
  onClick,
}: {
  cta: ObillzFloatingNavCta;
  className: string;
  onClick?: () => void;
}) {
  if (cta.external || cta.href.startsWith("mailto:") || cta.href.startsWith("http")) {
    return (
      <a href={cta.href} className={className} onClick={onClick}>
        {cta.label}
      </a>
    );
  }

  return (
    <Link href={cta.href} className={className} onClick={onClick}>
      {cta.label}
    </Link>
  );
}

function NavTextLink({
  href,
  label,
  className,
  onClick,
}: {
  href: string;
  label: string;
  className: string;
  onClick?: () => void;
}) {
  if (isAnchor(href)) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className} onClick={onClick}>
      {label}
    </Link>
  );
}

export default function ObillzFloatingNav({
  product,
  homeHref,
  links,
  cta,
}: ObillzFloatingNavProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, [open]);

  const isSport = product === "sport";
  const linkClass = isSport
    ? "text-sm font-semibold text-slate-500 transition hover:text-slate-900"
    : "text-sm font-semibold text-[#65716b] transition hover:text-[#17211d]";
  const ctaClass = isSport
    ? "lp-nav--sport-cta rounded-full bg-[#0f172a] px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
    : "rounded-full bg-[#17211d] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(23,33,29,.18)] transition hover:-translate-y-0.5 hover:bg-[#293b33]";
  const mobileLinkClass = isSport
    ? "block rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
    : "block rounded-xl px-4 py-3 text-sm font-bold text-[#3d4943] hover:bg-[#f0ede5]";
  const barClass = isSport
    ? "lp-nav--sport mx-auto flex h-16 max-w-[1180px] items-center justify-between rounded-[1.35rem] border border-white/80 bg-white/86 px-4 shadow-[0_12px_40px_rgba(15,23,42,.08)] backdrop-blur-2xl sm:px-5"
    : "mx-auto flex h-16 max-w-[1180px] items-center justify-between rounded-[1.35rem] border border-white/70 bg-[#fbfaf6]/85 px-4 shadow-[0_12px_45px_rgba(35,48,41,.09)] backdrop-blur-2xl sm:px-5";

  return (
    <nav className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-5">
      <div className={barClass}>
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={homeHref}
            className="flex items-center transition hover:opacity-90"
            aria-label="Obillz"
            onClick={() => setOpen(false)}
          >
            <Image
              src="/obillz-logo.png"
              alt="Obillz"
              width={200}
              height={48}
              priority
              className="landing-nav-logo--on-light h-8 w-auto max-w-[140px] object-contain object-left sm:h-9 sm:max-w-none"
            />
          </Link>
          <div className="hidden h-6 w-px bg-[#17211d]/10 md:block" />
          <div className="hidden md:block">
            <ProductSwitcher current={product} theme="light" />
          </div>
        </div>

        <div className="hidden items-center gap-7 lg:flex">
          {links.map((link) => (
            <NavTextLink
              key={link.href}
              href={link.href}
              label={link.label}
              className={linkClass}
            />
          ))}
          <NavCta cta={cta} className={ctaClass} />
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#17211d]/10 bg-white text-[#17211d] lg:hidden"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={`mx-auto mt-2 max-w-[1180px] rounded-[1.35rem] border border-white/80 p-3 shadow-2xl backdrop-blur-2xl lg:hidden ${
              isSport ? "bg-white/95" : "bg-[#fbfaf6]/95"
            }`}
          >
            <div className="mb-2 md:hidden">
              <ProductSwitcher current={product} theme="light" />
            </div>
            {links.map((link) => (
              <NavTextLink
                key={link.href}
                href={link.href}
                label={link.label}
                className={mobileLinkClass}
                onClick={() => setOpen(false)}
              />
            ))}
            <div className="mt-2 px-1 pb-1">
              <NavCta
                cta={cta}
                className={`${ctaClass} flex w-full items-center justify-center`}
                onClick={() => setOpen(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
