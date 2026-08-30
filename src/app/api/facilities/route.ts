import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const facilities = await db.facility.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });
  return NextResponse.json({ facilities });
}
