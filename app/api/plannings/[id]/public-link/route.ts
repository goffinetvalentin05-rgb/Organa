import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { slugifyPublicPlanningName } from "@/lib/planning/publicPlanningSlug";

export const runtime = "nodejs";

interface PublicPlanningLinkRow {
  id: string;
  token: string;
  slug: string | null;
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
    const guard = await requirePermission(PERMISSIONS.VIEW_PLANNINGS);
    if ("error" in guard) return guard.error;

    const { id: planningId } = await params;
    const supabase = await createClient();

    const { data: planning } = await supabase
      .from("plannings")
      .select("id, name")
      .eq("id", planningId)
      .eq("user_id", guard.clubId)
      .maybeSingle();

    if (!planning) {
      return NextResponse.json({ error: "Planning non trouvé" }, { status: 404 });
    }

    const { data: link } = await supabase
      .from("public_planning_links")
      .select("id, token, slug, active, created_at, require_name, require_email")
      .eq("planning_id", planningId)
      .eq("club_id", guard.clubId)
      .maybeSingle();

    if (!link) {
      return NextResponse.json({ publicLink: null }, { status: 200 });
    }

    const baseUrl = resolveBaseUrl(request);
    const publicPath = `/p/${link.slug || link.token}`;
    return NextResponse.json(
      {
        publicLink: {
          id: link.id,
          token: link.token,
          slug: link.slug,
          active: link.active,
          createdAt: link.created_at,
          requireName: link.require_name,
          requireEmail: link.require_email,
          path: publicPath,
          url: `${baseUrl}${publicPath}`,
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
    const guard = await requirePermission(PERMISSIONS.MANAGE_PLANNINGS);
    if ("error" in guard) return guard.error;

    const { id: planningId } = await params;
    const supabase = await createClient();

    const { data: planning } = await supabase
      .from("plannings")
      .select("id, name")
      .eq("id", planningId)
      .eq("user_id", guard.clubId)
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
      .select("id, token, slug, active, created_at, require_name, require_email")
      .eq("planning_id", planningId)
      .eq("club_id", guard.clubId)
      .maybeSingle();

    let linkData: PublicPlanningLinkRow | null = existing;
    if (!existing) {
      let created: PublicPlanningLinkRow | null = null;
      const baseSlug = slugifyPublicPlanningName(planning?.name || "planning");

      // On tente plusieurs slugs en cas de collisions (même base sur plusieurs plannings)
      outer: for (let attempt = 0; attempt < 5; attempt += 1) {
        const token = generatePublicToken();
        for (let slugAttempt = 0; slugAttempt < 50; slugAttempt += 1) {
          const slug =
            slugAttempt === 0 ? baseSlug : `${baseSlug}-${slugAttempt + 1}`;

          const { data, error } = await supabase
            .from("public_planning_links")
            .insert({
              planning_id: planningId,
              token,
              slug,
              club_id: guard.clubId,
              active: true,
              require_name: requireName,
              require_email: requireEmail,
            })
            .select("id, token, slug, active, created_at, require_name, require_email")
            .maybeSingle();

          if (!error && data) {
            created = data;
            break outer;
          }

          // Collision sur slug (ou token) => on essaye le suffixe suivant
          if (error && "code" in error && (error as any).code === "23505") {
            continue;
          }

          if (error) throw error;
        }
      }

      if (!created) {
        // Race condition : un autre request a peut-être déjà créé le lien.
        const { data: afterRace } = await supabase
          .from("public_planning_links")
          .select("id, token, slug, active, created_at, require_name, require_email")
          .eq("planning_id", planningId)
          .eq("club_id", guard.clubId)
          .maybeSingle();

        if (!afterRace) {
          return NextResponse.json(
            { error: "Impossible de générer un lien public" },
            { status: 500 }
          );
        }

        const { data: updatedAfterRace, error: afterUpdateError } = await supabase
          .from("public_planning_links")
          .update({
            active: true,
            require_name: requireName,
            require_email: requireEmail,
          })
          .eq("id", afterRace.id)
          .select("id, token, slug, active, created_at, require_name, require_email")
          .single();

        if (afterUpdateError || !updatedAfterRace) {
          return NextResponse.json(
            { error: "Impossible de mettre à jour le lien public" },
            { status: 500 }
          );
        }

        created = updatedAfterRace;
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
        .select("id, token, slug, active, created_at, require_name, require_email")
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
    const publicPath = `/p/${linkData.slug || linkData.token}`;
    return NextResponse.json(
      {
        publicLink: {
          id: linkData.id,
          token: linkData.token,
          slug: linkData.slug,
          active: linkData.active,
          createdAt: linkData.created_at,
          requireName: linkData.require_name,
          requireEmail: linkData.require_email,
          path: publicPath,
          url: `${baseUrl}${publicPath}`,
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
