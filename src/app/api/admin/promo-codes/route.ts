import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/admin/promo-codes — list all promo codes
export async function GET() {
  const codes = await db.promoCode.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ promoCodes: codes });
}

// POST /api/admin/promo-codes — create or update a promo code
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!data.code) {
      return NextResponse.json({ error: "missing_code" }, { status: 400 });
    }

    const code = data.code.trim().toUpperCase();

    if (id) {
      const updated = await db.promoCode.update({
        where: { id },
        data: {
          code,
          nameAr: data.nameAr,
          nameEn: data.nameEn,
          descriptionAr: data.descriptionAr,
          descriptionEn: data.descriptionEn,
          discountType: data.discountType || "PERCENTAGE",
          discountValue: Number(data.discountValue) || 0,
          maxUses: Number(data.maxUses) || 100,
          isActive: data.isActive ?? true,
          validFrom: new Date(data.validFrom),
          validTo: new Date(data.validTo),
        },
      });
      return NextResponse.json({ success: true, promoCode: updated });
    } else {
      const created = await db.promoCode.create({
        data: {
          code,
          nameAr: data.nameAr || code,
          nameEn: data.nameEn || code,
          descriptionAr: data.descriptionAr || "",
          descriptionEn: data.descriptionEn || "",
          discountType: data.discountType || "PERCENTAGE",
          discountValue: Number(data.discountValue) || 0,
          maxUses: Number(data.maxUses) || 100,
          isActive: data.isActive ?? true,
          validFrom: new Date(data.validFrom || Date.now()),
          validTo: new Date(data.validTo || new Date().setFullYear(new Date().getFullYear() + 1)),
        },
      });
      return NextResponse.json({ success: true, promoCode: created });
    }
  } catch (e) {
    console.error("[admin/promo-codes] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
