import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  STORAGE_BUCKETS,
  type StorageBucket,
  extractClubIdFromPath,
} from "@/lib/storage/secureUrl";
import { getAuthContext, findMembership } from "@/lib/auth/rbac";
import { logAudit, AuditAction, extractRequestMetadata } from "@/lib/auth/audit";

export const runtime = "nodejs";

const ALLOWED_BUCKETS = new Set<StorageBucket>([
  STORAGE_BUCKETS.LOGOS,
  STORAGE_BUCKETS.EXPENSES,
]);

/**
 * POST /api/storage/sign
 * Body: { bucket: string, path: string, expiresIn?: number, download?: boolean | string }
 *
 * Retourne une URL signée à durée limitée pour télécharger un fichier
 * appartenant au club du membre courant. Vérifie :
 *   - bucket whitelisté
 *   - le 1er segment du path est un club_id auquel l'utilisateur appartient
 */
export async function POST(request: NextRequest) {
  const meta = extractRequestMetadata(request);

  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const bucket = body?.bucket as string | undefined;
  const path = body?.path as string | undefined;
  const expiresIn = Math.max(
    30,
    Math.min(Number(body?.expiresIn) || 300, 60 * 60) // 30s..1h
  );
  const download = body?.download;

  if (!bucket || !path || typeof bucket !== "string" || typeof path !== "string") {
    return NextResponse.json({ error: "bucket et path requis" }, { status: 400 });
  }
  if (!ALLOWED_BUCKETS.has(bucket as StorageBucket)) {
    return NextResponse.json({ error: "Bucket non autorisé" }, { status: 400 });
  }

  const pathClubId = extractClubIdFromPath(path);
  if (!pathClubId) {
    return NextResponse.json(
      { error: "Chemin invalide (club_id manquant)" },
      { status: 400 }
    );
  }

  const membership = findMembership(ctx, pathClubId);
  if (!membership) {
    await logAudit({
      clubId: pathClubId,
      action: AuditAction.FILE_DOWNLOAD,
      resourceType: bucket,
      resourceId: path,
      outcome: "denied",
      metadata: { reason: "not_a_member" },
      ...meta,
    });
    return NextResponse.json(
      { error: "Accès refusé : non membre du club" },
      { status: 403 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn, { download });

  if (error || !data?.signedUrl) {
    console.error("[STORAGE][sign] Erreur:", error);
    return NextResponse.json(
      { error: "Impossible de générer l'URL signée" },
      { status: 500 }
    );
  }

  await logAudit({
    clubId: pathClubId,
    action: AuditAction.FILE_DOWNLOAD,
    resourceType: bucket,
    resourceId: path,
    outcome: "success",
    metadata: { expiresIn },
    ...meta,
  });

  return NextResponse.json({
    signedUrl: data.signedUrl,
    expiresIn,
  });
}
