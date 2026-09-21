function filenameFromDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const utf8 = header.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].trim());
    } catch {
      return utf8[1].trim();
    }
  }
  const quoted = header.match(/filename\s*=\s*"([^"]+)"/i);
  if (quoted?.[1]) return quoted[1].trim();
  const plain = header.match(/filename\s*=\s*([^;]+)/i);
  if (plain?.[1]) return plain[1].trim().replace(/^["']|["']$/g, "");
  return fallback;
}

/**
 * Télécharge un PV en PDF via fetch + blob (évite Link Next.js / window.open).
 */
export async function downloadPvSeancePdf(id: string, locale: string): Promise<void> {
  const response = await fetch(
    `/api/pdf/pv-seance/download?id=${encodeURIComponent(id)}&locale=${encodeURIComponent(locale)}`,
    { cache: "no-store", credentials: "same-origin" }
  );

  if (!response.ok) {
    let message = "Erreur lors de la génération du PDF";
    try {
      const data = (await response.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      /* réponse non JSON */
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  if (!blob.size) {
    throw new Error("Erreur lors de la génération du PDF");
  }
  if (blob.type.includes("application/json") || blob.type.includes("text/html")) {
    throw new Error("Erreur lors de la génération du PDF");
  }

  const filename = filenameFromDisposition(
    response.headers.get("Content-Disposition"),
    `pv-seance-${id}.pdf`
  );

  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
