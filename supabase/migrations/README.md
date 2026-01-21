# Migrations Supabase

## Migration des colonnes clients

### Problème
L'erreur `column clients.nom does not exist` indique que la table `clients` utilise encore les colonnes anglaises (`name`, `phone`, `address`) au lieu des colonnes françaises (`nom`, `telephone`, `adresse`).

### Solution
Exécuter le script de migration SQL pour renommer les colonnes.

## Instructions

### 1. Accéder à l'éditeur SQL de Supabase

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Cliquer sur "SQL Editor" dans le menu de gauche
4. Cliquer sur "New query"

### 2. Exécuter la migration

1. Ouvrir le fichier `supabase/migrations/001_rename_clients_columns.sql`
2. Copier tout le contenu
3. Coller dans l'éditeur SQL de Supabase
4. Cliquer sur "Run" ou appuyer sur `Ctrl+Enter`

### 3. Vérifier le résultat

Le script affichera :
- Les messages de confirmation pour chaque colonne renommée
- Le schéma final de la table `clients`

### 4. Vérifier les colonnes attendues

Après la migration, la table `clients` doit avoir ces colonnes :
- ✅ `id` (uuid)
- ✅ `nom` (text/varchar) - **OBLIGATOIRE**
- ✅ `email` (text/varchar)
- ✅ `telephone` (text/varchar) - **OBLIGATOIRE**
- ✅ `adresse` (text/varchar) - **OBLIGATOIRE**
- ✅ `user_id` (uuid)
- ✅ `created_at` (timestamp)
- ✅ `updated_at` (timestamp)

### 5. Tester l'application

Après la migration :
1. Redémarrer l'application Next.js si nécessaire
2. Tester la création d'un client
3. Tester la modification d'un client
4. Tester la liste des clients

## En cas d'erreur

Si le script échoue :
1. Vérifier les messages d'erreur dans l'éditeur SQL
2. Vérifier que vous avez les droits d'administration sur la base
3. Vérifier que la table `clients` existe

## Notes importantes

- ⚠️ **Sauvegarde** : Faire une sauvegarde de la base avant la migration (recommandé)
- ⚠️ **Downtime** : La migration est rapide mais peut bloquer brièvement les écritures
- ✅ **Réversible** : Le script peut être inversé en renommant les colonnes dans l'autre sens































