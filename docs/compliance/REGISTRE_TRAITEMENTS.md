# Registre des traitements — Obillz

Document interne. Dernière mise à jour : 11 septembre 2026.

Responsable plateforme (compte, abonnement, sécurité, site) : **Obillz, exploité par Valentin Goffinet**.  
Pour les données métier d’un club : **le club est responsable** ; Obillz est sous-traitant.

Contact : contact@obillz.com

| Traitement | Responsable | Finalité | Catégories de données | Personnes concernées | Destinataires | Lieu / prestataires | Conservation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Membres | Club | Gestion de l’effectif | Identité, coordonnées, rôle, éventuellement DOB, AVS si activé | Membres / licenciés | Staff du club, Obillz (hébergement) | Supabase (CH selon config actuelle — preuve à conserver) ; app Vercel | Suppression/anonymisation lorsqu’elles ne sont plus nécessaires — RETENTION |
| Utilisateurs (comptes) | Obillz | Accès au service, rôles | E-mail, identifiants, MFA, memberships | Staff / propriétaires de club | Obillz, Supabase Auth | Supabase, Vercel | Durée du compte puis suppression/anonymisation — `[À VALIDER]` délai après clôture |
| Cotisations | Club | Encaissement des cotisations | Montants, statuts, liens de paiement, jetons | Membres payeurs | Club, Stripe, Obillz | Stripe (peut être hors CH), Supabase | **10 ans** (pièces comptables) — pas de purge auto |
| Factures / devis | Club | Comptabilité club | Destinataires, lignes, PDF, QR | Membres, tiers facturés | Club, Obillz | Supabase, Vercel | **10 ans** (pièces comptables) — pas de purge auto |
| Boutique | Club | Vente de produits | Commandes, produits, images, coordonnées commande | Acheteurs | Club, Stripe le cas échéant | Supabase Storage, Stripe | **10 ans** si pièce comptable ; sinon lorsqu’elles ne sont plus nécessaires |
| Événements | Club | Inscriptions et organisation | Identité, e-mail, téléphone, commentaires | Participants | Club ; marketing seulement si opt-in | Supabase | [À VALIDER] |
| Planning | Club | Affectation de créneaux | Identité des bénévoles / membres assignés | Bénévoles, membres | Club | Supabase | [À VALIDER] — n’alimente pas le marketing |
| Buvette | Club | Réservation de dates | Identité, e-mail, téléphone, type d’événement | Demandeurs externes | Club ; marketing seulement si opt-in | Supabase, Resend | [À VALIDER] |
| Marketing | Club | Communications e-mail | E-mail, nom, preuve d’opt-in, désinscription | Contacts ayant consenti ou déclarés par le staff | Club, Resend | Resend (peut être hors CH) | Jusqu’à opposition / [À VALIDER] |
| Sponsors | Club | Contrats et suivi | Identité, coordonnées, montants | Sponsors | Club | Supabase | [À VALIDER] |
| PV (procès-verbaux) | Club | Gouvernance | Contenu des séances, participants | Membres du comité | Club | Supabase | [À VALIDER] |
| Logs / sécurité | Obillz | Traçabilité, abus, incidents | Horodatage, action, ressource, parfois IP | Utilisateurs, parfois visiteurs publics | Obillz | Supabase, Vercel | [À VALIDER] |
| Abonnement SaaS | Obillz | Facturation du logiciel | E-mail, plan, IDs Stripe | Clients Obillz (clubs) | Stripe, Obillz | Stripe (international possible) | **10 ans** (comptabilité exploitant) |

Les listes ci-dessus sont opérationnelles, pas exhaustives à l’octet près. Mettre à jour ce registre lors d’un nouveau module collectant des données personnelles.
