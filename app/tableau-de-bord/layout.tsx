"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, Users, FileText, Receipt, Calendar, Settings, Home, AlertTriangle } from "@/lib/icons";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("Organa");
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
        setCompanyName(
          data.user?.email?.split("@")[0] || "Mon entreprise"
        );
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
    { name: "Tableau de bord", href: "/tableau-de-bord", icon: LayoutDashboard },
    { name: "Clients", href: "/tableau-de-bord/clients", icon: Users },
    { name: "Devis", href: "/tableau-de-bord/devis", icon: FileText },
    { name: "Factures", href: "/tableau-de-bord/factures", icon: Receipt },
    { name: "Dépenses", href: "/tableau-de-bord/depenses", icon: Receipt },
    { name: "À ne pas oublier", href: "/tableau-de-bord/a-ne-pas-oublier", icon: AlertTriangle },
    { name: "Calendrier", href: "/tableau-de-bord/calendrier", icon: Calendar },
    { name: "Paramètres", href: "/tableau-de-bord/parametres", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/tableau-de-bord") {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen text-primary relative overflow-hidden">
      {/* FOND - DÉGRADÉ BLEU NOIR */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: "linear-gradient(180deg, #0a0e2e 0%, #080b1f 40%, #050616 70%, #000000 100%)",
        }}
      ></div>
      
      {/* Overlay très léger pour la lisibilité du texte */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-black/20"></div>

      {/* Grille subtile en arrière-plan */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-surface border-r border-subtle z-40">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-subtle">
            <Link href="/tableau-de-bord" className="flex items-center gap-3 group">
              {companyLogo ? (
                <Image
                  src={companyLogo}
                  alt={companyName}
                  width={140}
                  height={40}
                  className="h-auto max-h-10 w-auto transition-transform group-hover:scale-105 object-contain"
                />
              ) : (
                <Image
                  src="/organa-logo.png"
                  alt="Organa"
                  width={140}
                  height={28}
                  className="h-auto transition-transform group-hover:scale-105"
                />
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`font-body flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-accent-light border border-accent-border text-primary font-semibold"
                      : "text-secondary hover:text-primary hover:bg-surface-hover border border-transparent hover:border-subtle"
                  }`}
                >
                  <IconComponent className={`w-5 h-5 ${isActive(item.href) ? "text-accent" : "text-secondary"}`} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer sidebar */}
          <div className="p-4 border-t border-subtle">
            <Link
              href="/"
              className="font-body flex items-center gap-3 px-4 py-3 rounded-lg text-secondary hover:text-primary hover:bg-surface-hover border border-transparent hover:border-subtle transition-all duration-200"
            >
              <Home className="w-5 h-5 text-secondary" />
              <span className="font-medium">Retour à l'accueil</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="ml-64 relative z-10">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-surface/80 border-b border-subtle backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4">
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
            <div className="flex items-center gap-4">
              {!loadingUser && companyName && companyName !== "Organa" && (
                <span className="text-xs text-white/40 font-normal">
                  {companyName}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="btn-secondary px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface text-secondary hover:text-primary transition-all duration-200 border border-subtle hover:border-subtle-hover"
              >
                Se déconnecter
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


