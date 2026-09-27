/**
 * Traitement automatique après l'événement métier qui a déposé la file.
 * N'est pas appelé par une consultation du journal, des rapports ou un export.
 * Une comptabilité inactive n'écrit rien. L'audit porte l'action system_*.
 */
export async function safeProcessAccounting(clubId: string | null | undefined): Promise<void> {
  if (!clubId) return;
  try {
    const { processAccountingInbox } = await import("./service");
    await processAccountingInbox(clubId, null, "system");
  } catch (error) {
    console.error("[accounting] traitement différé", error);
  }
}
