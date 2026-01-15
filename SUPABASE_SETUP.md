# Configuration Supabase pour Organa

Ce document explique comment configurer Supabase pour activer l'authentification et la persistance des données.

## 📋 Prérequis

1. Un compte Supabase (gratuit) : https://supabase.com
2. Node.js installé
3. Les dépendances npm installées (`npm install`)

## 🚀 Étapes de configuration

### 1. Créer un projet Supabase

1. Allez sur https://supabase.com et créez un compte
2. Cliquez sur "New Project"
3. Remplissez les informations :
   - **Name** : organa (ou votre choix)
   - **Database Password** : choisissez un mot de passe fort
   - **Region** : choisissez la région la plus proche
4. Attendez que le projet soit créé (2-3 minutes)

### 2. Récupérer les clés API

1. Dans votre projet Supabase, allez dans **Settings** → **API**
2. Copiez les valeurs suivantes :
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public key** (une longue chaîne de caractères)

### 3. Configurer les variables d'environnement

1. Créez un fichier `.env.local` à la racine du projet
2. Ajoutez les variables suivantes :

```env
NEXT_PUBLIC_SUPABASE_URL=votre_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
```

**Exemple :**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANT** : Ne commitez jamais le fichier `.env.local` dans Git !

### 4. Créer les tables dans Supabase

1. Dans votre projet Supabase, allez dans **SQL Editor**
2. Cliquez sur "New Query"
3. Copiez-collez le contenu du fichier `supabase/schema.sql`
4. Cliquez sur "Run" (ou Ctrl+Enter)
5. Vérifiez qu'il n'y a pas d'erreurs

### 5. Vérifier la configuration

1. Redémarrez votre serveur de développement :
   ```bash
   npm run dev
   ```

2. Testez l'inscription :
   - Allez sur http://localhost:3000/inscription
   - Créez un compte avec email + mot de passe (min 8 caractères)
   - Vous devriez être redirigé vers le tableau de bord

3. Testez la connexion :
   - Déconnectez-vous
   - Reconnectez-vous avec les mêmes identifiants
   - Vos données doivent toujours être là

## 🔒 Sécurité

- Les mots de passe sont automatiquement hashés par Supabase
- Les sessions sont gérées via des cookies sécurisés
- Row Level Security (RLS) est activé : chaque utilisateur ne voit que ses propres données
- Les routes API sont protégées : impossible d'accéder sans être authentifié

## 📊 Structure de la base de données

- **organizations** : Une organisation par utilisateur (infos entreprise)
- **clients** : Clients liés à une organisation
- **devis** : Devis liés à une organisation et un client
- **devis_lignes** : Lignes d'un devis
- **factures** : Factures liées à une organisation et un client
- **factures_lignes** : Lignes d'une facture
- **evenements_calendrier** : Événements du calendrier

## 🐛 Dépannage

### Erreur "Invalid API key"
- Vérifiez que les variables d'environnement sont correctes
- Redémarrez le serveur après modification de `.env.local`

### Erreur "relation does not exist"
- Vérifiez que vous avez bien exécuté le script SQL dans Supabase
- Vérifiez que toutes les tables ont été créées dans l'onglet "Table Editor"

### Les données disparaissent après reconnexion
- Vérifiez que RLS est bien activé sur toutes les tables
- Vérifiez que les policies sont correctement créées

## 📝 Notes importantes

- **Migration des données existantes** : Les données mock actuelles ne seront pas migrées automatiquement. Vous devrez recréer vos données après la configuration de Supabase.
- **Production** : Pour la production, utilisez les variables d'environnement de votre plateforme de déploiement (Vercel, etc.)

## 🔄 Prochaines étapes

Une fois Supabase configuré, les fonctionnalités suivantes seront disponibles :
- ✅ Authentification sécurisée
- ✅ Persistance des données
- ✅ Isolation des données par utilisateur
- ✅ Protection des routes API

Les API seront progressivement migrées de `mock-data.ts` vers Supabase.




























