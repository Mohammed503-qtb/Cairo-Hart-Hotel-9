import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/promo-code
// Validates a promo code and returns discount info.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = (body.code || "").trim().toUpperCase();
    const subtotal = Number(body.subtotal) || 0;

    if (!code) {
      return NextResponse.json({ error: "invalid_code" }, { status: 400 });
    }

    const promo = await db.promoCode.findUnique({
      where: { code },
    });

    if (!promo || !promo.isActive) {
      return NextResponse.json({ error: "invalid_code" }, { status: 404 });
    }

    const now = new Date();
    if (now < promo.validFrom || now > promo.validTo) {
      return NextResponse.json({ error: "expired_code" }, { status: 400 });
    }

    if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
      return NextResponse.json({ error: "max_uses_reached" }, { status: 400 });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (promo.discountType === "PERCENTAGE") {
      discountAmount = Math.round((subtotal * promo.discountValue) / 100);
    } else {
      // FIXED amount off
      discountAmount = Math.min(promo.discountValue, subtotal);
    }

    return NextResponse.json({
      valid: true,
      code: promo.code,
      nameAr: promo.nameAr,
      nameEn: promo.nameEn,
      descriptionAr: promo.descriptionAr,
      descriptionEn: promo.descriptionEn,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountAmount,
    });
  } catch (e) {
    console.error("[promo-code] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
