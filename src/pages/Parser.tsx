import { useCallback, useEffect, useRef, useState } from "react";
import { useRunningTask } from "@/hooks/useRunningTask";
import {
  ClipboardList, Play, Square, RefreshCw, Download, Search,
  ChevronDown, ChevronRight, Users, Settings2, Terminal, BarChart3,
  ArrowRight, MessageCircle, UserCheck, Hash, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import AccountSelector, { SelectorAccount } from "@/components/dashboard/AccountSelector";
import { BookOpen, Trash2 } from "lucide-react";

interface LibEntry { id: string; channel: string; mode: string; date: string; count: number; }

interface ParsedUser {
  id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  premium?: boolean;
  comments?: number;
  title?: string;
  type?: string;
}

type Account = SelectorAccount;

const MODES = [
  { key: "comments",  label: "Комментаторы", icon: MessageCircle, desc: "Активные комментаторы из постов канала" },
  { key: "members",   label: "Участники",    icon: Users,         desc: "Список участников группы/канала" },
  { key: "chat",      label: "Авторы чата",  icon: UserCheck,     desc: "Пользователи, писавшие в чат" },
  { key: "search",    label: "Поиск",        icon: Hash,          desc: "Поиск каналов/групп по ключевому слову" },
];

const Section = ({
  title, icon: Icon, iconBg, children, defaultOpen = true,
}: {
  title: string; icon: React.ElementType; iconBg: string;
  children: React.ReactNode; defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="panel-card rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/20 transition-colors"
      >
        <div className={cn("w-7 h-7 rounded-md flex items-center justify-center", iconBg)}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold text-foreground flex-1 text-left">{title}</span>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-border/30 pt-4">{children}</div>}
    </div>
  );
};

const Parser = () => {
  const { toast } = useToast();

  // Mode
  const [mode, setMode] = useState("comments");

  // Settings
  const [channel, setChannel]                 = useState("");
  const [keyword, setKeyword]                 = useState("");
  const [searchLimit, setSearchLimit]         = useState(50);
  const [daysBack, setDaysBack]               = useState(30);
  const [minComments, setMinComments]         = useState(1);
  const [commentsPerPost, setCommentsPerPost] = useState(100);
  const [onlyUsername, setOnlyUsername]       = useState(true);

  // Accounts
  const [accounts, setAccounts]   = useState<Account[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Task
  const { taskId, taskStatus, setTaskId, setTaskStatus, busyAccountIds } = useRunningTask("parsing");

  // Logs
  const [logLines, setLogLines] = useState<string[]>([]);
  const logsRef = useRef<HTMLDivElement>(null);

  // Results
  const [users, setUsers]           = useState<ParsedUser[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [resultMode, setResultMode] = useState("");
  const [resultSearch, setResultSearch] = useState("");
  const [exporting, setExporting]   = useState(false);
  const [exportMsg, setExportMsg]   = useState("");

  // Library
  const [libEntries, setLibEntries] = useState<LibEntry[]>([]);
  const [libDeleting, setLibDeleting] = useState<string | null>(null);
  const [libExporting, setLibExporting] = useState<string | null>(null);
  const loadLibrary = useCallback(async () => {
    const r = await fetch("/api/tools/parsing/results", { credentials: "include" }).catch(() => null);
    if (r?.ok) setLibEntries(await r.json());
  }, []);
  const deleteLibEntry = async (id: string) => {
    setLibDeleting(id);
    await fetch(`/api/tools/parsing/results/${encodeURIComponent(id)}`, { method: "DELETE", credentials: "include" }).catch(() => null);
    setLibEntries(prev => prev.filter(e => e.id !== id));
    setLibDeleting(null);
  };
  const exportLibToInviting = async (id: string) => {
    setLibExporting(id);
    const r = await fetch(`/api/tools/parsing/results/${encodeURIComponent(id)}/export-to-inviting`, {
      method: "POST", credentials: "include",
    }).catch(() => null);
    if (r?.ok) {
      const d = await r.json();
      toast({ title: `✓ Загружено ${d.count} польз. в очередь инвайтинга` });
    } else {
      toast({ title: "Ошибка экспорта", variant: "destructive" });
    }
    setLibExporting(null);
  };
  const MODE_LABELS: Record<string, string> = { members: "участники", comments: "комментарии", chat: "чат", search: "поиск" };

  const loadResults = useCallback(async () => {
    const r = await fetch("/api/tools/parsing/result", { credentials: "include" }).catch(() => null);
    if (!r?.ok) return;
    const data = await r.json();
    setUsers(Array.isArray(data.users) ? data.users : []);
    setUsersCount(data.count ?? 0);
    setResultMode(data.mode ?? "");
  }, []);

  // Load accounts
  useEffect(() => {
    fetch("/api/accounts", { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setAccounts(list);
        const active = list.find((a: Account) => a.status === "active" || a.status === "ok");
        if (active) setSelectedIds([active.id]);
        else if (list.length > 0) setSelectedIds([list[0].id]);
      })
      .catch(() => {});
    loadResults();
    loadLibrary();
  }, [loadResults, loadLibrary]);

  // SSE logs
  useEffect(() => {
    if (!taskId || taskStatus !== "running") return;
    const es = new EventSource(`/api/tasks/${taskId}/logs`);
    es.onmessage = (e) => setLogLines(prev => [...prev.slice(-500), e.data]);
    es.addEventListener("done", () => { es.close(); setTaskStatus("completed"); loadResults(); loadLibrary(); });
    es.onerror = () => { es.close(); setTaskStatus("failed"); };
    return () => es.close();
  }, [taskId, taskStatus]);

  useEffect(() => {
    logsRef.current?.scrollTo({ top: logsRef.current.scrollHeight, behavior: "smooth" });
  }, [logLines]);

  const handleStart = async () => {
    const target = mode === "search" ? keyword.trim() : channel.trim();
    if (!target) return;
    setLogLines([]);
    setTaskId(null);
    setTaskStatus("running");

    const r = await fetch("/api/tools/parsing/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        mode,
        channel: mode !== "search" ? channel.trim() : undefined,
        keyword: mode === "search" ? keyword.trim() : undefined,
        search_limit: mode === "search" ? searchLimit : undefined,
        days_back: mode !== "search" ? daysBack : undefined,
        min_comments: minComments,
        comments_per_post: commentsPerPost,
        only_with_username: onlyUsername,
        account_id: selectedIds[0] ?? null,
      }),
    });
    if (!r.ok) {
      try {
        const err = await r.json();
        toast({ title: "Ошибка запуска", description: err.detail || "Не удалось запустить парсинг", variant: "destructive" });
      } catch { toast({ title: "Ошибка запуска", description: "Не удалось запустить парсинг", variant: "destructive" }); }
      setTaskStatus("failed");
      return;
    }
    const data = await r.json();
    if (data.error || data.detail) {
      toast({ title: "Ошибка", description: data.error || data.detail, variant: "destructive" });
      setTaskStatus("idle");
      return;
    }
    setTaskId(data.task_id);
  };

  const handleStop = async () => {
    if (!taskId) return;
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE", credentials: "include" });
    setTaskStatus("stopped");
  };

  const handleExport = async () => {
    setExporting(true);
    setExportMsg("");
    const r = await fetch("/api/tools/parsing/export", { method: "POST", credentials: "include" }).catch(() => null);
    if (r?.ok) {
      const d = await r.json();
      setExportMsg(`✓ Экспортировано ${d.count} пользователей в очередь инвайтинга`);
    } else {
      setExportMsg("Ошибка экспорта — сначала запустите парсинг");
    }
    setExporting(false);
  };

  const isRunning = taskStatus === "running";
  const currentMode = MODES.find(m => m.key === mode) ?? MODES[0];
  const ModeIcon = currentMode.icon;

  const filteredUsers = users.filter(u => {
    if (!resultSearch) return true;
    const s = resultSearch.toLowerCase();
    return (u.username || "").toLowerCase().includes(s) ||
           (u.first_name || "").toLowerCase().includes(s) ||
           (u.title || "").toLowerCase().includes(s);
  });

  const statusDot: Record<string, string> = {
    idle: "bg-muted-foreground", running: "bg-emerald-400 animate-pulse",
    completed: "bg-primary", failed: "bg-red-400", stopped: "bg-amber-400",
  };
  const statusLabel: Record<string, string> = {
    idle: "Ожидание", running: "Работает", completed: "Завершён",
    failed: "Ошибка", stopped: "Остановлен",
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1280px]">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Парсер</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Сбор пользователей из каналов и групп Telegram</p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 flex-wrap">
        {MODES.map(m => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all",
              mode === m.key
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-muted/20"
            )}
          >
            <m.icon className="h-3.5 w-3.5" />
            {m.label}
          </button>
        ))}
      </div>

      {/* Settings */}
      <Section title="Настройки парсинга" icon={Settings2} iconBg="bg-emerald-500/20 text-emerald-400">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-3">
            {/* Account selector */}
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Аккаунт для парсинга</label>
              <AccountSelector
                accounts={accounts}
                selectedIds={selectedIds}
                onChange={ids => {
                  // Одиночный выбор — берём последний нажатый
                  const newId = ids.find(id => !selectedIds.includes(id));
                  if (newId !== undefined) setSelectedIds([newId]);
                  else setSelectedIds(ids.length === 0 ? [] : [ids[ids.length - 1]]);
                }}
                label="для парсинга"
                busyIds={busyAccountIds}
              />
            </div>

            {/* Channel / keyword input */}
            {mode === "search" ? (
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Ключевое слово *</label>
                <Input
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  placeholder="крипта, инвестиции..."
                  className="h-8 text-xs bg-background border-border"
                />
              </div>
            ) : (
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Канал / группа *</label>
                <Input
                  value={channel}
                  onChange={e => setChannel(e.target.value)}
                  placeholder="@channel или https://t.me/..."
                  className="h-8 text-xs bg-background border-border"
                />
              </div>
            )}

            {mode === "search" ? (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Лимит результатов</label>
                <Input type="number" min={1} max={200} value={searchLimit}
                  onChange={e => setSearchLimit(Number(e.target.value))}
                  className="h-8 text-xs bg-background border-border" />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground mb-1 block">Глубина (дней назад)</label>
                <Input type="number" min={1} max={365} value={daysBack}
                  onChange={e => setDaysBack(Number(e.target.value))}
                  className="h-8 text-xs bg-background border-border" />
                {daysBack > 90 ? (
                  <p className="text-[11px] text-red-400/80 flex items-center gap-1">
                    ⚠️ Более 90 дней — задача займёт <strong>1–3 часа</strong>
                  </p>
                ) : daysBack > 30 ? (
                  <p className="text-[11px] text-amber-400/80 flex items-center gap-1">
                    ⏱ Примерное время: <strong>20–60 мин</strong>
                  </p>
                ) : daysBack > 14 ? (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    ⏱ Примерное время: <strong>5–20 мин</strong>
                  </p>
                ) : null}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {mode === "comments" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Мин. комментариев на польз.</label>
                  <Input type="number" min={1} value={minComments}
                    onChange={e => setMinComments(Number(e.target.value))}
                    className="h-8 text-xs bg-background border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Комментариев на пост</label>
                  <Input type="number" min={10} max={500} value={commentsPerPost}
                    onChange={e => setCommentsPerPost(Number(e.target.value))}
                    className="h-8 text-xs bg-background border-border" />
                </div>
              </div>
            )}

            {mode !== "search" && (
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-xs font-medium text-foreground">Только с @username</p>
                  <p className="text-[11px] text-muted-foreground">Пропускать пользователей без username</p>
                </div>
                <button
                  onClick={() => setOnlyUsername(!onlyUsername)}
                  className={cn("w-9 h-5 rounded-full transition-colors relative shrink-0", onlyUsername ? "bg-primary" : "bg-muted")}
                >
                  <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                    style={onlyUsername ? { left: "18px" } : { left: "2px" }} />
                </button>
              </div>
            )}

            {/* Mode description */}
            <div className="rounded-lg border border-border/30 bg-muted/10 p-3">
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <ModeIcon className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                {currentMode.desc}
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Launch */}
      <Section title="Запуск" icon={Play} iconBg="bg-primary/20 text-primary">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <ModeIcon className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-foreground">Режим: <strong>{currentMode.label}</strong></span>
            </div>
            {mode !== "search" && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <span className="text-xs text-foreground">Канал: <strong>{channel || "не указан"}</strong></span>
              </div>
            )}
            {mode === "search" && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <span className="text-xs text-foreground">Слово: <strong>{keyword || "не указано"}</strong></span>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border/50">
              <span className={cn("w-2 h-2 rounded-full", statusDot[taskStatus] ?? "bg-muted-foreground")} />
              <span className="text-xs text-foreground">Статус: <strong>{statusLabel[taskStatus] ?? taskStatus}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isRunning ? (
              <Button
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6"
                onClick={handleStart}
                disabled={accounts.length === 0 || (mode === "search" ? !keyword.trim() : !channel.trim())}
              >
                <Play className="h-4 w-4" /> Запустить парсинг
              </Button>
            ) : (
              <Button
                variant="outline"
                className="gap-2 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 px-6"
                onClick={handleStop}
              >
                <Square className="h-4 w-4" /> Остановить
              </Button>
            )}
            {(taskStatus === "completed" || taskStatus === "stopped") && (
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground" onClick={loadResults}>
                <RefreshCw className="h-3.5 w-3.5" /> Обновить результаты
              </Button>
            )}
          </div>
        </div>
      </Section>

      {/* Logs */}
      <Section title="Журнал выполнения" icon={Terminal} iconBg="bg-muted-foreground/20 text-muted-foreground" defaultOpen={false}>
        <div className="bg-muted/20 rounded-lg border border-border/30 h-52 overflow-y-auto font-mono text-[11px] p-3 space-y-0.5" ref={logsRef}>
          {logLines.length === 0 ? (
            <p className="text-muted-foreground/40 text-center py-8">Запустите парсинг чтобы увидеть логи</p>
          ) : logLines.map((l, i) => {
            const isError = l.includes("ОШИБК") || l.includes("ERROR");
            const isOk = l.startsWith("✅") || l.includes("Готово") || l.includes("Сохранено");
            return (
              <div key={i} className={cn("leading-5", isError ? "text-red-400" : isOk ? "text-emerald-400" : "text-muted-foreground")}>
                {l}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Results */}
      <Section
        title={`Результаты${usersCount > 0 ? ` (${usersCount})` : ""}${resultMode ? ` · ${resultMode}` : ""}`}
        icon={BarChart3} iconBg="bg-violet-500/20 text-violet-400" defaultOpen={false}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={resultSearch}
                onChange={e => setResultSearch(e.target.value)}
                placeholder="Поиск в результатах..."
                className="pl-8 h-8 text-xs bg-background border-border"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {resultMode !== "search" && (
                <Button
                  size="sm"
                  className="h-8 text-xs bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 gap-1.5"
                  onClick={handleExport}
                  disabled={exporting || users.length === 0}
                >
                  {exporting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                  В инвайтинг
                </Button>
              )}
              {users.length > 0 && (
                <>
                  <a href="/api/tools/parsing/export-txt" download="parsed_users.txt">
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                      <Download className="h-3.5 w-3.5" /> TXT
                    </Button>
                  </a>
                  <a href="/api/tools/parsing/export-csv" download="parsed_users.csv">
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                      <Download className="h-3.5 w-3.5" /> CSV
                    </Button>
                  </a>
                  <a href="/api/tools/parsing/export-json" download="parsed_users.json">
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                      <Download className="h-3.5 w-3.5" /> JSON
                    </Button>
                  </a>
                </>
              )}
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={loadResults}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {exportMsg && (
            <p className={cn("text-xs px-3 py-2 rounded-md", exportMsg.startsWith("✓") ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
              {exportMsg}
            </p>
          )}

          {filteredUsers.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground/50">
              {users.length === 0 ? "Нет результатов — запустите парсинг" : "Ничего не найдено"}
            </p>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {filteredUsers.slice(0, 200).map((u, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-background/50 border border-border/30 hover:border-border/60 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <Users className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">
                      {u.title || u.first_name || u.username || `ID ${u.id}`}
                      {u.premium && <span className="ml-1.5 text-[10px] text-amber-400">Premium</span>}
                    </p>
                    {u.username && <p className="text-[11px] text-muted-foreground">@{u.username}</p>}
                    {u.type && <p className="text-[11px] text-muted-foreground">{u.type}</p>}
                  </div>
                  {u.comments !== undefined && (
                    <span className="text-[11px] text-muted-foreground shrink-0">{u.comments} комм.</span>
                  )}
                  {u.phone && <span className="text-[11px] text-muted-foreground shrink-0">{u.phone}</span>}
                </div>
              ))}
              {filteredUsers.length > 200 && (
                <p className="text-center text-[11px] text-muted-foreground py-2">
                  Показано 200 из {filteredUsers.length}
                </p>
              )}
            </div>
          )}
        </div>
      </Section>

      {/* Saved results library */}
      <Section title={`Библиотека результатов${libEntries.length > 0 ? ` (${libEntries.length})` : ""}`} icon={BookOpen} iconBg="bg-amber-500/20 text-amber-400" defaultOpen={false}>
        <div className="space-y-2">
          {libEntries.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Нет сохранённых результатов — они появятся после следующего парсинга</p>
          ) : (
            <div className="space-y-1.5">
              {libEntries.map(e => (
                <div key={e.id} className="rounded-lg bg-background/50 border border-border/30 hover:border-border/60 transition-colors overflow-hidden">
                  {/* Row header */}
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-foreground truncate max-w-[180px]">
                          {e.channel ? `@${e.channel.replace(/^@/, "")}` : "—"}
                        </span>
                        <span className="text-[10px] bg-muted/40 text-muted-foreground rounded px-1.5 py-0.5">
                          {MODE_LABELS[e.mode] ?? e.mode}
                        </span>
                        <span className="text-[11px] text-emerald-400 font-medium">{e.count} польз.</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {(() => { try { return new Date(e.date).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch { return e.date; } })()}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteLibEntry(e.id)}
                      disabled={libDeleting === e.id}
                      className="text-muted-foreground hover:text-red-400 transition-colors flex-shrink-0 p-1"
                      title="Удалить"
                    >
                      {libDeleting === e.id
                        ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  {/* Action buttons */}
                  <div className="flex gap-1.5 px-3 pb-2.5 border-t border-border/20 pt-2">
                    <a
                      href={`/api/tools/parsing/results/${encodeURIComponent(e.id)}/download`}
                      download
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                    >
                      <Download className="h-3 w-3" /> Скачать TXT
                    </a>
                    <button
                      onClick={() => exportLibToInviting(e.id)}
                      disabled={libExporting === e.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                      {libExporting === e.id
                        ? <RefreshCw className="h-3 w-3 animate-spin" />
                        : <Send className="h-3 w-3" />}
                      → Инвайтинг
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 mt-1" onClick={loadLibrary}>
            <RefreshCw className="h-3 w-3" /> Обновить
          </Button>
        </div>
      </Section>
    </div>
  );
};

export default Parser;
