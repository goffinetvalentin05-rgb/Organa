# Configuration de la persistance du logo d'entreprise

## Résumé des modifications

Le système de logo d'entreprise a été migré de données mock (en mémoire) vers Supabase Storage et la base de données Supabase pour assurer la persistance.

## Fichiers modifiés/créés

### Migrations SQL
- `supabase/migrations/add_entreprise_settings_to_user_profiles.sql`
  - Ajoute les colonnes de paramètres entreprise à la table `user_profiles`
  - Colonnes ajoutées : `nom_entreprise`, `adresse`, `email`, `telephone`, `logo_path`, `style_en_tete`, `email_expediteur`, `nom_expediteur`, `resend_api_key`, `iban`, `bank_name`, `conditions_paiement`

### API Routes
- `app/api/upload/logo/route.ts` (modifié)
  - Upload le logo dans Supabase Storage (bucket: "logos")
  - Sauvegarde le `logo_path` dans `user_profiles`
  - Supprime automatiquement l'ancien logo lors d'un nouvel upload
  - Utilise `crypto.randomUUID()` pour générer des noms de fichiers uniques

- `app/api/settings/route.ts` (nouveau)
  - GET : Récupère les paramètres depuis `user_profiles`
  - POST : Sauvegarde les paramètres dans `user_profiles`
  - Gère la construction de l'URL du logo depuis Supabase Storage

### Pages
- `app/tableau-de-bord/parametres/page.tsx` (modifié)
  - Charge les paramètres depuis `/api/settings` au lieu de `mock-data`
  - Sauvegarde via `/api/settings` au lieu de `mock-data`
  - Affiche le logo depuis l'URL retournée par l'API

## Configuration Supabase requise

### 1. Créer le bucket Storage "logos"

Dans le dashboard Supabase :
1. Aller dans **Storage**
2. Cliquer sur **New bucket**
3. Nom : `logos`
4. **Public bucket** : 
   - ✅ **Recommandé** : Cocher "Public bucket" pour un accès direct via URL publique
   - ❌ **Alternative** : Laisser privé et utiliser des URLs signées (nécessite modification du code)

### 2. Configurer les politiques RLS (Row Level Security) pour le bucket

Si le bucket est **public** :
```sql
-- Permettre la lecture publique
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

-- Permettre l'upload uniquement aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permettre la suppression uniquement aux utilisateurs authentifiés de leurs propres fichiers
CREATE POLICY "Users can delete their own logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

Si le bucket est **privé** :
- Les URLs signées seront nécessaires
- Modifier `app/api/settings/route.ts` pour utiliser `createSignedUrl()` au lieu de `getPublicUrl()`

### 3. Exécuter la migration SQL

```bash
# Via Supabase CLI
supabase migration up

# Ou directement dans le SQL Editor du dashboard Supabase
# Copier-coller le contenu de :
# supabase/migrations/add_entreprise_settings_to_user_profiles.sql
```

## Variables d'environnement

Les variables suivantes doivent être configurées dans `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Ces variables sont déjà utilisées par `lib/supabase/client.ts` et `lib/supabase/server.ts`.

## Structure des fichiers dans Storage

Les logos sont stockés avec la structure suivante :
```
logos/
  └── {userId}/
      └── {uuid}.{extension}
```

Exemple : `logos/123e4567-e89b-12d3-a456-426614174000/550e8400-e29b-41d4-a716-446655440000.png`

## Flux de données

### Upload du logo
1. L'utilisateur sélectionne un fichier dans l'UI
2. `handleLogoUpload()` appelle `/api/upload/logo` (POST)
3. L'API :
   - Vérifie l'authentification
   - Valide le fichier (type, taille)
   - Récupère l'ancien `logo_path` si existe
   - Upload le fichier dans Supabase Storage
   - Met à jour `user_profiles.logo_path`
   - Supprime l'ancien logo
   - Retourne l'URL publique du logo

### Chargement de la page
1. `useEffect` charge les paramètres via `/api/settings` (GET)
2. L'API récupère les données depuis `user_profiles`
3. Construit l'URL du logo depuis `logo_path` via `getPublicUrl()`
4. Retourne les paramètres avec l'URL du logo
5. La page affiche le logo depuis cette URL

### Sauvegarde des paramètres
1. L'utilisateur clique sur "Enregistrer"
2. `handleSubmit()` appelle `/api/settings` (POST)
3. L'API :
   - Valide les champs requis
   - Met à jour `user_profiles` avec les nouvelles valeurs
   - Retourne les paramètres mis à jour (incluant l'URL du logo)

## Notes importantes

1. **Nettoyage automatique** : L'ancien logo est automatiquement supprimé lors d'un nouvel upload pour éviter l'accumulation de fichiers.

2. **URLs publiques vs signées** :
   - Si le bucket est public : URLs publiques (ne expirent pas)
   - Si le bucket est privé : URLs signées (expirent après un certain temps, nécessite modification du code)

3. **Sécurité** : Les politiques RLS garantissent que :
   - Les utilisateurs ne peuvent uploader que dans leur propre dossier (`{userId}/`)
   - Les utilisateurs ne peuvent supprimer que leurs propres logos
   - La lecture peut être publique ou restreinte selon votre choix

4. **Migration des données existantes** : Si vous avez des logos existants dans `public/uploads/logos/`, vous devrez :
   - Les uploader manuellement dans Supabase Storage
   - Mettre à jour les `logo_path` dans `user_profiles` pour pointer vers les nouveaux chemins

## Tests recommandés

1. ✅ Upload d'un logo → Vérifier qu'il apparaît immédiatement
2. ✅ Sauvegarder les paramètres → Vérifier que le logo persiste après refresh
3. ✅ Upload d'un nouveau logo → Vérifier que l'ancien est supprimé
4. ✅ Supprimer le logo → Vérifier qu'il disparaît et ne réapparaît pas après refresh
5. ✅ Tester avec différents formats (PNG, JPG, SVG)
6. ✅ Tester la validation (taille max 5MB, formats acceptés)

## Dépannage

### Le logo ne s'affiche pas après upload
- Vérifier que le bucket "logos" existe dans Supabase Storage
- Vérifier les politiques RLS du bucket
- Vérifier que `logo_path` est bien sauvegardé dans `user_profiles`
- Vérifier les logs de la console pour les erreurs

### Erreur "Non authentifié"
- Vérifier que l'utilisateur est bien connecté
- Vérifier que les cookies de session sont présents

### Erreur lors de l'upload
- Vérifier les politiques RLS (INSERT doit être autorisé)
- Vérifier que le bucket existe
- Vérifier les logs Supabase pour plus de détails
























