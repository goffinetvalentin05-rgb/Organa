import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

interface PublicPlanningLinkRow {
  id: string;
  token: string;
  active: boolean;
  created_at: string;
  require_name: boolean;
  require_email: boolean;
}

function generatePublicToken() {
  return randomBytes(24).toString("base64url");
}

function resolveBaseUrl(request: NextRequest) {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  return request.nextUrl.origin;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: planningId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: planning } = await supabase
      .from("plannings")
      .select("id")
      .eq("id", planningId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!planning) {
      return NextResponse.json({ error: "Planning non trouvé" }, { status: 404 });
    }

    const { data: link } = await supabase
      .from("public_planning_links")
      .select("id, token, active, created_at, require_name, require_email")
      .eq("planning_id", planningId)
      .eq("club_id", user.id)
      .maybeSingle();

    if (!link) {
      return NextResponse.json({ publicLink: null }, { status: 200 });
    }

    const baseUrl = resolveBaseUrl(request);
    return NextResponse.json(
      {
        publicLink: {
          id: link.id,
          token: link.token,
          active: link.active,
          createdAt: link.created_at,
          requireName: link.require_name,
          requireEmail: link.require_email,
          path: `/p/${link.token}`,
          url: `${baseUrl}/p/${link.token}`,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : undefined;
    return NextResponse.json(
      { error: "Erreur lors du chargement du lien public", details },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: planningId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: planning } = await supabase
      .from("plannings")
      .select("id")
      .eq("id", planningId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!planning) {
      return NextResponse.json({ error: "Planning non trouvé" }, { status: 404 });
    }

    const body: { requireName?: boolean; requireEmail?: boolean } = await request
      .json()
      .catch(() => ({}));
    const requireName = body?.requireName !== false;
    const requireEmail = body?.requireEmail === true;

    const { data: existing } = await supabase
      .from("public_planning_links")
      .select("id, token, active, created_at, require_name, require_email")
      .eq("planning_id", planningId)
      .eq("club_id", user.id)
      .maybeSingle();

    let linkData: PublicPlanningLinkRow | null = existing;
    if (!existing) {
      let created: PublicPlanningLinkRow | null = null;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const token = generatePublicToken();
        const { data, error } = await supabase
          .from("public_planning_links")
          .insert({
            planning_id: planningId,
            token,
            club_id: user.id,
            active: true,
            require_name: requireName,
            require_email: requireEmail,
          })
          .select("id, token, active, created_at, require_name, require_email")
          .maybeSingle();

        if (!error && data) {
          created = data;
          break;
        }
      }

      if (!created) {
        return NextResponse.json(
          { error: "Impossible de générer un lien public" },
          { status: 500 }
        );
      }

      linkData = created;
    } else {
      const { data: updated, error: updateError } = await supabase
        .from("public_planning_links")
        .update({
          active: true,
          require_name: requireName,
          require_email: requireEmail,
        })
        .eq("id", existing.id)
        .select("id, token, active, created_at, require_name, require_email")
        .single();

      if (updateError || !updated) {
        return NextResponse.json(
          { error: "Impossible de mettre à jour le lien public" },
          { status: 500 }
        );
      }

      linkData = updated;
    }

    if (!linkData) {
      return NextResponse.json(
        { error: "Impossible de construire le lien public" },
        { status: 500 }
      );
    }

    revalidatePath(`/tableau-de-bord/plannings/${planningId}`);

    const baseUrl = resolveBaseUrl(request);
    return NextResponse.json(
      {
        publicLink: {
          id: linkData.id,
          token: linkData.token,
          active: linkData.active,
          createdAt: linkData.created_at,
          requireName: linkData.require_name,
          requireEmail: linkData.require_email,
          path: `/p/${linkData.token}`,
          url: `${baseUrl}/p/${linkData.token}`,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : undefined;
    return NextResponse.json(
      { error: "Erreur lors de la génération du lien public", details },
      { status: 500 }
    );
  }
}
