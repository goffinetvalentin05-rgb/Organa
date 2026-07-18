"use client";

import { useEffect, useState } from "react";

export type LegalTocItem = {
  id: string;
  title: string;
};

type LegalTocNavProps = {
  items: LegalTocItem[];
};

export default function LegalTocNav({ items }: LegalTocNavProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    if (items.length === 0) return;

    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-140px 0px -55% 0px",
        threshold: [0.15, 0.35, 0.55],
      }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <aside className="legal-navigation" aria-label="Sommaire">
      <p className="legal-navigation-title">Sommaire</p>
      <nav>
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={activeId === item.id ? "active" : undefined}
          >
            {item.title}
          </a>
        ))}
      </nav>
    </aside>
  );
}
