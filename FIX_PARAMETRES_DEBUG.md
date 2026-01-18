# Correction du bug de chargement des paramètres

## Problème résolu

La page `/tableau-de-bord/parametres` affichait "Erreur lors du chargement des paramètres" sans détails.

## Corrections apportées

### 1. Amélioration du debugging dans la page (`app/tableau-de-bord/parametres/page.tsx`)

- ✅ Logs détaillés avec status, statusText, error et details
- ✅ Affichage d'un message d'erreur utile à l'écran : "Erreur (status XXX): <message>"
- ✅ Gestion du 401 avec redirection automatique vers `/connexion`
- ✅ Toast d'erreur avec détails complets

### 2. Amélioration de l'API `/api/settings` (`app/api/settings/route.ts`)

- ✅ Création automatique du profil si inexistant (évite les erreurs PGRST116)
- ✅ Logs détaillés avec code d'erreur, message, details et hint
- ✅ Gestion robuste des erreurs avec messages clairs

### 3. Amélioration de l'API `/api/upload/logo` (`app/api/upload/logo/route.ts`)

- ✅ Création automatique du profil si inexistant lors de l'upload
- ✅ Gestion du cas où le profil n'existe pas lors de la suppression

### 4. Migration SQL

La migration `supabase/migrations/add_entreprise_settings_to_user_profiles.sql` est prête et ajoute toutes les colonnes nécessaires :
- `nom_entreprise`, `adresse`, `email`, `telephone`
- `logo_path` (pour le chemin dans Supabase Storage)
- `style_en_tete`, `email_expediteur`, `nom_expediteur`, `resend_api_key`
- `iban`, `bank_name`, `conditions_paiement`

## Configuration Supabase requise

### 1. Exécuter la migration SQL

```bash
# Via Supabase CLI
supabase migration up

# Ou directement dans le SQL Editor du dashboard Supabase
# Copier-coller le contenu de :
# supabase/migrations/add_entreprise_settings_to_user_profiles.sql
```

### 2. Créer le bucket Storage "logos"

**Étapes dans le dashboard Supabase :**

1. **Aller dans Storage**
   - Dans le menu de gauche, cliquer sur **"Storage"** (icône dossier)

2. **Créer un nouveau bucket**
   - Cliquer sur le bouton **"New bucket"** (en haut à droite)
   - **Nom du bucket** : `logos`
   - **Public bucket** : ✅ **COCHER** (recommandé pour un accès direct)
   - Cliquer sur **"Create bucket"**

3. **Configurer les politiques RLS (Row Level Security)**

   Dans le SQL Editor, exécuter :

   ```sql
   -- Permettre la lecture publique (si bucket public)
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

   **Note** : Si vous préférez un bucket privé, vous devrez modifier le code pour utiliser des URLs signées au lieu de `getPublicUrl()`.

## Structure des fichiers dans Storage

Les logos sont stockés avec la structure suivante :
```
logos/
  └── {userId}/
      └── {uuid}.{extension}
```

Exemple : `logos/123e4567-e89b-12d3-a456-426614174000/550e8400-e29b-41d4-a716-446655440000.png`

## Flux de données corrigé

### Chargement de la page
1. `loadSettings()` appelle `/api/settings` (GET)
2. Si 401 → Redirection vers `/connexion`
3. Si profil inexistant → Création automatique
4. Si erreur → Logs détaillés + message d'erreur affiché
5. Chargement des paramètres + URL du logo

### Upload du logo
1. Upload dans Supabase Storage (bucket: "logos")
2. Sauvegarde de `logo_path` dans `user_profiles`
3. Suppression de l'ancien logo
4. Retour de l'URL publique du logo

### Sauvegarde des paramètres
1. Validation des champs requis
2. Création du profil si inexistant
3. Mise à jour des paramètres
4. Retour des paramètres mis à jour avec URL du logo

## Debugging

### Logs dans la console

Les logs sont maintenant préfixés avec `[PARAMETRES]`, `[SETTINGS]`, `[UPLOAD]`, `[DELETE]` pour faciliter le debugging.

Exemple de log d'erreur :
```javascript
[PARAMETRES] Erreur chargement settings: {
  status: 500,
  statusText: "Internal Server Error",
  error: "Erreur lors de la récupération des paramètres",
  details: "relation \"user_profiles\" does not exist",
  url: "/api/settings"
}
```

### Messages d'erreur affichés

- **401** : "Veuillez vous reconnecter" + redirection automatique
- **500** : "Erreur (500): <message> - <details>"
- **Autres** : "Erreur (XXX): <message>"

## Tests recommandés

1. ✅ Charger la page sans être connecté → Doit rediriger vers `/connexion`
2. ✅ Charger la page connecté (première fois) → Doit créer le profil automatiquement
3. ✅ Upload d'un logo → Doit fonctionner et persister après refresh
4. ✅ Sauvegarder les paramètres → Doit persister après refresh
5. ✅ Vérifier les logs dans la console pour les erreurs

## Dépannage

### Erreur "relation user_profiles does not exist"
→ Exécuter la migration `add_plan_to_users.sql` d'abord, puis `add_entreprise_settings_to_user_profiles.sql`

### Erreur "column nom_entreprise does not exist"
→ Exécuter la migration `add_entreprise_settings_to_user_profiles.sql`

### Erreur 401 "Non authentifié"
→ Vérifier que l'utilisateur est bien connecté, les cookies de session sont présents

### Le logo ne s'affiche pas
→ Vérifier que :
- Le bucket "logos" existe dans Supabase Storage
- Les politiques RLS sont configurées
- `logo_path` est bien sauvegardé dans `user_profiles`
- L'URL publique est correctement générée

### Erreur lors de l'upload
→ Vérifier :
- Les politiques RLS (INSERT doit être autorisé)
- Le bucket existe
- Les logs Supabase pour plus de détails
























