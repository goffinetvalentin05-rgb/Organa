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
        <p className="mt-4 text-slate-600">
          Cette page sera complétée prochainement avec les informations détaillées de
          confidentialité.
        </p>
      </div>
    </main>
  );
}
