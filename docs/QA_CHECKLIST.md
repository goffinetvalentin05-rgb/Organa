# Checklist QA — Obillz (avant mise en production)

Utiliser cette liste avant de valider une version déployée (ex. merge sur `main`, déploiement Vercel).  
Les **tests automatisés** couvrent une partie des flux critiques : `npm run test` (voir aussi `npm run predeploy`).

---

## Commandes pré-déploiement

```bash
npm run lint
npm run test
npm run build
```

Équivalent raccourci : `npm run predeploy` (lint + tests + build).

- **`npm run test:e2e`** : message informatif uniquement — les tests E2E navigateur (Playwright, etc.) ne sont pas encore branchés ; compléter avec les sections manuelles ci-dessous.

---

## Module Plannings

- [ ] Créer un planning (titre, date générale, statut).
- [ ] Ajouter plusieurs créneaux sur la **même** journée.
- [ ] Ajouter des créneaux sur **plusieurs jours** (ex. 2026-06-12, 2026-06-13, 2026-06-14, puis d’autres dates).
- [ ] Modifier **uniquement le titre** : vérifier en base que `planning_slots.slot_date` et les horaires/capacités/notes des créneaux sont **inchangés**.
- [ ] Modifier **uniquement la description** générale : idem, aucun créneau modifié.
- [ ] Modifier **uniquement la date générale** (`plannings.date`) : vérifier que **chaque** `planning_slots.slot_date` reste identique (grille multi-jours).
- [ ] Affecter un **membre** interne à un créneau : le créneau ne change pas de date.
- [ ] Retirer une affectation : les `slot_date` inchangés.
- [ ] **Lien public** : ouvrir le lien, vérifier date affichée sous le titre (si prévu), dates par créneau, notes, inscription bénévole sur **un** créneau sans altérer les autres.
- [ ] **Lien public** : confirmation après inscription cohérente.
- [ ] Générer le **PDF** planning : en-tête = date générale ; lignes = dates des créneaux ; titres, horaires, capacités, affectations corrects.
- [ ] **PDF** : aucune donnée modifiée en base après téléchargement (lecture seule).
- [ ] Lien public **mobile** et **desktop** (lisibilité, scroll, boutons).

---

## Module Factures (`documents` type `invoice`)

- [ ] Créer une facture : numéro auto, titre, montants, client lié, statut initial.
- [ ] Modifier **uniquement le titre** : montant et lignes inchangés si non renvoyés.
- [ ] Modifier le **numéro / référence** : statut inchangé ; unicité au sein du **club** (conflit attendu si doublon même type).
- [ ] Modifier une **échéance** : client inchangé.
- [ ] Générer / régénérer le **PDF** : cohérence avec l’écran et le numéro à jour.
- [ ] Marquer une facture **payée** et vérifier l’**encaissement** / date de paiement affichée.

---

## Module Cotisations (`documents` type `quote`)

- [ ] Création : numéro (préfixe COT), membre lié, statut, montants.
- [ ] Modification titre / numéro / échéances : mêmes principes que factures.
- [ ] PDF et affichage liste / détail.

---

## Module Multi-club (isolation)

- [ ] Créer **deux clubs de test** (deux comptes ou bénévolat + invitation).
- [ ] Vérifier qu’aucun club ne voit plannings / factures / cotisations / membres / sponsoring / charges / revenus / événements de l’autre.
- [ ] Tenter d’accéder à une URL API avec un ID connu d’un **autre** club (403 / 404 attendu).
- [ ] **Liens publics** : token d’un club ne révèle pas un planning d’un autre club.

---

## Module Emails (Resend)

- [ ] Déclencher un envoi (affectation planning, campagne test, etc.).
- [ ] Vérifier la **réception** et le contenu (club, pas de fuite de données).
- [ ] En cas d’erreur API Resend : message utilisateur / logs sans exposer de secrets.

---

## Fichiers & médias

- [ ] Logo club (upload, affichage PDF / factures).
- [ ] Pièces jointes documents / événements si applicable.
- [ ] URLs **signées** ou bucket : accès refusé sans token valide.

---

## Données sensibles (non-régression « effets de bord »)

Pour chaque action, vérifier rapidement qu’aucune table non concernée n’a bougé (audit rapide ou staging) :

- [ ] Archiver / supprimer un membre (selon le flux produit).
- [ ] Modifier un membre.
- [ ] Créer une cotisation.
- [ ] Générer une facture.
- [ ] Marquer payée.
- [ ] Créer une charge.
- [ ] Joindre un fichier.
- [ ] Créer un événement.
- [ ] Créer un planning lié à un événement.
- [ ] Envoyer un email.
- [ ] Générer un PDF.

---

## Revue statique — requêtes et mutations (équipe)

Points d’attention lors des **code reviews** (complément aux tests) :

- Tout `UPDATE` / `DELETE` sur données club doit inclure un filtre **`user_id` / `club_id`** cohérent avec le guard RBAC, sauf cas explicitement justifié (ex. mise à jour par `id` déjà résolu via jointure sécurisée).
- **Ne jamais** propager `plannings.date` vers `planning_slots.slot_date` lors d’un simple édit du planning (déjà couvert par l’API PUT planning + tests).
- Éviter les mises à jour « globales » sur `planning_slots`, `documents`, `planning_assignments` sans ciblage `planning_id` / `id` / club.
- Préférer les **transactions** lorsque plusieurs tables doivent rester cohérentes (création planning + slots, paiements, etc.).
- Les mises à jour `member_participations` synchronisées depuis un planning ne doivent pas réécrire arbitrairement les dates métier des bénévoles (voir commentaires dans `lib/planning/memberParticipations.ts`).

---

## Après déploiement (smoke)

- [ ] Connexion, changement de club si multi-club.
- [ ] Ouverture tableau de bord et d’une page planning + une facture.
- [ ] Vérifier les logs Vercel / Supabase en cas d’erreur 5xx.
