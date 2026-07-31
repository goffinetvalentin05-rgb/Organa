import DashboardShell from "./DashboardShell";

/**
 * Layout Sport.
 * La séparation produit (sport vs association) est appliquée dans le middleware
 * pour /tableau-de-bord/** hors flux MFA. Les pages MFA restent accessibles
 * à tout utilisateur authentifié (next=… vers le bon produit).
 */
export default function TableauDeBordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
