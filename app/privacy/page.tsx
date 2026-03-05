import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Obillz",
  description: "Politique de confidentialité Obillz.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-14 text-slate-900 md:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <div className="mt-8 space-y-8 text-slate-600">
          <section>
            <h2 className="text-xl font-semibold text-slate-900">Introduction</h2>
            <p className="mt-3 leading-relaxed">
              Cette politique de confidentialite explique comment Obillz collecte, utilise et
              protege les donnees lorsque vous utilisez notre service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">Donnees collectees</h2>
            <p className="mt-3 leading-relaxed">
              Selon votre usage de la plateforme, nous pouvons collecter les categories de donnees
              suivantes :
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>informations du club</li>
              <li>emails</li>
              <li>donnees des membres</li>
              <li>statistiques d&apos;utilisation du service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">Utilisation des donnees</h2>
            <p className="mt-3 leading-relaxed">
              Les donnees sont utilisees pour fournir les fonctionnalites du service, ameliorer
              l&apos;experience utilisateur, assurer le support client et garantir le bon
              fonctionnement de la plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">Stockage et securite</h2>
            <p className="mt-3 leading-relaxed">
              Nous mettons en place des mesures techniques et organisationnelles pour proteger vos
              donnees contre les acces non autorises, la perte, l&apos;alteration ou la divulgation
              indebite.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">Cookies</h2>
            <p className="mt-3 leading-relaxed">
              Le service peut utiliser des cookies pour faciliter la navigation, memoriser certaines
              preferences et analyser l&apos;utilisation du site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">Partage des donnees</h2>
            <p className="mt-3 leading-relaxed">
              Nous ne partageons les donnees qu&apos;avec des prestataires necessaires au
              fonctionnement du service ou lorsque la loi l&apos;exige.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">Vos droits</h2>
            <p className="mt-3 leading-relaxed">
              Vous pouvez demander l&apos;acces, la rectification ou la suppression de vos donnees,
              ainsi que vous opposer a certains traitements dans les conditions prevues par la
              reglementation applicable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
            <p className="mt-3 leading-relaxed">
              Pour toute question concernant la confidentialite des donnees, vous pouvez nous
              contacter a l&apos;adresse suivante :
            </p>
            <p className="mt-2">
              <a className="font-medium text-slate-900 hover:underline" href="mailto:contact@obillz.com">
                contact@obillz.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
