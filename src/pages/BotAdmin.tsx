import { useState, useEffect } from "react";
import { Users, MessageSquare, Send, RefreshCw, RotateCcw, BarChart3, Clock, CheckCircle2, Inbox, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const STATE_COLORS: Record<string, string> = {
  activated:       "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  check_sub:       "bg-amber-500/15 text-amber-400 border-amber-500/30",
  awaiting_review: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  start:           "bg-muted/30 text-muted-foreground border-border/30",
};

interface Stats {
  total: number;
  new_today: number;
  new_week: number;
  pending_messages: number;
  by_state: { state: string; label: string; count: number }[];
}

interface BotUser {
  telegram_id: number;
  state: string;
  state_label: string;
  updated_at: string;
  email: string | null;
  tg_username: string | null;
  tg_first_name: string | null;
  panel_user_id: number | null;
  sub_days_left: number | null;
}

const BotAdmin = () => {
  const { toast } = useToast();
  const [stats, setStats]         = useState<Stats | null>(null);
  const [users, setUsers]         = useState<BotUser[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [stateFilter, setStateFilter] = useState("");
  const [page, setPage]           = useState(0);
  const limit = 20;

  // Broadcast
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastState, setBroadcastState] = useState("");
  const [sending, setSending]     = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadStats = async () => {
    const r = await fetch("/api/admin/bot/stats", { credentials: "include" }).catch(() => null);
    if (r?.ok) setStats(await r.json());
  };

  const loadUsers = async (p = page, sf = stateFilter) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(limit), offset: String(p * limit) });
    if (sf) params.set("state", sf);
    const r = await fetch(`/api/admin/bot/users?${params}`, { credentials: "include" }).catch(() => null);
    if (r?.ok) {
      const d = await r.json();
      setUsers(d.users);
      setTotal(d.total);
    }
    setLoading(false);
  };

  useEffect(() => { loadStats(); loadUsers(0, ""); }, []);

  const applyFilter = (sf: string) => {
    setStateFilter(sf);
    setPage(0);
    loadUsers(0, sf);
  };

  const handleBroadcast = async () => {
    if (!broadcastText.trim()) return;
    setSending(true);
    const r = await fetch("/api/admin/bot/broadcast", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: broadcastText, state_filter: broadcastState || null }),
    }).catch(() => null);
    setSending(false);
    if (r?.ok) {
      const d = await r.json();
      toast({ title: `Рассылка завершена: ${d.sent} отправлено, ${d.failed} ошибок` });
      setBroadcastText("");
    } else {
      toast({ title: "Ошибка рассылки", variant: "destructive" });
    }
  };

  const handleReset = async (u: BotUser) => {
    const r = await fetch("/api/admin/bot/reset", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegram_id: u.telegram_id, panel_user_id: u.panel_user_id }),
    }).catch(() => null);
    if (r?.ok) {
      toast({ title: `Пользователь ${u.telegram_id} сброшен` });
      loadUsers();
      loadStats();
    }
  };

  const handleDelete = async (u: BotUser) => {
    const name = u.tg_first_name || `ID ${u.telegram_id}`;
    if (!confirm(`Удалить "${name}"?\n\nПользователь будет удалён из бота и панели безвозвратно.`)) return;
    setDeletingId(u.telegram_id);
    const r = await fetch(`/api/admin/bot/users/${u.telegram_id}`, {
      method: "DELETE", credentials: "include",
    }).catch(() => null);
    setDeletingId(null);
    if (r?.ok) {
      toast({ title: `Пользователь ${name} удалён` });
      loadUsers();
      loadStats();
    } else {
      toast({ title: "Ошибка удаления", variant: "destructive" });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">🤖 Бот — Статистика</h1>
          <p className="text-muted-foreground text-sm mt-1">Управление пользователями и рассылка</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { loadStats(); loadUsers(); }} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Обновить
        </Button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Users,        label: "Всего в боте",   value: stats.total,            color: "text-primary" },
            { icon: Clock,        label: "Новых сегодня",  value: stats.new_today,         color: "text-emerald-400" },
            { icon: BarChart3,    label: "За неделю",      value: stats.new_week,          color: "text-blue-400" },
            { icon: MessageSquare,label: "Запланировано",  value: stats.pending_messages,  color: "text-amber-400" },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border/50 bg-card/60 p-4">
              <s.icon className={cn("h-5 w-5 mb-2", s.color)} />
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* State breakdown */}
      {stats && stats.by_state.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card/60 p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">По воронке</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyFilter("")}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                !stateFilter ? "bg-primary/15 text-primary border-primary/30" : "bg-muted/20 text-muted-foreground border-border/30 hover:border-border"
              )}
            >
              Все ({stats.total})
            </button>
            {stats.by_state.map(s => (
              <button
                key={s.state}
                onClick={() => applyFilter(s.state)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  stateFilter === s.state
                    ? cn("border", STATE_COLORS[s.state] || "bg-muted/30 text-foreground border-border")
                    : "bg-muted/20 text-muted-foreground border-border/30 hover:border-border"
                )}
              >
                {s.label} ({s.count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Broadcast */}
      <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Send className="h-4 w-4 text-primary" /> Рассылка
        </h2>
        <div className="flex gap-2">
          <select
            value={broadcastState}
            onChange={e => setBroadcastState(e.target.value)}
            className="text-xs rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-foreground"
          >
            <option value="">Всем пользователям</option>
            <option value="activated">Только активированным</option>
            <option value="check_sub">Ожидают подписки</option>
            <option value="awaiting_review">Ожидают отзыв</option>
          </select>
        </div>
        <Textarea
          value={broadcastText}
          onChange={e => setBroadcastText(e.target.value)}
          placeholder="Текст сообщения (поддерживается HTML: <b>, <i>, <a href='...'>)"
          className="bg-background/50 min-h-[80px] text-sm"
          rows={3}
        />
        <Button
          onClick={handleBroadcast}
          disabled={sending || !broadcastText.trim()}
          className="gap-2"
        >
          {sending
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Отправляем...</>
            : <><Send className="h-4 w-4" /> Отправить</>
          }
        </Button>
      </div>

      {/* Users table */}
      <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
        <div className="p-4 border-b border-border/30 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Пользователи ({total})</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Загрузка...
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Inbox className="h-8 w-8 mb-2" /><span className="text-sm">Нет пользователей</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 text-xs text-muted-foreground">
                  <th className="text-left px-4 py-2">Пользователь</th>
                  <th className="text-left px-4 py-2">Статус</th>
                  <th className="text-left px-4 py-2">Подписка</th>
                  <th className="text-left px-4 py-2">Обновлён</th>
                  <th className="text-left px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.telegram_id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {u.tg_first_name || "—"} {u.tg_username ? <span className="text-muted-foreground text-xs">@{u.tg_username}</span> : ""}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID: {u.telegram_id} {u.email ? `· ${u.email}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 rounded-md text-xs font-medium border", STATE_COLORS[u.state] || "bg-muted/20 text-muted-foreground border-border/30")}>
                        {u.state_label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {u.sub_days_left !== null
                        ? <span className={cn("font-medium", u.sub_days_left > 1 ? "text-emerald-400" : "text-red-400")}>{u.sub_days_left}д</span>
                        : <span className="text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {u.updated_at ? new Date(u.updated_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleReset(u)}
                          title="Сбросить воронку (для теста)"
                          className="p-1.5 rounded-lg hover:bg-amber-500/10 text-muted-foreground hover:text-amber-400 transition-colors"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={deletingId === u.telegram_id}
                          title="Удалить пользователя полностью"
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="p-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
            <span>Показано {page * limit + 1}–{Math.min((page + 1) * limit, total)} из {total}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => { setPage(p => p - 1); loadUsers(page - 1); }} className="h-7 px-2">←</Button>
              <Button variant="outline" size="sm" disabled={(page + 1) * limit >= total} onClick={() => { setPage(p => p + 1); loadUsers(page + 1); }} className="h-7 px-2">→</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BotAdmin;
