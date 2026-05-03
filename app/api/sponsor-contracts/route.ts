import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PERMISSIONS, requirePermission } from "@/lib/auth/permissions";
import { deriveContractStatus } from "@/lib/sponsor-contracts";

export const runtime = "nodejs";

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

export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_INVOICES);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();

    const [{ data: rows, error }, { data: profile }] = await Promise.all([
      supabase
        .from("sponsor_contracts")
        .select(
          "id, club_id, sponsor_name, title, content, amount, start_date, end_date, status, sponsor_type, created_by, created_at, updated_at"
        )
        .eq("club_id", guard.clubId)
        .order("end_date", { ascending: true }),
      supabase
        .from("profiles")
        .select("company_name")
        .eq("user_id", guard.clubId)
        .maybeSingle(),
    ]);

    if (error) {
      console.error("[API][sponsor-contracts][GET]", error);
      return NextResponse.json(
        { error: "Erreur lors du chargement des contrats", details: error.message },
        { status: 500 }
      );
    }

    const contracts = (rows || []).map((r) => mapRow(r)).filter(Boolean);
    const clubName =
      (profile?.company_name as string | undefined)?.trim() || "Votre club";

    return NextResponse.json({ contracts, clubName }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[API][sponsor-contracts][GET]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_INVOICES);
    if ("error" in guard) return guard.error;

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

    if (
      !sponsorName ||
      typeof sponsorName !== "string" ||
      !title ||
      typeof title !== "string" ||
      typeof startDate !== "string" ||
      typeof endDate !== "string"
    ) {
      return NextResponse.json(
        { error: "Champs requis : sponsor, titre, dates" },
        { status: 400 }
      );
    }

    const sponsor = String(sponsorName).trim();
    const contractTitle = String(title).trim();
    const text = typeof content === "string" ? content : "";

    if (!sponsor || !contractTitle) {
      return NextResponse.json({ error: "Nom du sponsor et titre requis" }, { status: 400 });
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: "La date de fin doit être postérieure ou égale au début" },
        { status: 400 }
      );
    }

    let amountValue: number | null = null;
    if (amount !== undefined && amount !== null && amount !== "") {
      const n = typeof amount === "number" ? amount : Number(amount);
      if (!Number.isFinite(n) || n < 0) {
        return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
      }
      amountValue = n;
    }

    const typeOk =
      sponsorType === undefined ||
      sponsorType === null ||
      sponsorType === "" ||
      sponsorType === "gold" ||
      sponsorType === "silver" ||
      sponsorType === "bronze";
    if (!typeOk) {
      return NextResponse.json({ error: "Type de sponsor invalide" }, { status: 400 });
    }

    const supabase = await createClient();
    const payload: Record<string, unknown> = {
      club_id: guard.clubId,
      sponsor_name: sponsor,
      title: contractTitle,
      content: text,
      start_date: startDate,
      end_date: endDate,
      created_by: guard.userId,
    };
    if (amountValue !== null) payload.amount = amountValue;
    if (sponsorType === "gold" || sponsorType === "silver" || sponsorType === "bronze") {
      payload.sponsor_type = sponsorType;
    }

    const { data, error } = await supabase
      .from("sponsor_contracts")
      .insert(payload)
      .select(
        "id, club_id, sponsor_name, title, content, amount, start_date, end_date, status, sponsor_type, created_by, created_at, updated_at"
      )
      .single();

    if (error) {
      console.error("[API][sponsor-contracts][POST]", error);
      return NextResponse.json(
        { error: "Erreur lors de la création", details: error.message },
        { status: 500 }
      );
    }

    revalidatePath("/tableau-de-bord");
    revalidatePath("/tableau-de-bord/sponsoring");

    return NextResponse.json({ contract: mapRow(data) }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[API][sponsor-contracts][POST]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
