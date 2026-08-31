"use client";

// Guests tab — three sub-tabs: Reservations / Guests / Staff.
// - Reservations: filterable list with status badges + payment status.
// - Guests: phone, email, reservation count, stay count.
// - Staff: role badge, active code count, [Add Staff] button.

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, User, ClipboardList, Phone, Mail, ShieldCheck, AlertCircle } from "lucide-react";
import { useFetch } from "./use-fetch";
import { AdminLocale, t } from "./i18n";
import { StatusBadge, Money, DateStr, LoadingSpinner, EmptyState } from "@/components/app/shared";
import { StaffSheet, type StaffListData } from "./staff-sheet";

interface ReservationsData {
  ok: boolean;
  reservations: Array<{
    id: string;
    bookingReference: string;
    status: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    grandTotal: number;
    paidTotal: number;
    paymentStatus: string;
    createdAt: string;
    guestName: string;
    guestPhone: string;
    guestEmail: string | null;
    roomTypeName: string | null;
    roomTypeNameEn: string | null;
  }>;
}

interface GuestsData {
  ok: boolean;
  guests: Array<{
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    createdAt: string;
    reservationCount: number;
    stayCount: number;
  }>;
}

interface Props {
  locale: AdminLocale;
}

export function GuestsTab({ locale }: Props) {
  const isRTL = locale === "ar";
  const [subTab, setSubTab] = React.useState<"reservations" | "guests" | "staff">("reservations");

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-4 py-3 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-2">{t("tabGuests", locale)}</h2>
        <Tabs value={subTab} onValueChange={(v) => setSubTab(v as "reservations" | "guests" | "staff")}>
          <TabsList className="w-full h-10 bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="reservations" className="flex-1 h-8 text-xs font-semibold">
              <ClipboardList className="w-3.5 h-3.5" /> {t("subReservations", locale)}
            </TabsTrigger>
            <TabsTrigger value="guests" className="flex-1 h-8 text-xs font-semibold">
              <Users className="w-3.5 h-3.5" /> {t("subGuests", locale)}
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex-1 h-8 text-xs font-semibold">
              <User className="w-3.5 h-3.5" /> {t("subStaff", locale)}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-y-auto">
        {subTab === "reservations" && <ReservationsPane locale={locale} />}
        {subTab === "guests" && <GuestsPane locale={locale} />}
        {subTab === "staff" && <StaffPane locale={locale} />}
      </div>
    </div>
  );
}

// ── Reservations pane ──────────────────────────────────────────────────
function ReservationsPane({ locale }: { locale: AdminLocale }) {
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const url = `/api/app/admin/reservations${statusFilter !== "ALL" ? `?status=${statusFilter}` : ""}`;
  const { data, loading, error, refresh } = useFetch<ReservationsData>(url, { intervalMs: 60_000 });

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-full text-sm">
            <SelectValue placeholder={t("filterStatus", locale)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("allStatuses", locale)}</SelectItem>
            <SelectItem value="CONFIRMED">CONFIRMED</SelectItem>
            <SelectItem value="PENDING">PENDING</SelectItem>
            <SelectItem value="PAYMENT_PENDING">PAYMENT_PENDING</SelectItem>
            <SelectItem value="CHECKED_IN">CHECKED_IN</SelectItem>
            <SelectItem value="CHECKED_OUT">CHECKED_OUT</SelectItem>
            <SelectItem value="CANCELLED">CANCELLED</SelectItem>
            <SelectItem value="NO_SHOW">NO_SHOW</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && !data ? (
        <LoadingSpinner label={t("loading", locale)} />
      ) : error ? (
        <EmptyState icon={<AlertCircle className="w-7 h-7" />} title={t("error", locale)} subtitle={error} action={
          <button onClick={refresh} className="text-amber-700 font-semibold text-sm">{t("retry", locale)}</button>
        } />
      ) : !data || data.reservations.length === 0 ? (
        <EmptyState icon={<ClipboardList className="w-7 h-7" />} title={t("noReservations", locale)} />
      ) : (
        <ul className="space-y-2">
          {data.reservations.map((r) => (
            <li key={r.id} className="bg-white rounded-xl border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{r.guestName}</p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {r.bookingReference} • {locale === "ar" ? r.roomTypeName || "—" : r.roomTypeNameEn || "—"}
                  </p>
                </div>
                <p className="text-sm font-bold text-emerald-700 flex-none"><Money amount={r.grandTotal} locale={locale} /></p>
              </div>
              <div className="flex items-center justify-between gap-2 mt-2">
                <div className="flex items-center gap-1.5">
                  <StatusBadge status={r.status} />
                  <StatusBadge status={r.paymentStatus} />
                </div>
                <p className="text-[10px] text-slate-400"><DateStr value={r.createdAt} locale={locale} /></p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Guests pane ───────────────────────────────────────────────────────
function GuestsPane({ locale }: { locale: AdminLocale }) {
  const { data, loading, error, refresh } = useFetch<GuestsData>("/api/app/admin/guests", { intervalMs: 60_000 });
  const isRTL = locale === "ar";
  return (
    <div className="p-3 space-y-3">
      {loading && !data ? (
        <LoadingSpinner label={t("loading", locale)} />
      ) : error ? (
        <EmptyState icon={<AlertCircle className="w-7 h-7" />} title={t("error", locale)} subtitle={error} action={
          <button onClick={refresh} className="text-amber-700 font-semibold text-sm">{t("retry", locale)}</button>
        } />
      ) : !data || data.guests.length === 0 ? (
        <EmptyState icon={<Users className="w-7 h-7" />} title={t("noGuests", locale)} />
      ) : (
        <ul className="space-y-2">
          {data.guests.map((g) => (
            <li key={g.id} className="bg-white rounded-xl border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{g.fullName}</p>
                  <p className="text-[11px] text-slate-500 truncate flex items-center gap-1" dir="ltr">
                    <Phone className="w-3 h-3" /> {g.phone}
                  </p>
                  {g.email && (
                    <p className="text-[11px] text-slate-500 truncate flex items-center gap-1" dir="ltr">
                      <Mail className="w-3 h-3" /> {g.email}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-none">
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                    {g.reservationCount} {locale === "ar" ? "حجز" : "res"}
                  </span>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    {g.stayCount} {locale === "ar" ? "إقامة" : "stays"}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Staff pane ────────────────────────────────────────────────────────
function StaffPane({ locale }: { locale: AdminLocale }) {
  const { data, loading, error, refresh } = useFetch<StaffListData>("/api/app/admin/staff", { intervalMs: 60_000 });
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editStaffId, setEditStaffId] = React.useState<string | null>(null);

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {data ? `${data.staff.length} ${locale === "ar" ? "موظف" : "staff"}` : ""}
        </p>
        <button
          onClick={() => { setEditStaffId(null); setSheetOpen(true); }}
          className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {t("addStaff", locale)}
        </button>
      </div>

      {loading && !data ? (
        <LoadingSpinner label={t("loading", locale)} />
      ) : error ? (
        <EmptyState icon={<AlertCircle className="w-7 h-7" />} title={t("error", locale)} subtitle={error} action={
          <button onClick={refresh} className="text-amber-700 font-semibold text-sm">{t("retry", locale)}</button>
        } />
      ) : !data || data.staff.length === 0 ? (
        <EmptyState icon={<User className="w-7 h-7" />} title={t("noStaff", locale)} />
      ) : (
        <ul className="space-y-2">
          {data.staff.map((s) => {
            const roleLabel = s.role === "MASTER_ADMIN" ? t("roleMaster", locale) : s.role === "ADMIN" ? t("roleAdmin", locale) : t("roleReception", locale);
            const roleCls = s.role === "MASTER_ADMIN" ? "bg-rose-100 text-rose-700"
              : s.role === "ADMIN" ? "bg-amber-100 text-amber-700"
              : "bg-emerald-100 text-emerald-700";
            return (
              <li
                key={s.id}
                onClick={() => { setEditStaffId(s.id); setSheetOpen(true); }}
                className="bg-white rounded-xl border border-slate-200 p-3 active:bg-slate-50 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 flex items-start gap-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-xs flex-none">
                      {s.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                        {s.fullName}
                        {!s.isActive && <span className="text-[10px] text-slate-400 font-normal">({t("inactive", locale)})</span>}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate" dir="ltr">{s.phone}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-none">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${roleCls}`}>
                      <ShieldCheck className="w-2.5 h-2.5" />
                      {roleLabel}
                    </span>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                      {s.activeCodeCount} {locale === "ar" ? "رمز" : "codes"}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <StaffSheet
        staffId={editStaffId}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        locale={locale}
        onSaved={() => refresh()}
      />
    </div>
  );
}
