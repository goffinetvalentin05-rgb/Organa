# Correction définitive : Création devis/factures + Preview PDF

## Résumé des modifications

### 1. Migration SQL créée
- **Fichier** : `supabase/migrations/002_create_documents_table.sql`
- **Objectif** : Créer la table `public.documents` avec toutes les colonnes nécessaires
- **Caractéristiques** :
  - Migration idempotente (peut être exécutée plusieurs fois sans erreur)
  - Création de la table si elle n'existe pas
  - Ajout des colonnes manquantes si la table existe déjà
  - RLS activé avec policies minimales
  - Trigger pour `updated_at`

### 2. API corrigée
- **Fichier** : `app/api/documents/route.ts`
- **Corrections** :
  - Ne jamais envoyer `date_echeance` si vide/undefined (laisser le default de la DB)
  - Ne jamais envoyer `date_paiement` si vide/undefined
  - Ne jamais envoyer `notes` si vide/undefined
  - Logs améliorés avec `status`, `code`, `message`, `details`, `hint`

### 3. Frontend corrigé
- **Fichiers** :
  - `app/tableau-de-bord/devis/nouveau/page.tsx`
  - `app/tableau-de-bord/factures/nouvelle/page.tsx`
- **Corrections** :
  - Ne plus envoyer de champs `undefined` dans le payload
  - Utilisation de spread operator conditionnel : `...(dateEcheance ? { dateEcheance } : {})`
  - Pour les PATCH, envoi explicite de `null` pour supprimer les valeurs

### 4. API PDF améliorée
- **Fichier** : `app/api/documents/[id]/pdf/route.ts`
- **Corrections** :
  - Logs améliorés pour toutes les erreurs
  - Messages d'erreur plus clairs avec détails
  - Utilisation correcte de `logo_url` depuis `public.profiles`
  - Gestion des URLs Supabase Storage pour les logos

### 5. Endpoint de debug créé
- **Fichier** : `app/api/debug/schema/route.ts`
- **Objectif** : Permettre de vérifier rapidement le schéma de la base de données
- **Endpoint** : `GET /api/debug/schema`
- **Retourne** : Informations sur les tables existantes et les colonnes de `documents`

---

## SQL à exécuter dans Supabase UI

1. **Ouvrir l'éditeur SQL de Supabase** :
   - URL : https://supabase.com/dashboard/project/_/sql

2. **Copier-coller le contenu complet de** :
   ```
   supabase/migrations/002_create_documents_table.sql
   ```

3. **Exécuter le script**

4. **Vérifier le résultat** :
   - Le script affiche les colonnes de la table `documents` à la fin
   - Aucune erreur ne doit apparaître
   - Les messages `✓ Colonne ... ajoutée` indiquent les colonnes créées

---

## Commandes de test

### 1. Tester la création d'un devis
```bash
# Démarrer le serveur de développement
npm run dev

# Ouvrir dans le navigateur
http://localhost:3000/tableau-de-bord/devis/nouveau
```

**Actions** :
1. Sélectionner un client
2. Ajouter des lignes (désignation, quantité, prix, TVA)
3. Optionnellement remplir date d'échéance et notes
4. Cliquer sur "Créer le devis"
5. Vérifier dans les logs serveur qu'il n'y a pas d'erreur

### 2. Tester le preview PDF d'un devis
```bash
# Sur la page /tableau-de-bord/devis/nouveau
```

**Actions** :
1. Remplir le formulaire
2. Cliquer sur "👁️ Prévisualiser PDF"
3. Le PDF doit s'ouvrir dans un nouvel onglet
4. Vérifier que toutes les données sont présentes (client, lignes, totaux, logo)

### 3. Tester la création d'une facture
```bash
# Ouvrir dans le navigateur
http://localhost:3000/tableau-de-bord/factures/nouvelle
```

**Actions** : Identique au devis, avec en plus la possibilité de remplir date de paiement

### 4. Tester l'endpoint de debug
```bash
# En étant authentifié, ouvrir dans le navigateur
http://localhost:3000/api/debug/schema
```

**Résultat attendu** :
```json
{
  "authenticated": true,
  "user_id": "...",
  "tables_check": {
    "documents": {
      "exists": true,
      "error": null
    },
    "clients": {
      "exists": true,
      "error": null
    },
    "profiles": {
      "exists": true,
      "error": null
    }
  },
  "documents_columns": [
    "id",
    "user_id",
    "type",
    "client_id",
    "date_creation",
    "date_echeance",
    ...
  ]
}
```

---

## Fichiers modifiés

1. ✅ `supabase/migrations/002_create_documents_table.sql` (NOUVEAU)
2. ✅ `app/api/documents/route.ts` (MODIFIÉ)
3. ✅ `app/api/documents/[id]/pdf/route.ts` (MODIFIÉ)
4. ✅ `app/tableau-de-bord/devis/nouveau/page.tsx` (MODIFIÉ)
5. ✅ `app/tableau-de-bord/factures/nouvelle/page.tsx` (MODIFIÉ)
6. ✅ `app/api/debug/schema/route.ts` (NOUVEAU)

---

## Structure de la table `public.documents`

### Colonnes
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, NOT NULL, → auth.users)
- `type` (TEXT, NOT NULL, CHECK: 'quote' ou 'invoice')
- `client_id` (UUID, NULL, → public.clients)
- `date_creation` (DATE, NOT NULL, DEFAULT: CURRENT_DATE)
- `date_echeance` (DATE, NULL)
- `date_paiement` (DATE, NULL)
- `items` (JSONB, NOT NULL, DEFAULT: '[]')
- `total_ht` (NUMERIC(10,2), NOT NULL, DEFAULT: 0)
- `total_tva` (NUMERIC(10,2), NOT NULL, DEFAULT: 0)
- `total_ttc` (NUMERIC(10,2), NOT NULL, DEFAULT: 0)
- `status` (TEXT, NULL)
- `notes` (TEXT, NULL)
- `numero` (TEXT, NULL)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT: NOW())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT: NOW())

### Index
- `idx_documents_user_id` sur `user_id`
- `idx_documents_client_id` sur `client_id`
- `idx_documents_type` sur `type`
- `idx_documents_created_at` sur `created_at`

### RLS Policies
- `Users can view their own documents` (SELECT)
- `Users can insert their own documents` (INSERT)
- `Users can update their own documents` (UPDATE)
- `Users can delete their own documents` (DELETE)

---

## Vérifications post-migration

1. ✅ La table `public.documents` existe
2. ✅ Toutes les colonnes requises sont présentes
3. ✅ RLS est activé
4. ✅ Les policies RLS sont créées
5. ✅ Le trigger `updated_at` fonctionne
6. ✅ Aucune erreur "Could not find the column" dans les logs
7. ✅ La création de devis/facture fonctionne
8. ✅ Le preview PDF fonctionne

---

## Notes importantes

- **Migration idempotente** : Le script peut être exécuté plusieurs fois sans problème
- **Pas de breaking changes** : Les tables `clients` et `profiles` ne sont pas modifiées
- **RLS actif** : Tous les accès passent par les policies RLS
- **Type strict TypeScript** : Tous les fichiers respectent le strict mode

---

## Troubleshooting

### Erreur "Could not find the 'date_creation' column"
**Solution** : Exécuter la migration SQL dans Supabase UI

### Erreur "relation documents does not exist"
**Solution** : La migration n'a pas été exécutée, exécuter `002_create_documents_table.sql`

### Erreur "Document introuvable" dans le PDF
**Solution** : 
1. Vérifier que le document a bien été créé (logs serveur)
2. Vérifier que `user_id` correspond à l'utilisateur authentifié
3. Vérifier les policies RLS
4. Utiliser `/api/debug/schema` pour vérifier le schéma

### Erreur de cache Supabase
**Solution** : 
- Attendre quelques secondes après la migration
- Rafraîchir le cache dans Supabase Dashboard si disponible
- Redémarrer le serveur Next.js































