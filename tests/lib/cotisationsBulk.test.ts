import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  computeBulkRunId,
  createCotisationIdempotencyKey,
  runBulkCotisations,
  summarize,
  type BulkCotisationsDeps,
  type BulkLogEntry,
  type BulkMemberInput,
  type BulkProgress,
} from "@/lib/quotes/bulkCotisations";

const SOPHIE: BulkMemberInput = {
  id: "member-sophie",
  nom: "Sophie Schmid",
  email: "sophie.schmid@example.ch",
};

const JULIE: BulkMemberInput = {
  id: "member-julie",
  nom: "Julie Meier",
  email: "julie.meier@example.ch",
};

const MEMBERS = [SOPHIE, JULIE];
const RUN_ID = "run-fixe";

/**
 * Serveur simulé : une cotisation par (clé d'idempotence) et par
 * (membre + empreinte du formulaire), comme le fait l'API réelle.
 */
function createServer(options: { failPdfFor?: string[]; failEmailFor?: string[] } = {}) {
  const byIdempotencyKey = new Map<string, { id: string; numero: string }>();
  const insertedDocumentIds: string[] = [];
  const sentEmails: string[] = [];
  const pdfCalls: string[] = [];
  let sequence = 0;

  const failPdfFor = new Set(options.failPdfFor ?? []);
  const failEmailFor = new Set(options.failEmailFor ?? []);

  const deps: BulkCotisationsDeps = {
    createCotisation: async ({ idempotencyKey }) => {
      const known = byIdempotencyKey.get(idempotencyKey);
      if (known) {
        return { id: known.id, numero: known.numero, alreadyExisted: true };
      }

      sequence += 1;
      const created = {
        id: `doc-${sequence}`,
        numero: `COT-2026-${String(sequence).padStart(3, "0")}`,
      };
      byIdempotencyKey.set(idempotencyKey, created);
      insertedDocumentIds.push(created.id);
      return { ...created, alreadyExisted: false };
    },

    generatePdf: async ({ documentId, memberId }) => {
      pdfCalls.push(documentId);
      if (failPdfFor.has(memberId)) {
        failPdfFor.delete(memberId);
        throw new Error("Erreur lors de la génération du PDF — QR-facture invalide");
      }
    },

    sendEmail: async ({ documentId, memberId }) => {
      if (failEmailFor.has(memberId)) {
        failEmailFor.delete(memberId);
        throw new Error("Erreur lors de l'envoi de l'email — Resend indisponible");
      }
      sentEmails.push(documentId);
    },
  };

  return { deps, insertedDocumentIds, sentEmails, pdfCalls };
}

describe("empreinte du formulaire", () => {
  it("produit la même empreinte pour deux soumissions identiques", () => {
    const payload = { total: 10.77, dateEcheance: "2026-07-31" };

    expect(
      computeBulkRunId({ memberIds: [SOPHIE.id, JULIE.id], payload })
    ).toBe(computeBulkRunId({ memberIds: [JULIE.id, SOPHIE.id], payload }));
  });

  it("change d'empreinte dès que la saisie change", () => {
    const memberIds = [SOPHIE.id, JULIE.id];

    expect(
      computeBulkRunId({ memberIds, payload: { total: 10.77 } })
    ).not.toBe(computeBulkRunId({ memberIds, payload: { total: 20 } }));
  });
});

describe("création groupée nominale (deux membres avec email valide)", () => {
  it("crée 2 cotisations, génère 2 PDF et envoie 2 emails sans erreur", async () => {
    const server = createServer();

    const { states, summary } = await runBulkCotisations({
      members: MEMBERS,
      runId: RUN_ID,
      deps: server.deps,
    });

    expect(summary).toEqual({
      total: 2,
      created: 2,
      alreadyExisting: 0,
      emailed: 2,
      skippedNoEmail: 0,
      failed: 0,
    });

    expect(server.insertedDocumentIds).toEqual(["doc-1", "doc-2"]);
    expect(server.pdfCalls).toEqual(["doc-1", "doc-2"]);
    expect(server.sentEmails).toEqual(["doc-1", "doc-2"]);

    expect(states.map((s) => s.status)).toEqual(["done", "done"]);
    expect(states.every((s) => s.documentId !== null)).toBe(true);
    expect(states.every((s) => s.emailSent)).toBe(true);
    expect(states.every((s) => s.errorMessage === null)).toBe(true);
  });

  it("rapporte une progression réelle 0/2, 1/2 puis 2/2", async () => {
    const server = createServer();
    const progress: BulkProgress[] = [];

    await runBulkCotisations({
      members: MEMBERS,
      runId: RUN_ID,
      deps: server.deps,
      onProgress: (entry) => progress.push(entry),
    });

    const counters = progress.map((p) => `${p.processed}/${p.total}`);
    expect(counters[0]).toBe("0/2");
    expect(counters).toContain("1/2");
    expect(counters[counters.length - 1]).toBe("2/2");
    expect(progress.every((p) => p.processed <= p.total)).toBe(true);
  });

  it("dérive une clé d'idempotence de création stable et distincte par membre", async () => {
    const server = createServer();
    const keys: string[] = [];

    await runBulkCotisations({
      members: MEMBERS,
      runId: RUN_ID,
      deps: {
        ...server.deps,
        createCotisation: (input) => {
          keys.push(input.idempotencyKey);
          return server.deps.createCotisation(input);
        },
      },
    });

    expect(keys).toEqual([
      createCotisationIdempotencyKey(RUN_ID, SOPHIE.id),
      createCotisationIdempotencyKey(RUN_ID, JULIE.id),
    ]);
  });

  it("laisse la fonction centrale produire la clé de l'envoi", async () => {
    const server = createServer();
    const sendInputs: Record<string, unknown>[] = [];

    await runBulkCotisations({
      members: MEMBERS,
      runId: RUN_ID,
      deps: {
        ...server.deps,
        sendEmail: (input) => {
          sendInputs.push(input as unknown as Record<string, unknown>);
          return server.deps.sendEmail(input);
        },
      },
    });

    // Une clé fabriquée ici réintroduirait la divergence avec le bouton manuel.
    expect(sendInputs).toEqual([
      { documentId: "doc-1", memberId: SOPHIE.id, email: SOPHIE.email },
      { documentId: "doc-2", memberId: JULIE.id, email: JULIE.email },
    ]);
  });
});

describe("aucun doublon sur une nouvelle tentative", () => {
  it("ne recrée rien lorsque le même traitement est relancé de zéro", async () => {
    const server = createServer();

    await runBulkCotisations({ members: MEMBERS, runId: RUN_ID, deps: server.deps });
    const second = await runBulkCotisations({
      members: MEMBERS,
      runId: RUN_ID,
      deps: server.deps,
    });

    expect(server.insertedDocumentIds).toEqual(["doc-1", "doc-2"]);
    expect(second.summary.created).toBe(0);
    expect(second.summary.alreadyExisting).toBe(2);
  });

  it("ne recrée rien lorsqu'un membre est rejoué après un échec d'email", async () => {
    const server = createServer({ failEmailFor: [JULIE.id] });

    const first = await runBulkCotisations({
      members: MEMBERS,
      runId: RUN_ID,
      deps: server.deps,
    });

    expect(first.summary.failed).toBe(1);
    expect(server.insertedDocumentIds).toEqual(["doc-1", "doc-2"]);

    const retry = await runBulkCotisations({
      members: MEMBERS,
      runId: RUN_ID,
      deps: server.deps,
      previous: first.states,
    });

    expect(server.insertedDocumentIds).toEqual(["doc-1", "doc-2"]);
    expect(retry.summary.failed).toBe(0);
    expect(retry.summary.emailed).toBe(2);
  });
});

describe("reprise à l'étape exacte", () => {
  it("reprend à l'envoi de l'email sans régénérer le PDF déjà produit", async () => {
    const server = createServer({ failEmailFor: [SOPHIE.id] });

    const first = await runBulkCotisations({
      members: MEMBERS,
      runId: RUN_ID,
      deps: server.deps,
    });

    const sophie = first.states.find((s) => s.memberId === SOPHIE.id);
    expect(sophie?.failedStep).toBe("email");
    expect(sophie?.pdfReady).toBe(true);
    expect(sophie?.documentId).toBe("doc-1");

    const pdfCallsBefore = server.pdfCalls.length;

    const retry = await runBulkCotisations({
      members: MEMBERS,
      runId: RUN_ID,
      deps: server.deps,
      previous: first.states,
    });

    expect(server.pdfCalls.length).toBe(pdfCallsBefore);
    expect(retry.summary.failed).toBe(0);
    expect(server.sentEmails).toContain("doc-1");
  });

  it("régénère uniquement le PDF lorsque c'est cette étape qui a échoué", async () => {
    const server = createServer({ failPdfFor: [JULIE.id] });

    const first = await runBulkCotisations({
      members: MEMBERS,
      runId: RUN_ID,
      deps: server.deps,
    });

    const julie = first.states.find((s) => s.memberId === JULIE.id);
    expect(julie?.failedStep).toBe("pdf");
    expect(julie?.pdfReady).toBe(false);
    expect(julie?.emailSent).toBe(false);
    expect(server.sentEmails).toEqual(["doc-1"]);

    const retry = await runBulkCotisations({
      members: MEMBERS,
      runId: RUN_ID,
      deps: server.deps,
      previous: first.states,
    });

    expect(retry.summary.failed).toBe(0);
    expect(server.sentEmails).toEqual(["doc-1", "doc-2"]);
    // Sophie était déjà terminée : son email n'est pas renvoyé.
    expect(server.sentEmails.filter((id) => id === "doc-1")).toHaveLength(1);
  });

  it("ne retouche pas les membres déjà traités lors d'un réessai", async () => {
    const server = createServer({ failEmailFor: [JULIE.id] });

    const first = await runBulkCotisations({
      members: MEMBERS,
      runId: RUN_ID,
      deps: server.deps,
    });

    const createSpy = vi.fn(server.deps.createCotisation);
    await runBulkCotisations({
      members: MEMBERS,
      runId: RUN_ID,
      deps: { ...server.deps, createCotisation: createSpy },
      previous: first.states,
    });

    expect(createSpy).not.toHaveBeenCalled();
  });
});

describe("diagnostic des erreurs", () => {
  let logs: BulkLogEntry[];

  beforeEach(() => {
    logs = [];
  });

  it("expose l'étape fautive et le message exact par membre", async () => {
    const server = createServer({
      failPdfFor: [SOPHIE.id],
      failEmailFor: [JULIE.id],
    });

    const { states, summary } = await runBulkCotisations({
      members: MEMBERS,
      runId: RUN_ID,
      deps: server.deps,
      onLog: (entry) => logs.push(entry),
    });

    expect(summary.failed).toBe(2);

    const sophie = states.find((s) => s.memberId === SOPHIE.id);
    expect(sophie?.failedStep).toBe("pdf");
    expect(sophie?.errorMessage).toContain("génération du PDF");

    const julie = states.find((s) => s.memberId === JULIE.id);
    expect(julie?.failedStep).toBe("email");
    expect(julie?.errorMessage).toContain("envoi de l'email");

    const errorLogs = logs.filter((entry) => entry.outcome === "error");
    expect(errorLogs).toHaveLength(2);
    expect(errorLogs.map((entry) => entry.step)).toEqual(["pdf", "email"]);
    expect(errorLogs.every((entry) => entry.documentId !== null)).toBe(true);
    expect(errorLogs.every((entry) => typeof entry.stack === "string")).toBe(true);
  });

  it("conserve l'identifiant de la cotisation même quand une étape échoue", async () => {
    const server = createServer({ failPdfFor: [SOPHIE.id, JULIE.id] });

    const { states } = await runBulkCotisations({
      members: MEMBERS,
      runId: RUN_ID,
      deps: server.deps,
    });

    expect(states.map((s) => s.documentId)).toEqual(["doc-1", "doc-2"]);
  });

  it("marque un membre sans adresse email sans le compter comme erreur", async () => {
    const server = createServer();

    const { summary, states } = await runBulkCotisations({
      members: [SOPHIE, { ...JULIE, email: "  " }],
      runId: RUN_ID,
      deps: server.deps,
    });

    expect(summary.skippedNoEmail).toBe(1);
    expect(summary.failed).toBe(0);
    expect(summary.emailed).toBe(1);
    expect(states[1].status).toBe("skippedNoEmail");
  });

  it("continue le traitement des membres suivants après un échec", async () => {
    const server = createServer({ failPdfFor: [SOPHIE.id] });

    const { summary } = await runBulkCotisations({
      members: MEMBERS,
      runId: RUN_ID,
      deps: server.deps,
    });

    expect(summary.failed).toBe(1);
    expect(summary.emailed).toBe(1);
    expect(server.sentEmails).toEqual(["doc-2"]);
  });
});

describe("résumé", () => {
  it("compte séparément créations, reprises, envois et erreurs", () => {
    const summary = summarize([
      {
        memberId: "a",
        memberName: "A",
        email: "a@example.ch",
        documentId: "doc-1",
        documentNumber: "COT-2026-001",
        status: "done",
        step: "email",
        failedStep: null,
        errorMessage: null,
        alreadyExisted: false,
        pdfReady: true,
        emailSent: true,
      },
      {
        memberId: "b",
        memberName: "B",
        email: "b@example.ch",
        documentId: "doc-2",
        documentNumber: "COT-2026-002",
        status: "error",
        step: "email",
        failedStep: "email",
        errorMessage: "Resend indisponible",
        alreadyExisted: true,
        pdfReady: true,
        emailSent: false,
      },
    ]);

    expect(summary).toEqual({
      total: 2,
      created: 1,
      alreadyExisting: 1,
      emailed: 1,
      skippedNoEmail: 0,
      failed: 1,
    });
  });
});

describe("submissionMode create-only", () => {
  it("crée les cotisations et les PDF sans appeler sendEmail", async () => {
    const server = createServer();
    const sendSpy = vi.fn(server.deps.sendEmail);

    const { states, summary } = await runBulkCotisations({
      members: MEMBERS,
      runId: RUN_ID,
      submissionMode: "create-only",
      deps: { ...server.deps, sendEmail: sendSpy },
    });

    expect(summary.created).toBe(2);
    expect(summary.emailed).toBe(0);
    expect(summary.failed).toBe(0);
    expect(server.pdfCalls).toEqual(["doc-1", "doc-2"]);
    expect(sendSpy).not.toHaveBeenCalled();
    expect(server.sentEmails).toEqual([]);
    expect(states.every((s) => s.status === "done")).toBe(true);
    expect(states.every((s) => s.emailSent === false)).toBe(true);
  });

  it("en create-and-send, n'envoie que les documents créés avec succès et une adresse", async () => {
    const NO_EMAIL = {
      id: "member-no-email",
      nom: "Sans Email",
      email: "",
    };
    const server = createServer({ failPdfFor: [JULIE.id] });

    const { summary, states } = await runBulkCotisations({
      members: [SOPHIE, JULIE, NO_EMAIL],
      runId: RUN_ID,
      submissionMode: "create-and-send",
      deps: server.deps,
    });

    expect(summary.created).toBe(3);
    expect(summary.emailed).toBe(1);
    expect(summary.skippedNoEmail).toBe(1);
    expect(summary.failed).toBe(1);
    expect(server.sentEmails).toEqual(["doc-1"]);

    const julie = states.find((s) => s.memberId === JULIE.id);
    expect(julie?.status).toBe("error");
    expect(julie?.emailSent).toBe(false);
  });
});
