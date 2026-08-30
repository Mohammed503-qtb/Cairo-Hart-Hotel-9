"use client";

import { useState } from "react";
import {
  Settings,
  X,
  BedDouble,
  Tag,
  Percent,
  FileText,
  RefreshCw,
  Check,
  X as XIcon,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { useT } from "@/hooks/use-t";
import { useAdminStats } from "@/hooks/use-data";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatMoney, formatDate } from "@/lib/format";

type Tab = "overview" | "rooms" | "promoCodes" | "offers" | "policies";

export function AdminPanel() {
  const { locale } = useT();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 start-4 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border border-gold/40 shadow-luxury text-gold hover:bg-gold hover:text-gold-foreground transition-colors text-sm font-semibold"
      >
        <Settings className="w-4 h-4" />
        <span className="hidden sm:inline">{locale === "ar" ? "لوحة الإدارة" : "Admin"}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-card rounded-2xl shadow-luxury border border-gold/30 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-card border-b border-border/50 p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gold" />
                <h2 className="font-display text-xl font-bold">
                  {locale === "ar" ? "لوحة الإدارة" : "Admin Panel"}
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-accent flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-3 border-b border-border/30 overflow-x-auto custom-scroll">
              {[
                { key: "overview", labelAr: "نظرة عامة", labelEn: "Overview", icon: TrendingUp },
                { key: "rooms", labelAr: "الغرف", labelEn: "Rooms", icon: BedDouble },
                { key: "promoCodes", labelAr: "أكواد الخصم", labelEn: "Promo Codes", icon: Tag },
                { key: "offers", labelAr: "العروض", labelEn: "Offers", icon: Percent },
                { key: "policies", labelAr: "السياسات", labelEn: "Policies", icon: FileText },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as Tab)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap",
                    activeTab === tab.key
                      ? "bg-gold-gradient text-gold-foreground shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {locale === "ar" ? tab.labelAr : tab.labelEn}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scroll p-5">
              {activeTab === "overview" && <OverviewTab locale={locale} />}
              {activeTab === "rooms" && <RoomsTab locale={locale} />}
              {activeTab === "promoCodes" && <PromoCodesTab locale={locale} />}
              {activeTab === "offers" && <OffersTab locale={locale} />}
              {activeTab === "policies" && <PoliciesTab locale={locale} />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function OverviewTab({ locale }: { locale: "ar" | "en" }) {
  const { data, isLoading, refetch, isFetching } = useAdminStats(true);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data) return <div className="text-center py-8 text-muted-foreground">Error loading stats</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">{locale === "ar" ? "إحصائيات الحجوزات" : "Booking Statistics"}</h3>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-xs text-muted-foreground hover:text-gold flex items-center gap-1 transition-colors"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
          {locale === "ar" ? "تحديث" : "Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={locale === "ar" ? "إجمالي الحجوزات" : "Total Bookings"}
          value={String(data.totals.totalReservations)}
          color="emerald"
        />
        <StatCard
          label={locale === "ar" ? "الإيرادات" : "Revenue"}
          value={formatMoney(data.totals.totalRevenue, "YER", locale)}
          color="gold"
        />
        <StatCard
          label={locale === "ar" ? "ضيوف حاليون" : "Current Guests"}
          value={String(data.totals.currentGuests)}
          color="blue"
        />
        <StatCard
          label={locale === "ar" ? "وصول قادم" : "Upcoming"}
          value={String(data.totals.upcomingCheckIns)}
          color="purple"
        />
      </div>

      {/* Booking trend */}
      <div className="bg-cream/30 rounded-xl border border-border/50 p-4">
        <h4 className="font-semibold text-sm mb-3">
          {locale === "ar" ? "حجوزات آخر 7 أيام" : "Bookings (7 days)"}
        </h4>
        <div className="flex items-end gap-2 h-32">
          {data.bookingTrend.map((day) => {
            const max = Math.max(...data.bookingTrend.map((d) => d.count), 1);
            const height = (day.count / max) * 100;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-muted-foreground">{day.count}</span>
                <div className="w-full bg-muted rounded-t flex-1 flex items-end min-h-[60px]">
                  <div
                    className="w-full bg-gold-gradient rounded-t transition-all duration-500"
                    style={{ height: `${height}%`, minHeight: day.count > 0 ? "6px" : "0" }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground">
                  {new Date(day.date).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { weekday: "short" })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Popular rooms */}
      {data.popularRooms.length > 0 && (
        <div className="bg-cream/30 rounded-xl border border-border/50 p-4">
          <h4 className="font-semibold text-sm mb-3">
            {locale === "ar" ? "الغرف الأكثر حجزاً" : "Most Booked Rooms"}
          </h4>
          <div className="space-y-2">
            {data.popularRooms.map((room, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-[10px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="flex-1 font-medium">{locale === "ar" ? room.nameAr : room.nameEn}</span>
                <Badge variant="outline" className="text-xs">
                  {room.bookingCount} {locale === "ar" ? "حجز" : "bookings"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RoomsTab({ locale }: { locale: "ar" | "en" }) {
  const [rooms, setRooms] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/rooms", { cache: "no-store" });
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    loadRooms();
  });

  if (loading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;

  return (
    <div className="space-y-3">
      {rooms.map((room: any) => (
        <div key={room.id} className="bg-card border border-border/50 rounded-xl p-4 flex items-center gap-3">
          <img src={room.imageUrl} alt={room.nameEn} className="w-16 h-16 rounded-lg object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm truncate">{locale === "ar" ? room.nameAr : room.nameEn}</h4>
              {room.isActive ? (
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <XIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              )}
              {room.isFeatured && <Badge className="bg-gold/20 text-gold text-[9px]">★</Badge>}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span>{formatMoney(room.basePrice, "YER", locale)}</span>
              <span>•</span>
              <span>{room.totalInventory} {locale === "ar" ? "غرف" : "rooms"}</span>
              <span>•</span>
              <span>{room.maxAdults + room.maxChildren} {locale === "ar" ? "ضيوف" : "guests"}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PromoCodesTab({ locale }: { locale: "ar" | "en" }) {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promo-codes", { cache: "no-store" });
      const data = await res.json();
      setCodes(data.promoCodes || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    loadCodes();
  });

  if (loading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;

  return (
    <div className="space-y-3">
      {codes.map((code) => {
        const now = new Date();
        const isExpired = new Date(code.validTo) < now;
        const isExhausted = code.maxUses > 0 && code.usedCount >= code.maxUses;
        return (
          <div key={code.id} className="bg-card border border-border/50 rounded-xl p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm bg-muted px-2 py-0.5 rounded">{code.code}</span>
                  {code.isActive && !isExpired && !isExhausted ? (
                    <Badge className="bg-emerald-100 text-emerald-700 text-[9px]">
                      {locale === "ar" ? "نشط" : "Active"}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px]">
                      {isExpired ? (locale === "ar" ? "منتهي" : "Expired") : isExhausted ? (locale === "ar" ? "مستنفد" : "Exhausted") : (locale === "ar" ? "متوقف" : "Inactive")}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {locale === "ar" ? code.nameAr : code.nameEn}
                </p>
              </div>
              <div className="text-end">
                <div className="text-sm font-bold text-gradient-gold">
                  {code.discountType === "PERCENTAGE"
                    ? `${code.discountValue}%`
                    : formatMoney(code.discountValue, "YER", locale)}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {code.discountType === "PERCENTAGE" ? (locale === "ar" ? "نسبة مئوية" : "Percentage") : (locale === "ar" ? "مبلغ ثابت" : "Fixed")}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-2 border-t border-border/30">
              <span>{locale === "ar" ? "مستخدم" : "Used"}: {code.usedCount}/{code.maxUses === 0 ? "∞" : code.maxUses}</span>
              <span>•</span>
              <span>{locale === "ar" ? "ينتهي" : "Valid to"}: {formatDate(new Date(code.validTo), locale)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OffersTab({ locale }: { locale: "ar" | "en" }) {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOffers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/offers", { cache: "no-store" });
      const data = await res.json();
      setOffers(data.offers || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    loadOffers();
  });

  if (loading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;

  return (
    <div className="space-y-3">
      {offers.map((offer) => {
        const now = new Date();
        const isExpired = new Date(offer.validTo) < now;
        return (
          <div key={offer.id} className="bg-card border border-border/50 rounded-xl p-4 flex gap-3">
            {offer.imageUrl && (
              <img src={offer.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm">{locale === "ar" ? offer.titleAr : offer.titleEn}</h4>
                {offer.discountPercent && (
                  <Badge className="bg-gold-gradient text-gold-foreground text-[9px]">-{offer.discountPercent}%</Badge>
                )}
                {isExpired ? (
                  <Badge variant="outline" className="text-[9px]">{locale === "ar" ? "منتهي" : "Expired"}</Badge>
                ) : (
                  <Badge className="bg-emerald-100 text-emerald-700 text-[9px]">{locale === "ar" ? "ساري" : "Active"}</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {locale === "ar" ? offer.descriptionAr : offer.descriptionEn}
              </p>
              <div className="text-[10px] text-muted-foreground mt-1">
                {formatDate(new Date(offer.validFrom), locale)} → {formatDate(new Date(offer.validTo), locale)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PoliciesTab({ locale }: { locale: "ar" | "en" }) {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/policies", { cache: "no-store" });
      const data = await res.json();
      setPolicies(data.policies || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    loadPolicies();
  });

  if (loading) return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

  return (
    <div className="space-y-2">
      {policies.map((policy) => (
        <div key={policy.id} className="bg-card border border-border/50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[9px] uppercase">{policy.category}</Badge>
            <h4 className="font-semibold text-sm">{locale === "ar" ? policy.titleAr : policy.titleEn}</h4>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {locale === "ar" ? policy.bodyAr : policy.bodyEn}
          </p>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: "emerald" | "gold" | "blue" | "purple" }) {
  const colorMap = {
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    gold: "bg-gold-soft text-gold",
    blue: "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  };
  return (
    <div className="bg-card rounded-xl border border-border/50 p-3">
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center mb-2", colorMap[color])}>
        <TrendingUp className="w-4 h-4" />
      </div>
      <div className="text-[10px] text-muted-foreground mb-0.5">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
