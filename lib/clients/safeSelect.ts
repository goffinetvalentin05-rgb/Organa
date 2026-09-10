/**
 * Colonnes `clients` sûres pour les APIs hors fiche / édition membre.
 * Jamais d’avs_number ni de date_of_birth.
 */
export const CLIENTS_SAFE_COLUMNS =
  "id, nom, email, telephone, adresse, postal_code, city";

/** Affectations planning : identité + rôle, sans AVS ni date de naissance. */
export const CLIENTS_PLANNING_COLUMNS =
  "id, nom, email, telephone, role, category";
