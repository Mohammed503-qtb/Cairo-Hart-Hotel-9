"use client";

// ChatSheet — chat with the guest from reception side. Polls every 5s.

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, Send } from "lucide-react";
import { ReceptLocale, t } from "./i18n";
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
  stayId: string | null;
  onClose: () => void;
  locale: ReceptLocale;
}

export function ChatSheet({ stayId, onClose, locale }: Props) {
  const isRTL = locale === "ar";
  const open = !!stayId;
  const { data, loading, error, refresh } = useFetch<ConversationData>(stayId ? `/api/app/reception/conversation/${stayId}` : "", {
    enabled: !!stayId,
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
    if (!stayId || !draft.trim()) return;
    setSending(true);
    const res = await apiPost(`/api/app/reception/conversation/${stayId}`, { body: draft.trim() });
    setSending(false);
    if (res.ok) {
      setDraft("");
      toast.success(t("toastMessageSent", locale));
      refresh();
    } else {
      toast.error(t("errGeneric", locale));
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="bottom"
        className="h-[90dvh] p-0 rounded-t-3xl bg-white flex flex-col"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-100 space-y-0">
          <SheetTitle className="text-base font-bold text-slate-900">{t("chat", locale)}</SheetTitle>
          <SheetDescription className="text-xs text-slate-500">
            {data?.conversation ? `${data.conversation.guestName} • ${t("room", locale)} ${data.conversation.roomNumber}` : t("loading", locale)}
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
            <p className="text-center text-sm text-slate-400 py-8">{t("noMessages", locale)}</p>
          ) : (
            data.conversation.messages.map((m) => {
              const isReception = m.senderRole === "RECEPTION" || m.senderRole === "STAFF";
              return (
                <div key={m.id} className={`flex ${isReception ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[78%] rounded-2xl px-3 py-2 ${isReception ? "bg-emerald-600 text-white rounded-br-md" : "bg-white text-slate-800 border border-slate-200 rounded-bl-md"}`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                    <p className={`text-[10px] mt-1 ${isReception ? "text-emerald-100" : "text-slate-400"}`}>
                      {m.senderName} • <DateStr value={m.createdAt} locale={locale} withTime />
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
            disabled={!draft.trim() || sending || !stayId}
            className="h-11 w-11 p-0 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
