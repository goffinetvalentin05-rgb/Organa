# Migration : Fix des colonnes de la table profiles

## Problème

L'erreur suivante se produit lors de la sauvegarde des paramètres :
```
Could not find the 'currency' column of 'profiles' in the schema cache
```

Cela indique que les colonnes nécessaires (`currency`, `primary_color`, etc.) n'existent pas dans la table `profiles`.

## Solution

Exécuter la migration `fix_profiles_company_settings.sql` qui :
1. Vérifie l'existence de chaque colonne
2. Ajoute les colonnes manquantes uniquement
3. Définit les valeurs par défaut appropriées

## Colonnes ajoutées

- `company_name` (TEXT) - Nom de l'entreprise
- `company_email` (TEXT) - Email de l'entreprise  
- `company_phone` (TEXT) - Téléphone de l'entreprise
- `company_address` (TEXT) - Adresse de l'entreprise
- `primary_color` (TEXT, default: '#6D5EF8') - Couleur principale
- `currency` (TEXT, default: 'CHF') - Devise de facturation
- `currency_symbol` (TEXT) - Symbole de devise

## Comment appliquer

### Via Supabase Dashboard

1. Aller dans **SQL Editor**
2. Copier le contenu de `fix_profiles_company_settings.sql`
3. Exécuter la requête

### Via CLI Supabase

```bash
supabase migration up
```

### Vérification

Après avoir exécuté la migration, vérifier que les colonnes existent :

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name IN ('company_name', 'company_email', 'company_phone', 'company_address', 'primary_color', 'currency', 'currency_symbol');
```

## Notes

- Cette migration utilise `DO $$ ... END $$` pour vérifier l'existence avant d'ajouter
- Elle est **idempotente** : peut être exécutée plusieurs fois sans erreur
- Les valeurs par défaut sont appliquées uniquement à `primary_color` et `currency`























