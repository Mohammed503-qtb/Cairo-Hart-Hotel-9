import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const room = await db.roomType.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { displayOrder: "asc" } },
      amenities: { include: { amenity: true } },
      ratePlan: true,
    },
  });

  if (!room || !room.isActive) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json({ room });
}
