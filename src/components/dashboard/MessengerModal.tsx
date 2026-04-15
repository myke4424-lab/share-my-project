import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, RefreshCw, Users, User, Tv, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Dialog {
  id: number;
  name: string;
  type: "user" | "group" | "channel";
  unread: number;
  last_msg: string;
  last_date: string | null;
  username: string;
}

interface Message {
  id: number;
  text: string;
  date: string | null;
  out: boolean;
  from_me: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  accountId: number;
  accountName: string;
}

function fmtDate(iso: string | null) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
  } catch { return ""; }
}

function DialogIcon({ type }: { type: string }) {
  if (type === "channel") return <Tv className="h-4 w-4 text-blue-400" />;
  if (type === "group") return <Users className="h-4 w-4 text-violet-400" />;
  return <User className="h-4 w-4 text-emerald-400" />;
}

export default function MessengerModal({ open, onOpenChange, accountId, accountName }: Props) {
  const { toast } = useToast();
  const [dialogs, setDialogs] = useState<Dialog[]>([]);
  const [loadingDialogs, setLoadingDialogs] = useState(false);
  const [selected, setSelected] = useState<Dialog | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<Dialog | null>(null);
  const pollingMsgs = useRef(false);
  const pollingDialogs = useRef(false);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    if (open) {
      loadDialogs();
      // Автообновление диалогов каждые 30 сек
      const dialogTimer = setInterval(async () => {
        if (pollingDialogs.current) return;
        pollingDialogs.current = true;
        try {
          const r = await fetch(`/api/accounts/${accountId}/dialogs?limit=100`, { credentials: "include" });
          const d = await r.json();
          setDialogs(d.dialogs || []);
        } catch { /* тихо */ } finally {
          pollingDialogs.current = false;
        }
      }, 30000);
      return () => clearInterval(dialogTimer);
    } else {
      setSelected(null);
      setMessages([]);
      setSearch("");
    }
  }, [open]);

  // Автообновление сообщений каждые 5 сек когда диалог открыт
  useEffect(() => {
    if (!selected) return;
    const msgTimer = setInterval(async () => {
      if (pollingMsgs.current || !selectedRef.current) return;
      pollingMsgs.current = true;
      try {
        const r = await fetch(`/api/accounts/${accountId}/messages/${selectedRef.current.id}?limit=50`, { credentials: "include" });
        const d = await r.json();
        const newMsgs: Message[] = d.messages || [];
        setMessages(prev => {
          if (prev.length === 0) return newMsgs;
          const lastId = prev[prev.length - 1].id;
          const hasNew = newMsgs.some(m => m.id > lastId);
          return hasNew ? newMsgs : prev;
        });
      } catch { /* тихо */ } finally {
        pollingMsgs.current = false;
      }
    }, 5000);
    return () => clearInterval(msgTimer);
  }, [selected?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadDialogs = async () => {
    setLoadingDialogs(true);
    try {
      const r = await fetch(`/api/accounts/${accountId}/dialogs?limit=100`, { credentials: "include" });
      const d = await r.json();
      setDialogs(d.dialogs || []);
    } catch { toast({ title: "Ошибка загрузки диалогов", variant: "destructive" }); }
    setLoadingDialogs(false);
  };

  const openDialog = async (dlg: Dialog) => {
    setSelected(dlg);
    setMessages([]);
    setLoadingMsgs(true);
    try {
      const r = await fetch(`/api/accounts/${accountId}/messages/${dlg.id}?limit=50`, { credentials: "include" });
      const d = await r.json();
      setMessages(d.messages || []);
    } catch { toast({ title: "Ошибка загрузки сообщений", variant: "destructive" }); }
    setLoadingMsgs(false);
  };

  const sendMsg = async () => {
    if (!selected || !text.trim() || sending) return;
    setSending(true);
    const msgText = text.trim();
    setText("");
    try {
      const r = await fetch(`/api/accounts/${accountId}/send-message`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peer_id: selected.id, text: msgText }),
      });
      const d = await r.json();
      if (d.ok) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          text: msgText,
          date: new Date().toISOString(),
          out: true,
          from_me: true,
        }]);
      } else {
        toast({ title: `Ошибка: ${d.detail}`, variant: "destructive" });
        setText(msgText);
      }
    } catch {
      toast({ title: "Ошибка отправки", variant: "destructive" });
      setText(msgText);
    }
    setSending(false);
  };

  const filtered = dialogs.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col bg-card border-border p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border/50 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <MessageCircle className="h-4 w-4 text-violet-400" />
            Переписки — {accountName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          {/* Список диалогов */}
          <div className={cn(
            "flex flex-col border-r border-border/50 shrink-0 transition-all",
            selected ? "w-0 overflow-hidden md:w-72" : "w-full md:w-72"
          )}>
            <div className="p-2 border-b border-border/50 flex gap-2">
              <Input
                placeholder="Поиск..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 text-xs bg-background border-border/50"
              />
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={loadDialogs} disabled={loadingDialogs}>
                <RefreshCw className={cn("h-3.5 w-3.5", loadingDialogs && "animate-spin")} />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingDialogs ? (
                <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" /> Загрузка...
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
                  Диалогов нет
                </div>
              ) : (
                filtered.map(dlg => (
                  <button
                    key={dlg.id}
                    onClick={() => openDialog(dlg)}
                    className={cn(
                      "w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-muted/40 transition-colors border-b border-border/20",
                      selected?.id === dlg.id && "bg-primary/10"
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
                      <DialogIcon type={dlg.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-medium truncate text-foreground">{dlg.name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{fmtDate(dlg.last_date)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <span className="text-[11px] text-muted-foreground truncate">{dlg.last_msg || "—"}</span>
                        {dlg.unread > 0 && (
                          <span className="shrink-0 text-[9px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 font-bold">
                            {dlg.unread > 99 ? "99+" : dlg.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Область сообщений */}
          <div className="flex-1 flex flex-col min-w-0">
            {!selected ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <MessageCircle className="h-10 w-10 opacity-20" />
                <span className="text-sm">Выберите диалог</span>
              </div>
            ) : (
              <>
                {/* Шапка чата */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50 shrink-0">
                  <button
                    className="md:hidden p-1 rounded hover:bg-muted/40"
                    onClick={() => setSelected(null)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center">
                    <DialogIcon type={selected.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{selected.name}</div>
                    {selected.username && (
                      <div className="text-[11px] text-muted-foreground">@{selected.username}</div>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0"
                    onClick={() => openDialog(selected)} disabled={loadingMsgs}>
                    <RefreshCw className={cn("h-3 w-3", loadingMsgs && "animate-spin")} />
                  </Button>
                </div>

                {/* Сообщения */}
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
                  {loadingMsgs ? (
                    <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" /> Загрузка...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                      Сообщений нет
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.id} className={cn("flex", msg.from_me ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[75%] rounded-2xl px-3 py-1.5 text-sm",
                          msg.from_me
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted/60 text-foreground rounded-bl-sm"
                        )}>
                          <p className="whitespace-pre-wrap break-words leading-snug">{msg.text}</p>
                          <p className={cn(
                            "text-[10px] mt-0.5 text-right",
                            msg.from_me ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            {fmtDate(msg.date)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Поле ввода */}
                <div className="px-3 py-2.5 border-t border-border/50 flex gap-2 shrink-0">
                  <Input
                    placeholder="Написать сообщение..."
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMsg()}
                    className="bg-background border-border/50 text-sm"
                    disabled={sending}
                  />
                  <Button size="icon" onClick={sendMsg} disabled={!text.trim() || sending} className="shrink-0">
                    {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
