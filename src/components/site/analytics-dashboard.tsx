"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  BedDouble,
  RefreshCw,
  X,
} from "lucide-react";
import { useT } from "@/hooks/use-t";
import { useAdminStats } from "@/hooks/use-data";
import { useMoney, useCurrencyRates } from "@/hooks/use-currency";
import { useLocalized } from "@/hooks/use-t";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function AnalyticsDashboard() {
  const { locale } = useT();
  const loc = useLocalized();
  const money = useMoney();
  useCurrencyRates();
  const [open, setOpen] = useState(false);
  const { data, isLoading, refetch, isFetching } = useAdminStats(open);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 start-4 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border border-gold/40 shadow-luxury text-gold hover:bg-gold hover:text-gold-foreground transition-colors text-sm font-semibold"
      >
        <BarChart3 className="w-4 h-4" />
        {locale === "ar" ? "لوحة التحكم" : "Dashboard"}
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep/60 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)}>
          <div
            className="bg-card rounded-2xl shadow-luxury border border-gold/30 max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scroll"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-card border-b border-border/50 p-5 flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gold" />
                  {locale === "ar" ? "لوحة تحكم الحجوزات" : "Booking Dashboard"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {locale === "ar" ? "إحصائيات الحجوزات والإيرادات" : "Booking & revenue statistics"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="rounded-full h-9 w-9"
                >
                  <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  className="rounded-full h-9 w-9"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-6">
              {isLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 rounded-xl" />
                  ))}
                </div>
              ) : data ? (
                <>
                  {/* KPI cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                      icon={Calendar}
                      label={locale === "ar" ? "إجمالي الحجوزات" : "Total Bookings"}
                      value={String(data.totals.totalReservations)}
                      sub={`${data.totals.confirmedReservations} ${locale === "ar" ? "مؤكد" : "confirmed"}`}
                      color="emerald"
                    />
                    <KpiCard
                      icon={DollarSign}
                      label={locale === "ar" ? "إجمالي الإيرادات" : "Total Revenue"}
                      value={money(data.totals.totalRevenue, locale)}
                      sub={`${locale === "ar" ? "محصّل" : "Collected"}: ${money(data.totals.totalCollected, locale)}`}
                      color="gold"
                    />
                    <KpiCard
                      icon={Users}
                      label={locale === "ar" ? "ضيوف حاليون" : "Current Guests"}
                      value={String(data.totals.currentGuests)}
                      sub={`${data.totals.upcomingCheckIns} ${locale === "ar" ? "وصول قادم" : "upcoming"}`}
                      color="blue"
                    />
                    <KpiCard
                      icon={TrendingUp}
                      label={locale === "ar" ? "حجوزات هذا الشهر" : "This Month"}
                      value={String(data.totals.thisMonthReservations)}
                      sub={
                        <span className={cn("flex items-center gap-1", data.totals.monthChange >= 0 ? "text-emerald-600" : "text-destructive")}>
                          {data.totals.monthChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {Math.abs(data.totals.monthChange)}% {locale === "ar" ? "عن الشهر الماضي" : "vs last month"}
                        </span>
                      }
                      color="purple"
                    />
                  </div>

                  {/* Booking trend chart */}
                  <div className="bg-cream/30 rounded-xl border border-border/50 p-4">
                    <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-gold" />
                      {locale === "ar" ? "حجوزات آخر 7 أيام" : "Bookings last 7 days"}
                    </h3>
                    <div className="flex items-end justify-between gap-2 h-40">
                      {data.bookingTrend.map((day) => {
                        const max = Math.max(...data.bookingTrend.map((d) => d.count), 1);
                        const height = (day.count / max) * 100;
                        return (
                          <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                            <div className="text-xs font-bold text-muted-foreground">{day.count}</div>
                            <div className="w-full bg-muted rounded-t-lg overflow-hidden flex-1 flex items-end" style={{ minHeight: "80px" }}>
                              <div
                                className="w-full bg-gold-gradient rounded-t-lg transition-all duration-500"
                                style={{ height: `${height}%`, minHeight: day.count > 0 ? "8px" : "0" }}
                              />
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {new Date(day.date).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { weekday: "short" })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Status distribution + Popular rooms */}
                  <div className="grid lg:grid-cols-2 gap-4">
                    {/* Status distribution */}
                    <div className="bg-cream/30 rounded-xl border border-border/50 p-4">
                      <h3 className="font-semibold text-sm mb-3">
                        {locale === "ar" ? "توزيع الحالات" : "Status Distribution"}
                      </h3>
                      <div className="space-y-2">
                        {data.statusDistribution.map((s) => {
                          const pct = data.totals.totalReservations > 0 ? (s.count / data.totals.totalReservations) * 100 : 0;
                          return (
                            <div key={s.status} className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                              <span className="text-xs font-medium w-20">{loc(s.labelAr, s.labelEn)}</span>
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                              </div>
                              <span className="text-xs font-bold w-8 text-end">{s.count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Popular rooms */}
                    <div className="bg-cream/30 rounded-xl border border-border/50 p-4">
                      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <BedDouble className="w-4 h-4 text-gold" />
                        {locale === "ar" ? "الغرف الأكثر حجزاً" : "Most Booked Rooms"}
                      </h3>
                      <div className="space-y-2">
                        {data.popularRooms.slice(0, 4).map((room, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-gold/20 text-gold text-[10px] font-bold flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-xs font-medium flex-1 truncate">{loc(room.nameAr, room.nameEn)}</span>
                            <span className="text-xs text-muted-foreground">{room.bookingCount}</span>
                            <span className="text-[10px] text-muted-foreground/70">
                              ({locale === "ar" ? "من" : "of"} {room.inventory})
                            </span>
                          </div>
                        ))}
                        {data.popularRooms.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-4">
                            {locale === "ar" ? "لا توجد حجوزات بعد" : "No bookings yet"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* This month revenue */}
                  <div className="bg-gradient-to-r from-deep to-primary text-white rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs opacity-80 mb-1">
                        {locale === "ar" ? "إيرادات هذا الشهر" : "This Month Revenue"}
                      </div>
                      <div className="text-2xl font-bold text-gold">
                        {money(data.totals.thisMonthRevenue, locale)}
                      </div>
                    </div>
                    <DollarSign className="w-10 h-10 text-gold/40" />
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  {locale === "ar" ? "تعذر تحميل الإحصائيات" : "Could not load stats"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub: React.ReactNode;
  color: "emerald" | "gold" | "blue" | "purple";
}) {
  const colorMap = {
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    gold: "bg-gold-soft text-gold",
    blue: "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  };
  return (
    <div className="bg-card rounded-xl border border-border/50 p-4 hover:shadow-luxury transition-shadow">
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mb-3", colorMap[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-xl font-bold mb-1">{value}</div>
      <div className="text-[10px] text-muted-foreground">{sub}</div>
    </div>
  );
}
