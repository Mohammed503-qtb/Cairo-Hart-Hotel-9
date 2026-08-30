import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const reviews = await db.review.findMany({
    where: { isPublished: true, isFeatured: true },
    orderBy: { displayOrder: "asc" },
    take: 12,
  });

  // Compute aggregate rating
  const allReviews = await db.review.findMany({
    where: { isPublished: true },
    select: { rating: true },
  });
  const avgRating =
    allReviews.length > 0
      ? Math.round((allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length) * 10) / 10
      : 0;
  const totalReviews = allReviews.length;

  // Rating distribution
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: allReviews.filter((r) => Math.floor(r.rating) === star).length,
  }));

  return NextResponse.json({
    reviews,
    summary: { avgRating, totalReviews, distribution },
  });
}
