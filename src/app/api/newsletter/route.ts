import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface NewsletterBody {
  email: string;
  name?: string;
  locale?: string;
}

export async function POST(req: Request) {
  try {
    const body: NewsletterBody = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    const name = (body.name || "").trim() || null;
    const locale = (body.locale || "ar") === "en" ? "en" : "ar";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }

    // Check if already subscribed
    const existing = await db.newsletter.findUnique({ where: { email } });

    if (existing) {
      if (!existing.isActive) {
        // Re-activate if previously unsubscribed
        await db.newsletter.update({
          where: { email },
          data: { isActive: true, unsubscribedAt: null, name, locale, updatedAt: new Date() },
        });
        return NextResponse.json({ success: true, reactivated: true });
      }
      // Already active
      return NextResponse.json({ success: true, already_subscribed: true });
    }

    // Create new subscription
    await db.newsletter.create({
      data: {
        email,
        name,
        locale,
        isActive: true,
        source: "WEBSITE_FOOTER",
        // In production, confirmedAt would be set after email confirmation link clicked
        confirmedAt: new Date(), // auto-confirm for now (no email infrastructure)
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        action: "NEWSLETTER_SUBSCRIBED",
        entityType: "Newsletter",
        entityId: email,
        performedBy: "PUBLIC",
        details: JSON.stringify({ email, locale, source: "WEBSITE_FOOTER" }),
      },
    });

    return NextResponse.json({ success: true, subscribed: true });
  } catch (e) {
    console.error("[newsletter] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
