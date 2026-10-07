export type DocumentRetention = "none" | "payment" | "accounting";

export type DocumentRemoval = {
  action: "delete" | "archive";
  retention: DocumentRetention;
};

export function isDocumentPaid(type: string, status: string | null | undefined): boolean {
  if (type === "quote") return status === "accepte" || status === "paye";
  return status === "paye";
}

/**
 * Un paiement ou une écriture réelle impose l'archivage.
 * Le statut payé ne signifie pas à lui seul qu'une écriture existe.
 */
export function classifyDocumentRemoval(input: {
  type: string;
  status: string | null | undefined;
  datePaiement: string | null | undefined;
  receiptCount: number;
  entryCount: number;
}): DocumentRemoval {
  if (input.entryCount > 0) return { action: "archive", retention: "accounting" };
  const paid = isDocumentPaid(input.type, input.status) || Boolean(input.datePaiement);
  if (input.receiptCount > 0 || paid) return { action: "archive", retention: "payment" };
  return { action: "delete", retention: "none" };
}

export function removalMessage(kind: "quote" | "invoice", retention: DocumentRetention): string {
  if (retention === "accounting") {
    return kind === "quote"
      ? "Cette cotisation est liée à votre comptabilité. Elle sera retirée de la liste des cotisations. L’écriture comptable, les paiements et le justificatif seront conservés."
      : "Cette facture est liée à votre comptabilité. Elle sera retirée de la liste des factures. L’écriture comptable, les paiements et le justificatif seront conservés.";
  }
  if (retention === "payment") {
    return kind === "quote"
      ? "Cette cotisation est payée, sans écriture comptable. Elle sera retirée de la liste des cotisations. Le paiement enregistré sera conservé."
      : "Cette facture est payée, sans écriture comptable. Elle sera retirée de la liste des factures. Le paiement enregistré sera conservé.";
  }
  return kind === "quote"
    ? "Êtes-vous sûr de vouloir supprimer cette cotisation ?"
    : "Êtes-vous sûr de vouloir supprimer cette facture ?";
}
