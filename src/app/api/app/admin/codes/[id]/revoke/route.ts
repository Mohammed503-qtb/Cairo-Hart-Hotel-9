// POST /api/app/admin/codes/[id]/revoke
// Marks AccessCode status=REVOKED, revokedAt=now, revokedBy=admin name.
// Revokes active GuestSessions using this code. Audit log CODE_REVOKED.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession(req, "ADMIN");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id } = await params;
  const adminStaffId = ctx.staffId!;
  const admin = await db.staff.findUnique({ where: { id: adminStaffId } });
  const adminName = admin?.fullName || "ADMIN";

  const code = await db.accessCode.findUnique({ where: { id } });
  if (!code) return NextResponse.json({ error: "codeNotFound" }, { status: 404 });
  if (code.status === "REVOKED") {
    return NextResponse.json({ error: "alreadyRevokeded" }, { status: 400 });
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.accessCode.update({
        where: { id: code.id },
        data: {
          status: "REVOKED",
          revokedAt: new Date(),
          revokedBy: adminName,
        },
      });

      // Revoke active sessions using this code
      await tx.guestSession.updateMany({
        where: { codeId: code.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          action: "CODE_REVOKED",
          entityType: "AccessCode",
          entityId: code.id,
          performedBy: adminName,
          details: JSON.stringify({
            codeType: code.codeType,
            previousStatus: code.status,
            stayId: code.stayId,
            staffId: code.staffId,
          }),
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/codes/revoke] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
