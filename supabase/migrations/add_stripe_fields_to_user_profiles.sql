-- Migration: Ajouter les champs Stripe à user_profiles
-- Ajoute stripe_customer_id et stripe_subscription_id pour gérer les abonnements

-- Ajouter les colonnes Stripe si elles n'existent pas déjà
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT NULL,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT NULL;

-- Créer des index pour améliorer les recherches par customer/subscription ID
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer_id 
  ON user_profiles(stripe_customer_id) 
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_subscription_id 
  ON user_profiles(stripe_subscription_id) 
  WHERE stripe_subscription_id IS NOT NULL;

-- Mettre à jour la fonction updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour updated_at s'il n'existe pas déjà
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
























