// Booking domain logic — availability, pricing, reservation creation
// CRITICAL: Server-side authoritative logic. Frontend results are NEVER treated as truth.
// Reservation creation always revalidates availability inside a transaction.

import { db } from "@/lib/db";
import { calculateNights, roundMoney, startOfDay, toISODate } from "@/lib/format";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface AvailabilityQuery {
  checkIn: string; // ISO date
  checkOut: string; // ISO date
  adults: number;
  children: number;
  rooms: number;
}

export interface AvailableRoomType {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  shortDescriptionAr: string;
  shortDescriptionEn: string;
  imageUrl: string;
  basePrice: number;
  sizeSqm: number | null;
  bedConfigAr: string;
  bedConfigEn: string;
  maxAdults: number;
  maxChildren: number;
  totalInventory: number;
  availableCount: number;
  nightlyRate: number;
  totalPrice: number;
  amenities: { slug: string; nameAr: string; nameEn: string; iconKey: string | null }[];
  isRefundable: boolean;
  cancellationDays: number;
  ratePlanId: string | null;
  hasSeasonalRate: boolean;
  nightlyRates?: { date: string; rate: number; isWeekend: boolean }[];
}

export interface PriceBreakdown {
  nights: number;
  nightlyRate: number;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  serviceChargeTotal: number;
  grandTotal: number;
  currency: string;
  taxRatePercent: number;
  serviceChargePercent: number;
  nightlyBreakdown: { date: string; rate: number; total: number }[];
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
export function validateBookingQuery(query: AvailabilityQuery, hotel: {
  bookingHorizonDays: number;
  minStayNights: number;
  maxStayNights: number;
  maxAdultsPerRoom: number;
  checkInTime?: string;
}): { valid: boolean; error?: string } {
  const today = startOfDay(new Date());
  const ci = startOfDay(new Date(query.checkIn));
  const co = startOfDay(new Date(query.checkOut));

  if (isNaN(ci.getTime()) || isNaN(co.getTime())) {
    return { valid: false, error: "invalidDates" };
  }
  if (ci.getTime() < today.getTime()) {
    return { valid: false, error: "pastDates" };
  }

  // Same-day booking block: if check-in is today and current time is past check-in time
  if (hotel.checkInTime && ci.getTime() === today.getTime()) {
    const now = new Date();
    const [chH, chM] = hotel.checkInTime.split(":").map(Number);
    const checkInCutoff = new Date(today);
    checkInCutoff.setHours(chH, chM, 0, 0);
    if (now.getTime() > checkInCutoff.getTime()) {
      return { valid: false, error: "sameDayBlock" };
    }
  }

  if (co.getTime() <= ci.getTime()) {
    return { valid: false, error: "invalidDates" };
  }
  const nights = calculateNights(ci, co);
  if (nights < hotel.minStayNights) {
    return { valid: false, error: "tooShort" };
  }
  if (nights > hotel.maxStayNights) {
    return { valid: false, error: "tooLong" };
  }
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + hotel.bookingHorizonDays);
  if (ci.getTime() > horizon.getTime()) {
    return { valid: false, error: "tooFar" };
  }
  if (query.adults < 1) {
    return { valid: false, error: "occupancyExceeded" };
  }
  if (query.adults > hotel.maxAdultsPerRoom * query.rooms) {
    return { valid: false, error: "occupancyExceeded" };
  }
  if (query.rooms < 1) {
    return { valid: false, error: "occupancyExceeded" };
  }
  return { valid: true };
}

// Get applicable seasonal stay limits for a date range (min/max stay overrides)
export async function getSeasonalStayLimits(checkIn: Date, checkOut: Date): Promise<{ minStayNights: number | null; maxStayNights: number | null }> {
  const ci = startOfDay(checkIn);
  const co = startOfDay(checkOut);
  const seasonalRates = await db.seasonalRate.findMany({
    where: {
      isActive: true,
      startDate: { lte: co },
      endDate: { gte: ci },
      OR: [
        { minStayNights: { not: null } },
        { maxStayNights: { not: null } },
      ],
    },
    orderBy: { priority: "desc" },
  });
  if (seasonalRates.length === 0) return { minStayNights: null, maxStayNights: null };
  // Use the highest priority season's limits
  const top = seasonalRates[0];
  return {
    minStayNights: top.minStayNights,
    maxStayNights: top.maxStayNights,
  };
}

// ---------------------------------------------------------------------------
// Seasonal / weekend rate computation
// Returns the effective nightly rate for a given date + room type + rate plan.
// Applies seasonal adjustments (percentage or fixed) and weekend surcharges.
// ---------------------------------------------------------------------------
export async function getSeasonalRates(roomTypeId: string, ratePlanId: string | null) {
  const rates = await db.seasonalRate.findMany({
    where: {
      isActive: true,
      OR: [
        { roomTypeId },
        { roomTypeId: null },
      ],
      AND: [
        {
          OR: [
            { ratePlanId },
            { ratePlanId: null },
          ],
        },
      ],
    },
    orderBy: { priority: "desc" },
  });
  return rates;
}

export function applySeasonalRate(
  basePrice: number,
  date: Date,
  seasonalRates: { adjustmentType: string; adjustmentValue: number; weekendAdjustmentType: string | null; weekendAdjustmentValue: number | null; weekendDays: string; startDate: Date; endDate: Date }[]
): { rate: number; isWeekend: boolean; seasonName: string | null } {
  // Check if date falls within any seasonal rate period (highest priority first)
  const dayStart = startOfDay(date);
  let applicableRate: typeof seasonalRates[number] | null = null;
  for (const sr of seasonalRates) {
    const sStart = startOfDay(new Date(sr.startDate));
    const sEnd = startOfDay(new Date(sr.endDate));
    if (dayStart >= sStart && dayStart <= sEnd) {
      applicableRate = sr;
      break; // first match wins (already sorted by priority desc)
    }
  }

  let rate = basePrice;
  let seasonName: string | null = null;

  if (applicableRate) {
    seasonName = "seasonal";
    if (applicableRate.adjustmentType === "PERCENTAGE") {
      rate = basePrice * (1 + applicableRate.adjustmentValue / 100);
    } else {
      // FIXED — add/subtract fixed amount
      rate = basePrice + applicableRate.adjustmentValue;
    }
  }

  // Weekend surcharge (Yemen weekend = Friday/Saturday, days 5/6)
  const dayOfWeek = date.getDay(); // 0=Sun, 5=Fri, 6=Sat
  const weekendDays = applicableRate?.weekendDays || "5,6";
  const weekendSet = new Set(weekendDays.split(",").map((d) => parseInt(d.trim(), 10)));
  const isWeekend = weekendSet.has(dayOfWeek);

  if (isWeekend && applicableRate?.weekendAdjustmentType && applicableRate?.weekendAdjustmentValue != null) {
    if (applicableRate.weekendAdjustmentType === "PERCENTAGE") {
      rate = rate * (1 + applicableRate.weekendAdjustmentValue / 100);
    } else {
      rate = rate + applicableRate.weekendAdjustmentValue;
    }
  }

  return { rate: roundMoney(rate), isWeekend, seasonName };
}

// Compute total price across a date range using seasonal rates
export async function computeSeasonalPrice(params: {
  basePrice: number;
  checkIn: Date;
  checkOut: Date;
  rooms: number;
  roomTypeId: string;
  ratePlanId: string | null;
  taxRatePercent: number;
  serviceChargePercent: number;
  currency: string;
}): Promise<PriceBreakdown & { nightlyRates: { date: string; rate: number; isWeekend: boolean }[] }> {
  const { basePrice, checkIn, checkOut, rooms, roomTypeId, ratePlanId, taxRatePercent, serviceChargePercent, currency } = params;
  const seasonalRates = await getSeasonalRates(roomTypeId, ratePlanId);

  const nightlyBreakdown: { date: string; rate: number; total: number }[] = [];
  const nightlyRates: { date: string; rate: number; isWeekend: boolean }[] = [];
  const cursor = new Date(checkIn);
  let subtotal = 0;

  while (cursor < checkOut) {
    const { rate, isWeekend } = applySeasonalRate(basePrice, new Date(cursor), seasonalRates);
    const dayTotal = roundMoney(rate * rooms);
    nightlyBreakdown.push({
      date: toISODate(cursor),
      rate: roundMoney(rate * rooms),
      total: dayTotal,
    });
    nightlyRates.push({ date: toISODate(cursor), rate, isWeekend });
    subtotal += dayTotal;
    cursor.setDate(cursor.getDate() + 1);
  }

  subtotal = roundMoney(subtotal);
  const discountTotal = 0;
  const afterDiscount = roundMoney(subtotal - discountTotal);
  const taxTotal = roundMoney(afterDiscount * (taxRatePercent / 100));
  const serviceChargeTotal = roundMoney(afterDiscount * (serviceChargePercent / 100));
  const grandTotal = roundMoney(afterDiscount + taxTotal + serviceChargeTotal);
  const nights = calculateNights(checkIn, checkOut);
  const avgNightlyRate = nights > 0 ? roundMoney(subtotal / nights / rooms) : basePrice;

  return {
    nights,
    nightlyRate: avgNightlyRate,
    subtotal,
    discountTotal,
    taxTotal,
    serviceChargeTotal,
    grandTotal,
    currency,
    taxRatePercent,
    serviceChargePercent,
    nightlyBreakdown,
    nightlyRates,
  };
}

// ---------------------------------------------------------------------------
// Availability calculation
// Counts confirmed/pending reservations overlapping the date range per room type.
// ---------------------------------------------------------------------------
export async function computeAvailability(query: AvailabilityQuery): Promise<{
  roomTypes: AvailableRoomType[];
  hotel: NonNullable<Awaited<ReturnType<typeof db.hotel.findFirst>>>;
}> {
  const hotel = await db.hotel.findFirst({
    include: {
      roomTypes: {
        where: { isActive: true },
        include: {
          images: { orderBy: { displayOrder: "asc" } },
          amenities: { include: { amenity: true } },
          ratePlan: true,
        },
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  if (!hotel) throw new Error("Hotel not configured");

  const ci = startOfDay(new Date(query.checkIn));
  const co = startOfDay(new Date(query.checkOut));
  const nights = calculateNights(ci, co);

  // Find all reservations that overlap [ci, co) and consume inventory
  // Overlap: existing.checkIn < co AND existing.checkOut > ci
  const overlapping = await db.reservation.findMany({
    where: {
      status: { in: ["CONFIRMED", "PENDING", "PAYMENT_PENDING"] },
      checkIn: { lt: co },
      checkOut: { gt: ci },
    },
    include: {
      items: true,
    },
  });

  // Build a map of roomTypeId -> total quantity booked for this date range
  const bookedMap = new Map<string, number>();
  for (const res of overlapping) {
    for (const item of res.items) {
      // Only count items that overlap (they all do since parent reservation overlaps)
      const prev = bookedMap.get(item.roomTypeId) || 0;
      bookedMap.set(item.roomTypeId, prev + item.quantity);
    }
  }

  const roomTypes: AvailableRoomType[] = [];
  for (const rt of hotel.roomTypes) {
    const booked = bookedMap.get(rt.id) || 0;
    const availableCount = Math.max(0, rt.totalInventory - booked);
    const canFitOccupancy = query.adults <= rt.maxAdults * query.rooms && query.children <= rt.maxChildren * query.rooms;
    const requestedRooms = query.rooms;

    // Available if enough inventory for requested rooms AND occupancy fits
    const hasAvailability = availableCount >= requestedRooms && canFitOccupancy;

    // Compute seasonal price (falls back to base price if no seasonal rates configured)
    const seasonalResult = await computeSeasonalPrice({
      basePrice: rt.basePrice,
      checkIn: ci,
      checkOut: co,
      rooms: requestedRooms,
      roomTypeId: rt.id,
      ratePlanId: rt.ratePlanId,
      taxRatePercent: hotel.taxRatePercent,
      serviceChargePercent: hotel.serviceChargePercent,
      currency: hotel.currency,
    });
    const nightlyRate = seasonalResult.nightlyRate;
    const totalPrice = seasonalResult.grandTotal;
    const hasSeasonalRate = seasonalResult.nightlyRates.some((nr) => nr.rate !== rt.basePrice);

    roomTypes.push({
      id: rt.id,
      slug: rt.slug,
      nameAr: rt.nameAr,
      nameEn: rt.nameEn,
      shortDescriptionAr: rt.shortDescriptionAr,
      shortDescriptionEn: rt.shortDescriptionEn,
      imageUrl: rt.imageUrl,
      basePrice: rt.basePrice,
      sizeSqm: rt.sizeSqm,
      bedConfigAr: rt.bedConfigAr,
      bedConfigEn: rt.bedConfigEn,
      maxAdults: rt.maxAdults,
      maxChildren: rt.maxChildren,
      totalInventory: rt.totalInventory,
      availableCount,
      nightlyRate,
      totalPrice,
      amenities: rt.amenities.map((a) => ({
        slug: a.amenity.slug,
        nameAr: a.amenity.nameAr,
        nameEn: a.amenity.nameEn,
        iconKey: a.amenity.iconKey,
      })),
      isRefundable: rt.ratePlan?.isRefundable ?? true,
      cancellationDays: rt.ratePlan?.cancellationDays ?? 3,
      ratePlanId: rt.ratePlanId,
      hasSeasonalRate,
      nightlyRates: seasonalResult.nightlyRates,
    });
  }

  return { roomTypes, hotel };
}

// ---------------------------------------------------------------------------
// Price calculation (deterministic, server-side)
// ---------------------------------------------------------------------------
export function calculatePrice(params: {
  nightlyRate: number;
  nights: number;
  rooms: number;
  taxRatePercent: number;
  serviceChargePercent: number;
  discountPercent?: number;
  currency: string;
  checkIn: Date;
  checkOut: Date;
}): PriceBreakdown {
  const { nightlyRate, nights, rooms, taxRatePercent, serviceChargePercent, currency, checkIn, checkOut } = params;
  const subtotal = roundMoney(nightlyRate * nights * rooms);
  const discountTotal = roundMoney(subtotal * ((params.discountPercent || 0) / 100));
  const afterDiscount = roundMoney(subtotal - discountTotal);
  const taxTotal = roundMoney(afterDiscount * (taxRatePercent / 100));
  const serviceChargeTotal = roundMoney(afterDiscount * (serviceChargePercent / 100));
  const grandTotal = roundMoney(afterDiscount + taxTotal + serviceChargeTotal);

  const nightlyBreakdown: { date: string; rate: number; total: number }[] = [];
  const cursor = new Date(checkIn);
  while (cursor < checkOut) {
    nightlyBreakdown.push({
      date: toISODate(cursor),
      rate: nightlyRate * rooms,
      total: roundMoney(nightlyRate * rooms),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    nights,
    nightlyRate,
    subtotal,
    discountTotal,
    taxTotal,
    serviceChargeTotal,
    grandTotal,
    currency,
    taxRatePercent,
    serviceChargePercent,
    nightlyBreakdown,
  };
}

// ---------------------------------------------------------------------------
// Recheck availability for a single room type (used at reservation creation)
// ---------------------------------------------------------------------------
export async function recheckRoomAvailability(
  roomTypeId: string,
  checkIn: Date,
  checkOut: Date,
  requestedRooms: number
): Promise<{ available: boolean; availableCount: number }> {
  const rt = await db.roomType.findUnique({
    where: { id: roomTypeId },
    select: { totalInventory: true, isActive: true },
  });
  if (!rt || !rt.isActive) return { available: false, availableCount: 0 };

  const ci = startOfDay(checkIn);
  const co = startOfDay(checkOut);
  const overlapping = await db.reservation.findMany({
    where: {
      status: { in: ["CONFIRMED", "PENDING", "PAYMENT_PENDING"] },
      checkIn: { lt: co },
      checkOut: { gt: ci },
      items: { some: { roomTypeId } },
    },
    include: { items: { where: { roomTypeId } } },
  });

  let booked = 0;
  for (const res of overlapping) {
    for (const item of res.items) {
      booked += item.quantity;
    }
  }
  const availableCount = Math.max(0, rt.totalInventory - booked);
  return { available: availableCount >= requestedRooms, availableCount };
}

// ---------------------------------------------------------------------------
// Booking reference generation (unique, human-friendly)
// ---------------------------------------------------------------------------
export async function generateBookingReference(): Promise<string> {
  const year = new Date().getFullYear();
  // Count existing reservations this year to build a sequence
  const count = await db.reservation.count({
    where: {
      bookingReference: { startsWith: `HTL-${year}-` },
    },
  });
  const seq = String(count + 1).padStart(6, "0");
  let ref = `HTL-${year}-${seq}`;

  // Ensure uniqueness (in case of race / reseed)
  let attempt = 0;
  while (await db.reservation.findUnique({ where: { bookingReference: ref } })) {
    attempt += 1;
    const seq2 = String(count + 1 + attempt).padStart(6, "0");
    ref = `HTL-${year}-${seq2}`;
    if (attempt > 100) break;
  }
  return ref;
}

// ---------------------------------------------------------------------------
// Idempotency: if a reservation with this key exists, return it instead of creating a new one
// ---------------------------------------------------------------------------
export async function findExistingReservationByIdempotencyKey(key: string) {
  if (!key) return null;
  return db.reservation.findUnique({
    where: { idempotencyKey: key },
    include: { items: true, guest: true },
  });
}
