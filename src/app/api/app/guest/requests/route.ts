// GET + POST /api/app/guest/requests
// GET: list this guest's requests (stayId from session), newest first, with events count.
//   Query: ?status=active|completed|all
//   active = status not in [COMPLETED, CANCELLED, REJECTED]
// POST: create a new request. Body: { category, service, title, description?, priority?,
//   preferredTime?, serviceId? }. Auto-set requestNumber = max+1 for the stay/hotel.
//   Create CREATED event (performedByRole=GUEST, performedBy = guest.fullName).
//   Create AppNotification for RECEPTION (recipientRole=RECEPTION, recipientId="*").
//   Audit log.
//   If service.isChargeable && price>0: create a Charge (source=SERVICE, category=SERVICE,
//     description=service name, unitPrice=service.price, quantity=1, grossAmount=price,
//     netAmount=price) on the stay and link it via relatedChargeId on the request.
//   Returns the created request with events.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";
import { roundMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = ["NEW", "ACKNOWLEDGED", "ASSIGNED", "IN_PROGRESS", "WAITING"];
const COMPLETED_STATUSES = ["COMPLETED", "CANCELLED", "REJECTED"];

export async function GET(req: Request) {
  const ctx = await requireSession(req, "GUEST");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const stayId = ctx.stayId!;
  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status") || "all";

  const where: Record<string, unknown> = { stayId };
  if (statusFilter === "active") {
    where.status = { notIn: COMPLETED_STATUSES };
  } else if (statusFilter === "completed") {
    where.status = { in: COMPLETED_STATUSES };
  }

  const requests = await db.guestRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { events: { select: { id: true } } },
    take: 200,
  });

  return NextResponse.json({
    ok: true,
    requests: requests.map((r) => ({
      id: r.id,
      requestNumber: r.requestNumber,
      category: r.category,
      service: r.service,
      title: r.title,
      description: r.description,
      priority: r.priority,
      status: r.status,
      assignedTo: r.assignedTo,
      preferredTime: r.preferredTime,
      relatedChargeId: r.relatedChargeId,
      completedAt: r.completedAt,
      cancelledAt: r.cancelledAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      eventsCount: r.events.length,
    })),
  });
}

interface CreateBody {
  category?: string;
  service?: string;
  title?: string;
  description?: string;
  priority?: string;
  preferredTime?: string;
  serviceId?: string;
}

export async function POST(req: Request) {
  const ctx = await requireSession(req, "GUEST");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const stayId = ctx.stayId!;
  let body: CreateBody = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }

  const category = (body.category || "").trim();
  const service = (body.service || "").trim();
  const title = (body.title || "").trim();
  const description = (body.description || "").trim() || null;
  const priority = (body.priority || "NORMAL").toUpperCase() === "URGENT" ? "URGENT" : "NORMAL";
  const preferredTime = (body.preferredTime || "").trim() || null;
  const serviceId = (body.serviceId || "").trim() || null;

  if (!category) return NextResponse.json({ error: "categoryRequired" }, { status: 400 });
  if (!service) return NextResponse.json({ error: "serviceRequired" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "titleRequired" }, { status: 400 });

  try {
    const stay = await db.stay.findUnique({
      where: { id: stayId },
      include: { guest: true, room: true },
    });
    if (!stay) return NextResponse.json({ error: "stayNotFound" }, { status: 404 });
    if (stay.status !== "CHECKED_IN") {
      return NextResponse.json({ error: "stayNotCheckedIn" }, { status: 400 });
    }

    // Validate service if provided
    let serviceRecord: { id: string; isChargeable: boolean; price: number; nameEn: string; nameAr: string } | null = null;
    if (serviceId) {
      const svc = await db.service.findUnique({ where: { id: serviceId } });
      if (!svc || !svc.isActive) {
        return NextResponse.json({ error: "serviceNotFound" }, { status: 400 });
      }
      serviceRecord = { id: svc.id, isChargeable: svc.isChargeable, price: svc.price, nameEn: svc.nameEn, nameAr: svc.nameAr };
    }

    // Next requestNumber
    const maxNum = await db.guestRequest.aggregate({
      where: { stay: { hotelId: stay.hotelId } },
      _max: { requestNumber: true },
    });
    const nextNum = (maxNum._max.requestNumber ?? 0) + 1;

    const guestName = stay.guest.fullName;
    const roomId = stay.roomId;

    // Create request + event + (optionally) charge + notification + audit in a transaction
    const created = await db.$transaction(async (tx) => {
      const request = await tx.guestRequest.create({
        data: {
          requestNumber: nextNum,
          stayId,
          guestId: stay.guestId,
          roomId,
          category,
          service,
          title,
          description,
          priority,
          preferredTime,
          status: "NEW",
        },
      });

      // Chargeable service → create Charge and link
      let chargeId: string | null = null;
      if (serviceRecord && serviceRecord.isChargeable && serviceRecord.price > 0) {
        const unitPrice = roundMoney(serviceRecord.price);
        const charge = await tx.charge.create({
          data: {
            stayId,
            description: serviceRecord.nameEn || serviceRecord.nameAr,
            category: "SERVICE",
            quantity: 1,
            unitPrice,
            grossAmount: unitPrice,
            netAmount: unitPrice,
            tax: 0,
            source: "SERVICE",
            relatedRequestId: request.id,
            createdBy: "GUEST",
          },
        });
        chargeId = charge.id;
        await tx.guestRequest.update({
          where: { id: request.id },
          data: { relatedChargeId: charge.id },
        });
      }

      // CREATED event
      await tx.guestRequestEvent.create({
        data: {
          requestId: request.id,
          eventType: "CREATED",
          toStatus: "NEW",
          note: description,
          performedBy: guestName,
          performedByRole: "GUEST",
        },
      });

      // AppNotification for RECEPTION (broadcast — recipientId="*")
      await tx.appNotification.create({
        data: {
          recipientRole: "RECEPTION",
          recipientId: "*",
          stayId,
          requestId: request.id,
          title: `New ${priority === "URGENT" ? "urgent " : ""}request: ${title}`,
          body: `Room ${stay.room.roomNumber} — ${guestName}. Category: ${category}.`,
          type: "REQUEST_CREATED",
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          action: "GUEST_REQUEST_CREATED",
          entityType: "GuestRequest",
          entityId: request.id,
          performedBy: guestName,
          details: JSON.stringify({
            stayId,
            stayNumber: stay.stayNumber,
            requestId: request.id,
            requestNumber: nextNum,
            category,
            service,
            title,
            priority,
            chargeId,
          }),
        },
      });

      // Re-fetch with events
      const withEvents = await tx.guestRequest.findUnique({
        where: { id: request.id },
        include: { events: { orderBy: { createdAt: "asc" } } },
      });
      return withEvents;
    });

    return NextResponse.json({
      ok: true,
      request: created
        ? {
            id: created.id,
            requestNumber: created.requestNumber,
            category: created.category,
            service: created.service,
            title: created.title,
            description: created.description,
            priority: created.priority,
            status: created.status,
            assignedTo: created.assignedTo,
            preferredTime: created.preferredTime,
            relatedChargeId: created.relatedChargeId,
            createdAt: created.createdAt,
            updatedAt: created.updatedAt,
            events: created.events.map((e) => ({
              id: e.id,
              eventType: e.eventType,
              fromStatus: e.fromStatus,
              toStatus: e.toStatus,
              note: e.note,
              performedBy: e.performedBy,
              performedByRole: e.performedByRole,
              createdAt: e.createdAt,
            })),
          }
        : null,
    });
  } catch (e) {
    console.error("[guest/requests POST] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export { ACTIVE_STATUSES };
