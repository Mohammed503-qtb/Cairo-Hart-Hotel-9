"use client";

// ReceptionApp — main mobile app component for the Reception persona.
// Bottom navigation: Dashboard / Arrivals / In-House / Requests.
// Shares a Sheet stack for Check-In, Guest Detail, Request Detail, Room Status, Chat, Payment.

import * as React from "react";
import { LayoutDashboard, Plane, Users, BellRing, LogOut, X, User } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";
import { ReceptLocale, t } from "./i18n";
import { DashboardTab } from "./tab-dashboard";
import { ArrivalsTab } from "./tab-arrivals";
import { InHouseTab } from "./tab-inhouse";
import { RequestsTab } from "./tab-requests";
import { CheckInSheet, CheckInTarget } from "./checkin-sheet";
import { GuestDetailSheet } from "./guest-detail-sheet";
import { RequestDetailSheet } from "./request-detail-sheet";
import { RoomStatusBoard } from "./room-status-board";
import { ChatSheet } from "./chat-sheet";
import { PaymentSheet } from "./payment-sheet";

type TabKey = "dashboard" | "arrivals" | "inhouse" | "requests";

interface Props {
  onLogout: () => void;
  onClose: () => void;
  standalone?: boolean;
}

export function ReceptionApp({ onLogout, onClose, standalone = false }: Props) {
  const locale = (useUIStore((s) => s.locale) as "ar" | "en") || "ar";
  const isRTL = locale === "ar";
  const session = useAppStore((s) => s.session);
  const [activeTab, setActiveTab] = React.useState<TabKey>("dashboard");

  // Shared sheet state
  const [checkInTarget, setCheckInTarget] = React.useState<CheckInTarget | null>(null);
  const [guestStayId, setGuestStayId] = React.useState<string | null>(null);
  const [requestId, setRequestId] = React.useState<string | null>(null);
  const [roomBoardOpen, setRoomBoardOpen] = React.useState(false);
  const [chatStayId, setChatStayId] = React.useState<string | null>(null);
  const [paymentStayId, setPaymentStayId] = React.useState<string | null>(null);

  // Close all sheets helper
  const closeAllSheets = React.useCallback(() => {
    setCheckInTarget(null);
    setGuestStayId(null);
    setRequestId(null);
    setRoomBoardOpen(false);
    setChatStayId(null);
    setPaymentStayId(null);
  }, []);

  const staffName = session?.staff?.fullName || "—";

  // When a sheet opens, ensure the relevant tab stays rendered behind it.
  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="relative h-full w-full flex flex-col bg-cream/40 overflow-hidden">
      {/* Top bar */}
      <header className="flex-none h-14 px-4 flex items-center justify-between bg-gradient-to-l from-emerald-900 to-emerald-800 text-white shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
            <User className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[11px] leading-tight text-amber-200/90">{t("appTitle", locale)}</p>
            <p className="text-sm font-bold leading-tight">{staffName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onLogout}
            className="p-2 rounded-lg hover:bg-white/10 transition"
            aria-label={t("logout", locale)}
          >
            <LogOut className="w-5 h-5 rtl:rotate-180" />
          </button>
          {!standalone && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition"
              aria-label={t("closeApp", locale)}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Tab content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === "dashboard" && (
          <DashboardTab
            locale={locale}
            onCheckIn={(target) => setCheckInTarget(target)}
            onCheckOut={(stayId) => setGuestStayId(stayId)}
            onViewRequest={(id) => setRequestId(id)}
            onOpenRoomBoard={() => setRoomBoardOpen(true)}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === "arrivals" && (
          <ArrivalsTab locale={locale} onCheckIn={(target) => setCheckInTarget(target)} />
        )}
        {activeTab === "inhouse" && (
          <InHouseTab
            locale={locale}
            onView={(stayId) => setGuestStayId(stayId)}
            onCheckOut={(stayId) => setGuestStayId(stayId)}
            onMessage={(stayId) => setChatStayId(stayId)}
          />
        )}
        {activeTab === "requests" && (
          <RequestsTab locale={locale} onView={(id) => setRequestId(id)} />
        )}
      </main>

      {/* Bottom navigation */}
      <nav className="flex-none h-16 bg-white border-t border-slate-200 shadow-[0_-2px_8px_rgba(0,0,0,0.04)] flex items-stretch">
        <TabButton
          active={activeTab === "dashboard"}
          icon={<LayoutDashboard className="w-5 h-5" />}
          label={t("tabDashboard", locale)}
          onClick={() => setActiveTab("dashboard")}
        />
        <TabButton
          active={activeTab === "arrivals"}
          icon={<Plane className="w-5 h-5" />}
          label={t("tabArrivals", locale)}
          onClick={() => setActiveTab("arrivals")}
        />
        <TabButton
          active={activeTab === "inhouse"}
          icon={<Users className="w-5 h-5" />}
          label={t("tabInhouse", locale)}
          onClick={() => setActiveTab("inhouse")}
        />
        <TabButton
          active={activeTab === "requests"}
          icon={<BellRing className="w-5 h-5" />}
          label={t("tabRequests", locale)}
          onClick={() => setActiveTab("requests")}
        />
      </nav>

      {/* Sheets */}
      <CheckInSheet
        target={checkInTarget}
        onClose={() => setCheckInTarget(null)}
        locale={locale}
        onSuccess={() => {
          // After successful check-in, switch to in-house tab on next user action.
          setCheckInTarget(null);
          setActiveTab("inhouse");
        }}
      />
      <GuestDetailSheet
        stayId={guestStayId}
        onClose={() => setGuestStayId(null)}
        locale={locale}
        onMessage={(stayId) => { setGuestStayId(null); setChatStayId(stayId); }}
        onPayment={(stayId) => { setGuestStayId(null); setPaymentStayId(stayId); }}
        onCheckoutDone={() => setGuestStayId(null)}
      />
      <RequestDetailSheet
        requestId={requestId}
        onClose={() => setRequestId(null)}
        locale={locale}
      />
      <RoomStatusBoard
        open={roomBoardOpen}
        onClose={() => setRoomBoardOpen(false)}
        locale={locale}
      />
      <ChatSheet
        stayId={chatStayId}
        onClose={() => setChatStayId(null)}
        locale={locale}
      />
      <PaymentSheet
        stayId={paymentStayId}
        onClose={() => setPaymentStayId(null)}
        locale={locale}
        onDone={() => setPaymentStayId(null)}
      />
    </div>
  );
}

function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors",
        active ? "text-amber-600" : "text-slate-400 hover:text-slate-600"
      )}
    >
      <span className={cn("transition-transform", active && "scale-110")}>{icon}</span>
      <span className={cn("text-[10px] font-medium", active && "font-bold")}>{label}</span>
    </button>
  );
}

export type { ReceptLocale };
