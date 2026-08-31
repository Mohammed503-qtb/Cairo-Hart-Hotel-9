// POST /api/app/auth/validate
// Body: { code: string }
// Validates the access code, creates a session, sets an HTTP-only cookie.
// Returns persona + context (stay for guest, staff for reception/admin).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  checkRateLimit,
  clearAttempts,
  generateSessionToken,
  hashAccessCode,
  hashToken,
  identifyCodeType,
  recordFailedAttempt,
  setSessionCookie,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/app/auth";

export const dynamic = "force-dynamic";

interface ValidateBody {
  code?: string;
}

export async function POST(req: Request) {
  try {
    const body: ValidateBody = await req.json();
    const raw = (body.code || "").trim().toUpperCase();
    if (!raw) return NextResponse.json({ error: "enterCode" }, { status: 400 });

    // Rate limit by IP + code prefix
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown";
    const rlKey = `${ip}:${raw[0] || "?"}`;
    const rl = checkRateLimit(rlKey);
    if (!rl.allowed) {
      const minutes = Math.ceil((rl.retryAfterMs || 0) / 60000);
      return NextResponse.json({ error: "rateLimited", retryAfterMinutes: minutes }, { status: 429 });
    }

    // Validate format + checksum
    const codeType = identifyCodeType(raw);
    if (!codeType) {
      recordFailedAttempt(rlKey);
      return NextResponse.json({ error: "invalidCode" }, { status: 400 });
    }

    // Look up by hash
    const codeHash = hashAccessCode(raw);
    const accessCode = await db.accessCode.findUnique({
      where: { codeHash },
      include: {
        stay: { include: { guest: true, room: { include: { roomType: true } } } },
        staff: true,
      },
    });
    if (!accessCode) {
      recordFailedAttempt(rlKey);
      return NextResponse.json({ error: "invalidCode" }, { status: 400 });
    }

    // Check status
    if (accessCode.status === "REVOKED") {
      return NextResponse.json({ error: "codeRevoked" }, { status: 403 });
    }
    if (accessCode.status === "EXPIRED" || accessCode.validUntil.getTime() < Date.now()) {
      // mark expired in DB if not already
      if (accessCode.status !== "EXPIRED") {
        await db.accessCode.update({ where: { id: accessCode.id }, data: { status: "EXPIRED" } });
      }
      return NextResponse.json({ error: "codeExpired" }, { status: 403 });
    }
    if (accessCode.validFrom.getTime() > Date.now()) {
      return NextResponse.json({ error: "codeNotYetValid" }, { status: 403 });
    }

    // Type-specific checks
    if (accessCode.codeType !== codeType) {
      recordFailedAttempt(rlKey);
      return NextResponse.json({ error: "invalidCode" }, { status: 400 });
    }

    // For GUEST: stay must be CHECKED_IN
    if (codeType === "GUEST") {
      if (!accessCode.stay) {
        return NextResponse.json({ error: "noStayBound" }, { status: 403 });
      }
      if (accessCode.stay.status === "CHECKED_OUT" || accessCode.stay.status === "CLOSED") {
        return NextResponse.json({ error: "stayEnded" }, { status: 403 });
      }
    }

    // For RECEPTION/ADMIN: staff must be active
    if (codeType !== "GUEST" && (!accessCode.staff || !accessCode.staff.isActive)) {
      return NextResponse.json({ error: "staffInactive" }, { status: 403 });
    }

    // Clear rate limit on success
    clearAttempts(rlKey);

    // Create session
    const token = generateSessionToken();
    const sessionMaxAge = Math.min(SESSION_MAX_AGE_SECONDS, Math.floor((accessCode.validUntil.getTime() - Date.now()) / 1000));
    const expiresAt = new Date(Date.now() + sessionMaxAge * 1000);
    const persona = codeType as "GUEST" | "RECEPTION" | "ADMIN";
    const session = await db.guestSession.create({
      data: {
        tokenHash: hashToken(token),
        codeId: accessCode.id,
        persona,
        stayId: codeType === "GUEST" ? accessCode.stayId : null,
        staffId: codeType !== "GUEST" ? accessCode.staffId : null,
        expiresAt,
      },
    });

    // Audit
    await db.auditLog.create({
      data: {
        action: "APP_LOGIN",
        entityType: "AccessCode",
        entityId: accessCode.id,
        performedBy: codeType === "GUEST" ? accessCode.stay?.guest?.fullName || "GUEST" : accessCode.staff?.fullName || "STAFF",
        details: JSON.stringify({ persona, sessionId: session.id, ip }),
      },
    });

    // Update accessCode attempts + lastAttempt
    await db.accessCode.update({
      where: { id: accessCode.id },
      data: { attempts: 0, lastAttemptAt: new Date() },
    });

    // Build response context
    const resp: Record<string, unknown> = {
      ok: true,
      sessionId: session.id,
      persona,
    };
    if (codeType === "GUEST" && accessCode.stay) {
      resp.stay = {
        id: accessCode.stay.id,
        stayNumber: accessCode.stay.stayNumber,
        guestName: accessCode.stay.guest.fullName,
        roomNumber: accessCode.stay.room.roomNumber,
        roomTypeName: accessCode.stay.room.roomType.nameAr,
        checkIn: accessCode.stay.checkIn,
        checkOut: accessCode.stay.checkOut,
        nights: accessCode.stay.nights,
        status: accessCode.stay.status,
      };
    }
    if (codeType !== "GUEST" && accessCode.staff) {
      resp.staff = {
        id: accessCode.staff.id,
        fullName: accessCode.staff.fullName,
        role: accessCode.staff.role,
      };
    }

    const res = NextResponse.json(resp);
    setSessionCookie(res, token, sessionMaxAge);
    return res;
  } catch (e) {
    console.error("[app/auth/validate] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
