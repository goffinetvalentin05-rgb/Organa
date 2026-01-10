-- ============================================
-- MIGRATION : Correction RLS pour table clients
-- ============================================
-- 
-- Objectif : Aligner les policies RLS avec le code qui utilise user_id
-- Le code utilise user_id directement (comme pour documents)
-- Il faut soit ajouter user_id si manquant, soit mettre à jour les policies
-- ============================================

DO $$
BEGIN
  -- ============================================
  -- ÉTAPE 1 : Ajouter la colonne user_id si elle n'existe pas
  -- ============================================
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'clients' 
    AND column_name = 'user_id'
  ) THEN
    -- Vérifier si organization_id existe
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'clients' 
      AND column_name = 'organization_id'
    ) THEN
      -- Ajouter user_id et copier depuis organizations
      ALTER TABLE public.clients 
      ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
      
      -- Remplir user_id depuis organizations (si organizations existe)
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
        UPDATE public.clients c
        SET user_id = o.user_id
        FROM public.organizations o
        WHERE c.organization_id = o.id
        AND c.user_id IS NULL;
        
        RAISE NOTICE '✓ Colonne user_id ajoutée et remplie depuis organizations';
      ELSE
        RAISE NOTICE '✓ Colonne user_id ajoutée (organizations table n''existe pas)';
      END IF;
      
      -- Créer index
      CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
    ELSE
      -- Si organization_id n'existe pas, créer user_id directement
      ALTER TABLE public.clients 
      ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
      
      CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
      
      RAISE NOTICE '✓ Colonne user_id ajoutée (structure directe)';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ Colonne user_id existe déjà';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 2 : Supprimer les anciennes policies basées sur organization_id
-- ============================================
DROP POLICY IF EXISTS "Users can view clients from their organization" ON public.clients;
DROP POLICY IF EXISTS "Users can insert clients in their organization" ON public.clients;
DROP POLICY IF EXISTS "Users can update clients in their organization" ON public.clients;
DROP POLICY IF EXISTS "Users can delete clients in their organization" ON public.clients;

-- ============================================
-- ÉTAPE 3 : Créer les nouvelles policies basées sur user_id
-- ============================================

-- Policy SELECT : l'utilisateur peut voir ses propres clients
CREATE POLICY "Users can view their own clients"
  ON public.clients FOR SELECT
  USING (auth.uid() = user_id);

-- Policy INSERT : l'utilisateur peut créer ses propres clients
CREATE POLICY "Users can insert their own clients"
  ON public.clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy UPDATE : l'utilisateur peut modifier ses propres clients
CREATE POLICY "Users can update their own clients"
  ON public.clients FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy DELETE : l'utilisateur peut supprimer ses propres clients
CREATE POLICY "Users can delete their own clients"
  ON public.clients FOR DELETE
  USING (auth.uid() = user_id);

