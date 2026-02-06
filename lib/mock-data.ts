// Système de données mock en mémoire pour Obillz

export interface Client {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
}

export interface LigneDocument {
  id: string;
  designation: string;
  description?: string; // Description détaillée optionnelle sous le titre
  quantite: number;
  prixUnitaire: number;
  tva?: number; // Pourcentage TVA (ex: 7.7 pour 7.7%)
}

export interface Devis {
  id: string;
  numero: string;
  clientId: string;
  client?: Client;
  lignes: LigneDocument[];
  statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse';
  dateCreation: string;
  dateEcheance?: string;
  notes?: string;
}

export interface Facture {
  id: string;
  numero: string;
  clientId: string;
  client?: Client;
  lignes: LigneDocument[];
  statut: 'brouillon' | 'envoye' | 'paye' | 'en-retard';
  dateCreation: string;
  dateEcheance?: string;
  datePaiement?: string;
  notes?: string;
}

export interface Depense {
  id: string;
  fournisseur: string;
  montant: number;
  dateEcheance: string;
  statut: 'a_payer' | 'paye';
  note?: string;
  pieceJointe?: {
    name: string;
    url: string;
    type: string;
  };
}

export interface EvenementCalendrier {
  id: string;
  titre: string;
  description?: string;
  date: string; // ISO string
  heure?: string; // HH:mm
  type: 'rdv' | 'tache';
  statut?: 'a-faire' | 'fait'; // Pour les tâches
  typeTache?: 'relance' | 'rdv' | 'admin' | 'autre'; // Type de tâche
  dateEcheance?: string; // Pour les tâches
  factureId?: string; // Lien vers une facture si c'est une relance
}

export interface Parametres {
  nomEntreprise: string;
  adresse: string;
  email: string;
  telephone: string;
  logo?: string;
  styleEnTete: 'simple' | 'moderne' | 'classique';
  // Paramètres email
  emailExpediteur?: string;
  nomExpediteur?: string;
  resendApiKey?: string;
  // Paramètres bancaires
  iban?: string;
  bankName?: string;
  conditionsPaiement?: string;
}

// Données mock en mémoire
let clients: Client[] = [];

let devis: Devis[] = [];

let factures: Facture[] = [];

let depenses: Depense[] = [];

let evenements: EvenementCalendrier[] = [];

let parametres: Parametres = {
  nomEntreprise: 'Mon Entreprise',
  adresse: '123 Rue Example, 75001 Paris',
  email: 'contact@monentreprise.fr',
  telephone: '+33 1 23 45 67 89',
  styleEnTete: 'moderne',
  emailExpediteur: 'noreply@obillz.fr',
  nomExpediteur: 'Obillz',
  resendApiKey: '', // À configurer dans les paramètres
  iban: 'CH93 0076 2011 6238 5295 7',
  bankName: 'Banque Suisse',
  conditionsPaiement: 'Paiement à réception, délai de paiement : 30 jours',
};

// Fonctions utilitaires pour calculer les totaux
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

// API mock pour les clients
export const clientsAPI = {
  getAll: (): Client[] => {
    return clients.map(c => ({ ...c }));
  },
  getById: (id: string): Client | undefined => {
    return clients.find(c => c.id === id);
  },
  create: (client: Omit<Client, 'id'>): Client => {
    const newClient: Client = {
      ...client,
      id: Date.now().toString(),
    };
    clients.push(newClient);
    return newClient;
  },
  update: (id: string, updates: Partial<Omit<Client, 'id'>>): Client | undefined => {
    const index = clients.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    clients[index] = { ...clients[index], ...updates };
    return clients[index];
  },
  delete: (id: string): boolean => {
    const index = clients.findIndex(c => c.id === id);
    if (index === -1) return false;
    clients.splice(index, 1);
    // Supprimer aussi les devis et factures associés
    devis = devis.filter(d => d.clientId !== id);
    factures = factures.filter(f => f.clientId !== id);
    return true;
  },
};

// API mock pour les devis
export const devisAPI = {
  getAll: (): Devis[] => {
    return devis.map(d => ({
      ...d,
      client: clients.find(c => c.id === d.clientId),
    }));
  },
  getById: (id: string): Devis | undefined => {
    const devisItem = devis.find(d => d.id === id);
    if (!devisItem) return undefined;
    return {
      ...devisItem,
      client: clients.find(c => c.id === devisItem.clientId),
    };
  },
  create: (devisData: Omit<Devis, 'id' | 'numero'>): Devis => {
    const numero = `DEV-${new Date().getFullYear()}-${String(devis.length + 1).padStart(3, '0')}`;
    const newDevis: Devis = {
      ...devisData,
      id: Date.now().toString(),
      numero,
    };
    devis.push(newDevis);
    return newDevis;
  },
  update: (id: string, updates: Partial<Omit<Devis, 'id' | 'numero'>>): Devis | undefined => {
    const index = devis.findIndex(d => d.id === id);
    if (index === -1) return undefined;
    devis[index] = { ...devis[index], ...updates };
    return devis[index];
  },
  delete: (id: string): boolean => {
    const index = devis.findIndex(d => d.id === id);
    if (index === -1) return false;
    devis.splice(index, 1);
    return true;
  },
  transformerEnFacture: (devisId: string): Facture | undefined => {
    const devisItem = devis.find(d => d.id === devisId);
    if (!devisItem) return undefined;
    
    const numero = `FAC-${new Date().getFullYear()}-${String(factures.length + 1).padStart(3, '0')}`;
    const facture: Facture = {
      id: Date.now().toString(),
      numero,
      clientId: devisItem.clientId,
      lignes: devisItem.lignes.map(l => ({ ...l })),
      statut: 'brouillon',
      dateCreation: new Date().toISOString().split('T')[0],
      dateEcheance: devisItem.dateEcheance,
      notes: devisItem.notes,
    };
    factures.push(facture);
    return facture;
  },
};

// API mock pour les factures
export const facturesAPI = {
  getAll: (): Facture[] => {
    return factures.map(f => ({
      ...f,
      client: clients.find(c => c.id === f.clientId),
    }));
  },
  getById: (id: string): Facture | undefined => {
    const facture = factures.find(f => f.id === id);
    if (!facture) return undefined;
    return {
      ...facture,
      client: clients.find(c => c.id === facture.clientId),
    };
  },
  create: (factureData: Omit<Facture, 'id' | 'numero'>): Facture => {
    const numero = `FAC-${new Date().getFullYear()}-${String(factures.length + 1).padStart(3, '0')}`;
    const newFacture: Facture = {
      ...factureData,
      id: Date.now().toString(),
      numero,
    };
    factures.push(newFacture);
    return newFacture;
  },
  update: (id: string, updates: Partial<Omit<Facture, 'id' | 'numero'>>): Facture | undefined => {
    const index = factures.findIndex(f => f.id === id);
    if (index === -1) return undefined;
    factures[index] = { ...factures[index], ...updates };
    return factures[index];
  },
  delete: (id: string): boolean => {
    const index = factures.findIndex(f => f.id === id);
    if (index === -1) return false;
    factures.splice(index, 1);
    return true;
  },
};

// API mock pour les dépenses
export const depensesAPI = {
  getAll: (): Depense[] => {
    return depenses.map(d => ({ ...d, pieceJointe: d.pieceJointe ? { ...d.pieceJointe } : undefined }));
  },
  create: (depenseData: Omit<Depense, 'id'>): Depense => {
    const newDepense: Depense = {
      ...depenseData,
      id: Date.now().toString(),
    };
    depenses.unshift(newDepense);
    return newDepense;
  },
  update: (id: string, updates: Partial<Omit<Depense, 'id'>>): Depense | undefined => {
    const index = depenses.findIndex(d => d.id === id);
    if (index === -1) return undefined;
    depenses[index] = { ...depenses[index], ...updates };
    return depenses[index];
  },
  delete: (id: string): boolean => {
    const index = depenses.findIndex(d => d.id === id);
    if (index === -1) return false;
    depenses.splice(index, 1);
    return true;
  },
};

// API mock pour le calendrier
export const calendrierAPI = {
  getAll: (): EvenementCalendrier[] => {
    return [...evenements].sort((a, b) => a.date.localeCompare(b.date));
  },
  getById: (id: string): EvenementCalendrier | undefined => {
    return evenements.find(e => e.id === id);
  },
  create: (evenement: Omit<EvenementCalendrier, 'id'>): EvenementCalendrier => {
    const newEvenement: EvenementCalendrier = {
      ...evenement,
      id: Date.now().toString(),
    };
    evenements.push(newEvenement);
    return newEvenement;
  },
  update: (id: string, updates: Partial<Omit<EvenementCalendrier, 'id'>>): EvenementCalendrier | undefined => {
    const index = evenements.findIndex(e => e.id === id);
    if (index === -1) return undefined;
    evenements[index] = { ...evenements[index], ...updates };
    return evenements[index];
  },
  delete: (id: string): boolean => {
    const index = evenements.findIndex(e => e.id === id);
    if (index === -1) return false;
    evenements.splice(index, 1);
    return true;
  },
};

// API mock pour les paramètres
export const parametresAPI = {
  get: (): Parametres => {
    return { ...parametres };
  },
  update: (updates: Partial<Parametres>): Parametres => {
    parametres = { ...parametres, ...updates };
    return parametres;
  },
};

// Interface pour les données formatées pour le PDF
export interface DocumentForPdf {
  company: {
    name: string;
    address: string;
    email: string;
    phone: string;
    iban?: string;
    bankName?: string;
    logoUrl?: string;
    conditionsPaiement?: string;
  };
  client: {
    name: string;
    address: string;
    email: string;
  };
  document: {
    number: string;
    date: string;
    dueDate?: string;
    currency: string;
    vatRate: number;
    notes?: string;
    type: 'invoice' | 'quote';
  };
  lines: Array<{
    label: string;
    qty: number;
    unitPrice: number;
    total: number;
    vat?: number;
  }>;
  totals: {
    subtotal: number;
    vat: number;
    total: number;
  };
}

// Fonction pour récupérer et formater un document pour le PDF
export function getDocumentForPdf(id: string, type: 'invoice' | 'quote'): DocumentForPdf | null {
  const params = parametresAPI.get();
  
  let document: Devis | Facture | undefined;
  if (type === 'quote') {
    document = devisAPI.getById(id);
  } else {
    document = facturesAPI.getById(id);
  }

  if (!document || !document.client) {
    return null;
  }

  // Calculer les totaux
  const subtotal = calculerTotalHT(document.lignes);
  const vat = calculerTVA(document.lignes);
  const total = calculerTotalTTC(document.lignes);

  // Déterminer le taux de TVA (prendre le premier taux trouvé, ou 0)
  const vatRate = document.lignes.length > 0 && document.lignes[0]?.tva 
    ? document.lignes[0].tva 
    : 0;

  // Formater les lignes
  const lines = document.lignes.map(ligne => ({
    label: ligne.designation,
    qty: ligne.quantite,
    unitPrice: ligne.prixUnitaire,
    total: ligne.quantite * ligne.prixUnitaire,
    vat: ligne.tva || 0,
  }));

  // Construire l'URL du logo si disponible
  let logoUrl: string | undefined;
  if (params.logo) {
    // Si c'est déjà une URL complète, l'utiliser tel quel
    if (params.logo.startsWith('http://') || params.logo.startsWith('https://')) {
      logoUrl = params.logo;
    } else {
      // Sinon, construire l'URL relative
      logoUrl = params.logo.startsWith('/') ? params.logo : `/${params.logo}`;
    }
  }

  return {
    company: {
      name: params.nomEntreprise,
      address: params.adresse,
      email: params.email,
      phone: params.telephone,
      iban: params.iban,
      bankName: params.bankName,
      logoUrl: logoUrl,
      conditionsPaiement: params.conditionsPaiement,
    },
    client: {
      name: document.client.nom,
      address: document.client.adresse,
      email: document.client.email,
    },
    document: {
      number: document.numero,
      date: document.dateCreation,
      dueDate: document.dateEcheance,
      currency: 'CHF',
      vatRate: vatRate,
      notes: document.notes,
      type: type,
    },
    lines: lines,
    totals: {
      subtotal: subtotal,
      vat: vat,
      total: total,
    },
  };
}

