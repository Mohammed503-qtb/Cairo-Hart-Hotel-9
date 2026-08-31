// GET /api/app/admin/codes?status=ACTIVE|EXPIRED|REVOKED|ALL&type=GUEST|RECEPTION|ADMIN
// POST /api/app/admin/codes { codeType, staffId?, stayId?, validHours? }
//   - GUEST: requires stayId (CHECKED_IN stay); validUntil = end-of-checkout-day OR now+validHours
//   - RECEPTION: requires staffId (RECEPTION); validUntil = now + (validHours || 8)h
//   - ADMIN: requires staffId (ADMIN/MASTER_ADMIN); validUntil = now + (validHours || 24)h
// Returns raw code once + codeId + codeType + validUntil.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";
import { generateAccessCode, hashAccessCode } from "@/lib/app/auth";
import { startOfDay } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await requireSession(req, "ADMIN");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const url = new URL(req.url);
  const statusParam = (url.searchParams.get("status") || "ACTIVE").toUpperCase();
  const typeParam = (url.searchParams.get("type") || "").toUpperCase();

  const where: { status?: string; codeType?: string } = {};
  if (statusParam !== "ALL") where.status = statusParam;
  if (typeParam) where.codeType = typeParam;

  const codes = await db.accessCode.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      staff: true,
      stay: { include: { guest: true } },
    },
  });

  const list = codes.map((c) => ({
    id: c.id,
    codeType: c.codeType,
    status: c.status,
    role: c.role,
    validFrom: c.validFrom,
    validUntil: c.validUntil,
    createdAt: c.createdAt,
    revokedAt: c.revokedAt,
    revokedBy: c.revokedBy,
    attempts: c.attempts,
    lastAttemptAt: c.lastAttemptAt,
    staff: c.staff
      ? { id: c.staff.id, fullName: c.staff.fullName, role: c.staff.role, phone: c.staff.phone }
      : null,
    stay: c.stay
      ? {
          id: c.stay.id,
          stayNumber: c.stay.stayNumber,
          guestName: c.stay.guest?.fullName || null,
        }
      : null,
  }));

  return NextResponse.json({ ok: true, codes: list });
}

interface CreateBody {
  codeType?: "GUEST" | "RECEPTION" | "ADMIN";
  staffId?: string;
  stayId?: string;
  validHours?: number;
}

export async function POST(req: Request) {
  const ctx = await requireSession(req, "ADMIN");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  let body: CreateBody = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }

  const codeType = (body.codeType || "").toUpperCase() as "GUEST" | "RECEPTION" | "ADMIN";
  if (!["GUEST", "RECEPTION", "ADMIN"].includes(codeType)) {
    return NextResponse.json({ error: "invalidCodeType" }, { status: 400 });
  }

  const staffId = (body.staffId || "").trim();
  const stayId = (body.stayId || "").trim();
  const validHoursNum = Number(body.validHours);
  const validHours = Number.isFinite(validHoursNum) && validHoursNum > 0 ? validHoursNum : null;
  const now = new Date();

  const adminStaffId = ctx.staffId!;
  const admin = await db.staff.findUnique({ where: { id: adminStaffId } });
  const adminName = admin?.fullName || "ADMIN";

  // Resolve target + validUntil per code type
  let validUntil: Date;
  let resolvedStaffId: string | undefined;
  let resolvedStayId: string | undefined;
  let resolvedGuestId: string | undefined;
  let role: string | undefined;
  let targetType: string;
  let targetName: string;

  if (codeType === "GUEST") {
    if (!stayId) return NextResponse.json({ error: "stayIdRequired" }, { status: 400 });
    const stay = await db.stay.findUnique({
      where: { id: stayId },
      include: { guest: true },
    });
    if (!stay) return NextResponse.json({ error: "stayNotFound" }, { status: 404 });
    if (stay.status !== "CHECKED_IN") {
      return NextResponse.json({ error: "stayNotCheckedIn", status: stay.status }, { status: 400 });
    }
    resolvedStayId = stay.id;
    resolvedGuestId = stay.guestId;
    targetName = stay.guest?.fullName || "Guest";
    targetType = `Stay ${stay.stayNumber}`;
    if (validHours) {
      validUntil = new Date(now.getTime() + validHours * 3600 * 1000);
    } else {
      // End of checkout day (23:59:59 local)
      const coDay = startOfDay(stay.checkOut);
      validUntil = new Date(coDay.getTime() + 24 * 3600 * 1000 - 1000);
    }
  } else if (codeType === "RECEPTION") {
    if (!staffId) return NextResponse.json({ error: "staffIdRequired" }, { status: 400 });
    const staff = await db.staff.findUnique({ where: { id: staffId } });
    if (!staff) return NextResponse.json({ error: "staffNotFound" }, { status: 404 });
    if (staff.role !== "RECEPTION") {
      return NextResponse.json({ error: "staffNotReception", role: staff.role }, { status: 400 });
    }
    if (!staff.isActive) {
      return NextResponse.json({ error: "staffInactive" }, { status: 400 });
    }
    resolvedStaffId = staff.id;
    role = "RECEPTION";
    targetName = staff.fullName;
    targetType = "Reception";
    const hours = validHours || 8;
    validUntil = new Date(now.getTime() + hours * 3600 * 1000);
  } else {
    // ADMIN
    if (!staffId) return NextResponse.json({ error: "staffIdRequired" }, { status: 400 });
    const staff = await db.staff.findUnique({ where: { id: staffId } });
    if (!staff) return NextResponse.json({ error: "staffNotFound" }, { status: 404 });
    if (!["ADMIN", "MASTER_ADMIN"].includes(staff.role)) {
      return NextResponse.json({ error: "staffNotAdmin", role: staff.role }, { status: 400 });
    }
    if (!staff.isActive) {
      return NextResponse.json({ error: "staffInactive" }, { status: 400 });
    }
    resolvedStaffId = staff.id;
    role = staff.role;
    targetName = staff.fullName;
    targetType = "Admin";
    const hours = validHours || 24;
    validUntil = new Date(now.getTime() + hours * 3600 * 1000);
  }

  // Generate + hash code
  const code = generateAccessCode(codeType);
  const codeHash = hashAccessCode(code.raw);

  try {
    const created = await db.$transaction(async (tx) => {
      const ac = await tx.accessCode.create({
        data: {
          codeHash,
          codeType,
          stayId: resolvedStayId || null,
          guestId: resolvedGuestId || null,
          staffId: resolvedStaffId || null,
          role: role || null,
          validFrom: now,
          validUntil,
          status: "ACTIVE",
        },
      });

      await tx.auditLog.create({
        data: {
          action: "CODE_GENERATED",
          entityType: "AccessCode",
          entityId: ac.id,
          performedBy: adminName,
          details: JSON.stringify({
            codeType,
            staffId: resolvedStaffId,
            stayId: resolvedStayId,
            validUntil,
            issuedBy: adminName,
          }),
        },
      });

      return ac;
    });

    return NextResponse.json({
      ok: true,
      rawCode: code.raw,
      codeId: created.id,
      codeType,
      validUntil,
      targetType,
      targetName,
    });
  } catch (e) {
    console.error("[admin/codes/post] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
