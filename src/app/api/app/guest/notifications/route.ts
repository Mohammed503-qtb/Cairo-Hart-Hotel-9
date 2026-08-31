// GET + POST /api/app/guest/notifications
// GET: my notifications (last 20, ordered by createdAt desc).
// POST: Body { all?: boolean, id?: string }. Mark all as read (isRead=true) or mark a single one.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await requireSession(req, "GUEST");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const stayId = ctx.stayId!;
  const stay = await db.stay.findUnique({ where: { id: stayId }, select: { guestId: true } });
  if (!stay) return NextResponse.json({ error: "stayNotFound" }, { status: 404 });

  const notifications = await db.appNotification.findMany({
    where: { recipientRole: "GUEST", recipientId: stay.guestId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const unreadCount = await db.appNotification.count({
    where: { recipientRole: "GUEST", recipientId: stay.guestId, isRead: false },
  });

  return NextResponse.json({
    ok: true,
    notifications: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      isRead: n.isRead,
      requestId: n.requestId,
      stayId: n.stayId,
      createdAt: n.createdAt,
    })),
    unreadCount,
  });
}

interface PostBody {
  all?: boolean;
  id?: string;
}

export async function POST(req: Request) {
  const ctx = await requireSession(req, "GUEST");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const stayId = ctx.stayId!;
  const stay = await db.stay.findUnique({ where: { id: stayId }, select: { guestId: true } });
  if (!stay) return NextResponse.json({ error: "stayNotFound" }, { status: 404 });

  let body: PostBody = {};
  try {
    body = await req.json();
  } catch {
    /* allow empty */
  }

  if (body.all) {
    const r = await db.appNotification.updateMany({
      where: { recipientRole: "GUEST", recipientId: stay.guestId, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true, updated: r.count });
  }
  if (body.id) {
    // Only update if it belongs to this guest
    const notif = await db.appNotification.findUnique({ where: { id: body.id } });
    if (!notif || notif.recipientRole !== "GUEST" || notif.recipientId !== stay.guestId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    await db.appNotification.update({ where: { id: body.id }, data: { isRead: true } });
    return NextResponse.json({ ok: true, updated: 1 });
  }
  return NextResponse.json({ error: "idOrAllRequired" }, { status: 400 });
}
