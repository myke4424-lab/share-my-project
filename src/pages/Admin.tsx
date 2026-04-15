import { useEffect, useState, useMemo } from "react";
import { Shield, RefreshCw, Crown, UserX, Check, ChevronDown, Search, Users, TrendingUp, Filter, X, UserCheck, UserMinus, Clock, Server, AlertTriangle, HardDrive, Cpu, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AdminUser {
  id:               number;
  email:            string;
  name:             string;
  has_google:       number;
  telegram_id:      string | null;
  tg_username:      string | null;
  tg_first_name:    string | null;
  plan:             string;
  subscription_end: number | null;
  created_at:       number;
}

interface PanelUser {
  id:          number;
  email:       string;
  name:        string;
  is_approved: number;
  created_at:  number;
}

const PLANS = ["trial", "warming", "inviting", "parsing", "commenting", "pro"];

const PLAN_META: Record<string, { badge: string; label: string; icon: string }> = {
  trial:     { badge: "bg-zinc-500/15 text-zinc-300 border border-zinc-500/25",       label: "Trial",           icon: "text-zinc-400"   },
  warming:   { badge: "bg-orange-500/15 text-orange-300 border border-orange-500/25", label: "Прогрев",         icon: "text-orange-400" },
  inviting:  { badge: "bg-blue-500/15 text-blue-300 border border-blue-500/25",       label: "Инвайтинг",       icon: "text-blue-400"   },
  parsing:   { badge: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25", label: "Парсинг",       icon: "text-emerald-400"},
  commenting:{ badge: "bg-violet-500/15 text-violet-300 border border-violet-500/25", label: "Нейрокомментинг", icon: "text-violet-400" },
  pro:       { badge: "bg-amber-500/15 text-amber-300 border border-amber-500/25",    label: "Pro System",      icon: "text-amber-400"  },
};

function formatDate(ts: number | null) {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

function timeAgo(ts: number) {
  const diff = Date.now() / 1000 - ts;
  if (diff < 3600)  return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  if (diff < 86400 * 7)  return `${Math.floor(diff / 86400)} дн назад`;
  return formatDate(ts);
}

function isExpired(ts: number | null): boolean {
  if (!ts) return false;
  return ts < Date.now() / 1000;
}

// ── Pending approvals panel ───────────────────────────────────────────────────

function PendingApprovals({ onChanged }: { onChanged: () => void }) {
  const [users,   setUsers]   = useState<PanelUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/panel-users", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setUsers(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const setApproved = async (uid: number, approved: boolean) => {
    setSaving(uid);
    await fetch(`/api/admin/panel-users/${uid}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ approved }),
    });
    setSaving(null);
    load();
    onChanged();
  };

  const pending  = users.filter(u => !u.is_approved);
  const approved = users.filter(u => u.is_approved);

  if (loading) return null;
  if (pending.length === 0 && approved.length === 0) return null;

  return (
    <div className="panel-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/60 flex items-center gap-2">
        <Clock className="h-4 w-4 text-amber-400" />
        <h2 className="text-sm font-semibold text-foreground">Доступ пользователей</h2>
        {pending.length > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold ml-auto">
            {pending.length} ожидают
          </span>
        )}
      </div>
      <div className="divide-y divide-border/40">
        {users.map(u => (
          <div key={u.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/20 transition-colors">
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0",
              u.is_approved ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
            )}>
              {(u.name || u.email || "?").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{u.name || "—"}</p>
              <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
            </div>
            <span className="text-[10px] text-muted-foreground/60 shrink-0 hidden sm:block">
              {timeAgo(u.created_at)}
            </span>
            {u.is_approved ? (
              <button
                disabled={saving === u.id}
                onClick={() => setApproved(u.id, false)}
                className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 shrink-0"
              >
                <UserMinus className="h-3 w-3" />
                Отозвать
              </button>
            ) : (
              <button
                disabled={saving === u.id}
                onClick={() => setApproved(u.id, true)}
                className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 shrink-0"
              >
                <UserCheck className="h-3 w-3" />
                Одобрить
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Plan picker dropdown ───────────────────────────────────────────────────────

function PlanPicker({ userId, current, onChanged }: { userId: number; current: string; onChanged: () => void }) {
  const [open,   setOpen]   = useState(false);
  const [days,   setDays]   = useState(30);
  const [saving, setSaving] = useState(false);

  const setPlan = async (plan: string) => {
    setSaving(true);
    await fetch(`/api/admin/users/${userId}/plan`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ plan, days }),
    });
    setSaving(false);
    setOpen(false);
    onChanged();
  };

  const meta = PLAN_META[current] ?? PLAN_META.trial;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn("inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full transition-opacity", meta.badge, saving && "opacity-50")}
      >
        {meta.label}
        <ChevronDown className="h-2.5 w-2.5 opacity-60" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-8 z-50 bg-card border border-border rounded-2xl shadow-2xl p-3 w-48 space-y-2.5">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider px-1">Выбрать план</p>
            <div className="space-y-0.5">
              {PLANS.map(p => {
                const m = PLAN_META[p];
                return (
                  <button key={p} onClick={() => setPlan(p)} disabled={saving}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors",
                      p === current
                        ? "bg-primary/15 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}>
                    <span className="flex items-center gap-2">
                      <Crown className={cn("h-3 w-3", m.icon)} />
                      {m.label}
                    </span>
                    {p === current && <Check className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>
            <div className="pt-1 border-t border-border">
              <label className="text-[10px] text-muted-foreground block mb-1.5 font-medium">Срок действия</label>
              <select value={days} onChange={e => setDays(Number(e.target.value))}
                className="w-full bg-background border border-border rounded-xl text-xs px-2.5 py-1.5 text-foreground">
                <option value={7}>7 дней</option>
                <option value={14}>14 дней</option>
                <option value={30}>30 дней</option>
                <option value={90}>90 дней</option>
                <option value={365}>1 год</option>
                <option value={0}>Бессрочно</option>
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── System Metrics ────────────────────────────────────────────────────────────

interface SysMetrics {
  uptime_seconds: number;
  tasks_running: number;
  tasks_detail: { task_id: string; tool: string; user_id: number; started: number }[];
  disk: { total_gb: number; free_gb: number; used_pct: number };
  memory: { total_mb: number; available_mb: number; used_mb: number; used_pct: number };
  databases_kb: Record<string, number>;
  log_file_kb: number;
  errors: { last_hour: number; last_10min: number; recent: { ts: number; method: string; path: string; status: number; error?: string }[] };
}

function fmtUptime(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}ч ${m}м` : `${m}м`;
}

function SystemMetrics() {
  const [data, setData] = useState<SysMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/system", { credentials: "include" })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); const id = setInterval(load, 15000); return () => clearInterval(id); }, []);

  if (loading && !data) return <div className="py-16 flex items-center justify-center"><RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!data) return <div className="py-8 text-center text-muted-foreground text-sm">Нет данных</div>;

  const memPct = data.memory?.used_pct ?? 0;
  const diskPct = data.disk?.used_pct ?? 0;
  const errBad = data.errors.last_10min >= 5;

  return (
    <div className="space-y-4">
      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <Server className="h-4 w-4" />, label: "Аптайм", value: fmtUptime(data.uptime_seconds), color: "text-green-400" },
          { icon: <TrendingUp className="h-4 w-4" />, label: "Задач активно", value: String(data.tasks_running), color: data.tasks_running > 30 ? "text-yellow-400" : "text-foreground" },
          { icon: <Cpu className="h-4 w-4" />, label: "RAM использовано", value: data.memory?.used_pct ? `${data.memory.used_pct}%` : "—", color: memPct > 85 ? "text-red-400" : memPct > 70 ? "text-yellow-400" : "text-foreground" },
          { icon: <AlertTriangle className="h-4 w-4" />, label: "Ошибок за 10 мин", value: String(data.errors.last_10min), color: errBad ? "text-red-400" : "text-foreground" },
        ].map(s => (
          <div key={s.label} className="panel-card p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">{s.icon}{s.label}</div>
            <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Disk + Memory bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="panel-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium"><HardDrive className="h-4 w-4 text-muted-foreground" />Диск</div>
          {data.disk ? (<>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", diskPct > 90 ? "bg-red-500" : diskPct > 75 ? "bg-yellow-500" : "bg-primary")} style={{ width: `${diskPct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Занято {diskPct}%</span>
              <span>Свободно {data.disk.free_gb} GB / {data.disk.total_gb} GB</span>
            </div>
          </>) : <p className="text-xs text-muted-foreground">Недоступно</p>}
        </div>
        <div className="panel-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium"><Cpu className="h-4 w-4 text-muted-foreground" />Память</div>
          {data.memory?.total_mb ? (<>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", memPct > 90 ? "bg-red-500" : memPct > 75 ? "bg-yellow-500" : "bg-primary")} style={{ width: `${memPct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Занято {memPct}%</span>
              <span>{data.memory.used_mb} MB / {data.memory.total_mb} MB</span>
            </div>
          </>) : <p className="text-xs text-muted-foreground">Недоступно</p>}
        </div>
      </div>

      {/* DB sizes + log */}
      <div className="panel-card p-4">
        <p className="text-sm font-medium mb-3">Базы данных и логи</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {Object.entries(data.databases_kb).map(([name, kb]) => (
            <div key={name} className="bg-secondary/40 rounded-lg px-3 py-2">
              <p className="text-muted-foreground">{name}</p>
              <p className="font-semibold mt-0.5">{kb >= 1024 ? `${(kb/1024).toFixed(1)} MB` : `${kb} KB`}</p>
            </div>
          ))}
          <div className="bg-secondary/40 rounded-lg px-3 py-2">
            <p className="text-muted-foreground">panel.log</p>
            <p className="font-semibold mt-0.5">{data.log_file_kb >= 1024 ? `${(data.log_file_kb/1024).toFixed(1)} MB` : `${data.log_file_kb} KB`}</p>
          </div>
        </div>
      </div>

      {/* Active tasks */}
      {data.tasks_detail.length > 0 && (
        <div className="panel-card p-4">
          <p className="text-sm font-medium mb-3">Активные задачи ({data.tasks_detail.length})</p>
          <div className="space-y-1.5">
            {data.tasks_detail.map(t => (
              <div key={t.task_id} className="flex items-center justify-between text-xs bg-secondary/40 rounded-lg px-3 py-2">
                <span className="font-mono text-muted-foreground">{t.task_id}</span>
                <span className="font-medium">{t.tool}</span>
                <span className="text-muted-foreground">user #{t.user_id}</span>
                <span className="text-muted-foreground">{fmtUptime(Math.floor(Date.now()/1000) - t.started)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent errors */}
      {data.errors.recent.length > 0 && (
        <div className="panel-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">Последние ошибки</p>
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", errBad ? "bg-red-500/15 text-red-300" : "bg-secondary text-muted-foreground")}>
              {data.errors.last_hour} за час · {data.errors.last_10min} за 10 мин
            </span>
          </div>
          <div className="space-y-1.5">
            {data.errors.recent.slice().reverse().map((e, i) => (
              <div key={i} className="text-xs bg-red-500/5 border border-red-500/15 rounded-lg px-3 py-2 font-mono">
                <span className="text-muted-foreground">{new Date(e.ts * 1000).toLocaleTimeString("ru-RU")}</span>
                <span className="ml-2 text-red-400">{e.status}</span>
                <span className="ml-2">{e.method} {e.path}</span>
                {e.error && <span className="ml-2 text-muted-foreground truncate">{e.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={load} className="gap-2 text-xs">
          <RefreshCw className="h-3 w-3" />Обновить
        </Button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const Admin = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState<"users" | "system">("users");
  const [users,   setUsers]   = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [search,  setSearch]  = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    setError("");
    fetch("/api/admin/users", { credentials: "include" })
      .then(r => {
        if (r.status === 403) throw new Error("Только для администратора");
        return r.json();
      })
      .then(d => { if (Array.isArray(d)) setUsers(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (u: AdminUser) => {
    if (!confirm(`Удалить пользователя "${u.name || u.email}"?\n\nВсе данные (аккаунты, задачи, подписка, бот) будут удалены безвозвратно.`)) return;
    setDeletingId(u.id);
    const r = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE", credentials: "include" }).catch(() => null);
    setDeletingId(null);
    if (r?.ok) {
      toast({ title: `Пользователь удалён` });
      load();
    } else {
      toast({ title: "Ошибка удаления", variant: "destructive" });
    }
  };

  const planCounts = useMemo(() =>
    PLANS.reduce((acc, p) => {
      acc[p] = users.filter(u => (u.plan || "trial") === p).length;
      return acc;
    }, {} as Record<string, number>),
  [users]);

  const filtered = useMemo(() => {
    let res = users;
    if (planFilter !== "all") res = res.filter(u => (u.plan || "trial") === planFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      res = res.filter(u =>
        u.email?.toLowerCase().includes(q) ||
        u.name?.toLowerCase().includes(q) ||
        String(u.id).includes(q)
      );
    }
    return res;
  }, [users, planFilter, search]);

  const newToday = users.filter(u => u.created_at && Date.now() / 1000 - u.created_at < 86400).length;

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px]">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
              <Shield className="h-4.5 w-4.5 text-primary" style={{ width: 18, height: 18 }} />
            </div>
            Администрирование
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Управление пользователями и подписками</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2 h-9 text-xs shrink-0">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Обновить
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl w-fit">
        {([["users", <Users className="h-3.5 w-3.5" />, "Пользователи"], ["system", <Server className="h-3.5 w-3.5" />, "Система"]] as const).map(([id, icon, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn("flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors",
              tab === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {icon}{label}
          </button>
        ))}
      </div>

      {tab === "system" && <SystemMetrics />}

      {tab === "users" && error && (
        <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/5">
          <p className="text-sm text-red-400 flex items-center gap-2">
            <UserX className="h-4 w-4" /> {error}
          </p>
        </div>
      )}

      {/* Pending approvals */}
      {tab === "users" && !error && <PendingApprovals onChanged={load} />}

      {/* Stats grid */}
      {tab === "users" && !error && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Total */}
          <div className="panel-card p-4 md:col-span-1 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Всего</p>
              <Users className="h-4 w-4 text-muted-foreground/40" />
            </div>
            <p className="text-3xl font-black text-foreground">{users.length}</p>
            {newToday > 0 && (
              <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" /> +{newToday} сегодня
              </p>
            )}
          </div>

          {/* Per plan */}
          {PLANS.map(p => {
            const m = PLAN_META[p];
            const count = planCounts[p] ?? 0;
            const pct = users.length ? Math.round(count / users.length * 100) : 0;
            return (
              <button key={p}
                onClick={() => setPlanFilter(planFilter === p ? "all" : p)}
                className={cn(
                  "panel-card p-4 text-left transition-all hover:border-border",
                  planFilter === p && "ring-1 ring-primary/40"
                )}>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", m.badge)}>{m.label}</span>
                  <Crown className={cn("h-3.5 w-3.5 opacity-50", m.icon)} />
                </div>
                <p className="text-2xl font-black text-foreground">{count}</p>
                <div className="mt-2 h-1 bg-muted/50 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", m.icon.replace("text-", "bg-"))}
                    style={{ width: `${Math.max(pct, 2)}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === "users" && <>
      {/* Search & filter bar */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по имени, email, ID..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {planFilter !== "all" && (
          <button onClick={() => setPlanFilter("all")}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors">
            <Filter className="h-3.5 w-3.5" />
            {PLAN_META[planFilter]?.label}
            <X className="h-3 w-3 opacity-60" />
          </button>
        )}
        <p className="text-[11px] text-muted-foreground ml-auto">
          {filtered.length} {filtered.length === users.length ? "пользователей" : `из ${users.length}`}
        </p>
      </div>

      {/* Users table */}
      <div className="panel-card overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin opacity-40" />
            <p className="text-sm">Загрузка...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <Users className="h-8 w-8 opacity-20" />
            <p className="text-sm">{users.length === 0 ? "Нет зарегистрированных пользователей" : "Нет совпадений"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  {["ID", "Пользователь", "Авторизация", "План", "Подписка до", "Зарегистрирован", ""].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const expired = isExpired(u.subscription_end);
                  return (
                    <tr key={u.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground/60 font-mono text-xs">#{u.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                            {(u.name || u.email || "?").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-[13px] truncate max-w-[160px]">{u.name || "—"}</p>
                            <p className="text-muted-foreground text-[11px] truncate max-w-[160px]">{u.email || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.has_google ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/20 font-medium">
                              Google
                            </span>
                          ) : u.email ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                              Email
                            </span>
                          ) : null}
                          {u.telegram_id && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/20 font-medium">
                              TG {u.tg_username ? `@${u.tg_username}` : u.tg_first_name || "Bot"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <PlanPicker userId={u.id} current={u.plan || "trial"} onChanged={load} />
                      </td>
                      <td className="px-4 py-3">
                        {u.subscription_end ? (
                          <span className={cn("text-xs font-medium", expired ? "text-red-400" : "text-foreground/70")}>
                            {expired && "⚠ "}{formatDate(u.subscription_end)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Бессрочно</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {timeAgo(u.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={deletingId === u.id}
                          title="Удалить пользователя"
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>}
    </div>
  );
};

export default Admin;
