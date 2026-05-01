# Sécurité Obillz — Architecture et procédures

> Document opérationnel. Lire en entier avant tout déploiement et avant
> d'ouvrir des accès.

## 1. Modèle d'accès multi-clubs

### Vocabulaire

- **Club** : entité métier (un club sportif). Identifié par un UUID = celui
  du compte `auth.users` de l'utilisateur qui a créé le compte (= "owner
  historique"). Cette convention permet la rétrocompatibilité totale avec
  l'ancien modèle mono-utilisateur.
- **Membre du club (compte)** : ligne dans `public.club_memberships`,
  rattachée à un `auth.users.id` ET à un rôle.
- **Membre du club (joueur, cotisant, etc.)** : ligne dans `public.clients`.
  Ce sont des contacts gérés par le club, **sans compte de connexion**.

### Rôles

| Rôle        | SELECT | INSERT/UPDATE | DELETE | Gérer membres | Gérer intégrations | Suppression définitive |
|-------------|:------:|:-------------:|:------:|:-------------:|:------------------:|:----------------------:|
| `owner`     |   ✓    |       ✓       |   ✓    |       ✓       |          ✓         |            ✓           |
| `admin`     |   ✓    |       ✓       |   ✓*   |       ✓       |          ✓         |            ✗           |
| `committee` |   ✓    |       ✓       |   ✗    |       ✗       |          ✗         |            ✗           |
| `member`    |   ✓    |       ✗       |   ✗    |       ✗       |          ✗         |            ✗           |

\* Soft delete uniquement pour admin. Hard delete réservé à l'owner.

### Helpers SQL (à utiliser dans les RLS)

Définis en `supabase/migrations/020_clubs_memberships.sql` :

- `public.is_club_member(p_club_id uuid, p_roles club_role[] = NULL)` — true
  si l'utilisateur courant est membre actif du club, optionnellement avec
  un rôle parmi la liste.
- `public.is_club_owner(p_club_id uuid)` — owner uniquement.
- `public.is_club_admin(p_club_id uuid)` — owner ou admin.
- `public.is_club_staff(p_club_id uuid)` — owner, admin ou committee.
- `public.current_user_role_in(p_club_id uuid)` — retourne le rôle effectif.

Toutes ces fonctions sont `SECURITY DEFINER` pour éviter les boucles RLS et
sont stables.

## 2. Row Level Security

### Tables protégées

Toutes les tables métier suivantes ont la RLS **activée** et utilisent les
helpers ci-dessus (migration `023_strict_rls_clubscope.sql`) :

- `profiles`, `clients`, `documents`
- `events`, `event_types`
- `plannings`, `planning_slots`, `planning_assignments`, `public_planning_links`
- `depenses`, `expenses`, `email_history`
- `qrcodes`, `registrations`
- `buvette_slots`, `buvette_requests`
- `marketing_contacts`, `marketing_campaigns`, `marketing_campaign_recipients`
- `club_revenues`
- `club_memberships` (RLS spécifique - migration 020)
- `audit_logs` (append-only - migration 021)
- `club_integrations` (admin only - migration 026)

### Tables legacy verrouillées (deny-all)

Les tables suivantes provenaient du `supabase/schema.sql` historique et ne
sont plus utilisées par le code applicatif. Elles sont verrouillées
(RLS deny-all) pour éviter toute fuite de données résiduelles :

- `organizations`
- `devis`, `devis_lignes`
- `factures`, `factures_lignes`
- `evenements_calendrier`

À supprimer après vérification qu'aucune donnée critique n'y réside.

### Modèle de policies (par défaut)

Pour toute table portant `user_id` (= `club_id` implicite) :

```sql
-- SELECT : tout membre actif (lecture seule pour 'member')
USING (public.is_club_member(user_id) AND deleted_at IS NULL);

-- INSERT : staff uniquement
WITH CHECK (public.is_club_staff(user_id));

-- UPDATE : staff uniquement
USING (public.is_club_staff(user_id))
WITH CHECK (public.is_club_staff(user_id));

-- DELETE physique : owner uniquement (préférer le soft delete)
USING (public.is_club_owner(user_id));
```

## 3. Soft delete

Migration `022_soft_delete.sql` : ajoute `deleted_at TIMESTAMPTZ` et
`deleted_by UUID` sur toutes les tables métier.

Convention applicative :

- **Lecture** : toujours `WHERE deleted_at IS NULL` (déjà imposé par les RLS).
- **Suppression** : `UPDATE ... SET deleted_at = NOW(), deleted_by = auth.uid()`
  ou via la fonction RPC `public.soft_delete_row(p_table text, p_row_id uuid)`.
- **Purge définitive** : à organiser manuellement avec une procédure de
  conservation (recommandé : ≥ 30 jours après soft delete pour les données
  métier, ≥ 12 mois pour les `audit_logs`).

## 4. Audit logs

Migration `021_audit_logs.sql` : table append-only `public.audit_logs`.

- **INSERT** : tout membre actif peut écrire pour son club.
- **SELECT** : owner/admin uniquement.
- **UPDATE/DELETE** : interdits pour TOUS (sauf service_role).

Helpers Node : `lib/auth/audit.ts` — `logAudit()` ne lève jamais (best-effort).

Liste d'actions standardisées : voir `AuditAction` dans `lib/auth/audit.ts`.

À tracer **systématiquement** dans toute nouvelle route :

- création/modification/suppression d'une ressource sensible (financier,
  membres, intégrations) ;
- exports de données ;
- changements de rôle / invitation / révocation ;
- enrôlement / désactivation MFA ;
- échec d'authentification.

## 5. Authentification

### Politique de mot de passe

À CONFIGURER côté Supabase Dashboard :

- **Minimum** : 12 caractères, complexité (Auth → Settings → Password).
- Activer la liste de mots de passe compromis (HaveIBeenPwned).

### MFA (TOTP)

- Activée côté Supabase Auth (par défaut sur les nouveaux projets).
- **Obligatoire** pour les rôles `owner`, `admin`, `committee` après une
  période de grâce de 7 jours.
- La grâce est calculée par rapport à `auth.users.created_at` ou à
  `MFA_POLICY_EFFECTIVE_DATE` (env var) si plus récent.
- Page d'enrôlement : `/tableau-de-bord/securite/mfa`.
- Page de vérification AAL2 : `/tableau-de-bord/securite/mfa/verifier`.
- Le `middleware.ts` redirige automatiquement vers ces pages quand requis.

### Helpers

- `lib/auth/mfa.ts` — `getMfaStatus()`, `evaluateMfaPolicy()`.
- `lib/auth.ts` — `requireAal2()` à utiliser dans les API routes sensibles.

## 6. Storage

Migration `025_storage_security.sql` : buckets `Logos` et `expenses`
basculés en **PRIVÉ** avec policies RLS scoped par `club_id`.

### Convention de nommage

```
<bucket>/<club_id>/<filename>
```

Exemples :
- `Logos/<user_id>/logo-1700000000.png`
- `expenses/<user_id>/1700000000-facture.pdf`

Le 1er segment du chemin DOIT être un UUID = `club_id`. La RLS vérifie
l'appartenance via `public.is_club_member(public.storage_path_club_id(name))`.

### Helpers Node

- `lib/storage/secureUrl.ts` — `createSecureSignedUrl()` côté serveur.
- `app/api/storage/sign/route.ts` — endpoint serveur générique
  (`POST /api/storage/sign` avec `{ bucket, path, expiresIn?, download? }`).

### Migration recommandée des URLs publiques existantes

Le code historique utilisait `getPublicUrl()` qui ne marche plus avec les
buckets privés. Les colonnes `profiles.logo_url` et `depenses.attachment_url`
peuvent contenir des URLs publiques cassées : il faut soit re-signer à la
demande, soit re-stocker uniquement le `logo_path` et signer côté serveur.

**TODO opérationnel** : modifier les composants qui consomment `logo_url` pour
les re-signer via `/api/storage/sign` avec le path `logo_path`.

## 7. Routes publiques (anti-spam)

Toutes les routes publiques (sans auth) qui acceptent des `POST` doivent :

1. Appliquer `rateLimitGuard()` (`lib/security/rateLimit.ts`) avant tout
   travail.
2. Valider strictement le format des entrées (longueurs, regex).
3. Ne pas fuiter de message d'erreur SQL au client.
4. Logger l'action dans `audit_logs` avec `actorId: null` et l'email du
   demandeur si disponible.

Routes concernées (sécurisées dans cette session) :

- `POST /api/registrations` — inscription QR code public.
- `POST /api/public/buvette/[slug]/requests` — demande publique de buvette.
- `POST /api/public/plannings/[token]` — inscription bénévole publique.

> ⚠ Le `rateLimit` est en mémoire et **non distribué**. Sur Vercel multi-
> régions, basculer vers Upstash Redis (cf. TODO ci-dessous).

## 8. Secrets et clés

### Hiérarchie

| Variable                       | Côté    | Rotation impacte                       |
|-------------------------------|---------|-----------------------------------------|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Non sensible (RLS)                      |
| `SUPABASE_SERVICE_ROLE_KEY`    | Serveur | Toutes les routes admin                 |
| `INTEGRATIONS_ENCRYPTION_KEY`  | Serveur | Tous les `club_integrations.secret_*`   |
| `STRIPE_SECRET_KEY`            | Serveur | Toutes les opérations Stripe            |
| `STRIPE_WEBHOOK_SECRET`        | Serveur | Vérification des webhooks Stripe        |
| `RESEND_API_KEY` (fallback)    | Serveur | Emails système (si pas de clé par club) |

### Procédure de rotation

1. Générer la nouvelle clé dans le dashboard du fournisseur.
2. Mettre à jour la variable d'env sur Vercel/Supabase.
3. Redéployer.
4. Révoquer l'ancienne clé.
5. Tracer dans `audit_logs` (`integration_key_rotated`).

### ⚠ Action immédiate requise (audit du 2026-05-01)

- `STRIPE_SECRET_KEY` (live) a été retrouvée en clair dans `.env.local`.
  **Considérer comme COMPROMISE** : la révoquer dans Stripe, en générer
  une nouvelle, et ne jamais la committer.
- `resend_api_key` est stockée en clair dans `public.profiles` pour les
  comptes existants. La colonne est marquée `DEPRECATED`. Migration manuelle
  à prévoir vers `public.club_integrations` (ciphertext).

## 9. Procédure de déploiement des migrations

```sh
# Depuis Supabase Dashboard → SQL Editor, exécuter dans l'ordre :
#   020_clubs_memberships.sql
#   021_audit_logs.sql
#   022_soft_delete.sql
#   023_strict_rls_clubscope.sql
#   024_legacy_tables_lockdown.sql
#   025_storage_security.sql
#   026_club_integrations.sql
```

Toutes les migrations sont **idempotentes** (utilisent `IF NOT EXISTS`,
`DROP POLICY IF EXISTS`, etc.) — peuvent être ré-exécutées sans danger.

## 10. TODO opérationnels (à planifier)

### Court terme
- [ ] Révoquer la clé Stripe live commitée et la régénérer.
- [ ] Configurer la politique de mot de passe Supabase (12 chars + HIBP).
- [ ] Activer Email/Phone OTP côté Supabase si rate-limit suspect.
- [ ] Backfill `public.club_integrations` depuis `profiles.resend_api_key`
      (script à écrire) puis dropper la colonne.
- [ ] UI de gestion des invitations / rôles (`/tableau-de-bord/securite/membres`).
- [ ] UI de consultation complète des audit logs avec filtres.

### Moyen terme
- [ ] Refactorer toutes les routes API restantes pour utiliser
      `requireClubRole()` et logger via `logAudit()`.
- [ ] Migrer les composants qui utilisent encore `getPublicUrl` pour qu'ils
      consomment `/api/storage/sign`.
- [ ] Remplacer le rate-limit en mémoire par Upstash/Vercel KV pour le
      multi-instance.
- [ ] Activer `pg_cron` pour purger automatiquement les soft-deleted >30j.
- [ ] Tests E2E des RLS (jeu de données multi-clubs, vérifier qu'aucun
      cross-club n'est possible).

### Long terme
- [ ] Refonte vers une vraie table `clubs` (option A) si l'app évolue vers
      un modèle où un même utilisateur appartient à plusieurs clubs avec
      des contrats distincts.
- [ ] Mettre en place CSP stricte (Content-Security-Policy headers) côté
      Next.js.
- [ ] Mettre en place HSTS preload.
- [ ] Monitoring (Sentry / Logtail) avec alertes sur `audit_logs.outcome
      IN ('failure', 'denied')` agrégés.

## 11. Conformité Suisse (LPD) / RGPD

- **Localisation** : Supabase EU (Frankfurt) recommandé pour le projet.
- **Conservation** : audit logs ≥ 12 mois, données métier soft-deleted
  conservées ≥ 30 jours minimum avant purge effective.
- **Droit d'accès** : owner peut exporter toutes les données du club via
  une route à créer (`/api/export/club`).
- **Droit à l'effacement** : la suppression d'un compte `auth.users` cascade
  vers `club_memberships`, `profiles`, etc. via les FK `ON DELETE CASCADE`.
  Pour les contacts marketing, prévoir un flow d'effacement (à documenter).
- **Sous-traitants** : Supabase, Stripe, Resend, Vercel — tous documenter
  dans la politique de confidentialité.

---

> Ce document est vivant. Toute modification de policies RLS, ajout de
> bucket Storage, ou refactor de route publique DOIT être reflétée ici.
