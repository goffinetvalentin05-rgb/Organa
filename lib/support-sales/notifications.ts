export const SUPPORT_SALE_LAUNCH_KEY_PREFIX = "support_sale_";

export function supportSaleLaunchKey(saleId: string): string {
  return `${SUPPORT_SALE_LAUNCH_KEY_PREFIX}${saleId}`;
}

export function isSupportSaleLaunchKey(key: string): boolean {
  return key.startsWith(SUPPORT_SALE_LAUNCH_KEY_PREFIX);
}

export function launchNotificationCopy(sale: {
  name: string;
  goalPerMember: number | null;
}): { title: string; message: string; cta: string } {
  return {
    title: "Nouvelle vente de soutien",
    message: sale.goalPerMember
      ? `${sale.name} est maintenant disponible. Objectif : ${sale.goalPerMember} par membre.`
      : `${sale.name} est maintenant disponible.`,
    cta: "Voir la vente",
  };
}
