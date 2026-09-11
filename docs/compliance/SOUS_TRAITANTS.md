# Sous-traitants — Obillz

Document interne. Dernière mise à jour : 11 septembre 2026.

Obillz recourt à des prestataires pour fournir le service. **Toutes les données ne restent pas nécessairement en Suisse.**

## Supabase

- Rôle : base de données PostgreSQL, authentification, stockage de fichiers, temps réel.
- Données : données métier des clubs, comptes, fichiers (logos, justificatifs, images boutique, etc.).
- Localisation : le propriétaire indique que la **base principale est en Suisse**. **À faire** : conserver une preuve de la région réelle du projet (capture dashboard / contrat / facture). Les régions de stockage ou de fonctions annexes peuvent différer ; à vérifier.

## Vercel

- Rôle : hébergement de l’application Next.js, déploiements, Vercel Analytics.
- Données : requêtes HTTP, logs d’exécution, mesures d’audience (URL masquées pour les jetons).
- Localisation : infrastructure mondiale possible (edge / États-Unis / UE selon routage). Traitement à l’étranger possible.

## Stripe

- Rôle : paiements (abonnements Obillz, paiements clubs selon modules).
- Données : e-mail, montants, identifiants client/paiement ; pas de PAN stocké chez Obillz.
- Localisation : traitement international habituel (y compris hors Suisse). Stripe est responsable / sous-traitant selon le flux (Connect vs facturation Obillz).

## Resend

- Rôle : envoi d’e-mails transactionnels et campagnes marketing du club.
- Données : adresse e-mail, contenu du message, métadonnées d’envoi.
- Localisation : traitement hors Suisse possible.

## Notes

- Ne pas affirmer un hébergement « 100 % Suisse ».
- Compléter ce fichier si un nouveau prestataire (support, monitoring, SMS, etc.) est ajouté.
- Contact prestataires / DPA amont : à classer avec les contrats (hors repo).
