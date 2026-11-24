import { NextResponse } from "next/server";
import { prisma } from "@/lib/api/prisma";

/** Chequea conexión a la base. Usado para verificar el DATABASE_URL. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "success", data: { db: "ok" } });
  } catch (error) {
    console.error("[health] sin conexión a la base:", error);
    return NextResponse.json(
      { status: "error", message: "Sin conexión a la base de datos" },
      { status: 503 },
    );
  }
}
