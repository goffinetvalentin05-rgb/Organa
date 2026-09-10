import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  CLIENTS_PLANNING_COLUMNS,
  CLIENTS_SAFE_COLUMNS,
} from "@/lib/clients/safeSelect";

const ROOT = path.resolve(__dirname, "../..");

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function extractFn(src: string, name: string) {
  const start = src.indexOf(`export async function ${name}`);
  expect(start).toBeGreaterThanOrEqual(0);
  const next = src.indexOf("export async function ", start + 10);
  return next >= 0 ? src.slice(start, next) : src.slice(start);
}

describe("068 — callers member-safe (admin après permission + clubId)", () => {
  it("colonnes sûres : jamais d’AVS ni date de naissance", () => {
    expect(CLIENTS_SAFE_COLUMNS).not.toContain("avs_number");
    expect(CLIENTS_SAFE_COLUMNS).not.toContain("date_of_birth");
    expect(CLIENTS_PLANNING_COLUMNS).not.toContain("avs_number");
    expect(CLIENTS_PLANNING_COLUMNS).not.toContain("date_of_birth");
  });

  it("GET/PUT membres : permission puis admin filtré par clubId", () => {
    const listGet = extractFn(read("app/api/clients/route.ts"), "GET");
    expect(listGet.indexOf("requirePermission")).toBeLessThan(
      listGet.indexOf("createAdminClient")
    );
    expect(listGet).toContain('.eq("user_id", guard.clubId)');

    const detailGet = extractFn(read("app/api/clients/[id]/route.ts"), "GET");
    expect(detailGet.indexOf("requirePermission")).toBeLessThan(
      detailGet.indexOf("createAdminClient")
    );
    expect(detailGet).toContain("maskAvsNumber");

    const put = extractFn(read("app/api/clients/[id]/route.ts"), "PUT");
    expect(put).toContain("PERMISSIONS.MANAGE_MEMBERS");
    expect(put.indexOf("requirePermission")).toBeLessThan(
      put.indexOf("createAdminClient")
    );
    expect(put).toContain('.eq("user_id", guard.clubId)');
    expect(put).toContain("maskAvsNumber");

    const post = extractFn(read("app/api/clients/route.ts"), "POST");
    expect(post).toContain("PERMISSIONS.MANAGE_MEMBERS");
    expect(post).toContain("createAdminClient");
    expect(post).toContain("normalizedClientToApiListItem");
  });

  it("édition RSC : MANAGE_MEMBERS puis admin + clubId", () => {
    const edit = read("app/tableau-de-bord/clients/[id]/edit/page.tsx");
    expect(edit).toContain("PERMISSIONS.MANAGE_MEMBERS");
    const handler = edit.slice(edit.indexOf("export default"));
    expect(handler.indexOf("checkPermission")).toBeLessThan(
      handler.indexOf("createAdminClient()")
    );
    expect(edit).toContain('.eq("user_id", clubId)');
  });

  it("export view_members : admin + clubId, sans AVS", () => {
    const exp = read("app/api/export/route.ts");
    expect(exp).toContain("PERMISSIONS.VIEW_MEMBERS");
    expect(exp).toContain("createAdminClient");
    expect(exp).toContain('.select("nom, email, telephone, adresse, created_at")');
    expect(exp).not.toMatch(/from\("clients"\)[\s\S]{0,200}avs_number/);
  });

  it("documents / factures / e-mail / PDF : admin après permission, embed sans AVS", () => {
    const docs = read("app/api/documents/route.ts");
    expect(docs).toContain("CLIENTS_SAFE_COLUMNS");
    expect(docs).not.toContain("client:clients(*)");
    expect(docs).toContain("createAdminClient");

    const one = extractFn(read("app/api/documents/[id]/route.ts"), "GET");
    expect(one.indexOf("requireViewDocumentsOrInvoices")).toBeLessThan(
      one.indexOf("createAdminClient()")
    );
    expect(one).toContain('.eq("user_id", guard.clubId)');
    expect(one).toContain('.select("id, nom, email, telephone, adresse")');

    const email = read("app/api/email/route.ts");
    expect(email).toContain("PERMISSIONS.MANAGE_INVOICES");
    expect(email).toMatch(/await admin\s*\n\s*\.from\("documents"\)/);
    expect(email).toContain("client:clients(id, nom, email, adresse)");

    const pdf = read("lib/utils/pdf-data.ts");
    expect(pdf).toContain("createAdminClient");
    expect(pdf).not.toContain("client:clients(*)");
    expect(pdf).toContain(".eq(\"user_id\", scopeUserId)");
  });

  it("planning / matching / PDF planning / events / buvette", () => {
    const planning = extractFn(read("app/api/plannings/[id]/route.ts"), "GET");
    expect(planning).toContain("PERMISSIONS.VIEW_PLANNINGS");
    expect(planning).toContain("createAdminClient");
    expect(planning).toContain("CLIENTS_PLANNING_COLUMNS");

    const assign = extractFn(
      read("app/api/plannings/[id]/assignments/route.ts"),
      "POST"
    );
    expect(assign).toContain("PERMISSIONS.MANAGE_PLANNINGS");
    expect(assign.indexOf("requirePermission")).toBeLessThan(
      assign.indexOf("createAdminClient")
    );
    expect(assign).toContain('.eq("user_id", guard.clubId)');

    const pdfPlan = read("app/api/pdf/planning/download/route.tsx");
    expect(pdfPlan).toContain("PERMISSIONS.VIEW_PLANNINGS");
    expect(pdfPlan).toContain("createAdminClient");
    expect(pdfPlan).not.toMatch(/from\("clients"\)\s*\n\s*\.select\("\*"\)/);

    const events = extractFn(read("app/api/events/[id]/route.ts"), "GET");
    expect(events).toContain("PERMISSIONS.VIEW_EXPENSES");
    expect(events).toContain("createAdminClient");
    expect(events).toContain(".eq(\"user_id\", guard.clubId)");

    const buvette = extractFn(
      read("app/api/buvette/requests/[id]/send-invoice/route.tsx"),
      "POST"
    );
    expect(buvette).toContain("PERMISSIONS.MANAGE_INVOICES");
    expect(buvette.indexOf("requirePermission")).toBeLessThan(
      buvette.indexOf("createAdminClient()")
    );
    expect(buvette).toContain('.eq("user_id", guard.clubId)');

    const pub = read("app/api/public/plannings/[token]/route.ts");
    expect(pub).toContain("createAdminClient");
    expect(pub).toContain('.select("id, nom")');

    const match = read("lib/planning/fetchClubMembersForNameMatch.ts");
    expect(match).toContain('"id, nom"');
  });

  it("DELETE membres reste JWT (policy owner) ; 038 INSERT/UPDATE non modifiés", () => {
    const del = extractFn(read("app/api/clients/[id]/route.ts"), "DELETE");
    expect(del).toContain("await createClient()");
    expect(del).not.toContain("createAdminClient");
    expect(read("supabase/migrations/068_clients_select_staff.sql")).not.toContain(
      "clients_insert_staff"
    );
  });
});
