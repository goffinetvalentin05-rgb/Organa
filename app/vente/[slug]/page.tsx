import { Suspense } from "react";
import type { Metadata } from "next";
import PublicSupportSaleClient from "@/components/support-sales/public/PublicSupportSaleClient";
import { isValidSupportSaleSlug } from "@/lib/support-sales/slug";
import { loadPublicSupportSale } from "@/lib/support-sales/public";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isValidSupportSaleSlug(slug)) return { title: "Vente de soutien" };
  try {
    const sale = await loadPublicSupportSale(slug);
    if (!sale) return { title: "Vente de soutien" };
    return { title: `${sale.name} — ${sale.clubName}` };
  } catch {
    return { title: "Vente de soutien" };
  }
}

export default async function PublicVentePage({
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
      <PublicSupportSaleClient slug={slug} />
    </Suspense>
  );
}
