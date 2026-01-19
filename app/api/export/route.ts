import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ExportResource = "invoices" | "clients" | "expenses";

const csvEscape = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return "\"\"";
  const str = String(value);
  return `"${str.replace(/"/g, "\"\"")}"`;
};

const buildCsv = (headers: string[], rows: Array<Array<string | number | null | undefined>>) => {
  const headerRow = headers.map(csvEscape).join(",");
  const bodyRows = rows.map((row) => row.map(csvEscape).join(","));
  return [headerRow, ...bodyRows].join("\n");
};

const buildFileName = (resource: ExportResource) => {
  const date = new Date().toISOString().slice(0, 10);
  return `organa-${resource}-${date}.csv`;
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const resource = searchParams.get("resource") as ExportResource | null;

    if (!resource || !["invoices", "clients", "expenses"].includes(resource)) {
      return NextResponse.json(
        { error: "Type d'export invalide" },
        { status: 400 }
      );
    }

    if (resource === "invoices") {
      const { data, error } = await supabase
        .from("documents")
        .select(
          "id, numero, status, date_creation, total_ttc, client:clients(nom)"
        )
        .eq("user_id", user.id)
        .eq("type", "invoice")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[API][export][invoices] Erreur Supabase:", error);
        return NextResponse.json(
          { error: "Erreur lors de l'export des factures" },
          { status: 500 }
        );
      }

      const rows = (data || []).map((item: any) => {
        const client = Array.isArray(item.client) ? item.client[0] : item.client;
        return [
          item.id,
          item.numero,
          client?.nom || "",
          item.status || "",
          item.date_creation || "",
          item.total_ttc ?? "",
        ];
      });

      const csv = buildCsv(
        ["id", "numero", "client", "statut", "date_creation", "total_ttc"],
        rows
      );

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${buildFileName("invoices")}"`,
        },
      });
    }

    if (resource === "clients") {
      const { data, error } = await supabase
        .from("clients")
        .select("id, nom, email, telephone, adresse, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[API][export][clients] Erreur Supabase:", error);
        return NextResponse.json(
          { error: "Erreur lors de l'export des clients" },
          { status: 500 }
        );
      }

      const rows = (data || []).map((item: any) => [
        item.id,
        item.nom || "",
        item.email || "",
        item.telephone || "",
        item.adresse || "",
        item.created_at || "",
      ]);

      const csv = buildCsv(
        ["id", "nom", "email", "telephone", "adresse", "created_at"],
        rows
      );

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${buildFileName("clients")}"`,
        },
      });
    }

    const { data, error } = await supabase
      .from("expenses")
      .select("id, label, amount, date, status, notes, attachment_url")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (error) {
      console.error("[API][export][expenses] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors de l'export des dépenses" },
        { status: 500 }
      );
    }

    const rows = (data || []).map((item: any) => [
      item.id,
      item.label || "",
      item.amount ?? "",
      item.date || "",
      item.status || "",
      item.notes || "",
      item.attachment_url || "",
    ]);

    const csv = buildCsv(
      ["id", "label", "amount", "date", "status", "notes", "attachment_url"],
      rows
    );

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${buildFileName("expenses")}"`,
      },
    });
  } catch (error: any) {
    console.error("[API][export] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'export", details: error.message },
      { status: 500 }
    );
  }
}

