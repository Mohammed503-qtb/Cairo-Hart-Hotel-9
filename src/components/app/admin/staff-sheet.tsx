"use client";

// StaffSheet — bottom sheet for creating a new staff member OR viewing/editing existing staff.
// Props: { staffId: string | null (null = create mode), open, onClose, locale, onSaved }

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle, UserPlus, User, Phone, Mail, ShieldCheck } from "lucide-react";
import { AdminLocale, t } from "./i18n";
import { apiPost, useFetch } from "./use-fetch";
import { toast } from "sonner";

interface Props {
  staffId: string | null;
  open: boolean;
  onClose: () => void;
  locale: AdminLocale;
  onSaved: () => void;
}

interface StaffListData {
  ok: boolean;
  staff: Array<{
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    role: string;
    isActive: boolean;
    createdAt: string;
    activeCodeCount: number;
    activeSessionCount: number;
    lastSession: { id: string; lastSeenAt: string; expiresAt: string; persona: string } | null;
  }>;
}

interface StaffDetailData {
  ok: boolean;
  staff: {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    role: string;
    isActive: boolean;
    createdAt: string;
  };
  recentCodes: Array<{
    id: string;
    codeType: string;
    status: string;
    validFrom: string;
    validUntil: string;
    createdAt: string;
    stay: { id: string; stayNumber: string; guestName: string | null } | null;
  }>;
  recentSessions: Array<{
    id: string;
    persona: string;
    expiresAt: string;
    revokedAt: string | null;
    lastSeenAt: string;
    createdAt: string;
  }>;
}

export function StaffSheet({ staffId, open, onClose, locale, onSaved }: Props) {
  const isRTL = locale === "ar";
  const isEdit = !!staffId;

  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<"RECEPTION" | "ADMIN">("RECEPTION");
  const [isActive, setIsActive] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { data: detail, loading: detailLoading } = useFetch<StaffDetailData>(staffId ? `/api/app/admin/staff/${staffId}` : null, { enabled: open && !!staffId });

  // Hydrate edit form
  React.useEffect(() => {
    if (isEdit && detail?.staff) {
      setFullName(detail.staff.fullName);
      setPhone(detail.staff.phone);
      setEmail(detail.staff.email || "");
      setRole(detail.staff.role === "ADMIN" || detail.staff.role === "MASTER_ADMIN" ? "ADMIN" : "RECEPTION");
      setIsActive(detail.staff.isActive);
    }
  }, [isEdit, detail]);

  // Reset on open
  React.useEffect(() => {
    if (open && !isEdit) {
      setFullName("");
      setPhone("");
      setEmail("");
      setRole("RECEPTION");
      setIsActive(true);
      setError(null);
    }
    if (open) setError(null);
  }, [open, isEdit]);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    let res;
    if (isEdit && staffId) {
      res = await apiPost(`/api/app/admin/staff/${staffId}`, { isActive, role });
    } else {
      res = await apiPost("/api/app/admin/staff", { fullName, phone, email: email.trim() || undefined, role });
    }
    setSubmitting(false);
    if (res.ok) {
      toast.success(isEdit ? t("toastStaffUpdateOk", locale) : t("toastStaffCreateOk", locale));
      onSaved();
      onClose();
    } else {
      const errMap: Record<string, string> = {
        phoneInUse: t("errPhoneInUse", locale),
        onlyMasterCanCreateAdmin: locale === "ar" ? "المالك فقط يمكنه إنشاء حساب إدارة" : "Only master can create admin staff",
        invalidRole: locale === "ar" ? "دور غير صالح" : "Invalid role",
        fullNameRequired: locale === "ar" ? "الاسم مطلوب" : "Full name required",
        phoneRequired: locale === "ar" ? "الهاتف مطلوب" : "Phone required",
      };
      setError(errMap[res.error || ""] || t("errGeneric", locale));
    }
  }

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
              {isEdit ? <User className="w-4 h-4 text-amber-600" /> : <UserPlus className="w-4 h-4 text-amber-600" />}
              {isEdit ? t("staffEditTitle", locale) : t("staffCreateTitle", locale)}
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-500">
              {isEdit && detail?.staff ? detail.staff.fullName : locale === "ar" ? "أدخل بيانات الموظف الجديد" : "Enter new staff details"}
            </SheetDescription>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {isEdit && detailLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-none mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : null}

          {/* Create form fields */}
          {!isEdit && (
            <>
              <FieldRow label={t("staffFullName", locale)} icon={<User className="w-4 h-4" />}>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={locale === "ar" ? "الاسم الكامل" : "Full name"}
                  className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </FieldRow>

              <FieldRow label={t("staffPhone", locale)} icon={<Phone className="w-4 h-4" />}>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+967 7XX XXX XXX"
                  dir="ltr"
                  className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </FieldRow>

              <FieldRow label={t("staffEmail", locale)} icon={<Mail className="w-4 h-4" />}>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  dir="ltr"
                  className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </FieldRow>

              <FieldRow label={t("staffRole", locale)} icon={<ShieldCheck className="w-4 h-4" />}>
                <Select value={role} onValueChange={(v) => setRole(v as "RECEPTION" | "ADMIN")}>
                  <SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECEPTION">{t("roleReception", locale)}</SelectItem>
                    <SelectItem value="ADMIN">{t("roleAdmin", locale)}</SelectItem>
                  </SelectContent>
                </Select>
              </FieldRow>
            </>
          )}

          {/* Edit form — role + active toggle */}
          {isEdit && detail?.staff && (
            <>
              <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                <Row label={t("staffFullName", locale)} value={detail.staff.fullName} />
                <Row label={t("staffPhone", locale)} value={detail.staff.phone} />
                {detail.staff.email && <Row label={t("staffEmail", locale)} value={detail.staff.email} />}
                <Row label={t("staffRole", locale)} value={
                  detail.staff.role === "MASTER_ADMIN" ? t("roleMaster", locale)
                  : detail.staff.role === "ADMIN" ? t("roleAdmin", locale)
                  : t("roleReception", locale)
                } />
                <Row label={t("active", locale)} value={detail.staff.isActive ? "✓" : "—"} />
              </div>

              {/* Active codes + sessions */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{detail.staff ? "—" : 0}</p>
                  <p className="text-[10px] text-emerald-700 font-semibold">{t("staffActiveCodes", locale)}</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-amber-700">{detail.staff ? "—" : 0}</p>
                  <p className="text-[10px] text-amber-700 font-semibold">{t("staffActiveSessions", locale)}</p>
                </div>
              </div>

              <FieldRow label={t("staffRole", locale)} icon={<ShieldCheck className="w-4 h-4" />}>
                <Select value={role} onValueChange={(v) => setRole(v as "RECEPTION" | "ADMIN")}>
                  <SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECEPTION">{t("roleReception", locale)}</SelectItem>
                    <SelectItem value="ADMIN">{t("roleAdmin", locale)}</SelectItem>
                  </SelectContent>
                </Select>
              </FieldRow>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t("active", locale)}</p>
                  <p className="text-[11px] text-slate-500">
                    {isActive ? t("active", locale) : t("inactive", locale)}
                  </p>
                </div>
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition ${
                    isActive ? "bg-rose-100 text-rose-700 hover:bg-rose-200" : "bg-emerald-500 text-white hover:bg-emerald-600"
                  }`}
                >
                  {isActive ? t("deactivate", locale) : t("activate", locale)}
                </button>
              </div>

              {/* Recent codes / sessions (read-only) */}
              {detail.recentCodes.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-600 mb-1">{t("staffRecentCodes", locale)}</h4>
                  <ul className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl">
                    {detail.recentCodes.map((c) => (
                      <li key={c.id} className="px-3 py-2 flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800">
                            {c.codeType} {c.stay?.stayNumber ? `· ${c.stay.stayNumber}` : ""}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {new Date(c.createdAt).toLocaleDateString(isRTL ? "ar-EG" : "en-US")}
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}>{c.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-3">
          <Button
            onClick={handleSubmit}
            disabled={submitting || (!isEdit && (!fullName.trim() || !phone.trim()))}
            className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold text-base"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : isEdit ? t("save", locale) : t("staffCreateTitle", locale)}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FieldRow({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-800 text-end">{value}</span>
    </div>
  );
}

// Re-export the staff list type for the guests tab
export type { StaffListData };
