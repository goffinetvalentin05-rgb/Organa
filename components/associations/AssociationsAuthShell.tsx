"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./associations.module.css";

type AssociationsAuthShellProps = {
  children: ReactNode;
};

/**
 * Coquille visuelle Auth Associations — même univers que la landing /associations.
 */
export default function AssociationsAuthShell({
  children,
}: AssociationsAuthShellProps) {
  return (
    <main className={`${styles.page} relative`}>
      <div className={styles.noise} aria-hidden />
      <div
        className="pointer-events-none absolute left-[-8%] top-[-10%] h-[28rem] w-[28rem] rounded-full bg-[#ed7059]/15 blur-[90px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[-12%] right-[-6%] h-[32rem] w-[32rem] rounded-full bg-[#7f9c88]/20 blur-[100px]"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <header className="flex items-center justify-between px-4 py-5 sm:px-6 lg:px-10">
          <Link
            href="/associations"
            className="inline-flex items-center gap-2.5 transition hover:opacity-90"
          >
            <Image
              src="/obillz-logo.png"
              alt="Obillz"
              width={132}
              height={34}
              priority
              className="h-7 w-auto sm:h-8"
            />
            <span className="hidden text-sm font-semibold text-[#ed7059] sm:inline">
              associations
            </span>
          </Link>
          <Link
            href="/associations"
            className="text-xs font-bold text-[#65716b] transition hover:text-[#17211d] sm:text-sm"
          >
            Retour à l’accueil
          </Link>
        </header>

        <section className="flex flex-1 items-center justify-center px-4 pb-12 pt-2 sm:px-6">
          {children}
        </section>
      </div>
    </main>
  );
}
