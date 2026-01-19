export type AssistantLocale = "fr" | "en" | "de";

export type AssistantContext = {
  source: "dashboard" | "client" | "facture" | "devis";
  client?: {
    id?: string;
    nom?: string;
    email?: string;
  };
  document?: {
    id?: string;
    numero?: string;
    type?: "facture" | "devis";
    montant?: number;
    dateEcheance?: string | null;
    currency?: string;
  };
};

