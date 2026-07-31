-- ============================================
-- MIGRATION 057 : profil Associations à l'inscription
-- ============================================
-- Objectif :
--   Lors d'un signup avec metadata Auth product = 'association'
--   (valeur exacte uniquement), créer immédiatement la ligne
--   public.profiles avec product_type = 'association'.
--
-- Pourquoi :
--   La confirmation email laisse souvent aucune session après signUp :
--   le client ne peut pas écrire profiles de façon fiable.
--   Le trigger lit raw_user_meta_data côté Auth (serveur).
--
-- Sécurité :
--   - Whitelist stricte : seule la valeur exacte 'association' est acceptée.
--   - Toute autre valeur (ou absence) → no-op → Sport reste sur le DEFAULT
--     'sport' via création lazy existante.
--   - ON CONFLICT DO NOTHING : ne modifie JAMAIS une org existante.
--
-- Ne modifie PAS :
--   - handle_new_user_membership / on_auth_user_created_membership
--   - RLS, helpers, colonnes existantes
--
-- IDEMPOTENT.
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user_association_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product TEXT;
BEGIN
  v_product := lower(trim(COALESCE(NEW.raw_user_meta_data->>'product', '')));

  -- Whitelist : uniquement 'association'. Aucune autre valeur n'est honorée.
  IF v_product = 'association' THEN
    INSERT INTO public.profiles (
      user_id,
      product_type,
      subscription_status,
      trial_started_at,
      plan
    )
    VALUES (
      NEW.id,
      'association',
      'trial',
      NOW(),
      'free'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_association_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_association_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_association_profile();

COMMENT ON FUNCTION public.handle_new_user_association_profile() IS
  'Crée profiles(product_type=association) si raw_user_meta_data.product = association. Ne touche jamais aux orgs existantes.';
