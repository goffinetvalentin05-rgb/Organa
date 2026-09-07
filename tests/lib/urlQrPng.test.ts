import { describe, expect, it } from "vitest";
import { urlQrPngDataUri } from "@/lib/pdf/urlQrPng";

describe("urlQrPngDataUri", () => {
  it("encodes a payment URL as a PNG data URI", () => {
    const uri = urlQrPngDataUri("https://obillz.ch/cotisation/abc");
    expect(uri).toMatch(/^data:image\/png;base64,/);
    const bytes = Buffer.from(uri!.slice("data:image/png;base64,".length), "base64");
    expect(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(
      true
    );
  });
});
