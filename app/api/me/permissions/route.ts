import { NextResponse } from "next/server";
import { getMyPermissions } from "@/lib/auth/permissions";

export const runtime = "nodejs";

/**
 * GET /api/me/permissions
 *
 * Retourne les permissions effectives de l'utilisateur courant pour son
 * club courant. Le frontend l'utilise pour cacher/afficher les boutons.
 *
 *   { clubId, role, isOwner, permissions: { view_members: true, ... } }
 */
export async function GET() {
  try {
    const data = await getMyPermissions();
    if (!data) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("[API][me/permissions][GET] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error?.message },
      { status: 500 }
    );
  }
}
