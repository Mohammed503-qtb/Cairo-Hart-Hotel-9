// App domain seed — staff, physical rooms, service catalog, sample stays, access codes
// Run: bunx tsx src/lib/seed-app.ts
// This complements the existing website seed (src/lib/seed.ts).

import { db } from "./db";
import { generateAccessCode, hashAccessCode, hashToken } from "./app/auth";

async function main() {
  const hotel = await db.hotel.findFirst();
  if (!hotel) throw new Error("Hotel not seeded. Run `bunx tsx src/lib/seed.ts` first.");

  console.log("Seeding app domain for hotel:", hotel.nameEn);

  // ── Staff ──────────────────────────────────────────────────────────────
  const staff = {
    master: await db.staff.upsert({
      where: { phone: "+967700000001" },
      update: {},
      create: { fullName: "Master Admin", phone: "+967700000001", email: "admin@daralyasmin.ye", role: "MASTER_ADMIN" },
    }),
    reception1: await db.staff.upsert({
      where: { phone: "+967700000002" },
      update: {},
      create: { fullName: "Ahmed Reception", phone: "+967700000002", email: "reception1@daralyasmin.ye", role: "RECEPTION" },
    }),
    reception2: await db.staff.upsert({
      where: { phone: "+967700000003" },
      update: {},
      create: { fullName: "Sara Reception", phone: "+967700000003", email: "reception2@daralyasmin.ye", role: "RECEPTION" },
    }),
    admin: await db.staff.upsert({
      where: { phone: "+967700000004" },
      update: {},
      create: { fullName: "Hotel Admin", phone: "+967700000004", email: "admin2@daralyasmin.ye", role: "ADMIN" },
    }),
  };
  console.log(`Staff: master=${staff.master.fullName}, reception=${staff.reception1.fullName}, ${staff.reception2.fullName}, admin=${staff.admin.fullName}`);

  // ── Physical rooms ─────────────────────────────────────────────────────
  const roomTypes = await db.roomType.findMany({ orderBy: { displayOrder: "asc" } });
  if (roomTypes.length === 0) throw new Error("Room types not seeded.");
  const rtBySlug = Object.fromEntries(roomTypes.map((r) => [r.slug, r]));

  // Build 12 physical rooms across 3 floors mapped to the 4 room types
  const roomPlan: { number: string; floor: number; typeSlug: string }[] = [
    { number: "101", floor: 1, typeSlug: "standard-room" },
    { number: "102", floor: 1, typeSlug: "standard-room" },
    { number: "103", floor: 1, typeSlug: "deluxe-sea-view" },
    { number: "104", floor: 1, typeSlug: "deluxe-sea-view" },
    { number: "201", floor: 2, typeSlug: "family-suite" },
    { number: "202", floor: 2, typeSlug: "family-suite" },
    { number: "203", floor: 2, typeSlug: "executive-suite" },
    { number: "204", floor: 2, typeSlug: "executive-suite" },
    { number: "301", floor: 3, typeSlug: "standard-room" },
    { number: "302", floor: 3, typeSlug: "deluxe-sea-view" },
    { number: "303", floor: 3, typeSlug: "family-suite" },
    { number: "304", floor: 3, typeSlug: "executive-suite" },
  ];
  const physicalRooms: Record<string, { id: string; number: string; typeSlug: string }> = {};
  for (const plan of roomPlan) {
    const rt = rtBySlug[plan.typeSlug];
    if (!rt) continue;
    const room = await db.physicalRoom.upsert({
      where: { roomNumber: plan.number },
      update: { roomTypeId: rt.id, floor: plan.floor },
      create: { roomNumber: plan.number, floor: plan.floor, roomTypeId: rt.id, status: "AVAILABLE" },
    });
    physicalRooms[plan.number] = { id: room.id, number: plan.number, typeSlug: plan.typeSlug };
  }
  console.log(`Physical rooms: ${Object.keys(physicalRooms).length} created`);

  // ── Service catalog ───────────────────────────────────────────────────
  const categories = [
    { slug: "housekeeping", nameAr: "تنظيف الغرف", nameEn: "Housekeeping", iconKey: "Sparkles", order: 1 },
    { slug: "maintenance", nameAr: "الصيانة", nameEn: "Maintenance", iconKey: "Wrench", order: 2 },
    { slug: "guest_services", nameAr: "خدمات الضيافة", nameEn: "Guest Services", iconKey: "BellRing", order: 3 },
    { slug: "reception", nameAr: "الاستقبال", nameEn: "Reception", iconKey: "ConciergeBell", order: 4 },
  ];
  const catBySlug: Record<string, string> = {};
  for (const c of categories) {
    const cat = await db.serviceCategory.upsert({
      where: { slug: c.slug },
      update: { nameAr: c.nameAr, nameEn: c.nameEn, iconKey: c.iconKey, displayOrder: c.order },
      create: { slug: c.slug, nameAr: c.nameAr, nameEn: c.nameEn, iconKey: c.iconKey, displayOrder: c.order },
    });
    catBySlug[c.slug] = cat.id;
  }

  const services = [
    // housekeeping
    { slug: "clean-room", cat: "housekeeping", ar: "تنظيف الغرفة", en: "Clean Room", icon: "Sparkles", charge: false, price: 0, resp: 30 },
    { slug: "towels", cat: "housekeeping", ar: "مناشف إضافية", en: "Extra Towels", icon: "ShowerHead", charge: false, price: 0, resp: 15 },
    { slug: "toiletries", cat: "housekeeping", ar: "مستلزمات صحية", en: "Toiletries", icon: "Pump", charge: false, price: 0, resp: 15 },
    { slug: "extra-bedding", cat: "housekeeping", ar: "أسرّة إضافية", en: "Extra Bedding", icon: "BedDouble", charge: true, price: 5000, resp: 30 },
    // maintenance
    { slug: "ac-issue", cat: "maintenance", ar: "مشكلة في التكييف", en: "AC Not Cooling", icon: "AirVent", charge: false, price: 0, resp: 45 },
    { slug: "water-issue", cat: "maintenance", ar: "مشكلة في المياه", en: "Water Issue", icon: "Droplets", charge: false, price: 0, resp: 30 },
    { slug: "electricity", cat: "maintenance", ar: "مشكلة كهربائية", en: "Electricity Issue", icon: "PlugZap", charge: false, price: 0, resp: 30 },
    { slug: "tv-issue", cat: "maintenance", ar: "مشكلة في التلفاز", en: "TV Issue", icon: "Tv", charge: false, price: 0, resp: 45 },
    { slug: "wifi-issue", cat: "maintenance", ar: "مشكلة في الواي فاي", en: "Wi-Fi Issue", icon: "Wifi", charge: false, price: 0, resp: 20 },
    // guest services
    { slug: "general-assistance", cat: "guest_services", ar: "مساعدة عامة", en: "General Assistance", icon: "HandHelping", charge: false, price: 0, resp: 20 },
    { slug: "room-service", cat: "guest_services", ar: "خدمة الغرفة", en: "Room Service", icon: "UtensilsCrossed", charge: true, price: 8000, resp: 40 },
    { slug: "laundry", cat: "guest_services", ar: "غسيل الملابس", en: "Laundry", icon: "Shirt", charge: true, price: 3000, resp: 240 },
    { slug: "extra-pillow", cat: "guest_services", ar: "وسادة إضافية", en: "Extra Pillow", icon: "BedDouble", charge: false, price: 0, resp: 15 },
    // reception
    { slug: "general-inquiry", cat: "reception", ar: "استفسار عام", en: "General Inquiry", icon: "MessageCircleQuestion", charge: false, price: 0, resp: 10 },
    { slug: "extension-request", cat: "reception", ar: "طلب تمديد الإقامة", en: "Extension Request", icon: "CalendarPlus", charge: false, price: 0, resp: 60 },
    { slug: "room-change", cat: "reception", ar: "تغيير الغرفة", en: "Room Change", icon: "DoorOpen", charge: false, price: 0, resp: 60 },
    { slug: "checkout-request", cat: "reception", ar: "طلب المغادرة", en: "Checkout Request", icon: "LogOut", charge: false, price: 0, resp: 30 },
  ];
  for (const s of services) {
    await db.service.upsert({
      where: { slug: s.slug },
      update: { categoryId: catBySlug[s.cat], nameAr: s.ar, nameEn: s.en, iconKey: s.icon, isChargeable: s.charge, price: s.price, expectedResponseMinutes: s.resp },
      create: { slug: s.slug, categoryId: catBySlug[s.cat], nameAr: s.ar, nameEn: s.en, iconKey: s.icon, isChargeable: s.charge, price: s.price, expectedResponseMinutes: s.resp },
    });
  }
  console.log(`Services: ${services.length} created across ${categories.length} categories`);

  // ── Sample guests (for stays) ─────────────────────────────────────────
  const guestsData = [
    { fullName: "Mohamed Ahmed", phone: "+967777111222", email: "mohamed.ahmed@example.com", countryCode: "+967" },
    { fullName: "Sara Ali", phone: "+966551234567", email: "sara.ali@example.com", countryCode: "+966" },
    { fullName: "John Smith", phone: "+447700900123", email: "john.smith@example.com", countryCode: "+44" },
    { fullName: "Fatima Hassan", phone: "+971501234567", email: "fatima.hassan@example.com", countryCode: "+971" },
  ];
  const guests: { id: string; fullName: string }[] = [];
  for (const g of guestsData) {
    let guest = await db.guest.findFirst({ where: { phone: g.phone } });
    if (!guest) guest = await db.guest.create({ data: g });
    else await db.guest.update({ where: { id: guest.id }, data: { fullName: g.fullName, email: g.email, countryCode: g.countryCode } });
    guests.push({ id: guest.id, fullName: guest.fullName });
  }

  // ── Sample stays ──────────────────────────────────────────────────────
  // 2 in-house stays (CHECKED_IN) + 1 expected arrival + 1 future
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

  const stayDefs = [
    { stayNum: 1, guest: guests[0], room: "103", checkIn: addDays(today, -1), checkOut: addDays(today, 2), status: "CHECKED_IN", nights: 3 },
    { stayNum: 2, guest: guests[1], room: "201", checkIn: addDays(today, -2), checkOut: addDays(today, 1), status: "CHECKED_IN", nights: 3 },
    { stayNum: 3, guest: guests[2], room: "302", checkIn: today, checkOut: addDays(today, 3), status: "EXPECTED", nights: 3 },
    { stayNum: 4, guest: guests[3], room: "204", checkIn: addDays(today, 1), checkOut: addDays(today, 4), status: "EXPECTED", nights: 3 },
  ];

  const stays: { id: string; stayNumber: string; guestId: string; roomId: string }[] = [];
  for (const def of stayDefs) {
    const room = physicalRooms[def.room];
    if (!room) continue;
    const stayNumber = `ST-${now.getFullYear()}-${String(def.stayNum).padStart(6, "0")}`;
    const stay = await db.stay.upsert({
      where: { stayNumber },
      update: {
        guestId: def.guest.id,
        roomId: room.id,
        checkIn: def.checkIn,
        checkOut: def.checkOut,
        nights: def.nights,
        status: def.status,
        checkedInAt: def.status === "CHECKED_IN" ? def.checkIn : null,
        hotelId: hotel.id,
      },
      create: {
        stayNumber,
        guestId: def.guest.id,
        roomId: room.id,
        checkIn: def.checkIn,
        checkOut: def.checkOut,
        nights: def.nights,
        adults: 2,
        children: 0,
        status: def.status,
        checkedInAt: def.status === "CHECKED_IN" ? def.checkIn : null,
        hotelId: hotel.id,
      },
    });
    stays.push({ id: stay.id, stayNumber: stay.stayNumber, guestId: stay.guestId, roomId: stay.roomId });
    // Mark occupied rooms
    if (def.status === "CHECKED_IN") {
      await db.physicalRoom.update({ where: { id: room.id }, data: { status: "OCCUPIED" } });
      await db.roomStatusHistory.create({
        data: { roomId: room.id, fromStatus: "AVAILABLE", toStatus: "OCCUPIED", reason: `Check-in ${stayNumber}`, changedBy: staff.reception1.fullName },
      });
    } else {
      await db.physicalRoom.update({ where: { id: room.id }, data: { status: "RESERVED" } });
    }
  }
  console.log(`Stays: ${stays.length} created (${stayDefs.filter(s => s.status === "CHECKED_IN").length} in-house, ${stayDefs.filter(s => s.status === "EXPECTED").length} expected)`);

  // ── Charges for in-house stays (room charge + sample service) ────────
  for (const stay of stays) {
    const def = stayDefs.find((s) => s.stayNum === Number(stay.stayNumber.split("-").pop()));
    if (!def || def.status !== "CHECKED_IN") continue;
    const rt = rtBySlug[physicalRooms[def.room].typeSlug];
    if (!rt) continue;
    // Room charge: nights * basePrice
    const roomCharge = rt.basePrice * def.nights;
    await db.charge.create({
      data: {
        stayId: stay.id,
        description: `Room (${def.nights} nights × ${rt.nameEn})`,
        category: "ROOM",
        quantity: def.nights,
        unitPrice: rt.basePrice,
        grossAmount: roomCharge,
        netAmount: roomCharge,
        tax: 0,
        source: "ROOM",
        createdBy: "SYSTEM",
      },
    });
  }

  // ── Access codes ─────────────────────────────────────────────────────
  // Guest code for stay #1 (in-house)
  const inHouseStay = stays[0];
  const guestCode = generateAccessCode("GUEST");
  const guestCodeRecord = await db.accessCode.create({
    data: {
      codeHash: hashAccessCode(guestCode.raw),
      codeType: "GUEST",
      stayId: inHouseStay.id,
      guestId: inHouseStay.guestId,
      validFrom: now,
      validUntil: addDays(now, 3),
      status: "ACTIVE",
    },
  });
  console.log(`Guest access code: ${guestCode.raw} (stay ${inHouseStay.stayNumber})`);

  // Reception code (8-hour shift)
  const receptionCode = generateAccessCode("RECEPTION");
  await db.accessCode.create({
    data: {
      codeHash: hashAccessCode(receptionCode.raw),
      codeType: "RECEPTION",
      staffId: staff.reception1.id,
      role: "RECEPTION",
      validFrom: now,
      validUntil: new Date(now.getTime() + 8 * 60 * 60 * 1000),
      status: "ACTIVE",
    },
  });
  console.log(`Reception access code: ${receptionCode.raw} (staff ${staff.reception1.fullName})`);

  // Admin code (24 hours)
  const adminCode = generateAccessCode("ADMIN");
  await db.accessCode.create({
    data: {
      codeHash: hashAccessCode(adminCode.raw),
      codeType: "ADMIN",
      staffId: staff.admin.id,
      role: "ADMIN",
      validFrom: now,
      validUntil: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      status: "ACTIVE",
    },
  });
  console.log(`Admin access code: ${adminCode.raw} (staff ${staff.admin.fullName})`);

  // Master admin code (24 hours)
  const masterCode = generateAccessCode("ADMIN");
  await db.accessCode.create({
    data: {
      codeHash: hashAccessCode(masterCode.raw),
      codeType: "ADMIN",
      staffId: staff.master.id,
      role: "MASTER_ADMIN",
      validFrom: now,
      validUntil: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      status: "ACTIVE",
    },
  });
  console.log(`Master admin access code: ${masterCode.raw} (staff ${staff.master.fullName})`);

  // ── Sample guest request on stay #1 ──────────────────────────────────
  const sampleReq = await db.guestRequest.create({
    data: {
      requestNumber: 1,
      stayId: inHouseStay.id,
      guestId: inHouseStay.guestId,
      roomId: inHouseStay.roomId,
      category: "housekeeping",
      service: "clean-room",
      title: "Clean Room",
      description: "Please clean the room before 11 AM.",
      priority: "NORMAL",
      status: "ACKNOWLEDGED",
      assignedTo: "Housekeeping",
      createdAt: new Date(now.getTime() - 30 * 60 * 1000),
    },
  });
  await db.guestRequestEvent.create({
    data: { requestId: sampleReq.id, eventType: "CREATED", toStatus: "NEW", performedBy: guests[0].fullName, performedByRole: "GUEST", createdAt: new Date(now.getTime() - 30 * 60 * 1000) },
  });
  await db.guestRequestEvent.create({
    data: { requestId: sampleReq.id, eventType: "ACKNOWLEDGED", fromStatus: "NEW", toStatus: "ACKNOWLEDGED", note: "We will send housekeeping shortly.", performedBy: staff.reception1.fullName, performedByRole: "RECEPTION", createdAt: new Date(now.getTime() - 20 * 60 * 1000) },
  });

  // ── Sample conversation for stay #1 ──────────────────────────────────
  const conv = await db.conversation.create({
    data: { stayId: inHouseStay.id, guestId: inHouseStay.guestId, roomId: inHouseStay.roomId, status: "OPEN" },
  });
  await db.conversationMessage.create({
    data: { conversationId: conv.id, senderRole: "RECEPTION", senderId: staff.reception1.id, senderName: staff.reception1.fullName, body: "Welcome to Dar Al-Yasmin Royal Hotel! How can we assist you during your stay?", createdAt: new Date(now.getTime() - 25 * 60 * 1000) },
  });
  await db.conversationMessage.create({
    data: { conversationId: conv.id, senderRole: "GUEST", senderId: inHouseStay.guestId, senderName: guests[0].fullName, body: "Thank you! Could you send extra towels to room 103?", createdAt: new Date(now.getTime() - 20 * 60 * 1000) },
  });

  console.log("\n✅ App seed completed successfully");
  console.log("   Test codes (save these for testing):");
  console.log(`   Guest:    ${guestCode.raw}`);
  console.log(`   Reception: ${receptionCode.raw}`);
  console.log(`   Admin:    ${adminCode.raw}`);
  console.log(`   Master:   ${masterCode.raw}`);

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
