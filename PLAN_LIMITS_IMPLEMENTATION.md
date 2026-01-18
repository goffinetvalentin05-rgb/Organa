# Implémentation des limites du plan Gratuit

## Résumé des modifications

Cette implémentation ajoute les limites du plan Gratuit avec les règles suivantes :
- **Plan Gratuit** : Maximum 2 clients, Maximum 3 documents par mois (factures + devis)
- **Plan Pro** : Aucune limite

## Fichiers modifiés

### 1. Migration SQL
**Fichier** : `supabase/migrations/add_plan_to_users.sql`

- Crée la table `user_profiles` avec le champ `plan` (valeurs : 'free' ou 'pro')
- Définit 'free' comme valeur par défaut
- Crée un trigger pour créer automatiquement un profil avec plan 'free' lors de l'inscription
- Met à jour les utilisateurs existants pour qu'ils aient un profil avec plan 'free'

**À appliquer** : Exécuter cette migration dans Supabase avant de déployer le code.

### 2. Route API Clients
**Fichier** : `app/api/clients/route.ts`

- Ajoute la vérification du plan de l'utilisateur avant la création d'un client
- Si plan = 'free' et nombre de clients >= 2, retourne une erreur 403 avec un message explicite
- Les utilisateurs Pro n'ont aucune limite

### 3. Route API Documents
**Fichier** : `app/api/documents/route.ts`

- Ajoute l'import des APIs mock (`devisAPI`, `facturesAPI`)
- Ajoute la vérification du plan de l'utilisateur avant la création d'un document
- Si plan = 'free', compte les documents (devis + factures) créés dans le mois en cours
- Si >= 3 documents ce mois, retourne une erreur 403 avec un message explicite
- Les utilisateurs Pro n'ont aucune limite

**Note** : Actuellement, le comptage utilise les données mock. Si vous migrez vers Supabase pour les documents, il faudra adapter le comptage pour utiliser les tables `devis` et `factures`.

### 4. Route API /me
**Fichier** : `app/api/me/route.ts`

- Ajoute la récupération du plan de l'utilisateur depuis `user_profiles`
- Retourne le plan dans la réponse JSON (`user.plan`)

## Messages d'erreur

Les messages d'erreur sont explicites et orientent l'utilisateur vers le plan Pro :

- **Limite clients** : "Limite atteinte : Le plan gratuit permet un maximum de 2 clients. Passez au plan Pro pour créer plus de clients."
- **Limite documents** : "Limite atteinte : Le plan gratuit permet un maximum de 3 documents (factures + devis) par mois. Passez au plan Pro pour créer plus de documents."

## Prochaines étapes

1. **Appliquer la migration SQL** dans Supabase
2. **Tester les limites** :
   - Créer 2 clients avec un compte gratuit → doit fonctionner
   - Essayer de créer un 3ème client → doit être refusé
   - Créer 3 documents dans le mois → doit fonctionner
   - Essayer de créer un 4ème document → doit être refusé
3. **Intégration Stripe** : La base est prête pour ajouter Stripe et mettre à jour le plan de 'free' à 'pro' lors d'un abonnement

## Structure de la base de données

```sql
user_profiles
- id (UUID)
- user_id (UUID, référence auth.users)
- plan (TEXT: 'free' ou 'pro')
- created_at
- updated_at
```

## Notes importantes

- Le plan par défaut est 'free' pour tous les nouveaux utilisateurs
- Les utilisateurs existants sont automatiquement mis à 'free' lors de l'application de la migration
- La logique de vérification est entièrement côté API (sécurité)
- L'UI n'a qu'à afficher les messages d'erreur retournés par l'API



























