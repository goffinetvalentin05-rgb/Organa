import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { upsertMarketingContact } from "@/lib/marketing/contacts";
import { rateLimitGuard } from "@/lib/security/rateLimit";
import { logAudit, AuditAction, extractRequestMetadata } from "@/lib/auth/audit";

export const runtime = "nodejs";

// POST public — création d'inscription via QR code.
// Sécurité :
//   - rate limiting par IP (anti-spam)
//   - validation stricte des champs
//   - log d'audit pour traçabilité
//   - utilise le service_role uniquement pour insérer (RLS impose
//     `is_club_staff` sinon, ce qui empêcherait l'insert public)
export async function POST(request: NextRequest) {
  const meta = extractRequestMetadata(request);

  // Rate-limit : 5 inscriptions max par IP toutes les 15 min
  const rl = rateLimitGuard(
    request,
    "registrations:public",
    { limit: 5, windowMs: 15 * 60 * 1000 }
  );
  if (!rl.ok) return rl.response;

  try {
    const body = await request.json();
    const qrcodeId = typeof body?.qrcodeId === "string" ? body.qrcodeId.trim() : "";
    const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const comment = typeof body?.comment === "string" ? body.comment.trim() : "";

    if (!qrcodeId || !/^[0-9a-f-]{36}$/i.test(qrcodeId)) {
      return NextResponse.json({ error: "QR code invalide" }, { status: 400 });
    }
    if (!firstName) return NextResponse.json({ error: "Le prénom est obligatoire" }, { status: 400 });
    if (!lastName) return NextResponse.json({ error: "Le nom est obligatoire" }, { status: 400 });
    if (!email) return NextResponse.json({ error: "L'email est obligatoire" }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }
    if (firstName.length > 100 || lastName.length > 100 || email.length > 255) {
      return NextResponse.json({ error: "Champs trop longs" }, { status: 400 });
    }

    // Service role car les RLS imposent désormais `is_club_staff` pour insérer.
    // L'usage du service_role est ici contrôlé : pas d'opération sur d'autres
    // tables, validations strictes au-dessus.
    const supabase = createAdminClient();

    const { data: qrcode, error: qrError } = await supabase
      .from("qrcodes")
      .select("id, is_active, name, user_id, deleted_at")
      .eq("id", qrcodeId)
      .maybeSingle();

    if (qrError || !qrcode || qrcode.deleted_at) {
      await logAudit({
        clubId: null,
        action: AuditAction.CREATE,
        resourceType: "registrations",
        outcome: "denied",
        metadata: { reason: "qrcode_not_found", qrcodeId },
        ...meta,
      });
      return NextResponse.json({ error: "QR code non trouvé" }, { status: 404 });
    }

    if (!qrcode.is_active) {
      return NextResponse.json(
        { error: "Cet événement n'accepte plus d'inscriptions" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("registrations")
      .select("id")
      .eq("qrcode_id", qrcodeId)
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Cet email est déjà inscrit à cet événement" },
        { status: 400 }
      );
    }

    const { data: registration, error } = await supabase
      .from("registrations")
      .insert({
        qrcode_id: qrcodeId,
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
        comment: comment || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[API][Registrations] Erreur création:", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    if (qrcode.user_id) {
      await upsertMarketingContact({
        clubId: qrcode.user_id,
        firstName,
        lastName,
        email,
        phone,
        source: "evenement",
        sourceId: registration.id,
      });

      await logAudit({
        clubId: qrcode.user_id,
        actorId: null,
        actorEmail: email,
        action: AuditAction.CREATE,
        resourceType: "registrations",
        resourceId: registration.id,
        outcome: "success",
        metadata: { qrcode_id: qrcodeId, source: "public_form" },
        ...meta,
      });
    }

    return NextResponse.json(
      { registration: { id: registration.id }, eventName: qrcode.name },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API][Registrations] Erreur inattendue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE: Supprime une inscription. Nécessite une session staff du club
// propriétaire du QR code (vérifié par les RLS de `registrations`).
export async function DELETE(request: NextRequest) {
  const meta = extractRequestMetadata(request);
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // Récupère le club_id pour audit avant la suppression
    const { data: registration } = await supabase
      .from("registrations")
      .select("id, qrcode:qrcodes!inner(user_id)")
      .eq("id", id)
      .maybeSingle();

    if (!registration) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }

    const qrcode = Array.isArray(registration.qrcode)
      ? registration.qrcode[0]
      : registration.qrcode;
    const clubId = qrcode?.user_id ?? null;

    // RLS bloque déjà cross-club ; on log juste avant.
    const { error } = await supabase.from("registrations").delete().eq("id", id);
    if (error) {
      console.error("[API][Registrations] Erreur suppression:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAudit({
      clubId,
      action: AuditAction.HARD_DELETE,
      resourceType: "registrations",
      resourceId: id,
      ...meta,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API][Registrations] Erreur inattendue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
