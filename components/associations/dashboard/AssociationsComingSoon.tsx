import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import styles from "./associations-dashboard.module.css";

type AssociationsComingSoonProps = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref?: string;
  icon?: ReactNode;
};

export default function AssociationsComingSoon({
  title,
  description,
  ctaLabel,
  ctaHref = "/associations/espace",
  icon,
}: AssociationsComingSoonProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#b84e3a]">
          Module Associations
        </p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.04em] text-[#17211d] sm:text-4xl">
          {title}
        </h2>
        <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-[#66736d] sm:text-base">
          {description}
        </p>
      </div>

      <section className={`${styles.card} p-6 sm:p-8`}>
        <div className={styles.emptyState}>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ed7059]/12 text-[#ed7059]">
            {icon}
          </div>
          <p className="text-lg font-extrabold tracking-[-0.03em] text-[#17211d]">
            Bientôt disponible
          </p>
          <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-[#66736d]">
            Ce module arrive prochainement. L’interface est prête ; les fonctionnalités
            métier seront branchées dans les prochaines étapes.
          </p>
          <Link href={ctaHref} className={`${styles.primaryButton} mt-6`}>
            {ctaLabel}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
