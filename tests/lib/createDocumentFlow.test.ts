import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createAndSend,
  createDocument,
  createOnly,
  retryDocumentEmail,
} from "@/lib/documents/createDocumentFlow";

type RecordedRequest = {
  url: string;
  method: string;
  body: unknown;
};

let requests: RecordedRequest[];
let createCalls: number;

function mockApis(
  emailResponder: () => { status: number; body: unknown } = () => ({
    status: 200,
    body: { success: true, emailId: "email-1" },
  })
) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const recorded: RecordedRequest = {
        url,
        method: init?.method ?? "GET",
        body: typeof init?.body === "string" ? JSON.parse(init.body) : init?.body,
      };
      requests.push(recorded);

      if (url.includes("/api/email")) {
        const { status, body } = emailResponder();
        return new Response(JSON.stringify(body), {
          status,
          headers: { "Content-Type": "application/json" },
        });
      }

      // PATCH statut « envoyé »
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    })
  );
}

beforeEach(() => {
  requests = [];
  createCalls = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const createFn = async () => {
  createCalls += 1;
  return { documentId: `doc-${createCalls}` };
};

const emailRequests = () => requests.filter((r) => r.url.includes("/api/email"));

describe("createDocument / createOnly", () => {
  it("crée le document sans appeler la fonction d'envoi", async () => {
    mockApis();

    const outcome = await createOnly({
      type: "cotisation",
      createFn,
    });

    expect(outcome.emailSent).toBe(false);
    expect(outcome.document.documentId).toBe("doc-1");
    expect(createCalls).toBe(1);
    expect(requests).toHaveLength(0);
  });

  it("createDocument n'envoie aucun e-mail", async () => {
    mockApis();
    const doc = await createDocument({ type: "facture", createFn });
    expect(doc.documentId).toBe("doc-1");
    expect(requests).toHaveLength(0);
  });
});

describe("createAndSend", () => {
  it("crée le document puis appelle l'envoi exactement une fois", async () => {
    mockApis();
    const phases: string[] = [];

    const outcome = await createAndSend({
      type: "cotisation",
      recipientEmail: "sophie@example.ch",
      memberId: "m1",
      onPhase: (phase) => phases.push(phase),
      createFn,
    });

    expect(outcome.emailSent).toBe(true);
    expect(createCalls).toBe(1);
    expect(emailRequests()).toHaveLength(1);
    expect(emailRequests()[0].body).toEqual({
      type: "cotisation",
      documentId: "doc-1",
    });
    expect(phases).toEqual(["creating", "sending"]);
    expect(
      requests.some(
        (r) =>
          r.url.includes("/api/documents") &&
          r.method === "PATCH" &&
          (r.body as { statut?: string })?.statut === "envoye"
      )
    ).toBe(true);
  });

  it("en cas d'échec de l'envoi, le document reste créé", async () => {
    mockApis(() => ({
      status: 500,
      body: { error: "Resend indisponible" },
    }));

    const outcome = await createAndSend({
      type: "facture",
      recipientEmail: "client@example.ch",
      createFn,
    });

    expect(outcome.emailSent).toBe(false);
    if (!outcome.emailSent) {
      expect(outcome.document.documentId).toBe("doc-1");
      expect(outcome.emailError).toBeTruthy();
    }
    expect(createCalls).toBe(1);
    expect(
      requests.some((r) => (r.body as { statut?: string })?.statut === "envoye")
    ).toBe(false);
  });

  it("un nouvel essai d'envoi ne recrée pas le document", async () => {
    let failOnce = true;
    mockApis(() => {
      if (failOnce) {
        failOnce = false;
        return { status: 500, body: { error: "temporaire" } };
      }
      return { status: 200, body: { success: true, emailId: "email-2" } };
    });

    const first = await createAndSend({
      type: "cotisation",
      recipientEmail: "a@b.ch",
      createFn,
    });
    expect(first.emailSent).toBe(false);
    expect(createCalls).toBe(1);

    const retry = await createAndSend({
      type: "cotisation",
      recipientEmail: "a@b.ch",
      existingDocumentId: first.document.documentId,
      createFn,
    });

    expect(retry.emailSent).toBe(true);
    expect(createCalls).toBe(1);
    expect(emailRequests()).toHaveLength(2);
    expect(emailRequests()[1].body).toEqual({
      type: "cotisation",
      documentId: "doc-1",
    });
  });

  it("retryDocumentEmail n'appelle pas createFn", async () => {
    mockApis();
    await retryDocumentEmail({
      type: "facture",
      documentId: "doc-existing",
      recipientEmail: "x@y.ch",
    });
    expect(createCalls).toBe(0);
    expect(emailRequests()).toHaveLength(1);
    expect(emailRequests()[0].body).toEqual({
      type: "facture",
      documentId: "doc-existing",
    });
  });
});

describe("anti double-traitement (appelant)", () => {
  it("un verrou synchrone empêche un second create pendant le traitement", async () => {
    mockApis();
    let resolveCreate: ((value: { documentId: string }) => void) | null = null;
    const slowCreate = () =>
      new Promise<{ documentId: string }>((resolve) => {
        createCalls += 1;
        resolveCreate = resolve;
      });

    let locked = false;
    const runGuarded = async () => {
      if (locked) return null;
      locked = true;
      try {
        return await createOnly({ type: "cotisation", createFn: slowCreate });
      } finally {
        locked = false;
      }
    };

    const firstPromise = runGuarded();
    const second = await runGuarded();
    expect(second).toBeNull();
    expect(createCalls).toBe(1);

    resolveCreate?.({ documentId: "doc-1" });
    const first = await firstPromise;
    expect(first?.document.documentId).toBe("doc-1");
  });
});
