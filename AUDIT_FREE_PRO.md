# Audit du système Free/Pro

Date: 2024-12-XX

## Résumé exécutif

Le système Free/Pro a été audité et refactorisé pour garantir une source unique de vérité et une application cohérente des limites côté serveur.

## État avant refactorisation

### Fichiers concernés par le plan/utilisateurs

1. **`app/api/clients/route.ts`**
   - Vérifiait le plan depuis `user_profiles` de manière isolée
   - Limite: 2 clients max pour free
   - Retournait `LIMIT_REACHED` avec message non uniformisé

2. **`app/api/documents/route.ts`**
   - Vérifiait le plan depuis `user_profiles` de manière isolée
   - Limite: 3 documents/mois pour free
   - Utilisait des données mock (devisAPI, facturesAPI)
   - Message d'erreur non uniformisé

3. **`app/api/me/route.ts`**
   - Récupérait le plan depuis `user_profiles`
   - Pas de création automatique du profil si inexistant

4. **`app/tableau-de-bord/parametres/page.tsx`**
   - Affiche le plan utilisateur
   - Bouton "Passer à Pro" (non fonctionnel pour l'instant)

5. **`app/tableau-de-bord/clients/nouveau/page.tsx`**
   - Gère l'erreur `LIMIT_REACHED` avec un message inline
   - Redirige vers `/#tarifs` (incohérent)

6. **`app/api/webhooks/stripe/route.ts`**
   - Met à jour `user_profiles.plan` après paiement Stripe
   - Gère `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`

### Problèmes identifiés

1. **Source de vérité multiple**: Chaque route API récupérait le plan indépendamment
2. **Pas de création automatique**: Si le profil n'existait pas, le code retournait `free` sans créer le profil
3. **Messages d'erreur non uniformisés**: Différents formats de messages selon les endpoints
4. **Limites appliquées seulement côté UI**: Les erreurs étaient gérées côté client, pas côté serveur
5. **Logs manquants**: Pas de logs structurés pour le débogage

## État après refactorisation

### 1. Source unique de vérité

**Fichier créé: `lib/billing/getPlan.ts`**
- Fonction `getPlan()` qui garantit:
  - Récupération du plan depuis `user_profiles.plan`
  - Création automatique du profil avec `plan='free'` si inexistant
  - Retourne toujours `{ plan: 'free' | 'pro' }`
  - Logs structurés: `[BILLING][getPlan]`

### 2. Helpers pour les limites

**Fichier créé: `lib/billing/limits.ts`**
- Constantes: `MAX_CLIENTS_FREE = 2`, `MAX_DOCS_PER_MONTH_FREE = 3`
- Fonction `getLimitErrorMessage()` pour messages uniformisés
- Type `LimitInfo` pour la structure des limites

### 3. Refactorisation des API routes

**`app/api/clients/route.ts`**
- ✅ Utilise `getPlan()` pour récupérer le plan
- ✅ Applique la limite de 2 clients pour free
- ✅ Retourne erreur JSON structurée: `{ error: "LIMIT_REACHED", message, limit, current, plan }`
- ✅ Logs: `[LIMIT][clients] user=... plan=... count=... max=...`

**`app/api/documents/route.ts`**
- ✅ Utilise `getPlan()` pour récupérer le plan
- ✅ Applique la limite de 3 documents/mois pour free
- ✅ Retourne erreur JSON structurée identique
- ✅ Logs: `[LIMIT][documents] user=... plan=... count=... max=...`

**`app/api/me/route.ts`**
- ✅ Utilise `getPlan()` pour récupérer le plan
- ✅ Gère les erreurs gracieusement (retourne 'free' par défaut)

### 4. UI uniformisée

**Composant créé: `components/LimitReachedAlert.tsx`**
- Composant réutilisable pour afficher les erreurs `LIMIT_REACHED`
- Redirige vers `/tableau-de-bord/abonnement`
- Design cohérent avec le reste de l'application

**Page créée: `app/tableau-de-bord/abonnement/page.tsx`**
- Affiche les plans Free et Pro
- Compare les fonctionnalités
- Message: "Le paiement sera bientôt disponible"
- Permet de comprendre les limites actuelles

**Refactorisation: `app/tableau-de-bord/clients/nouveau/page.tsx`**
- ✅ Utilise `LimitReachedAlert` au lieu d'un message inline
- ✅ Redirige vers `/tableau-de-bord/abonnement` au lieu de `/#tarifs`

### 5. Structure de la base de données

**Table: `user_profiles`**
```sql
- id: UUID (PK)
- user_id: UUID (FK → auth.users, UNIQUE)
- plan: TEXT ('free' | 'pro', DEFAULT 'free')
- stripe_customer_id: TEXT (NULL)
- stripe_subscription_id: TEXT (NULL)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**Migration: `supabase/migrations/add_stripe_fields_to_user_profiles.sql`**
- Ajoute les champs Stripe si nécessaire
- Crée des index pour les recherches
- Trigger pour `updated_at` automatique

## Constantes des limites

- **MAX_CLIENTS_FREE**: 2
- **MAX_DOCS_PER_MONTH_FREE**: 3

## Format des erreurs API

Toutes les erreurs `LIMIT_REACHED` suivent maintenant ce format:

```json
{
  "error": "LIMIT_REACHED",
  "message": "Limite atteinte : Le plan gratuit permet un maximum de X...",
  "limit": 2,
  "current": 2,
  "plan": "free"
}
```

Status HTTP: `403 Forbidden`

## Logs structurés

### Billing
- `[BILLING][getPlan] user_id=... plan=...` - Récupération du plan
- `[BILLING][getPlan] Profil inexistant pour user_id=..., création avec plan=free` - Création automatique

### Limits
- `[LIMIT][clients] user=... plan=... count=... max=...` - Vérification limite clients
- `[LIMIT][documents] user=... plan=... count=... max=...` - Vérification limite documents

## Points d'attention

1. **Documents utilisent encore des données mock**: `app/api/documents/route.ts` utilise `devisAPI` et `facturesAPI` depuis `lib/mock-data.ts`. La limite est calculée sur ces données mock, pas sur la base de données réelle.

2. **Pas de table documents dans Supabase**: Les documents (devis/factures) ne sont pas encore stockés en base, donc la limite documents/mois est calculée sur les données mock en mémoire.

3. **Stripe non finalisé**: Le bouton "Passer à Pro" existe mais ne fonctionne pas encore (paiement "bientôt disponible").

## Prochaines étapes recommandées

1. ✅ Migrer les documents vers Supabase (tables `devis` et `factures`)
2. ✅ Adapter `app/api/documents/route.ts` pour compter depuis la base au lieu des données mock
3. ✅ Finaliser l'intégration Stripe (quand prêt)
4. ✅ Ajouter des tests unitaires pour `getPlan()` et les limites

## Fichiers modifiés

- ✅ `lib/billing/getPlan.ts` (nouveau)
- ✅ `lib/billing/limits.ts` (nouveau)
- ✅ `app/api/clients/route.ts` (refactorisé)
- ✅ `app/api/documents/route.ts` (refactorisé)
- ✅ `app/api/me/route.ts` (refactorisé)
- ✅ `components/LimitReachedAlert.tsx` (nouveau)
- ✅ `app/tableau-de-bord/abonnement/page.tsx` (nouveau)
- ✅ `app/tableau-de-bord/clients/nouveau/page.tsx` (refactorisé)

## Fichiers à nettoyer (optionnel)

- `PLAN_LIMITS_IMPLEMENTATION.md` - Documentation obsolète (peut être supprimée)
- Vérifier si d'autres fichiers contiennent des vérifications de plan obsolètes

















