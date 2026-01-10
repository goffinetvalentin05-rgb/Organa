-- Extension pour générer des UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des organisations (une par utilisateur)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom_entreprise TEXT NOT NULL,
  adresse TEXT,
  email TEXT,
  telephone TEXT,
  logo_url TEXT,
  style_en_tete TEXT DEFAULT 'moderne',
  email_expediteur TEXT,
  nom_expediteur TEXT,
  resend_api_key TEXT,
  iban TEXT,
  bank_name TEXT,
  conditions_paiement TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Table des clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  adresse TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des devis
CREATE TABLE IF NOT EXISTS devis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'brouillon',
  date_creation DATE NOT NULL,
  date_echeance DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des lignes de devis
CREATE TABLE IF NOT EXISTS devis_lignes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  devis_id UUID NOT NULL REFERENCES devis(id) ON DELETE CASCADE,
  designation TEXT NOT NULL,
  quantite DECIMAL(10, 2) NOT NULL DEFAULT 1,
  prix_unitaire DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tva DECIMAL(5, 2) DEFAULT 7.7,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des factures
CREATE TABLE IF NOT EXISTS factures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'brouillon',
  date_creation DATE NOT NULL,
  date_echeance DATE,
  date_paiement DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des lignes de facture
CREATE TABLE IF NOT EXISTS factures_lignes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facture_id UUID NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
  designation TEXT NOT NULL,
  quantite DECIMAL(10, 2) NOT NULL DEFAULT 1,
  prix_unitaire DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tva DECIMAL(5, 2) DEFAULT 7.7,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des événements calendrier
CREATE TABLE IF NOT EXISTS evenements_calendrier (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  heure TIME,
  type TEXT NOT NULL DEFAULT 'rdv',
  statut TEXT,
  type_tache TEXT,
  date_echeance DATE,
  facture_id UUID REFERENCES factures(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_clients_organization ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_devis_organization ON devis(organization_id);
CREATE INDEX IF NOT EXISTS idx_devis_client ON devis(client_id);
CREATE INDEX IF NOT EXISTS idx_devis_lignes_devis ON devis_lignes(devis_id);
CREATE INDEX IF NOT EXISTS idx_factures_organization ON factures(organization_id);
CREATE INDEX IF NOT EXISTS idx_factures_client ON factures(client_id);
CREATE INDEX IF NOT EXISTS idx_factures_lignes_facture ON factures_lignes(facture_id);
CREATE INDEX IF NOT EXISTS idx_evenements_organization ON evenements_calendrier(organization_id);

-- Row Level Security (RLS) - Les utilisateurs ne peuvent voir que leurs propres données
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis_lignes ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures_lignes ENABLE ROW LEVEL SECURITY;
ALTER TABLE evenements_calendrier ENABLE ROW LEVEL SECURITY;

-- Policies pour organizations
CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own organization"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own organization"
  ON organizations FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies pour clients
CREATE POLICY "Users can view clients from their organization"
  ON clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = clients.organization_id
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert clients in their organization"
  ON clients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = clients.organization_id
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update clients in their organization"
  ON clients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = clients.organization_id
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete clients in their organization"
  ON clients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = clients.organization_id
      AND organizations.user_id = auth.uid()
    )
  );

-- Policies pour devis
CREATE POLICY "Users can view devis from their organization"
  ON devis FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = devis.organization_id
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert devis in their organization"
  ON devis FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = devis.organization_id
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update devis in their organization"
  ON devis FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = devis.organization_id
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete devis in their organization"
  ON devis FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = devis.organization_id
      AND organizations.user_id = auth.uid()
    )
  );

-- Policies pour devis_lignes
CREATE POLICY "Users can view devis_lignes from their organization"
  ON devis_lignes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM devis
      JOIN organizations ON organizations.id = devis.organization_id
      WHERE devis.id = devis_lignes.devis_id
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert devis_lignes in their organization"
  ON devis_lignes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM devis
      JOIN organizations ON organizations.id = devis.organization_id
      WHERE devis.id = devis_lignes.devis_id
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update devis_lignes in their organization"
  ON devis_lignes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM devis
      JOIN organizations ON organizations.id = devis.organization_id
      WHERE devis.id = devis_lignes.devis_id
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete devis_lignes in their organization"
  ON devis_lignes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM devis
      JOIN organizations ON organizations.id = devis.organization_id
      WHERE devis.id = devis_lignes.devis_id
      AND organizations.user_id = auth.uid()
    )
  );

-- Policies pour factures (même logique que devis)
CREATE POLICY "Users can view factures from their organization"
  ON factures FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = factures.organization_id
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert factures in their organization"
  ON factures FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = factures.organization_id
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update factures in their organization"
  ON factures FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = factures.organization_id
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete factures in their organization"
  ON factures FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = factures.organization_id
      AND organizations.user_id = auth.uid()
    )
  );

-- Policies pour factures_lignes
CREATE POLICY "Users can view factures_lignes from their organization"
  ON factures_lignes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM factures
      JOIN organizations ON organizations.id = factures.organization_id
      WHERE factures.id = factures_lignes.facture_id
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert factures_lignes in their organization"
  ON factures_lignes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM factures
      JOIN organizations ON organizations.id = factures.organization_id
      WHERE factures.id = factures_lignes.facture_id
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update factures_lignes in their organization"
  ON factures_lignes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM factures
      JOIN organizations ON organizations.id = factures.organization_id
      WHERE factures.id = factures_lignes.facture_id
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete factures_lignes in their organization"
  ON factures_lignes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM factures
      JOIN organizations ON organizations.id = factures.organization_id
      WHERE factures.id = factures_lignes.facture_id
      AND organizations.user_id = auth.uid()
    )
  );

-- Policies pour evenements_calendrier
CREATE POLICY "Users can view evenements from their organization"
  ON evenements_calendrier FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = evenements_calendrier.organization_id
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert evenements in their organization"
  ON evenements_calendrier FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = evenements_calendrier.organization_id
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update evenements in their organization"
  ON evenements_calendrier FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = evenements_calendrier.organization_id
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete evenements in their organization"
  ON evenements_calendrier FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = evenements_calendrier.organization_id
      AND organizations.user_id = auth.uid()
    )
  );






















