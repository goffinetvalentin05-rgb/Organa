-- Retire les policies du bucket expenses créées hors dépôt.
-- Elles sont permissives : un utilisateur authenticated peut lire ou ajouter
-- n'importe quel objet du bucket, y compris {club}/accounting/.
-- DROP POLICY avec le nom affiché peut ne rien retirer. On retire donc
-- toute policy storage.objects dont la règle contient auth.role()
-- sans storage_path_club_id.
-- Les policies de la migration 108 restent en place.
-- Aucun fichier n'est déplacé ni supprimé.
-- Le rôle de l'éditeur SQL ne peut pas prendre supabase_storage_admin.
-- Le DROP s'exécute avec le rôle courant.

DROP POLICY IF EXISTS "expenses1301vyz" ON storage.objects;
DROP POLICY IF EXISTS "expenses1301vyz_1" ON storage.objects;

DO $$
DECLARE
  noms name[];
  nom name;
BEGIN
  SELECT array_agg(p.polname)
  INTO noms
  FROM pg_policy p
  JOIN pg_class c ON c.oid = p.polrelid
  JOIN pg_namespace ns ON ns.oid = c.relnamespace
  WHERE ns.nspname = 'storage'
    AND c.relname = 'objects'
    AND (
      COALESCE(pg_get_expr(p.polqual, p.polrelid), '') ILIKE '%auth.role()%'
      OR COALESCE(pg_get_expr(p.polwithcheck, p.polrelid), '') ILIKE '%auth.role()%'
    )
    AND COALESCE(pg_get_expr(p.polqual, p.polrelid), '') NOT ILIKE '%storage_path_club_id%'
    AND COALESCE(pg_get_expr(p.polwithcheck, p.polrelid), '') NOT ILIKE '%storage_path_club_id%';

  IF noms IS NULL THEN
    RETURN;
  END IF;

  FOREACH nom IN ARRAY noms LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', nom);
  END LOOP;
END $$;
