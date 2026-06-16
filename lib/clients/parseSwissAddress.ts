export interface ParsedSwissAddress {
  streetAddress: string;
  postalCode: string;
  city: string;
}

const EMPTY: ParsedSwissAddress = {
  streetAddress: "",
  postalCode: "",
  city: "",
};

/** NPA suisse plausibles (4 chiffres, 1000–9658). */
export function isPlausibleSwissPostalCode(code: string): boolean {
  if (!/^[1-9]\d{3}$/.test(code)) return false;
  const n = Number(code);
  return n >= 1000 && n <= 9658;
}

/**
 * Tente de séparer une adresse suisse complète en rue, NPA et localité.
 * Utilisé uniquement lors de l'import de membres.
 */
export function parseSwissAddress(raw: string): ParsedSwissAddress {
  const input = raw.trim().replace(/\s+/g, " ");
  if (!input) return { ...EMPTY };

  const postalCityOnly = input.match(/^([1-9]\d{3})\s+(.+)$/);
  if (postalCityOnly && isPlausibleSwissPostalCode(postalCityOnly[1])) {
    return {
      streetAddress: "",
      postalCode: postalCityOnly[1],
      city: postalCityOnly[2].trim(),
    };
  }

  const streetPostalCity = input.match(/^(.*?)[,\s]+([1-9]\d{3})\s+(.+)$/);
  if (streetPostalCity && isPlausibleSwissPostalCode(streetPostalCity[2])) {
    return {
      streetAddress: streetPostalCity[1].replace(/[,\s]+$/g, "").trim(),
      postalCode: streetPostalCity[2],
      city: streetPostalCity[3].trim(),
    };
  }

  return { streetAddress: input, postalCode: "", city: "" };
}

/**
 * Fusionne les champs adresse importés : colonnes explicites prioritaires,
 * puis détection depuis la colonne Adresse si NPA / localité manquants.
 */
export function mergeImportAddressFields(
  adresse: string,
  postal_code: string,
  city: string
): { adresse: string; postal_code: string; city: string } {
  const street = adresse.trim();
  const postal = postal_code.trim();
  const locality = city.trim();

  if (postal && locality) {
    return { adresse: street, postal_code: postal, city: locality };
  }

  if (!street && postal && !locality) {
    return { adresse: "", postal_code: postal, city: "" };
  }

  if (!street && !postal && locality) {
    return { adresse: "", postal_code: "", city: locality };
  }

  if (postal && !locality && street) {
    const parsed = parseSwissAddress(street);
    return {
      adresse: parsed.streetAddress || street,
      postal_code: postal,
      city: parsed.city,
    };
  }

  if (!postal && locality && street) {
    const parsed = parseSwissAddress(street);
    return {
      adresse: parsed.streetAddress || street,
      postal_code: parsed.postalCode,
      city: locality,
    };
  }

  if (street) {
    const parsed = parseSwissAddress(street);
    return {
      adresse: parsed.streetAddress || street,
      postal_code: postal || parsed.postalCode,
      city: locality || parsed.city,
    };
  }

  return { adresse: street, postal_code: postal, city: locality };
}
