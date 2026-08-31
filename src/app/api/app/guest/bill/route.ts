// GET /api/app/guest/bill
// Returns:
//   - stay summary { stayNumber, checkIn, checkOut, nights, roomNumber, roomTypeName }
//   - charges: [{ id, description, category, quantity, unitPrice, grossAmount, discount,
//                  netAmount, tax, source, createdAt }]
//   - payments: [{ id, method, amount, status, completedAt }] (from the linked reservation if any)
//   - totals: { totalCharges, totalPayments, balance }

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await requireSession(req, "GUEST");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const stayId = ctx.stayId!;

  const stay = await db.stay.findUnique({
    where: { id: stayId },
    include: {
      room: { include: { roomType: true } },
      reservation: { include: { payments: true } },
      charges: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!stay) return NextResponse.json({ error: "stayNotFound" }, { status: 404 });

  const totalCharges = stay.charges.reduce((sum, c) => sum + c.netAmount + c.tax, 0);
  const totalPayments = (stay.reservation?.payments || [])
    .filter((p) => p.status === "SUCCEEDED")
    .reduce((sum, p) => sum + p.amount, 0);

  return NextResponse.json({
    ok: true,
    stay: {
      id: stay.id,
      stayNumber: stay.stayNumber,
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      nights: stay.nights,
      roomNumber: stay.room.roomNumber,
      roomTypeName: stay.room.roomType?.nameAr || "",
      roomTypeNameEn: stay.room.roomType?.nameEn || "",
      balance: stay.balance,
      currency: stay.reservation?.currency || "YER",
    },
    charges: stay.charges.map((c) => ({
      id: c.id,
      description: c.description,
      category: c.category,
      quantity: c.quantity,
      unitPrice: c.unitPrice,
      grossAmount: c.grossAmount,
      discount: c.discount,
      netAmount: c.netAmount,
      tax: c.tax,
      source: c.source,
      createdAt: c.createdAt,
    })),
    payments: (stay.reservation?.payments || []).map((p) => ({
      id: p.id,
      method: p.method,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      provider: p.provider,
      completedAt: p.completedAt,
      createdAt: p.createdAt,
    })),
    totals: {
      totalCharges,
      totalPayments,
      balance: stay.balance,
    },
  });
}
