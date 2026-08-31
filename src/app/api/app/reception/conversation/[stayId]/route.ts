// GET + POST /api/app/reception/conversation/[stayId]
// GET: returns the conversation for a stay (for reception viewing guest's chat). Includes messages.
// POST { body }: sends a message as RECEPTION (senderId = staffId, senderName = staff name).
//   AppNotification for GUEST (type=NEW_MESSAGE).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ stayId: string }> }) {
  const ctx = await requireSession(req, "RECEPTION");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { stayId } = await params;
  const stay = await db.stay.findUnique({ where: { id: stayId }, include: { guest: true, room: true } });
  if (!stay) return NextResponse.json({ error: "stayNotFound" }, { status: 404 });

  // Find or create conversation
  let conversation = await db.conversation.findFirst({
    where: { stayId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!conversation) {
    conversation = await db.conversation.create({
      data: { stayId, guestId: stay.guestId, roomId: stay.roomId, status: "OPEN" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }

  return NextResponse.json({
    ok: true,
    conversation: {
      id: conversation.id,
      stayId: conversation.stayId,
      guestId: conversation.guestId,
      status: conversation.status,
      guestName: stay.guest.fullName,
      roomNumber: stay.room.roomNumber,
      messages: conversation.messages.map((m) => ({
        id: m.id,
        senderRole: m.senderRole,
        senderId: m.senderId,
        senderName: m.senderName,
        body: m.body,
        readAt: m.readAt,
        createdAt: m.createdAt,
      })),
    },
  });
}

interface PostBody {
  body?: string;
}

export async function POST(req: Request, { params }: { params: Promise<{ stayId: string }> }) {
  const ctx = await requireSession(req, "RECEPTION");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { stayId } = await params;
  let body: PostBody = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }
  const messageBody = (body.body || "").trim();
  if (!messageBody) return NextResponse.json({ error: "bodyRequired" }, { status: 400 });

  const staffId = ctx.staffId!;
  const staff = await db.staff.findUnique({ where: { id: staffId } });
  const staffName = staff?.fullName || "RECEPTION";

  try {
    const stay = await db.stay.findUnique({ where: { id: stayId }, include: { guest: true, room: true } });
    if (!stay) return NextResponse.json({ error: "stayNotFound" }, { status: 404 });

    // Find or create conversation
    let conversation = await db.conversation.findFirst({ where: { stayId } });
    if (!conversation) {
      conversation = await db.conversation.create({
        data: { stayId, guestId: stay.guestId, roomId: stay.roomId, status: "OPEN" },
      });
    }

    await db.$transaction(async (tx) => {
      // Mark all GUEST messages as read (reception has now seen them)
      await tx.conversationMessage.updateMany({
        where: { conversationId: conversation!.id, senderRole: "GUEST", readAt: null },
        data: { readAt: new Date() },
      });
      await tx.conversationMessage.create({
        data: {
          conversationId: conversation!.id,
          senderRole: "RECEPTION",
          senderId: staffId,
          senderName: staffName,
          body: messageBody,
        },
      });
      await tx.conversation.update({
        where: { id: conversation!.id },
        data: { status: "OPEN", updatedAt: new Date() },
      });
      await tx.appNotification.create({
        data: {
          recipientRole: "GUEST",
          recipientId: stay.guestId,
          stayId,
          title: `New message from reception`,
          body: messageBody,
          type: "NEW_MESSAGE",
        },
      });
      await tx.auditLog.create({
        data: {
          action: "CONVERSATION_MESSAGE",
          entityType: "Conversation",
          entityId: conversation!.id,
          performedBy: staffName,
          details: JSON.stringify({ stayId, body: messageBody }),
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[reception/conversation] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
