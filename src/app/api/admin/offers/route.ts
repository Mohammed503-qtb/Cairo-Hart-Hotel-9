import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/admin/offers — list all offers
export async function GET() {
  const offers = await db.offer.findMany({
    orderBy: { validTo: "desc" },
  });
  return NextResponse.json({ offers });
}
