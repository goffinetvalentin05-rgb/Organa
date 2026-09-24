export function sourceHref(sourceType: string, sourceId: string | null): string | null {
  if (!sourceId) return null;
  switch (sourceType) {
    case "membership":
      return `/tableau-de-bord/devis/${sourceId}`;
    case "invoice":
      return `/tableau-de-bord/factures/${sourceId}`;
    case "expense":
      return "/tableau-de-bord/depenses";
    case "shop_order":
      return "/tableau-de-bord/boutique";
    case "supporter":
      return "/tableau-de-bord/supporters";
    case "support_sale":
      return `/tableau-de-bord/ventes-soutien/${sourceId}`;
    case "club_revenue":
      return "/tableau-de-bord/paiements";
    default:
      return null;
  }
}

export function sourceLabel(sourceType: string): string {
  switch (sourceType) {
    case "membership":
      return "Cotisation";
    case "invoice":
      return "Facture";
    case "expense":
      return "Dépense";
    case "shop_order":
      return "Boutique";
    case "supporter":
      return "Carte supporter";
    case "support_sale":
      return "Vente de soutien";
    case "club_revenue":
      return "Encaissement";
    case "manual":
      return "Saisie manuelle";
    case "manual_accounting":
      return "Écriture avancée";
    case "opening":
      return "Solde d’ouverture";
    case "period_close":
      return "Clôture";
    default:
      return "Opération";
  }
}
