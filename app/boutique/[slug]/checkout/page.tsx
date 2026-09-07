"use client";

import { Suspense, use } from "react";
import PublicCheckoutForm from "@/components/shop/public/PublicCheckoutForm";

function CheckoutFallback() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#F4F7FB] text-sm text-[#64748B]">
      Chargement du checkout…
    </div>
  );
}

export default function PublicCheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <PublicCheckoutForm slug={slug} />
    </Suspense>
  );
}
