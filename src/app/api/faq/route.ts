import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const faqs = await db.faq.findMany({
    orderBy: { displayOrder: "asc" },
  });
  return NextResponse.json({ faqs });
}
