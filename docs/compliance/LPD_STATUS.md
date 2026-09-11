# État LPD — Obillz

Document interne. Dernière mise à jour : 11 septembre 2026.

Obillz n’est pas « certifié LPD ». Ce fichier décrit l’état réel du produit.

## Corrections effectuées dans le produit

- **Marketing** : plus de création automatique de contact depuis une inscription événement ou une demande buvette. Opt-in facultatif, non coché par défaut. Preuve minimale (`consented_at`, `consent_source`, `consent_text_version`) si la case est cochée. Campagnes limitées à `unsubscribed = false` et `consented_at IS NOT NULL`. Anciens contacts `evenement` / `buvette` sans opt-in exclus des envois. Contact staff : confirmation de base valable + `consent_source = staff_declared`.
- **Analytics** : Vercel Analytics conservé ; jetons d’URL masqués (`/cotisation/[token]`, `/invitations/[token]`, `/desinscription/[token]`).
- **Brouillons** : AVS, IBAN et champs `qr_creditor_*` non persistés ; TTL 72 h ; suppression des drafts à la déconnexion (client). Import membres : mapping conservé, valeurs AVS vidées.
- **AVS** : désactivé par défaut et facultatif ; confirmation explicite à l’activation.
- **Storage** : suppression des fichiers lors de la suppression d’une dépense, d’un visuel et d’un produit. Pas de scanner automatique des buckets.
- **Pages légales** : politique, mentions, CGU et cookies alignées LPD / droit suisse. Page publique `/securite-protection-donnees`. DPA public `/accord-traitement-donnees`. Adresse : Les Courtats 7, 2942 Alle, Suisse.
- **Rétention automatique** (RPC `purge_operational_data`, route interne `/api/internal/retention-purge`) : invitations expirées/annulées 90 j, idempotency 30 j, audit logs 12 mois, `email_history` soft-deleted 30 j, tokens planning (désactivation à la date de l’événement, suppression 90 j après). Factures, documents comptables, transactions, commandes, membres, paiements Stripe : **pas** de purge auto.
- **DPA / CGU** : pour les **nouveaux** clubs uniquement, case obligatoire à l’inscription ; preuve dans `legal_acceptances` (`terms_version` / `dpa_version` = `2026-09`). Aucune modale ni blocage pour les clubs déjà existants. Aucun backfill.

## Actions opérationnelles restantes

- Appliquer les migrations SQL non encore appliquées (dont 077 et 078).
- Définir `CRON_SECRET` en production pour que le cron de purge puisse s’exécuter.
- Conserver une preuve de la région Supabase Suisse.

## Formulation publique autorisée

> Obillz applique des mesures techniques et organisationnelles visant à respecter les exigences applicables de la Loi fédérale suisse sur la protection des données (LPD).

À éviter : « certifié LPD », « 100 % conforme », « toutes les données restent en Suisse ».
