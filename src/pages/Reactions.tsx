import { useState, useEffect, useRef } from "react";
import { useRunningTask } from "@/hooks/useRunningTask";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronDown, ChevronRight, Users, Settings2, Play, Terminal,
  X, Plus, Shield, Inbox, BarChart3, Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import AccountSelector, { SelectorAccount } from "@/components/dashboard/AccountSelector";

const allEmojis = ["👍", "❤️", "🔥", "😂", "🤔", "👊", "🙏", "🎉", "💯", "😍", "🤝", "👎"];

interface LogLine { text: string; ts: string; }

const logColor = (text: string) => {
  const t = text.toLowerCase();
  if (t.includes("ошибка") || t.includes("error") || t.includes("заблокирован") || t.includes("banned") || t.includes("критическая")) return "text-red-400";
  if (t.includes("warning") || t.includes("warn") || t.includes("floodwait") || t.includes("пропуск")) return "text-amber-400";
  if (t.includes("✓") || t.includes("успешн") || t.includes("завершено")) return "text-emerald-400";
  if (t.includes("[*]") || t.includes("подключён") || t.includes("аккаунтов") || t.includes("постов")) return "text-blue-400";
  return "text-foreground/80";
};

// ── Collapsible ──────────────────────────────────────────────

interface CSProps { title: string; icon: React.ElementType; iconBg: string; children: React.ReactNode; defaultOpen?: boolean; badge?: string; }

const CollapsibleSection = ({ title, icon: Icon, iconBg, children, defaultOpen = true, badge }: CSProps) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-4 hover:bg-muted/20 transition-colors">
        <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", iconBg)}><Icon className="h-4 w-4" /></div>
        <span className="text-sm font-semibold text-foreground flex-1 text-left">{title}</span>
        {badge && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary">{badge}</span>}
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-border/30 pt-4">{children}</div>}
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────

const Reactions = () => {
  const { toast } = useToast();
  // Accounts
  const [allAccounts, setAllAccounts] = useState<SelectorAccount[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const { taskId, taskStatus, setTaskId, setTaskStatus, busyAccountIds } = useRunningTask("reactions");

  // Logs
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  // Stats parsed from logs
  const [stats, setStats] = useState({ success: 0, skipped: 0, errors: 0 });

  // Settings
  const [aiProtection, setAiProtection] = useState(false);
  const [channel, setChannel] = useState("");
  const [postsCount, setPostsCount] = useState(20);
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>(["👍", "❤️", "🔥"]);
  const [emojiMode, setEmojiMode] = useState("sequential");
  const [reactionChance, setReactionChance] = useState([50]);
  const [reactionsPerAccount, setReactionsPerAccount] = useState(1);
  const [reactionDelay, setReactionDelay] = useState([5]);
  const reactionDelayMin = reactionDelay[0] ?? 5;
  const reactionDelayMax = reactionDelay[0] ?? 5;
  const [skipAlreadyReacted, setSkipAlreadyReacted] = useState(true);
  const [postAgeMin, setPostAgeMin] = useState(0);
  const [postAgeMax, setPostAgeMax] = useState(48);
  const [usePaidReactions, setUsePaidReactions] = useState(false);
  const [paidStars, setPaidStars] = useState(1);
  const [paidPercent, setPaidPercent] = useState(10);

  useEffect(() => {
    fetch("/api/accounts", { credentials: "include" })
      .then(r => r.json())
      .then(d => setAllAccounts(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // SSE reconnect when taskId changes or on mount with running task
  useEffect(() => {
    if (!taskId || taskStatus !== "running") return;
    if (esRef.current) { esRef.current.close(); esRef.current = null; }
    const es = new EventSource(`/api/tasks/${taskId}/logs`, { withCredentials: true });
    esRef.current = es;
    es.onmessage = (e) => {
      const text = e.data;
      const ts = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLogs(prev => [...prev, { text, ts }]);
      // Parse stats
      const m = text.match(/\[STAT\]\s+success=(\d+)\s+skipped=(\d+)\s+errors=(\d+)/);
      if (m) setStats({ success: +m[1], skipped: +m[2], errors: +m[3] });
    };
    es.addEventListener("done", () => {
      setTaskStatus("completed");
      es.close();
      esRef.current = null;
    });
    es.onerror = () => {
      es.close();
      esRef.current = null;
    };
    return () => { es.close(); esRef.current = null; };
  }, [taskId, taskStatus]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const addLog = (text: string) => {
    const ts = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs(prev => [...prev, { text, ts }]);
  };

  const toggleEmoji = (e: string) => {
    setSelectedEmojis(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);
  };

  const handleStart = async () => {
    if (!channel.trim()) { addLog("Укажите канал или группу"); return; }
    if (selectedIds.length === 0) { addLog("Выберите аккаунты"); return; }
    setLogs([]);
    setStats({ success: 0, skipped: 0, errors: 0 });
    try {
      const res = await fetch("/api/tools/reactions/start", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: channel.trim(),
          account_ids: selectedIds,
          posts_count: postsCount,
          reactions_list: selectedEmojis,
          emoji_mode: emojiMode,
          reactions_per_account: reactionsPerAccount,
          reaction_chance: reactionChance,
          reaction_delay: [reactionDelayMin, reactionDelayMax],
          ai_protection: aiProtection,
          skip_already_reacted: skipAlreadyReacted,
          post_age_min_minutes: postAgeMin,
          post_age_max_hours: postAgeMax,
          use_paid_reactions: usePaidReactions,
          paid_stars: paidStars,
          paid_reaction_percent: paidPercent,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Ошибка" }));
        const msg = err.detail || res.statusText;
        addLog(`Ошибка: ${msg}`);
        toast({ title: "Ошибка запуска", description: msg, variant: "destructive" });
        return;
      }
      const data = await res.json();
      setTaskId(data.task_id);
      setTaskStatus("running");
      addLog(`Задача запущена: ${data.task_id}`);
    } catch (e) {
      addLog(`Ошибка запуска: ${e}`);
    }
  };

  const handleStop = async () => {
    if (!taskId) return;
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE", credentials: "include" });
    setTaskStatus("stopped");
    addLog("Задача остановлена");
    if (esRef.current) { esRef.current.close(); esRef.current = null; }
  };

  const isRunning = taskStatus === "running";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      {/* ═══ Header ═══ */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">⚡ Масс Реакции</h1>
        <p className="text-muted-foreground text-sm mt-1">Автоматическая расстановка реакций на посты в каналах</p>
      </div>

      {/* ═══ Account Select ═══ */}
      <CollapsibleSection title="Выбор аккаунтов" icon={Users} iconBg="bg-violet-500/20 text-violet-400" badge={selectedIds.length > 0 ? `${selectedIds.length} Выбрано` : undefined}>
        <AccountSelector accounts={allAccounts} selectedIds={selectedIds} onChange={setSelectedIds} label="для реакций" busyIds={busyAccountIds} />
      </CollapsibleSection>

      {/* ═══ Settings ═══ */}
      <CollapsibleSection title="Настройки реакций" icon={Settings2} iconBg="bg-emerald-500/20 text-emerald-400">
        {/* AI Protection */}
        <div className="rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-500/5 to-transparent p-4 mb-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0"><Shield className="h-5 w-5 text-violet-400" /></div>
          <div className="flex-1">
            <div className="flex items-center gap-2"><span className="text-sm font-bold text-foreground">AI Защита аккаунтов</span><span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 font-bold">NEW</span></div>
            <p className="text-xs text-muted-foreground mt-0.5">Интеллектуальная защита от блокировок и банов</p>
          </div>
          <button onClick={() => setAiProtection(!aiProtection)} className={cn("w-11 h-6 rounded-full transition-colors relative shrink-0", aiProtection ? "bg-violet-500" : "bg-muted")}>
            <div className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform", aiProtection ? "left-[22px]" : "left-0.5")} />
          </button>
        </div>

        {/* Channel target */}
        <div className="rounded-lg border border-border/50 bg-background/30 p-4 mb-4 space-y-3">
          <div className="flex items-center gap-2">
            <span>🎯</span><span className="text-sm font-bold text-foreground">Канал / Группа</span>
          </div>
          <Input
            value={channel}
            onChange={e => setChannel(e.target.value)}
            placeholder="@username или t.me/channel"
            className="bg-background/50 font-mono"
          />
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground flex-1">Количество постов для обработки</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-mono">{postsCount}</span>
            <Input type="number" value={postsCount} onChange={e => setPostsCount(+e.target.value)} className="w-20 bg-background/50" min={1} max={500} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* LEFT */}
          <div className="space-y-4">
            {/* Emoji picker */}
            <div className="rounded-lg border border-border/50 bg-background/30 p-4 space-y-3">
              <div className="flex items-center gap-2"><span>⭐</span><span className="text-sm font-bold text-foreground">Эмодзи для реакций</span></div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {allEmojis.map(e => (
                  <button key={e} onClick={() => toggleEmoji(e)} className={cn("h-10 rounded-lg text-lg flex items-center justify-center transition-all border", selectedEmojis.includes(e) ? "border-primary/50 bg-primary/10 scale-110" : "border-border/30 bg-background/30 hover:border-border/60")}>
                    {e}
                  </button>
                ))}
              </div>
              <div>
                <span className="text-xs text-muted-foreground mb-1.5 block">Режим эмодзи</span>
                <div className="flex gap-1 bg-muted/20 rounded-lg p-0.5 w-fit">
                  <button onClick={() => setEmojiMode("random")} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all", emojiMode === "random" ? "bg-primary/15 text-primary" : "text-muted-foreground")}>⚡ Случайный</button>
                  <button onClick={() => setEmojiMode("sequential")} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all", emojiMode === "sequential" ? "bg-violet-500/15 text-violet-400" : "text-muted-foreground")}>≡ Последовательный</button>
                </div>
              </div>
            </div>

            {/* Per account */}
            <div className="rounded-lg border border-border/50 bg-background/30 p-4 space-y-3">
              <div className="flex items-center gap-2"><span>🔄</span><span className="text-sm font-bold text-foreground">Ротация аккаунтов</span></div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground flex-1">Реакций на аккаунт</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-mono">{reactionsPerAccount}</span>
                <Input type="number" value={reactionsPerAccount} onChange={e => setReactionsPerAccount(Math.min(3, Math.max(1, +e.target.value)))} className="w-20 bg-background/50" min={1} max={3} />
              </div>
              <p className="text-[10px] text-muted-foreground">Обычный аккаунт: 1, Premium: до 3</p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-4">
            {/* Delays */}
            <div className="rounded-lg border border-border/50 bg-background/30 p-4 space-y-4">
              <div className="flex items-center gap-2"><span>⏱</span><span className="text-sm font-bold text-foreground">Задержки</span></div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">Задержка между реакциями</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-mono">{reactionDelay[0]} сек</span>
                </div>
                <Slider value={reactionDelay} onValueChange={setReactionDelay} min={5} max={60} />
                <p className="text-[10px] text-muted-foreground mt-1">Минимум 5с (требование Telegram)</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">Вероятность реакции</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/15 text-primary font-mono">{reactionChance[0]}%</span>
                </div>
                <Slider value={reactionChance} onValueChange={setReactionChance} min={0} max={100} />
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* ═══ Launch ═══ */}
      <CollapsibleSection title="Запуск" icon={Play} iconBg="bg-primary/20 text-primary">
        <div className="flex flex-wrap gap-3 mb-4">
          {[
            { icon: "🟣", label: "Аккаунты", value: selectedIds.length },
            { icon: "🎯", label: "Канал", value: channel || "—" },
            { icon: "😀", label: "Эмодзи", value: selectedEmojis.length },
            { icon: "📄", label: "Постов", value: postsCount },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/30 bg-background/30">
              <span>{s.icon}</span><span className="text-xs text-muted-foreground">{s.label}:</span><span className="text-sm font-bold text-foreground">{s.value}</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border/50 bg-background/30 p-4 flex items-center gap-4">
          {!isRunning ? (
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8" onClick={handleStart} disabled={!channel.trim() || selectedIds.length === 0}>
              <Play className="h-4 w-4" /> Запустить реакции
            </Button>
          ) : (
            <Button variant="destructive" className="gap-2 px-8" onClick={handleStop}>
              <Square className="h-4 w-4" /> Остановить
            </Button>
          )}
          {isRunning && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-emerald-400">В работе</span>
            </div>
          )}
          {taskStatus === "completed" && <span className="text-sm text-emerald-400">✓ Завершено</span>}
          {taskStatus === "stopped" && <span className="text-sm text-amber-400">Остановлено</span>}
        </div>
      </CollapsibleSection>

      {/* ═══ Logs ═══ */}
      <CollapsibleSection title="Журнал" icon={Terminal} iconBg="bg-muted-foreground/20 text-muted-foreground" defaultOpen={isRunning}>
        <div
          ref={logsRef}
          className="rounded-lg bg-black/40 min-h-[192px] p-4 font-mono text-xs overflow-y-auto max-h-72"
          onScroll={() => {
            const el = logsRef.current;
            if (!el) return;
            const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
            setAutoScroll(atBottom);
          }}
        >
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground/60"><Inbox className="h-8 w-8 mb-2" /><span className="text-sm">Логов пока нет</span></div>
          ) : (
            <div className="space-y-0.5">
              {logs.map((l, i) => (
                <div key={i} className={cn("flex gap-2", logColor(l.text))}>
                  <span className="text-muted-foreground shrink-0">{l.ts}</span>
                  <span className="break-all">{l.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* ═══ Stats ═══ */}
      <CollapsibleSection title="Статистика" icon={BarChart3} iconBg="bg-violet-500/20 text-violet-400" defaultOpen={false}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { icon: "🟢", label: "Успешно", value: stats.success, color: "border-emerald-500/30" },
            { icon: "⏭", label: "Пропущено", value: stats.skipped, color: "border-amber-500/30" },
            { icon: "🔴", label: "Ошибки", value: stats.errors, color: "border-red-500/30" },
          ].map(s => (
            <div key={s.label} className={cn("rounded-lg border p-3 bg-background/30", s.color)}>
              <div className="text-xs text-muted-foreground">{s.icon} {s.label}</div>
              <div className="text-lg font-bold text-foreground mt-1">{s.value}</div>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default Reactions;
