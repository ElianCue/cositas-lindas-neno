import { prisma } from "./prisma";

/** Trae varias settings como objeto { clave: valor }. */
export async function getSettings(claves: string[]): Promise<Record<string, string>> {
  const filas = await prisma.setting.findMany({ where: { clave: { in: claves } } });
  return Object.fromEntries(filas.map((s) => [s.clave, s.valor]));
}

/** Trae una setting (devuelve `fallback` si no existe). */
export async function getSetting(clave: string, fallback = ""): Promise<string> {
  const s = await prisma.setting.findUnique({ where: { clave } });
  return s?.valor ?? fallback;
}

/** Precio de envío en pesos (setting `envio_precio`). */
export async function getPrecioEnvio(): Promise<number> {
  const valor = await getSetting("envio_precio", "0");
  const n = Number(valor);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
}
