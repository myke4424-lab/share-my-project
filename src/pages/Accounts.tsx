import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, UserCheck, UserX, AlertTriangle, Snowflake, RefreshCw,
  Search, Upload, CheckCircle2, XCircle, Clock, Zap, KeyRound,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Inbox,
  Trash2, Download, Shield, Settings2,
  ArrowUpDown, Filter, Plus, Server, Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ImportAccountsModal from "@/components/dashboard/ImportAccountsModal";
import AccountManagementSheet from "@/components/dashboard/AccountManagementSheet";
import ProxyPoolModal from "@/components/dashboard/ProxyPoolModal";
import ConverterModal from "@/components/dashboard/ConverterModal";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Account {
  id: number;
  name: string;
  phone: string;
  status: string;
  username?: string;
  avatar?: string;
  has_avatar?: boolean;
  tg_name?: string;
  category?: string;
  proxy_name?: string;
  proxy_id?: number | null;
  proxy_label?: string;
  proxy_host?: string;
  days?: number;
  health_score?: number;
  panel_user_id?: number;
}

interface DbProxy { id: number; name: string; proxy_type: string; host: string; port: number; }

function HealthBadge({ score }: { score?: number }) {
  if (score === undefined) return null;
  const s = score;
  const cfg =
    s >= 80 ? { label: "Отличный", cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/25" } :
    s >= 60 ? { label: "Хороший",  cls: "bg-blue-500/15 text-blue-500 border-blue-500/25" } :
    s >= 40 ? { label: "Средний",  cls: "bg-amber-500/15 text-amber-600 border-amber-500/25" } :
              { label: "Плохой",   cls: "bg-red-500/15 text-red-500 border-red-500/25" };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border", cfg.cls)}>
      {s}% · {cfg.label}
    </span>
  );
}

// ── Status configs ──────────────────────────────────────────────────────────

function getStatusKey(status: string) {
  if (!status) return "unknown";
  const s = status.toLowerCase();
  if (s === "active" || s === "ok") return "active";
  if (s.includes("ban")) return "banned";
  if (s.includes("spam")) return "spamblock";
  if (s.includes("flood")) return "flood";
  if (s === "reauth") return "reauth";
  return "unknown";
}

const STATUS_BADGE: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  active:    { label: "Валидный",      className: "bg-emerald-500/12 text-emerald-500 dark:text-emerald-400 border border-emerald-500/25", icon: CheckCircle2 },
  banned:    { label: "Забанен",       className: "bg-red-500/12 text-red-500 dark:text-red-400 border border-red-500/25",                icon: XCircle },
  spamblock: { label: "Спамблок",      className: "bg-orange-500/12 text-orange-500 dark:text-orange-400 border border-orange-500/25",    icon: AlertTriangle },
  flood:     { label: "FloodWait",     className: "bg-yellow-500/12 text-yellow-600 dark:text-yellow-400 border border-yellow-500/25",    icon: Clock },
  reauth:    { label: "Нужна реавтор", className: "bg-violet-500/12 text-violet-500 dark:text-violet-400 border border-violet-500/25",    icon: KeyRound },
  unknown:   { label: "Неизвестно",    className: "bg-muted/60 text-muted-foreground border border-border",                               icon: KeyRound },
};

// ── Avatar colors (initials fallback) ──────────────────────────────────────

const AVATAR_COLORS = [
  "bg-violet-500/20 text-violet-500",
  "bg-blue-500/20 text-blue-500",
  "bg-emerald-500/20 text-emerald-500",
  "bg-orange-500/20 text-orange-500",
  "bg-pink-500/20 text-pink-500",
  "bg-cyan-500/20 text-cyan-500",
  "bg-amber-500/20 text-amber-500",
];

function getInitials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(/[\s_]/);
  return parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function getAvatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

// ── Warming label ───────────────────────────────────────────────────────────

function warmingLabel(days?: number): { label: string; color: string } {
  const d = days ?? 0;
  if (d <= 3)  return { label: "Новый",     color: "text-blue-400" };
  if (d <= 14) return { label: "Молодой",   color: "text-violet-400" };
  if (d <= 30) return { label: "Прогретый", color: "text-emerald-400" };
  return              { label: "Старый",    color: "text-amber-400" };
}

// ── Sort helper ─────────────────────────────────────────────────────────────

type SortKey = "name" | "phone" | "status" | "days";

function sortAccounts(list: Account[], key: SortKey, dir: "asc" | "desc"): Account[] {
  return [...list].sort((a, b) => {
    let av: string | number = "";
    let bv: string | number = "";
    if (key === "name")   { av = a.name ?? ""; bv = b.name ?? ""; }
    if (key === "phone")  { av = a.phone ?? ""; bv = b.phone ?? ""; }
    if (key === "status") { av = getStatusKey(a.status); bv = getStatusKey(b.status); }
    if (key === "days")   { av = a.days ?? 0; bv = b.days ?? 0; }
    if (av < bv) return dir === "asc" ? -1 : 1;
    if (av > bv) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

// ── Component ───────────────────────────────────────────────────────────────

const Accounts = () => {
  const { user } = useAuth();
  const [ownerTab, setOwnerTab] = useState<"all" | "mine" | "clients">("all");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const [proxyPoolOpen, setProxyPoolOpen] = useState(false);
  const [proxyPoolAddMode, setProxyPoolAddMode] = useState(false);
  const [converterOpen, setConverterOpen] = useState(false);
  const [managementOpen, setManagementOpen] = useState(false);
  const [managedAccount, setManagedAccount] = useState<Account | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [dbProxies, setDbProxies] = useState<DbProxy[]>([]);
  const [bulkProxyId, setBulkProxyId] = useState<number | "">("");
  const [showBulkProxy, setShowBulkProxy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ ids: number[]; label: string } | null>(null);
  const [busyAccountIds, setBusyAccountIds] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showFilter, setShowFilter] = useState(false);
  const { toast } = useToast();

  const openManagement = (acc: Account) => { setManagedAccount(acc); setManagementOpen(true); };

  const fetchAccounts = () => {
    setLoading(true);
    fetch("/api/accounts", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setAccounts(Array.isArray(data) ? data : []))
      .catch(() => {
        toast({ title: "Ошибка загрузки аккаунтов", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  };

  const fetchRunningTasks = () => {
    fetch("/api/tasks/busy-accounts", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.account_ids)) setBusyAccountIds(d.account_ids); })
      .catch(() => {});
  };

  useEffect(() => { fetchAccounts(); fetchRunningTasks(); }, []);

  const fetchDbProxies = async () => {
    const r = await fetch("/api/proxies", { credentials: "include" });
    const d = await r.json().catch(() => []);
    setDbProxies(Array.isArray(d) ? d : []);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const myId = user?.user_id;
  const filtered = accounts.filter(
    (a) =>
      (user?.is_admin
        ? ownerTab === "mine"    ? a.panel_user_id === myId
        : ownerTab === "clients" ? a.panel_user_id !== myId
        : true
        : true) &&
      (statusFilter === "" ||
        (statusFilter === "busy" ? busyAccountIds.includes(a.id) : getStatusKey(a.status) === statusFilter)) &&
      (
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        (a.phone || "").includes(search) ||
        (a.tg_name || "").toLowerCase().includes(search.toLowerCase())
      )
  );
  const sorted = sortAccounts(filtered, sortKey, sortDir);
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const paginated = sorted.slice((currentPage - 1) * perPage, currentPage * perPage);

  const allSelected = paginated.length > 0 && paginated.every((a) => selected.includes(a.id));
  const toggleAll = () => allSelected ? setSelected([]) : setSelected(paginated.map((a) => a.id));
  const toggleOne = (id: number) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  // Stat counts
  const counts = {
    active:    accounts.filter((a) => getStatusKey(a.status) === "active").length,
    busy:      busyAccountIds.length,
    banned:    accounts.filter((a) => getStatusKey(a.status) === "banned").length,
    spamblock: accounts.filter((a) => getStatusKey(a.status) === "spamblock").length,
    flood:     accounts.filter((a) => getStatusKey(a.status) === "flood").length,
    reauth:    accounts.filter((a) => getStatusKey(a.status) === "reauth").length,
    unknown:   accounts.filter((a) => getStatusKey(a.status) === "unknown").length,
  };

  const statCards = [
    { label: "Активные",      count: counts.active,    icon: UserCheck,    bg: "bg-emerald-500/15", iconColor: "text-emerald-500" },
    { label: "В работе",      count: counts.busy,      icon: Zap,          bg: "bg-blue-500/15",    iconColor: "text-blue-500" },
    { label: "Забаненные",    count: counts.banned,    icon: UserX,        bg: "bg-red-500/15",     iconColor: "text-red-500" },
    { label: "Спамблок",      count: counts.spamblock, icon: AlertTriangle,bg: "bg-orange-500/15",  iconColor: "text-orange-500" },
    { label: "Замороженные",  count: counts.flood,     icon: Snowflake,    bg: "bg-sky-500/15",     iconColor: "text-sky-500" },
    { label: "Реавторизация", count: counts.reauth,    icon: KeyRound,     bg: "bg-violet-500/15",  iconColor: "text-violet-500" },
  ];

  const doDeleteAccounts = async (ids: number[]) => {
    try {
      const res = await fetch("/api/accounts/bulk-delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ account_ids: ids }), credentials: "include" });
      const data = await res.json();
      toast({ title: `Удалено: ${data.deleted ?? 0}` });
      setSelected([]); fetchAccounts();
    } catch { toast({ title: "Ошибка удаления", variant: "destructive" }); }
  };

  const bulkAction = async (action: string) => {
    if (selected.length === 0) return;
    const ids = selected;
    if (action === "delete") {
      setConfirmDelete({ ids, label: `${ids.length} аккаунт${ids.length === 1 ? "" : ids.length < 5 ? "а" : "ов"}` });
      return;
    } else if (action === "test") {
      try {
        const res = await fetch("/api/accounts/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ account_ids: ids }), credentials: "include" });
        const data = await res.json();
        const results: { ok: boolean }[] = data.results ?? [];
        const okCount = results.filter(r => r.ok).length;
        const failCount = results.length - okCount;
        toast({ title: `Проверено: ${okCount} OK, ${failCount} ошибок` });
        fetchAccounts();
      } catch { toast({ title: "Ошибка проверки", variant: "destructive" }); }
    } else if (action === "terminate") {
      try {
        await fetch("/api/accounts/terminate-sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ account_ids: ids }), credentials: "include" });
        toast({ title: "Сессии завершены" });
      } catch { toast({ title: "Ошибка", variant: "destructive" }); }
    } else if (action === "leave") {
      try {
        await fetch("/api/accounts/leave-chats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ account_ids: ids }), credentials: "include" });
        toast({ title: "Покинуты чаты" });
      } catch { toast({ title: "Ошибка", variant: "destructive" }); }
    } else if (action === "assign-proxy") {
      if (!bulkProxyId) { toast({ title: "Выберите прокси", variant: "destructive" }); return; }
      try {
        await fetch("/api/accounts/bulk-assign-proxy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ account_ids: ids, proxy_id: bulkProxyId }), credentials: "include" });
        toast({ title: `Прокси назначен ${ids.length} аккаунтам` });
        setSelected([]); setShowBulkProxy(false); fetchAccounts();
      } catch { toast({ title: "Ошибка", variant: "destructive" }); }
    }
  };

  const handleDownload = () => {
    const ids = selected.length > 0 ? selected : accounts.map((a) => a.id);
    window.open(`/api/accounts/download?ids=${ids.join(",")}`, "_blank");
  };

  // ── Sort header cell ────────────────────────────────────────────────────
  const SortTh = ({ col, label }: { col: SortKey; label: string }) => (
    <th
      className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => handleSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className={cn("h-3 w-3 transition-opacity", sortKey === col ? "opacity-100 text-primary" : "opacity-30")} />
      </span>
    </th>
  );

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px]">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Аккаунты</h1>
        <p className="text-sm text-muted-foreground">Управление Telegram аккаунтами</p>
      </div>

      {/* Owner tabs — только для админа */}
      {user?.is_admin && (
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl w-fit">
          {([
            ["all",     "Все",       accounts.length],
            ["mine",    "Мои",       accounts.filter(a => a.panel_user_id === myId).length],
            ["clients", "Клиентов",  accounts.filter(a => a.panel_user_id !== myId).length],
          ] as const).map(([id, label, cnt]) => (
            <button
              key={id}
              onClick={() => { setOwnerTab(id); setCurrentPage(1); }}
              className={cn(
                "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors",
                ownerTab === id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                ownerTab === id ? "bg-primary/15 text-primary" : "bg-muted/40 text-muted-foreground"
              )}>{cnt}</span>
            </button>
          ))}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="panel-card p-4 flex flex-col gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", s.bg)}>
              <s.icon className={cn("h-5 w-5", s.iconColor)} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground leading-none">{s.count}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wide">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => setImportOpen(true)}
          className="gap-2 bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-500/20"
        >
          <Upload className="h-4 w-4" />
          Импортировать Аккаунты
        </Button>
        <Button
          variant="outline"
          className="gap-2 border-violet-500/40 text-violet-500 hover:bg-violet-500/10 hover:border-violet-500/60"
          onClick={() => setConverterOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Добавить Аккаунт
        </Button>
        <Button
          variant="outline"
          className="gap-2 border-blue-500/40 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/60"
          onClick={() => { setProxyPoolAddMode(true); setProxyPoolOpen(true); }}
        >
          <Plus className="h-4 w-4" />
          Добавить прокси
        </Button>
        <Button
          variant="outline"
          className="gap-2 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/60"
          onClick={() => setProxyPoolOpen(true)}
        >
          <Server className="h-4 w-4" />
          Пул Прокси
        </Button>
      </div>

      {/* Search + filter bar */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени, номеру, username..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-10 h-9 bg-card border-border text-sm"
            />
          </div>
          <Button
            variant="outline" size="icon"
            className={cn("h-9 w-9 shrink-0 border-border", showFilter && "bg-primary/10 border-primary/40")}
            onClick={() => setShowFilter(v => !v)}
          >
            <Filter className={cn("h-4 w-4", showFilter ? "text-primary" : "text-muted-foreground")} />
          </Button>
          <Button variant="outline" size="sm" className="h-9 gap-1.5 border-border shrink-0" onClick={fetchAccounts}>
            <RefreshCw className="h-3.5 w-3.5" />
            Обновить
          </Button>
        </div>
        {showFilter && (
          <div className="flex flex-wrap gap-1.5 px-1">
            <button
              onClick={() => { setStatusFilter(""); setCurrentPage(1); }}
              className={cn("px-3 py-1 rounded-full text-xs font-medium border transition-all",
                statusFilter === "" ? "bg-primary/15 border-primary/40 text-primary" : "border-border/40 text-muted-foreground hover:bg-muted/40"
              )}
            >
              Все ({accounts.length})
            </button>
            {(Object.entries(STATUS_BADGE) as [string, typeof STATUS_BADGE[string]][]).map(([key, cfg]) => {
              const count = accounts.filter(a => getStatusKey(a.status) === key).length;
              if (count === 0) return null;
              return (
                <button
                  key={key}
                  onClick={() => { setStatusFilter(statusFilter === key ? "" : key); setCurrentPage(1); }}
                  className={cn("inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-all",
                    statusFilter === key ? cfg.className : "border-border/40 text-muted-foreground hover:bg-muted/40"
                  )}
                >
                  {cfg.label} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div className="space-y-2 px-4 py-3 rounded-xl bg-primary/8 border border-primary/20">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-primary font-semibold">Выбрано: {selected.length}</span>
            <div className="flex flex-wrap gap-1.5 ml-auto">
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => bulkAction("test")}><CheckCircle2 className="h-3.5 w-3.5" /> Проверить</Button>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={handleDownload}><Download className="h-3.5 w-3.5" /> Скачать</Button>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5"
                onClick={() => { setShowBulkProxy(v => !v); fetchDbProxies(); }}>
                <Server className="h-3.5 w-3.5" /> Назначить прокси
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => bulkAction("terminate")}><Shield className="h-3.5 w-3.5" /> Завершить сессии</Button>
              <Button size="sm" variant="destructive" className="h-8 text-xs gap-1.5" onClick={() => bulkAction("delete")}><Trash2 className="h-3.5 w-3.5" /> Удалить</Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground" onClick={() => { setSelected([]); setShowBulkProxy(false); }}>Снять</Button>
            </div>
          </div>
          {showBulkProxy && (
            <div className="pt-1 space-y-2">
              {dbProxies.length === 0 ? (
                <p className="text-xs text-muted-foreground px-1">Нет доступных прокси. Добавьте прокси в пул.</p>
              ) : (
                <div className="grid gap-1 max-h-40 overflow-y-auto">
                  {dbProxies.map(p => (
                    <button key={p.id} type="button" onClick={() => setBulkProxyId(p.id)}
                      className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-xs transition-all",
                        bulkProxyId === p.id
                          ? "border-emerald-500/40 bg-emerald-500/5"
                          : "border-border/30 bg-muted/20 hover:bg-muted/40"
                      )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", bulkProxyId === p.id ? "bg-emerald-400" : "bg-muted-foreground/30")} />
                      <span className={cn("font-medium", bulkProxyId === p.id ? "text-emerald-400" : "text-foreground")}>
                        {p.name || `${p.host}:${p.port}`}
                      </span>
                      <span className="text-muted-foreground font-mono ml-1">{p.host}:{p.port}</span>
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">{p.proxy_type.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              )}
              <Button size="sm"
                className="h-8 text-xs gap-1.5 bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border border-emerald-500/25"
                variant="ghost"
                disabled={!bulkProxyId}
                onClick={() => bulkAction("assign-proxy")}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Применить
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="panel-card overflow-hidden">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["w-10", "w-12", "", "", "", "", "", "", "", ""].map((w, i) => (
                    <th key={i} className={cn("px-4 py-3", w)}><Skeleton className="h-3 w-16" /></th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-4 rounded" /></td>
                    <td className="px-3 py-3.5"><Skeleton className="w-9 h-9 rounded-full" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-3.5 w-28" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-3.5 w-24" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-3.5 w-16" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-3.5 w-16" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-3.5 w-24" /></td>
                    <td className="px-4 py-3.5 text-right"><Skeleton className="h-7 w-16 ml-auto rounded-lg" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Inbox className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">Аккаунты не найдены</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Импортируйте .session файлы чтобы начать</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 w-10">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider w-12">Аватар</th>
                  <SortTh col="name"   label="Имя" />
                  <SortTh col="phone"  label="Телефон" />
                  <SortTh col="status" label="Статус" />
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Статус работы</th>
                  <SortTh col="days"   label="Прогрев" />
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Health</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Прокси</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {paginated.map((acc) => {
                  const stKey = getStatusKey(acc.status);
                  const st = STATUS_BADGE[stKey] ?? STATUS_BADGE.unknown;
                  const StatusIcon = st.icon;
                  const wm = warmingLabel(acc.days);
                  const hasProxy = !!(acc.proxy_id || acc.proxy_name);

                  return (
                    <tr
                      key={acc.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => openManagement(acc)}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selected.includes(acc.id)} onCheckedChange={() => toggleOne(acc.id)} />
                      </td>

                      {/* Avatar */}
                      <td className="px-3 py-3.5">
                        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
                          {acc.has_avatar ? (
                            <img
                              src={`/avatars/${acc.id}.jpg`}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                if (e.currentTarget.parentElement) {
                                  const el = e.currentTarget.parentElement;
                                  el.className = cn("w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0", getAvatarColor(acc.id));
                                  el.textContent = getInitials(acc.name);
                                }
                              }}
                            />
                          ) : (
                            <div className={cn("w-full h-full flex items-center justify-center text-xs font-bold", getAvatarColor(acc.id))}>
                              {getInitials(acc.name)}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-semibold text-foreground leading-tight">{acc.name}</p>
                        {acc.tg_name && <p className="text-xs text-muted-foreground">@{acc.tg_name}</p>}
                        {acc.category && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20">
                            {acc.category}
                          </span>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-foreground font-mono">{acc.phone}</span>
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3.5">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", st.className)}>
                          <StatusIcon className="h-3 w-3" />
                          {st.label}
                        </span>
                      </td>

                      {/* Work status */}
                      <td className="px-4 py-3.5">
                        {busyAccountIds.includes(acc.id) ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/12 text-blue-500 dark:text-blue-400 border border-blue-500/25">
                            <Zap className="h-3 w-3" />
                            В работе
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/12 text-emerald-500 dark:text-emerald-400 border border-emerald-500/25">
                            <CheckCircle2 className="h-3 w-3" />
                            Свободен
                          </span>
                        )}
                      </td>

                      {/* Warming */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Flame className={cn("h-3.5 w-3.5", wm.color)} />
                          <span className={cn("text-xs font-medium", wm.color)}>{wm.label}</span>
                          <span className="text-xs text-muted-foreground">· {acc.days ?? 0}д</span>
                        </div>
                      </td>

                      {/* Health */}
                      <td className="px-4 py-3.5">
                        <HealthBadge score={acc.health_score} />
                      </td>

                      {/* Proxy */}
                      <td className="px-4 py-3.5">
                        {hasProxy ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/12 text-emerald-500 dark:text-emerald-400 border border-emerald-500/25 font-mono">
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                            {acc.proxy_host || acc.proxy_label || "Прокси"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted/60 text-muted-foreground border border-border">
                            Нет прокси
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            title="Проверить"
                            onClick={async () => {
                              await fetch("/api/accounts/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ account_ids: [acc.id] }), credentials: "include" });
                              fetchAccounts();
                            }}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            title="Скачать .session"
                            onClick={() => window.open(`/api/accounts/${acc.id}/export`, "_blank")}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            title="Управление"
                            onClick={() => openManagement(acc)}
                          >
                            <Settings2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Удалить"
                            onClick={() => setConfirmDelete({ ids: [acc.id], label: acc.name || acc.phone })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {sorted.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Показано{" "}
            <span className="text-foreground font-medium">
              {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, sorted.length)}
            </span>{" "}
            из{" "}
            <span className="text-foreground font-medium">{sorted.length}</span>{" "}
            аккаунтов
          </p>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage <= 1} onClick={() => setCurrentPage(1)}>
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-semibold text-sm min-w-[2rem] text-center">
              {currentPage}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(totalPages)}>
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <select
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="h-8 bg-card border border-border rounded-lg px-2 text-sm text-foreground cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={v => { if (!v) setConfirmDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить аккаунты?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы собираетесь удалить <strong>{confirmDelete?.label}</strong>. Это действие необратимо — сессия будет уничтожена.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => { if (confirmDelete) { doDeleteAccounts(confirmDelete.ids); setConfirmDelete(null); } }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImportAccountsModal open={importOpen} onOpenChange={setImportOpen} onImported={fetchAccounts} />
      <ProxyPoolModal open={proxyPoolOpen} onOpenChange={(v) => { setProxyPoolOpen(v); if (!v) setProxyPoolAddMode(false); }} initialShowAdd={proxyPoolAddMode} />
      <ConverterModal open={converterOpen} onOpenChange={setConverterOpen} onImported={fetchAccounts} />
      <AccountManagementSheet open={managementOpen} onOpenChange={setManagementOpen} account={managedAccount} onSaved={fetchAccounts} />
    </div>
  );
};

export default Accounts;
