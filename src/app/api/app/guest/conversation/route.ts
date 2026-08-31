// GET + POST /api/app/guest/conversation
// GET: get-or-create the conversation for this stay. Return last 100 messages (asc order).
//   Mark unread RECEPTION messages as read (readAt=now).
// POST: send a message. Body: { body }. Create ConversationMessage (senderRole=GUEST,
//   senderId=guestId, senderName=guest.fullName). Update conversation.updatedAt.
//   AppNotification for RECEPTION (recipientRole=RECEPTION, recipientId="*", type=NEW_MESSAGE).
//   Returns the created message.

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
    include: { guest: true, room: true },
  });
  if (!stay) return NextResponse.json({ error: "stayNotFound" }, { status: 404 });

  // Find or create conversation
  let conversation = await db.conversation.findFirst({
    where: { stayId },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 100 } },
  });

  if (!conversation) {
    conversation = await db.conversation.create({
      data: { stayId, guestId: stay.guestId, roomId: stay.roomId, status: "OPEN" },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 100 } },
    });
  }

  // Mark all unread RECEPTION/STAFF messages as read (guest has now seen them)
  await db.conversationMessage.updateMany({
    where: {
      conversationId: conversation.id,
      senderRole: { in: ["RECEPTION", "STAFF"] },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

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

export async function POST(req: Request) {
  const ctx = await requireSession(req, "GUEST");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const stayId = ctx.stayId!;
  let body: PostBody = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }
  const messageBody = (body.body || "").trim();
  if (!messageBody) return NextResponse.json({ error: "bodyRequired" }, { status: 400 });

  try {
    const stay = await db.stay.findUnique({
      where: { id: stayId },
      include: { guest: true, room: true },
    });
    if (!stay) return NextResponse.json({ error: "stayNotFound" }, { status: 404 });
    if (stay.status !== "CHECKED_IN") {
      return NextResponse.json({ error: "stayNotCheckedIn" }, { status: 400 });
    }

    const guestName = stay.guest.fullName;
    const guestId = stay.guestId;
    const roomNumber = stay.room.roomNumber;

    // Find or create conversation
    let conversation = await db.conversation.findFirst({ where: { stayId } });
    if (!conversation) {
      conversation = await db.conversation.create({
        data: { stayId, guestId, roomId: stay.roomId, status: "OPEN" },
      });
    }

    const message = await db.$transaction(async (tx) => {
      const m = await tx.conversationMessage.create({
        data: {
          conversationId: conversation!.id,
          senderRole: "GUEST",
          senderId: guestId,
          senderName: guestName,
          body: messageBody,
        },
      });
      await tx.conversation.update({
        where: { id: conversation!.id },
        data: { status: "OPEN", updatedAt: new Date() },
      });
      await tx.appNotification.create({
        data: {
          recipientRole: "RECEPTION",
          recipientId: "*",
          stayId,
          title: `New message from ${guestName}`,
          body: `Room ${roomNumber}: ${messageBody}`,
          type: "NEW_MESSAGE",
        },
      });
      await tx.auditLog.create({
        data: {
          action: "GUEST_CONVERSATION_MESSAGE",
          entityType: "Conversation",
          entityId: conversation!.id,
          performedBy: guestName,
          details: JSON.stringify({ stayId, body: messageBody }),
        },
      });
      return m;
    });

    return NextResponse.json({
      ok: true,
      message: {
        id: message.id,
        senderRole: message.senderRole,
        senderId: message.senderId,
        senderName: message.senderName,
        body: message.body,
        readAt: message.readAt,
        createdAt: message.createdAt,
      },
    });
  } catch (e) {
    console.error("[guest/conversation POST] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
