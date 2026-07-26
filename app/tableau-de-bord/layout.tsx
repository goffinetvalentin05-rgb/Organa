"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { cn } from "@/components/ui/cn";
import { createClient } from "@/lib/supabase/client";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { dashboardShellRootClass } from "@/components/ui";
import { useI18n } from "@/components/I18nProvider";
import ClubPublicPageAnnouncementModal from "@/components/public-page/ClubPublicPageAnnouncementModal";
import { NewFeaturesAnnouncementProvider } from "@/components/announcements/NewFeaturesAnnouncementProvider";
import DashboardNotificationBellConnected from "@/components/announcements/DashboardNotificationBellConnected";
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  Settings,
  Home,
  Menu,
  X,
  ChevronDown,
  CreditCard,
  Wallet,
  Building2,
  QrCode,
  Calendar,
  ClipboardList,
  Mail,
  ShoppingBag,
  Handshake,
  Globe,
  FilePlus,
} from "@/lib/icons";

const PUBLIC_PAGE_HREF = "/tableau-de-bord/parametres/page-publique";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [clubName, setClubName] = useState<string>("");
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) {
          console.warn("[AUTH][DashboardLayout] Impossible de récupérer /api/me", {
            status: res.status,
          });
          return;
        }

        const data = await res.json();
        const rawClubName = typeof data.user?.clubName === "string" ? data.user.clubName.trim() : "";
        setClubName(rawClubName);
      } catch (error) {
        console.error("[AUTH][DashboardLayout] Erreur lors de l'appel à /api/me", error);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchMe();
  }, [pathname, router]);

  const supabase = createClient();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("[AUTH][Logout] Erreur lors de la déconnexion", error);
        return;
      }
      router.push("/connexion");
      router.refresh();
    } catch (error) {
      console.error("[AUTH][Logout] Erreur inattendue lors de la déconnexion", error);
    }
  };

  const FINANCE_ROUTES = [
    "/tableau-de-bord/devis",
    "/tableau-de-bord/factures",
    "/tableau-de-bord/paiements",
    "/tableau-de-bord/produits",
    "/tableau-de-bord/depenses",
  ] as const;

  const isFinanceRoute =
    pathname != null && FINANCE_ROUTES.some((href) => pathname.startsWith(href));

  const financesSubmenuId = useId();

  const [financesOpen, setFinancesOpen] = useState(isFinanceRoute);

  useEffect(() => {
    if (isFinanceRoute) {
      setFinancesOpen(true);
    }
  }, [isFinanceRoute]);

  const navigationPrimary = [
    { name: t("dashboard.nav.dashboard"), href: "/tableau-de-bord", icon: LayoutDashboard },
    { name: t("dashboard.nav.clients"), href: "/tableau-de-bord/clients", icon: Users },
  ];

  const navigationFinances = [
    { name: t("dashboard.nav.quotes"), href: "/tableau-de-bord/devis", icon: FileText },
    { name: t("dashboard.nav.invoices"), href: "/tableau-de-bord/factures", icon: Receipt },
    { name: t("dashboard.nav.payments"), href: "/tableau-de-bord/paiements", icon: CreditCard },
    { name: t("dashboard.nav.productRevenues"), href: "/tableau-de-bord/produits", icon: ShoppingBag },
    { name: t("dashboard.nav.expenses"), href: "/tableau-de-bord/depenses", icon: Building2 },
  ];

  const navigationSecondary = [
    { name: t("dashboard.nav.sponsoring"), href: "/tableau-de-bord/sponsoring", icon: Handshake },
    { name: t("dashboard.nav.events"), href: "/tableau-de-bord/evenements", icon: Calendar },
    { name: t("dashboard.nav.buvette"), href: "/tableau-de-bord/buvette", icon: Calendar },
    { name: t("dashboard.nav.plannings"), href: "/tableau-de-bord/plannings", icon: ClipboardList },
    { name: t("dashboard.nav.meetingMinutes"), href: "/tableau-de-bord/pv-seances", icon: FilePlus },
    { name: t("dashboard.nav.qrcodes"), href: "/tableau-de-bord/qrcodes", icon: QrCode },
    { name: t("dashboard.nav.marketing"), href: "/tableau-de-bord/campagnes-marketing", icon: Mail },
    { name: t("dashboard.nav.publicPage"), href: PUBLIC_PAGE_HREF, icon: Globe },
    { name: t("dashboard.nav.settings"), href: "/tableau-de-bord/parametres", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/tableau-de-bord") {
      return pathname === href;
    }
    if (href === "/tableau-de-bord/parametres") {
      return (
        pathname.startsWith("/tableau-de-bord/parametres") &&
        !pathname.startsWith(PUBLIC_PAGE_HREF)
      );
    }
    return pathname.startsWith(href);
  };

  return (
    <NewFeaturesAnnouncementProvider>
    <div className={dashboardShellRootClass}>
      <ClubPublicPageAnnouncementModal />

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — blanche, navigation SaaS claire */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-72 border-r border-[#E7EBF3] bg-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0 shadow-[8px_0_40px_rgba(16,24,40,0.08)]" : "-translate-x-full"
        }`}
      >
        <div className="relative z-10 flex h-full flex-col">
          {/* Logo & close button */}
          <div className="flex items-center justify-between gap-3 border-b border-[#EEF2F7] px-5 py-4">
            <Link href="/tableau-de-bord" className="group flex min-w-0 flex-1 items-center">
              <Image
                src="/logo-obillz.png"
                alt="Obillz"
                width={180}
                height={47}
                className="h-11 w-auto max-w-[160px] object-contain opacity-90 transition-opacity [filter:brightness(0)_saturate(100%)] group-hover:opacity-75"
                priority
              />
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-2 text-[#98A2B3] transition-colors hover:bg-[#F6F8FC] hover:text-[#344054] lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-5">
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#98A2B3]">
              {t("dashboard.navigation.primary")}
            </p>
            <div className="space-y-0.5">
              {navigationPrimary.map((item) => {
                const IconComponent = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                      active
                        ? "bg-blue-50 font-semibold text-[#1D4ED8]"
                        : "text-[#667085] hover:bg-[#F6F8FC] hover:text-[#10172A]"
                    )}
                  >
                    <IconComponent className={cn("h-[17px] w-[17px] shrink-0", active ? "text-[#1D4ED8]" : "text-[#98A2B3]")} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setFinancesOpen((open) => !open)}
                  aria-expanded={financesOpen}
                  aria-controls={financesSubmenuId}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                    isFinanceRoute
                      ? "bg-[#F6F8FC] font-medium text-[#10172A]"
                      : "text-[#667085] hover:bg-[#F6F8FC] hover:text-[#10172A]"
                  )}
                >
                  <Wallet className={cn("h-[17px] w-[17px] shrink-0", isFinanceRoute ? "text-[#1D4ED8]" : "text-[#98A2B3]")} />
                  <span className="flex-1 text-left font-medium">{t("dashboard.nav.finances")}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-[#98A2B3] transition-transform duration-200",
                      financesOpen && "rotate-180"
                    )}
                    aria-hidden
                  />
                </button>

                <div
                  id={financesSubmenuId}
                  role="region"
                  aria-label={t("dashboard.nav.finances")}
                  className={cn(
                    "grid transition-[grid-template-rows] duration-200 ease-out",
                    financesOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="ml-3 mt-1 space-y-0.5 border-l border-[#EEF2F7] py-1 pl-3">
                      {navigationFinances.map((item) => {
                        const active = isActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                              "block rounded-lg px-3 py-2 text-sm transition-all duration-200",
                              active
                                ? "bg-blue-50 font-semibold text-[#1D4ED8]"
                                : "text-[#667085] hover:bg-[#F6F8FC] hover:text-[#10172A]"
                            )}
                          >
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mx-3 my-3 border-t border-[#EEF2F7]" />

              {navigationSecondary.map((item) => {
                const IconComponent = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                      active
                        ? "bg-blue-50 font-semibold text-[#1D4ED8]"
                        : "text-[#667085] hover:bg-[#F6F8FC] hover:text-[#10172A]"
                    )}
                  >
                    <IconComponent className={cn("h-[17px] w-[17px] shrink-0", active ? "text-[#1D4ED8]" : "text-[#98A2B3]")} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer sidebar */}
          <div className="border-t border-[#EEF2F7] p-3">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#98A2B3] transition-all duration-200 hover:bg-[#F6F8FC] hover:text-[#344054]"
            >
              <Home className="h-[17px] w-[17px]" />
              <span className="font-medium">{t("dashboard.navigation.backHome")}</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="relative z-10 lg:ml-72 flex min-h-[100dvh] flex-col">
        {/* Topbar — blanche, discrète */}
        <header className="sticky top-0 z-30 border-b border-[#E7EBF3] bg-white/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-2 text-[#667085] transition hover:bg-[#F6F8FC] hover:text-[#10172A] lg:hidden"
                aria-label={t("dashboard.navigation.primary")}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {!loadingUser &&
                (() => {
                  const displayName = clubName || t("dashboard.topbar.clubFallback");
                  const initial = (clubName || t("dashboard.topbar.clubFallback") || "C")
                    .charAt(0)
                    .toUpperCase();
                  return (
                    <div
                      className="flex max-w-[140px] items-center gap-2 rounded-full border border-[#E7EBF3] bg-white px-2 py-1 sm:max-w-[200px] sm:px-2.5 sm:py-1.5 md:max-w-none"
                      aria-label={displayName}
                      title={displayName}
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#1A23FF] text-xs font-bold text-white">
                        {initial}
                      </div>
                      <span className="hidden truncate text-sm font-medium text-[#344054] md:inline">
                        {displayName}
                      </span>
                    </div>
                  );
                })()}

              <LanguageSwitcher compact theme="light" />

              <DashboardNotificationBellConnected />

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#667085] transition hover:bg-[#F6F8FC] hover:text-[#10172A] sm:px-3.5 sm:py-2 sm:text-sm"
              >
                {t("dashboard.topbar.logout")}
              </button>
            </div>
          </div>
        </header>

        <main className="relative min-w-0 flex-1 overflow-x-hidden px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <div className="relative w-full min-w-0">{children}</div>
        </main>

        <footer className="border-t border-[#E7EBF3] bg-transparent">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-[#98A2B3] sm:flex-row sm:px-6 lg:px-8">
            <p>{t("dashboard.footer.copyright")}</p>
            <div className="flex items-center gap-4">
              <Link href="/mentions-legales" className="transition-colors hover:text-[#344054]">
                {t("dashboard.footer.legal")}
              </Link>
              <Link href="/politique-confidentialite" className="transition-colors hover:text-[#344054]">
                {t("dashboard.footer.privacy")}
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
    </NewFeaturesAnnouncementProvider>
  );
}
