// GET /api/app/admin/staff/[id] — staff detail with recent codes + recent sessions
// POST /api/app/admin/staff/[id] — update staff { isActive?, role? }

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession(req, "ADMIN");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id } = await params;
  const staff = await db.staff.findUnique({
    where: { id },
    include: {
      accessCodes: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { stay: { include: { guest: true } } },
      },
      sessions: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
  if (!staff) return NextResponse.json({ error: "staffNotFound" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    staff: {
      id: staff.id,
      fullName: staff.fullName,
      phone: staff.phone,
      email: staff.email,
      role: staff.role,
      isActive: staff.isActive,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
    },
    recentCodes: staff.accessCodes.map((c) => ({
      id: c.id,
      codeType: c.codeType,
      status: c.status,
      validFrom: c.validFrom,
      validUntil: c.validUntil,
      createdAt: c.createdAt,
      revokedAt: c.revokedAt,
      revokedBy: c.revokedBy,
      stay: c.stay
        ? {
            id: c.stay.id,
            stayNumber: c.stay.stayNumber,
            guestName: c.stay.guest?.fullName || null,
          }
        : null,
    })),
    recentSessions: staff.sessions.map((s) => ({
      id: s.id,
      persona: s.persona,
      expiresAt: s.expiresAt,
      revokedAt: s.revokedAt,
      lastSeenAt: s.lastSeenAt,
      createdAt: s.createdAt,
    })),
  });
}

interface UpdateBody {
  isActive?: boolean;
  role?: "RECEPTION" | "ADMIN" | "MASTER_ADMIN";
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession(req, "ADMIN");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id } = await params;
  let body: UpdateBody = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }

  const existing = await db.staff.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "staffNotFound" }, { status: 404 });

  const data: { isActive?: boolean; role?: string } = {};
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (body.role) {
    const role = body.role.toUpperCase();
    if (!["RECEPTION", "ADMIN", "MASTER_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "invalidRole" }, { status: 400 });
    }
    // Only MASTER_ADMIN can change role to ADMIN/MASTER_ADMIN
    if (role !== "RECEPTION" && ctx.role !== "MASTER_ADMIN") {
      return NextResponse.json({ error: "onlyMasterCanAssignAdminRoles" }, { status: 403 });
    }
    // Cannot demote yourself
    if (existing.id === ctx.staffId && role !== existing.role) {
      return NextResponse.json({ error: "cannotChangeOwnRole" }, { status: 400 });
    }
    data.role = role;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "noFields" }, { status: 400 });
  }

  const adminStaffId = ctx.staffId!;
  const admin = await db.staff.findUnique({ where: { id: adminStaffId } });
  const adminName = admin?.fullName || "ADMIN";

  try {
    await db.$transaction(async (tx) => {
      await tx.staff.update({ where: { id }, data });

      await tx.auditLog.create({
        data: {
          action: "STAFF_UPDATED",
          entityType: "Staff",
          entityId: id,
          performedBy: adminName,
          details: JSON.stringify({ before: { isActive: existing.isActive, role: existing.role }, after: data }),
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/staff/update] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
