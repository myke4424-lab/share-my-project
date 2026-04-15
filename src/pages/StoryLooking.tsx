import { useEffect, useRef, useState } from "react";
import { useRunningTask } from "@/hooks/useRunningTask";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Eye, Search, ChevronDown, ChevronRight, X, Upload,
  Download, Clock, Users, BarChart3, Play, Square, RefreshCw, AlertCircle,
} from "lucide-react";
import ToolHeader from "@/components/dashboard/ToolHeader";
import { cn } from "@/lib/utils";
import AccountSelector, { SelectorAccount } from "@/components/dashboard/AccountSelector";
import { useToast } from "@/hooks/use-toast";
import ParsedResultSelector from "@/components/dashboard/ParsedResultSelector";

// ── Types ─────────────────────────────────────────────────────────────────────

type Account = SelectorAccount;
interface LogLine { time: string; msg: string; type: string; }

// ── Section ───────────────────────────────────────────────────────────────────

const Section = ({ title, icon: Icon, iconBg, children, defaultOpen = true }: {
  title: string; icon: React.ElementType; iconBg: string;
  children: React.ReactNode; defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="panel-card rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-4 hover:bg-muted/20 transition-colors">
        <div className={cn("w-7 h-7 rounded-md flex items-center justify-center", iconBg)}><Icon className="h-4 w-4" /></div>
        <span className="text-sm font-semibold text-foreground flex-1 text-left">{title}</span>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-5 border-t border-border/30 pt-4">{children}</div>}
    </div>
  );
};

const logColors: Record<string, string> = {
  success: "text-emerald-400", skip: "text-muted-foreground", error: "text-red-400",
};

// ── Main ──────────────────────────────────────────────────────────────────────

const StoryLooking = () => {
  const { toast } = useToast();

  // Accounts
  const [accounts, setAccounts]             = useState<Account[]>([]);
  const [selectedAccIds, setSelectedAccIds] = useState<number[]>([]);
  const [error, setError]                   = useState<string | null>(null);

  // Targets
  const [targetsCount, setTargetsCount]  = useState(0);
  const [sourceTab, setSourceTab]        = useState<"parsed" | "file" | "manual">("file");
  const [manualText, setManualText]      = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings
  const [targetsLimit, setTargetsLimit]   = useState(50000);
  const [storiesPerTarget, setStoriesPerTarget] = useState(2);
  const [maxWorkers, setMaxWorkers]       = useState(3);
  const [premiumOnly, setPremiumOnly]     = useState(false);
  const [skipViewed, setSkipViewed]       = useState(true);
  const [storyAgeHours, setStoryAgeHours] = useState(24);
  const [reactionsEnabled, setReactionsEnabled] = useState(true);
  const [reactionFrequency, setReactionFrequency] = useState(3);
  const [delayEnabled, setDelayEnabled]   = useState(true);
  const [delayMin, setDelayMin]           = useState([15]);
  const [delayMax, setDelayMax]           = useState([30]);
  const [delayPreset, setDelayPreset]     = useState("recommended");

  // Task / logs
  const { taskId, taskStatus, setTaskId, setTaskStatus, busyAccountIds } = useRunningTask("masslooking");
  const status = taskStatus === "running" ? "running" : "idle";
  const setStatus = (v: "idle" | "running") => setTaskStatus(v);
  const [logs, setLogs]         = useState<LogLine[]>([]);
  const [logFilter, setLogFilter] = useState("all");
  const esRef = useRef<EventSource | null>(null);

  // Reconnect logs after page refresh
  useEffect(() => {
    if (taskId && status === "running" && !esRef.current) {
      startSSE(taskId);
    }
    return () => { esRef.current?.close(); esRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, status]);

  // ── Load ──────────────────────────────────────────────────────────────────

  const loadTargets = () =>
    fetch("/api/tools/masslooking/targets-stats", { credentials: "include" })
      .then(r => r.json()).then(d => setTargetsCount(d.count ?? 0)).catch(() => {});

  useEffect(() => {
    fetch("/api/accounts", { credentials: "include" })
      .then(r => r.json())
      .then(data => setAccounts(Array.isArray(data) ? data.map(a => ({
        id: a.id, name: a.name || a.phone, phone: a.phone,
        status: a.status, days: a.days ?? 0, proxy_label: a.proxy_label ?? "",
        has_avatar: a.has_avatar ?? false,
      })) : []))
      .catch(() => {});

    fetch("/api/tools/masslooking/settings", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        setTargetsLimit(d.targets_limit ?? 50000);
        setStoriesPerTarget(d.max_stories_per_target ?? 2);
        setMaxWorkers(d.max_workers ?? 3);
        setPremiumOnly(d.premium_only ?? false);
        setSkipViewed(d.skip_viewed ?? true);
        setStoryAgeHours(d.story_age_hours ?? 24);
        setReactionsEnabled(d.reactions_enabled ?? true);
        setReactionFrequency(d.reaction_frequency ?? 3);
        setDelayEnabled(d.delay_enabled ?? true);
        setDelayMin([d.delay_min_sec ?? 15]);
        setDelayMax([d.delay_max_sec ?? 30]);
      })
      .catch(() => {});

    loadTargets();
  }, []);

  // Auto-save settings when they change
  useEffect(() => {
    const t = setTimeout(() => {
      fetch("/api/tools/masslooking/settings", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targets_limit: targetsLimit, max_stories_per_target: storiesPerTarget, max_workers: maxWorkers, premium_only: premiumOnly, skip_viewed: skipViewed, story_age_hours: storyAgeHours, reactions_enabled: reactionsEnabled, reaction_frequency: reactionFrequency, delay_enabled: delayEnabled, delay_min_sec: delayMin[0], delay_max_sec: delayMax[0] }),
      }).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [targetsLimit, storiesPerTarget, maxWorkers, premiumOnly, skipViewed, storyAgeHours, reactionsEnabled, reactionFrequency, delayEnabled, delayMin, delayMax]);

  // ── File / manual upload ───────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/tools/masslooking/upload-targets", { method: "POST", body: fd, credentials: "include" });
    const d = await r.json();
    if (d.count !== undefined) { setTargetsCount(d.count); toast({ title: `Загружено ${d.count} целей` }); }
    else toast({ title: "Ошибка загрузки файла", description: d.detail || d.error || "", variant: "destructive" });
    e.target.value = "";
  };

  const handleManualUpload = async () => {
    const lines = manualText.split("\n").filter(l => l.trim());
    if (!lines.length) return;
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const fd = new FormData();
    fd.append("file", blob, "targets.txt");
    const r = await fetch("/api/tools/masslooking/upload-targets", { method: "POST", body: fd, credentials: "include" });
    const d = await r.json();
    if (d.count !== undefined) { setTargetsCount(d.count); setManualText(""); toast({ title: `Загружено ${d.count} целей` }); }
    else toast({ title: "Ошибка загрузки", description: d.detail || d.error || "", variant: "destructive" });
  };

  const handleImportFromParser = async () => {
    setImportLoading(true);
    try {
      const r = await fetch("/api/tools/masslooking/import-from-parsing", { method: "POST", credentials: "include" });
      const d = await r.json();
      if (d.count !== undefined) { setTargetsCount(d.count); toast({ title: `Импортировано ${d.count} целей` }); }
      else { const msg = d.detail || d.error || "Ошибка импорта"; setError(msg); toast({ title: msg, variant: "destructive" }); }
    } catch { toast({ title: "Ошибка импорта", variant: "destructive" }); }
    setImportLoading(false);
  };

  // ── Start / Stop ──────────────────────────────────────────────────────────

  const handleStart = async () => {
    await fetch("/api/tools/masslooking/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        targets_limit:          targetsLimit,
        max_stories_per_target: storiesPerTarget,
        max_workers:            selectedAccIds.length || maxWorkers,
        premium_only:           premiumOnly,
        skip_viewed:            skipViewed,
        story_age_hours:        storyAgeHours,
        reactions_enabled:      reactionsEnabled,
        delay_enabled:          delayEnabled,
        delay_min_sec:          delayMin[0],
        delay_max_sec:          delayMax[0],
      }),
    });

    const r = await fetch("/api/tools/masslooking/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ account_ids: selectedAccIds }),
    });
    const d = await r.json();
    if (!r.ok || d.error || d.detail) {
      const msg = d.detail ?? d.error ?? "Ошибка запуска";
      setError(msg);
      toast({ title: "Ошибка запуска", description: msg, variant: "destructive" });
      return;
    }
    if (d.task_id) {
      setTaskId(d.task_id);
      setStatus("running");
      setLogs([]);
      startSSE(d.task_id);
      toast({ title: "Масслукинг запущен" });
    }
  };

  const handleStop = async () => {
    if (!taskId) return;
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE", credentials: "include" });
    setStatus("idle");
    esRef.current?.close();
    toast({ title: "Масслукинг остановлен" });
  };

  const startSSE = (id: string) => {
    esRef.current?.close();
    const es = new EventSource(`/api/tasks/${id}/logs`);
    esRef.current = es;
    es.onmessage = (e) => {
      const msg = e.data;
      const type = msg.includes("✓") || msg.toLowerCase().includes("ok") ? "success"
        : msg.includes("✗") || msg.toLowerCase().includes("error") || msg.toLowerCase().includes("ошиб") ? "error"
        : "skip";
      const time = new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLogs(prev => [...prev.slice(-300), { time, msg, type }]);
    };
    es.addEventListener("done", () => { setStatus("idle"); es.close(); });
    es.onerror = () => { setStatus("idle"); es.close(); };
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const filteredLogs = logFilter === "all" ? logs : logs.filter(l => l.type === logFilter);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1280px]">
      <ToolHeader
        icon={Eye}
        iconBg="bg-emerald-500/15"
        iconColor="text-emerald-400"
        title="Масслукинг историй"
        description="Массовый просмотр историй — пользователи видят ваш аккаунт и переходят в профиль"
        accentColor="from-emerald-500/10"
        steps={[
          { label: "Аккаунты", done: selectedAccIds.length > 0, hint: "Выберите хотя бы один аккаунт" },
          { label: "Цели", done: targetsCount > 0, hint: "Загрузите список целей" },
        ]}
        running={status === "running"}
        status={status}
        onStart={handleStart}
        onStop={handleStop}
        startLabel="Запустить масслукинг"
        taskId={taskId}
      />

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-400"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Account selection */}
      <Section title="Выбор аккаунтов" icon={Users} iconBg="bg-violet-500/20 text-violet-400">
        <AccountSelector accounts={accounts} selectedIds={selectedAccIds} onChange={setSelectedAccIds} busyIds={busyAccountIds} />
      </Section>

      {/* Settings */}
      <Section title="Настройки" icon={Eye} iconBg="bg-emerald-500/20 text-emerald-400">

        {/* Source */}
        <div className="panel-card p-4 mb-4 space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-violet-400" /> Источник пользователей
            <span className="ml-auto text-[10px] text-primary font-medium">{targetsCount} в очереди</span>
            <button onClick={loadTargets} className="text-muted-foreground hover:text-foreground">
              <RefreshCw className="h-3 w-3" />
            </button>
          </h4>
          <div className="flex gap-1 bg-muted/20 rounded-lg p-0.5 w-fit">
            {([
              { key: "parsed", label: "Из парсинга" },
              { key: "file",   label: "Из файла" },
              { key: "manual", label: "Вручную" },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setSourceTab(t.key)}
                className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  sourceTab === t.key ? "bg-primary/15 text-primary" : "text-muted-foreground")}>
                {t.label}
              </button>
            ))}
          </div>

          {sourceTab === "parsed" && (
            <ParsedResultSelector
              importEndpoint="/api/tools/masslooking/import-from-library"
              onImported={(count) => {
                setTargetsCount(count);
                toast({ title: `Загружено ${count} целей из библиотеки` });
              }}
            />
          )}

          {sourceTab === "file" && (
            <div>
              <input ref={fileInputRef} type="file" accept=".txt" className="hidden" onChange={handleFileChange} />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border/40 rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
              >
                <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Загрузите .txt файл с @username или номерами телефонов</p>
                <Button variant="outline" size="sm" className="mt-2 text-xs pointer-events-none">Выбрать файл</Button>
              </div>
            </div>
          )}

          {sourceTab === "manual" && (
            <div className="space-y-2">
              <textarea
                value={manualText}
                onChange={e => setManualText(e.target.value)}
                placeholder={"@username1\n@username2\n+79991234567"}
                className="w-full bg-background border border-border rounded-lg p-3 text-xs text-foreground min-h-[80px] font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleManualUpload}>
                <Upload className="h-3.5 w-3.5" /> Загрузить ({manualText.split("\n").filter(l => l.trim()).length} строк)
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Limits */}
          <div className="panel-card p-4 space-y-3">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-orange-400" /> Лимиты
            </h4>
            <div>
              <div className="flex justify-between mb-1 text-xs">
                <span className="text-muted-foreground">Макс. пользователей</span>
                <span className="text-primary font-medium">{targetsLimit}</span>
              </div>
              <Input type="number" value={targetsLimit}
                onChange={e => { const v = parseInt(e.target.value) || 0; e.target.value = String(v); setTargetsLimit(v); }}
                className="bg-background border-border h-8 text-xs" />
            </div>
            <div>
              <div className="flex justify-between mb-1 text-xs">
                <span className="text-muted-foreground">Историй на пользователя</span>
                <span className="text-primary font-medium">{storiesPerTarget}</span>
              </div>
              <Input type="number" min={1} max={10} value={storiesPerTarget}
                onChange={e => { const v = parseInt(e.target.value) || 1; e.target.value = String(v); setStoriesPerTarget(v); }}
                className="bg-background border-border h-8 text-xs" />
            </div>
            <div>
              <div className="flex justify-between mb-1 text-xs">
                <span className="text-muted-foreground">Параллельных аккаунтов</span>
                <span className="text-primary font-medium">{selectedAccIds.length || "—"}</span>
              </div>
              <div className="h-8 flex items-center px-3 rounded-md border border-border bg-muted/30 text-xs text-muted-foreground">
                {selectedAccIds.length > 0 ? `${selectedAccIds.length} акк. выбрано выше` : "Выберите аккаунты выше"}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="panel-card p-4 space-y-2.5">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-blue-400" /> Фильтры
            </h4>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox checked={premiumOnly} onCheckedChange={v => setPremiumOnly(!!v)} />
              <span className="text-foreground">Только Premium ⭐</span>
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox checked={skipViewed} onCheckedChange={v => setSkipViewed(!!v)} />
              <span className="text-foreground">Пропустить уже просмотренных</span>
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox checked={reactionsEnabled} onCheckedChange={v => setReactionsEnabled(!!v)} />
              <span className="text-foreground">Ставить реакции</span>
            </label>
            {reactionsEnabled && (
              <div className="pl-6">
                <div className="flex justify-between mb-1 text-xs">
                  <span className="text-muted-foreground">Реакция каждые N историй</span>
                  <span className="text-primary font-medium">{reactionFrequency}</span>
                </div>
                <Input type="number" min={1} max={10} value={reactionFrequency}
                  onChange={e => setReactionFrequency(Math.max(1, +e.target.value))}
                  className="bg-background border-border h-7 text-xs" />
                <p className="text-[10px] text-muted-foreground mt-1">
                  ~{Math.round(100 / reactionFrequency)}% историй получат реакцию
                </p>
              </div>
            )}
            <div className="mt-2">
              <div className="flex justify-between mb-1 text-xs">
                <span className="text-muted-foreground">Возраст историй (часов)</span>
                <span className="text-primary font-medium">{storyAgeHours}</span>
              </div>
              <Input type="number" min={1} max={48} value={storyAgeHours}
                onChange={e => setStoryAgeHours(+e.target.value)}
                className="bg-background border-border h-8 text-xs" />
            </div>
          </div>
        </div>

        {/* Delays */}
        <div className="panel-card p-4 mt-4 space-y-3">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-orange-400" /> Задержки
          </h4>
          <div className="flex items-center gap-3 mb-1">
            <Switch checked={delayEnabled} onCheckedChange={setDelayEnabled} />
            <span className="text-xs text-foreground">Включить задержки</span>
          </div>
          <div className="flex gap-1">
            {[
              { key: "min",         label: "⚡ Мин",     min: 15, max: 20 },
              { key: "recommended", label: "✓ Рекоменд.", min: 20, max: 30 },
              { key: "max",         label: "❤ Макс",    min: 30, max: 45 },
            ].map(p => (
              <button key={p.key}
                onClick={() => {
                  setDelayPreset(p.key);
                  setDelayMin([p.min]);
                  setDelayMax([p.max]);
                  setDelayEnabled(true);
                }}
                className={cn("px-2.5 py-1 rounded text-[10px] font-medium transition-all",
                  delayPreset === p.key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}>
                {p.label}
              </button>
            ))}
          </div>
          <div>
            <div className="flex justify-between mb-1 text-xs">
              <span className="text-muted-foreground">Мин. задержка</span>
              <span className="text-primary font-medium">{delayMin[0]} сек</span>
            </div>
            <Slider value={delayMin} onValueChange={setDelayMin} min={15} max={60} step={1} disabled={!delayEnabled} />
          </div>
          <div>
            <div className="flex justify-between mb-1 text-xs">
              <span className="text-muted-foreground">Макс. задержка</span>
              <span className="text-primary font-medium">{delayMax[0]} сек</span>
            </div>
            <Slider value={delayMax} onValueChange={setDelayMax} min={15} max={90} step={1} disabled={!delayEnabled} />
          </div>
        </div>
      </Section>

      {/* Logs */}
      <Section title="Логи" icon={Download} iconBg="bg-primary/20 text-primary" defaultOpen={false}>
        <div className="flex gap-1 mb-3">
          {[
            { key: "all",     label: "Все" },
            { key: "success", label: "✓ OK" },
            { key: "skip",    label: "⊘ Пропуск" },
            { key: "error",   label: "✗ Ошибки" },
          ].map(f => (
            <button key={f.key} onClick={() => setLogFilter(f.key)}
              className={cn("px-2.5 py-1 rounded text-[10px] font-medium",
                logFilter === f.key ? "bg-primary/15 text-primary" : "text-muted-foreground")}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="bg-background/80 rounded-lg p-3 font-mono text-[11px] space-y-1 max-h-[300px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <p className="text-muted-foreground/40 text-center py-4">
              {status === "running" ? "Ждём логов..." : "Логи появятся после запуска"}
            </p>
          ) : filteredLogs.map((l, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-muted-foreground shrink-0">{l.time}</span>
              <span className={logColors[l.type] || "text-foreground"}>{l.msg}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Action bar */}
      <div className="panel-card p-3 flex items-center gap-3">
        <Button
          className="gap-2 h-9 text-sm"
          onClick={handleStart}
          disabled={status === "running"}
        >
          <Play className="h-3.5 w-3.5" /> Запустить
        </Button>
        <Button
          variant="outline"
          className="gap-2 h-9 text-sm border-red-500/30 text-red-400 hover:bg-red-500/10"
          onClick={handleStop}
          disabled={status === "idle"}
        >
          <Square className="h-3.5 w-3.5" /> Стоп
        </Button>
        <div className="flex-1" />
        <span className="text-[10px] text-muted-foreground">Статус:</span>
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium",
          status === "running" ? "text-emerald-400" : "text-muted-foreground")}>
          <span className={cn("w-1.5 h-1.5 rounded-full",
            status === "running" ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground")} />
          {status === "running" ? "Работает" : "Остановлен"}
        </span>
      </div>
    </div>
  );
};

export default StoryLooking;
