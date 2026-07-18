import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingNav from "@/components/landing/LandingNav";
import { LegalSection } from "@/components/landing/LegalDocument";
import LegalTocNav, { type LegalTocItem } from "@/components/landing/LegalTocNav";

type LegalPageLayoutProps = {
  title: string;
  lastUpdated: string;
  children: ReactNode;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function extractToc(children: ReactNode): LegalTocItem[] {
  const items: LegalTocItem[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type !== LegalSection) return;

    const section = child as ReactElement<{ title: string; id?: string }>;
    const sectionTitle = section.props.title;
    if (!sectionTitle) return;

    items.push({
      id: section.props.id ?? slugify(sectionTitle),
      title: sectionTitle,
    });
  });

  return items;
}

export default function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: LegalPageLayoutProps) {
  const toc = extractToc(children);

  return (
    <div className="legal-page">
      <LandingNav />

      <main className="legal-main">
        <header className="legal-hero">
          <span className="legal-eyebrow">INFORMATIONS LÉGALES</span>
          <h1>{title}</h1>
          <p>Dernière mise à jour : {lastUpdated}</p>
        </header>

        <div className="legal-layout">
          <LegalTocNav items={toc} />
          <article className="legal-content">{children}</article>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
