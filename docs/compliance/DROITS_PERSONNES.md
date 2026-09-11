# Droits des personnes — procédure initiale

Document interne. Dernière mise à jour : 11 septembre 2026.

Canal unique pour démarrer : **contact@obillz.com**.

Cette procédure est **manuelle**. Elle n’est pas un portail self-service.

## Principes

- Distinguer **compte Obillz** (Obillz responsable) et **données d’un club** (club responsable, Obillz sous-traitant).
- Vérifier l’identité du demandeur avant export ou suppression.
- Ne pas retirer des pièces comptables uniquement parce qu’une personne le demande si une obligation de conservation s’applique ; expliquer et anonymiser si possible.
- Délai interne cible : accusé sous 7 jours, réponse de fond sous 30 jours `[À VALIDER]`.

## Accès

Confirmer le périmètre (compte vs club). Lister les données détenues. Fournir une synthèse claire.

## Export

Fichier structuré (CSV/JSON) des champs pertinents. Pour un club : l’export peut être fait par le staff dans le produit (membres, etc.) ; Obillz assiste si le club ne peut pas.

## Rectification

Corriger les champs inexacts (compte : Auth/profil ; métier : fiche membre / contact).

## Suppression

Compte : clôture + suppression ou anonymisation des identifiants.  
Métier : le club décide ; Obillz exécute sur instruction du club si le produit ne suffit pas.

## Anonymisation

Lorsque la suppression totale n’est pas possible (factures), remplacer nom/e-mail par un identifiant neutre tout en gardant les montants.

## Opposition marketing

Vérifier `unsubscribed` / lien `/desinscription/[token]`. S’assurer que le contact n’entre plus dans les campagnes (`consented_at` / `unsubscribed`). Ne pas recréer le contact sans nouvelle base.

## Mineurs / AVS

Traiter avec une attention accrue. Pas de module dédié mineurs à ce stade : escalader à l’exploitant.
