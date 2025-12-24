# Configuration Stripe - Instructions Complètes

## 📋 Étape 1 : Créer le fichier .env.local

1. **À la racine du projet**, créez un fichier nommé exactement `.env.local`
2. **Copiez le contenu suivant** dans ce fichier :

```env
# Clé secrète Stripe (OBLIGATOIRE - obtenez-la sur https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_REMPLACEZ_PAR_VOTRE_CLE_SECRETE_STRIPE

# Secret du webhook Stripe (OBLIGATOIRE pour les webhooks)
# Obtenez-le après avoir configuré un webhook dans Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_REMPLACEZ_PAR_VOTRE_WEBHOOK_SECRET

# Price ID pour le plan Pro (29 CHF / mois)
NEXT_PUBLIC_STRIPE_PRICE_PRO=price_1SgRipHvElMyrvJkrgMDLt2w

# URL de base de l'application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Clé service role Supabase (OBLIGATOIRE pour les webhooks)
# Obtenez-la dans Supabase Dashboard > Settings > API > service_role key
SUPABASE_SERVICE_ROLE_KEY=REMPLACEZ_PAR_VOTRE_SERVICE_ROLE_KEY
```

## 🔑 Étape 2 : Obtenir vos clés Stripe

### A. Clé secrète Stripe (STRIPE_SECRET_KEY)

1. Allez sur https://dashboard.stripe.com/apikeys
2. Connectez-vous à votre compte Stripe (ou créez-en un gratuitement)
3. Copiez votre **Clé secrète** (elle commence par `sk_test_...`)
4. Dans le fichier `.env.local`, remplacez `sk_test_REMPLACEZ_PAR_VOTRE_CLE_SECRETE_STRIPE` par votre vraie clé

**Exemple :**
```env
STRIPE_SECRET_KEY=sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```

### B. Secret du webhook Stripe (STRIPE_WEBHOOK_SECRET)

**Pour le développement local avec Stripe CLI :**

1. Installez Stripe CLI : https://stripe.com/docs/stripe-cli
2. Connectez-vous : `stripe login`
3. Écoutez les webhooks : `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
4. Copiez le **Webhook signing secret** affiché (il commence par `whsec_...`)
5. Dans `.env.local`, remplacez `whsec_REMPLACEZ_PAR_VOTRE_WEBHOOK_SECRET` par cette valeur

**Pour la production :**

1. Allez sur https://dashboard.stripe.com/webhooks
2. Cliquez sur **"Add endpoint"** (ou modifiez un endpoint existant)
3. Entrez l'URL : `https://votre-domaine.com/api/webhooks/stripe`
4. Sélectionnez les événements à écouter :
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Après la création, cliquez sur l'endpoint
6. Dans la section **"Signing secret"**, cliquez sur **"Reveal"** ou **"Reveal test key"**
7. Copiez le secret (il commence par `whsec_...`)
8. Dans `.env.local`, remplacez la valeur

## 🔐 Étape 3 : Obtenir la clé service role Supabase (SUPABASE_SERVICE_ROLE_KEY)

**IMPORTANT :** Cette clé est nécessaire pour que les webhooks puissent mettre à jour la base de données.

1. Allez sur votre projet Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Settings** > **API**
4. Dans la section **"Project API keys"**, trouvez **"service_role"** (⚠️ **secret**, ne l'exposez jamais au client)
5. Cliquez sur **"Reveal"** pour afficher la clé
6. Copiez la clé complète
7. Dans `.env.local`, remplacez `REMPLACEZ_PAR_VOTRE_SERVICE_ROLE_KEY` par cette valeur

⚠️ **SÉCURITÉ :** Cette clé permet de bypasser les Row Level Security (RLS). Ne la partagez JAMAIS et ne la commitez JAMAIS dans Git.

## ✅ Étape 4 : Vérifier votre fichier .env.local

Votre fichier `.env.local` doit contenir :

```env
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_ICI
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_WEBHOOK_SECRET_ICI
NEXT_PUBLIC_STRIPE_PRICE_PRO=price_1SgRipHvElMyrvJkrgMDLt2w
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key_ici
```

⚠️ **IMPORTANT :**
- Pas d'espaces autour du `=`
- Pas de guillemets autour des valeurs
- Pas de ligne vide entre les variables (sauf après les commentaires)

## 🗄️ Étape 5 : Appliquer la migration SQL Supabase

Pour que les webhooks fonctionnent, vous devez ajouter les colonnes Stripe à la table `user_profiles` :

1. Allez sur votre projet Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Créez une nouvelle query
5. Copiez et exécutez le contenu du fichier `supabase/migrations/add_stripe_fields_to_user_profiles.sql`

Cette migration ajoute :
- `stripe_customer_id` : pour stocker l'ID du customer Stripe
- `stripe_subscription_id` : pour stocker l'ID de l'abonnement Stripe
- Des index pour améliorer les performances

## 🚀 Étape 6 : Redémarrer le serveur Next.js

**OBLIGATOIRE** après avoir créé ou modifié `.env.local` :

1. Arrêtez le serveur (appuyez sur `Ctrl+C` dans le terminal)
2. Redémarrez-le avec : `npm run dev`

## 🧪 Étape 7 : Tester en local (avec Stripe CLI)

### A. Démarrer le serveur Next.js

```bash
npm run dev
```

### B. Démarrer Stripe CLI pour écouter les webhooks

Dans un **nouveau terminal**, lancez :

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Stripe CLI affichera un **Webhook signing secret** (whsec_...). Assurez-vous qu'il est dans votre `.env.local`.

### C. Tester le paiement

1. Ouvrez votre application : http://localhost:3000
2. Connectez-vous à votre compte
3. Allez dans **Paramètres**
4. Cliquez sur **"Passer à Pro"**
5. Utilisez la carte de test : `4242 4242 4242 4242`
6. Complétez le paiement
7. Vérifiez les logs :
   - **Terminal Next.js** : vous devriez voir `[WEBHOOK][stripe] checkout.session.completed`
   - **Terminal Stripe CLI** : vous devriez voir les événements reçus
   - **Base de données** : l'utilisateur doit avoir `plan = "pro"`

## 📋 Étape 8 : Vérifier que tout fonctionne

1. Ouvrez votre application dans le navigateur
2. Connectez-vous à votre compte
3. Allez dans **Paramètres**
4. Cliquez sur **"Passer à Pro"**
5. Vous devriez être redirigé vers Stripe Checkout

## 🔍 En cas d'erreur

Si vous voyez une erreur `ENV_MISSING` :

1. **Vérifiez les logs du serveur** (dans le terminal où vous avez lancé `npm run dev`)
2. Les logs indiquent exactement quelle variable manque
3. Vérifiez que votre fichier `.env.local` est bien à la racine du projet
4. Vérifiez que vous avez **redémarré le serveur** après modification de `.env.local`

## 📝 Fichier .env.local complet (exemple)

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnopqrstuvwxyz
NEXT_PUBLIC_STRIPE_PRICE_PRO=price_1SgRipHvElMyrvJkrgMDLt2w
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key_secret
```

## 🎯 Résultat attendu

Après configuration complète :

1. ✅ Le bouton "Passer à Pro" ouvre Stripe Checkout
2. ✅ Après paiement, le webhook met automatiquement `plan = "pro"` dans la base
3. ✅ Si l'abonnement est annulé, le plan repasse automatiquement à `"free"`
4. ✅ Si le paiement échoue, le plan repasse à `"free"`
5. ✅ Les IDs Stripe (customer_id, subscription_id) sont sauvegardés dans la base

## ⚠️ Sécurité

- Le fichier `.env.local` est dans `.gitignore` et ne sera **jamais** commité dans Git
- Ne partagez **jamais** votre `STRIPE_SECRET_KEY`
- En production, configurez les variables d'environnement directement sur votre plateforme d'hébergement (Vercel, etc.)



