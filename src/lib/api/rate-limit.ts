import { createHash } from "node:crypto";
import { prisma } from "./prisma";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_BY_IP = 30;
const MAX_BY_PAIR = 8;

export interface LoginRateLimitResult {
  allowed: boolean;
  retryAfter: number;
  pairKey: string;
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

async function consume(
  key: string,
  limit: number,
): Promise<{ allowed: boolean; retryAfter: number }> {
  const resetAt = new Date(Date.now() + WINDOW_MS);

  const rows = await prisma.$queryRaw<{ count: number; reset_at: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "reset_at", "updated_at")
    VALUES (${key}, 1, ${resetAt}, NOW())
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimit"."reset_at" < NOW() THEN 1
        ELSE "RateLimit"."count" + 1
      END,
      "reset_at" = CASE
        WHEN "RateLimit"."reset_at" < NOW() THEN ${resetAt}
        ELSE "RateLimit"."reset_at"
      END,
      "updated_at" = NOW()
    RETURNING "count", "reset_at";
  `;

  const row = rows[0];
  if (!row) return { allowed: true, retryAfter: 0 };

  const allowed = Number(row.count) <= limit;
  const retryAfter = Math.max(
    1,
    Math.ceil((new Date(row.reset_at).getTime() - Date.now()) / 1000),
  );

  return { allowed, retryAfter };
}

export async function checkLoginRateLimit(
  request: Request,
  email: string,
): Promise<LoginRateLimitResult> {
  const ip = clientIp(request);
  const normalizedEmail = email.trim().toLowerCase();
  const ipKey = `login:ip:${hash(ip)}`;
  const pairKey = `login:pair:${hash(`${ip}|${normalizedEmail}`)}`;

  const [byIp, byPair] = await Promise.all([
    consume(ipKey, MAX_BY_IP),
    consume(pairKey, MAX_BY_PAIR),
  ]);

  if (Math.random() < 0.02) {
    void prisma.rateLimit
      .deleteMany({ where: { reset_at: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
      .catch(() => {});
  }

  return {
    allowed: byIp.allowed && byPair.allowed,
    retryAfter: Math.max(byIp.retryAfter, byPair.retryAfter),
    pairKey,
  };
}

export async function resetLoginRateLimit(pairKey: string): Promise<void> {
  await prisma.rateLimit.delete({ where: { key: pairKey } }).catch(() => {});
}
