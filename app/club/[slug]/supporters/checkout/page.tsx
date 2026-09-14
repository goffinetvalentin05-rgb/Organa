import { Suspense } from "react";
import PublicSupportersCheckoutClient from "@/components/supporters/public/PublicSupportersCheckoutClient";

export default async function ClubSupportersCheckoutPage({
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
      <PublicSupportersCheckoutClient slug={slug} />
    </Suspense>
  );
}
