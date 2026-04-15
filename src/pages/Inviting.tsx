import { useState, useEffect, useRef } from "react";
import { useRunningTask } from "@/hooks/useRunningTask";
import ToolHeader from "@/components/dashboard/ToolHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AccountSelector from "@/components/dashboard/AccountSelector";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Send, Shield, Upload,
  Download, CheckCircle2, AlertTriangle, Clock, Users, Target, BarChart3,
  Zap, Filter, Pause, Play, ChevronDown, ChevronRight, Settings, Eye, Search, X, Trash2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import ParsedResultSelector from "@/components/dashboard/ParsedResultSelector";
import AiProtectionPanel from "@/components/dashboard/AiProtectionPanel";

import { useNavigate } from "@tanstack/react-router";

// ─── types ───
interface Account {
  id: number; name: string; phone: string; username?: string; status: string;
}

interface LogLine { time: string; msg: string; type: string; }
interface ResultRow { username: string; phone: string; status: string; account: string; time: string; }

const Inviting = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Real data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccIds, setSelectedAccIds] = useState<number[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);

  // Queue stats
  const [inQueue, setInQueue] = useState(0);
  const [invitedTotal, setInvitedTotal] = useState(0);
  const [uploadedCount, setUploadedCount] = useState<number | null>(null);

  // Task state
  const { taskId, taskStatus, setTaskId, setTaskStatus, busyAccountIds } = useRunningTask("inviting");
  const running = taskStatus === "running";
  const setRunning = (v: boolean) => setTaskStatus(v ? "running" : "idle");
  const [inviteMode, setInviteMode] = useState("parallel");
  const [inviteMethod, setInviteMethod] = useState("normal");
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  // Reconnect logs when taskId restored after page refresh
  useEffect(() => {
    if (taskId && running && !esRef.current) {
      const es = new EventSource(`/api/tasks/${taskId}/logs`);
      esRef.current = es;
      es.onmessage = e => { if (e.data) addLog(e.data); };
      es.addEventListener("done", () => { es.close(); esRef.current = null; setRunning(false); });
      es.onerror = () => { es.close(); esRef.current = null; setRunning(false); };
    }
    return () => { esRef.current?.close(); esRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, running]);

  // target group
  const [targetGroup, setTargetGroup] = useState("");
  const targetValid = /^(@|https:\/\/t\.me\/)/.test(targetGroup.trim());

  // source tabs
  const [sourceTab, setSourceTab] = useState("file");
  const [manualUsers, setManualUsers] = useState("");

  // settings
  const [aiProtection, setAiProtection] = useState(false);
  const [invPerDay, setInvPerDay] = useState(30);
  const [invPerSession, setInvPerSession] = useState(10);
  const [autoSwitch, setAutoSwitch] = useState(true);
  const [filters, setFilters] = useState({ bots: true, deleted: true, blocked: true, noRepeat: true, onlyUsername: false, onlyPhoto: false, onlyPremium: false });
  const [delayPreset, setDelayPreset] = useState("recommended");
  const [delayInvite, setDelayInvite] = useState([60]);
  const [delaySession, setDelaySession] = useState([5]);
  const [autoPause, setAutoPause] = useState(true);
  const [limitDetector, setLimitDetector] = useState(true);
  const [floodPause, setFloodPause] = useState(1440);
  const [logFilter, setLogFilter] = useState("all");

  // Users list modal
  const [showUsersList, setShowUsersList] = useState(false);
  const [usersList, setUsersList] = useState<string[]>([]);
  const [invitedList, setInvitedList] = useState<string[]>([]);
  const [usersListTab, setUsersListTab] = useState<"queue" | "invited">("queue");
  const [usersSearch, setUsersSearch] = useState("");
  const [loadingList, setLoadingList] = useState(false);

  const openUsersList = async () => {
    setShowUsersList(true);
    setLoadingList(true);
    try {
      const r = await fetch("/api/tools/inviting/users-list", { credentials: "include" });
      const d = await r.json();
      setUsersList(Array.isArray(d.users) ? d.users : []);
      setInvitedList(Array.isArray(d.invited) ? d.invited : []);
    } catch {
      setUsersList([]);
      setInvitedList([]);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchQueueStats = () => {
    fetch("/api/tools/inviting/queue-stats", { credentials: "include" })
      .then(r => r.json())
      .then(data => { setInQueue(data.in_queue ?? 0); setInvitedTotal(data.invited_total ?? 0); })
      .catch(() => {});
  };

  // Load accounts and queue stats on mount
  useEffect(() => {
    fetch("/api/accounts", { credentials: "include" })
      .then(r => r.json())
      .then(data => setAccounts(Array.isArray(data) ? data : data.accounts ?? []))
      .catch(() => {})
      .finally(() => setLoadingAccounts(false));
    fetchQueueStats();
    const onVisible = () => { if (document.visibilityState === "visible") fetchQueueStats(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  useEffect(() => { if (logs.length > 0) logsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  const addLog = (msg: string) => {
    const t = new Date().toTimeString().slice(0, 8);

    // [RESULT_JSON] — структурированная строка от wrapper (конец задачи, Bug-4 fix)
    if (msg.startsWith("[RESULT_JSON]")) {
      try {
        const d = JSON.parse(msg.slice("[RESULT_JSON]".length).trim());
        setResults(p => {
          // Дедупликация: не добавляем если уже есть по user+status
          if (p.some(r => r.username === d.user && r.status === d.status)) return p;
          return [...p, { username: d.user, phone: "", status: d.status, account: d.account || "", time: t }];
        });
      } catch { /* ignore malformed */ }
      return; // не показывать в журнале
    }

    const lower = msg.toLowerCase();
    const type = ((lower.includes("ошиб") && !/ошибок:\s*0/.test(lower)) || lower.includes("error")) ? "error"
      : lower.includes("flood") ? "flood"
      : lower.includes("приглашён") || msg.includes("✓") ? "success" : "info";
    setLogs(p => [...p, { time: t, msg, type }]);

    // Real-time результаты из лог-строк inviter.py (Bug-4 fix)
    const acctMatch = msg.match(/^\[([^\]]+)\]/);
    const acct = acctMatch ? acctMatch[1] : "";
    // "✓ Успешно добавлен: @username"
    const mOk = msg.match(/✓\s+Успешно добавлен:\s*(\S+)/);
    if (mOk) { setResults(p => [...p, { username: mOk[1], phone: "", status: "invited", account: acct, time: t }]); return; }
    // "⊘ Пользователь @username уже участник"
    const mAl = msg.match(/Пользователь\s+(\S+)\s+уже участник/);
    if (mAl) { setResults(p => [...p, { username: mAl[1], phone: "", status: "already", account: acct, time: t }]); return; }
    // "✗ Ошибка при добавлении @username:"
    const mErr = msg.match(/Ошибка при добавлении\s+(\S+):/);
    if (mErr) { setResults(p => [...p, { username: mErr[1], phone: "", status: "error", account: acct, time: t }]); return; }
  };

  const handleStart = async () => {
    if (!targetGroup || !targetValid) { addLog("❌ Укажите целевую группу (@group или https://t.me/group)"); return; }
    if (selectedAccIds.length === 0) { addLog("❌ Выберите аккаунты для инвайтинга"); toast({ title: "Выберите аккаунты", variant: "destructive" }); return; }

    // Auto-upload if user typed manually but didn't click "Загрузить список"
    if (sourceTab === "manual" && manualUsers.trim()) {
      const blob = new Blob([manualUsers], { type: "text/plain" });
      const fd = new FormData();
      fd.append("file", blob, "users.txt");
      const upRes = await fetch("/api/tools/inviting/upload-users", { method: "POST", credentials: "include", body: fd });
      const upData = await upRes.json();
      if (upData.ok) { setUploadedCount(upData.count); setInQueue(upData.count); }
      else { addLog("❌ Не удалось загрузить список пользователей"); return; }
    }

    if (inQueue === 0) { addLog("❌ База пользователей пуста — загрузите список"); return; }

    const res = await fetch("/api/tools/inviting/start", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target_chat: targetGroup,
        mode: inviteMode,
        method: inviteMethod,
        account_ids: selectedAccIds,
        inv_per_day: invPerDay,
        inv_per_session: invPerSession,
        delay_invite_sec: delayInvite[0],
        delay_session_min: delaySession[0],
        auto_pause: autoPause,
        limit_detector: limitDetector,
        flood_pause_min: floodPause,
        filters,
        ai_protection: aiProtection,
        auto_switch: autoSwitch,
      }),
    });
    const data = await res.json();
    if (data.error || data.detail) {
      const msg = data.error || data.detail;
      addLog("❌ " + msg);
      toast({ title: "Ошибка запуска", description: msg, variant: "destructive" });
      return;
    }
    const tid = data.task_id;
    if (!tid) { addLog("❌ Неожиданный ответ сервера"); return; }
    setTaskId(tid); setRunning(true); setLogs([]);
    addLog("✅ Задача запущена: " + tid);
    toast({ title: "Инвайтинг запущен" });
    // EventSource будет создан автоматически через useEffect
  };

  const handleStop = async () => {
    if (!taskId) return;
    esRef.current?.close();
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE", credentials: "include" });
    setRunning(false); addLog("⛔ Задача остановлена");
    toast({ title: "Инвайтинг остановлен" });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/tools/inviting/upload-users", { method: "POST", credentials: "include", body: fd });
    const data = await res.json();
    if (data.ok) { setUploadedCount(data.count); setInQueue(data.count); toast({ title: `Загружено ${data.count} пользователей` }); }
    e.target.value = "";
  };

  const handleManualUpload = async () => {
    if (!manualUsers.trim()) { toast({ title: "Список пользователей пуст", variant: "destructive" }); return; }
    const blob = new Blob([manualUsers], { type: "text/plain" });
    const fd = new FormData();
    fd.append("file", blob, "users.txt");
    const res = await fetch("/api/tools/inviting/upload-users", { method: "POST", credentials: "include", body: fd });
    const data = await res.json();
    if (data.ok) { setUploadedCount(data.count); setInQueue(data.count); toast({ title: `Загружено ${data.count} пользователей` }); }
  };

  const handleExport = () => {
    if (results.length === 0) { toast({ title: "Нет результатов для экспорта", variant: "destructive" }); return; }
    const csv = ["username,status,account,time", ...results.map(r => `${r.username},${r.status},${r.account},${r.time}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "inviting_results.csv";
    a.click(); URL.revokeObjectURL(url);
  };


  const toggleFilter = (key: keyof typeof filters) => setFilters(f => ({ ...f, [key]: !f[key] }));

  const filteredLogs = logFilter === "all" ? logs : logs.filter(l => l.type === logFilter);

  const statusBadge = (s: string) => {
    if (s === "invited") return <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[10px]">✓ Приглашён</Badge>;
    if (s === "already") return <Badge className="bg-blue-500/20 text-blue-400 border-0 text-[10px]">↩ Уже в группе</Badge>;
    if (s === "error") return <Badge className="bg-red-500/20 text-red-400 border-0 text-[10px]">✗ Ошибка</Badge>;
    return <Badge className="bg-amber-500/20 text-amber-400 border-0 text-[10px]">⚠ Пропущен</Badge>;
  };

  // Section wrapper
  const Section = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("panel-card p-4", className)}>{children}</div>
  );

  const SectionTitle = ({ icon: Icon, iconColor, title, badge }: { icon: React.ElementType; iconColor?: string; title: string; badge?: React.ReactNode }) => (
    <div className="flex items-center gap-2 mb-3">
      <Icon className={cn("h-4 w-4", iconColor || "text-primary")} />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {badge}
    </div>
  );

  const activeList = usersListTab === "queue" ? usersList : invitedList;
  const filteredList = usersSearch.trim()
    ? activeList.filter(u => u.toLowerCase().includes(usersSearch.toLowerCase()))
    : activeList;

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
      <ToolHeader
        icon={Send}
        iconBg="bg-cyan-500/15"
        iconColor="text-cyan-400"
        title="Инвайтинг"
        description="Массовое приглашение пользователей в группы и каналы"
        accentColor="from-cyan-500/10"
        steps={[
          { label: "Аккаунты", done: selectedAccIds.length > 0, hint: "Выберите аккаунты для инвайтинга" },
          { label: "Цель", done: targetValid, hint: "Укажите целевую группу или канал" },
        ]}
        running={running}
        status={running ? "running" : "idle"}
        onStart={handleStart}
        onStop={handleStop}
        startLabel="Запустить инвайтинг"
        startDisabled={!targetValid || selectedAccIds.length === 0}
        taskId={taskId}
      />

      {/* SECTION 2 — Accounts */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">Выбор аккаунтов</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingAccounts ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
            </div>
          ) : (
          <AccountSelector
            accounts={accounts}
            selectedIds={selectedAccIds}
            onChange={setSelectedAccIds}
            label="для инвайтинга"
            busyIds={busyAccountIds}
          />
          )}

          {/* Queue info */}
          {inQueue > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
              <Users className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm text-primary flex-1">В очереди: <b>{inQueue}</b> пользователей · Приглашено за все время: <b>{invitedTotal}</b></p>
              <Button size="sm" variant="outline" className="gap-1 text-xs border-primary/40 text-primary hover:bg-primary/10 shrink-0" onClick={openUsersList}>
                <Eye className="h-3 w-3" /> Посмотреть
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 3 — Target group */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Куда приглашаем
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="relative">
            <Input placeholder="@mygroup или https://t.me/mygroup" value={targetGroup} onChange={e => setTargetGroup(e.target.value)}
              className="bg-background border-border/50 pr-8" />
            {targetValid && <CheckCircle2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />}
          </div>
          <p className="text-xs text-muted-foreground">Аккаунты должны быть админы этой группы</p>
        </CardContent>
      </Card>

      {/* SECTION 4 — Who to invite */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-violet-400" /> Кого приглашаем
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-1">
            {[
              { key: "parsed", label: "Из парсинга" },
              { key: "file", label: "Из файла" },
              { key: "manual", label: "Вручную" },
            ].map(t => (
              <button key={t.key} onClick={() => setSourceTab(t.key)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  sourceTab === t.key ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/20")}>
                {t.label}
              </button>
            ))}
          </div>

          {sourceTab === "parsed" && (
            <ParsedResultSelector
              importEndpoint="/api/tools/inviting/import-from-library"
              onImported={(count) => {
                setInQueue(count); setUploadedCount(count);
                toast({ title: `Загружено ${count} пользователей из библиотеки` });
              }}
            />
          )}

          {sourceTab === "file" && (
            <div className="space-y-3">
              <label className="cursor-pointer">
                <input type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
                <div className="border-2 border-dashed border-border/40 rounded-lg p-8 text-center space-y-2 hover:border-primary/40 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Загрузите .txt файл с username или телефонами</p>
                  <p className="text-[10px] text-muted-foreground">@username или +79991234567, по одному на строку</p>
                  <div className="px-3 py-1.5 rounded border border-border/50 text-xs text-muted-foreground inline-block">+ Выбрать файл</div>
                </div>
              </label>
              {uploadedCount !== null && (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Загружено {uploadedCount} пользователей
                </div>
              )}
            </div>
          )}

          {sourceTab === "manual" && (
            <div className="space-y-2">
              <Textarea placeholder="@username1&#10;@username2&#10;+79991234567" value={manualUsers} onChange={e => setManualUsers(e.target.value)}
                className="bg-background border-border/50 min-h-[120px] font-mono text-xs" />
              <Button size="sm" variant="outline" className="gap-1 text-xs border-border/50" onClick={handleManualUpload}>
                <Upload className="h-3 w-3" /> Загрузить список
              </Button>
            </div>
          )}

          <div className="flex items-center gap-3 text-xs">
            <Badge className="bg-primary/20 text-primary border-0">{inQueue} в очереди</Badge>
            {inQueue > 0 && (
              <button
                className="flex items-center gap-1 text-destructive hover:text-destructive/80 transition-colors"
                onClick={() => {
                  fetch("/api/tools/inviting/queue", { method: "DELETE", credentials: "include" })
                    .then(r => r.json())
                    .then(() => { setInQueue(0); setUploadedCount(null); toast({ title: "Очередь очищена" }); })
                    .catch(() => toast({ title: "Ошибка", variant: "destructive" }));
                }}
              >
                <Trash2 className="h-3 w-3" /> Очистить
              </button>
            )}
            <span className="text-muted-foreground">Приглашено всего: {invitedTotal}</span>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 5 — Settings */}
      <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
        <Card className="bg-card border-border/50">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                ⚙️ Настройки инвайтинга
                {settingsOpen ? <ChevronDown className="h-4 w-4 ml-auto" /> : <ChevronRight className="h-4 w-4 ml-auto" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {/* AI Protection */}
              <div className="flex items-center gap-3 p-3 rounded-lg border border-violet-500/30 bg-gradient-to-r from-violet-500/10 to-purple-500/10">
                <div className="flex-1">
                  <AiProtectionPanel
                    enabled={aiProtection}
                    onToggle={setAiProtection}
                    accountIds={selectedAccIds}
                    tool="inviting"
                    onLimitChange={limit => { if (limit < invPerDay) setInvPerDay(limit); }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Limits */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5 text-orange-400" /> Лимиты
                  </p>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Приглашений / аккаунт / день</label>
                      <Input type="number" value={invPerDay} onChange={e => setInvPerDay(+e.target.value)}
                        className="bg-background border-border/50 h-8 text-xs mt-0.5" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Приглашений за сессию</label>
                      <Input type="number" value={invPerSession} onChange={e => setInvPerSession(+e.target.value)}
                        className="bg-background border-border/50 h-8 text-xs mt-0.5" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground">Автопереключение</span>
                      <Switch checked={autoSwitch} onCheckedChange={setAutoSwitch} />
                    </div>
                  </div>

                  {/* Filters */}
                  <p className="text-xs font-medium text-foreground flex items-center gap-1.5 pt-2">
                    <Filter className="h-3.5 w-3.5 text-red-400" /> Фильтры
                  </p>
                  <div className="space-y-1.5">
                    {[
                      { key: "bots" as const, label: "Пропускать ботов" },
                      { key: "deleted" as const, label: "Пропускать удалённых" },
                      { key: "blocked" as const, label: "Пропускать заблокированных" },
                      { key: "noRepeat" as const, label: "Не приглашать повторно" },
                      { key: "onlyUsername" as const, label: "Только с username" },
                      { key: "onlyPhoto" as const, label: "Только с фото" },
                      { key: "onlyPremium" as const, label: "Только Premium" },
                    ].map(f => (
                      <label key={f.key} className="flex items-center gap-2 text-[11px] cursor-pointer py-0.5">
                        <Checkbox checked={filters[f.key]} onCheckedChange={() => toggleFilter(f.key)} className="h-3.5 w-3.5" />
                        <span className="text-foreground">{f.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Delays + Smart protection */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-orange-400" /> Задержки
                  </p>
                  <div className="flex gap-0.5 bg-background rounded-md p-0.5">
                    {[
                      { key: "min", label: "⚡ Мин" },
                      { key: "recommended", label: "✓ Рекомендуемые" },
                      { key: "max", label: "🛡 Макс" },
                    ].map(p => (
                      <button key={p.key} onClick={() => {
                        setDelayPreset(p.key);
                        if (p.key === "min") { setDelayInvite([60]); setDelaySession([5]); }
                        if (p.key === "recommended") { setDelayInvite([90]); setDelaySession([10]); }
                        if (p.key === "max") { setDelayInvite([120]); setDelaySession([15]); }
                      }}
                        className={cn("flex-1 px-2 py-1 rounded text-[10px] font-medium transition-all",
                          delayPreset === p.key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-muted-foreground">Между приглашениями</span>
                      <span className="text-primary font-medium">{delayInvite[0]}с</span>
                    </div>
                    <Slider value={delayInvite} onValueChange={setDelayInvite} min={45} max={180} step={5} />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-muted-foreground">Между сессиями</span>
                      <span className="text-primary font-medium">{delaySession[0]}м</span>
                    </div>
                    <Slider value={delaySession} onValueChange={setDelaySession} min={1} max={30} step={1} />
                  </div>

                  <p className="text-xs font-medium text-foreground flex items-center gap-1.5 pt-2">
                    <Shield className="h-3.5 w-3.5 text-emerald-400" /> Умная защита
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-foreground">Авто-пауза при FloodWait</span>
                      <Switch checked={autoPause} onCheckedChange={setAutoPause} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-foreground">Детектор лимитов</span>
                      <Switch checked={limitDetector} onCheckedChange={setLimitDetector} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-muted-foreground">Пауза при PeerFlood (мин)</label>
                        <span className="text-[10px] text-muted-foreground">{floodPause >= 60 ? `${Math.round(floodPause/60)}ч` : `${floodPause}м`}</span>
                      </div>
                      <Input type="number" value={floodPause} onChange={e => setFloodPause(+e.target.value)}
                        className="bg-background border-border/50 h-8 text-xs w-full mt-0.5" min={60} />
                      <p className="text-[9px] text-amber-400/80 mt-0.5">Рекомендуется ≥ 1440 мин (24ч)</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* SECTION 7 — Launch */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-violet-500/20 text-violet-400 border-0">🟣 Аккаунты: {selectedAccIds.length}</Badge>
            <Badge className="bg-primary/20 text-primary border-0">👥 Пользователей: {inQueue}</Badge>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-0">🎯 Группа: {targetGroup || "не выбрана"}</Badge>
            <Badge className="bg-orange-500/20 text-orange-400 border-0">📊 Лимит: {invPerDay}/день</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Примерное время: ~{inQueue > 0 ? Math.ceil((inQueue * delayInvite[0]) / 3600) : 0}ч {inQueue > 0 ? Math.ceil(((inQueue * delayInvite[0]) % 3600) / 60) : 0}мин</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-2">
              <select value={inviteMode} onChange={e => setInviteMode(e.target.value)}
                className="h-9 rounded-md border border-input bg-background/50 px-2 text-xs text-foreground">
                <option value="parallel">Параллельный</option>
                <option value="sequential">Последовательный</option>
              </select>
              <select value={inviteMethod} onChange={e => setInviteMethod(e.target.value)}
                className="h-9 rounded-md border border-input bg-background/50 px-2 text-xs text-foreground">
                <option value="normal">Обычный</option>
                <option value="admin">Через admin</option>
              </select>
            </div>
            {!running ? (
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleStart} disabled={!targetValid || selectedAccIds.length === 0}>
                <Play className="h-4 w-4 mr-2" /> Запустить инвайтинг
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleStop}>
                <Pause className="h-4 w-4 mr-2" /> Остановить
              </Button>
            )}
            <span className={cn("text-xs flex items-center gap-1", running ? "text-emerald-400" : "text-red-400")}>
              ● {running ? "Запущено" : "Остановлено"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 8 — Logs */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">📋 Журнал</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-1">
            {[
              { key: "all", label: "ВСЕ" },
              { key: "success", label: "УСПЕХ" },
              { key: "flood", label: "ФЛУД-ВЕЙТ" },
              { key: "error", label: "ОШИБКИ" },
            ].map(t => (
              <button key={t.key} onClick={() => setLogFilter(t.key)}
                className={cn("px-3 py-1 rounded text-[10px] font-medium transition-all",
                  logFilter === t.key ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted/20")}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="bg-background rounded-lg p-3 font-mono text-xs space-y-1 max-h-[200px] overflow-y-auto border border-border/30">
            {filteredLogs.length === 0 ? (
              <p className="text-muted-foreground">Журнал пуст. Запустите задачу.</p>
            ) : filteredLogs.map((l, i) => (
              <div key={i} className={cn("flex gap-2",
                l.type === "success" ? "text-emerald-400" : l.type === "flood" ? "text-amber-400" : l.type === "error" ? "text-red-400" : "text-blue-400")}>
                <span className="text-muted-foreground shrink-0">{l.time}</span>
                <span>{l.type === "success" ? "✓" : l.type === "flood" ? "⚠" : l.type === "error" ? "✗" : "ℹ"} {l.msg}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* SECTION 9 — Results */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">📊 Результаты</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
            <div className="bg-primary/10 rounded-lg p-2 text-center"><span className="text-primary">Приглашено</span><p className="text-primary font-bold text-lg">{results.filter(r => r.status === "invited").length}</p></div>
            <div className="bg-blue-500/10 rounded-lg p-2 text-center"><span className="text-blue-400">Уже в группе</span><p className="text-blue-400 font-bold text-lg">{results.filter(r => r.status === "already").length}</p></div>
            <div className="bg-red-500/10 rounded-lg p-2 text-center"><span className="text-red-400">Ошибок</span><p className="text-red-400 font-bold text-lg">{results.filter(r => r.status === "error").length}</p></div>
            <div className="bg-emerald-500/10 rounded-lg p-2 text-center"><span className="text-emerald-400">Успех</span><p className="text-emerald-400 font-bold text-lg">{results.length > 0 ? Math.round(results.filter(r => r.status === "invited").length / results.length * 100) + "%" : "—"}</p></div>
          </div>

          {results.length > 0 && (
            <>
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{results.length} пользователей обработано</span>
                  <span>{Math.round(results.filter(r => r.status === "invited").length / results.length * 100)}%</span>
                </div>
                <Progress value={Math.round(results.filter(r => r.status === "invited").length / results.length * 100)} className="h-2" />
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/30">
                      <TableHead className="text-xs text-muted-foreground">USERNAME</TableHead>
                      <TableHead className="text-xs text-muted-foreground">СТАТУС</TableHead>
                      <TableHead className="text-xs text-muted-foreground">АККАУНТ</TableHead>
                      <TableHead className="text-xs text-muted-foreground">ВРЕМЯ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.slice(-50).map((r, i) => (
                      <TableRow key={i} className="border-border/30">
                        <TableCell className="text-xs text-foreground">{r.username}</TableCell>
                        <TableCell>{statusBadge(r.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.account}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.time}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          <Button variant="outline" size="sm" className="border-border/50" onClick={handleExport}>
            <Download className="h-3 w-3 mr-1" /> Экспорт результатов
          </Button>
        </CardContent>
      </Card>
      {/* Users list modal */}
      <Dialog open={showUsersList} onOpenChange={v => { setShowUsersList(v); if (!v) setUsersSearch(""); }}>
        <DialogContent className="sm:max-w-lg bg-card border-border max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Список пользователей
            </DialogTitle>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-1 bg-muted/20 rounded-lg p-0.5 shrink-0">
            <button
              onClick={() => { setUsersListTab("queue"); setUsersSearch(""); }}
              className={cn("flex-1 py-1.5 rounded-md text-xs font-medium transition-all",
                usersListTab === "queue" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground")}
            >
              В очереди ({usersList.length})
            </button>
            <button
              onClick={() => { setUsersListTab("invited"); setUsersSearch(""); }}
              className={cn("flex-1 py-1.5 rounded-md text-xs font-medium transition-all",
                usersListTab === "invited" ? "bg-emerald-500/20 text-emerald-400" : "text-muted-foreground hover:text-foreground")}
            >
              Приглашено ({invitedList.length})
            </button>
          </div>

          {/* Search */}
          <div className="relative shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              className="w-full h-8 pl-8 pr-8 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Поиск..."
              value={usersSearch}
              onChange={e => setUsersSearch(e.target.value)}
            />
            {usersSearch && (
              <button onClick={() => setUsersSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto min-h-0 rounded-lg border border-border/30 bg-background">
            {loadingList ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Загрузка...</div>
            ) : filteredList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">{usersSearch ? "Ничего не найдено" : usersListTab === "queue" ? "Очередь пуста" : "Нет приглашённых"}</p>
              </div>
            ) : (
              <div className="divide-y divide-border/20">
                {filteredList.map((u, i) => (
                  <div key={i} className="px-3 py-2 flex items-center gap-2 hover:bg-muted/10 text-sm font-mono">
                    <span className="text-muted-foreground text-[10px] w-8 shrink-0 text-right">{i + 1}</span>
                    <span className={cn(usersListTab === "invited" ? "text-emerald-400" : "text-foreground")}>{u}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground text-right shrink-0">
            {filteredList.length} из {activeList.length}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inviting;
