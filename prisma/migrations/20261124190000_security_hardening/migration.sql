-- Security hardening: token público de pedidos, rate limiting y cierre de la Data API.

-- 1) Token público no adivinable para la confirmación de pedidos.
ALTER TABLE "Order" ADD COLUMN "public_token" TEXT;
UPDATE "Order" SET "public_token" = gen_random_uuid()::text WHERE "public_token" IS NULL;
ALTER TABLE "Order" ALTER COLUMN "public_token" SET NOT NULL;
CREATE UNIQUE INDEX "Order_public_token_key" ON "Order"("public_token");

-- 2) Rate limiting de login (respaldado en Postgres).
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "reset_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);
CREATE INDEX "RateLimit_reset_at_idx" ON "RateLimit"("reset_at");

-- 3) La app usa Prisma server-side; PostgREST no necesita acceso al esquema public.
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

-- 4) Defensa en profundidad: RLS deny-by-default. Prisma conecta como owner y no se ve afectado.
ALTER TABLE public."User"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Category"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Product"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProductImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Order"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."OrderItem"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Payment"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AuditLog"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Setting"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Counter"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."RateLimit"    ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
