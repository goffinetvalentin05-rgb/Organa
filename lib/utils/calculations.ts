// Fonctions utilitaires pour calculer les totaux des documents

export interface LigneDocument {
  id: string;
  designation: string;
  description?: string; // Description détaillée optionnelle sous le titre
  quantite: number;
  prixUnitaire: number;
  tva?: number; // Pourcentage TVA (ex: 7.7 pour 7.7%)
}

export function calculerTotalHT(lignes: LigneDocument[] | undefined | null): number {
  if (!lignes || !Array.isArray(lignes)) return 0;
  return lignes.reduce((total, ligne) => {
    if (!ligne) return total;
    const quantite = ligne.quantite || 0;
    const prixUnitaire = ligne.prixUnitaire || 0;
    return total + quantite * prixUnitaire;
  }, 0);
}

export function calculerTVA(lignes: LigneDocument[] | undefined | null): number {
  if (!lignes || !Array.isArray(lignes)) return 0;
  return lignes.reduce((total, ligne) => {
    if (!ligne) return total;
    const tva = ligne.tva || 0;
    const quantite = ligne.quantite || 0;
    const prixUnitaire = ligne.prixUnitaire || 0;
    return total + (quantite * prixUnitaire * tva) / 100;
  }, 0);
}

export function calculerTotalTTC(lignes: LigneDocument[] | undefined | null): number {
  return calculerTotalHT(lignes) + calculerTVA(lignes);
}






