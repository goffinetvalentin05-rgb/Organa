import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { withIdempotency } from "@/lib/api/idempotency";
import {
  MARKETING_CONSENT_TEXT_VERSION,
  isStaffLawfulBasisDeclared,
} from "@/lib/marketing/consent";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_MEMBERS);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();

    const search = request.nextUrl.searchParams.get("search")?.trim() || "";
    const source = request.nextUrl.searchParams.get("source")?.trim() || "";

    let query = supabase
      .from("marketing_contacts")
      .select(
        "id, first_name, last_name, email, phone, source, source_id, created_at, unsubscribed, unsubscribed_at, consented_at, consent_source"
      )
      .eq("club_id", guard.clubId)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.ilike("email", `%${search}%`);
    }
    if (source) {
      query = query.eq("source", source);
    }

    const { data: contacts, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: sourceRows } = await supabase
      .from("marketing_contacts")
      .select("source")
      .eq("club_id", guard.clubId);

    const sources = Array.from(new Set((sourceRows || []).map((row) => row.source).filter(Boolean)));

    return NextResponse.json({ contacts: contacts || [], sources }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_MEMBERS);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();

    const accessCheck = await requireWriteAccess(guard.clubId);
    if (accessCheck.response) {
      return accessCheck.response;
    }

    const idempotencyKey = request.headers.get("Idempotency-Key");
    if (!idempotencyKey) {
      return NextResponse.json({ error: "Idempotency-Key requis" }, { status: 400 });
    }

    const body = await request.json();
    const firstName = body?.firstName?.trim();
    const lastName = body?.lastName?.trim();
    const email = body?.email?.trim()?.toLowerCase();
    const phone = body?.phone?.trim() || null;
    const source = body?.source?.trim() || "manual";

    if (!isStaffLawfulBasisDeclared(body?.staffDeclaresLawfulBasis)) {
      return NextResponse.json(
        {
          error:
            "Confirmez que le club dispose d’une base valable pour contacter cette personne.",
        },
        { status: 400 }
      );
    }

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "Nom, prénom et email sont obligatoires" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const idempotencyResult = await withIdempotency<Record<string, unknown>>({
      request,
      clubId: guard.clubId,
      idempotencyKey,
      resourceType: "marketing_contact",
      operation: async () => {
        const { data: existingContact } = await supabase
          .from("marketing_contacts")
          .select("id")
          .eq("club_id", guard.clubId)
          .eq("email_normalized", email)
          .maybeSingle();

        if (existingContact) {
          return {
            status: 409,
            body: { error: "Un contact avec cet email existe déjà pour ce club" },
            resourceId: null,
          };
        }

        const now = new Date().toISOString();
        const { data: contact, error } = await supabase
          .from("marketing_contacts")
          .insert({
            club_id: guard.clubId,
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            source,
            consented_at: now,
            consent_source: "staff_declared",
            consent_text_version: MARKETING_CONSENT_TEXT_VERSION,
            unsubscribed: false,
          })
          .select(
            "id, first_name, last_name, email, phone, source, source_id, created_at, unsubscribed, consented_at, consent_source"
          )
          .single();

        if (error || !contact) {
          return {
            status: 500,
            body: { error: error?.message || "Erreur création contact" },
            resourceId: null,
          };
        }

        return {
          status: 201,
          body: { contact },
          resourceId: contact.id ? String(contact.id) : null,
        };
      },
    });

    return NextResponse.json(idempotencyResult.body, { status: idempotencyResult.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

