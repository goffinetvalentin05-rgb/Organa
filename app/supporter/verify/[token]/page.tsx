import { getVerifyByToken } from "@/lib/supporters/public";
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

  const copy =
    result.outcome === "valid"
      ? { title: "SUPPORTER VALIDE", icon: "✓", color: "#059669", bg: "#ecfdf5" }
      : result.outcome === "expired"
        ? { title: "CARTE EXPIRÉE", icon: "⚠", color: "#d97706", bg: "#fffbeb" }
        : result.outcome === "disabled"
          ? { title: "CARTE DÉSACTIVÉE", icon: "✕", color: "#e11d48", bg: "#fff1f2" }
          : { title: "CARTE INVALIDE", icon: "✕", color: "#e11d48", bg: "#fff1f2" };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#F4F7FB] px-4 py-10">
      <div className="w-full max-w-md rounded-[1.5rem] bg-white p-8 text-center shadow-sm">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl"
          style={{ backgroundColor: copy.bg, color: copy.color }}
        >
          {copy.icon}
        </div>
        <h1 className="mt-5 text-xl font-semibold tracking-wide" style={{ color: copy.color }}>
          {copy.title}
        </h1>
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
        ) : (
          <p className="mt-4 text-sm text-[#64748B]">Ce QR code n’est pas reconnu.</p>
        )}
      </div>
    </div>
  );
}
