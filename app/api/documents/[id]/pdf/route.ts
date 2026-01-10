import { redirect } from "next/navigation";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const id = params.id;

  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type"); // "quote" | "invoice"
  const downloadParam = searchParams.get("download"); // "true" | null

  // Mapper les types : quote -> devis, invoice -> facture
  let type: string | null = null;
  if (typeParam === "quote") {
    type = "devis";
  } else if (typeParam === "invoice") {
    type = "facture";
  }

  // Déterminer l'action : download ou preview
  const action = downloadParam === "true" ? "download" : "preview";

  if (!type || !action) {
    return new Response("Missing parameters", { status: 400 });
  }

  return redirect(`/api/pdf/${type}/${action}?id=${id}`);
}
