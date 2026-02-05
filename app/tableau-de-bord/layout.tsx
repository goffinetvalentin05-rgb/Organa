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
  Settings,
  Home,
  Menu,
  X,
  CreditCard,
  Wallet,
  QrCode,
  Calendar,
} from "@/lib/icons";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [companyName, setCompanyName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
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
        setUserEmail(data.user?.email ?? null);
        setCompanyName(data.user?.email?.split("@")[0] || "");
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

  const navigation = [
    { name: t("dashboard.nav.dashboard"), href: "/tableau-de-bord", icon: LayoutDashboard },
    { name: t("dashboard.nav.clients"), href: "/tableau-de-bord/clients", icon: Users },
    { name: t("dashboard.nav.quotes"), href: "/tableau-de-bord/devis", icon: FileText },
    { name: t("dashboard.nav.invoices"), href: "/tableau-de-bord/factures", icon: Receipt },
    { name: t("dashboard.nav.payments"), href: "/tableau-de-bord/paiements", icon: CreditCard },
    { name: t("dashboard.nav.events"), href: "/tableau-de-bord/evenements", icon: Calendar },
    { name: t("dashboard.nav.qrcodes"), href: "/tableau-de-bord/qrcodes", icon: QrCode },
    { name: t("dashboard.nav.expenses"), href: "/tableau-de-bord/depenses", icon: Wallet },
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
    if (pathname.startsWith("/tableau-de-bord/paiements")) return t("dashboard.pageTitles.payments");
    if (pathname.startsWith("/tableau-de-bord/evenements")) return t("dashboard.pageTitles.events");
    if (pathname.startsWith("/tableau-de-bord/qrcodes")) return t("dashboard.pageTitles.qrcodes");
    if (pathname.startsWith("/tableau-de-bord/depenses")) return t("dashboard.pageTitles.expenses");
    if (pathname.startsWith("/tableau-de-bord/parametres")) return t("dashboard.pageTitles.settings");
    return t("dashboard.pageTitles.dashboard");
  };

  return (
    <div className="dashboard-shell min-h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-screen w-72 z-50 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: "var(--obillz-hero-blue)" }}
      >
        {/* Grille subtile en arrière-plan */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative flex flex-col h-full">
          {/* Logo & close button */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <Link href="/tableau-de-bord" className="flex items-center group">
              <Image
                src="/logo-obillz.png"
                alt="Obillz"
                width={140}
                height={40}
                className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
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
              {navigation.map((item) => {
                const IconComponent = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      active
                        ? "bg-white text-[var(--obillz-hero-blue)] font-semibold shadow-lg"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 ${active ? "text-[var(--obillz-hero-blue)]" : ""}`} />
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
      <div className="lg:ml-72 min-h-screen flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            {/* Left: Mobile menu + Page title */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-slate-900">
                  {getPageTitle()}
                </h1>
              </div>
            </div>

            {/* Center: Page title (mobile) */}
            <div className="sm:hidden">
              <span className="text-sm font-semibold text-slate-700">
                {getPageTitle()}
              </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              
              {!loadingUser && (
                <div className="hidden md:flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                    <div 
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: "var(--obillz-hero-blue)" }}
                    >
                      {(companyName || userEmail || "U").charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
                      {companyName || userEmail || t("dashboard.topbar.userFallback")}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              >
                {t("dashboard.topbar.logout")}
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white px-4 py-4 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <p>© 2026 Obillz — La gestion du club en deux clics</p>
            <div className="flex items-center gap-4">
              <Link href="/mentions-legales" className="hover:text-slate-700 transition-colors">
                Mentions légales
              </Link>
              <Link href="/politique-confidentialite" className="hover:text-slate-700 transition-colors">
                Confidentialité
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
