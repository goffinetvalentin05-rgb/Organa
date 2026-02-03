# Migration complète : user_profiles → profiles

## Résumé des changements

Tous les usages de `public.user_profiles` ont été remplacés par `public.profiles` avec les nouvelles colonnes `company_*`.

## Fichiers modifiés

### API Routes
- ✅ `app/api/settings/route.ts`
  - GET : Retourne `{ settings: { company_name, company_email, company_phone, company_address, logo_path, logo_url } }`
  - PUT : Met à jour les colonnes `company_*` et `logo_path`
  - Utilise `maybeSingle()` pour gérer les profils inexistants

- ✅ `app/api/upload/logo/route.ts`
  - Utilise `profiles` au lieu de `user_profiles`
  - Sauvegarde `logo_path` dans `profiles`

- ✅ `app/api/webhooks/stripe/route.ts`
  - Utilise `profiles` pour les mises à jour de plan Stripe

### Utilitaires
- ✅ `lib/billing/getPlan.ts`
  - Utilise `profiles` au lieu de `user_profiles`
  - Utilise `maybeSingle()` pour gérer les profils inexistants

### Frontend
- ✅ `app/tableau-de-bord/parametres/page.tsx`
  - Charge les paramètres depuis `/api/settings` (GET)
  - Sauvegarde via `/api/settings` (PUT)
  - Utilise les colonnes `company_*` et `logo_url`
  - Le logo est chargé depuis `logo_url` retourné par l'API (persiste après refresh)

### Migration SQL
- ✅ `supabase/migrations/add_company_fields_to_profiles.sql`
  - Ajoute les colonnes : `company_name`, `company_email`, `company_phone`, `company_address`, `logo_path`

## Structure de la table `profiles`

```sql
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  stripe_customer_id TEXT NULL,
  stripe_subscription_id TEXT NULL,
  company_name TEXT NULL,
  company_email TEXT NULL,
  company_phone TEXT NULL,
  company_address TEXT NULL,
  logo_path TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Configuration requise

### 1. Exécuter la migration SQL

```bash
# Via Supabase CLI
supabase migration up

# Ou directement dans le SQL Editor du dashboard Supabase
# Copier-coller le contenu de :
# supabase/migrations/add_company_fields_to_profiles.sql
```

### 2. Créer le bucket Storage "logos"

**Étapes dans le dashboard Supabase :**

1. **Aller dans Storage**
   - Dans le menu de gauche du dashboard Supabase, cliquer sur **"Storage"** (icône dossier)

2. **Créer un nouveau bucket**
   - Cliquer sur le bouton **"New bucket"** (en haut à droite)
   - **Nom du bucket** : `logos`
   - **Public bucket** : ✅ **COCHER** (recommandé pour un accès direct via URL publique)
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

## Flux de données

### Chargement de la page paramètres
1. `loadSettings()` appelle `GET /api/settings`
2. L'API récupère depuis `profiles` où `user_id = user.id`
3. Si le profil n'existe pas, il est créé avec `plan = 'free'`
4. L'API construit `logo_url` depuis `logo_path` via `getPublicUrl()`
5. Retourne `{ settings: { company_name, company_email, company_phone, company_address, logo_path, logo_url } }`
6. Le frontend affiche les données et le logo depuis `logo_url`

### Sauvegarde des paramètres
1. `handleSubmit()` appelle `PUT /api/settings` avec `{ company_name, company_email, company_phone, company_address }`
2. L'API met à jour `profiles` où `user_id = user.id`
3. Si le profil n'existe pas, il est créé
4. Retourne les paramètres mis à jour avec `logo_url`

### Upload du logo
1. `handleLogoUpload()` appelle `POST /api/upload/logo`
2. L'API upload le fichier dans Supabase Storage (bucket: "logos")
3. Sauvegarde `logo_path` dans `profiles.logo_path`
4. Retourne `{ logoPath, logoUrl }`
5. Le frontend met à jour `logoPreview` avec `logoUrl`
6. Recharge les paramètres depuis l'API pour avoir `logo_url` persistant

## Points importants

1. ✅ **Plus d'erreur 500** : La table `profiles` existe et est utilisée partout
2. ✅ **Logo persistant** : Le logo est stocké dans Supabase Storage et `logo_path` en DB
3. ✅ **URL publique** : Le logo est accessible via `logo_url` qui ne change pas
4. ✅ **Auto-création** : Le profil est créé automatiquement s'il n'existe pas
5. ✅ **Cohérence** : Tous les fichiers utilisent maintenant `profiles` au lieu de `user_profiles`

## Tests recommandés

1. ✅ Charger la page paramètres → Doit fonctionner sans erreur 500
2. ✅ Sauvegarder les paramètres → Doit persister après refresh
3. ✅ Upload d'un logo → Doit s'afficher et persister après refresh
4. ✅ Supprimer le logo → Doit disparaître et ne pas réapparaître après refresh
5. ✅ Vérifier que le plan Stripe fonctionne toujours (webhooks)

## Dépannage

### Erreur "relation profiles does not exist"
→ Vérifier que la table `profiles` existe (créée par `add_plan_to_users.sql`)

### Erreur "column company_name does not exist"
→ Exécuter la migration `add_company_fields_to_profiles.sql`

### Le logo ne s'affiche pas après refresh
→ Vérifier que :
- Le bucket "logos" existe dans Supabase Storage
- Les politiques RLS sont configurées
- `logo_path` est bien sauvegardé dans `profiles`
- L'API retourne bien `logo_url` dans la réponse

### Erreur 401 "Non authentifié"
→ Vérifier que l'utilisateur est bien connecté, les cookies de session sont présents
































