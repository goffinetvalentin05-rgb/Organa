import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function DevisPdfPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ download?: string }>;
}) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : undefined;
  const download = sp?.download === "true";

  redirect(`/api/documents/${id}/pdf?type=quote${download ? "&download=true" : ""}`);
}
