// POST /api/app/reception/payments
// Body: { stayId, amount, method, note? }
// Records a payment linked to stay.reservationId (if exists).
// Updates reservation.paidTotal, recomputes paymentStatus (UNPAID/PARTIAL/PAID),
// updates stay.balance. Audit + AppNotification for ADMIN.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";
import { roundMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

interface PaymentBody {
  stayId?: string;
  amount?: number;
  method?: string;
  note?: string;
}

const VALID_METHODS = ["PAY_AT_HOTEL", "PAY_ONLINE", "DEPOSIT", "CASH", "CARD", "BANK_TRANSFER"];

export async function POST(req: Request) {
  const ctx = await requireSession(req, "RECEPTION");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  let body: PaymentBody = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }

  const stayId = (body.stayId || "").trim();
  const amount = Number(body.amount);
  const method = (body.method || "PAY_AT_HOTEL").trim().toUpperCase();
  const note = (body.note || "").trim();

  if (!stayId) return NextResponse.json({ error: "stayIdRequired" }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "invalidAmount" }, { status: 400 });
  }
  if (!VALID_METHODS.includes(method)) {
    return NextResponse.json({ error: "invalidMethod" }, { status: 400 });
  }

  const staffId = ctx.staffId!;
  const staff = await db.staff.findUnique({ where: { id: staffId } });
  const staffName = staff?.fullName || "RECEPTION";

  try {
    const stay = await db.stay.findUnique({
      where: { id: stayId },
      include: { guest: true, room: true, reservation: true },
    });
    if (!stay) return NextResponse.json({ error: "stayNotFound" }, { status: 404 });
    if (!stay.reservation) {
      return NextResponse.json({ error: "noLinkedReservation" }, { status: 400 });
    }

    const paidAmount = roundMoney(amount);

    await db.$transaction(async (tx) => {
      // 1. Create Payment record
      const payment = await tx.payment.create({
        data: {
          reservationId: stay.reservation!.id,
          provider: "manual",
          method,
          amount: paidAmount,
          currency: stay.reservation!.currency,
          status: "SUCCEEDED",
          completedAt: new Date(),
        },
      });

      // 2. Update reservation.paidTotal + paymentStatus
      const newPaidTotal = roundMoney(stay.reservation!.paidTotal + paidAmount);
      const grandTotal = stay.reservation!.grandTotal;
      let paymentStatus = "UNPAID";
      if (newPaidTotal <= 0) paymentStatus = "UNPAID";
      else if (newPaidTotal >= grandTotal - 0.01) paymentStatus = "PAID";
      else paymentStatus = "PARTIAL";

      await tx.reservation.update({
        where: { id: stay.reservation!.id },
        data: { paidTotal: newPaidTotal, paymentStatus, paymentMethod: method },
      });

      // 3. Update stay.balance (grandTotal - newPaidTotal) — only the portion still owed
      const newBalance = roundMoney(Math.max(0, grandTotal - newPaidTotal));
      await tx.stay.update({
        where: { id: stay.id },
        data: { balance: newBalance },
      });

      // 4. Audit
      await tx.auditLog.create({
        data: {
          action: "PAYMENT_RECORDED",
          entityType: "Stay",
          entityId: stay.id,
          performedBy: staffName,
          details: JSON.stringify({
            stayId: stay.id,
            stayNumber: stay.stayNumber,
            paymentId: payment.id,
            amount: paidAmount,
            method,
            note,
            newPaidTotal,
            newBalance,
            paymentStatus,
          }),
        },
      });

      // 5. AppNotification for ADMIN
      const admins = await tx.staff.findMany({ where: { role: { in: ["ADMIN", "MASTER_ADMIN"] }, isActive: true } });
      if (admins.length) {
        await tx.appNotification.createMany({
          data: admins.map((a) => ({
            recipientRole: "ADMIN",
            recipientId: a.id,
            stayId: stay.id,
            title: `Payment recorded: ${paidAmount} ${stay.reservation!.currency} for ${stay.guest.fullName}`,
            body: `Stay ${stay.stayNumber} (${stay.room.roomNumber}) — method ${method}. Recorded by ${staffName}.`,
            type: "PAYMENT_RECORDED",
          })),
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[reception/payments] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
