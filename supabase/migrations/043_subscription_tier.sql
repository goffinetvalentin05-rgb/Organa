-- subscription_tier: standard (solo) | team (multi-utilisateurs). Défaut: standard.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'standard';

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('standard', 'team'));

COMMENT ON COLUMN profiles.subscription_tier IS
  'Obillz: standard = compte principal seul; team = gestion Utilisateurs et acces';
