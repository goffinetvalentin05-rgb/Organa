import { Suspense } from "react";
import AbonnementClient from "./AbonnementClient";
import { PageLayout, PageHeader, GlassCard } from "@/components/ui";

export const dynamic = "force-dynamic";

function LoadingFallback() {
  return (
    <PageLayout maxWidth="3xl">
      <PageHeader
        title="Abonnement"
        subtitle="Un seul plan, toutes les fonctionnalités. Simple et transparent."
      />
      <GlassCard padding="lg" className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </GlassCard>
    </PageLayout>
  );
}

export default function AbonnementPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AbonnementClient />
    </Suspense>
  );
}
