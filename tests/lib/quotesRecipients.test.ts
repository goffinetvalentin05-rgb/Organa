import { describe, expect, it } from "vitest";
import {
  findDuplicateTargets,
  getMembersByCategory,
  getPlayers,
  getTeamsWithCounts,
  resolveCotisationTargets,
  type CotisationClient,
  type ExistingQuoteSummary,
} from "@/lib/quotes/recipients";

const clients: CotisationClient[] = [
  {
    id: "1",
    nom: "Alice",
    email: "a@test.ch",
    telephone: "",
    adresse: "",
    role: "player",
    category: "juniors_b",
  },
  {
    id: "2",
    nom: "Bob",
    email: "",
    telephone: "",
    adresse: "",
    role: "player",
    category: "juniors_b",
  },
  {
    id: "3",
    nom: "Coach",
    email: "c@test.ch",
    telephone: "",
    adresse: "",
    role: "coach",
    category: "juniors_b",
  },
  {
    id: "4",
    nom: "Dave",
    email: "d@test.ch",
    telephone: "",
    adresse: "",
    role: "player",
    category: "seniors",
  },
  {
    id: "5",
    nom: "Eve",
    email: "e@test.ch",
    telephone: "",
    adresse: "",
    role: "treasurer",
    category: "president",
  },
];

describe("resolveCotisationTargets", () => {
  it("cible un seul membre en mode individuel", () => {
    const targets = resolveCotisationTargets("individual", clients, "2", "");
    expect(targets).toHaveLength(1);
    expect(targets[0]?.id).toBe("2");
  });

  it("cible uniquement les membres de l'équipe choisie", () => {
    const targets = resolveCotisationTargets("team", clients, "", "juniors_b");
    expect(targets.map((t) => t.id).sort()).toEqual(["1", "2", "3"]);
  });

  it("mode tous : uniquement les joueurs", () => {
    const targets = resolveCotisationTargets("all", clients, "", "");
    expect(targets.map((t) => t.id).sort()).toEqual(["1", "2", "4"]);
  });

  it("équipe vide si catégorie inconnue", () => {
    expect(resolveCotisationTargets("team", clients, "", "unknown_team")).toEqual([]);
  });
});

describe("getTeamsWithCounts", () => {
  it("ignore les rôles mal placés en catégorie", () => {
    const teams = getTeamsWithCounts(clients);
    const values = teams.map((t) => t.value);
    expect(values).toContain("juniors_b");
    expect(values).toContain("seniors");
    expect(values).not.toContain("president");
  });
});

describe("getMembersByCategory", () => {
  it("filtre par égalité stricte de catégorie", () => {
    expect(getMembersByCategory(clients, "juniors_b")).toHaveLength(3);
    expect(getMembersByCategory(clients, "seniors")).toHaveLength(1);
  });
});

describe("getPlayers", () => {
  it("accepte le slug joueur en français", () => {
    const fr: CotisationClient = {
      id: "fr",
      nom: "Jean",
      email: "",
      telephone: "",
      adresse: "",
      role: "joueur",
      category: null,
    };
    expect(getPlayers([fr])).toHaveLength(1);
  });
});

describe("findDuplicateTargets", () => {
  const existing: ExistingQuoteSummary[] = [
    {
      client_id: "1",
      date_echeance: "2026-12-31",
      total_ttc: 100,
      status: "envoye",
    },
  ];

  it("détecte un doublon même montant et échéance", () => {
    const dup = findDuplicateTargets(
      [clients[0]],
      existing,
      "2026-12-31",
      100
    );
    expect(dup).toHaveLength(1);
  });

  it("ignore les cotisations refusées", () => {
    const dup = findDuplicateTargets(
      [clients[0]],
      [{ ...existing[0], status: "refuse" }],
      "2026-12-31",
      100
    );
    expect(dup).toHaveLength(0);
  });
});
