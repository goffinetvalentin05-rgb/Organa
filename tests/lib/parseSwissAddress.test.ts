import { describe, expect, it } from "vitest";
import {
  mergeImportAddressFields,
  parseSwissAddress,
} from "@/lib/clients/parseSwissAddress";

describe("parseSwissAddress", () => {
  it("sépare rue, NPA et localité avec virgule", () => {
    expect(parseSwissAddress("Route Principale 31, 2950 Courgenay")).toEqual({
      streetAddress: "Route Principale 31",
      postalCode: "2950",
      city: "Courgenay",
    });
  });

  it("sépare sans virgule", () => {
    expect(parseSwissAddress("Grand-Rue 18 2800 Delémont")).toEqual({
      streetAddress: "Grand-Rue 18",
      postalCode: "2800",
      city: "Delémont",
    });
  });

  it("gère une localité composée", () => {
    expect(parseSwissAddress("Avenue X 1, 2300 La Chaux-de-Fonds")).toEqual({
      streetAddress: "Avenue X 1",
      postalCode: "2300",
      city: "La Chaux-de-Fonds",
    });
  });

  it("gère NPA + localité sans rue", () => {
    expect(parseSwissAddress("2950 Courgenay")).toEqual({
      streetAddress: "",
      postalCode: "2950",
      city: "Courgenay",
    });
  });

  it("conserve une adresse sans NPA détectable", () => {
    expect(parseSwissAddress("Route Principale 31")).toEqual({
      streetAddress: "Route Principale 31",
      postalCode: "",
      city: "",
    });
  });
});

describe("mergeImportAddressFields", () => {
  it("ne modifie pas les colonnes explicites", () => {
    expect(
      mergeImportAddressFields("Rue 1", "2900", "Porrentruy")
    ).toEqual({
      adresse: "Rue 1",
      postal_code: "2900",
      city: "Porrentruy",
    });
  });

  it("parse depuis adresse si NPA et localité absents", () => {
    expect(
      mergeImportAddressFields("Chemin des Sports 4, 2942 Alle", "", "")
    ).toEqual({
      adresse: "Chemin des Sports 4",
      postal_code: "2942",
      city: "Alle",
    });
  });

  it("ne remplace pas un NPA explicite", () => {
    expect(
      mergeImportAddressFields("Rue du Stade 12, 2900 Porrentruy", "2900", "")
    ).toEqual({
      adresse: "Rue du Stade 12",
      postal_code: "2900",
      city: "Porrentruy",
    });
  });
});
