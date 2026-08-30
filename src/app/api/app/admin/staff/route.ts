// GET /api/app/admin/staff — list all staff with active code count + last session
// POST /api/app/admin/staff — create new staff { fullName, phone, email?, role }

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await requireSession(req, "ADMIN");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const staff = await db.staff.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      accessCodes: {
        where: { status: "ACTIVE" },
        select: { id: true },
      },
      sessions: {
        where: { revokedAt: null },
        orderBy: { lastSeenAt: "desc" },
        take: 1,
        select: { id: true, lastSeenAt: true, expiresAt: true, persona: true },
      },
    },
  });

  // Total active sessions per staff
  const activeSessionCounts = await db.guestSession.groupBy({
    by: ["staffId"],
    where: { staffId: { in: staff.map((s) => s.id) }, revokedAt: null, expiresAt: { gt: new Date() } },
    _count: { _all: true },
  });
  const sessionCountMap = new Map(activeSessionCounts.map((r) => [r.staffId, r._count._all]));

  const list = staff.map((s) => ({
    id: s.id,
    fullName: s.fullName,
    phone: s.phone,
    email: s.email,
    role: s.role,
    isActive: s.isActive,
    createdAt: s.createdAt,
    activeCodeCount: s.accessCodes.length,
    activeSessionCount: sessionCountMap.get(s.id) || 0,
    lastSession: s.sessions[0]
      ? {
          id: s.sessions[0].id,
          lastSeenAt: s.sessions[0].lastSeenAt,
          expiresAt: s.sessions[0].expiresAt,
          persona: s.sessions[0].persona,
        }
      : null,
  }));

  return NextResponse.json({ ok: true, staff: list });
}

interface CreateStaffBody {
  fullName?: string;
  phone?: string;
  email?: string;
  role?: "RECEPTION" | "ADMIN";
}

export async function POST(req: Request) {
  const ctx = await requireSession(req, "ADMIN");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  let body: CreateStaffBody = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }

  const fullName = (body.fullName || "").trim();
  const phone = (body.phone || "").trim();
  const email = (body.email || "").trim() || null;
  const role = (body.role || "RECEPTION").toUpperCase();

  if (!fullName) return NextResponse.json({ error: "fullNameRequired" }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "phoneRequired" }, { status: 400 });
  if (!["RECEPTION", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "invalidRole" }, { status: 400 });
  }

  // Phone uniqueness
  const existing = await db.staff.findUnique({ where: { phone } });
  if (existing) return NextResponse.json({ error: "phoneInUse" }, { status: 400 });

  // Only MASTER_ADMIN can create ADMIN staff (defense in depth)
  if (role === "ADMIN" && ctx.role !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "onlyMasterCanCreateAdmin" }, { status: 403 });
  }

  const adminStaffId = ctx.staffId!;
  const admin = await db.staff.findUnique({ where: { id: adminStaffId } });
  const adminName = admin?.fullName || "ADMIN";

  try {
    const created = await db.$transaction(async (tx) => {
      const s = await tx.staff.create({
        data: { fullName, phone, email, role, isActive: true },
      });

      await tx.auditLog.create({
        data: {
          action: "STAFF_CREATED",
          entityType: "Staff",
          entityId: s.id,
          performedBy: adminName,
          details: JSON.stringify({ fullName, phone, role, email }),
        },
      });

      return s;
    });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (e) {
    console.error("[admin/staff/post] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
