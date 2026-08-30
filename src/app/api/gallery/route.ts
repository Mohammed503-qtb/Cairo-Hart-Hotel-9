import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await db.galleryItem.findMany({
    orderBy: { displayOrder: "asc" },
  });
  return NextResponse.json({ items });
}
