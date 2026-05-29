import fs from "fs";

const locales = ["fr", "en", "de"];
const patches = {
  fr: {
    common: { languageSelector: "Langue" },
    auth: {
      login: {
        badge: "Connexion",
        title: "Bon retour sur Obillz",
        subtitle: "Accédez à votre espace de gestion de club",
        cardTitle: "Identifiants",
        cardSubtitle: "Entrez votre email et votre mot de passe",
        email: "Email",
        password: "Mot de passe",
        submit: "Se connecter",
        forgotPassword: "Mot de passe oublié ?",
        noAccount: "Pas encore de compte ?",
        signUp: "Créer un compte",
        invalidEmail: "Veuillez entrer une adresse email valide",
        passwordMin: "Le mot de passe doit contenir au moins 8 caractères",
        invalidCredentials: "Email ou mot de passe incorrect",
        success: "Connexion réussie !",
        error: "Erreur lors de la connexion",
      },
    },
    dashboard: {
      abonnementPage: {
        title: "Abonnement",
        subtitle: "Un seul plan, toutes les fonctionnalités. Simple et transparent.",
        billingToggleAria: "Choisir la facturation mensuelle ou annuelle",
        monthly: "Mensuel",
        yearly: "Annuel",
        faqTitle: "Questions fréquentes",
        faqDescription: "Tout ce que vous devez savoir avant de vous abonner.",
        checkoutError: "Une erreur est survenue. Veuillez réessayer.",
        statusActive: "Abonnement actif",
        statusTrial: "Période d'essai",
        statusExpired: "Essai terminé",
        subscribe: "S'abonner",
        perMonth: "/mois",
        perYear: "/an",
        faq: [
          {
            q: "Que se passe-t-il après les {days} jours d'essai ?",
            a: "Après {days} jours, votre compte passe en mode lecture seule. Vous pouvez toujours consulter vos données, mais vous ne pouvez plus créer ou modifier d'éléments. Abonnez-vous pour retrouver l'accès complet.",
          },
          {
            q: "Puis-je annuler mon abonnement ?",
            a: "Oui, vous pouvez annuler à tout moment. Votre abonnement restera actif jusqu'à la fin de la période payée. Aucun remboursement partiel n'est effectué.",
          },
          {
            q: "Pourquoi choisir l'annuel ?",
            a: "2 mois offerts par rapport au mensuel — économisez sur la durée.",
          },
        ],
      },
      clients: {
        memberDetail: {
          participationsTitle: "Participations",
          participationsDescription:
            "Historique des plannings / événements (inscription interne, publique reconnue ou rattachement admin).",
        },
      },
      invoices: {
        categoryTags: {
          sponsors: "Sponsors",
          venueRental: "Locations de salle",
          events: "Événements",
          buvette: "Buvette",
        },
      },
      settings: {
        subscriptionActivated: "Abonnement activé avec succès !",
        viewPricing: "Voir les tarifs",
        subscribe: "S'abonner",
      },
    },
  },
  en: {
    common: { languageSelector: "Language" },
    auth: {
      login: {
        badge: "Log in",
        title: "Welcome back to Obillz",
        subtitle: "Access your club management workspace",
        cardTitle: "Credentials",
        cardSubtitle: "Enter your email and password",
        email: "Email",
        password: "Password",
        submit: "Log in",
        forgotPassword: "Forgot password?",
        noAccount: "No account yet?",
        signUp: "Create an account",
        invalidEmail: "Please enter a valid email address",
        passwordMin: "Password must be at least 8 characters",
        invalidCredentials: "Incorrect email or password",
        success: "Logged in successfully!",
        error: "Error while logging in",
      },
    },
    dashboard: {
      abonnementPage: {
        title: "Subscription",
        subtitle: "One plan, all features. Simple and transparent.",
        billingToggleAria: "Choose monthly or yearly billing",
        monthly: "Monthly",
        yearly: "Yearly",
        faqTitle: "Frequently asked questions",
        faqDescription: "Everything you need to know before subscribing.",
        checkoutError: "Something went wrong. Please try again.",
        statusActive: "Active subscription",
        statusTrial: "Trial period",
        statusExpired: "Trial ended",
        subscribe: "Subscribe",
        perMonth: "/month",
        perYear: "/year",
        faq: [
          {
            q: "What happens after the {days}-day trial?",
            a: "After {days} days, your account becomes read-only. You can still view your data but cannot create or edit items. Subscribe to regain full access.",
          },
          {
            q: "Can I cancel my subscription?",
            a: "Yes, anytime. Your subscription stays active until the end of the paid period. No partial refunds.",
          },
          {
            q: "Why choose yearly?",
            a: "2 months free compared to monthly — save over time.",
          },
        ],
      },
      clients: {
        memberDetail: {
          participationsTitle: "Participation",
          participationsDescription:
            "Schedule / event history (internal sign-up, recognised public registration or admin link).",
        },
      },
      invoices: {
        categoryTags: {
          sponsors: "Sponsors",
          venueRental: "Venue hire",
          events: "Events",
          buvette: "Bar",
        },
      },
      settings: {
        subscriptionActivated: "Subscription activated successfully!",
        viewPricing: "View pricing",
        subscribe: "Subscribe",
      },
    },
  },
  de: {
    common: { languageSelector: "Sprache" },
    auth: {
      login: {
        badge: "Anmelden",
        title: "Willkommen zurück bei Obillz",
        subtitle: "Zugang zu Ihrem Vereins-Verwaltungsbereich",
        cardTitle: "Zugangsdaten",
        cardSubtitle: "E-Mail und Passwort eingeben",
        email: "E-Mail",
        password: "Passwort",
        submit: "Anmelden",
        forgotPassword: "Passwort vergessen?",
        noAccount: "Noch kein Konto?",
        signUp: "Konto erstellen",
        invalidEmail: "Bitte gültige E-Mail eingeben",
        passwordMin: "Passwort mindestens 8 Zeichen",
        invalidCredentials: "E-Mail oder Passwort falsch",
        success: "Erfolgreich angemeldet!",
        error: "Fehler bei der Anmeldung",
      },
    },
    dashboard: {
      abonnementPage: {
        title: "Abonnement",
        subtitle: "Ein Tarif, alle Funktionen. Einfach und transparent.",
        billingToggleAria: "Monatliche oder jährliche Abrechnung wählen",
        monthly: "Monatlich",
        yearly: "Jährlich",
        faqTitle: "Häufige Fragen",
        faqDescription: "Alles Wichtige vor dem Abo.",
        checkoutError: "Ein Fehler ist aufgetreten. Bitte erneut versuchen.",
        statusActive: "Aktives Abonnement",
        statusTrial: "Testphase",
        statusExpired: "Test beendet",
        subscribe: "Abonnieren",
        perMonth: "/Monat",
        perYear: "/Jahr",
        faq: [
          {
            q: "Was passiert nach {days} Testtagen?",
            a: "Nach {days} Tagen nur Lesemodus. Daten bleiben sichtbar; Bearbeitung mit Abo.",
          },
          {
            q: "Kann ich kündigen?",
            a: "Ja, jederzeit. Zugang bis Periodenende. Keine Teilrückerstattung.",
          },
          {
            q: "Warum jährlich?",
            a: "2 Monate geschenkt gegenüber monatlich.",
          },
        ],
      },
      clients: {
        memberDetail: {
          participationsTitle: "Teilnahmen",
          participationsDescription:
            "Historie Pläne / Events (interne Anmeldung, öffentliche oder Admin-Zuordnung).",
        },
      },
      invoices: {
        categoryTags: {
          sponsors: "Sponsoren",
          venueRental: "Hallenmiete",
          events: "Events",
          buvette: "Verzehr",
        },
      },
      settings: {
        subscriptionActivated: "Abonnement erfolgreich aktiviert!",
        viewPricing: "Preise ansehen",
        subscribe: "Abonnieren",
      },
    },
  },
};

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    const value = source[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      target[key] =
        target[key] && typeof target[key] === "object" && !Array.isArray(target[key])
          ? deepMerge({ ...target[key] }, value)
          : { ...value };
    } else {
      target[key] = value;
    }
  }
  return target;
}

for (const loc of locales) {
  const path = `lib/i18n/${loc}.json`;
  const json = JSON.parse(fs.readFileSync(path, "utf8"));
  deepMerge(json, patches[loc]);
  fs.writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`);
}

console.log("i18n keys patched");
