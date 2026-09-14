import { Suspense } from "react";
import PublicSupportersSuccessClient from "@/components/supporters/public/PublicSupportersSuccessClient";

export default async function ClubSupportersSuccessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#F4F7FB] text-sm text-[#64748B]">
          Chargement…
        </div>
      }
    >
      <PublicSupportersSuccessClient slug={slug} />
    </Suspense>
  );
}
