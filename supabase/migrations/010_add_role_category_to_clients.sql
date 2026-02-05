-- Migration: Ajouter role et category aux membres (clients)
-- Cette migration ajoute les colonnes pour organiser les membres par rôle et catégorie

-- Ajouter la colonne role (type de membre)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'player';

-- Ajouter la colonne category (équipe/fonction, nullable)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS category TEXT DEFAULT NULL;

-- Créer un index sur role pour les filtres
CREATE INDEX IF NOT EXISTS idx_clients_role ON clients(role);

-- Créer un index sur category pour les filtres
CREATE INDEX IF NOT EXISTS idx_clients_category ON clients(category);

-- Commentaires sur les colonnes
COMMENT ON COLUMN clients.role IS 'Rôle du membre: player, coach, volunteer, staff';
COMMENT ON COLUMN clients.category IS 'Catégorie/équipe du membre: first_team, second_team, junior, president, treasurer, secretary, etc.';
