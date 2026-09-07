import { createRequire } from "node:module";
import path from "node:path";
import { deflateSync } from "node:zlib";

type QrCodeLike = {
  size: number;
  getModule: (x: number, y: number) => boolean;
};

/**
 * QR code URL classique (PNG) pour les PDF de cotisation Stripe.
 * N’utilise pas la QR-facture suisse : encodage d’une URL via le générateur
 * déjà présent dans swissqrbill, sans slip ni croix suisse.
 */
export function urlQrPngDataUri(url: string): string | null {
  if (!url) return null;
  try {
    const qr = encodeQr(url);
    const png = pngFromQr(qr, 4, 4);
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch (error) {
    console.warn("[pdf] QR URL cotisation impossible à générer:", error);
    return null;
  }
}

function encodeQr(text: string): QrCodeLike {
  const generatorPath = path.join(
    process.cwd(),
    "node_modules/swissqrbill/lib/cjs/shared/qr-code-generator.cjs"
  );
  const requireQr = createRequire(path.join(process.cwd(), "package.json"));
  const { qrcodegen } = requireQr(generatorPath) as {
    qrcodegen: {
      QrCode: {
        encodeText: (value: string, ecl: unknown) => QrCodeLike;
        Ecc: { MEDIUM: unknown };
      };
    };
  };
  return qrcodegen.QrCode.encodeText(text, qrcodegen.QrCode.Ecc.MEDIUM);
}

function pngFromQr(qr: QrCodeLike, scale: number, quiet: number): Buffer {
  const modules = qr.size + quiet * 2;
  const width = modules * scale;
  const raw = Buffer.alloc((width + 1) * width, 255);
  for (let y = 0; y < width; y += 1) {
    raw[y * (width + 1)] = 0;
  }
  for (let my = 0; my < qr.size; my += 1) {
    for (let mx = 0; mx < qr.size; mx += 1) {
      if (!qr.getModule(mx, my)) continue;
      const x0 = (mx + quiet) * scale;
      const y0 = (my + quiet) * scale;
      for (let dy = 0; dy < scale; dy += 1) {
        const row = y0 + dy;
        const offset = row * (width + 1) + 1 + x0;
        raw.fill(0, offset, offset + scale);
      }
    }
  }
  return wrapPng(width, width, raw);
}

function wrapPng(width: number, height: number, raw: Buffer): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 0;
  const chunks = [
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ];
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    ...chunks,
  ]);
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, "ascii");
  const crc = crc32(Buffer.concat([typeBuf, data]));
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc >>> 0, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
