"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/components/I18nProvider";
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  Calendar,
  Settings,
  Home,
  AlertTriangle,
  CheckCircle,
} from "@/lib/icons";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) {
          console.warn("[AUTH][DashboardLayout] Impossible de récupérer /api/me", {
            status: res.status,
          });
          // Ne pas forcer de redirect ici : on laisse le middleware gérer la protection
          // pour éviter de casser la navigation (clients/devis/factures).
          return;
        }

        const data = await res.json();

        console.log("[AUTH][DashboardLayout] Session utilisateur chargée", {
          userId: data.user?.id,
          email: data.user?.email,
        });

        setUserEmail(data.user?.email ?? null);
        setCompanyName(data.user?.email?.split("@")[0] || "");
        setCompanyLogo(null);
      } catch (error) {
        console.error("[AUTH][DashboardLayout] Erreur lors de l'appel à /api/me", error);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchMe();
  }, [pathname, router]); // Recharger quand on change de page

  const supabase = createClient();

  const handleLogout = async () => {
    try {
      console.log("[AUTH][Logout] Déconnexion demandée pour", { email: userEmail });
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("[AUTH][Logout] Erreur lors de la déconnexion", error);
        return;
      }
      console.log("[AUTH][Logout] Déconnexion réussie");
      router.push("/connexion");
      router.refresh();
    } catch (error) {
      console.error("[AUTH][Logout] Erreur inattendue lors de la déconnexion", error);
    }
  };

  const navigation = [
    { name: t("dashboard.nav.dashboard"), href: "/tableau-de-bord", icon: LayoutDashboard },
    { name: t("dashboard.nav.clients"), href: "/tableau-de-bord/clients", icon: Users },
    { name: t("dashboard.nav.quotes"), href: "/tableau-de-bord/devis", icon: FileText },
    { name: t("dashboard.nav.invoices"), href: "/tableau-de-bord/factures", icon: Receipt },
    { name: t("dashboard.nav.expenses"), href: "/tableau-de-bord/depenses", icon: Receipt },
  ];

  const secondaryNavigation = [
    { name: t("dashboard.nav.reminders"), href: "/tableau-de-bord/a-ne-pas-oublier", icon: AlertTriangle },
    { name: t("dashboard.nav.calendar"), href: "/tableau-de-bord/calendrier", icon: Calendar },
    { name: t("dashboard.nav.settings"), href: "/tableau-de-bord/parametres", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/tableau-de-bord") {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  const getPageTitle = () => {
    if (!pathname) return t("dashboard.pageTitles.dashboard");
    if (pathname.startsWith("/tableau-de-bord/clients/nouveau")) return t("dashboard.pageTitles.newClient");
    if (pathname.startsWith("/tableau-de-bord/clients/") && pathname.includes("/edit")) {
      return t("dashboard.pageTitles.editClient");
    }
    if (pathname.startsWith("/tableau-de-bord/clients")) return t("dashboard.pageTitles.clients");
    if (pathname.startsWith("/tableau-de-bord/devis")) return t("dashboard.pageTitles.quotes");
    if (pathname.startsWith("/tableau-de-bord/factures")) return t("dashboard.pageTitles.invoices");
    if (pathname.startsWith("/tableau-de-bord/depenses")) return t("dashboard.pageTitles.expenses");
    if (pathname.startsWith("/tableau-de-bord/calendrier")) return t("dashboard.pageTitles.calendar");
    if (pathname.startsWith("/tableau-de-bord/parametres")) return t("dashboard.pageTitles.settings");
    if (pathname.startsWith("/tableau-de-bord/a-ne-pas-oublier")) return t("dashboard.pageTitles.reminders");
    return t("dashboard.pageTitles.dashboard");
  };

  return (
    <div className="dashboard-shell min-h-screen bg-dashboard text-primary relative">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-72 bg-surface border-r border-subtle z-40 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-subtle">
            <Link href="/tableau-de-bord" className="flex items-center gap-4 group">
              {companyLogo ? (
                <Image
                  src={companyLogo}
                  alt={companyName}
                  width={160}
                  height={42}
                  className="h-auto max-h-12 w-auto transition-transform group-hover:scale-105 object-contain"
                />
              ) : (
                <Image
                  src="/organa-logo.png"
                  alt="Organa"
                  width={160}
                  height={32}
                  className="h-auto transition-transform group-hover:scale-105"
                />
              )}
              <span className="text-xs uppercase tracking-[0.32em] text-tertiary">
                {t("dashboard.brandLabel")}
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-6">
            <div>
              <p className="px-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-tertiary">
                {t("dashboard.navigation.primary")}
              </p>
              <div className="mt-4 space-y-2">
                {navigation.map((item) => {
                  const IconComponent = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`font-body flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        active
                          ? "bg-accent-light border border-accent-border text-primary font-semibold shadow-[0_12px_30px_rgba(37,99,235,0.18)]"
                          : "text-secondary hover:text-primary hover:bg-surface-hover border border-transparent hover:border-subtle"
                      }`}
                    >
                      <IconComponent className={`w-5 h-5 ${active ? "text-accent" : "text-secondary"}`} />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="px-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-tertiary">
                {t("dashboard.navigation.secondary")}
              </p>
              <div className="mt-4 space-y-2">
                {secondaryNavigation.map((item) => {
                  const IconComponent = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`font-body flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        active
                          ? "bg-accent-light border border-accent-border text-primary font-semibold shadow-[0_12px_30px_rgba(37,99,235,0.18)]"
                          : "text-secondary hover:text-primary hover:bg-surface-hover border border-transparent hover:border-subtle"
                      }`}
                    >
                      <IconComponent className={`w-5 h-5 ${active ? "text-accent" : "text-secondary"}`} />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Footer sidebar */}
          <div className="p-4 border-t border-subtle">
            <Link
              href="/"
              className="font-body flex items-center gap-3 px-4 py-3 rounded-xl text-secondary hover:text-primary hover:bg-surface-hover border border-transparent hover:border-subtle transition-all duration-200"
            >
              <Home className="w-5 h-5 text-secondary" />
              <span className="font-medium">{t("dashboard.navigation.backHome")}</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="ml-72 relative z-10">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-surface border-b border-subtle">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center px-6 py-3">
            <div className="flex items-center gap-4">
              {companyLogo ? (
                <Image
                  src={companyLogo}
                  alt={companyName}
                  width={120}
                  height={32}
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <Image
                  src="/organa-logo.png"
                  alt="Organa"
                  width={120}
                  height={28}
                  className="h-8 w-auto object-contain"
                />
              )}
            </div>
            <div className="flex items-center justify-center">
              <div className="rounded-full border border-subtle bg-surface-hover px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                {getPageTitle()}
              </div>
            </div>
            <div className="flex items-center justify-end gap-4">
              <LanguageSwitcher />
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-subtle bg-surface-hover px-3 py-1 text-xs text-secondary">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>{t("dashboard.topbar.upToDate")}</span>
              </div>
              {!loadingUser && (
                <div className="flex items-center gap-2 rounded-full border border-subtle bg-surface-hover px-3 py-1 text-xs text-secondary">
                  <span className="text-tertiary">{t("dashboard.topbar.connectedAs")}</span>
                  <span className="text-primary">
                    {companyName ? companyName : userEmail || t("dashboard.topbar.userFallback")}
                  </span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="btn-secondary px-4 py-2 rounded-full bg-surface-hover hover:bg-surface text-secondary hover:text-primary transition-all duration-200 border border-subtle hover:border-subtle-hover"
              >
                {t("dashboard.topbar.logout")}
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}






