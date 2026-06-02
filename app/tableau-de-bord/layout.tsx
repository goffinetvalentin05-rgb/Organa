"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { cn } from "@/components/ui/cn";
import { createClient } from "@/lib/supabase/client";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LandingBackground from "@/components/landing/LandingBackground";
import { dashboardShellRootClass, obillzLandingGridOverlayClass } from "@/components/ui";
import { useI18n } from "@/components/I18nProvider";
import ClubPublicPageAnnouncementModal from "@/components/public-page/ClubPublicPageAnnouncementModal";
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

  const getPageTitle = () => {
    if (!pathname) return t("dashboard.pageTitles.dashboard");
    if (pathname.startsWith("/tableau-de-bord/clients/nouveau")) return t("dashboard.pageTitles.newClient");
    if (pathname.startsWith("/tableau-de-bord/clients/") && pathname.includes("/edit")) {
      return t("dashboard.pageTitles.editClient");
    }
    const memberDetailMatch = pathname?.match(/^\/tableau-de-bord\/clients\/([^/]+)$/);
    if (memberDetailMatch && memberDetailMatch[1] !== "nouveau") {
      return t("dashboard.pageTitles.memberDetail");
    }
    if (pathname.startsWith("/tableau-de-bord/clients")) return t("dashboard.pageTitles.clients");
    if (pathname.startsWith("/tableau-de-bord/devis")) return t("dashboard.pageTitles.quotes");
    if (pathname.startsWith("/tableau-de-bord/factures")) return t("dashboard.pageTitles.invoices");
    if (pathname.startsWith("/tableau-de-bord/sponsoring/nouveau")) {
      return t("dashboard.pageTitles.sponsoringNew");
    }
    if (pathname.includes("/tableau-de-bord/sponsoring/") && pathname.includes("/modifier")) {
      return t("dashboard.pageTitles.sponsoringEdit");
    }
    const sponsorDetailMatch = pathname?.match(/^\/tableau-de-bord\/sponsoring\/([^/]+)$/);
    if (sponsorDetailMatch && sponsorDetailMatch[1] !== "nouveau") {
      return t("dashboard.pageTitles.sponsoringContract");
    }
    if (pathname.startsWith("/tableau-de-bord/sponsoring")) return t("dashboard.pageTitles.sponsoring");
    if (pathname.startsWith("/tableau-de-bord/paiements")) return t("dashboard.pageTitles.payments");
    if (pathname.startsWith("/tableau-de-bord/produits")) return t("dashboard.pageTitles.productRevenues");
    if (pathname.startsWith("/tableau-de-bord/evenements")) return t("dashboard.pageTitles.events");
    if (pathname.startsWith("/tableau-de-bord/buvette")) return t("dashboard.pageTitles.buvette");
    if (pathname.startsWith("/tableau-de-bord/plannings")) return t("dashboard.pageTitles.plannings");
    if (pathname.startsWith("/tableau-de-bord/qrcodes")) return t("dashboard.pageTitles.qrcodes");
    if (pathname.startsWith("/tableau-de-bord/campagnes-marketing")) return t("dashboard.pageTitles.marketing");
    if (pathname.startsWith("/tableau-de-bord/depenses")) return t("dashboard.pageTitles.expenses");
    if (pathname.startsWith("/tableau-de-bord/parametres/page-publique")) {
      return t("dashboard.pageTitles.publicPage");
    }
    if (pathname.startsWith("/tableau-de-bord/parametres")) return t("dashboard.pageTitles.settings");
    return t("dashboard.pageTitles.dashboard");
  };

  return (
    <div className={dashboardShellRootClass}>
      <LandingBackground />
      <ClubPublicPageAnnouncementModal />
      <div className={obillzLandingGridOverlayClass} aria-hidden />

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — glass sur fond dark (grille du shell visible à travers) */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-72 border-r border-white/10 bg-white/[0.06] backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="relative z-10 flex h-full flex-col">
          {/* Logo & close button */}
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <Link href="/tableau-de-bord" className="group flex min-w-0 flex-1 items-center">
              <Image
                src="/logo-obillz.png"
                alt="Obillz"
                width={180}
                height={47}
                className="h-14 w-auto max-w-[190px] object-contain transition-transform group-hover:scale-105"
                priority
              />
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <p className="px-4 mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">
              {t("dashboard.navigation.primary")}
            </p>
            <div className="space-y-1">
              {navigationPrimary.map((item) => {
                const IconComponent = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 transition-all duration-200",
                      active
                        ? "rounded-full bg-white font-semibold text-[var(--obillz-hero-blue)] shadow-lg"
                        : "rounded-xl text-white/80 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <IconComponent className={cn("h-5 w-5", active && "text-[var(--obillz-hero-blue)]")} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}

              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => setFinancesOpen((open) => !open)}
                  aria-expanded={financesOpen}
                  aria-controls={financesSubmenuId}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 transition-all duration-200",
                    isFinanceRoute
                      ? "rounded-xl bg-white/15 font-medium text-white ring-1 ring-white/20"
                      : "rounded-xl text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Wallet className="h-5 w-5 shrink-0" />
                  <span className="flex-1 text-left font-medium">{t("dashboard.nav.finances")}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-white/60 transition-transform duration-200",
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
                    <div className="ml-4 mt-1 space-y-0.5 border-l border-white/15 py-1 pl-3">
                      {navigationFinances.map((item) => {
                        const IconComponent = item.icon;
                        const active = isActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                              active
                                ? "bg-white font-semibold text-[var(--obillz-hero-blue)] shadow-md"
                                : "text-white/75 hover:bg-white/10 hover:text-white"
                            )}
                          >
                            <IconComponent
                              className={cn("h-4 w-4 shrink-0", active && "text-[var(--obillz-hero-blue)]")}
                            />
                            <span>{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {navigationSecondary.map((item) => {
                const IconComponent = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 transition-all duration-200",
                      active
                        ? "rounded-full bg-white font-semibold text-[var(--obillz-hero-blue)] shadow-lg"
                        : "rounded-xl text-white/80 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <IconComponent className={cn("h-5 w-5", active && "text-[var(--obillz-hero-blue)]")} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer sidebar */}
          <div className="p-4 border-t border-white/10">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">{t("dashboard.navigation.backHome")}</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="relative z-10 lg:ml-72 flex min-h-[100dvh] flex-col">
        {/* Topbar — capsule glass (aligné landing / auth) */}
        <header className="sticky top-0 z-30 px-3 pt-3 sm:px-4 lg:px-6">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 rounded-full border border-white/25 bg-white/[0.12] px-3 py-2 shadow-[0_8px_40px_rgba(26,35,255,0.2),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-2xl sm:gap-4 sm:px-4 sm:py-2.5">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden rounded-full p-2 text-white/85 transition hover:bg-white/10 hover:text-white"
                aria-label={t("dashboard.navigation.primary")}
              >
                <Menu className="h-5 w-5" />
              </button>
              <Link
                href="/tableau-de-bord"
                className="hidden shrink-0 transition hover:opacity-90 sm:inline-flex lg:hidden"
              >
                <Image
                  src="/logo-obillz.png"
                  alt="Obillz"
                  width={90}
                  height={22}
                  className="h-6 w-auto"
                />
              </Link>
              <p className="hidden truncate text-sm font-semibold text-white/90 lg:block lg:max-w-[220px] xl:max-w-none">
                {getPageTitle()}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <LanguageSwitcher />

              {!loadingUser &&
                (() => {
                  const displayName = clubName || t("dashboard.topbar.clubFallback");
                  const initial = (clubName || t("dashboard.topbar.clubFallback") || "C")
                    .charAt(0)
                    .toUpperCase();
                  return (
                    <div
                      className="flex max-w-[140px] items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-2 py-1 sm:max-w-[200px] sm:px-2.5 sm:py-1.5 md:max-w-none"
                      aria-label={displayName}
                      title={displayName}
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1A23FF]/80 text-xs font-bold text-white shadow-[0_0_16px_rgba(26,35,255,0.45)] ring-1 ring-blue-300/30">
                        {initial}
                      </div>
                      <span className="hidden truncate text-sm font-medium text-white md:inline">
                        {displayName}
                      </span>
                    </div>
                  );
                })()}

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-white/85 transition hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
              >
                {t("dashboard.topbar.logout")}
              </button>
            </div>
          </div>
        </header>

        <main className="relative flex-1 min-w-0 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="relative w-full min-w-0">{children}</div>
        </main>

        <footer className="border-t border-white/10 bg-transparent">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-white/75 sm:flex-row sm:px-6 lg:px-8">
            <p>{t("dashboard.footer.copyright")}</p>
            <div className="flex items-center gap-4">
              <Link href="/mentions-legales" className="hover:text-white transition-colors">
                {t("dashboard.footer.legal")}
              </Link>
              <Link href="/politique-confidentialite" className="hover:text-white transition-colors">
                {t("dashboard.footer.privacy")}
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
