import { getVerifyByToken } from "@/lib/supporters/public";
import SupportersClubMark from "@/components/supporters/public/SupportersClubMark";
import { getClubBrandPalette } from "@/lib/public-page/colors";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vérification supporter",
  robots: { index: false, follow: false },
};

export default async function SupporterVerifyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getVerifyByToken(token);
  const palette = getClubBrandPalette(result.primaryColor);

  const copy =
    result.outcome === "valid"
      ? { title: "Supporter valide", hint: "Cette carte est active.", color: "#059669", bg: "#ecfdf5" }
      : result.outcome === "expired"
        ? { title: "Carte expirée", hint: "La période de validité est terminée.", color: "#d97706", bg: "#fffbeb" }
        : result.outcome === "disabled"
          ? { title: "Carte désactivée", hint: "Cette carte n’est plus active.", color: "#e11d48", bg: "#fff1f2" }
          : { title: "Carte invalide", hint: "Ce QR code n’est pas reconnu.", color: "#e11d48", bg: "#fff1f2" };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 py-10" style={{ background: palette.pageBackground }}>
      <div className="w-full max-w-md rounded-[1.75rem] border border-[rgba(15,23,42,0.06)] bg-white p-8 text-center shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
        {result.clubName ? (
          <div className="mb-5">
            <SupportersClubMark
              logoUrl={result.logoUrl}
              clubName={result.clubName}
              accentColor={result.primaryColor}
              size="sm"
              tone="light"
            />
          </div>
        ) : null}
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl font-semibold"
          style={{ backgroundColor: copy.bg, color: copy.color }}
        >
          {result.outcome === "valid" ? "✓" : result.outcome === "expired" ? "!" : "✕"}
        </div>
        <h1 className="mt-5 text-xl font-semibold tracking-tight" style={{ color: copy.color }}>
          {copy.title}
        </h1>
        <p className="mt-2 text-sm text-[#64748B]">{copy.hint}</p>
        {result.outcome !== "invalid" ? (
          <div className="mt-6 space-y-1 text-[#0F172A]">
            <p className="text-lg font-semibold">
              {result.firstName} {result.lastName}
            </p>
            <p className="text-sm text-[#64748B]">{result.offerName}</p>
            {result.supporterNumber ? (
              <p className="text-sm font-medium tabular-nums">{result.supporterNumber}</p>
            ) : null}
            <p className="text-sm text-[#64748B]">{result.clubName}</p>
            {result.endDateLabel ? (
              <p className="pt-3 text-sm text-[#64748B]">
                Valable jusqu’au
                <br />
                <span className="font-semibold text-[#0F172A]">{result.endDateLabel}</span>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
