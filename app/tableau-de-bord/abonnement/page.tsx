import { Suspense } from "react";
import AbonnementClient from "./AbonnementClient";

export const dynamic = "force-dynamic";

function LoadingFallback() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">Abonnement</h1>
        <p className="mt-2 text-secondary">
          Un seul plan, toutes les fonctionnalités. Simple et transparent.
        </p>
      </div>
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 accent-border-strong"></div>
      </div>
    </div>
  );
}

export default function AbonnementPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AbonnementClient />
    </Suspense>
  );
}
