"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/cn";
import { useI18n } from "@/components/I18nProvider";

export const FINANCE_DEFAULT_HREF = "/tableau-de-bord/devis";

export const FINANCE_NAV_ITEMS = [
  { href: "/tableau-de-bord/devis", labelKey: "dashboard.nav.quotes" },
  { href: "/tableau-de-bord/factures", labelKey: "dashboard.nav.invoices" },
  { href: "/tableau-de-bord/paiements", labelKey: "dashboard.nav.payments" },
  { href: "/tableau-de-bord/produits", labelKey: "dashboard.nav.productRevenues" },
  { href: "/tableau-de-bord/depenses", labelKey: "dashboard.nav.expenses" },
] as const;

export function isFinancePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return FINANCE_NAV_ITEMS.some((item) => pathname.startsWith(item.href));
}

function isFinanceItemActive(pathname: string | null | undefined, href: string): boolean {
  if (!pathname) return false;
  const match = FINANCE_NAV_ITEMS.filter((item) => pathname.startsWith(item.href)).sort(
    (a, b) => b.href.length - a.href.length
  )[0];
  return match?.href === href;
}

export default function FinanceSectionNav() {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <nav aria-label={t("dashboard.nav.finances")} className="w-full min-w-0">
      <div className="-mx-1 max-w-full overflow-x-auto overscroll-x-contain px-1 scrollbar-none">
        <div className="inline-flex min-w-min items-center rounded-full bg-[#F1F5F9] p-1 ring-1 ring-inset ring-[rgba(15,23,42,0.04)]">
          {FINANCE_NAV_ITEMS.map((item) => {
            const active = isFinanceItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm tracking-[-0.01em] transition-all duration-200",
                  active
                    ? "bg-[#1A23FF] font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_rgba(26,35,255,0.28)]"
                    : "font-medium text-[#475569] hover:bg-white/80 hover:text-[#0F172A]"
                )}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
