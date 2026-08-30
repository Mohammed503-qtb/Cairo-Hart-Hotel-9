import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const rooms = await db.roomType.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    include: {
      images: { orderBy: { displayOrder: "asc" } },
      amenities: { include: { amenity: true } },
      ratePlan: true,
    },
  });

  return NextResponse.json({ rooms });
}
