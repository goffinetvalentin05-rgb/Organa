import { Suspense } from "react";
import MembershipPayClient from "@/components/quotes/MembershipPayClient";

export default async function CotisationPayPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#F4F7FB] text-sm text-[#64748B]">
          Chargement…
        </div>
      }
    >
      <MembershipPayClient token={token} mode="pay" />
    </Suspense>
  );
}
