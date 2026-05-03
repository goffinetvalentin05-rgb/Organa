import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PERMISSIONS, requirePermission } from "@/lib/auth/permissions";
import { deriveContractStatus } from "@/lib/sponsor-contracts";

export const runtime = "nodejs";

async function readId(params: Promise<{ id: string }> | { id: string }): Promise<string> {
  const resolved = await Promise.resolve(params);
  return resolved.id;
}

function mapRow(row: Record<string, unknown> | null) {
  if (!row) return null;
  const startDate = String(row.start_date ?? "");
  const endDate = String(row.end_date ?? "");
  const derivedStatus = deriveContractStatus(startDate, endDate);
  return {
    id: row.id as string,
    clubId: row.club_id as string,
    sponsorName: row.sponsor_name as string,
    title: row.title as string,
    content: (row.content as string) ?? "",
    amount: row.amount != null && row.amount !== "" ? Number(row.amount) : null,
    startDate,
    endDate,
    status: derivedStatus,
    sponsorType: (row.sponsor_type as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_INVOICES);
    if ("error" in guard) return guard.error;

    const id = await readId(context.params);
    const supabase = await createClient();

    const [{ data, error }, { data: profile }] = await Promise.all([
      supabase
        .from("sponsor_contracts")
        .select(
          "id, club_id, sponsor_name, title, content, amount, start_date, end_date, status, sponsor_type, created_by, created_at, updated_at"
        )
        .eq("id", id)
        .eq("club_id", guard.clubId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("company_name")
        .eq("user_id", guard.clubId)
        .maybeSingle(),
    ]);

    if (error) {
      console.error("[API][sponsor-contracts/[id]][GET]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });
    }

    const clubName =
      (profile?.company_name as string | undefined)?.trim() || "Votre club";

    return NextResponse.json({ contract: mapRow(data), clubName }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_INVOICES);
    if ("error" in guard) return guard.error;

    const id = await readId(context.params);
    const body = await request.json();
    const {
      sponsorName,
      title,
      content,
      amount,
      startDate,
      endDate,
      sponsorType,
    } = body || {};

    const updates: Record<string, unknown> = {};

    if (sponsorName !== undefined) {
      if (typeof sponsorName !== "string" || !String(sponsorName).trim()) {
        return NextResponse.json({ error: "Nom du sponsor invalide" }, { status: 400 });
      }
      updates.sponsor_name = String(sponsorName).trim();
    }
    if (title !== undefined) {
      if (typeof title !== "string" || !String(title).trim()) {
        return NextResponse.json({ error: "Titre invalide" }, { status: 400 });
      }
      updates.title = String(title).trim();
    }
    if (content !== undefined) {
      updates.content = typeof content === "string" ? content : "";
    }
    if (startDate !== undefined) {
      if (typeof startDate !== "string") {
        return NextResponse.json({ error: "Date de début invalide" }, { status: 400 });
      }
      updates.start_date = startDate;
    }
    if (endDate !== undefined) {
      if (typeof endDate !== "string") {
        return NextResponse.json({ error: "Date de fin invalide" }, { status: 400 });
      }
      updates.end_date = endDate;
    }
    if (amount !== undefined) {
      if (amount === null || amount === "") {
        updates.amount = null;
      } else {
        const n = typeof amount === "number" ? amount : Number(amount);
        if (!Number.isFinite(n) || n < 0) {
          return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
        }
        updates.amount = n;
      }
    }
    if (sponsorType !== undefined) {
      if (sponsorType === null || sponsorType === "") {
        updates.sponsor_type = null;
      } else if (sponsorType === "gold" || sponsorType === "silver" || sponsorType === "bronze") {
        updates.sponsor_type = sponsorType;
      } else {
        return NextResponse.json({ error: "Type de sponsor invalide" }, { status: 400 });
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Aucune modification" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: existingDates } = await supabase
      .from("sponsor_contracts")
      .select("start_date, end_date")
      .eq("id", id)
      .eq("club_id", guard.clubId)
      .maybeSingle();

    if (!existingDates) {
      return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });
    }

    const finalStart = String(
      updates.start_date !== undefined ? updates.start_date : existingDates.start_date ?? ""
    );
    const finalEnd = String(
      updates.end_date !== undefined ? updates.end_date : existingDates.end_date ?? ""
    );
    if (finalStart && finalEnd && finalStart > finalEnd) {
      return NextResponse.json(
        { error: "La date de fin doit être postérieure ou égale au début" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("sponsor_contracts")
      .update(updates)
      .eq("id", id)
      .eq("club_id", guard.clubId)
      .select(
        "id, club_id, sponsor_name, title, content, amount, start_date, end_date, status, sponsor_type, created_by, created_at, updated_at"
      )
      .maybeSingle();

    if (error) {
      console.error("[API][sponsor-contracts/[id]][PATCH]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });
    }

    revalidatePath("/tableau-de-bord");
    revalidatePath("/tableau-de-bord/sponsoring");
    revalidatePath(`/tableau-de-bord/sponsoring/${id}`);

    return NextResponse.json({ contract: mapRow(data) }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.DELETE_INVOICES);
    if ("error" in guard) return guard.error;

    const id = await readId(context.params);
    const supabase = await createClient();

    const { error } = await supabase
      .from("sponsor_contracts")
      .delete()
      .eq("id", id)
      .eq("club_id", guard.clubId);

    if (error) {
      console.error("[API][sponsor-contracts/[id]][DELETE]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath("/tableau-de-bord");
    revalidatePath("/tableau-de-bord/sponsoring");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
