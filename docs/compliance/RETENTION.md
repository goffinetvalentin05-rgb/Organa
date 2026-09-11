# Politique de conservation — Obillz

Document interne. Dernière mise à jour : 11 septembre 2026.

La purge automatique existe **uniquement** pour les catégories listées comme « automatique » ci-dessous. Elle est exécutée par la RPC `purge_operational_data()` (service_role), via `POST`/`GET` `/api/internal/retention-purge` protégée par `CRON_SECRET` (cron Vercel quotidien 03:00 UTC). Idempotente, journalisée (`retention_purge_runs` + `audit_logs.action = retention_purge`).

Pour toute autre catégorie : **Conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future.**

Ne pas prétendre qu’une purge existe si elle n’est pas dans la colonne « Méthode ».

| Catégorie | Durée | Justification | Méthode de suppression |
| --- | --- | --- | --- |
| Invitations expirées | 90 jours après `expires_at` | Sécurité des liens | **Automatique** (`club_invitations` status `expired`) |
| Invitations annulées | 90 jours après `cancelled_at` | Tokens d’accès morts | **Automatique** (`club_invitations` status `cancelled`) |
| Clés d’idempotence | 30 jours après `created_at` | Anti-doublon des écritures | **Automatique** (`idempotency_keys`) |
| Audit logs / logs sécurité (y compris IP) | 12 mois après `created_at` | Sécurité, incidents | **Automatique** (`audit_logs`) |
| Historique d’e-mails déjà soft-deleted | 30 jours après `deleted_at` | Hygiène ; table clairement non comptable une fois marquée supprimée | **Automatique** (`email_history` uniquement si `deleted_at` non null) |
| Tokens planning / liens publics | Désactivation à la date de l’événement (`plannings.date`) ; suppression 90 jours après cette date ; soft-deleted 30 jours | Accès public limité | **Automatique** (`public_planning_links`) |
| Factures, devis, cotisations, paiements, pièces comptables, transactions | 10 ans | Obligation comptable | Conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future. |
| Abonnement SaaS / factures Obillz | 10 ans | Comptabilité de l’exploitant | Conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future. Conservé chez Stripe + exports. |
| Commandes boutique | Données comptables : 10 ans. Données de livraison non nécessaires : suppression ou anonymisation plus tôt | Preuve de transaction vs minimisation | Conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future. Soft-delete produit ≠ purge commande. |
| Anciens membres (`clients`) | Durée de l’adhésion + 12 mois, sauf données liées à des obligations comptables (alors 10 ans) | Gestion de l’effectif | Conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future. |
| AVS / date de naissance | Aligné sur la fiche membre (adhésion + 12 mois), dès que plus nécessaire | Donnée sensible | Conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future. Désactiver le champ ne l’efface pas. |
| Comptes utilisateurs / memberships staff | Durée du compte ; 12 mois après clôture, sauf facturation (10 ans) | Accès au service | Conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future. |
| Inscriptions événement, demandes buvette, affectations planning | 12 mois après l’événement | Organisation | Conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future. |
| Contacts marketing | Jusqu’au retrait du consentement (désinscription) ; suppression après 24 mois d’inactivité | Opt-in / opposition | Conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future. |
| Contrats sponsors | 10 ans si montants / pièces comptables ; sinon durée de la relation + 12 mois | Sponsoring / compta | Conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future. |
| PV (procès-verbaux) | Tant que nécessaire à la gouvernance ; 10 ans s’ils documentent des décisions financières | Gouvernance | Conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future. |
| Autres enregistrements soft-deleted (documents, dépenses, membres, commandes, etc.) | 30 jours de fenêtre de récupération puis nettoyage **manuel** | Ne pas hard-delete du comptable | Conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future. **Pas** de purge auto hors `email_history` et tokens planning. |
| Tables legacy | Suppression après vérification qu’elles ne sont plus utilisées | Hygiène schéma | Conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future. |
| Brouillons localStorage | 72 h + vidage à la déconnexion | Confort de saisie | TTL produit + `clearAllLocalDrafts` (côté client, pas la RPC) |
| Fichiers Storage liés à un objet | Aligné à l’objet (10 ans si justificatif comptable) | Preuve / illustration | Déjà à la suppression dépense / visuel / produit ; orphelins historiques : conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future. |

La RPC ne supprime jamais : `documents`, `clients`, `shop_*`, `expenses`/`depenses`, `club_revenues`, `profiles`, `registrations`, `marketing_*`.

En cas de fin de contrat club : restitution/export, puis suppression des données ordinaires selon ce tableau, **sauf** pièces comptables à conserver 10 ans.

Déclenchement : variable d’environnement `CRON_SECRET` (Bearer) obligatoire ; sans secret, la route refuse l’appel.
