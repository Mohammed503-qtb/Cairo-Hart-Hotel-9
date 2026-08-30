import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const policies = await db.policy.findMany({
    orderBy: { displayOrder: "asc" },
  });
  return NextResponse.json({ policies });
}
