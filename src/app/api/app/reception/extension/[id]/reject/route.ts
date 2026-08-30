// POST /api/app/reception/extension/[id]/reject
// Body: { reason? }. Marks REJECTED, AppNotification for GUEST, audit.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";

export const dynamic = "force-dynamic";

interface RejectBody {
  reason?: string;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession(req, "RECEPTION");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id: requestId } = await params;
  let body: RejectBody = {};
  try {
    body = await req.json();
  } catch {
    /* allow empty */
  }
  const reason = (body.reason || "").trim();

  const staffId = ctx.staffId!;
  const staff = await db.staff.findUnique({ where: { id: staffId } });
  const staffName = staff?.fullName || "RECEPTION";

  try {
    const ext = await db.extensionRequest.findUnique({
      where: { id: requestId },
      include: { stay: { include: { guest: true } } },
    });
    if (!ext) return NextResponse.json({ error: "extensionNotFound" }, { status: 404 });
    if (ext.status !== "PENDING") {
      return NextResponse.json({ error: "notPending", status: ext.status }, { status: 400 });
    }
    const stay = ext.stay;

    await db.$transaction(async (tx) => {
      await tx.extensionRequest.update({
        where: { id: ext.id },
        data: {
          status: "REJECTED",
          reviewedBy: staffName,
          reviewedAt: new Date(),
          reviewNote: reason || undefined,
        },
      });
      if (stay?.guestId) {
        await tx.appNotification.create({
          data: {
            recipientRole: "GUEST",
            recipientId: stay.guestId,
            stayId: stay.id,
            title: `Extension request rejected`,
            body: `Your request to extend your stay has been rejected.${reason ? ` Reason: ${reason}` : ""}`,
            type: "EXTENSION_REJECTED",
          },
        });
      }
      await tx.auditLog.create({
        data: {
          action: "EXTENSION_REJECTED",
          entityType: "ExtensionRequest",
          entityId: ext.id,
          performedBy: staffName,
          details: JSON.stringify({ requestId: ext.id, stayId: stay?.id, reason }),
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[reception/extension-reject] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
