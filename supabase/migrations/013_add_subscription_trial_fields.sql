-- Migration: Ajout des champs trial et subscription à profiles
-- Cette migration remplace la logique free/pro par trial/subscription
-- Date: 2026-02-XX

-- ============================================
-- ÉTAPE 1 : Ajouter les nouveaux champs de subscription
-- ============================================

-- subscription_status: 'trial' | 'active' | 'expired'
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_status TEXT DEFAULT 'trial';
        RAISE NOTICE '✓ Colonne subscription_status ajoutée';
    END IF;
END $$;

-- trial_started_at: timestamp du début de l'essai
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'trial_started_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN trial_started_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✓ Colonne trial_started_at ajoutée';
    END IF;
END $$;

-- billing_cycle: 'monthly' | 'yearly' | null
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'billing_cycle'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN billing_cycle TEXT DEFAULT NULL;
        RAISE NOTICE '✓ Colonne billing_cycle ajoutée';
    END IF;
END $$;

-- subscription_started_at: timestamp du début de l'abonnement
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'subscription_started_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_started_at TIMESTAMPTZ DEFAULT NULL;
        RAISE NOTICE '✓ Colonne subscription_started_at ajoutée';
    END IF;
END $$;

-- subscription_ends_at: timestamp de fin de l'abonnement (pour le renouvellement)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'subscription_ends_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_ends_at TIMESTAMPTZ DEFAULT NULL;
        RAISE NOTICE '✓ Colonne subscription_ends_at ajoutée';
    END IF;
END $$;

-- ============================================
-- ÉTAPE 2 : Migrer les données existantes
-- ============================================

-- Les utilisateurs avec plan='pro' deviennent subscription_status='active'
-- Les utilisateurs avec plan='free' deviennent subscription_status='trial' 
-- (avec trial_started_at = created_at pour calculer si le trial est expiré)
UPDATE public.profiles 
SET 
    subscription_status = CASE 
        WHEN plan = 'pro' THEN 'active'
        ELSE 'trial'
    END,
    trial_started_at = COALESCE(trial_started_at, created_at)
WHERE subscription_status IS NULL OR subscription_status = 'trial';

-- Pour les utilisateurs pro existants, définir billing_cycle='monthly' par défaut
UPDATE public.profiles 
SET 
    billing_cycle = 'monthly',
    subscription_started_at = updated_at
WHERE plan = 'pro' AND billing_cycle IS NULL;

-- ============================================
-- ÉTAPE 3 : Ajouter les commentaires pour documentation
-- ============================================
COMMENT ON COLUMN public.profiles.subscription_status IS 'Statut de l''abonnement: trial (essai 7 jours), active (abonnement actif), expired (essai terminé sans abonnement)';
COMMENT ON COLUMN public.profiles.trial_started_at IS 'Date de début de la période d''essai (7 jours)';
COMMENT ON COLUMN public.profiles.billing_cycle IS 'Cycle de facturation: monthly (25 CHF/mois) ou yearly (270 CHF/an)';
COMMENT ON COLUMN public.profiles.subscription_started_at IS 'Date de début de l''abonnement payant';
COMMENT ON COLUMN public.profiles.subscription_ends_at IS 'Date de fin/renouvellement de l''abonnement';

-- ============================================
-- ÉTAPE 4 : Créer une fonction pour vérifier le statut de l'abonnement
-- ============================================

-- Fonction qui calcule le statut effectif de l'abonnement
-- Retourne 'active' si abonnement actif, 'trial' si essai en cours, 'expired' si essai terminé
CREATE OR REPLACE FUNCTION get_effective_subscription_status(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_status TEXT;
    v_trial_started TIMESTAMPTZ;
    v_trial_days INTEGER := 7;
BEGIN
    SELECT subscription_status, trial_started_at
    INTO v_status, v_trial_started
    FROM public.profiles
    WHERE user_id = p_user_id;
    
    -- Si pas de profil trouvé, retourner 'expired'
    IF v_status IS NULL THEN
        RETURN 'expired';
    END IF;
    
    -- Si abonnement actif, retourner 'active'
    IF v_status = 'active' THEN
        RETURN 'active';
    END IF;
    
    -- Si en trial, vérifier si le trial n'est pas expiré
    IF v_status = 'trial' THEN
        IF v_trial_started IS NULL THEN
            RETURN 'expired';
        END IF;
        
        -- Vérifier si le trial est encore valide (7 jours)
        IF NOW() < (v_trial_started + (v_trial_days || ' days')::INTERVAL) THEN
            RETURN 'trial';
        ELSE
            -- Trial expiré, mettre à jour le statut
            UPDATE public.profiles 
            SET subscription_status = 'expired'
            WHERE user_id = p_user_id;
            RETURN 'expired';
        END IF;
    END IF;
    
    -- Par défaut, retourner le statut actuel
    RETURN COALESCE(v_status, 'expired');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ÉTAPE 5 : Accorder les permissions
-- ============================================
GRANT EXECUTE ON FUNCTION get_effective_subscription_status(UUID) TO authenticated;

DO $$ 
BEGIN
    RAISE NOTICE '✓ Migration subscription/trial terminée avec succès';
END $$;
