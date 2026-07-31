"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Landmark,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  ASSOCIATIONS_NAV,
  associationsNavTitle,
} from "@/components/associations/dashboard/nav";
import styles from "./associations-dashboard.module.css";

const ICONS: Record<string, LucideIcon> = {
  "/associations/espace": LayoutDashboard,
  "/associations/espace/membres": Users,
  "/associations/espace/cotisations": Wallet,
  "/associations/espace/evenements": Calendar,
  "/associations/espace/documents": FileText,
  "/associations/espace/communication": Megaphone,
  "/associations/espace/finances": Landmark,
  "/associations/espace/parametres": Settings,
};

export type AssociationsDashboardShellProps = {
  children: ReactNode;
  orgName: string;
  logoUrl: string | null;
  userEmail: string | null;
  userLabel: string;
  role: string;
};

export default function AssociationsDashboardShell({
  children,
  orgName,
  logoUrl,
  userEmail,
  userLabel,
  role,
}: AssociationsDashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("obillz-asso-sidebar-collapsed") === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("obillz-asso-sidebar-collapsed", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/associations/connexion");
    router.refresh();
  };

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/associations/espace") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const pageTitle = associationsNavTitle(pathname);
  const initial = (userLabel || orgName || "A").charAt(0).toUpperCase();

  const renderNav = (compact: boolean) => (
    <>
      <div className={`${styles.brand} ${compact ? styles.brandCollapsed : ""}`}>
        <Link
          href="/associations/espace"
          className="inline-flex min-w-0 flex-1 items-center gap-2.5"
          aria-label="Accueil Obillz Associations"
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="h-9 w-9 rounded-xl object-cover ring-1 ring-white/15"
            />
          ) : (
            <Image
              src="/logo-symbole.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
          )}
          <div className={styles.brandText}>
            <p className={styles.brandEyebrow}>Obillz Associations</p>
            <p className={styles.brandName}>{orgName}</p>
          </div>
        </Link>
        {compact ? (
          <button
            type="button"
            className="rounded-xl p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Agrandir la sidebar" : "Réduire la sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        ) : (
          <button
            type="button"
            className="rounded-xl p-2 text-white/70 transition hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className={styles.nav} aria-label="Navigation principale">
        <p className={styles.navLabel}>{collapsed && compact ? "Menu" : "Navigation"}</p>
        {ASSOCIATIONS_NAV.map((item) => {
          const Icon = ICONS[item.href] ?? LayoutDashboard;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={styles.navIcon} aria-hidden />
              <span className={styles.navLinkText}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className={styles.navLink}
          title="Déconnexion"
        >
          <LogOut className={styles.navIcon} aria-hidden />
          <span className={styles.navLinkText}>Déconnexion</span>
        </button>
      </div>
    </>
  );

  return (
    <div
      className={`${styles.shell} ${collapsed ? styles.shellCollapsed : styles.shellExpanded}`}
    >
      <div className={styles.noise} aria-hidden />

      {mobileOpen ? (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Fermer le menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`${styles.sidebar} ${styles.sidebarMobile}`}
        style={{ transform: mobileOpen ? "translateX(0)" : "translateX(-105%)" }}
        aria-hidden={!mobileOpen}
      >
        {renderNav(false)}
      </aside>

      <aside className={`${styles.sidebar} ${styles.sidebarDesktop}`} aria-label="Sidebar">
        {renderNav(true)}
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className={`${styles.iconButton} lg:hidden`}
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className={styles.topbarTitle}>{pageTitle}</h1>
              <p className={styles.topbarMeta}>
                {orgName}
                {role ? ` · ${role}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className={styles.profileChip} title={userEmail ?? userLabel}>
              <span className={styles.avatar} aria-hidden>
                {initial}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-[#17211d]">
                  {userLabel}
                </span>
                {userEmail ? (
                  <span className="block truncate text-[11px] font-medium text-[#66736d]">
                    {userEmail}
                  </span>
                ) : null}
              </span>
            </div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className={styles.secondaryButton}
              aria-label="Se déconnecter"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
