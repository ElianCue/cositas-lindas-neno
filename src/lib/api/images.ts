export interface DetectedImage {
  mime: string;
  ext: string;
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Detecta el tipo real de imagen por sus bytes (magic numbers), sin confiar
 * en el `Content-Type` que manda el navegador.
 */
export function detectImageType(buffer: Buffer): DetectedImage | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }

  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return { mime: "image/png", ext: "png" };
  }

  if (buffer.length >= 6) {
    const cabecera = buffer.toString("ascii", 0, 6);
    if (cabecera === "GIF87a" || cabecera === "GIF89a") {
      return { mime: "image/gif", ext: "gif" };
    }
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { mime: "image/webp", ext: "webp" };
  }

  if (buffer.length >= 12 && buffer.toString("ascii", 4, 8) === "ftyp") {
    const marcas = buffer.toString("ascii", 8, Math.min(buffer.length, 32));
    if (marcas.includes("avif") || marcas.includes("avis")) {
      return { mime: "image/avif", ext: "avif" };
    }
  }

  return null;
}
