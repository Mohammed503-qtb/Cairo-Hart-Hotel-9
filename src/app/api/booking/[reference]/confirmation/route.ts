import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formatMoney, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

// GET /api/booking/[reference]/confirmation?phone=...
// Returns a professional printable HTML booking confirmation document.
// The HTML is self-contained (inline CSS) and optimized for print-to-PDF via browser.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const url = new URL(req.url);
    const phone = (url.searchParams.get("phone") || "").replace(/\D/g, "");
    const locale = (url.searchParams.get("locale") || "ar") as "ar" | "en";

    const reservation = await db.reservation.findUnique({
      where: { bookingReference: reference.toUpperCase() },
      include: {
        guest: true,
        items: { include: { roomType: true } },
        payments: true,
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    const hotel = await db.hotel.findFirst();
    if (!hotel) {
      return NextResponse.json({ error: "hotel_not_configured" }, { status: 500 });
    }

    // Verify phone
    const resPhoneDigits = reservation.guest.phone.replace(/\D/g, "");
    const phoneTail = phone.slice(-8);
    const resTail = resPhoneDigits.slice(-8);
    if (phoneTail.length < 6 || phoneTail !== resTail) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    const isAr = locale === "ar";
    const dir = isAr ? "rtl" : "ltr";
    const lang = isAr ? "ar" : "en";
    const tr = (ar: string, en: string) => (isAr ? ar : en);

    const checkIn = formatDate(new Date(reservation.checkIn), locale);
    const checkOut = formatDate(new Date(reservation.checkOut), locale);
    const createdAt = formatDate(new Date(reservation.createdAt), locale);

    const statusLabel = tr(
      { PENDING: "قيد الانتظار", CONFIRMED: "مؤكد", PAYMENT_PENDING: "بانتظار الدفع", CANCELLED: "ملغى", FAILED: "فشل", EXPIRED: "منتهي", NO_SHOW: "لم يحضر" }[reservation.status] || reservation.status,
      reservation.status
    );
    const paymentStatusLabel = tr(
      { UNPAID: "غير مدفوع", PARTIAL: "مدفوع جزئياً", PAID: "مدفوع", REFUNDED: "مُسترد" }[reservation.paymentStatus] || reservation.paymentStatus,
      reservation.paymentStatus
    );

    const roomItem = reservation.items[0];
    const roomName = roomItem ? (isAr ? roomItem.roomType.nameAr : roomItem.roomType.nameEn) : "";
    const roomImage = roomItem?.roomType.imageUrl || "";
    const hotelName = isAr ? hotel.nameAr : hotel.nameEn;
    const hotelAddress = isAr ? `${hotel.addressAr}، ${hotel.cityAr}` : `${hotel.addressEn}, ${hotel.cityEn}`;

    // Parse cancellation policy snapshot
    let cancellationPolicies: { titleAr: string; bodyAr: string; titleEn: string; bodyEn: string; category: string }[] = [];
    try {
      cancellationPolicies = JSON.parse(reservation.policySnapshot);
    } catch {
      // ignore parse errors
    }
    const relevantPolicies = cancellationPolicies.filter((p) =>
      ["cancellation", "noshow", "payment", "checkin", "checkout"].includes(p.category)
    );

    const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${tr("تأكيد حجز", "Booking Confirmation")} - ${reservation.bookingReference}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #f5f3ee;
    color: #2a2520;
    line-height: 1.6;
    padding: 20px;
  }
  .doc {
    max-width: 800px;
    margin: 0 auto;
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 50px rgba(0,0,0,0.1);
  }
  .header {
    background: linear-gradient(135deg, #1a4d3e 0%, #2d6e5a 100%);
    color: #fff;
    padding: 32px 40px;
    position: relative;
    overflow: hidden;
  }
  .header::before {
    content: '';
    position: absolute;
    top: -50px;
    ${isAr ? "left" : "right"}: -50px;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: rgba(212, 175, 55, 0.1);
  }
  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    position: relative;
    z-index: 1;
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .logo-circle {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #d4af37, #b8941f);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 800;
    color: #fff;
  }
  .logo-text { font-size: 18px; font-weight: 700; }
  .logo-sub { font-size: 11px; opacity: 0.8; letter-spacing: 1px; }
  .status-badge {
    background: ${reservation.status === "CONFIRMED" ? "#10b981" : reservation.status === "CANCELLED" ? "#ef4444" : "#f59e0b"};
    color: #fff;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
  }
  .title-section { position: relative; z-index: 1; }
  .doc-title {
    font-size: 28px;
    font-weight: 800;
    margin-bottom: 8px;
  }
  .ref {
    font-family: 'Courier New', monospace;
    font-size: 20px;
    font-weight: 700;
    color: #d4af37;
    letter-spacing: 2px;
  }
  .body { padding: 32px 40px; }
  .section { margin-bottom: 28px; }
  .section-title {
    font-size: 14px;
    font-weight: 700;
    color: #1a4d3e;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 14px;
    padding-bottom: 8px;
    border-bottom: 2px solid #d4af37;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section-title::before {
    content: '';
    width: 4px;
    height: 18px;
    background: #d4af37;
    border-radius: 2px;
  }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  .field { }
  .field-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .field-value { font-size: 15px; font-weight: 600; color: #2a2520; }
  .room-card {
    display: flex;
    gap: 16px;
    background: #f9f7f1;
    border-radius: 12px;
    padding: 16px;
    border: 1px solid #e5e0d5;
  }
  .room-img {
    width: 100px;
    height: 80px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
  }
  .room-info { flex: 1; }
  .room-name { font-size: 16px; font-weight: 700; margin-bottom: 4px; color: #1a4d3e; }
  .room-meta { font-size: 13px; color: #666; }
  .price-table { width: 100%; border-collapse: collapse; }
  .price-table tr { border-bottom: 1px solid #eee; }
  .price-table tr:last-child { border-bottom: 2px solid #1a4d3e; }
  .price-table td { padding: 10px 0; font-size: 14px; }
  .price-table .label { color: #666; }
  .price-table .value { font-weight: 600; text-align: ${isAr ? "left" : "right"}; }
  .price-table .total-row td { padding: 16px 0; font-size: 18px; font-weight: 800; color: #1a4d3e; }
  .price-table .total-row .value { color: #d4af37; }
  .policies { background: #f9f7f1; border-radius: 12px; padding: 16px; border-1px solid #e5e0d5; }
  .policy-item { margin-bottom: 12px; }
  .policy-item:last-child { margin-bottom: 0; }
  .policy-title { font-size: 13px; font-weight: 700; color: #1a4d3e; margin-bottom: 4px; }
  .policy-body { font-size: 12px; color: #666; line-height: 1.5; }
  .hotel-contact {
    background: linear-gradient(135deg, #f9f7f1 0%, #f5f3ee 100%);
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #e5e0d5;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .contact-item { font-size: 13px; }
  .contact-label { color: #888; font-size: 11px; text-transform: uppercase; margin-bottom: 2px; }
  .contact-value { font-weight: 600; color: #2a2520; }
  .footer {
    background: #1a4d3e;
    color: #fff;
    padding: 20px 40px;
    text-align: center;
    font-size: 12px;
    opacity: 0.9;
  }
  .footer a { color: #d4af37; text-decoration: none; }
  .print-btn {
    position: fixed;
    top: 20px;
    ${isAr ? "left" : "right"}: 20px;
    background: #d4af37;
    color: #fff;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 100;
  }
  @media print {
    body { background: #fff; padding: 0; }
    .doc { box-shadow: none; border-radius: 0; max-width: 100%; }
    .print-btn { display: none; }
    .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .footer { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">${tr("طباعة / حفظ PDF", "Print / Save PDF")}</button>
<div class="doc">
  <!-- Header -->
  <div class="header">
    <div class="header-top">
      <div class="logo">
        <div class="logo-circle">ي</div>
        <div>
          <div class="logo-text">${hotelName}</div>
          <div class="logo-sub">${tr("عدن • اليمن", "ADEN • YEMEN")}</div>
        </div>
      </div>
      <div class="status-badge">${statusLabel}</div>
    </div>
    <div class="title-section">
      <div class="doc-title">${tr("تأكيد حجز", "Booking Confirmation")}</div>
      <div class="ref">${reservation.bookingReference}</div>
    </div>
  </div>

  <!-- Body -->
  <div class="body">
    <!-- Guest & stay summary -->
    <div class="section">
      <div class="section-title">${tr("تفاصيل الحجز", "Booking Details")}</div>
      <div class="grid">
        <div class="field">
          <div class="field-label">${tr("اسم الضيف", "Guest Name")}</div>
          <div class="field-value">${reservation.guest.fullName}</div>
        </div>
        <div class="field">
          <div class="field-label">${tr("تاريخ الإنشاء", "Created")}</div>
          <div class="field-value">${createdAt}</div>
        </div>
        <div class="field">
          <div class="field-label">${tr("تاريخ الوصول", "Check-in")}</div>
          <div class="field-value">${checkIn} • ${hotel.checkInTime}</div>
        </div>
        <div class="field">
          <div class="field-label">${tr("تاريخ المغادرة", "Check-out")}</div>
          <div class="field-value">${checkOut} • ${hotel.checkOutTime}</div>
        </div>
        <div class="field">
          <div class="field-label">${tr("عدد الليالي", "Nights")}</div>
          <div class="field-value">${reservation.nights} ${tr("ليلة", "nights")}</div>
        </div>
        <div class="field">
          <div class="field-label">${tr("الضيوف", "Guests")}</div>
          <div class="field-value">${reservation.adults} ${tr("بالغ", "adults")}${reservation.children > 0 ? " + " + reservation.children + " " + tr("طفل", "children") : ""}</div>
        </div>
      </div>
    </div>

    <!-- Room -->
    <div class="section">
      <div class="section-title">${tr("الغرفة", "Room")}</div>
      <div class="room-card">
        ${roomImage ? `<img src="${roomImage}" alt="${roomName}" class="room-img" />` : ""}
        <div class="room-info">
          <div class="room-name">${roomName}</div>
          <div class="room-meta">${reservation.rooms} ${tr("غرفة", "room(s)")} • ${reservation.nights} ${tr("ليلة", "nights")} • ${formatMoney(roomItem?.nightlyRate || 0, reservation.currency, locale)} / ${tr("ليلة", "night")}</div>
        </div>
      </div>
    </div>

    <!-- Price breakdown -->
    <div class="section">
      <div class="section-title">${tr("تفاصيل السعر", "Price Breakdown")}</div>
      <table class="price-table">
        <tr>
          <td class="label">${tr("المجموع الفرعي", "Subtotal")} (${reservation.nights} × ${formatMoney(roomItem?.nightlyRate || 0, reservation.currency, locale)} × ${reservation.rooms})</td>
          <td class="value">${formatMoney(reservation.subtotal, reservation.currency, locale)}</td>
        </tr>
        ${reservation.discountTotal > 0 ? `<tr><td class="label">${tr("الخصم", "Discount")}</td><td class="value" style="color:#10b981">- ${formatMoney(reservation.discountTotal, reservation.currency, locale)}</td></tr>` : ""}
        <tr>
          <td class="label">${tr("الضرائب", "Taxes")} (${hotel.taxRatePercent}%)</td>
          <td class="value">${formatMoney(reservation.taxTotal, reservation.currency, locale)}</td>
        </tr>
        <tr>
          <td class="label">${tr("رسوم الخدمة", "Service Charge")} (${hotel.serviceChargePercent}%)</td>
          <td class="value">${formatMoney(reservation.serviceChargeTotal, reservation.currency, locale)}</td>
        </tr>
        <tr class="total-row">
          <td>${tr("الإجمالي", "Grand Total")}</td>
          <td class="value">${formatMoney(reservation.grandTotal, reservation.currency, locale)}</td>
        </tr>
        <tr>
          <td class="label">${tr("حالة الدفع", "Payment Status")}</td>
          <td class="value">${paymentStatusLabel}</td>
        </tr>
      </table>
    </div>

    <!-- Policies -->
    ${relevantPolicies.length > 0 ? `
    <div class="section">
      <div class="section-title">${tr("السياسات المهمة", "Important Policies")}</div>
      <div class="policies">
        ${relevantPolicies.map((p) => `
          <div class="policy-item">
            <div class="policy-title">${isAr ? p.titleAr : p.titleEn}</div>
            <div class="policy-body">${isAr ? p.bodyAr : p.bodyEn}</div>
          </div>
        `).join("")}
      </div>
    </div>
    ` : ""}

    <!-- Special request -->
    ${reservation.specialRequest ? `
    <div class="section">
      <div class="section-title">${tr("طلبات خاصة", "Special Requests")}</div>
      <div style="background:#f9f7f1; border-radius:12px; padding:16px; font-size:13px; color:#666;">
        ${reservation.specialRequest}
      </div>
    </div>
    ` : ""}

    <!-- Hotel contact -->
    <div class="section">
      <div class="section-title">${tr("معلومات الفندق", "Hotel Information")}</div>
      <div class="hotel-contact">
        <div class="contact-item">
          <div class="contact-label">${tr("العنوان", "Address")}</div>
          <div class="contact-value">${hotelAddress}</div>
        </div>
        <div class="contact-item">
          <div class="contact-label">${tr("الهاتف", "Phone")}</div>
          <div class="contact-value" dir="ltr">${hotel.phone}</div>
        </div>
        ${hotel.whatsapp ? `
        <div class="contact-item">
          <div class="contact-label">WhatsApp</div>
          <div class="contact-value" dir="ltr">${hotel.whatsapp}</div>
        </div>
        ` : ""}
        <div class="contact-item">
          <div class="contact-label">${tr("البريد الإلكتروني", "Email")}</div>
          <div class="contact-value" dir="ltr">${hotel.email}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    ${tr("هذه الوثيقة هي تأكيد حجزك الرسمي. يرجى تقديمها عند الوصول.", "This document is your official booking confirmation. Please present it upon arrival.")}<br>
    ${tr("للاستفسار:", "For inquiries:")} <a href="tel:${hotel.phone}">${hotel.phone}</a> • <a href="mailto:${hotel.email}">${hotel.email}</a><br>
    © ${new Date().getFullYear()} ${hotelName}
  </div>
</div>
<script>
  // Auto-trigger print dialog after load
  window.addEventListener('load', function() {
    setTimeout(function() { window.print(); }, 500);
  });
</script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (e) {
    console.error("[booking/confirmation] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
