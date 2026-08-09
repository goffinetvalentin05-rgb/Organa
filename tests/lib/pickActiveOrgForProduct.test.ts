import { describe, expect, it } from "vitest";
import { pickActiveOrgForProduct, type ProductOrg } from "@/lib/auth/product-access";

function org(
  clubId: string,
  acceptedAt: string | null = null
): ProductOrg {
  return {
    clubId,
    role: "admin",
    acceptedAt,
    productType: "sport",
  };
}

describe("pickActiveOrgForProduct", () => {
  const userId = "user-personal";
  const clubId = "club-fc";

  it("préfère un club externe au club perso même si le cookie pointe sur le perso", () => {
    const orgs = [org(userId, "2024-01-01"), org(clubId, "2025-06-01")];
    const picked = pickActiveOrgForProduct(orgs, userId, userId);
    expect(picked?.clubId).toBe(clubId);
  });

  it("honore un cookie pointant vers un club externe", () => {
    const other = "club-other";
    const orgs = [org(userId), org(clubId, "2025-01-01"), org(other, "2025-08-01")];
    const picked = pickActiveOrgForProduct(orgs, userId, other);
    expect(picked?.clubId).toBe(other);
  });

  it("reste sur le perso s'il n'y a aucun club externe", () => {
    const orgs = [org(userId)];
    const picked = pickActiveOrgForProduct(orgs, userId, userId);
    expect(picked?.clubId).toBe(userId);
  });

  it("sans cookie, choisit le club externe le plus récent", () => {
    const orgs = [
      org(userId),
      org("club-a", "2024-01-01"),
      org("club-b", "2025-01-01"),
    ];
    const picked = pickActiveOrgForProduct(orgs, userId, null);
    expect(picked?.clubId).toBe("club-b");
  });
});
