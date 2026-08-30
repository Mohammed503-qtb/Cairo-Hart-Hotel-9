import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  const offers = await db.offer.findMany({
    where: {
      isActive: true,
      validTo: { gte: now },
    },
    orderBy: { validTo: "asc" },
  });
  return NextResponse.json({ offers });
}
