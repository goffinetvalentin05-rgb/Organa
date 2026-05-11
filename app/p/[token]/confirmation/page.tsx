import { Suspense } from "react";
import { PublicPlanningConfirmationClient } from "./confirmation-client";

export default function PublicPlanningConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 py-12 px-4">
          <div className="max-w-lg mx-auto text-center text-slate-600 text-sm">Chargement…</div>
        </div>
      }
    >
      <PublicPlanningConfirmationClient />
    </Suspense>
  );
}
