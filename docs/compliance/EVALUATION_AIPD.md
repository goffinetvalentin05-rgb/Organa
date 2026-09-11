# Évaluation — analyses d’impact (AIPD)

Document interne. Dernière mise à jour : 11 septembre 2026.

Ceci n’est **pas** une AIPD complète au sens d’un dossier formel (description détaillée, consultation, validation). Une AIPD formelle **peut être nécessaire** selon le volume, le caractère systématique et la sensibilité. Il n’est **pas** certain qu’elle soit inutile.

## AVS

- Collecte **désactivée par défaut**, facultative, avec confirmation à l’activation.
- Stockage en clair si le club active le champ. Risque élevé en cas de fuite (identifiant unique).
- **Recommandation** : AIPD ciblée si de nombreux clubs activent l’AVS ou si l’usage s’étend (exports, recherche, mineurs). Mesures actuelles : masquage API liste, révocation SELECT JWT historique, drafts sans AVS.

## Date de naissance / mineurs potentiels

- DOB facultatif, désactivé par défaut.
- Un club peut enregistrer des mineurs sans workflow parental dédié.
- **Recommandation** : si des clubs gèrent massivement des mineurs, mener une AIPD (base, information des titulaires de l’autorité parentale, durées). Non traité dans le lot actuel.

## Paiements

- Stripe traite les données de paiement. Obillz voit surtout des identifiants, montants, statuts.
- Risque : corrélation compte / paiement, logs.
- **Recommandation** : s’appuyer sur la documentation Stripe ; AIPD Obillz si de nouveaux flux stockent plus de données financières en base.

## Marketing

- Avant correction : contacts créés sans opt-in (événement, buvette) — risque LPD élevé (prospection).
- Après correction : opt-in, preuve, exclusion des anciens contacts non consentants, confirmation staff.
- Risque résiduel : déclaration staff inexacte (responsabilité du club) ; Resend hors Suisse.
- AIPD marketing complète : utile si les campagnes deviennent massives ou profilées (ce n’est pas le cas aujourd’hui).

## Logs / IP

- Audit et rate-limit peuvent retenir une IP.
- Finalité sécurité. Durée de conservation encore `[À VALIDER]`.
- AIPD logs : à envisager si conservation longue ou corrélation fine des parcours.

## Synthèse

Priorité : AVS (si activation large) et mineurs. Les paiements s’appuient sur Stripe. Le marketing a été ramené à un opt-in. Les logs IP restent un point à borner (durée).
