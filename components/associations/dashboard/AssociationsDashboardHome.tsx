import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  FileText,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import styles from "./associations-dashboard.module.css";

type AssociationsDashboardHomeProps = {
  orgName: string;
  userLabel: string;
  hasLogo: boolean;
};

const overviewCards = [
  {
    title: "Membres",
    href: "/associations/espace/membres",
    icon: Users,
    tone: "bg-[#ed7059]/12 text-[#ed7059]",
  },
  {
    title: "Cotisations",
    href: "/associations/espace/cotisations",
    icon: Wallet,
    tone: "bg-[#7f9c88]/18 text-[#4f6b58]",
  },
  {
    title: "Documents",
    href: "/associations/espace/documents",
    icon: FileText,
    tone: "bg-[#17211d]/8 text-[#17211d]",
  },
  {
    title: "Événements",
    href: "/associations/espace/evenements",
    icon: Calendar,
    tone: "bg-[#ed7059]/10 text-[#c84f3b]",
  },
] as const;

const quickActions = [
  { label: "Ajouter un membre", href: "/associations/espace/membres" },
  { label: "Ajouter un document", href: "/associations/espace/documents" },
  { label: "Créer un événement", href: "/associations/espace/evenements" },
  { label: "Gérer les cotisations", href: "/associations/espace/cotisations" },
] as const;

const setupSteps = [
  {
    label: "Compléter les informations",
    href: "/associations/espace/parametres",
    doneKey: "info" as const,
  },
  {
    label: "Ajouter les premiers membres",
    href: "/associations/espace/membres",
    doneKey: "members" as const,
  },
  {
    label: "Importer les documents",
    href: "/associations/espace/documents",
    doneKey: "docs" as const,
  },
  {
    label: "Préparer les cotisations",
    href: "/associations/espace/cotisations",
    doneKey: "dues" as const,
  },
];

export default function AssociationsDashboardHome({
  orgName,
  userLabel,
  hasLogo,
}: AssociationsDashboardHomeProps) {
  const setupDone = {
    info: Boolean(orgName && orgName !== "Votre association"),
    members: false,
    docs: false,
    dues: false,
  };

  return (
    <div className="space-y-8">
      <section className={`${styles.cardSoft} relative overflow-hidden p-6 sm:p-8`}>
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#ed7059]/15 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-[#7f9c88]/20 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#ed7059]/20 bg-white/70 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#b84e3a]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Obillz Associations
          </p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.045em] text-[#17211d] sm:text-4xl">
            Bonjour{userLabel ? `, ${userLabel.split(" ")[0]}` : ""}, bienvenue sur Obillz
          </h2>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-[#66736d] sm:text-base">
            Voici un aperçu de votre association{" "}
            <span className="font-extrabold text-[#17211d]">{orgName}</span>.
          </p>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold tracking-[-0.03em] text-[#17211d]">
              Vue d’ensemble
            </h3>
            <p className="mt-1 text-sm font-medium text-[#66736d]">
              Les indicateurs métier arriveront avec les modules.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {overviewCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className={`${styles.card} group p-5 transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(23,33,29,0.07)]`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${card.tone}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#9aa49e] transition group-hover:translate-x-0.5 group-hover:text-[#ed7059]" />
                </div>
                <p className="mt-5 text-sm font-extrabold text-[#17211d]">{card.title}</p>
                <p className={styles.statValue}>—</p>
                <p className="mt-1 text-xs font-semibold text-[#9aa49e]">Bientôt disponible</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className={`${styles.card} p-5 sm:p-6`}>
          <h3 className="text-lg font-extrabold tracking-[-0.03em] text-[#17211d]">
            Actions rapides
          </h3>
          <p className="mt-1 text-sm font-medium text-[#66736d]">
            Accédez directement aux prochains modules.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => (
              <Link
                key={action.href + action.label}
                href={action.href}
                className="rounded-2xl border border-[#17211d]/8 bg-[#fbfaf6] px-4 py-3.5 text-sm font-extrabold text-[#17211d] transition hover:border-[#ed7059]/25 hover:bg-white"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        <div className={`${styles.card} p-5 sm:p-6`}>
          <h3 className="text-lg font-extrabold tracking-[-0.03em] text-[#17211d]">
            Activité récente
          </h3>
          <div className={`${styles.emptyState} mt-4`}>
            <p className="text-base font-extrabold text-[#17211d]">Aucune activité pour le moment</p>
            <p className="mt-2 max-w-sm text-sm font-medium text-[#66736d]">
              Dès que vous ajouterez des membres, documents ou événements, leur activité
              apparaîtra ici.
            </p>
          </div>
        </div>
      </section>

      <section className={`${styles.card} p-5 sm:p-6`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-extrabold tracking-[-0.03em] text-[#17211d]">
              Configurez votre espace
            </h3>
            <p className="mt-1 text-sm font-medium text-[#66736d]">
              Quelques étapes pour préparer votre association.
            </p>
          </div>
          {!hasLogo ? (
            <p className="text-xs font-bold text-[#b84e3a]">Astuce : ajoutez bientôt votre logo</p>
          ) : null}
        </div>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2">
          {setupSteps.map((step, index) => {
            const done = setupDone[step.doneKey];
            return (
              <li key={step.href}>
                <Link
                  href={step.href}
                  className="flex items-start gap-3 rounded-2xl border border-[#17211d]/8 bg-white/70 px-4 py-3.5 transition hover:border-[#ed7059]/25"
                >
                  <span
                    className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold ${
                      done
                        ? "bg-[#7f9c88]/25 text-[#3f5a47]"
                        : "bg-[#ed7059]/12 text-[#ed7059]"
                    }`}
                  >
                    {done ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-extrabold text-[#17211d]">
                      {step.label}
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold text-[#9aa49e]">
                      {done ? "Complété" : "À faire"}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
