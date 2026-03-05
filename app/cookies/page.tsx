import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookies Settings | Obillz",
  description: "Gestion des cookies Obillz.",
};

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-14 text-slate-900 md:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight">Cookies Settings</h1>
        <div className="mt-8 space-y-8 text-slate-600">
          <section>
            <h2 className="text-xl font-semibold text-slate-900">Qu&apos;est-ce qu&apos;un cookie</h2>
            <p className="mt-3 leading-relaxed">
              Un cookie est un petit fichier depose sur votre appareil lors de la navigation sur un
              site. Il permet de conserver certaines informations pour faciliter votre experience.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              Pourquoi nous utilisons des cookies
            </h2>
            <p className="mt-3 leading-relaxed">Nous utilisons des cookies pour :</p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>ameliorer l&apos;experience utilisateur</li>
              <li>analyser l&apos;utilisation du site</li>
              <li>memoriser certaines preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">Cookies necessaires</h2>
            <p className="mt-3 leading-relaxed">
              Ces cookies sont indispensables au fonctionnement du site et ne peuvent pas etre
              desactives sans impacter certaines fonctionnalites essentielles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">Cookies analytiques</h2>
            <p className="mt-3 leading-relaxed">
              Ces cookies nous aident a comprendre comment le site est utilise afin d&apos;ameliorer
              les contenus, les parcours et les performances globales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">Gestion des cookies</h2>
            <p className="mt-3 leading-relaxed">
              Vous pouvez gerer les cookies a tout moment depuis les reglages de votre navigateur.
              Vous pouvez les accepter, les refuser ou les supprimer selon vos preferences.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
