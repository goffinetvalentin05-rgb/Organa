import type { ReactNode } from "react";
import Link from "next/link";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function LegalSection({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: ReactNode;
}) {
  const sectionId = id ?? slugify(title);

  return (
    <section id={sectionId}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function LegalEmailLink({ email = "contact@obillz.com" }: { email?: string }) {
  return <a href={`mailto:${email}`}>{email}</a>;
}

export function LegalInlineLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href}>{children}</Link>;
}
