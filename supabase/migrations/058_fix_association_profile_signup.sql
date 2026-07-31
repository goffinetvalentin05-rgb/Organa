-- ============================================
-- MIGRATION 058 : fix product_type Associations au signup
-- ============================================
-- Contexte (bug) :
--   La migration 057 faisait :
--     INSERT … product_type='association' ON CONFLICT (user_id) DO NOTHING
--   Si une ligne profiles existait déjà pour NEW.id avec le DEFAULT
--   product_type='sport' (création lazy billing, autre trigger, ou
--   insert concurrent), le DO NOTHING laissait 'sport'.
--
-- Correction :
--   Pour un signup dont raw_user_meta_data.product = 'association'
--   (valeur exacte), garantir profiles.product_type = 'association'
--   pour UNIQUEMENT profiles.user_id = NEW.id.
--
-- Sécurité :
--   - Whitelist metadata stricte ('association' uniquement).
--   - DO UPDATE limité à product_type.
--   - Conversion autorisée seulement si product_type actuel = 'sport'.
--   - Aucune touche à Stripe, branding, company_*, billing dates, etc.
--   - Aucun UPDATE global ; uniquement la ligne du NEW.id du trigger.
--   - Ne modifie PAS handle_new_user_membership ni les RLS.
--
-- IDEMPOTENT (CREATE OR REPLACE de la même fonction / même trigger).
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

  -- Whitelist : uniquement la valeur exacte 'association'.
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
    ON CONFLICT (user_id) DO UPDATE
      SET product_type = 'association'
      WHERE public.profiles.user_id = EXCLUDED.user_id
        AND public.profiles.user_id = NEW.id
        AND public.profiles.product_type = 'sport';
    -- Si product_type est déjà 'association' : no-op.
    -- Si product_type n'est ni sport ni association : impossible (CHECK).
    -- Jamais d'UPDATE des colonnes Stripe / company / settings.
  END IF;

  RETURN NEW;
END;
$$;

-- Recrée le trigger pour pointer explicitement sur la fonction à jour
-- (même nom qu'en 057 — pas de second trigger).
DROP TRIGGER IF EXISTS on_auth_user_created_association_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_association_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_association_profile();

COMMENT ON FUNCTION public.handle_new_user_association_profile() IS
  'Signup Associations : upsert profiles.product_type=association pour NEW.id uniquement si metadata product=association et (insert ou product_type était sport). Ne touche jamais Stripe/branding.';
