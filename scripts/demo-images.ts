import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

/**
 * Sube imágenes de ejemplo al bucket `productos` y las asocia a los productos
 * que no tienen ninguna foto (idempotente: no toca productos que ya tienen).
 *
 * Uso: pnpm db:imagenes
 */

type Icono = "scrunchie" | "llavero" | "mariposa" | "kit" | "cinta";

const DISENOS: Record<string, { base: string; acento: string; icono: Icono }> = {
  "scrunchie-terciopelo": { base: "#d94f7a", acento: "#f4a7bd", icono: "scrunchie" },
  "scrunchie-algodon": { base: "#7c9e7f", acento: "#bcd7be", icono: "scrunchie" },
  "scrunchie-satinado": { base: "#a174c9", acento: "#d9c4f2", icono: "scrunchie" },
  "llavero-artesanal": { base: "#e3a45c", acento: "#f5d0a1", icono: "llavero" },
  "broche-mariposa": { base: "#d94f7a", acento: "#f4a7bd", icono: "mariposa" },
  "kit-regalo-neno": { base: "#7c9e7f", acento: "#a8c9ab", icono: "kit" },
  "cinta-estate": { base: "#a174c9", acento: "#d9c4f2", icono: "cinta" },
};

function iconoSvg(icono: Icono, base: string, acento: string): string {
  switch (icono) {
    case "scrunchie":
      return `
        <g transform="translate(400,330)">
          <circle r="150" fill="none" stroke="${acento}" stroke-width="78" stroke-dasharray="62 26" stroke-linecap="round"/>
          <circle r="150" fill="none" stroke="${base}" stroke-width="62"/>
          <circle r="150" fill="none" stroke="#ffffff" stroke-width="14" opacity="0.35" stroke-dasharray="40 60"/>
        </g>`;
    case "llavero":
      return `
        <g transform="translate(400,330)">
          <circle cx="0" cy="-90" r="62" fill="none" stroke="${base}" stroke-width="28"/>
          <circle cx="0" cy="-90" r="26" fill="#fffaf7"/>
          <rect x="-14" y="-30" width="28" height="150" rx="14" fill="${base}"/>
          <rect x="14" y="60" width="52" height="24" rx="12" fill="${acento}"/>
          <rect x="14" y="98" width="36" height="22" rx="11" fill="${acento}"/>
          <circle cx="0" cy="-90" r="62" fill="none" stroke="${acento}" stroke-width="8" opacity="0.7"/>
        </g>`;
    case "mariposa":
      return `
        <g transform="translate(400,330)">
          <path d="M0,-10 C-45,-130 -190,-150 -175,-45 C-165,35 -60,70 0,20 Z" fill="${base}"/>
          <path d="M0,-10 C45,-130 190,-150 175,-45 C165,35 60,70 0,20 Z" fill="${acento}"/>
          <path d="M0,20 C-45,80 -125,130 -105,180 C-88,215 -22,168 0,110 Z" fill="${acento}"/>
          <path d="M0,20 C45,80 125,130 105,180 C88,215 22,168 0,110 Z" fill="${base}"/>
          <rect x="-10" y="-80" width="20" height="180" rx="10" fill="#2c2430"/>
          <path d="M-5,-80 C-28,-128 -60,-138 -76,-144" stroke="#2c2430" stroke-width="8" fill="none" stroke-linecap="round"/>
          <path d="M5,-80 C28,-128 60,-138 76,-144" stroke="#2c2430" stroke-width="8" fill="none" stroke-linecap="round"/>
        </g>`;
    case "kit":
      return `
        <g transform="translate(400,340)">
          <rect x="-170" y="-30" width="340" height="210" rx="26" fill="${base}"/>
          <rect x="-170" y="-92" width="340" height="86" rx="20" fill="${acento}"/>
          <rect x="-30" y="-92" width="60" height="272" fill="#fffaf7" opacity="0.9"/>
          <path d="M0,-92 C-62,-168 -148,-156 -116,-98 C-100,-72 -38,-82 0,-92 Z" fill="#fffaf7"/>
          <path d="M0,-92 C62,-168 148,-156 116,-98 C100,-72 38,-82 0,-92 Z" fill="#fffaf7"/>
          <circle cx="-86" cy="-112" r="16" fill="#fffaf7"/>
          <circle cx="86" cy="-112" r="16" fill="#fffaf7"/>
        </g>`;
    case "cinta":
      return `
        <g transform="translate(400,330)">
          <path d="M0,0 C-160,-170 -280,-30 -110,44 Z" fill="${base}"/>
          <path d="M0,0 C160,-170 280,-30 110,44 Z" fill="${acento}"/>
          <path d="M-44,44 L-100,190 L0,124 L100,190 L44,44 Z" fill="${base}" opacity="0.92"/>
          <circle r="46" fill="#fffaf7"/>
          <circle r="32" fill="${acento}"/>
        </g>`;
  }
}

function svgProducto(nombre: string, diseno: { base: string; acento: string; icono: Icono }): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fffaf7"/>
      <stop offset="100%" stop-color="${diseno.acento}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <circle cx="710" cy="110" r="170" fill="${diseno.base}" opacity="0.16"/>
  <circle cx="80" cy="720" r="130" fill="${diseno.base}" opacity="0.14"/>
  <circle cx="400" cy="345" r="255" fill="#ffffff" opacity="0.55"/>
  ${iconoSvg(diseno.icono, diseno.base, diseno.acento)}
  <text x="400" y="672" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="54" font-weight="bold" fill="#2c2430">${nombre}</text>
  <text x="400" y="722" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#d94f7a" letter-spacing="6">COSITAS LINDAS NENO</text>
</svg>`;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const productos = await prisma.product.findMany({ include: { imagenes: true } });
  let subidas = 0;

  for (const producto of productos) {
    if (producto.imagenes.length > 0) continue;

    const diseno = DISENOS[producto.slug] ?? { base: "#d94f7a", acento: "#f4a7bd", icono: "scrunchie" };
    const svg = svgProducto(producto.nombre, diseno);
    const path = `demo/${producto.slug}.svg`;

    const { error } = await supabase.storage
      .from("productos")
      .upload(path, Buffer.from(svg, "utf-8"), { contentType: "image/svg+xml", upsert: true });

    if (error) {
      console.error(`✗ ${producto.nombre}: ${error.message}`);
      continue;
    }

    const { data } = supabase.storage.from("productos").getPublicUrl(path);

    await prisma.productImage.create({
      data: {
        product_id: producto.id,
        url: data.publicUrl,
        path,
        orden: 0,
        alt: producto.nombre,
      },
    });

    console.log(`✓ ${producto.nombre} → ${data.publicUrl}`);
    subidas++;
  }

  console.log(subidas === 0 ? "Ya todos los productos tenían imagen." : `Imágenes demo: ${subidas} subidas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
