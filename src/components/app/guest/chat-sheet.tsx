"use client";

// ChatSheet — full-screen Sheet for reception chat. Polls every 5s while open.
// On open, fetches the conversation (which marks RECEPTION messages as read).

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, Send, MessageCircle } from "lucide-react";
import { GuestLocale, t } from "./i18n";
import { useFetch, apiPost } from "./use-fetch";
import { LoadingSpinner, DateStr } from "@/components/app/shared";
import { toast } from "sonner";

interface ConversationData {
  ok: boolean;
  conversation: {
    id: string;
    stayId: string;
    guestId: string;
    status: string;
    guestName: string;
    roomNumber: string;
    messages: Array<{
      id: string;
      senderRole: string;
      senderId: string;
      senderName: string;
      body: string;
      readAt: string | null;
      createdAt: string;
    }>;
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  locale: GuestLocale;
}

export function ChatSheet({ open, onClose, locale }: Props) {
  const isRTL = locale === "ar";
  const { data, loading, error, refresh } = useFetch<ConversationData>(open ? "/api/app/guest/conversation" : "", {
    enabled: open,
    intervalMs: 5_000,
  });
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (data?.conversation?.messages?.length && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data?.conversation?.messages?.length, data?.conversation?.messages?.[data.conversation.messages.length - 1]?.id]);

  async function handleSend() {
    if (!draft.trim()) return;
    setSending(true);
    const res = await apiPost("/api/app/guest/conversation", { body: draft.trim() });
    setSending(false);
    if (res.ok) {
      setDraft("");
      toast.success(t("toastChatSent", locale));
      refresh();
    } else {
      toast.error(t("errGeneric", locale));
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="bottom"
        className="h-[92dvh] p-0 rounded-t-3xl bg-white flex flex-col"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-100 space-y-0">
          <SheetTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-600" />
            {t("chatWithReception", locale)}
          </SheetTitle>
          <SheetDescription className="text-xs text-slate-500">
            {data?.conversation
              ? `${t("roomNumber", locale)} ${data.conversation.roomNumber} • ${t("chatHint", locale)}`
              : t("chatHint", locale)}
          </SheetDescription>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-slate-50">
          {loading && !data ? (
            <LoadingSpinner label={t("loading", locale)} />
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-none" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : !data ? null : data.conversation.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle className="w-12 h-12 text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">{t("noMessages", locale)}</p>
            </div>
          ) : (
            data.conversation.messages.map((m) => {
              const isReception = m.senderRole === "RECEPTION" || m.senderRole === "STAFF";
              return (
                <div key={m.id} className={`flex ${isReception ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${isReception ? "bg-white text-slate-800 border border-slate-200 rounded-bl-md" : "bg-emerald-600 text-white rounded-br-md"}`}>
                    {isReception && (
                      <p className="text-[10px] font-bold text-emerald-700 mb-0.5">{m.senderName}</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                    <p className={`text-[10px] mt-1 ${isReception ? "text-slate-400" : "text-emerald-100"}`}>
                      <DateStr value={m.createdAt} locale={locale} withTime />
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex-none border-t border-slate-200 p-3 bg-white flex items-center gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={t("chatPlaceholder", locale)}
            className="flex-1 h-11 text-sm"
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            className="h-11 w-11 p-0 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
