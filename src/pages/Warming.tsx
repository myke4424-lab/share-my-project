import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Flame, Users, AlertTriangle, Play, Square,
  Inbox, RefreshCw, Target, X,
  Trash2, RotateCcw, Settings2,
  MessageSquare, Clock, Info, ChevronLeft, ChevronRight,
  ShieldCheck,
} from "lucide-react";
import AccountSelector, { SelectorAccount } from "@/components/AccountSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import ToolHeader from "@/components/ToolHeader";
import { useRunningTask } from "@/hooks/useRunningTask";

// ─── Types ───────────────────────────────────────────────────
type Account = SelectorAccount;

interface LogEntry {
  time: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

// ─── Helpers ─────────────────────────────────────────────────
function parseLogLine(raw: string): LogEntry {
  const now = new Date().toTimeString().slice(0, 8);
  if (raw.includes("✓") || /ok|успех|готово/i.test(raw))
    return { time: now, message: raw, type: "success" };
  if (raw.includes("⚠") || /warn|flood|предупр/i.test(raw))
    return { time: now, message: raw, type: "warning" };
  if (raw.includes("✗") || /error|ошибк|failed/i.test(raw))
    return { time: now, message: raw, type: "error" };
  return { time: now, message: raw, type: "info" };
}

const logColor: Record<string, string> = {
  success: "text-emerald-400",
  warning: "text-amber-400",
  error: "text-red-400",
  info: "text-primary",
};

// ─── Toggle ──────────────────────────────────────────────────
const Toggle = ({
  checked, onChange, disabled,
}: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
  <button
    onClick={() => !disabled && onChange(!checked)}
    className={cn(
      "w-9 h-5 rounded-full transition-colors relative shrink-0",
      checked ? "bg-primary" : "bg-muted",
      disabled && "opacity-40 cursor-not-allowed"
    )}
  >
    <span
      className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
      style={checked ? { left: "18px" } : { left: "2px" }}
    />
  </button>
);

// ─── Section ─────────────────────────────────────────────────
const Section = ({
  title, icon: Icon, iconBg, children, defaultOpen = true, tint, badge,
}: {
  title: string; icon: React.ElementType; iconBg: string; children: React.ReactNode;
  defaultOpen?: boolean; tint?: string; badge?: string;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("panel-card rounded-xl overflow-hidden", tint)}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors"
      >
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold text-foreground flex-1 text-left">{title}</span>
        {badge && (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/15">
            {badge}
          </span>
        )}
        {open
          ? <ChevronLeft className="h-4 w-4 text-muted-foreground/50 rotate-90" />
          : <ChevronRight className="h-4 w-4 text-muted-foreground/50" />}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-border/30 pt-4">{children}</div>
      )}
    </div>
  );
};

// ─── Result popup ────────────────────────────────────────────
const ResultList = ({
  results, onClose,
}: { results: { name: string; ok: boolean; detail: string }[]; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
    <div className="bg-card border border-border rounded-xl w-full max-w-md max-h-[80vh] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <span className="font-semibold text-sm text-foreground">Результаты</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="divide-y divide-border/50 overflow-y-auto flex-1">
        {results.map((r, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-2.5">
            <span className={cn("mt-0.5 shrink-0 font-bold", r.ok ? "text-emerald-400" : "text-red-400")}>
              {r.ok ? "✓" : "✗"}
            </span>
            <div>
              <p className="text-xs font-medium text-foreground">{r.name}</p>
              <p className="text-[10px] text-muted-foreground">{r.detail}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-border shrink-0">
        <Button size="sm" className="w-full" onClick={onClose}>Закрыть</Button>
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════
const Warming = () => {
  const { toast } = useToast();

  // ── Accounts state ────────────────────────────────────────
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const fetchAccounts = useCallback(() => {
    setLoadingAccounts(true);
    fetch("/api/accounts", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setAllAccounts(Array.isArray(d) ? d : []))
      .catch(() => setAllAccounts([]))
      .finally(() => setLoadingAccounts(false));
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  // ── Warming settings ──────────────────────────────────────
  const [startHour, setStartHour] = useState(0);
  const [endHour, setEndHour] = useState(24);
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Moscow");
  const [actionView, setActionView] = useState(true);
  const [actionReact, setActionReact] = useState(true);
  const [actionStories, setActionStories] = useState(true);
  const [actionComment, setActionComment] = useState(false);
  const [actionSubscribe, setActionSubscribe] = useState(false);
  const [actionDm, setActionDm] = useState(false);
  const [delayActionsMin, setDelayActionsMin] = useState(60);
  const [delayActionsMax, setDelayActionsMax] = useState(120);
  const [delayMin, setDelayMin] = useState(180);
  const [delayMax, setDelayMax] = useState(300);
  const [delayCyclesMin, setDelayCyclesMin] = useState(1800);
  const [delayCyclesMax, setDelayCyclesMax] = useState(3600);
  const [dailyLimit, setDailyLimit] = useState(90);
  const [maxPosts, setMaxPosts] = useState(5);
  const [cycles, setCycles] = useState(0);
  const [channels, setChannels] = useState<string[]>([]);
  const [defaultChannels, setDefaultChannels] = useState<string[]>([]);
  const [channelInput, setChannelInput] = useState("");
  const [commentsText, setCommentsText] = useState("");

  // ── DM (переписка) settings ────────────────────────────────
  const [dmMessagesText, setDmMessagesText] = useState("");

  useEffect(() => {
    fetch("/api/tools/warming/settings", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setStartHour(d.active_hours_from ?? 0);
        setEndHour(d.active_hours_to ?? 24);
        setTimezone(d.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "Europe/Moscow");
        setActionView(d.action_view ?? true);
        setActionReact(d.action_react ?? true);
        setActionStories(d.action_stories ?? true);
        setActionComment(d.action_comment ?? false);
        setActionSubscribe(d.action_subscribe ?? false);
        setActionDm(d.action_dm ?? false);
        setDelayActionsMin(d.delay_between_actions_min ?? 60);
        setDelayActionsMax(d.delay_between_actions_max ?? 120);
        setDelayMin(d.delay_between_channels_min ?? 180);
        setDelayMax(d.delay_between_channels_max ?? 300);
        setDelayCyclesMin(d.delay_between_cycles_min ?? 1800);
        setDelayCyclesMax(d.delay_between_cycles_max ?? 3600);
        setDailyLimit(d.daily_limit_minutes ?? 90);
        setMaxPosts(d.max_posts_per_channel ?? 5);
        setCycles(d.cycles ?? 0);
        setChannels(d.channels ?? []);
        setDefaultChannels(d.default_channels ?? []);
        setCommentsText((d.custom_comments ?? []).join("\n"));
        setDmMessagesText((d.dm_messages ?? []).join("\n"));
      })
      .catch(() => toast({ title: "Ошибка загрузки настроек прогрева", variant: "destructive" }));
  }, [toast]);

  // Единый билдер payload — используется во всех save-операциях,
  // чтобы никогда не перезаписывать поля частичным сохранением.
  const buildPayload = (channelsOverride?: string[]) => ({
    active_hours_from: startHour,
    active_hours_to: endHour,
    timezone,
    action_view: actionView,
    action_react: actionReact,
    action_stories: actionStories,
    action_comment: actionComment,
    action_subscribe: actionSubscribe,
    action_dm: actionDm,
    delay_between_actions_min: delayActionsMin,
    delay_between_actions_max: delayActionsMax,
    delay_between_channels_min: delayMin,
    delay_between_channels_max: delayMax,
    delay_between_cycles_min: delayCyclesMin,
    delay_between_cycles_max: delayCyclesMax,
    daily_limit_minutes: dailyLimit,
    max_posts_per_channel: maxPosts,
    cycles,
    channels: channelsOverride ?? channels,
    custom_comments: commentsText.split("\n").map((s) => s.trim()).filter(Boolean),
    dm_messages: dmMessagesText.split("\n").map((s) => s.trim()).filter(Boolean),
  });

  const saveSettings = async (channelsOverride?: string[]) => {
    const r = await fetch("/api/tools/warming/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(channelsOverride)),
      credentials: "include",
    });
    if (r.ok) toast({ title: "Настройки сохранены" });
    else toast({ title: "Ошибка сохранения", variant: "destructive" });
  };

  // ── Task / logs ───────────────────────────────────────────
  const { taskId, taskStatus, setTaskId, setTaskStatus, busyAccountIds } = useRunningTask("warming");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logFilter, setLogFilter] = useState("all");
  const logsEndRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (logs.length > 0) logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Reconnect logs when taskId restored after page refresh
  useEffect(() => {
    if (taskId && taskStatus === "running" && !esRef.current) {
      startLogs(taskId);
    }
    return () => { esRef.current?.close(); esRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, taskStatus]);

  const startLogs = (tid: string) => {
    esRef.current?.close();
    const es = new EventSource(`/api/tasks/${tid}/logs`);
    es.onmessage = (e) => {
      if (!e.data) return;
      // [STATUS] lines — обновляем список аккаунтов (статус мог смениться на banned)
      if (e.data.startsWith("[STATUS]")) {
        fetchAccounts();
        return;
      }
      setLogs((prev) => [...prev, parseLogLine(e.data)]);
    };
    es.addEventListener("done", () => {
      setTaskStatus("completed");
      fetchAccounts(); // обновляем после завершения
      es.close();
      esRef.current = null;
    });
    es.onerror = () => {
      // SSE dropped — don't mark as failed, task may still run on server
      es.close();
      esRef.current = null;
    };
    esRef.current = es;
  };

  const handleStart = async () => {
    if (selectedIds.length === 0) {
      toast({ title: "Выберите аккаунты для прогрева", variant: "destructive" });
      return;
    }
    await saveSettings();
    const r = await fetch("/api/tools/warming/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_ids: selectedIds }),
      credentials: "include",
    });
    const d = await r.json();
    if (d.error || d.detail) { toast({ title: d.error || d.detail, variant: "destructive" }); return; }
    if (!d.task_id) { toast({ title: "Неожиданный ответ сервера", variant: "destructive" }); return; }
    setTaskId(d.task_id);
    setTaskStatus("running");
    setLogs([]);
    startLogs(d.task_id);
    toast({ title: "Прогрев запущен" });
  };

  const handleStop = async () => {
    if (!taskId) return;
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE", credentials: "include" });
    esRef.current?.close();
    setTaskStatus("idle");
    toast({ title: "Прогрев остановлен" });
  };

  const handleJoinChannels = async () => {
    if (selectedIds.length === 0) {
      toast({ title: "Выберите аккаунты", variant: "destructive" });
      return;
    }
    await saveSettings();
    const r = await fetch("/api/tools/warming/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_ids: selectedIds, join_only: true }),
      credentials: "include",
    });
    const d = await r.json();
    if (d.error || d.detail) { toast({ title: d.error || d.detail, variant: "destructive" }); return; }
    if (!d.task_id) { toast({ title: "Неожиданный ответ сервера", variant: "destructive" }); return; }
    setTaskId(d.task_id);
    setTaskStatus("running");
    setLogs([]);
    startLogs(d.task_id);
    toast({ title: "Вступление в каналы запущено" });
  };

  const addChannels = async () => {
    const items = channelInput.split("\n").map((s) => s.trim()).filter((s) => s && !channels.includes(s));
    if (!items.length) return;
    const newChannels = [...channels, ...items];
    setChannels(newChannels);
    setChannelInput("");
    // Сразу сохраняем с полным payload чтобы не потерять канал при обновлении страницы
    const r = await fetch("/api/tools/warming/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(buildPayload(newChannels)),
    });
    if (!r.ok) toast({ title: "Ошибка сохранения каналов", variant: "destructive" });
  };

  const removeChannel = async (ch: string) => {
    const updated = channels.filter((x) => x !== ch);
    setChannels(updated);
    setChannelStatus((prev) => { const s = { ...prev }; delete s[ch]; return s; });
    const r = await fetch("/api/tools/warming/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(buildPayload(updated)),
    });
    if (!r.ok) toast({ title: "Ошибка сохранения каналов", variant: "destructive" });
  };

  const clearChannels = async () => {
    setChannels([]);
    setChannelStatus({});
    const r = await fetch("/api/tools/warming/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(buildPayload([])),
    });
    if (!r.ok) toast({ title: "Ошибка сохранения каналов", variant: "destructive" });
  };

  // ── Channel validation ─────────────────────────────────────
  const [checkingChannels, setCheckingChannels] = useState(false);
  const [channelStatus, setChannelStatus] = useState<Record<string, boolean | null>>({});

  const checkChannels = async () => {
    if (channels.length === 0) return;
    setCheckingChannels(true);
    try {
      const r = await fetch("/api/tools/warming/check-channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channels }),
        credentials: "include",
      });
      const d = await r.json();
      const map: Record<string, boolean | null> = {};
      for (const item of d.results ?? []) map[item.channel] = item.exists;
      setChannelStatus(map);
    } catch {
      toast({ title: "Ошибка проверки каналов", variant: "destructive" });
    }
    setCheckingChannels(false);
  };

  // ── Risk score ────────────────────────────────────────────
  const riskScore = Math.min(
    (actionComment ? 20 : 0) +
    (actionSubscribe ? 15 : 0) +
    (actionDm ? 25 : 0) +
    (delayMin < 90 ? 20 : delayMin < 180 ? 10 : 0) +
    (selectedIds.length > 10 ? 10 : 0),
    100
  );
  const riskLevel = riskScore < 30 ? "Низкий" : riskScore < 60 ? "Средний" : "Высокий";
  const riskColor = riskScore < 30 ? "bg-emerald-400" : riskScore < 60 ? "bg-amber-400" : "bg-red-400";
  const riskTextColor = riskScore < 30 ? "text-emerald-400" : riskScore < 60 ? "text-amber-400" : "text-red-400";

  // ── Account selector helpers ──────────────────────────────
  const under3DayCount = allAccounts
    .filter((a) => selectedIds.includes(a.id))
    .filter((a) => (a.days ?? 0) < 3).length;

  // ── Account management ────────────────────────────────────
  const [mgmtAction, setMgmtAction] = useState<string | null>(null);
  const [mgmtLoading, setMgmtLoading] = useState(false);
  const [mgmtResults, setMgmtResults] = useState<{ name: string; ok: boolean; detail: string }[] | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [privacyKey, setPrivacyKey] = useState("last_seen");
  const [privacyRule, setPrivacyRule] = useState("contacts");
  const [twoFaPass, setTwoFaPass] = useState("");
  const [twoFaHint, setTwoFaHint] = useState("");
  const [twoFaCurrent, setTwoFaCurrent] = useState("");
  const avatarRef = useRef<HTMLInputElement>(null);

  const runAction = async (endpoint: string, extra?: object) => {
    if (selectedIds.length === 0) {
      toast({ title: "Выберите аккаунты выше", variant: "destructive" });
      return;
    }
    setMgmtLoading(true);
    try {
      const r = await fetch(`/api/accounts/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_ids: selectedIds, ...extra }),
        credentials: "include",
      });
      const d = await r.json();
      if (d.results) {
        setMgmtResults(d.results);
      } else {
        toast({ title: d.ok ? "Готово" : (d.error || "Ошибка"), variant: d.ok ? "default" : "destructive" });
      }
      if (endpoint === "test") fetchAccounts();
    } catch {
      toast({ title: "Ошибка запроса", variant: "destructive" });
    }
    setMgmtLoading(false);
    setMgmtAction(null);
  };

  const handleAvatarUpload = async (file: File) => {
    if (selectedIds.length === 0) { toast({ title: "Выберите аккаунты", variant: "destructive" }); return; }
    setMgmtLoading(true);
    const form = new FormData();
    form.append("avatar", file);
    form.append("account_ids", JSON.stringify(selectedIds));
    try {
      const r = await fetch("/api/accounts/change-avatar", { method: "POST", body: form, credentials: "include" });
      const d = await r.json();
      if (d.results) setMgmtResults(d.results);
    } catch {
      toast({ title: "Ошибка загрузки", variant: "destructive" });
    }
    setMgmtLoading(false);
  };

  const filteredLogs = logs.filter((l) => logFilter === "all" || l.type === logFilter);

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      {/* Unified tool header with sticky launch */}
      <ToolHeader
        icon={Flame}
        iconBg="bg-orange-500/10"
        iconColor="text-orange-500"
        title="Прогрев аккаунтов"
        description="Имитация естественной активности для повышения доверия аккаунтов"
        accentColor="from-orange-500/10"
        steps={[
          { label: "Аккаунты", done: selectedIds.length > 0, hint: "Выберите хотя бы 1 аккаунт" },
          { label: "Каналы", done: true, hint: "Используются каналы по умолчанию" },
        ]}
        running={taskStatus === "running"}
        status={taskStatus as any}
        onStart={handleStart}
        onStop={handleStop}
        startLabel="Запустить прогрев"
        startDisabled={selectedIds.length === 0}
        taskId={taskId}
      />

      {/* ══ 1. ACCOUNT SELECTION ══ */}
      <Section
        title="Выбор аккаунтов" icon={Users} iconBg="bg-violet-500/10 text-violet-500"
        badge={selectedIds.length > 0 ? `${selectedIds.length} выбрано` : undefined}
      >
        <div className="space-y-3">
          {loadingAccounts ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
          ) : (
          <AccountSelector
            accounts={allAccounts}
            selectedIds={selectedIds}
            onChange={setSelectedIds}
            label="для прогрева"
            busyIds={busyAccountIds}
          />
          )}
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={fetchAccounts}>
            <RefreshCw className="h-3 w-3" /> Обновить список
          </Button>
        </div>
      </Section>

      {/* ══ 3. WARMING SETTINGS ══ */}
      <Section title="Настройки прогрева" icon={Settings2} iconBg="bg-orange-500/10 text-orange-500">

        {/* Risk level presets */}
        <div className="mb-5 p-4 rounded-xl border border-border/40 bg-muted/20 space-y-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className={cn("h-4 w-4 shrink-0", riskTextColor)} />
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Уровень риска: <span className={cn("font-bold", riskTextColor)}>{riskLevel}</span></span>
                <span className="text-[10px] text-muted-foreground font-mono">{riskScore}/100</span>
              </div>
              <div className="bg-muted/60 rounded-full h-2">
                <motion.div className={cn("h-full rounded-full transition-all duration-500", riskColor)} style={{ width: `${riskScore}%` }} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {([
              {
                key: "safe", label: "🛡 Безопасный",
                color: "border-emerald-500/40 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10",
                apply: () => { setDelayActionsMin(90); setDelayActionsMax(180); setDelayMin(300); setDelayMax(600); setDelayCyclesMin(3600); setDelayCyclesMax(7200); setDailyLimit(60); setMaxPosts(3); setActionComment(false); setActionDm(false); setActionSubscribe(false); setActionView(true); setActionReact(true); setActionStories(true); },
              },
              {
                key: "medium", label: "⚡ Средний",
                color: "border-amber-500/40 text-amber-400 bg-amber-500/5 hover:bg-amber-500/10",
                apply: () => { setDelayActionsMin(60); setDelayActionsMax(120); setDelayMin(180); setDelayMax(300); setDelayCyclesMin(1800); setDelayCyclesMax(3600); setDailyLimit(90); setMaxPosts(5); setActionComment(true); setActionDm(false); setActionSubscribe(true); setActionView(true); setActionReact(true); setActionStories(true); },
              },
              {
                key: "aggressive", label: "🔥 Агрессивный",
                color: "border-red-500/40 text-red-400 bg-red-500/5 hover:bg-red-500/10",
                apply: () => { setDelayActionsMin(60); setDelayActionsMax(90); setDelayMin(90); setDelayMax(180); setDelayCyclesMin(900); setDelayCyclesMax(1800); setDailyLimit(180); setMaxPosts(7); setActionComment(true); setActionDm(selectedIds.length >= 2); setActionSubscribe(true); setActionView(true); setActionReact(true); setActionStories(true); },
              },
            ] as const).map(p => (
              <button key={p.key} onClick={p.apply}
                className={cn("flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all", p.color)}>
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">Пресет меняет задержки и активные действия. Все параметры можно изменить вручную ниже.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-4">
            {/* Schedule */}
            <div className="border border-border/50 rounded-xl p-4 space-y-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Расписание активности</p>
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-1">
                  <span className="text-[10px] text-muted-foreground">Начало</span>
                  <Input type="number" min={0} max={23} value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
                    className="h-9 text-sm font-bold text-center bg-muted/30 border-border/50" />
                </div>
                <span className="text-muted-foreground/40 pb-2 text-lg">—</span>
                <div className="flex-1 space-y-1">
                  <span className="text-[10px] text-muted-foreground">Конец</span>
                  <Input type="number" min={0} max={24} value={endHour}
                    onChange={(e) => setEndHour(Number(e.target.value))}
                    className="h-9 text-sm font-bold text-center bg-muted/30 border-border/50" />
                </div>
                <span className="text-xs text-muted-foreground pb-2.5 shrink-0">ч.</span>
              </div>
              {/* Visual time bar */}
              <div className="space-y-1">
                <div className="relative h-1.5 bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-primary/50 rounded-full transition-all duration-300"
                    style={{
                      left: `${(startHour / 24) * 100}%`,
                      width: `${Math.max(((endHour - startHour) / 24) * 100, 0)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground/50">
                  <span>0</span><span>6</span><span>12</span><span>18</span><span>24</span>
                </div>
              </div>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full h-8 rounded-lg border border-border/50 bg-muted/20 px-2 text-xs text-foreground"
              >
                {[
                  { value: "Europe/Moscow",      label: "Москва (UTC+3)" },
                  { value: "Europe/Kaliningrad",  label: "Калининград (UTC+2)" },
                  { value: "Asia/Yekaterinburg",  label: "Екатеринбург (UTC+5)" },
                  { value: "Asia/Novosibirsk",    label: "Новосибирск (UTC+7)" },
                  { value: "Asia/Vladivostok",    label: "Владивосток (UTC+10)" },
                  { value: "Europe/Kiev",         label: "Киев (UTC+2)" },
                  { value: "Asia/Almaty",         label: "Алматы (UTC+5)" },
                  { value: "Europe/London",       label: "Лондон (UTC+0)" },
                  { value: "Europe/Berlin",       label: "Берлин (UTC+1)" },
                  { value: "America/New_York",    label: "Нью-Йорк (UTC-5)" },
                ].map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>

            {/* Actions pills */}
            <div className="border border-border/50 rounded-xl p-4 space-y-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Действия аккаунта</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: "view",      icon: "👁",  label: "Читать каналы",       val: actionView,      set: setActionView },
                  { key: "react",     icon: "🔥", label: "Ставить реакции",     val: actionReact,     set: setActionReact },
                  { key: "stories",   icon: "📖", label: "Смотреть сторис",     val: actionStories,   set: setActionStories,   minDays: 3 },
                  { key: "comment",   icon: "💬", label: "Комментировать",      val: actionComment,   set: setActionComment,   minDays: 3 },
                  { key: "subscribe", icon: "👥", label: "Вступать в группы",   val: actionSubscribe, set: setActionSubscribe, minDays: 3 },
                  { key: "dm",        icon: "📩", label: "DM (2+ акк.)",        val: actionDm,        set: setActionDm,        disabled: selectedIds.length < 2 },
                ] as const).map((item) => {
                  const needsDays = (item as any).minDays as number | undefined;
                  const locked = needsDays !== undefined && under3DayCount > 0 && selectedIds.length > 0;
                  const isDisabled = (item as any).disabled;
                  return (
                    <div key={item.key} className="space-y-0.5">
                      <button
                        onClick={() => !isDisabled && item.set(!item.val)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all text-left",
                          item.val
                            ? "bg-emerald-500 border-emerald-600 text-white"
                            : "bg-muted/20 border-border/40 text-muted-foreground hover:border-border hover:text-foreground",
                          isDisabled && "opacity-40 cursor-not-allowed"
                        )}
                      >
                        <span className="text-sm leading-none">{item.icon}</span>
                        <span className="flex-1 truncate">{item.label}</span>
                        {locked && !item.val && <Clock className="h-3 w-3 text-amber-400 shrink-0" />}
                        {item.val && (
                          <svg className="h-3.5 w-3.5 text-white shrink-0" viewBox="0 0 12 12" fill="none">
                            <circle cx="6" cy="6" r="5.5" fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="1"/>
                            <path d="M3.5 6l1.8 1.8 3.2-3.6" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                      {locked && item.val && (
                        <p className="text-[9px] text-amber-400/80 px-1">
                          ⚠ {under3DayCount} акк. младше 3 дней
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Custom comments */}
            <div className="border border-border/50 rounded-xl p-4 space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Комментарии</p>
              <p className="text-[10px] text-muted-foreground">По одному на строку. Если пусто — стандартные.</p>
              <textarea
                value={commentsText} onChange={(e) => setCommentsText(e.target.value)}
                placeholder={"Интересно!\nСпасибо за контент\nПолезно"} rows={6}
                className="w-full bg-muted/20 border border-border/50 rounded-lg px-3 py-2 text-xs text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button variant="outline" size="sm" className="text-xs gap-1.5 w-full h-9" onClick={saveSettings}>
              <RotateCcw className="h-3 w-3" /> Сохранить настройки
            </Button>
          </div>
        </div>
      </Section>

      {/* ══ 4. TARGET CHANNELS ══ */}
      <Section
        title="Каналы для прогрева" icon={Target} iconBg="bg-pink-500/10 text-pink-500"
        tint="border-pink-500/10"
        badge={channels.length > 0 ? `${channels.length} каналов` : "по умолчанию"}
      >
        <div className="space-y-3">
          <div className="flex gap-2">
            <textarea
              value={channelInput} onChange={(e) => setChannelInput(e.target.value)}
              placeholder={"@cryptogroup\n@newsChannel\nhttps://t.me/joinchat/..."} rows={3}
              className="flex-1 bg-background border border-border rounded-lg p-2.5 text-xs text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button variant="outline" className="h-full text-xs border-border" onClick={addChannels}>
              + Добавить
            </Button>
          </div>

          {channels.length === 0 && defaultChannels.length > 0 && (
            <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5 space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Каналы по умолчанию — используются автоматически
              </p>
              <div className="flex flex-wrap gap-1.5">
                {defaultChannels.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-muted/50 text-muted-foreground border border-border/30">
                    {c}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/60">
                Добавьте свои каналы выше — они заменят список по умолчанию
              </p>
            </div>
          )}

          {channels.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Каналы ({channels.length})
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline" size="sm"
                    className="h-6 text-[10px] gap-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    onClick={checkChannels}
                    disabled={checkingChannels}
                  >
                    {checkingChannels
                      ? <RefreshCw className="h-3 w-3 animate-spin" />
                      : <ShieldCheck className="h-3 w-3" />}
                    Проверить
                  </Button>
                  <button onClick={clearChannels} className="text-[10px] text-red-400 hover:underline">
                    Очистить
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {channels.map((c) => {
                  const st = channelStatus[c];
                  return (
                    <span key={c} className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
                      st === false ? "bg-red-500/15 text-red-400 border border-red-500/30"
                        : st === true ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-primary/10 text-primary"
                    )}>
                      {st === true && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />}
                      {st === false && <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />}
                      {c}
                      <button onClick={() => removeChannel(c)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
              {Object.values(channelStatus).some(v => v === false) && (
                <p className="text-[10px] text-red-400 mt-2">
                  ⚠ Красные каналы не найдены на Telegram — удали их или проверь username через t.me/username
                </p>
              )}
            </div>
          )}
        </div>
      </Section>

      {/* ══ 5. DM (переписка между аккаунтами) ══ */}
      <Section
        title="Переписка между аккаунтами"
        icon={MessageSquare}
        iconBg="bg-blue-500/10 text-blue-500"
        defaultOpen={false}
        badge={actionDm ? "Включено" : undefined}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Включить переписку (DM)</p>
              <p className="text-xs text-muted-foreground">Аккаунты ведут живой диалог между собой</p>
            </div>
            <Toggle checked={actionDm} onChange={setActionDm} disabled={selectedIds.length < 2} />
          </div>
          {selectedIds.length < 2 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-400">Нужно минимум 2 аккаунта для включения переписки</p>
            </div>
          )}
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Шаблоны сообщений</label>
              <p className="text-[10px] text-muted-foreground/70">По одному на строку. Если пусто — используются встроенные шаблоны диалогов.</p>
              <textarea
                value={dmMessagesText}
                onChange={(e) => setDmMessagesText(e.target.value)}
                placeholder={"Привет! Как дела?\nЧто думаешь об этом?\nИнтересная идея!"}
                rows={6}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="p-3 rounded-lg bg-blue-500/8 border border-blue-500/15 space-y-1">
              <p className="text-xs font-medium text-blue-500 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" /> Как работает
              </p>
              <p className="text-[11px] text-muted-foreground">
                Пары аккаунтов поочерёдно отправляют сообщения с задержками 5–90с между репликами. Каждый аккаунт читает полученное сообщение перед ответом — имитирует живой диалог.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ══ 6. LAUNCH ══ */}
      <Section title="Запуск и управление" icon={Play} iconBg="bg-primary/10 text-primary">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Аккаунты", value: selectedIds.length, dot: "bg-violet-500", bg: "bg-violet-500/8 border-violet-500/20" },
              { label: "Каналов",  value: channels.length > 0 ? channels.length : `${defaultChannels.length} (авто)`, dot: "bg-pink-500", bg: "bg-pink-500/8 border-pink-500/20" },
              { label: "Задержка", value: `${delayMin}–${delayMax}с`, dot: "bg-orange-500", bg: "bg-orange-500/8 border-orange-500/20" },
            ].map((s) => (
              <div key={s.label} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border", s.bg)}>
                <span className={cn("w-2 h-2 rounded-full", s.dot)} />
                <span className="text-xs text-foreground">{s.label}: <strong>{s.value}</strong></span>
              </div>
            ))}
            <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border",
              riskScore < 30 ? "bg-emerald-500/5 border-emerald-500/20" : riskScore < 60 ? "bg-amber-500/5 border-amber-500/20" : "bg-red-500/5 border-red-500/20")}>
              <AlertTriangle className={cn("h-3.5 w-3.5", riskTextColor)} />
              <span className="text-xs text-foreground">Риск: <strong className={riskTextColor}>{riskLevel}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {taskStatus !== "running" ? (
              <>
                <Button
                  className="flex-1 gap-2 bg-primary hover:bg-primary/90 py-5 sm:py-5 text-base font-bold h-14 sm:h-auto"
                  onClick={handleStart}
                  disabled={selectedIds.length === 0}
                >
                  <Play className="h-5 w-5" /> Запустить прогрев
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 py-5 text-sm border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10 shrink-0"
                  onClick={handleJoinChannels}
                  disabled={selectedIds.length === 0}
                  title="Вступить в указанные каналы/группы без запуска прогрева"
                >
                  <Users className="h-4 w-4" /> Вступить
                </Button>
              </>
            ) : (
              <Button variant="destructive" className="flex-1 gap-2 py-5 text-sm font-semibold" onClick={handleStop}>
                <Square className="h-5 w-5" /> Остановить
              </Button>
            )}
            <div className={cn("flex items-center gap-2 text-sm font-medium",
              taskStatus === "running" ? "text-emerald-400" : taskStatus === "completed" ? "text-primary" : "text-muted-foreground")}>
              <span className={cn("w-2 h-2 rounded-full",
                taskStatus === "running" ? "bg-emerald-400 animate-pulse" : taskStatus === "completed" ? "bg-primary" : "bg-muted-foreground")} />
              {taskStatus === "running" ? "Работает" : taskStatus === "completed" ? "Завершён" : taskStatus === "failed" ? "Ошибка" : "Остановлен"}
            </div>
          </div>
          {channels.length === 0 && defaultChannels.length > 0 && (
            <p className="text-xs text-muted-foreground">ℹ Будут использованы каналы по умолчанию.</p>
          )}
          {selectedIds.length === 0 && (
            <p className="text-xs text-amber-400">⚠ Выберите аккаунты для прогрева.</p>
          )}
        </div>
      </Section>

      {/* ══ 8. LOGS ══ */}
      <Section
        title="Журнал выполнения" icon={Inbox} iconBg="bg-muted-foreground/20 text-muted-foreground"
        defaultOpen={taskStatus === "running" || logs.length > 0}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              {(["all", "success", "warning", "error", "info"] as const).map((f) => (
                <button key={f} onClick={() => setLogFilter(f)}
                  className={cn("px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors",
                    logFilter === f ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/30")}>
                  {{ all: "ВСЕ", success: "УСПЕХ", warning: "ПРЕДУПР.", error: "ОШИБКИ", info: "ИНФО" }[f]}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground gap-1"
              onClick={() => setLogs([])}>
              <Trash2 className="h-3 w-3" /> Очистить
            </Button>
          </div>

          <div className="bg-muted/20 rounded-lg border border-border/30 h-64 overflow-y-auto font-mono text-[11px] p-3 space-y-0.5">
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40">
                <Inbox className="h-8 w-8 mb-2" />
                <p className="text-xs">
                  {taskStatus === "idle" ? "Запустите прогрев чтобы увидеть логи" : "Нет записей"}
                </p>
              </div>
            ) : (
              filteredLogs.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-muted-foreground/60 shrink-0">{l.time}</span>
                  <span className={logColor[l.type]}>{l.message}</span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </Section>

      {/* Results popup */}
      {mgmtResults && (
        <ResultList results={mgmtResults} onClose={() => setMgmtResults(null)} />
      )}
    </div>
  );
};

export default Warming;
