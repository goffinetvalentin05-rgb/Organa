/**
 * Déclenche le traitement comptable sans jamais faire échouer le flux métier.
 * Les triggers SQL déposent l'événement ; ce traitement le transforme en écriture.
 */
export async function safeProcessAccounting(clubId: string | null | undefined): Promise<void> {
  if (!clubId) return;
  try {
    const { processAccountingInbox } = await import("./service");
    await processAccountingInbox(clubId);
  } catch (error) {
    console.error("[accounting] traitement différé", error);
  }
}
