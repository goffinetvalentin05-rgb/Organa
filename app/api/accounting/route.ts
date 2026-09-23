import { NextRequest, NextResponse } from "next/server";
import { PERMISSIONS, requirePermission } from "@/lib/auth/permissions";
import { accountingPriceDetail, accountingPriceLabel } from "@/lib/billing/pricing";
import {
  attachFile,
  closePeriod,
  clubUsesStripe,
  completeOnboarding,
  confirmInbox,
  createTransfer,
  createAccount,
  createManualEntry,
  getAccountingAccess,
  listOpenItems,
  loadWorkspace,
  recordExport,
  reopenPeriod,
  updateAccount,
  updateSettings,
  validateEntry,
  voidPendingEntry,
} from "@/lib/accounting/service";
import type { AccountType } from "@/lib/accounting/types";

export const runtime = "nodejs";

async function guardView() {
  const guard = await requirePermission(PERMISSIONS.VIEW_ACCOUNTING);
  if ("error" in guard) return guard;
  return guard;
}

async function guardManage() {
  const guard = await requirePermission(PERMISSIONS.MANAGE_ACCOUNTING);
  if ("error" in guard) return guard;
  return guard;
}

export async function GET() {
  const guard = await guardView();
  if ("error" in guard) return guard.error;

  try {
    const access = await getAccountingAccess(guard.clubId);
    const usesStripe = await clubUsesStripe(guard.clubId);
    if (!access.onboarded) {
      return NextResponse.json({
        access,
        usesStripe,
        priceLabel: accountingPriceLabel(),
        priceDetail: accountingPriceDetail(),
        accounts: [],
        periods: [],
        summary: null,
        review: { count: 0, amount: 0, inbox: [], entries: [] },
        entries: [],
        linesByEntry: {},
        openItems: null,
      });
    }
    const workspace = await loadWorkspace(guard.clubId);
    const openItems = workspace.currentPeriod
      ? await listOpenItems(guard.clubId, workspace.currentPeriod.endsOn)
      : null;
    return NextResponse.json({
      ...workspace,
      priceLabel: accountingPriceLabel(),
      priceDetail: accountingPriceDetail(),
      openItems,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur comptable";
    console.error("[API][accounting][GET]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await guardManage();
  if ("error" in guard) return guard.error;

  try {
    const body = await request.json();
    const action = String(body.action || "");
    const access = await getAccountingAccess(guard.clubId);
    const writing = action !== "onboarding";
    if (writing && !access.canWrite && action !== "onboarding") {
      return NextResponse.json({ error: "L’option Comptabilité n’est pas active" }, { status: 402 });
    }
    if (action === "onboarding" && !access.entitled) {
      return NextResponse.json({ error: "Activez d’abord l’option Comptabilité" }, { status: 402 });
    }

    switch (action) {
      case "onboarding":
        await completeOnboarding(guard.clubId, guard.userId, body);
        break;
      case "history-import":
        if (!access.onboarded) {
          return NextResponse.json(
            { error: "Démarrez d’abord la comptabilité" },
            { status: 409 }
          );
        }
        return NextResponse.json({
          available: false,
          message:
            "L’import d’historique (CSV, Excel, balance ou journal) arrive. Aucune écriture n’a été créée.",
        });
      case "confirm":
        await confirmInbox({
          clubId: guard.clubId,
          userId: guard.userId,
          inboxId: String(body.inboxId),
          financialAccountCode: String(body.financialAccountCode),
          categoryCode: String(body.categoryCode),
        });
        break;
      case "validate":
        await validateEntry(guard.clubId, guard.userId, String(body.entryId));
        break;
      case "void":
        await voidPendingEntry(guard.clubId, guard.userId, String(body.entryId));
        break;
      case "transfer":
        await createTransfer({
          clubId: guard.clubId,
          userId: guard.userId,
          date: String(body.date),
          amount: Number(body.amount),
          description: String(body.description || ""),
          fromAccountCode: String(body.fromAccountCode),
          toAccountCode: String(body.toAccountCode),
        });
        break;
      case "manual":
        await createManualEntry({
          clubId: guard.clubId,
          userId: guard.userId,
          date: String(body.date),
          amount: Number(body.amount),
          description: String(body.description || ""),
          direction: body.direction === "out" ? "out" : "in",
          financialAccountCode: String(body.financialAccountCode),
          categoryCode: String(body.categoryCode),
          partyName: body.partyName ? String(body.partyName) : undefined,
        });
        break;
      case "settings":
        await updateSettings(guard.clubId, guard.userId, Boolean(body.autoValidate));
        break;
      case "close":
        await closePeriod({
          clubId: guard.clubId,
          userId: guard.userId,
          periodId: String(body.periodId),
          transferResult: Boolean(body.transferResult),
        });
        break;
      case "reopen":
        await reopenPeriod(guard.clubId, guard.userId, String(body.periodId), String(body.reason || ""));
        break;
      case "create_account":
        await createAccount({
          clubId: guard.clubId,
          userId: guard.userId,
          number: String(body.number || ""),
          name: String(body.name || ""),
          accountType: String(body.accountType || "expense") as AccountType,
        });
        break;
      case "update_account":
        await updateAccount({
          clubId: guard.clubId,
          userId: guard.userId,
          accountId: String(body.accountId),
          name: body.name ? String(body.name) : undefined,
          number: body.number ? String(body.number) : undefined,
          isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
        });
        break;
      case "export":
        await recordExport(guard.clubId, guard.userId, String(body.kind || "csv"));
        break;
      default:
        return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur comptable";
    console.error("[API][accounting][POST]", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  const guard = await guardManage();
  if ("error" in guard) return guard.error;
  try {
    const form = await request.formData();
    const entryId = String(form.get("entryId") || "");
    const file = form.get("file");
    if (!entryId || !(file instanceof File)) {
      return NextResponse.json({ error: "Écriture et fichier requis" }, { status: 400 });
    }
    if (file.size <= 0 || file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 400 });
    }
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const safeName = (file.name || "piece").replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 120);
    const path = `${guard.clubId}/accounting/${entryId}/${Date.now()}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage.from("expenses").upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }
    await attachFile({
      clubId: guard.clubId,
      userId: guard.userId,
      entryId,
      storagePath: path,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
    });
    return NextResponse.json({ ok: true, path });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
