# Registre des traitements — Obillz

Document interne. Dernière mise à jour : 11 septembre 2026.

Responsable plateforme (compte, abonnement, sécurité, site) : **Obillz, exploité par Valentin Goffinet**.  
Pour les données métier d’un club : **le club est responsable** ; Obillz est sous-traitant.

Contact : contact@obillz.com  
Adresse : Les Courtats 7, 2942 Alle, Suisse

Purge automatique uniquement pour invitations, clés d’idempotence, audit logs, `email_history` soft-deleted et tokens planning. Autres catégories : conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future. Détail : `RETENTION.md`.

| Traitement | Responsable | Finalité | Catégories de données | Personnes concernées | Destinataires | Lieu / prestataires | Conservation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Membres | Club | Gestion de l’effectif | Identité, coordonnées, rôle, éventuellement DOB, AVS si activé | Membres / licenciés | Staff du club, Obillz (hébergement) | Supabase (CH selon config actuelle — preuve à conserver) ; app Vercel | Conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future (adhésion + 12 mois ; 10 ans si lié à une obligation comptable) |
| Utilisateurs (comptes) | Obillz | Accès au service, rôles | E-mail, identifiants, MFA, memberships | Staff / propriétaires de club | Obillz, Supabase Auth | Supabase, Vercel | Conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future |
| Cotisations | Club | Encaissement des cotisations | Montants, statuts, liens de paiement, jetons | Membres payeurs | Club, Stripe, Obillz | Stripe (peut être hors CH), Supabase | Conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future (10 ans, pièces comptables) |
| Factures / devis | Club | Comptabilité club | Destinataires, lignes, PDF, QR | Membres, tiers facturés | Club, Obillz | Supabase, Vercel | Conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future (10 ans) |
| Boutique | Club | Vente de produits | Commandes, produits, images, coordonnées commande | Acheteurs | Club, Stripe le cas échéant | Supabase Storage, Stripe | Conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future (comptable : 10 ans) |
| Événements | Club | Inscriptions et organisation | Identité, e-mail, téléphone, commentaires | Participants | Club ; marketing seulement si opt-in | Supabase | Conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future (12 mois après l’événement) |
| Planning | Club | Affectation de créneaux | Identité des bénévoles / membres assignés ; tokens de lien public | Bénévoles, membres | Club | Supabase | Affectations : conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future. Tokens publics : **purge automatique** (désactivation à la date de l’événement, suppression 90 jours après) |
| Buvette | Club | Réservation de dates | Identité, e-mail, téléphone, type d’événement | Demandeurs externes | Club ; marketing seulement si opt-in | Supabase, Resend | Conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future |
| Marketing | Club | Communications e-mail | E-mail, nom, preuve d’opt-in, désinscription | Contacts ayant consenti ou déclarés par le staff | Club, Resend | Resend (peut être hors CH) | Conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future |
| Sponsors | Club | Contrats et suivi | Identité, coordonnées, montants | Sponsors | Club | Supabase | Conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future |
| PV | Club | Gouvernance | Contenu des séances, participants | Membres du comité | Club | Supabase | Conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future |
| Logs / sécurité | Obillz | Traçabilité, abus, incidents | Horodatage, action, ressource, parfois IP | Utilisateurs, parfois visiteurs publics | Obillz | Supabase, Vercel | **Purge automatique** 12 mois (`audit_logs`) |
| Invitations club | Obillz / club | Accès staff | E-mail, jeton, statut | Invités | Obillz, club | Supabase | **Purge automatique** 90 jours après expiration ou annulation |
| Clés d’idempotence | Obillz | Anti-doublon API | Clé, club, ressource | — | Obillz | Supabase | **Purge automatique** 30 jours |
| Soft-deleted / fichiers orphelins | Club / Obillz | Récupération puis hygiène | Fichiers et lignes marquées supprimées | Selon l’objet | Obillz | Supabase Storage | **Purge automatique** seulement `email_history` (30 j après `deleted_at`) et tokens planning soft-deleted. Autres tables : conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future |
| Acceptation CGU/DPA | Obillz | Preuve contractuelle (nouveaux clubs) | club_id, user_id, versions, accepted_at | Propriétaires de nouveaux clubs | Obillz | Supabase | Durée du compte / preuve contractuelle. Pas de backfill des clubs existants |
| Tables legacy | Obillz | Ancien schéma | Variable | — | Obillz | Supabase | Conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future |
| Abonnement SaaS | Obillz | Facturation du logiciel | E-mail, plan, IDs Stripe | Clients Obillz (clubs) | Stripe, Obillz | Stripe (international possible) | Conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future (10 ans) |

Mettre à jour ce registre lors d’un nouveau module collectant des données personnelles.
