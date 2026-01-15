# Référence du schéma public.profiles

## Colonnes utilisées dans le code

### Colonnes de base (toujours présentes)
- `user_id` (UUID, PK, REFERENCES auth.users)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- `plan` (TEXT, DEFAULT 'free')

### Colonnes entreprise
- `company_name` (TEXT)
- `company_email` (TEXT)
- `company_phone` (TEXT)
- `company_address` (TEXT)

### Colonnes logo
- `logo_path` (TEXT) - Lecture seule via API settings
- `logo_url` (TEXT) - Écriture possible via API settings

### Colonnes marque
- `primary_color` (TEXT, DEFAULT '#6D5EF8')
- `currency` (TEXT, DEFAULT 'CHF')
- `currency_symbol` (TEXT) - Calculé automatiquement, lecture seule

### Colonnes bancaires
- `iban` (TEXT)
- `bank_name` (TEXT)
- `payment_terms` (TEXT) - Anciennement conditions_paiement

### Colonnes email
- `email_sender_name` (TEXT) - Anciennement nom_expediteur
- `email_sender_email` (TEXT) - Anciennement email_expediteur
- `resend_api_key` (TEXT)

## Colonnes NON utilisées dans settings API
- `stripe_customer_id` (géré par webhooks)
- `stripe_subscription_id` (géré par webhooks)

## Vérification
Tous les SELECT dans app/api/settings/route.ts doivent utiliser UNIQUEMENT ces colonnes.





