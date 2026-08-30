"use client";

// CodeSheet — bottom sheet for generating access codes.
// Code type radio (GUEST/RECEPTION/ADMIN), conditional dropdowns:
//   - GUEST: in-house stays
//   - RECEPTION: active reception staff
//   - ADMIN: active admin/master staff
// Validity hours input. Generate → POST /api/app/admin/codes.
// On success: shows raw code prominently with Copy + WhatsApp share.

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle, KeyRound, Copy, MessageCircle, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { AdminLocale, t } from "./i18n";
import { apiPost, useFetch } from "./use-fetch";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  locale: AdminLocale;
  initialType?: "GUEST" | "RECEPTION" | "ADMIN";
}

type CodeType = "GUEST" | "RECEPTION" | "ADMIN";

interface StaysData {
  ok: boolean;
  stays: Array<{
    id: string;
    stayNumber: string;
    guestName: string;
    guestPhone: string;
    roomNumber: string;
    checkOut: string;
  }>;
}

interface StaffListData {
  ok: boolean;
  staff: Array<{
    id: string;
    fullName: string;
    phone: string;
    role: string;
    isActive: boolean;
  }>;
}

interface GenerateResult {
  ok: boolean;
  rawCode?: string;
  codeId?: string;
  codeType?: string;
  validUntil?: string;
  targetType?: string;
  targetName?: string;
}

export function CodeSheet({ open, onClose, locale, initialType = "GUEST" }: Props) {
  const isRTL = locale === "ar";
  const [codeType, setCodeType] = React.useState<CodeType>(initialType);
  const [stayId, setStayId] = React.useState("");
  const [staffId, setStaffId] = React.useState("");
  const [validHours, setValidHours] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<GenerateResult | null>(null);

  // Fetch in-house stays (for GUEST)
  const { data: staysData } = useFetch<StaysData>("/api/app/admin/stays?status=CHECKED_IN", { enabled: open });
  // Fetch staff (for RECEPTION/ADMIN)
  const { data: staffData } = useFetch<StaffListData>("/api/app/admin/staff", { enabled: open });

  const receptionStaff = staffData?.staff.filter((s) => s.role === "RECEPTION" && s.isActive) || [];
  const adminStaff = staffData?.staff.filter((s) => (s.role === "ADMIN" || s.role === "MASTER_ADMIN") && s.isActive) || [];

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setCodeType(initialType);
      setStayId("");
      setStaffId("");
      setValidHours("");
      setError(null);
      setResult(null);
    }
  }, [open, initialType]);

  // Clear selection when switching code type
  React.useEffect(() => {
    setStayId("");
    setStaffId("");
  }, [codeType]);

  function canSubmit() {
    if (codeType === "GUEST") return !!stayId;
    if (codeType === "RECEPTION" || codeType === "ADMIN") return !!staffId;
    return false;
  }

  async function handleGenerate() {
    if (!canSubmit()) return;
    setSubmitting(true);
    setError(null);
    const body: Record<string, unknown> = { codeType };
    if (codeType === "GUEST") body.stayId = stayId;
    else body.staffId = staffId;
    if (validHours.trim()) {
      const n = Number(validHours);
      if (Number.isFinite(n) && n > 0) body.validHours = n;
    }
    const res = await apiPost("/api/app/admin/codes", body);
    setSubmitting(false);
    if (res.ok) {
      setResult(res.data as GenerateResult);
      toast.success(t("toastCodeOk", locale));
    } else {
      const errMap: Record<string, string> = {
        stayNotFound: locale === "ar" ? "الإقامة غير موجودة" : "Stay not found",
        stayNotCheckedIn: locale === "ar" ? "الإقامة ليست نشطة" : "Stay is not checked in",
        staffNotFound: locale === "ar" ? "الموظف غير موجود" : "Staff not found",
        staffNotReception: locale === "ar" ? "الموظف ليس استقبال" : "Staff is not reception",
        staffNotAdmin: locale === "ar" ? "الموظف ليس إدارة" : "Staff is not admin",
        staffInactive: locale === "ar" ? "الموظف غير نشط" : "Staff is inactive",
        invalidCodeType: locale === "ar" ? "نوع رمز غير صالح" : "Invalid code type",
      };
      setError(errMap[res.error || ""] || t("errGeneric", locale));
    }
  }

  function copyCode() {
    if (!result?.rawCode) return;
    navigator.clipboard?.writeText(result.rawCode).then(() => toast.success(t("copied", locale))).catch(() => {});
  }

  function shareWhatsApp() {
    if (!result?.rawCode) return;
    let phone = "";
    let name = result.targetName || "";
    // Try to resolve phone from selected stay/staff
    if (codeType === "GUEST" && staysData) {
      const s = staysData.stays.find((x) => x.id === stayId);
      if (s) phone = s.guestPhone.replace(/[^0-9]/g, "");
    } else if (staffData) {
      const s = staffData.staff.find((x) => x.id === staffId);
      if (s) phone = s.phone.replace(/[^0-9]/g, "");
    }
    const body = locale === "ar"
      ? `مرحباً ${name}! رمز دخولك إلى تطبيق الفندق هو: ${result.rawCode}`
      : `Hello ${name}! Your hotel app access code is: ${result.rawCode}`;
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(body)}`
      : `https://wa.me/?text=${encodeURIComponent(body)}`;
    window.open(url, "_blank");
  }

  const arrowIcon = isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="bottom"
        className="h-[88dvh] p-0 rounded-t-3xl bg-white flex flex-col"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-100 flex-row items-center justify-between space-y-0">
          <div>
            <SheetTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-600" />
              {t("codeSheetTitle", locale)}
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-500">
              {result ? t("codeSuccessHint", locale) : (locale === "ar" ? "اختر النوع والهدف" : "Choose type and target")}
            </SheetDescription>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {result ? (
            // Success view
            <div className="space-y-5 flex flex-col items-center text-center pt-4">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{t("codeSuccessTitle", locale)}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {result.targetType} • {result.targetName}
                </p>
              </div>
              <div className="w-full bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-dashed border-amber-300 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-amber-700 mb-2">
                  <KeyRound className="w-4 h-4" />
                  <p className="text-xs font-bold uppercase tracking-wide">{t("codeRawCode", locale)}</p>
                </div>
                <p className="text-3xl font-mono font-bold text-emerald-900 tracking-wider" dir="ltr">{result.rawCode}</p>
                {result.validUntil && (
                  <p className="text-[11px] text-amber-700 mt-2">
                    {t("codeValidUntil", locale)}: {new Date(result.validUntil).toLocaleString(isRTL ? "ar-EG" : "en-US")}
                  </p>
                )}
                <p className="text-[11px] text-amber-700 mt-1">{t("codeSuccessHint", locale)}</p>
              </div>
              <div className="w-full space-y-2">
                <Button onClick={copyCode} variant="outline" className="w-full h-12 text-base font-bold">
                  <Copy className="w-4 h-4" /> {t("copy", locale)}
                </Button>
                <Button onClick={shareWhatsApp} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base">
                  <MessageCircle className="w-4 h-4" /> {t("sendWhatsapp", locale)}
                </Button>
              </div>
              <Button onClick={onClose} className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold text-base">
                {t("done", locale)}
              </Button>
            </div>
          ) : (
            // Form view
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-none mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Code type radio */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">{t("codeType", locale)}</label>
                <div className="grid grid-cols-3 gap-2">
                  <TypeOption
                    label={t("codeGuest", locale)}
                    desc={t("codeGuestDesc", locale)}
                    active={codeType === "GUEST"}
                    accent="emerald"
                    onClick={() => setCodeType("GUEST")}
                  />
                  <TypeOption
                    label={t("codeReception", locale)}
                    desc={t("codeReceptionDesc", locale)}
                    active={codeType === "RECEPTION"}
                    accent="amber"
                    onClick={() => setCodeType("RECEPTION")}
                  />
                  <TypeOption
                    label={t("codeAdmin", locale)}
                    desc={t("codeAdminDesc", locale)}
                    active={codeType === "ADMIN"}
                    accent="rose"
                    onClick={() => setCodeType("ADMIN")}
                  />
                </div>
              </div>

              {/* Stay dropdown (GUEST) */}
              {codeType === "GUEST" && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">{t("codeStay", locale)}</label>
                  {staysData && staysData.stays.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                      {t("noInHouseStays", locale)}
                    </div>
                  ) : (
                    <Select value={stayId} onValueChange={setStayId}>
                      <SelectTrigger className="h-12 text-base w-full"><SelectValue placeholder={t("selectStay", locale)} /></SelectTrigger>
                      <SelectContent>
                        {(staysData?.stays || []).map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            <span className="font-bold">{s.stayNumber}</span>
                            <span className="text-slate-500 mx-1">• {s.guestName}</span>
                            <span className="text-slate-400 text-xs">• {t("codeGuest", locale)} {s.roomNumber}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* Staff dropdown (RECEPTION) */}
              {codeType === "RECEPTION" && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">{t("codeStaff", locale)}</label>
                  {receptionStaff.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                      {t("noReceptionStaff", locale)}
                    </div>
                  ) : (
                    <Select value={staffId} onValueChange={setStaffId}>
                      <SelectTrigger className="h-12 text-base w-full"><SelectValue placeholder={t("selectStaff", locale)} /></SelectTrigger>
                      <SelectContent>
                        {receptionStaff.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            <span className="font-bold">{s.fullName}</span>
                            <span className="text-slate-400 mx-1 text-xs" dir="ltr">{s.phone}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* Staff dropdown (ADMIN) */}
              {codeType === "ADMIN" && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">{t("codeStaff", locale)}</label>
                  {adminStaff.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                      {t("noAdminStaff", locale)}
                    </div>
                  ) : (
                    <Select value={staffId} onValueChange={setStaffId}>
                      <SelectTrigger className="h-12 text-base w-full"><SelectValue placeholder={t("selectStaff", locale)} /></SelectTrigger>
                      <SelectContent>
                        {adminStaff.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            <span className="font-bold">{s.fullName}</span>
                            <span className="text-slate-400 mx-1 text-xs" dir="ltr">{s.phone}</span>
                            <span className="text-[10px] text-amber-600 font-semibold">• {s.role}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* Validity hours */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">{t("codeValidHours", locale)}</label>
                <input
                  type="number"
                  value={validHours}
                  onChange={(e) => setValidHours(e.target.value)}
                  placeholder={locale === "ar" ? "افتراضي" : "Default"}
                  min={1}
                  max={720}
                  dir="ltr"
                  className="w-full h-12 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <p className="text-[10px] text-slate-400 mt-1">{t("codeValidHoursHint", locale)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer (only on form view) */}
        {!result && (
          <div className="border-t border-slate-100 p-3">
            <Button
              onClick={handleGenerate}
              disabled={!canSubmit() || submitting}
              className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold text-base"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (<>
                <KeyRound className="w-4 h-4" />
                {t("codeGenerate", locale)}
                {arrowIcon}
              </>)}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

const ACCENT_BORDER: Record<string, string> = {
  emerald: "border-emerald-500 bg-emerald-50 text-emerald-700",
  amber: "border-amber-500 bg-amber-50 text-amber-700",
  rose: "border-rose-500 bg-rose-50 text-rose-700",
};
const ACCENT_INACTIVE: Record<string, string> = {
  emerald: "border-slate-200 bg-white text-slate-500",
  amber: "border-slate-200 bg-white text-slate-500",
  rose: "border-slate-200 bg-white text-slate-500",
};

function TypeOption({ label, desc, active, accent, onClick }: {
  label: string;
  desc: string;
  active: boolean;
  accent: string;
  onClick: () => void;
}) {
  const cls = active ? ACCENT_BORDER[accent] : ACCENT_INACTIVE[accent];
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border-2 p-3 text-center transition ${cls}`}
    >
      <p className="text-sm font-bold">{label}</p>
      <p className="text-[10px] mt-0.5 leading-tight">{desc}</p>
    </button>
  );
}
