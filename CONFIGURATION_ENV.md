# 📝 Configuration du fichier .env.local

## ✅ Fichier créé

Le fichier `.env.local` a été créé à la racine du projet (même niveau que `package.json`).

## 🔧 Configuration requise

### 1. Ouvrir le fichier `.env.local`

Le fichier se trouve à la racine du projet :
```
organa/
├── .env.local          ← ICI
├── package.json
├── next.config.ts
└── ...
```

### 2. Remplir les variables Supabase

Ouvrez `.env.local` et remplacez les valeurs vides par vos clés Supabase :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_ici
```

### 3. Où trouver ces valeurs ?

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet (ou créez-en un)
3. Allez dans **Settings** → **API**
4. Copiez :
   - **Project URL** → collez dans `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → collez dans `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Exemple de fichier complet

```env
# Configuration Supabase
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## ⚠️ IMPORTANT

1. **Ne commitez JAMAIS ce fichier** : Il est déjà dans `.gitignore`
2. **Redémarrez le serveur** après modification :
   ```bash
   # Arrêtez le serveur (Ctrl+C)
   npm run dev
   ```
3. **Vérification** : Si les variables ne sont pas configurées, vous verrez des avertissements dans la console

## ✅ Vérification

Après avoir configuré `.env.local` et redémarré le serveur :

1. Ouvrez la console du navigateur (F12)
2. Allez sur `/connexion` ou `/inscription`
3. Vous ne devriez **PAS** voir d'erreurs Supabase
4. Si vous voyez "⚠️ Variables Supabase non configurées", vérifiez :
   - Que le fichier `.env.local` est bien à la racine
   - Que les variables commencent par `NEXT_PUBLIC_`
   - Que vous avez redémarré le serveur

## 🐛 Dépannage

### Les variables ne sont pas lues

1. Vérifiez que le fichier s'appelle exactement `.env.local` (avec le point au début)
2. Vérifiez qu'il est à la racine du projet (même niveau que `package.json`)
3. Redémarrez complètement le serveur (`npm run dev`)
4. Vérifiez qu'il n'y a pas d'espaces avant/après les `=`

### Erreur "Invalid API key"

- Vérifiez que vous avez copié la **anon key** (pas la service_role key)
- Vérifiez qu'il n'y a pas d'espaces ou de retours à la ligne dans les valeurs























