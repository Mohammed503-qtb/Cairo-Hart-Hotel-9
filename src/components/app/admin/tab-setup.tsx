"use client";

// Admin setup tab — hotel settings form + room types (read-only).

import * as React from "react";
import { Save, Settings, Bed, AlertCircle, Loader2, Building2 } from "lucide-react";
import { useFetch, apiPost } from "./use-fetch";
import { AdminLocale, t } from "./i18n";
import { LoadingSpinner, EmptyState, Money } from "@/components/app/shared";
import { toast } from "sonner";

interface HotelData {
  ok: boolean;
  hotel: {
    id: string;
    nameAr: string;
    nameEn: string;
    phone: string;
    whatsapp: string | null;
    email: string;
    addressAr: string;
    addressEn: string;
    checkInTime: string;
    checkOutTime: string;
    currency: string;
    taxRatePercent: number;
    serviceChargePercent: number;
    bookingHorizonDays: number;
    minStayNights: number;
    maxStayNights: number;
    maxAdultsPerRoom: number;
  };
}

interface RoomTypesData {
  rooms: Array<{
    id: string;
    slug: string;
    nameAr: string;
    nameEn: string;
    basePrice: number;
    totalInventory: number;
    isActive: boolean;
    maxAdults: number;
    maxChildren: number;
  }>;
}

interface Props {
  locale: AdminLocale;
}

export function SetupTab({ locale }: Props) {
  const { data: hotelData, loading, error, refresh } = useFetch<HotelData>("/api/app/admin/hotel");
  const { data: roomTypesData, loading: rtLoading } = useFetch<RoomTypesData>("/api/rooms");

  const [form, setForm] = React.useState<Record<string, string> | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Hydrate form when hotel loads
  React.useEffect(() => {
    if (hotelData?.hotel) {
      const h = hotelData.hotel;
      setForm({
        nameAr: h.nameAr,
        nameEn: h.nameEn,
        phone: h.phone,
        whatsapp: h.whatsapp || "",
        email: h.email,
        addressAr: h.addressAr,
        addressEn: h.addressEn,
        checkInTime: h.checkInTime,
        checkOutTime: h.checkOutTime,
        taxRatePercent: String(h.taxRatePercent),
        serviceChargePercent: String(h.serviceChargePercent),
        minStayNights: String(h.minStayNights),
        maxStayNights: String(h.maxStayNights),
        bookingHorizonDays: String(h.bookingHorizonDays),
        maxAdultsPerRoom: String(h.maxAdultsPerRoom),
      });
    }
  }, [hotelData]);

  function setField(key: string, value: string) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setFormError(null);
    // Build body — convert numeric fields
    const body: Record<string, unknown> = { ...form };
    body.taxRatePercent = Number(form.taxRatePercent) || 0;
    body.serviceChargePercent = Number(form.serviceChargePercent) || 0;
    body.minStayNights = Number(form.minStayNights) || 0;
    body.maxStayNights = Number(form.maxStayNights) || 0;
    body.bookingHorizonDays = Number(form.bookingHorizonDays) || 0;
    body.maxAdultsPerRoom = Number(form.maxAdultsPerRoom) || 0;

    const res = await apiPost("/api/app/admin/hotel", body);
    setSaving(false);
    if (res.ok) {
      toast.success(t("toastHotelSaveOk", locale));
      refresh();
    } else {
      const errMap: Record<string, string> = {
        taxRateOutOfRange: locale === "ar" ? "نسبة الضريبة بين 0 و100" : "Tax must be 0–100",
        serviceChargeOutOfRange: locale === "ar" ? "رسوم الخدمة بين 0 و100" : "Service charge must be 0–100",
        minStayOutOfRange: locale === "ar" ? "أقل ليالٍ بين 1 و365" : "Min nights must be 1–365",
        maxStayOutOfRange: locale === "ar" ? "أقصى ليالٍ بين 1 و365" : "Max nights must be 1–365",
        horizonOutOfRange: locale === "ar" ? "أفق الحجز بين 1 و730 يوم" : "Horizon must be 1–730 days",
        adultsOutOfRange: locale === "ar" ? "أقصى بالغين بين 1 و20" : "Adults must be 1–20",
      };
      toast.error(errMap[res.error || ""] || t("errGeneric", locale));
      setFormError(errMap[res.error || ""] || t("errGeneric", locale));
    }
  }

  return (
    <div className="h-full overflow-y-auto pb-4">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-bold text-slate-900">{t("setupHotel", locale)}</h2>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label={t("loading", locale)} />
      ) : error ? (
        <EmptyState icon={<AlertCircle className="w-7 h-7" />} title={t("error", locale)} subtitle={error} />
      ) : !hotelData || !form ? null : (
        <div className="p-3 space-y-4">
          {/* Identity card */}
          <FormCard title={t("setupHotel", locale)}>
            <Field label={t("fieldNameAr", locale)} value={form.nameAr} onChange={(v) => setField("nameAr", v)} dir="rtl" />
            <Field label={t("fieldNameEn", locale)} value={form.nameEn} onChange={(v) => setField("nameEn", v)} dir="ltr" />
            <Field label={t("fieldPhone", locale)} value={form.phone} onChange={(v) => setField("phone", v)} dir="ltr" />
            <Field label={t("fieldWhatsapp", locale)} value={form.whatsapp} onChange={(v) => setField("whatsapp", v)} dir="ltr" />
            <Field label={t("fieldEmail", locale)} value={form.email} onChange={(v) => setField("email", v)} dir="ltr" />
            <Field label={t("fieldAddressAr", locale)} value={form.addressAr} onChange={(v) => setField("addressAr", v)} dir="rtl" />
            <Field label={t("fieldAddressEn", locale)} value={form.addressEn} onChange={(v) => setField("addressEn", v)} dir="ltr" />
          </FormCard>

          {/* Times + rates card */}
          <FormCard title={locale === "ar" ? "الأوقات والأسعار" : "Times & Rates"}>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("fieldCheckInTime", locale)} value={form.checkInTime} onChange={(v) => setField("checkInTime", v)} dir="ltr" placeholder="14:00" />
              <Field label={t("fieldCheckOutTime", locale)} value={form.checkOutTime} onChange={(v) => setField("checkOutTime", v)} dir="ltr" placeholder="12:00" />
              <Field label={t("fieldTaxPercent", locale)} value={form.taxRatePercent} onChange={(v) => setField("taxRatePercent", v)} dir="ltr" type="number" />
              <Field label={t("fieldServiceCharge", locale)} value={form.serviceChargePercent} onChange={(v) => setField("serviceChargePercent", v)} dir="ltr" type="number" />
            </div>
          </FormCard>

          {/* Stay limits card */}
          <FormCard title={t("setupStayLimits", locale)}>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("fieldMinStayNights", locale)} value={form.minStayNights} onChange={(v) => setField("minStayNights", v)} dir="ltr" type="number" />
              <Field label={t("fieldMaxStayNights", locale)} value={form.maxStayNights} onChange={(v) => setField("maxStayNights", v)} dir="ltr" type="number" />
              <Field label={t("fieldBookingHorizon", locale)} value={form.bookingHorizonDays} onChange={(v) => setField("bookingHorizonDays", v)} dir="ltr" type="number" />
              <Field label={t("fieldMaxAdults", locale)} value={form.maxAdultsPerRoom} onChange={(v) => setField("maxAdultsPerRoom", v)} dir="ltr" type="number" />
            </div>
          </FormCard>

          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-none mt-0.5" />
              <p className="text-sm text-red-700">{formError}</p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-sm disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? t("saving", locale) : t("setupSave", locale)}
          </button>

          {/* Room types (read-only) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
              <Bed className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">{t("setupRoomTypes", locale)}</h3>
            </div>
            <div className="px-3">
              {rtLoading ? (
                <LoadingSpinner label={t("loading", locale)} />
              ) : !roomTypesData || roomTypesData.rooms.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">{locale === "ar" ? "لا توجد أنواع غرف" : "No room types"}</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {roomTypesData.rooms.map((rt) => (
                    <li key={rt.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {locale === "ar" ? rt.nameAr : rt.nameEn}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {rt.totalInventory} {locale === "ar" ? "غرفة" : "rooms"} • {rt.maxAdults} {locale === "ar" ? "بالغين" : "adults"}
                        </p>
                      </div>
                      <div className="text-end flex-none">
                        <p className="text-sm font-bold text-emerald-700"><Money amount={rt.basePrice} locale={locale} /></p>
                        {rt.isActive ? (
                          <span className="text-[10px] font-semibold text-emerald-600">{t("active", locale)}</span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">{t("inactive", locale)}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
        <Building2 className="w-4 h-4 text-slate-500" />
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      </div>
      <div className="p-3 space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, dir, placeholder, type = "text" }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  dir?: "rtl" | "ltr";
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-600 block mb-1">{label}</label>
      <input
        type={type}
        dir={dir}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition"
      />
    </div>
  );
}
