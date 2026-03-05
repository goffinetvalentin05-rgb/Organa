"use client";

import Image from "next/image";
import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="mt-10 bg-[linear-gradient(180deg,#0B1732_0%,#081126_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <Link href="/" className="transition hover:opacity-90">
            <Image src="/logo-obillz.png" alt="Obillz" width={130} height={34} />
          </Link>

          <a
            href="#"
            aria-label="Instagram"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10"
          >
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor">
              <rect x="3.5" y="3.5" width="17" height="17" rx="5" strokeWidth="1.8" />
              <circle cx="12" cy="12" r="3.8" strokeWidth="1.8" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>
        </div>

        <div className="mt-5 flex items-center gap-6 text-sm text-slate-300">
          <Link href="/privacy" className="transition hover:text-white">
            Privacy Policy
          </Link>
          <Link href="/cookies" className="transition hover:text-white">
            Cookies Settings
          </Link>
        </div>
      </div>
    </footer>
  );
}
