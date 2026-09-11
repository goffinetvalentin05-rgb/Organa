# Procédure incident / violation de données — Obillz

Document interne. Dernière mise à jour : 11 septembre 2026.

Objectif : réagir vite, documenter, informer les clubs concernés, et évaluer si une notification au PFPDT est nécessaire. Pas de délai légal unique recopiée ici : **évaluer au cas par cas** (LPD : notification si la violation est susceptible d’entraîner un risque élevé).

## 1. Détecter

Signalement interne, alerte prestataire (Supabase, Vercel, Stripe, Resend), ticket support, comportement anormal (accès, export massif, erreur 500 répétée sur données).

## 2. Contenir

Révoquer clés / sessions, rotation des secrets, bloquer un endpoint, mettre un compte en pause, retirer un fichier public. Ne pas détruire les preuves.

## 3. Identifier les données et les clubs

Quelles tables / buckets / e-mails ? Combien de clubs ? Données sensibles (AVS, IBAN, e-mails, paiements) ? Périmètre temporel.

## 4. Documenter

Journal : date de découverte, description, mesures, personnes informées, pièces jointes. Conserver ce journal même si l’incident s’avère mineur.

## 5. Prévenir les clubs concernés

Si des données métier d’un club sont touchées, informer le contact club (e-mail compte / contact@ si besoin) avec : nature, données concernées autant que possible, mesures, conseils (changement de mot de passe, vigilance phishing).

## 6. Évaluer le risque

Critères : sensibilité (AVS, mineurs, paiements), volume, identifiabilité, malveillance, données déjà publiques ou non, mesures d’atténuation.

## 7. Notification PFPDT

Si le risque pour les personnes est élevé, préparer une notification au Préposé fédéral (PFPDT). En cas de doute, consulter un conseil. Informer aussi les personnes si le risque pour elles le justifie (souvent via le club responsable).

## 8. Corriger

Correctif produit, revue des accès, post-mortem court, mise à jour de ce dossier si la procédure doit changer.

Contact interne d’escalade : contact@obillz.com (Valentin Goffinet).
