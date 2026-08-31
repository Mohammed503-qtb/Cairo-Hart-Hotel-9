// GET /api/app/admin/hotel — return current hotel settings
// POST /api/app/admin/hotel — update hotel settings (partial update of allowed fields)

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";

export const dynamic = "force-dynamic";

const FIELDS = [
  "nameAr",
  "nameEn",
  "phone",
  "whatsapp",
  "email",
  "addressAr",
  "addressEn",
  "checkInTime",
  "checkOutTime",
  "taxRatePercent",
  "serviceChargePercent",
  "minStayNights",
  "maxStayNights",
  "bookingHorizonDays",
  "maxAdultsPerRoom",
] as const;

export async function GET(req: Request) {
  const ctx = await requireSession(req, "ADMIN");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const hotel = await db.hotel.findFirst();
  if (!hotel) return NextResponse.json({ error: "hotelNotFound" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    hotel: {
      id: hotel.id,
      nameAr: hotel.nameAr,
      nameEn: hotel.nameEn,
      taglineAr: hotel.taglineAr,
      taglineEn: hotel.taglineEn,
      phone: hotel.phone,
      whatsapp: hotel.whatsapp,
      email: hotel.email,
      addressAr: hotel.addressAr,
      addressEn: hotel.addressEn,
      cityAr: hotel.cityAr,
      cityEn: hotel.cityEn,
      countryAr: hotel.countryAr,
      countryEn: hotel.countryEn,
      checkInTime: hotel.checkInTime,
      checkOutTime: hotel.checkOutTime,
      currency: hotel.currency,
      taxRatePercent: hotel.taxRatePercent,
      serviceChargePercent: hotel.serviceChargePercent,
      bookingHorizonDays: hotel.bookingHorizonDays,
      minStayNights: hotel.minStayNights,
      maxStayNights: hotel.maxStayNights,
      maxAdultsPerRoom: hotel.maxAdultsPerRoom,
    },
  });
}

interface UpdateBody {
  [key: string]: unknown;
}

export async function POST(req: Request) {
  const ctx = await requireSession(req, "ADMIN");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  let body: UpdateBody = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }

  const hotel = await db.hotel.findFirst();
  if (!hotel) return NextResponse.json({ error: "hotelNotFound" }, { status: 404 });

  // Build update data only from allowed fields
  const data: Record<string, unknown> = {};
  for (const f of FIELDS) {
    if (f in body) {
      const v = body[f];
      if (v === undefined || v === null) continue;
      if (typeof v === "string") {
        if (v.trim() === "") continue;
        data[f] = v.trim();
      } else if (typeof v === "number") {
        if (!Number.isFinite(v)) continue;
        data[f] = v;
      } else {
        data[f] = v;
      }
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "noFields" }, { status: 400 });
  }

  // Validate specific constraints
  if ("taxRatePercent" in data) {
    const v = Number(data.taxRatePercent);
    if (v < 0 || v > 100) return NextResponse.json({ error: "taxRateOutOfRange" }, { status: 400 });
    data.taxRatePercent = v;
  }
  if ("serviceChargePercent" in data) {
    const v = Number(data.serviceChargePercent);
    if (v < 0 || v > 100) return NextResponse.json({ error: "serviceChargeOutOfRange" }, { status: 400 });
    data.serviceChargePercent = v;
  }
  if ("minStayNights" in data) {
    const v = Number(data.minStayNights);
    if (v < 1 || v > 365) return NextResponse.json({ error: "minStayOutOfRange" }, { status: 400 });
    data.minStayNights = Math.floor(v);
  }
  if ("maxStayNights" in data) {
    const v = Number(data.maxStayNights);
    if (v < 1 || v > 365) return NextResponse.json({ error: "maxStayOutOfRange" }, { status: 400 });
    data.maxStayNights = Math.floor(v);
  }
  if ("bookingHorizonDays" in data) {
    const v = Number(data.bookingHorizonDays);
    if (v < 1 || v > 730) return NextResponse.json({ error: "horizonOutOfRange" }, { status: 400 });
    data.bookingHorizonDays = Math.floor(v);
  }
  if ("maxAdultsPerRoom" in data) {
    const v = Number(data.maxAdultsPerRoom);
    if (v < 1 || v > 20) return NextResponse.json({ error: "adultsOutOfRange" }, { status: 400 });
    data.maxAdultsPerRoom = Math.floor(v);
  }

  const adminStaffId = ctx.staffId!;
  const admin = await db.staff.findUnique({ where: { id: adminStaffId } });
  const adminName = admin?.fullName || "ADMIN";

  try {
    await db.$transaction(async (tx) => {
      await tx.hotel.update({ where: { id: hotel.id }, data });

      await tx.auditLog.create({
        data: {
          action: "HOTEL_SETTINGS_UPDATED",
          entityType: "Hotel",
          entityId: hotel.id,
          performedBy: adminName,
          details: JSON.stringify({ fields: Object.keys(data), before: hotel, after: data }),
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/hotel/post] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
