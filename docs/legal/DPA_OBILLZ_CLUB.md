# Accord de sous-traitance (DPA) — Obillz / Club

Version : 2026-09  
Statut : fait partie du contrat pour les **nouveaux clubs** créés après la mise en production de cette version. Acceptation enregistrée électroniquement à l’inscription (`legal_acceptances` : `terms_version`, `dpa_version`, `accepted_at`). **Aucun backfill** et aucun flux d’acceptation pour les clubs déjà existants. **Non certifié LPD.** Page publique : `/accord-traitement-donnees`.

Entre :

- le **Club** (client du service Obillz), **responsable du traitement** des données métier qu’il saisit ou collecte via le service ;
- **Obillz**, service exploité par **Valentin Goffinet**, **sous-traitant**.

Contact Obillz : contact@obillz.com  
Adresse : Les Courtats 7, 2942 Alle, Suisse

## 1. Objet

Le Club utilise Obillz pour gérer notamment ses membres, cotisations, factures, boutique, événements, planning, buvette, communications et documents. Obillz ne traite ces données **que pour fournir le service**, selon les instructions documentées du Club (interfaces, paramètres, exports, demandes écrites).

Obillz est responsable distinct pour le compte d’utilisateur, l’abonnement SaaS, le support et la sécurité de la plateforme.

## 2. Confidentialité

Obillz et toute personne autorisée à traiter les données s’engagent à la confidentialité et à n’accéder aux données du Club que dans la mesure nécessaire au service, au support ou aux obligations légales.

## 3. Sécurité

Obillz met en œuvre des mesures techniques et organisationnelles visant à respecter les exigences applicables de la LPD, notamment : isolation logique des clubs, contrôles d’accès et politiques RLS, chiffrement en transit, journaux d’audit, possibilité de MFA, limitation des brouillons locaux pour certaines données sensibles. Ces mesures n’équivalent pas à une certification.

## 4. Sous-traitants ultérieurs

Obillz peut recourir notamment à :

- Supabase (base, auth, storage) ;
- Vercel (hébergement, analytics) ;
- Stripe (paiements) ;
- Resend (e-mails).

Le Club en est informé. Un changement substantiel de sous-traitant portant sur des données du Club sera communiqué par un moyen raisonnable (site, e-mail ou conditions).

## 5. Transferts internationaux

La base principale Supabase est indiquée comme située en Suisse selon la configuration actuelle (preuve de région à conserver par Obillz). Vercel, Stripe et Resend **peuvent traiter des données hors de Suisse**. Le Club en prend acte. Obillz ne garantit pas que toutes les données restent en Suisse.

## 6. Droits des personnes

Le Club est le point de contact principal pour les demandes d’accès, de rectification, de suppression, d’opposition (y compris marketing) relatives à ses membres et contacts. Obillz **assiste** le Club, dans la mesure raisonnable des fonctionnalités du produit et d’un traitement manuel via contact@obillz.com.

## 7. Assistance

Sur demande écrite du Club, Obillz fournit les informations raisonnablement nécessaires pour démontrer le respect du présent accord (mesures de sécurité de haut niveau, liste des sous-traitants, aide aux demandes de personnes).

## 8. Incidents

Obillz informe le Club sans retard injustifié après avoir pris connaissance d’une violation de données personnelles concernant les données du Club, avec les éléments alors disponibles (nature, données/clubs potentiellement concernés, mesures). Le Club évalue, en tant que responsable, l’information des personnes et une éventuelle notification au PFPDT. Obillz coopère.

## 9. Conservation, fin de contrat — retour et suppression

Purge automatique limitée aux données opérationnelles temporaires : invitations expirées ou annulées (90 jours), clés d’idempotence (30 jours), journaux d’audit (12 mois), historique d’e-mails déjà soft-deleted (30 jours), jetons publics de planning (désactivation à la date de l’événement, suppression 90 jours après).

Les factures, pièces comptables, transactions, commandes boutique, membres, paiements Stripe et données pouvant être nécessaires légalement ou contractuellement **ne sont pas purgés automatiquement**. Les documents et pièces comptables restent documentés à 10 ans. Pour ces catégories : conservation gérée manuellement selon la finalité et les obligations légales jusqu’à automatisation future.

À la fin du contrat, le Club peut exporter ses données via le service tant que l’accès est ouvert. Sur instruction écrite, Obillz supprime ou restitue les données du Club dans un délai raisonnable, **sauf** conservation imposée par le droit (notamment pièces comptables) ou copies de sauvegarde jusqu’à leur rotation.

## 10. Responsabilité du Club

Le Club garantit la **licéité** de ses traitements : bases pour collecter les données (y compris AVS et dates de naissance), **imports** (fichiers membres, listes e-mails), et **communications** (campagnes). Un contact ajouté manuellement avec déclaration de base valable (`staff_declared`) reste sous la responsabilité du Club. Obillz n’est pas responsable des collectes ou envois illicites décidés par le Club.

## 11. Droit applicable

Droit suisse. For : domicile de l’exploitant, sous réserve des règles impératives.
