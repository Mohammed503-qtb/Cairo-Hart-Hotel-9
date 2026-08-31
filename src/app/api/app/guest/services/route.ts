// GET /api/app/guest/services
// Returns the active service catalog grouped by category.
// categories: [{ id, slug, nameAr, nameEn, iconKey, services: [{ id, slug, nameAr, nameEn,
//                iconKey, isChargeable, price, expectedResponseMinutes }] }]
// Only services with isActive=true are returned.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await requireSession(req, "GUEST");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const categories = await db.serviceCategory.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    categories: categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      nameAr: c.nameAr,
      nameEn: c.nameEn,
      iconKey: c.iconKey,
      services: c.services.map((s) => ({
        id: s.id,
        slug: s.slug,
        nameAr: s.nameAr,
        nameEn: s.nameEn,
        iconKey: s.iconKey,
        isChargeable: s.isChargeable,
        price: s.price,
        expectedResponseMinutes: s.expectedResponseMinutes,
      })),
    })),
  });
}
