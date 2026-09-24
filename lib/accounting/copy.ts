/**
 * Formulations retenues pour l’interface.
 * Ne pas présenter la V1 comme suffisante pour toutes les associations.
 */

export const ACCOUNTING_TAGLINE =
  "Comptabilité conçue selon les principes comptables suisses.";

export const ACCOUNTING_PITCH =
  "Automatisez la comptabilité du club à partir de vos cotisations, factures et dépenses, sans ressaisie inutile.";

export const ACCOUNTING_SCOPE_NOTE =
  "Obillz propose une comptabilité pensée en priorité pour les associations qui n’ont pas l’obligation de requérir leur inscription au registre du commerce. Certaines situations peuvent nécessiter des écritures complémentaires ou un accompagnement fiduciaire.";

export const OPENING_HELP =
  "Indiquez les soldes au jour où vous commencez la comptabilité Obillz.";

export const ACCOUNTING_PRICE_NOTE =
  "Abonnement séparé. N’affecte pas votre formule Obillz actuelle.";

export const ACCOUNTING_BENEFITS = [
  {
    title: "Écritures automatiques",
    text: "Chaque encaissement ou paiement prépare une écriture, sans ressaisie.",
  },
  {
    title: "Journal comptable",
    text: "Toutes les opérations validées restent lisibles dans l’ordre chronologique.",
  },
  {
    title: "Bilan et compte de résultat",
    text: "Les rapports officiels ne retiennent que les écritures validées.",
  },
  {
    title: "Plan comptable suisse",
    text: "Un plan de départ pensé pour un club, que vous pouvez ajuster.",
  },
  {
    title: "Pièces justificatives centralisées",
    text: "Les justificatifs restent attachés à l’écriture correspondante.",
  },
  {
    title: "Contrôle du trésorier",
    text: "Rien d’incertain n’entre dans les comptes avant validation.",
  },
] as const;

export const ACCOUNTING_STEPS = [
  {
    title: "Vous encaissez ou payez dans Obillz",
    text: "Cotisation, facture, dépense ou autre mouvement réel du club.",
  },
  {
    title: "Obillz prépare l’écriture",
    text: "Le montant, la date et les comptes proposés sont prêts à relire.",
  },
  {
    title: "Le trésorier vérifie et valide",
    text: "L’écriture n’entre dans les rapports qu’une fois confirmée.",
  },
] as const;

export const ACCOUNTING_MODULES = [
  "Journal",
  "Plan comptable",
  "Rapports",
  "Exercices",
  "Paramètres",
] as const;
