"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useT, useLocalized } from "@/hooks/use-t";
import { useUIStore } from "@/stores/ui-store";
import { formatMoney, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  X,
  Search,
  Loader2,
  Calendar,
  Users,
  BedDouble,
  Phone,
  Mail,
  MapPin,
  Hotel,
  Clock,
  FileText,
  ShieldAlert,
  Ban,
  AlertCircle,
  CheckCircle2,
  Receipt,
  Tag,
  MessageSquare,
  Pencil,
  Download,
} from "lucide-react";
import { ModifyBookingDialog, type ModifyReservationData } from "@/components/manage/modify-booking-dialog";
import { useRooms } from "@/hooks/use-data";

// ---------------------------------------------------------------------------
// Types (mirror the API response shape)
// ---------------------------------------------------------------------------
type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PAYMENT_PENDING"
  | "CANCELLED"
  | "FAILED"
  | "EXPIRED"
  | "NO_SHOW";

type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID" | "REFUNDED";

interface LookupResponse {
  reservation: {
    bookingReference: string;
    status: ReservationStatus;
    paymentStatus: PaymentStatus;
    paymentMethod: string | null;
    checkIn: string; // ISO date
    checkOut: string;
    nights: number;
    adults: number;
    children: number;
    rooms: number;
    currency: string;
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    serviceChargeTotal: number;
    grandTotal: number;
    paidTotal: number;
    specialRequest: string | null;
    createdAt: string;
    confirmedAt: string | null;
    cancelledAt: string | null;
  };
  guest: {
    fullName: string;
    phone: string;
    email: string;
  };
  hotel: {
    nameAr: string;
    nameEn: string;
    phone: string;
    whatsapp: string | null;
    email: string;
    addressAr: string;
    addressEn: string;
    checkInTime: string;
    checkOutTime: string;
  };
  items: Array<{
    roomTypeId: string;
    nameAr: string;
    nameEn: string;
    imageUrl: string;
    quantity: number;
    nights: number;
    nightlyRate: number;
    subtotal: number;
  }>;
  cancellationPolicy: string; // JSON string
}

interface PolicyItem {
  category: string;
  titleAr: string;
  bodyAr: string;
  titleEn: string;
  bodyEn: string;
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------
function statusBadgeClass(status: ReservationStatus): string {
  switch (status) {
    case "CONFIRMED":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "PENDING":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "PAYMENT_PENDING":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "CANCELLED":
      return "bg-red-100 text-red-800 border-red-200";
    case "FAILED":
      return "bg-red-100 text-red-800 border-red-200";
    case "EXPIRED":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "NO_SHOW":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function paymentBadgeClass(status: PaymentStatus): string {
  switch (status) {
    case "PAID":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "PARTIAL":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "UNPAID":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "REFUNDED":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function ManageBookingDialog() {
  const { t, locale } = useT();
  const localized = useLocalized();
  const manageOpen = useUIStore((s) => s.manageOpen);
  const closeManage = useUIStore((s) => s.closeManage);

  const [view, setView] = React.useState<"lookup" | "details">("lookup");
  const [reference, setReference] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [lookupLoading, setLookupLoading] = React.useState(false);
  const [lookupError, setLookupError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<LookupResponse | null>(null);

  // Cancel dialog state
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");
  const [cancelling, setCancelling] = React.useState(false);

  // Modify dialog state
  const [modifyOpen, setModifyOpen] = React.useState(false);
  const { data: roomsData } = useRooms();
  const roomTypesForModify = (roomsData || []).map((r) => ({
    id: r.id,
    nameAr: r.nameAr,
    nameEn: r.nameEn,
    basePrice: r.basePrice,
    maxAdults: r.maxAdults,
    maxChildren: r.maxChildren,
    slug: r.slug,
  }));

  // Reset everything when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeManage();
      // Defer reset to allow close animation to play
      setTimeout(() => {
        setView("lookup");
        setReference("");
        setPhone("");
        setLookupError(null);
        setData(null);
        setCancelReason("");
        setCancelOpen(false);
      }, 250);
    }
  };

  const performLookup = async (ref: string, phoneDigits: string) => {
    setLookupLoading(true);
    setLookupError(null);
    try {
      const res = await fetch("/api/booking/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: ref, phone: phoneDigits }),
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "notFound");
      }
      const json = (await res.json()) as LookupResponse;
      setData(json);
      setView("details");
      return json;
    } catch {
      setLookupError(t("manage.notFound"));
      toast.error(t("manage.notFound"));
      return null;
    } finally {
      setLookupLoading(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const ref = reference.trim().toUpperCase();
    const phoneDigits = phone.replace(/\D/g, "");
    if (!ref || phoneDigits.length < 6) {
      setLookupError(t("manage.notFound"));
      toast.error(t("manage.notFound"));
      return;
    }
    await performLookup(ref, phoneDigits);
  };

  const handleCancelConfirm = async () => {
    if (!data) return;
    setCancelling(true);
    try {
      const res = await fetch(
        `/api/booking/${encodeURIComponent(data.reservation.bookingReference)}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: data.guest.phone,
            reason: cancelReason.trim(),
          }),
          cache: "no-store",
        }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "cancelFailed");
      }
      toast.success(t("manage.cancelled"));
      // Refresh details from lookup
      setCancelOpen(false);
      setCancelReason("");
      // Re-fetch the reservation
      try {
        const lookupRes = await fetch("/api/booking/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference: data.reservation.bookingReference,
            phone: data.guest.phone,
          }),
          cache: "no-store",
        });
        if (lookupRes.ok) {
          const refreshed = (await lookupRes.json()) as LookupResponse;
          setData(refreshed);
        } else {
          // If re-lookup fails, just patch the local status to CANCELLED
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  reservation: {
                    ...prev.reservation,
                    status: "CANCELLED",
                    cancelledAt: new Date().toISOString(),
                  },
                }
              : prev
          );
        }
      } catch {
        // Local patch fallback
        setData((prev) =>
          prev
            ? {
                ...prev,
                reservation: {
                  ...prev.reservation,
                  status: "CANCELLED",
                  cancelledAt: new Date().toISOString(),
                },
              }
            : prev
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "cancelFailed";
      const friendly =
        message === "alreadyCancelled"
          ? t("manage.status.CANCELLED")
          : message === "cannotCancelPast"
          ? localized(
              "لا يمكن إلغاء الحجز بعد تاريخ المغادرة",
              "Cannot cancel a booking after check-out date"
            )
          : t("common.error");
      toast.error(friendly);
    } finally {
      setCancelling(false);
    }
  };

  const isCancelled = data?.reservation.status === "CANCELLED";
  const isPast = data ? new Date(data.reservation.checkOut) < new Date() : false;

  return (
    <>
      <Dialog open={manageOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="max-w-2xl w-full max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden rounded-2xl border-gold/30 shadow-luxury bg-background"
        >
          <VisuallyHidden>
            <DialogTitle>{t("manage.title")}</DialogTitle>
            <DialogDescription>{t("manage.subtitle")}</DialogDescription>
          </VisuallyHidden>

          {/* Sticky header */}
          <header className="sticky top-0 z-20 border-b border-gold/20 bg-background/95 backdrop-blur-md shrink-0">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gold/10 text-gold shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight truncate">
                    {t("manage.title")}
                  </h2>
                  <p className="text-xs text-muted-foreground truncate">
                    {t("manage.subtitle")}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleOpenChange(false)}
                className="rounded-full hover:bg-accent shrink-0"
                aria-label={t("common.close")}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </header>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 bg-cream/30 custom-scroll">
            {view === "lookup" && (
              <LookupForm
                reference={reference}
                phone={phone}
                onReferenceChange={(v) => setReference(v.toUpperCase())}
                onPhoneChange={setPhone}
                onSubmit={handleLookup}
                loading={lookupLoading}
                error={lookupError}
              />
            )}

            {view === "details" && data && (
              <DetailsView
                data={data}
                isCancelled={!!isCancelled}
                onOpenCancel={() => setCancelOpen(true)}
              />
            )}
          </div>

          {/* Footer (details view only) */}
          {view === "details" && data && (
            <footer className="border-t border-gold/20 p-4 shrink-0 bg-background">
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="sm:flex-1 lg:flex-none"
                >
                  {t("common.close")}
                </Button>
                {data && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const phoneDigits = data.guest.phone.replace(/\D/g, "");
                      const ref = data.reservation.bookingReference;
                      window.open(`/api/booking/${ref}/confirmation?phone=${encodeURIComponent(phoneDigits)}&locale=${locale}`, "_blank");
                    }}
                    className="sm:flex-1 lg:flex-none border-gold/40 text-gold hover:bg-gold hover:text-gold-foreground"
                  >
                    <Download className="w-4 h-4" />
                    {t("booking.downloadConfirmation")}
                  </Button>
                )}
                {!isCancelled && !isPast && (
                  <Button
                    variant="outline"
                    onClick={() => setModifyOpen(true)}
                    className="sm:flex-1 lg:flex-none border-gold/40 text-gold hover:bg-gold hover:text-gold-foreground"
                  >
                    <Pencil className="w-4 h-4" />
                    {t("manage.modifyBooking")}
                  </Button>
                )}
                {!isCancelled && (
                  <Button
                    variant="destructive"
                    onClick={() => setCancelOpen(true)}
                    className="sm:flex-1 lg:flex-none"
                  >
                    <Ban className="w-4 h-4" />
                    {t("manage.cancelBooking")}
                  </Button>
                )}
              </div>
            </footer>
          )}
        </DialogContent>
      </Dialog>

      {/* Modify booking dialog */}
      {data && (
        <ModifyBookingDialog
          open={modifyOpen}
          onOpenChange={setModifyOpen}
          reservation={
            {
              bookingReference: data.reservation.bookingReference,
              checkIn: data.reservation.checkIn,
              checkOut: data.reservation.checkOut,
              nights: data.reservation.nights,
              adults: data.reservation.adults,
              children: data.reservation.children,
              rooms: data.reservation.rooms,
              grandTotal: data.reservation.grandTotal,
              currency: data.reservation.currency,
              specialRequest: data.reservation.specialRequest,
              roomTypeId: data.items[0]?.roomTypeId || "",
              roomTypeNameAr: data.items[0]?.nameAr || "",
              roomTypeNameEn: data.items[0]?.nameEn || "",
              phone: data.guest.phone,
            } satisfies ModifyReservationData
          }
          roomTypes={roomTypesForModify}
          onModified={() => {
            // Re-fetch the reservation details after modification
            if (data) {
              performLookup(data.reservation.bookingReference, data.guest.phone.replace(/\D/g, ""));
            }
          }}
        />
      )}

      {/* Cancel confirmation */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="w-5 h-5" />
              {t("manage.cancelBooking")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("manage.cancelConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">{t("manage.cancelReason")}</Label>
            <Input
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              maxLength={500}
              disabled={cancelling}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>
              {t("common.close")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancelConfirm();
              }}
              disabled={cancelling}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {cancelling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Ban className="w-4 h-4" />
              )}
              {t("manage.cancelConfirmBtn")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Lookup form
// ---------------------------------------------------------------------------
function LookupForm({
  reference,
  phone,
  onReferenceChange,
  onPhoneChange,
  onSubmit,
  loading,
  error,
}: {
  reference: string;
  phone: string;
  onReferenceChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
}) {
  const { t } = useT();

  return (
    <form onSubmit={onSubmit} className="space-y-4 animate-fade-in">
      <div className="rounded-xl border border-gold/30 bg-card p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-gold">
          <Search className="w-5 h-5" />
          <h3 className="font-bold text-base">{t("manage.lookup")}</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="manage-reference">{t("manage.reference")}</Label>
          <Input
            id="manage-reference"
            value={reference}
            onChange={(e) => onReferenceChange(e.target.value)}
            placeholder={t("manage.referencePlaceholder")}
            dir="ltr"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="font-mono text-center uppercase tracking-wider"
            required
            disabled={loading}
            maxLength={32}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="manage-phone">{t("manage.phone")}</Label>
          <Input
            id="manage-phone"
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder={t("manage.phonePlaceholder")}
            dir="ltr"
            autoComplete="tel"
            required
            disabled={loading}
            maxLength={32}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>{t("manage.notFound")}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full h-11 bg-gold-gradient text-gold-foreground hover:opacity-90 font-bold"
          disabled={loading || !reference.trim() || phone.replace(/\D/g, "").length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("common.loading")}
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              {t("manage.lookup")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Details view
// ---------------------------------------------------------------------------
function DetailsView({
  data,
  isCancelled,
  onOpenCancel,
}: {
  data: LookupResponse;
  isCancelled: boolean;
  onOpenCancel: () => void;
}) {
  const { t, locale } = useT();
  const localized = useLocalized();
  const {
    reservation: r,
    guest,
    hotel,
    items,
    cancellationPolicy,
  } = data;

  const currency = r.currency || "YER";
  const checkInDate = new Date(r.checkIn);
  const checkOutDate = new Date(r.checkOut);
  const createdAt = new Date(r.createdAt);

  const policies: PolicyItem[] = React.useMemo(() => {
    if (!cancellationPolicy) return [];
    try {
      const parsed = JSON.parse(cancellationPolicy);
      if (Array.isArray(parsed)) return parsed as PolicyItem[];
      return [];
    } catch {
      return [];
    }
  }, [cancellationPolicy]);

  // Filter policies to those likely relevant to cancellation/info
  const visiblePolicies = policies.filter(
    (p) =>
      p.category === "cancellation" ||
      p.category === "noshow" ||
      p.category === "payment"
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Cancelled banner */}
      {isCancelled && (
        <Alert variant="destructive" className="border-red-300 bg-red-50">
          <Ban className="w-4 h-4" />
          <AlertTitle>{t("manage.status.CANCELLED")}</AlertTitle>
          <AlertDescription>
            {r.cancelledAt
              ? localized(
                  `ألغي في ${formatDate(new Date(r.cancelledAt), locale)}`,
                  `Cancelled on ${formatDate(new Date(r.cancelledAt), locale)}`
                )
              : t("manage.status.CANCELLED")}
          </AlertDescription>
        </Alert>
      )}

      {/* Reference + status */}
      <div className="rounded-xl border border-gold/30 bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-muted-foreground">{t("booking.reference")}</div>
            <div className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-gradient-gold break-all">
              {r.bookingReference}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {localized(
                `أُنشئ في ${formatDate(createdAt, locale)}`,
                `Created on ${formatDate(createdAt, locale)}`
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge
              variant="outline"
              className={cn("text-xs font-bold", statusBadgeClass(r.status))}
            >
              {t(`manage.status.${r.status}`)}
            </Badge>
            <Badge
              variant="outline"
              className={cn("text-xs font-bold", paymentBadgeClass(r.paymentStatus))}
            >
              <Receipt className="w-3 h-3" />
              {t(`manage.paymentStatus.${r.paymentStatus}`)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Guest info */}
      <SectionCard icon={<Users className="w-4 h-4" />} title={t("booking.guestInfo")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow label={t("booking.fullName")} value={guest.fullName} />
          <InfoRow
            label={t("booking.phone")}
            value={guest.phone}
            icon={<Phone className="w-3.5 h-3.5" />}
            dir="ltr"
            align="end"
          />
          {guest.email && (
            <InfoRow
              label={t("booking.email")}
              value={guest.email}
              icon={<Mail className="w-3.5 h-3.5" />}
              dir="ltr"
              align="end"
              fullSpan
            />
          )}
        </div>
      </SectionCard>

      {/* Stay summary */}
      <SectionCard icon={<Calendar className="w-4 h-4" />} title={t("booking.yourStay")}>
        <div className="grid grid-cols-2 gap-3">
          <InfoRow
            label={t("booking.checkIn")}
            value={formatDate(checkInDate, locale)}
            sub={hotel.checkInTime ? `${hotel.checkInTime}` : undefined}
          />
          <InfoRow
            label={t("booking.checkOut")}
            value={formatDate(checkOutDate, locale)}
            sub={hotel.checkOutTime ? `${hotel.checkOutTime}` : undefined}
          />
          <InfoRow
            label={t("booking.totalNights")}
            value={`${r.nights} ${t("common.nights")}`}
          />
          <InfoRow
            label={t("booking.guests")}
            value={`${r.adults} ${t("common.adults")}${
              r.children > 0 ? ` • ${r.children} ${t("common.children")}` : ""
            }`}
            icon={<Users className="w-3.5 h-3.5" />}
          />
          <InfoRow
            label={t("booking.rooms")}
            value={`${r.rooms} ${t("common.room")}`}
            icon={<BedDouble className="w-3.5 h-3.5" />}
            fullSpan
          />
        </div>
      </SectionCard>

      {/* Items */}
      <SectionCard icon={<BedDouble className="w-4 h-4" />} title={t("booking.roomType")}>
        <div className="space-y-3">
          {items.map((it, idx) => (
            <div
              key={idx}
              className="flex gap-3 p-2 rounded-lg border bg-cream/40"
            >
              <div className="w-20 h-16 rounded-md overflow-hidden bg-muted shrink-0">
                <img
                  src={it.imageUrl}
                  alt={localized(it.nameAr, it.nameEn)}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">
                  {localized(it.nameAr, it.nameEn)}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {localized(
                    `${it.quantity} غرفة × ${it.nights} ليلة`,
                    `${it.quantity} room × ${it.nights} nights`
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("booking.perNight")}: {formatMoney(it.nightlyRate, currency, locale)}
                </div>
              </div>
              <div className="text-end shrink-0 self-center">
                <div className="font-bold text-sm text-gradient-gold">
                  {formatMoney(it.subtotal, currency, locale)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Price breakdown */}
      <SectionCard icon={<Receipt className="w-4 h-4" />} title={t("booking.priceBreakdown")}>
        <div className="space-y-2 text-sm">
          <PriceRow label={t("booking.subtotal")} value={formatMoney(r.subtotal, currency, locale)} />
          {r.discountTotal > 0 && (
            <PriceRow
              label={t("booking.discount")}
              value={`- ${formatMoney(r.discountTotal, currency, locale)}`}
              accent="text-emerald-600"
            />
          )}
          {r.taxTotal > 0 && (
            <PriceRow label={t("booking.taxes")} value={formatMoney(r.taxTotal, currency, locale)} />
          )}
          {r.serviceChargeTotal > 0 && (
            <PriceRow
              label={t("booking.serviceCharge")}
              value={formatMoney(r.serviceChargeTotal, currency, locale)}
            />
          )}
          <Separator className="my-2 bg-gold/20" />
          <div className="flex items-center justify-between">
            <span className="font-bold text-base">{t("booking.total")}</span>
            <span className="font-bold text-base text-gradient-gold">
              {formatMoney(r.grandTotal, currency, locale)}
            </span>
          </div>
          {r.paidTotal > 0 && r.paidTotal < r.grandTotal && (
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>{localized("المدفوع", "Paid")}</span>
              <span className="font-medium text-emerald-600">
                {formatMoney(r.paidTotal, currency, locale)}
              </span>
            </div>
          )}
          {r.paidTotal >= r.grandTotal && r.grandTotal > 0 && (
            <div className="flex items-center justify-between text-xs text-emerald-600 pt-1">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {localized("مدفوع بالكامل", "Fully paid")}
              </span>
              <span className="font-medium">
                {formatMoney(r.paidTotal, currency, locale)}
              </span>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Special request */}
      {r.specialRequest && (
        <SectionCard icon={<MessageSquare className="w-4 h-4" />} title={t("booking.specialRequest")}>
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
            {r.specialRequest}
          </p>
        </SectionCard>
      )}

      {/* Cancellation policy */}
      {visiblePolicies.length > 0 && (
        <SectionCard
          icon={<ShieldAlert className="w-4 h-4" />}
          title={t("manage.cancellationPolicy")}
        >
          <div className="space-y-3">
            {visiblePolicies.map((p, idx) => (
              <div key={`${p.category}-${idx}`} className="rounded-lg bg-cream/40 p-3">
                <div className="flex items-center gap-1.5 font-medium text-sm">
                  <Tag className="w-3.5 h-3.5 text-gold" />
                  {localized(p.titleAr, p.titleEn)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed whitespace-pre-line">
                  {localized(p.bodyAr, p.bodyEn)}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Hotel contact */}
      <SectionCard icon={<Hotel className="w-4 h-4" />} title={localized(hotel.nameAr, hotel.nameEn)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {hotel.phone && (
            <InfoRow
              label={t("contact.phone")}
              value={hotel.phone}
              icon={<Phone className="w-3.5 h-3.5" />}
              dir="ltr"
              align="end"
            />
          )}
          {hotel.whatsapp && (
            <InfoRow
              label={t("contact.whatsapp")}
              value={hotel.whatsapp}
              icon={<Phone className="w-3.5 h-3.5" />}
              dir="ltr"
              align="end"
            />
          )}
          {hotel.email && (
            <InfoRow
              label={t("contact.email")}
              value={hotel.email}
              icon={<Mail className="w-3.5 h-3.5" />}
              dir="ltr"
              align="end"
              fullSpan
            />
          )}
          <InfoRow
            label={t("contact.address")}
            value={localized(hotel.addressAr, hotel.addressEn)}
            icon={<MapPin className="w-3.5 h-3.5" />}
            fullSpan
          />
          <InfoRow
            label={t("policies.checkin")}
            value={hotel.checkInTime}
            icon={<Clock className="w-3.5 h-3.5" />}
          />
          <InfoRow
            label={t("policies.checkout")}
            value={hotel.checkOutTime}
            icon={<Clock className="w-3.5 h-3.5" />}
          />
        </div>
      </SectionCard>

      {/* Mobile cancel button */}
      {onOpenCancel && !isCancelled && (
        <div className="sm:hidden">
          <Button
            variant="destructive"
            className="w-full"
            onClick={onOpenCancel}
          >
            <Ban className="w-4 h-4" />
            {t("manage.cancelBooking")}
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small layout primitives
// ---------------------------------------------------------------------------
function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card overflow-hidden">
      <header className="flex items-center gap-2 px-4 py-2.5 border-b bg-cream/40">
        <span className="text-gold">{icon}</span>
        <h3 className="text-sm font-bold">{title}</h3>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function InfoRow({
  label,
  value,
  icon,
  dir,
  align,
  fullSpan,
  sub,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  dir?: "ltr" | "rtl";
  align?: "start" | "end";
  fullSpan?: boolean;
  sub?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", fullSpan && "sm:col-span-2")}>
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span
        dir={dir}
        className={cn(
          "text-sm font-medium",
          align === "end" && "text-end",
          dir === "ltr" && "inline-block"
        )}
      >
        {value}
      </span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

function PriceRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium", accent)}>{value}</span>
    </div>
  );
}
