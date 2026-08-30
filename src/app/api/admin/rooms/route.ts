import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/admin/rooms — list all room types for admin
export async function GET() {
  const rooms = await db.roomType.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      ratePlan: true,
      _count: { select: { amenities: true, images: true } },
    },
  });
  return NextResponse.json({ rooms });
}

// POST /api/admin/rooms — create or update a room type
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    // Validate required fields
    if (!data.slug || !data.nameAr || !data.nameEn) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    if (id) {
      // Update existing
      const updated = await db.roomType.update({
        where: { id },
        data: {
          nameAr: data.nameAr,
          nameEn: data.nameEn,
          descriptionAr: data.descriptionAr,
          descriptionEn: data.descriptionEn,
          shortDescriptionAr: data.shortDescriptionAr,
          shortDescriptionEn: data.shortDescriptionEn,
          basePrice: Number(data.basePrice) || 0,
          sizeSqm: data.sizeSqm ? Number(data.sizeSqm) : null,
          bedConfigAr: data.bedConfigAr,
          bedConfigEn: data.bedConfigEn,
          maxAdults: Number(data.maxAdults) || 2,
          maxChildren: Number(data.maxChildren) || 2,
          totalInventory: Number(data.totalInventory) || 1,
          imageUrl: data.imageUrl,
          isActive: data.isActive ?? true,
          isFeatured: data.isFeatured ?? false,
          displayOrder: Number(data.displayOrder) || 0,
        },
      });

      await db.auditLog.create({
        data: {
          action: "ROOM_TYPE_UPDATED",
          entityType: "RoomType",
          entityId: updated.id,
          performedBy: "ADMIN",
          details: JSON.stringify({ slug: updated.slug, nameEn: updated.nameEn }),
        },
      });

      return NextResponse.json({ success: true, room: updated });
    } else {
      // Create new
      const created = await db.roomType.create({
        data: {
          hotelId: data.hotelId || (await db.hotel.findFirst())?.id || "",
          slug: data.slug,
          nameAr: data.nameAr,
          nameEn: data.nameEn,
          descriptionAr: data.descriptionAr || "",
          descriptionEn: data.descriptionEn || "",
          shortDescriptionAr: data.shortDescriptionAr || "",
          shortDescriptionEn: data.shortDescriptionEn || "",
          basePrice: Number(data.basePrice) || 0,
          sizeSqm: data.sizeSqm ? Number(data.sizeSqm) : null,
          bedConfigAr: data.bedConfigAr || "",
          bedConfigEn: data.bedConfigEn || "",
          maxAdults: Number(data.maxAdults) || 2,
          maxChildren: Number(data.maxChildren) || 2,
          totalInventory: Number(data.totalInventory) || 1,
          imageUrl: data.imageUrl || "",
          isActive: data.isActive ?? true,
          isFeatured: data.isFeatured ?? false,
          displayOrder: Number(data.displayOrder) || 0,
        },
      });

      await db.auditLog.create({
        data: {
          action: "ROOM_TYPE_CREATED",
          entityType: "RoomType",
          entityId: created.id,
          performedBy: "ADMIN",
          details: JSON.stringify({ slug: created.slug, nameEn: created.nameEn }),
        },
      });

      return NextResponse.json({ success: true, room: created });
    }
  } catch (e) {
    console.error("[admin/rooms] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
