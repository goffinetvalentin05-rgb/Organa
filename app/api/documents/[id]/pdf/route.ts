import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url);

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

  // Rediriger vers la nouvelle route (utiliser NextResponse.redirect() pour les route handlers)
  return NextResponse.redirect(new URL(`/api/pdf/${type}/${action}?id=${params.id}`, req.url));
}

