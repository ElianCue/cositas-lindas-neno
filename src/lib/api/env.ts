import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET debe tener al menos 32 caracteres"),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_TIENDA_NOMBRE: z.string().default("Cositas Lindas Neno"),
  NEXT_PUBLIC_WHATSAPP_NUMERO: z.string().default(""),
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.warn(
    "⚠️  Variables de entorno inválidas:",
    parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
  );
}

export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  tiendaNombre: process.env.NEXT_PUBLIC_TIENDA_NOMBRE ?? "Cositas Lindas Neno",
  whatsappNumero: process.env.NEXT_PUBLIC_WHATSAPP_NUMERO ?? "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  nodeEnv: (process.env.NODE_ENV || "development") as
    | "development"
    | "production"
    | "test",
  get isDev() {
    return this.nodeEnv !== "production";
  },
};

export type Env = typeof env;
