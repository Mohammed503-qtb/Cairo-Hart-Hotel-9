"use client";

// GuestApp — main mobile app component for the Guest persona.
// Bottom navigation: Home / Stay / Services / Bill.
// FAB above the bottom nav opens Reception Chat (full-screen Sheet).
// "My Requests" + Notifications are sheets triggered from the Home tab header.

import * as React from "react";
import { Home, BedDouble, ConciergeBell, Receipt, MessageCircle, LogOut, X, User } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";
import { GuestLocale, t } from "./i18n";
import { HomeTab } from "./tab-home";
import { StayTab } from "./tab-stay";
import { ServicesTab } from "./tab-services";
import { BillTab } from "./tab-bill";
import { RequestCreateSheet, CreateRequestTarget } from "./request-create-sheet";
import { RequestDetailSheet } from "./request-detail-sheet";
import { RequestsSheet } from "./requests-sheet";
import { ChatSheet } from "./chat-sheet";
import { NotificationsSheet } from "./notifications-sheet";
import { ExtensionSheet } from "./extension-sheet";
import { CheckoutSheet } from "./checkout-sheet";

type TabKey = "home" | "stay" | "services" | "bill";

interface Props {
  onLogout: () => void;
  onClose: () => void;
}

export function GuestApp({ onLogout, onClose }: Props) {
  const locale = (useUIStore((s) => s.locale) as "ar" | "en") || "ar";
  const isRTL = locale === "ar";
  const session = useAppStore((s) => s.session);

  const [activeTab, setActiveTab] = React.useState<TabKey>("home");
  // Shared sheet state
  const [createTarget, setCreateTarget] = React.useState<CreateRequestTarget | null>(null);
  const [requestId, setRequestId] = React.useState<string | null>(null);
  const [requestsOpen, setRequestsOpen] = React.useState(false);
  const [chatOpen, setChatOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [extensionOpen, setExtensionOpen] = React.useState(false);
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);

  // External refresh key for Home tab (e.g. after creating a request)
  const [homeRefreshKey, setHomeRefreshKey] = React.useState(0);

  // Stay info cached from session for the Extension sheet
  const sessionStay = session?.stay;

  function handleNavigateToServices() {
    setActiveTab("services");
  }

  function handleCreated(requestId: string) {
    setCreateTarget(null);
    setRequestId(requestId);
    setHomeRefreshKey((k) => k + 1);
  }

  function handleOpenChatFromAnywhere() {
    setChatOpen(true);
  }

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
            <p className="text-sm font-bold leading-tight">{sessionStay?.guestName || "—"}</p>
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
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition"
            aria-label={t("closeApp", locale)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Tab content */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === "home" && (
          <HomeTab
            locale={locale}
            onOpenRequests={() => setRequestsOpen(true)}
            onOpenNotifications={() => setNotificationsOpen(true)}
            onOpenServices={handleNavigateToServices}
            onOpenChat={handleOpenChatFromAnywhere}
            onOpenExtension={() => setExtensionOpen(true)}
            onOpenCheckout={() => setCheckoutOpen(true)}
            refreshKey={homeRefreshKey}
          />
        )}
        {activeTab === "stay" && <StayTab locale={locale} onOpenChat={handleOpenChatFromAnywhere} />}
        {activeTab === "services" && <ServicesTab locale={locale} onCreate={(target) => setCreateTarget(target)} />}
        {activeTab === "bill" && <BillTab locale={locale} />}
      </main>

      {/* Floating Action Button (chat) — above the bottom nav */}
      <button
        onClick={() => setChatOpen(true)}
        className="absolute bottom-20 end-3 z-30 w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 shadow-xl shadow-amber-500/30 flex items-center justify-center text-white transition active:scale-95"
        aria-label={t("chatWithReception", locale)}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Bottom navigation */}
      <nav className="flex-none h-16 bg-white border-t border-slate-200 shadow-[0_-2px_8px_rgba(0,0,0,0.04)] flex items-stretch">
        <TabButton
          active={activeTab === "home"}
          icon={<Home className="w-5 h-5" />}
          label={t("tabHome", locale)}
          onClick={() => setActiveTab("home")}
        />
        <TabButton
          active={activeTab === "stay"}
          icon={<BedDouble className="w-5 h-5" />}
          label={t("tabStay", locale)}
          onClick={() => setActiveTab("stay")}
        />
        <TabButton
          active={activeTab === "services"}
          icon={<ConciergeBell className="w-5 h-5" />}
          label={t("tabServices", locale)}
          onClick={() => setActiveTab("services")}
        />
        <TabButton
          active={activeTab === "bill"}
          icon={<Receipt className="w-5 h-5" />}
          label={t("tabBill", locale)}
          onClick={() => setActiveTab("bill")}
        />
      </nav>

      {/* Sheets */}
      <RequestCreateSheet
        target={createTarget}
        onClose={() => setCreateTarget(null)}
        locale={locale}
        onCreated={handleCreated}
      />
      <RequestDetailSheet
        requestId={requestId}
        onClose={() => setRequestId(null)}
        locale={locale}
      />
      <RequestsSheet
        open={requestsOpen}
        onClose={() => setRequestsOpen(false)}
        locale={locale}
        onView={(id) => { setRequestsOpen(false); setRequestId(id); }}
      />
      <ChatSheet
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        locale={locale}
      />
      <NotificationsSheet
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        locale={locale}
      />
      <ExtensionSheet
        open={extensionOpen}
        onClose={() => setExtensionOpen(false)}
        locale={locale}
        currentCheckOut={sessionStay?.checkOut || new Date().toISOString()}
        basePrice={0}
        onSubmitted={() => setHomeRefreshKey((k) => k + 1)}
      />
      <CheckoutSheet
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        locale={locale}
        onSubmitted={() => setHomeRefreshKey((k) => k + 1)}
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

export type { GuestLocale };
