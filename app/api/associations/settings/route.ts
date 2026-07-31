import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  associationsRoleLabel,
  loadAssociationSettingsProfile,
  requireAssociationSettingsAccess,
} from "@/lib/associations/settings";
import { validateAssociationSettings } from "@/lib/associations/settings-validation";
import { resolveClubLogoUrlForClient } from "@/lib/club/resolveClubLogoUrl";

export const runtime = "nodejs";

const EMPTY_SETTINGS = {
  company_name: "",
  company_email: "",
  company_phone: "",
  company_address: "",
  company_address_line2: "",
  company_postal_code: "",
  company_city: "",
  company_region: "",
  company_country: "",
  website: "",
  description: "",
  iban: "",
  bank_name: "",
  logo_url: null as string | null,
};

/**
 * GET /api/associations/settings
 * Paramètres de l’organisation Associations active.
 */
export async function GET() {
  const access = await requireAssociationSettingsAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const supabase = await createClient();
  const profile = await loadAssociationSettingsProfile(access.clubId);
  if (!profile) {
    return NextResponse.json({
      settings: EMPTY_SETTINGS,
      meta: {
        role: access.role,
        roleLabel: associationsRoleLabel(access.role),
        canEdit: access.canEdit,
      },
    });
  }

  const logoUrl = await resolveClubLogoUrlForClient(
    supabase,
    {
      logo_url: profile.logo_url,
      logo_path: profile.logo_path,
    },
    access.clubId
  );

  return NextResponse.json({
    settings: {
      company_name: profile.company_name ?? "",
      company_email: profile.company_email ?? "",
      company_phone: profile.company_phone ?? "",
      company_address: profile.company_address ?? "",
      company_address_line2: profile.company_address_line2 ?? "",
      company_postal_code: profile.company_postal_code ?? "",
      company_city: profile.company_city ?? "",
      company_region: profile.company_region ?? "",
      company_country: profile.company_country ?? "",
      website: profile.public_page_website_url ?? "",
      description: profile.public_page_description ?? "",
      iban: profile.iban ?? "",
      bank_name: profile.bank_name ?? "",
      logo_url: logoUrl,
    },
    meta: {
      role: access.role,
      roleLabel: associationsRoleLabel(access.role),
      canEdit: access.canEdit,
    },
  });
}

/**
 * PUT /api/associations/settings
 * Met à jour uniquement les colonnes autorisées de l’org Associations active.
 * Ne touche jamais qr_creditor_*.
 */
export async function PUT(request: NextRequest) {
  const access = await requireAssociationSettingsAccess({ requireEdit: true });
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  let validated;
  try {
    validated = validateAssociationSettings(body);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Données invalides" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: current, error: readErr } = await supabase
    .from("profiles")
    .select("user_id, product_type")
    .eq("user_id", access.clubId)
    .maybeSingle();

  if (readErr || !current) {
    return NextResponse.json(
      { error: "Profil association introuvable" },
      { status: 404 }
    );
  }
  if (current.product_type !== "association") {
    return NextResponse.json(
      { error: "Organisation non Associations" },
      { status: 403 }
    );
  }

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({
      company_name: validated.company_name,
      company_email: validated.company_email,
      company_phone: validated.company_phone,
      company_address: validated.company_address,
      company_address_line2: validated.company_address_line2,
      company_postal_code: validated.company_postal_code,
      company_city: validated.company_city,
      company_region: validated.company_region,
      company_country: validated.company_country,
      public_page_website_url: validated.public_page_website_url,
      public_page_description: validated.public_page_description,
      iban: validated.iban,
      bank_name: validated.bank_name,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", access.clubId)
    .eq("product_type", "association");

  if (updateErr) {
    console.error("[associations/settings] PUT:", updateErr.message);
    return NextResponse.json(
      { error: "Impossible d’enregistrer les modifications" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    settings: {
      company_name: validated.company_name,
      company_email: validated.company_email ?? "",
      company_phone: validated.company_phone ?? "",
      company_address: validated.company_address ?? "",
      company_address_line2: validated.company_address_line2 ?? "",
      company_postal_code: validated.company_postal_code ?? "",
      company_city: validated.company_city ?? "",
      company_region: validated.company_region ?? "",
      company_country: validated.company_country ?? "",
      website: validated.public_page_website_url ?? "",
      description: validated.public_page_description ?? "",
      iban: validated.iban ?? "",
      bank_name: validated.bank_name ?? "",
    },
  });
}
