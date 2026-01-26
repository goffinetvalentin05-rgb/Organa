import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/server";
import { FacturePdf } from "@/lib/pdf/FacturePdf";
import { getDocumentPdfData } from "@/lib/utils/pdf-data";

export const runtime = "nodejs";

const formatDate = (value: string | null | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
};

const formatAmount = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return "";
  const numberValue = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numberValue)) return "";
  return numberValue.toFixed(2);
};

const formatInvoiceStatus = (status: string | null | undefined) => {
  const labels: Record<string, string> = {
    envoye: "Envoyée",
    paye: "Payée",
    "en-retard": "En retard",
  };
  return labels[status ?? ""] || status || "";
};

const formatExpenseStatus = (status: string | null | undefined) => {
  const labels: Record<string, string> = {
    a_payer: "À payer",
    paye: "Payée",
    en_retard: "En retard",
  };
  return labels[status ?? ""] || status || "";
};

const csvEscape = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return "\"\"";
  const str = String(value);
  return `"${str.replace(/"/g, "\"\"")}"`;
};

const buildCsv = (
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>
) => {
  const headerRow = headers.map(csvEscape).join(",");
  const bodyRows = rows.map((row) => row.map(csvEscape).join(","));
  return [headerRow, ...bodyRows].join("\n");
};

const sanitizeFileName = (value: string) => {
  return value.replace(/[^\w.-]+/g, "_");
};

const getFileNameFromUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.pathname.split("/").filter(Boolean).pop() || "";
  } catch {
    return "";
  }
};

const getExtensionFromContentType = (value: string | null) => {
  if (!value) return "";
  const contentType = value.split(";")[0].trim().toLowerCase();
  const mapping: Record<string, string> = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
  };
  return mapping[contentType] || "";
};

const buildAttachmentFileName = (
  attachmentUrl: string,
  fallbackBase: string,
  contentType: string | null
) => {
  const originalName = getFileNameFromUrl(attachmentUrl);
  const baseName = sanitizeFileName(originalName || fallbackBase);
  if (/\.[A-Za-z0-9]+$/.test(baseName)) {
    return baseName;
  }
  const extension = getExtensionFromContentType(contentType);
  return extension ? `${baseName}.${extension}` : baseName;
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
    const resourceParam = searchParams.get("resource");
    const yearParam = searchParams.get("year");
    const year = yearParam ? Number(yearParam) : Number.NaN;
    const resource = resourceParam || "invoices";
    if (!["invoices", "expenses"].includes(resource)) {
      return NextResponse.json(
        { error: "Type d'export invalide" },
        { status: 400 }
      );
    }
    if (!yearParam || Number.isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json(
        { error: "Année invalide" },
        { status: 400 }
      );
    }

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data: profile } = await supabase
      .from("profiles")
      .select("currency, currency_symbol")
      .eq("user_id", user.id)
      .maybeSingle();

    const currency = profile?.currency || "CHF";

    if (resource === "expenses") {
      const { data: expenses, error } = await supabase
        .from("expenses")
        .select("id, description, amount, date, status, notes, attachment_url")
        .eq("user_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });

      if (error) {
        console.error("[API][export][accounting] Erreur Supabase:", error);
        return NextResponse.json(
          { error: "Erreur lors de l'export comptable" },
          { status: 500 }
        );
      }

      const zip = new JSZip();
      const folder = zip.folder(`depenses-${year}`) ?? zip;
      const attachmentsFolder = folder.folder("pieces-jointes") ?? folder;
      const rows: Array<Array<string | number | null | undefined>> = [];

      for (const expense of expenses || []) {
        let attachmentName = "";
        if (expense.attachment_url) {
          try {
            const response = await fetch(expense.attachment_url);
            if (!response.ok) {
              throw new Error(`Téléchargement impossible (${response.status})`);
            }
            const buffer = await response.arrayBuffer();
            const fallbackBase = `depense-${expense.date || "sans-date"}-${expense.id}`;
            attachmentName = buildAttachmentFileName(
              expense.attachment_url,
              fallbackBase,
              response.headers.get("content-type")
            );
            attachmentsFolder.file(attachmentName, buffer);
          } catch (downloadError) {
            console.error(
              "[API][export][accounting] Erreur téléchargement pièce jointe:",
              downloadError
            );
          }
        }

        rows.push([
          expense.description || "",
          formatDate(expense.date),
          formatAmount(expense.amount),
          currency,
          formatExpenseStatus(expense.status),
          expense.notes || "",
          attachmentName,
        ]);
      }

      const csv = buildCsv(
        [
          "fournisseur",
          "date_depense",
          "montant",
          "devise",
          "statut",
          "notes",
          "piece_jointe",
        ],
        rows
      );

      zip.file(`depenses-${year}.csv`, csv);

      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
      const filename = `export-comptabilite-depenses-${year}.zip`;

      return new NextResponse(new Uint8Array(zipBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const { data: documents, error } = await supabase
      .from("documents")
      .select(
        "id, numero, status, date_creation, total_ht, total_tva, total_ttc, client:clients(nom)"
      )
      .eq("user_id", user.id)
      .eq("type", "invoice")
      .neq("status", "brouillon")
      .gte("date_creation", startDate)
      .lte("date_creation", endDate)
      .order("date_creation", { ascending: true });

    if (error) {
      console.error("[API][export][accounting] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors de l'export comptable" },
        { status: 500 }
      );
    }

    const zip = new JSZip();
    const folder = zip.folder(`factures-${year}`) ?? zip;

    const rows = (documents || []).map((item: any) => {
      const client = Array.isArray(item.client) ? item.client[0] : item.client;
      return [
        item.numero,
        formatDate(item.date_creation),
        client?.nom || "",
        formatAmount(item.total_ht),
        formatAmount(item.total_tva),
        formatAmount(item.total_ttc),
        currency,
        formatInvoiceStatus(item.status),
      ];
    });

    const csv = buildCsv(
      [
        "numero_facture",
        "date_facture",
        "client",
        "total_ht",
        "tva",
        "total_ttc",
        "devise",
        "statut",
      ],
      rows
    );

    zip.file(`factures-${year}.csv`, csv);

    for (const doc of documents || []) {
      const pdfData = await getDocumentPdfData(doc.id, "invoice");
      const pdfBuffer = await renderToBuffer(
        <FacturePdf
          company={pdfData.company}
          client={pdfData.client}
          document={pdfData.document}
          lines={pdfData.lines}
          totals={pdfData.totals}
          primaryColor={pdfData.primaryColor}
        />
      );
      const fileNameBase = sanitizeFileName(doc.numero || `facture-${doc.id}`);
      folder.file(`${fileNameBase}.pdf`, pdfBuffer);
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const filename = `export-comptabilite-${year}.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("[API][export][accounting] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'export comptable", details: error.message },
      { status: 500 }
    );
  }
}

