# Politique de conservation — Obillz

Document interne. Dernière mise à jour : 11 septembre 2026.

**Aucune suppression automatique des données comptables n’est mise en place dans le produit.**

Principes :

- données personnelles ordinaires : suppression ou anonymisation lorsqu’elles ne sont plus nécessaires ;
- documents / pièces comptables : **10 ans** lorsqu’ils entrent dans l’obligation comptable ;
- `[À VALIDER]` uniquement lorsqu’une durée opérationnelle précise n’est pas encore tranchée.

| Catégorie | Durée | Justification | Méthode de suppression |
| --- | --- | --- | --- |
| Compte utilisateur / memberships | Durée du compte, puis suppression/anonymisation lorsqu’ils ne sont plus nécessaires `[À VALIDER]` le délai opérationnel après clôture | Accès au service | Manuel (DSAR / clôture de compte) |
| Données membres (`clients`) | Suppression ou anonymisation lorsqu’elles ne sont plus nécessaires à la gestion du club `[À VALIDER]` le délai club | Effectif | Outils club + procédure manuelle `contact@obillz.com` |
| AVS | Aussi courte que possible ; dès que plus nécessaire `[À VALIDER]` | Donnée sensible | Suppression manuelle (désactiver le champ ne l’efface pas) |
| Cotisations, factures, devis, paiements (pièces comptables) | **10 ans** | Obligation comptable | **Pas de job automatique** ; conservation puis archivage/export |
| Boutique (commandes constitutives de pièces comptables) | **10 ans** | Obligation comptable si vente | Soft-delete produit ≠ purge commande |
| Inscriptions événements / buvette (hors compta) | Lorsqu’elles ne sont plus nécessaires `[À VALIDER]` | Organisation | Suppression staff ; pas de purge auto |
| Planning / affectations | Lorsqu’elles ne sont plus nécessaires `[À VALIDER]` | Organisation interne | Suppression manuelle |
| Contacts marketing | Jusqu’à opposition / désinscription, puis suppression lorsqu’ils ne sont plus nécessaires `[À VALIDER]` | Opt-in | `unsubscribed` ; suppression de ligne staff |
| Logs d’audit / IP | Lorsqu’ils ne sont plus nécessaires à la sécurité `[À VALIDER]` | Sécurité, incidents | Pas de purge auto aujourd’hui |
| Fichiers Storage liés à un objet métier | Aligné à l’objet (10 ans si pièce comptable) | Preuve / illustration | Suppression à la suppression de l’objet (dépense, visuel, produit) ; orphelins historiques non scannés |
| Brouillons localStorage | 72 h + vidage à la déconnexion | Confort de saisie | TTL + `clearAllLocalDrafts` |
| Abonnement Stripe / factures Obillz | **10 ans** | Comptabilité de l’exploitant | Conservé chez Stripe + exports |

En cas de fin de contrat club : restitution/export puis suppression des données ordinaires sur demande, **sauf** pièces comptables à conserver 10 ans.
