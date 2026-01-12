-- Migration: Ajouter les policies RLS pour la table profiles
-- Date: 2025-01-XX
-- Objectif: Permettre aux utilisateurs de lire et modifier uniquement leur propre profil

-- ============================================
-- ÉTAPE 1 : Activer RLS sur la table profiles
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ÉTAPE 2 : Supprimer les anciennes policies si elles existent (pour éviter les doublons)
-- ============================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

-- ============================================
-- ÉTAPE 3 : Créer les policies RLS
-- ============================================

-- Policy SELECT : Les utilisateurs peuvent voir uniquement leur propre profil
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Policy INSERT : Les utilisateurs peuvent créer uniquement leur propre profil
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy UPDATE : Les utilisateurs peuvent modifier uniquement leur propre profil
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy DELETE : Les utilisateurs peuvent supprimer uniquement leur propre profil
CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- ÉTAPE 4 : Commentaires pour documentation
-- ============================================
COMMENT ON POLICY "Users can view their own profile" ON public.profiles IS 
  'Permet aux utilisateurs de lire uniquement leur propre profil (user_id = auth.uid())';

COMMENT ON POLICY "Users can insert their own profile" ON public.profiles IS 
  'Permet aux utilisateurs de créer uniquement leur propre profil (user_id = auth.uid())';

COMMENT ON POLICY "Users can update their own profile" ON public.profiles IS 
  'Permet aux utilisateurs de modifier uniquement leur propre profil (user_id = auth.uid())';

COMMENT ON POLICY "Users can delete their own profile" ON public.profiles IS 
  'Permet aux utilisateurs de supprimer uniquement leur propre profil (user_id = auth.uid())';

