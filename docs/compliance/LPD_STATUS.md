# État LPD — Obillz

Document interne. Dernière mise à jour : 11 septembre 2026.

Obillz n’est pas « certifié LPD ». Ce fichier décrit l’état réel après le lot de corrections produit, ce qui a été fait dans le code, et ce qui reste manuel.

## Corrections effectuées dans le produit

- **Marketing** : plus de création automatique de contact depuis une inscription événement ou une demande buvette. Opt-in facultatif, non coché par défaut. Preuve minimale (`consented_at`, `consent_source`, `consent_text_version`) si la case est cochée. Campagnes `sendTo: all` (et les autres modes) limitées à `unsubscribed = false` et `consented_at IS NOT NULL`. Anciens contacts `evenement` / `buvette` sans opt-in : pas de `consented_at`, donc exclus des envois. Contact staff : confirmation de base valable + `consent_source = staff_declared`.
- **Analytics** : Vercel Analytics conservé ; jetons d’URL masqués (`/cotisation/[token]`, `/invitations/[token]`, `/desinscription/[token]`).
- **Brouillons** : AVS, IBAN et champs `qr_creditor_*` non persistés ; TTL 72 h ; suppression des drafts à la déconnexion (client). Import membres : mapping conservé, valeurs AVS vidées.
- **AVS** : toujours désactivé par défaut et facultatif ; confirmation explicite à l’activation.
- **Storage** : suppression des fichiers lors de la suppression d’une dépense (justificatif), d’un visuel (assets `visual-assets`) et d’un produit (images `shop-products`). Pas de scanner automatique des buckets.
- **Pages légales** : politique, mentions, CGU et cookies alignées LPD / droit suisse. Page publique `/securite-protection-donnees`. DPA club rédigé.

## Éléments restant manuels

- Appliquer la migration `077_marketing_consent.sql` (non exécutée par l’application).
- Conserver une **preuve de la région réelle** du projet Supabase (indication actuelle : Suisse).
- Compléter `[ADRESSE POSTALE À COMPLÉTER]` (mentions, politique, DPA si besoin).
- Valider les durées de conservation marquées `[À VALIDER]` dans `RETENTION.md`.
- Processus DSAR : aujourd’hui manuel via `contact@obillz.com` (voir `DROITS_PERSONNES.md`).
- Décider d’une AIPD formelle pour AVS / mineurs / paiements si le volume ou le risque augmente (`EVALUATION_AIPD.md`).
- Relecture juridique externe souhaitable avant toute communication commerciale forte.
- Cookie `obillz_active_club_id` : toujours non HttpOnly (hors lot).
- AVS / DOB restent en clair en base si le club active ces champs ; pas de module mineurs.
- Pas de purge automatique des données comptables (volontaire).
- Orphelins Storage historiques non scannés.

## Formulation publique autorisée

> Obillz applique des mesures techniques et organisationnelles visant à respecter les exigences applicables de la Loi fédérale suisse sur la protection des données (LPD).

À éviter : « certifié LPD », « 100 % conforme », « toutes les données restent en Suisse ».
