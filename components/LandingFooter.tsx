"use client";

import Image from "next/image";
import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
          <Link
            href="/"
            className="rounded-lg bg-[linear-gradient(145deg,#1D4ED8_0%,#2563EB_55%,#1E40AF_100%)] px-3 py-2 shadow-sm transition hover:opacity-90"
          >
            <Image src="/logo-obillz.png" alt="Obillz" width={130} height={34} />
          </Link>

          <a
            href="#"
            aria-label="Instagram"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-700 transition hover:bg-slate-100"
          >
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor">
              <rect x="3.5" y="3.5" width="17" height="17" rx="5" strokeWidth="1.8" />
              <circle cx="12" cy="12" r="3.8" strokeWidth="1.8" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>
        </div>

        <div className="mt-5 flex items-center gap-6 text-sm text-slate-500">
          <Link href="/privacy" className="transition hover:text-slate-900">
            Privacy Policy
          </Link>
          <Link href="/cookies" className="transition hover:text-slate-900">
            Cookies Settings
          </Link>
        </div>
      </div>
    </footer>
  );
}
