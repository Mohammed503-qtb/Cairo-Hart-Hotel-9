import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface ContactBody {
  name: string;
  email: string;
  message: string;
}

export async function POST(req: Request) {
  try {
    const body: ContactBody = await req.json();
    const name = (body.name || "").trim();
    const email = (body.email || "").trim();
    const message = (body.message || "").trim();

    if (name.length < 2) {
      return NextResponse.json({ error: "invalid_name" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }
    if (message.length < 10) {
      return NextResponse.json({ error: "invalid_message" }, { status: 400 });
    }

    // Store the contact message in audit log (production: send email or save to a messages table)
    await db.auditLog.create({
      data: {
        action: "CONTACT_MESSAGE_RECEIVED",
        entityType: "Contact",
        entityId: email,
        performedBy: "PUBLIC",
        details: JSON.stringify({ name, email, message: message.slice(0, 2000), receivedAt: new Date().toISOString() }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[contact] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
