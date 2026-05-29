import type { ReactNode } from "react";
import Link from "next/link";

type LegalDocumentProps = {
  title: string;
  updatedAt?: string;
  children: ReactNode;
};

export function LegalDocument({ title, updatedAt, children }: LegalDocumentProps) {
  return (
    <article className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-8 shadow-[0_0_80px_rgba(26,35,255,0.12),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md md:rounded-[2rem] md:p-12">
      <div
        className="pointer-events-none absolute inset-x-[15%] top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
        aria-hidden
      />

      <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">{title}</h1>
      {updatedAt ? (
        <p className="mt-3 text-sm text-blue-100/45">Dernière mise à jour : {updatedAt}.</p>
      ) : null}

      <div className="mt-10 space-y-10">{children}</div>
    </article>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-3 text-sm leading-relaxed text-blue-100/65">{children}</div>
    </section>
  );
}

export function LegalEmailLink({ email = "contact@obillz.com" }: { email?: string }) {
  return (
    <a
      href={`mailto:${email}`}
      className="font-medium text-blue-300 transition hover:text-white hover:underline"
    >
      {email}
    </a>
  );
}

export function LegalInlineLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="font-medium text-blue-300 transition hover:text-white hover:underline"
    >
      {children}
    </Link>
  );
}
