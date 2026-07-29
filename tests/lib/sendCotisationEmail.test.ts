import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DocumentEmailError,
  sendCotisationEmail,
  sendInvoiceEmail,
} from "@/lib/documents/sendDocumentEmail";
import { runBulkCotisations } from "@/lib/quotes/bulkCotisations";

type RecordedRequest = {
  url: string;
  method: string;
  idempotencyKey: string | null;
  contentType: string | null;
  body: unknown;
};

const SOPHIE = {
  id: "member-sophie",
  nom: "Sophie Schmid",
  email: "sophie.schmid@example.ch",
};
const JULIE = {
  id: "member-julie",
  nom: "Julie Meier",
  email: "julie.meier@example.ch",
};

let requests: RecordedRequest[];

/** Capture les appels réseau et répond comme `/api/email`. */
function mockEmailApi(
  responder: (request: RecordedRequest) => { status: number; body: unknown } = () => ({
    status: 200,
    body: { success: true, message: "Email envoyé avec succès", emailId: "email-1" },
  })
) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    const recorded: RecordedRequest = {
      url: String(input),
      method: init?.method ?? "GET",
      idempotencyKey: headers.get("Idempotency-Key"),
      contentType: headers.get("Content-Type"),
      body: typeof init?.body === "string" ? JSON.parse(init.body) : init?.body,
    };
    requests.push(recorded);

    const { status, body } = responder(recorded);
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  requests = [];
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fonction centrale d'envoi", () => {
  it("appelle /api/email avec le corps attendu par le serveur", async () => {
    mockEmailApi();

    const result = await sendCotisationEmail({
      cotisationId: "doc-42",
      recipientEmail: SOPHIE.email,
      memberId: SOPHIE.id,
      clubId: "club-1",
    });

    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe("/api/email");
    expect(requests[0].method).toBe("POST");
    expect(requests[0].contentType).toBe("application/json");
    expect(requests[0].body).toEqual({ type: "cotisation", documentId: "doc-42" });
    expect(result.emailId).toBe("email-1");
  });

  it("ne transmet ni destinataire ni club au serveur, qui les résout lui-même", async () => {
    mockEmailApi();

    await sendCotisationEmail({
      cotisationId: "doc-42",
      recipientEmail: "attaquant@example.com",
      memberId: SOPHIE.id,
      clubId: "club-1",
    });

    expect(Object.keys(requests[0].body as object).sort()).toEqual([
      "documentId",
      "type",
    ]);
  });

  it("produit une clé d'idempotence différente à chaque tentative", async () => {
    mockEmailApi();

    await sendCotisationEmail({ cotisationId: "doc-1" });
    await sendCotisationEmail({ cotisationId: "doc-1" });

    const [first, second] = requests.map((r) => r.idempotencyKey);
    expect(first).toBeTruthy();
    expect(second).toBeTruthy();
    expect(second).not.toBe(first);
  });

  it("envoie une facture sur la même route avec le type facture", async () => {
    mockEmailApi();

    await sendInvoiceEmail({ invoiceId: "inv-7", recipientEmail: "club@example.ch" });

    expect(requests[0].url).toBe("/api/email");
    expect(requests[0].body).toEqual({ type: "facture", documentId: "inv-7" });
  });

  it("remonte l'étape et le détail renvoyés par le serveur", async () => {
    mockEmailApi(() => ({
      status: 500,
      body: {
        error: "Erreur lors de l'envoi de l'email",
        step: "send",
        details: "Domain not verified",
      },
    }));

    const error = await sendCotisationEmail({ cotisationId: "doc-9" }).catch((e) => e);

    expect(error).toBeInstanceOf(DocumentEmailError);
    expect((error as DocumentEmailError).step).toBe("send");
    expect((error as DocumentEmailError).status).toBe(500);
    expect((error as DocumentEmailError).details).toBe("Domain not verified");
    expect((error as DocumentEmailError).message).toContain("Domain not verified");
  });

  it("échoue sans appel réseau quand le destinataire n'a pas d'adresse", async () => {
    const fetchMock = mockEmailApi();

    await expect(
      sendCotisationEmail({ cotisationId: "doc-9", recipientEmail: "   " })
    ).rejects.toBeInstanceOf(DocumentEmailError);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("échoue sans appel réseau quand l'identifiant de cotisation est absent", async () => {
    const fetchMock = mockEmailApi();

    await expect(sendCotisationEmail({ cotisationId: "" })).rejects.toBeInstanceOf(
      DocumentEmailError
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("la création groupée utilise la même fonction d'envoi que le bouton manuel", () => {
  /**
   * Serveur simulé pour la création : une cotisation par clé d'idempotence,
   * comme le fait `POST /api/documents`.
   */
  function createDocumentsApi() {
    const byKey = new Map<string, { id: string; numero: string }>();
    const inserted: string[] = [];
    let sequence = 0;

    return {
      inserted,
      createCotisation: async ({ idempotencyKey }: { idempotencyKey: string }) => {
        const known = byKey.get(idempotencyKey);
        if (known) return { ...known, alreadyExisted: true };

        sequence += 1;
        const created = {
          id: `doc-${sequence}`,
          numero: `COT-2026-${String(sequence).padStart(3, "0")}`,
        };
        byKey.set(idempotencyKey, created);
        inserted.push(created.id);
        return { ...created, alreadyExisted: false };
      },
    };
  }

  it("enregistre 2 cotisations et appelle l'envoi central exactement 2 fois", async () => {
    mockEmailApi();
    const documentsApi = createDocumentsApi();
    const sendSpy = vi.fn(sendCotisationEmail);

    const { summary } = await runBulkCotisations({
      members: [SOPHIE, JULIE],
      runId: "run-1",
      deps: {
        createCotisation: documentsApi.createCotisation,
        generatePdf: async () => {},
        sendEmail: async ({ documentId, memberId, email }) => {
          await sendSpy({
            cotisationId: documentId,
            recipientEmail: email,
            memberId,
          });
        },
      },
    });

    expect(documentsApi.inserted).toEqual(["doc-1", "doc-2"]);
    expect(summary.created).toBe(2);
    expect(summary.emailed).toBe(2);
    expect(summary.failed).toBe(0);

    expect(sendSpy).toHaveBeenCalledTimes(2);
    expect(sendSpy).toHaveBeenNthCalledWith(1, {
      cotisationId: "doc-1",
      recipientEmail: SOPHIE.email,
      memberId: SOPHIE.id,
    });
    expect(sendSpy).toHaveBeenNthCalledWith(2, {
      cotisationId: "doc-2",
      recipientEmail: JULIE.email,
      memberId: JULIE.id,
    });

    // Les requêtes réellement émises sont celles du bouton manuel.
    expect(requests.map((r) => r.body)).toEqual([
      { type: "cotisation", documentId: "doc-1" },
      { type: "cotisation", documentId: "doc-2" },
    ]);
    expect(new Set(requests.map((r) => r.idempotencyKey)).size).toBe(2);
  });

  it("n'émet aucune requête d'envoi pour un membre sans adresse email", async () => {
    mockEmailApi();
    const documentsApi = createDocumentsApi();

    const { summary } = await runBulkCotisations({
      members: [SOPHIE, { ...JULIE, email: "" }],
      runId: "run-1",
      deps: {
        createCotisation: documentsApi.createCotisation,
        generatePdf: async () => {},
        sendEmail: async ({ documentId, memberId, email }) => {
          await sendCotisationEmail({
            cotisationId: documentId,
            recipientEmail: email,
            memberId,
          });
        },
      },
    });

    expect(summary.skippedNoEmail).toBe(1);
    expect(summary.failed).toBe(0);
    expect(requests).toHaveLength(1);
    expect(requests[0].body).toEqual({ type: "cotisation", documentId: "doc-1" });
  });

  it("isole l'échec d'un membre sans empêcher l'envoi des suivants", async () => {
    mockEmailApi((request) => {
      const body = request.body as { documentId: string };
      if (body.documentId === "doc-1") {
        return {
          status: 500,
          body: { error: "Erreur lors de l'envoi de l'email", step: "send" },
        };
      }
      return { status: 200, body: { success: true, emailId: "email-2" } };
    });

    const documentsApi = createDocumentsApi();

    const { states, summary } = await runBulkCotisations({
      members: [SOPHIE, JULIE],
      runId: "run-1",
      deps: {
        createCotisation: documentsApi.createCotisation,
        generatePdf: async () => {},
        sendEmail: async ({ documentId, memberId, email }) => {
          await sendCotisationEmail({
            cotisationId: documentId,
            recipientEmail: email,
            memberId,
          });
        },
      },
    });

    expect(summary.created).toBe(2);
    expect(summary.emailed).toBe(1);
    expect(summary.failed).toBe(1);

    const sophie = states.find((s) => s.memberId === SOPHIE.id);
    expect(sophie?.failedStep).toBe("email");
    expect(sophie?.documentId).toBe("doc-1");
    expect(sophie?.errorMessage).toContain("envoi de l'email");
  });

  it("le réessai des erreurs renvoie l'email sans recréer de document", async () => {
    let failFirstSend = true;
    mockEmailApi((request) => {
      const body = request.body as { documentId: string };
      if (body.documentId === "doc-1" && failFirstSend) {
        failFirstSend = false;
        return {
          status: 500,
          body: { error: "Erreur lors de l'envoi de l'email", step: "send" },
        };
      }
      return { status: 200, body: { success: true, emailId: "email-ok" } };
    });

    const documentsApi = createDocumentsApi();
    const createSpy = vi.fn(documentsApi.createCotisation);
    const generatePdf = vi.fn(async () => {});

    const deps = {
      createCotisation: createSpy,
      generatePdf,
      sendEmail: async ({
        documentId,
        memberId,
        email,
      }: {
        documentId: string;
        memberId: string;
        email: string;
      }) => {
        await sendCotisationEmail({
          cotisationId: documentId,
          recipientEmail: email,
          memberId,
        });
      },
    };

    const first = await runBulkCotisations({
      members: [SOPHIE, JULIE],
      runId: "run-1",
      deps,
    });
    expect(first.summary.failed).toBe(1);
    expect(createSpy).toHaveBeenCalledTimes(2);

    const pdfCallsAfterFirst = generatePdf.mock.calls.length;
    createSpy.mockClear();

    const retry = await runBulkCotisations({
      members: [SOPHIE, JULIE],
      runId: "run-1",
      deps,
      previous: first.states,
    });

    // Aucune création, aucune régénération de PDF : seul l'envoi est rejoué.
    expect(createSpy).not.toHaveBeenCalled();
    expect(documentsApi.inserted).toEqual(["doc-1", "doc-2"]);
    expect(generatePdf.mock.calls.length).toBe(pdfCallsAfterFirst);

    expect(retry.summary.failed).toBe(0);
    expect(retry.summary.emailed).toBe(2);
    expect(retry.summary.created).toBe(2);

    // Un seul envoi supplémentaire, pour la cotisation en échec.
    const sends = requests.filter((r) => r.url === "/api/email");
    expect(sends).toHaveLength(3);
    expect(sends[2].body).toEqual({ type: "cotisation", documentId: "doc-1" });
  });

  it("ne renvoie pas l'email d'un membre déjà traité lors d'un réessai", async () => {
    mockEmailApi((request) => {
      const body = request.body as { documentId: string };
      if (body.documentId === "doc-2") {
        return { status: 500, body: { error: "Resend indisponible", step: "send" } };
      }
      return { status: 200, body: { success: true, emailId: "email-ok" } };
    });

    const documentsApi = createDocumentsApi();
    const deps = {
      createCotisation: documentsApi.createCotisation,
      generatePdf: async () => {},
      sendEmail: async ({
        documentId,
        memberId,
        email,
      }: {
        documentId: string;
        memberId: string;
        email: string;
      }) => {
        await sendCotisationEmail({
          cotisationId: documentId,
          recipientEmail: email,
          memberId,
        });
      },
    };

    const first = await runBulkCotisations({
      members: [SOPHIE, JULIE],
      runId: "run-1",
      deps,
    });

    await runBulkCotisations({
      members: [SOPHIE, JULIE],
      runId: "run-1",
      deps,
      previous: first.states,
    });

    const sentToDoc1 = requests.filter(
      (r) => (r.body as { documentId: string }).documentId === "doc-1"
    );
    expect(sentToDoc1).toHaveLength(1);
  });
});
