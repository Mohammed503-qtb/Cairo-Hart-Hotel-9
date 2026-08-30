"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AmenityIcon } from "@/components/shared/amenity-icon";
import { useT, useLocalized } from "@/hooks/use-t";
import { useUIStore } from "@/stores/ui-store";
import { useBookingStore } from "@/stores/booking-store";
import { useRecentlyViewedStore } from "@/stores/recently-viewed-store";
import { useRoom, useHotel, useRooms } from "@/hooks/use-data";
import { useMoney, useCurrencyRates } from "@/hooks/use-currency";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Users,
  BedDouble,
  Maximize,
  ShieldCheck,
  ShieldX,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Info,
} from "lucide-react";

/**
 * RoomDetailDialog
 * Opens when `roomDetailSlug` is set in the UI store.
 * Shows gallery, name, short description, tabbed details (description / capacity /
 * amenities / cancellation) and a prominent "Check Availability" CTA that closes
 * this dialog and opens the booking flow.
 */
export function RoomDetailDialog() {
  const { t, locale } = useT();
  const localized = useLocalized();
  const slug = useUIStore((s) => s.roomDetailSlug);
  const closeRoomDetail = useUIStore((s) => s.closeRoomDetail);
  const openBooking = useUIStore((s) => s.openBooking);
  const setSearchParams = useBookingStore((s) => s.setSearchParams);

  const { data: hotel } = useHotel();
  const currency = hotel?.currency ?? "YER";

  const { data: room, isLoading, isError } = useRoom(slug);
  const addRecentlyViewed = useRecentlyViewedStore((s) => s.addRoom);

  const [activeImage, setActiveImage] = React.useState(0);
  React.useEffect(() => {
    if (slug) setActiveImage(0);
  }, [slug]);

  // Record room view when data loads
  React.useEffect(() => {
    if (room) {
      addRecentlyViewed({
        slug: room.slug,
        nameAr: room.nameAr,
        nameEn: room.nameEn,
        imageUrl: room.imageUrl,
        basePrice: room.basePrice,
      });
    }
  }, [room, addRecentlyViewed]);

  const isOpen = !!slug;

  const handleOpenChange = (open: boolean) => {
    if (!open) closeRoomDetail();
  };

  const handleCheckAvailability = () => {
    // Keep existing search params (no-op) — or rely on defaults already populated
    setSearchParams({});
    closeRoomDetail();
    openBooking();
  };

  const isRTL = locale === "ar";
  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  // Images: prefer room.images (sorted), fallback to room.imageUrl
  const galleryImages = React.useMemo<string[]>(() => {
    if (!room) return [];
    if (room.images.length > 0) {
      return [...room.images]
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((i) => i.url);
    }
    return [room.imageUrl];
  }, [room]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton
        className="max-w-4xl w-full max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden rounded-2xl border-gold/30 shadow-luxury bg-background"
      >
        <VisuallyHidden>
          <DialogTitle>
            {room ? localized(room.nameAr, room.nameEn) : t("rooms.viewDetails")}
          </DialogTitle>
          <DialogDescription>
            {room ? localized(room.shortDescriptionAr, room.shortDescriptionEn) : ""}
          </DialogDescription>
        </VisuallyHidden>

        {isLoading && <RoomDetailSkeleton />}

        {isError && !isLoading && (
          <div className="p-10 text-center text-destructive">{t("common.error")}</div>
        )}

        {room && !isLoading && !isError && (
          <>
            {/* Image gallery */}
            <div className="relative aspect-[16/9] sm:aspect-[2/1] w-full bg-muted overflow-hidden shrink-0">
              <img
                src={galleryImages[activeImage]}
                alt={localized(room.nameAr, room.nameEn)}
                className="w-full h-full object-cover"
              />
              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImage((i) => (i - 1 + galleryImages.length) % galleryImages.length)
                    }
                    className="absolute top-1/2 -translate-y-1/2 start-2 bg-background/80 hover:bg-background backdrop-blur-md rounded-full p-1.5 shadow-md transition"
                    aria-label={isRTL ? "التالي" : "Previous"}
                  >
                    <PrevIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImage((i) => (i + 1) % galleryImages.length)}
                    className="absolute top-1/2 -translate-y-1/2 end-2 bg-background/80 hover:bg-background backdrop-blur-md rounded-full p-1.5 shadow-md transition"
                    aria-label={isRTL ? "السابق" : "Next"}
                  >
                    <NextIcon className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5">
                    {galleryImages.map((_, idx) => (
                      <span
                        key={idx}
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          idx === activeImage ? "w-6 bg-gold" : "w-1.5 bg-foreground/40"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="flex gap-2 px-4 pt-3 overflow-x-auto custom-scroll shrink-0">
                {galleryImages.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(idx)}
                    className={cn(
                      "relative shrink-0 w-20 h-14 sm:w-24 sm:h-16 rounded-md overflow-hidden border-2 transition",
                      idx === activeImage
                        ? "border-gold opacity-100"
                        : "border-transparent opacity-70 hover:opacity-100"
                    )}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Header / title / price */}
            <div className="px-4 sm:px-6 pt-4 pb-2 shrink-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                    {localized(room.nameAr, room.nameEn)}
                  </h2>
                  {room.shortDescriptionAr && (
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {localized(room.shortDescriptionAr, room.shortDescriptionEn)}
                    </p>
                  )}
                </div>
                <div className="text-end shrink-0 ps-2">
                  <div className="text-xs text-muted-foreground">{t("rooms.from")}</div>
                  <div className="text-xl font-bold text-gradient-gold">
                    {formatMoney(room.basePrice, currency, locale)}
                  </div>
                  <div className="text-xs text-muted-foreground">{t("rooms.perNight")}</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs
              defaultValue="description"
              className="flex flex-col flex-1 overflow-hidden min-h-0"
            >
              <div className="px-4 sm:px-6 shrink-0">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="description">{t("roomDetail.description")}</TabsTrigger>
                  <TabsTrigger value="capacity">{t("roomDetail.capacity")}</TabsTrigger>
                  <TabsTrigger value="amenities">{t("rooms.amenities")}</TabsTrigger>
                  <TabsTrigger value="cancellation">
                    {t("roomDetail.cancellation")}
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 custom-scroll min-h-0">
                <TabsContent value="description" className="mt-0">
                  <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                    {localized(room.descriptionAr, room.descriptionEn)}
                  </p>
                </TabsContent>

                <TabsContent value="capacity" className="mt-0 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <CapacityCard
                      icon={<Users className="w-5 h-5" />}
                      label={t("rooms.maxGuests")}
                      value={`${room.maxAdults + room.maxChildren}`}
                      sub={localized(
                        `${room.maxAdults} ${t("common.adults")} • ${room.maxChildren} ${t("common.children")}`,
                        `${room.maxAdults} ${t("common.adults")} • ${room.maxChildren} ${t("common.children")}`
                      )}
                    />
                    <CapacityCard
                      icon={<BedDouble className="w-5 h-5" />}
                      label={t("rooms.bedConfig")}
                      value={localized(room.bedConfigAr, room.bedConfigEn)}
                    />
                    <CapacityCard
                      icon={<Maximize className="w-5 h-5" />}
                      label={t("rooms.size")}
                      value={room.sizeSqm ? `${room.sizeSqm} m²` : "—"}
                    />
                    <CapacityCard
                      icon={
                        room.ratePlan?.isRefundable ? (
                          <ShieldCheck className="w-5 h-5" />
                        ) : (
                          <ShieldX className="w-5 h-5" />
                        )
                      }
                      label={t("roomDetail.cancellation")}
                      value={
                        room.ratePlan?.isRefundable
                          ? localized("قابل للاسترداد", "Refundable")
                          : localized("غير قابل للاسترداد", "Non-refundable")
                      }
                    />
                  </div>
                  {room.totalInventory > 0 && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      {localized(
                        `إجمالي الغرف المتاحة: ${room.totalInventory}`,
                        `Total inventory: ${room.totalInventory} rooms`
                      )}
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="amenities" className="mt-0">
                  {room.amenities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">—</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {room.amenities.map(({ amenity }, idx) => (
                        <div
                          key={`${amenity.slug}-${idx}`}
                          className="flex items-center gap-2 p-3 rounded-lg border bg-card"
                        >
                          <span className="flex items-center justify-center w-9 h-9 rounded-full bg-gold/10 text-gold shrink-0">
                            <AmenityIcon iconKey={amenity.iconKey} className="w-4 h-4" />
                          </span>
                          <span className="text-sm font-medium leading-tight">
                            {localized(amenity.nameAr, amenity.nameEn)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="cancellation" className="mt-0">
                  {room.ratePlan ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {room.ratePlan.isRefundable ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            {localized("قابل للاسترداد", "Refundable")}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            {localized("غير قابل للاسترداد", "Non-refundable")}
                          </Badge>
                        )}
                        {room.ratePlan.isRefundable && room.ratePlan.cancellationDays > 0 && (
                          <span className="text-sm text-muted-foreground">
                            {localized(
                              `إلغاء مجاني قبل ${room.ratePlan.cancellationDays} أيام من الوصول`,
                              `Free cancellation up to ${room.ratePlan.cancellationDays} days before arrival`
                            )}
                          </span>
                        )}
                      </div>
                      <div className="rounded-lg border bg-cream/30 p-3">
                        <div className="text-xs text-muted-foreground mb-1">
                          {localized("خطة السعر", "Rate plan")}
                        </div>
                        <div className="font-medium text-sm">
                          {localized(room.ratePlan.nameAr, room.ratePlan.nameEn)}
                        </div>
                        {room.ratePlan.descriptionAr && (
                          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                            {localized(
                              room.ratePlan.descriptionAr,
                              room.ratePlan.descriptionEn ?? ""
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </TabsContent>
              </div>
            </Tabs>

            {/* Similar rooms */}
            {room && <SimilarRooms currentSlug={room.slug} />}

            {/* Footer CTA */}
            <div className="border-t border-gold/20 p-4 sm:p-5 shrink-0 bg-background">
              <Button
                onClick={handleCheckAvailability}
                className="w-full h-12 bg-gold-gradient text-gold-foreground hover:opacity-90 text-base font-bold shadow-md rounded-lg"
              >
                <Sparkles className="w-4 h-4" />
                {t("rooms.checkAvailability")}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
function CapacityCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-2 text-gold">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="mt-1 font-semibold text-sm leading-snug">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function RoomDetailSkeleton() {
  return (
    <>
      <Skeleton className="aspect-[16/9] sm:aspect-[2/1] w-full shrink-0 rounded-none" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between gap-4">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="h-12 w-24" />
        </div>
        <Skeleton className="h-9 w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Similar rooms — shows other room types (excluding current)
// ---------------------------------------------------------------------------
function SimilarRooms({ currentSlug }: { currentSlug: string }) {
  const { locale } = useT();
  const loc = useLocalized();
  const money = useMoney();
  const { data: rooms } = useRooms();
  const openRoomDetail = useUIStore((s) => s.openRoomDetail);

  const similar = (rooms || [])
    .filter((r) => r.slug !== currentSlug && r.isActive)
    .slice(0, 3);

  if (similar.length === 0) return null;

  return (
    <div className="px-4 sm:px-5 pb-3">
      <h4 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-gold" />
        {locale === "ar" ? "غرف مشابهة قد تعجبك" : "Similar rooms you may like"}
      </h4>
      <div className="grid grid-cols-3 gap-2">
        {similar.map((room) => (
          <button
            key={room.id}
            onClick={() => openRoomDetail(room.slug)}
            className="group rounded-xl overflow-hidden border border-border/50 hover:border-gold/40 hover:shadow-luxury transition-all text-start"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              <img
                src={room.imageUrl}
                alt={loc(room.nameAr, room.nameEn)}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep/70 to-transparent opacity-60" />
              <div className="absolute bottom-1.5 inset-x-1.5">
                <div className="text-[10px] font-bold text-white leading-tight line-clamp-1 drop-shadow">
                  {loc(room.nameAr, room.nameEn)}
                </div>
                <div className="text-[9px] text-gold font-semibold">
                  {money(room.basePrice, locale)}
                  <span className="text-white/60 font-normal"> / {locale === "ar" ? "ليلة" : "night"}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
