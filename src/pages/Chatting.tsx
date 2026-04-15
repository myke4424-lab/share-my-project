import { useState, useRef, useEffect } from "react";
import { useRunningTask } from "@/hooks/useRunningTask";
import {
  ChevronDown, ChevronRight, Users, Settings2, Play, Terminal,
  X, Plus, Shield, Inbox, Download, Trash2,
  ChevronsRight, ChevronsLeft, ChevronLeft, Check,
  RefreshCw, Star, Eye, Pencil, MessageSquare, Square,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import AccountSelector, { SelectorAccount } from "@/components/dashboard/AccountSelector";

const systemPrompts = [
  { id: 1, name: "Дружелюбный собеседник", selected: true, content: "Ты дружелюбный собеседник. Общайся тепло и непринуждённо, задавай уточняющие вопросы, проявляй искренний интерес к собеседнику. Используй неформальный стиль, без канцелярита." },
  { id: 2, name: "Интимный", selected: false, content: "Ты близкий друг собеседника. Общайся доверительно, мягко, с лёгкой флиртовой нотой. Используй тёплые обращения, будь внимателен к настроению." },
  { id: 3, name: "Экспертный тон", selected: false, content: "Ты эксперт в теме разговора. Отвечай профессионально, аргументированно, с опорой на факты. Используй терминологию, но объясняй сложные моменты доступно." },
  { id: 4, name: "Краткие ответы", selected: false, content: "Отвечай максимально кратко — 1-2 предложения. Только суть, без воды и лирических отступлений. Если вопрос требует пояснения — уточни что именно нужно." },
  { id: 5, name: "Юморной подход", selected: false, content: "Ты остроумный собеседник с хорошим чувством юмора. Добавляй лёгкие шутки, играй со словами, используй иронию. Не переусердствуй — юмор должен быть уместным." },
  { id: 6, name: "Формальный тон", selected: false, content: "Общайся официально и уважительно. Используй вежливые обращения, полные предложения, деловой стиль. Избегай сокращений и разговорных выражений." },
];


// ── Collapsible ──────────────────────────────────────────────

interface CollapsibleSectionProps {
  title: string; icon: React.ElementType; iconBg: string; children: React.ReactNode; defaultOpen?: boolean; badge?: string;
}

const CollapsibleSection = ({ title, icon: Icon, iconBg, children, defaultOpen = true, badge }: CollapsibleSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-4 hover:bg-muted/20 transition-colors">
        <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", iconBg)}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold text-foreground flex-1 text-left">{title}</span>
        {badge && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary">{badge}</span>}
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-border/30 pt-4">{children}</div>}
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────

const Chatting = () => {
  const { toast } = useToast();

  // Accounts
  const [allAccounts, setAllAccounts] = useState<SelectorAccount[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    fetch("/api/accounts", { credentials: "include" })
      .then(r => r.json())
      .then(d => setAllAccounts(Array.isArray(d) ? d : []))
      .catch(() => {});
    fetch("/api/prompts?tool=chatting", { credentials: "include" })
      .then(r => r.json())
      .then(d => Array.isArray(d) && setUserPrompts(d))
      .catch(() => {});
    fetch("/api/tools/chatting/config", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.reply_text) setAutoReplyText(d.reply_text); if (d.auto_reply) setAutoReply(true); })
      .catch(() => {});
  }, []);

  // Settings
  const [protectionMode, setProtectionMode] = useState("balanced");
  const [reactionMode, setReactionMode] = useState<"interval" | "triggers">("interval");
  const [replyChance, setReplyChance] = useState([35]);
  const [triggerInput, setTriggerInput] = useState("");
  const [triggers, setTriggers] = useState<string[]>([]);
  const [thematicAI, setThematicAI] = useState(false);
  const [workMode, setWorkMode] = useState<"count" | "time">("count");
  const [maxMessages, setMaxMessages] = useState([500]);
  const [msgsPerAccount, setMsgsPerAccount] = useState(10);

  // Target groups
  const [groupSourceTab, setGroupSourceTab] = useState("link");
  const [groupInput, setGroupInput] = useState("");
  const [groups, setGroups] = useState<string[]>([]);

  // Messages / Prompts
  const [useAIPrompt, setUseAIPrompt] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState(1);
  const [userPrompts, setUserPrompts] = useState<{ id: number; name: string; date: string; content: string }[]>([]);
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<{ id: number | null; name: string; desc: string; content: string; maxLen: number[] }>({ id: null, name: "", desc: "", content: "", maxLen: [150] });
  const [previewPrompt, setPreviewPrompt] = useState<{ name: string; content: string } | null>(null);

  // Language + auto-reply + organic
  const [langMode, setLangMode] = useState("auto");
  const [autoReply, setAutoReply] = useState(false);
  const [autoReplyText, setAutoReplyText] = useState("");
  const [contextDepth, setContextDepth] = useState([5]);
  const [organicEnabled, setOrganicEnabled] = useState(false);
  const [organicProduct, setOrganicProduct] = useState("");
  const [organicDesc, setOrganicDesc] = useState("");
  const [organicChance, setOrganicChance] = useState([15]);

  // Delays
  const [delayPreset, setDelayPreset] = useState("recommended");
  const [joinDelay, setJoinDelay] = useState([95]);
  const [sendDelay, setSendDelay] = useState([60]);

  // Task state
  const { taskId, taskStatus, setTaskId, setTaskStatus, busyAccountIds } = useRunningTask("chatting");
  const running = taskStatus === "running";
  const setRunning = (v: boolean) => setTaskStatus(v ? "running" : "idle");
  const [logs, setLogs] = useState<{ time: string; msg: string; ok: boolean }[]>([]);
  const esRef = useRef<EventSource | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Reconnect logs after page refresh
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

  const [savedPresets] = useState<{ id: number; name: string; date: string }[]>([]);

  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);


  const addTrigger = () => {
    const w = triggerInput.trim();
    if (w && !triggers.includes(w)) { setTriggers([...triggers, w]); setTriggerInput(""); }
  };

  const addGroup = () => {
    const g = groupInput.trim();
    if (g && !groups.includes(g)) { setGroups([...groups, g]); setGroupInput(""); }
  };

  const insertVariable = (v: string) => {
    const ta = promptTextareaRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const before = editingPrompt.content.slice(0, start);
      const after = editingPrompt.content.slice(ta.selectionEnd);
      setEditingPrompt({ ...editingPrompt, content: before + v + after });
    } else {
      setEditingPrompt({ ...editingPrompt, content: editingPrompt.content + v });
    }
  };

  const activePromptName = selectedPrompt <= 6
    ? systemPrompts.find(p => p.id === selectedPrompt)?.name || "—"
    : userPrompts.find(p => p.id === selectedPrompt)?.name || "—";

  const addLog = (msg: string) => {
    const ok = !msg.includes("❌") && !msg.includes("[!]");
    const time = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs(prev => [...prev.slice(-199), { time, msg, ok }]);
  };

  const handleStart = async () => {
    if (!autoReply || !autoReplyText.trim()) {
      toast({ title: "Укажите текст автоответа", description: "Включите автоответчик и введите текст", variant: "destructive" });
      return;
    }
    if (selectedIds.length === 0) {
      toast({ title: "Выберите аккаунты", variant: "destructive" });
      return;
    }
    let res: Response;
    try {
      res = await fetch("/api/tools/chatting/start", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_ids: selectedIds, reply_text: autoReplyText }),
      });
    } catch (e) {
      toast({ title: "Ошибка запуска", description: "Не удалось подключиться к серверу", variant: "destructive" });
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error || data.detail) {
      const msg = data.error || data.detail || res.statusText;
      addLog("❌ " + msg);
      toast({ title: "Ошибка запуска", description: msg, variant: "destructive" });
      return;
    }
    const tid = data.task_id;
    if (!tid) { addLog("❌ Неожиданный ответ сервера"); return; }
    setTaskId(tid); setRunning(true); setLogs([]);
    addLog("✅ Задача запущена: " + tid);
    toast({ title: "Автоответчик запущен" });
    // EventSource будет создан автоматически через useEffect
  };

  const handleStop = async () => {
    if (!taskId) return;
    esRef.current?.close();
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE", credentials: "include" });
    setRunning(false); addLog("⛔ Задача остановлена");
    toast({ title: "Автоответчик остановлен" });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      {/* ═══ SECTION 1 — Header ═══ */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">💬 Нейрочаттинг</h1>
        <p className="text-muted-foreground text-sm mt-1">Автоответчик на личные сообщения в Telegram</p>
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 w-fit">
          <span className="text-xs text-amber-400">⚡ Работает сейчас: <strong>DM Автоответчик</strong> — отвечает на личные сообщения. Чаттинг в группах — в разработке.</span>
        </div>
      </div>

      {/* ═══ SECTION 2 — Account Select ═══ */}
      <CollapsibleSection title="Выбор аккаунтов" icon={Users} iconBg="bg-violet-500/20 text-violet-400" badge={selectedIds.length > 0 ? `${selectedIds.length} Выбрано` : undefined}>
        <AccountSelector accounts={allAccounts} selectedIds={selectedIds} onChange={setSelectedIds} label="для чаттинга" busyIds={busyAccountIds} />
      </CollapsibleSection>

      {/* ═══ SECTION 3 — Settings ═══ */}
      <CollapsibleSection title="Настройки чаттинга" icon={Settings2} iconBg="bg-emerald-500/20 text-emerald-400" badge="В разработке">
        {/* AI Protection 3 modes */}
        <div className="rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-500/5 to-transparent p-4 mb-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0"><Shield className="h-5 w-5 text-violet-400" /></div>
            <div>
              <div className="flex items-center gap-2"><span className="text-sm font-bold text-foreground">AI Защита аккаунтов</span><span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 font-bold">NEW</span></div>
              <p className="text-xs text-muted-foreground mt-0.5">Выберите режим защиты при чаттинге</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: "conservative", icon: "🛡", label: "Консервативный", desc: "Максимальная защита", color: "border-violet-500/40 bg-violet-500/10" },
              { id: "balanced", icon: "⚡", label: "Сбалансированный", desc: "Оптимальное соотношение", color: "border-primary/40 bg-primary/10" },
              { id: "aggressive", icon: "🔥", label: "Агрессивный", desc: "Высокая скорость", color: "border-orange-500/40 bg-orange-500/10" },
            ].map(m => (
              <button key={m.id} onClick={() => setProtectionMode(m.id)} className={cn("p-3 rounded-lg border text-left transition-all", protectionMode === m.id ? m.color : "border-border/30 bg-background/30 hover:border-border/60")}>
                <div className="text-lg mb-1">{m.icon}</div>
                <div className="text-sm font-bold text-foreground">{m.label}</div>
                <div className="text-[10px] text-muted-foreground">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* LEFT — Reaction mode */}
          <div className="rounded-lg border border-border/50 bg-background/30 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <span>⚡</span><span className="text-sm font-bold text-foreground">Режим реакции</span><span className="text-xs text-muted-foreground">ⓘ</span>
            </div>
            <div className="flex gap-1 bg-muted/20 rounded-lg p-0.5 w-fit">
              <button onClick={() => setReactionMode("interval")} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all", reactionMode === "interval" ? "bg-primary/15 text-primary" : "text-muted-foreground")}>По интервалу</button>
              <button onClick={() => setReactionMode("triggers")} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all", reactionMode === "triggers" ? "bg-primary/15 text-primary" : "text-muted-foreground")}>На триггеры</button>
            </div>

            {reactionMode === "interval" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Вероятность ответа</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/15 text-primary font-mono">{replyChance[0]}%</span>
                </div>
                <Slider value={replyChance} onValueChange={setReplyChance} min={0} max={100} />
              </div>
            )}

            {reactionMode === "triggers" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input value={triggerInput} onChange={e => setTriggerInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addTrigger()} placeholder="Слова через запятую..." className="bg-background/50" />
                  <Button size="sm" variant="outline" onClick={addTrigger}><Plus className="h-3 w-3" /></Button>
                  <Button size="sm" variant="outline"><RefreshCw className="h-3 w-3" /></Button>
                  <Button size="sm" variant="outline" className="text-red-400" onClick={() => setTriggers([])}><Trash2 className="h-3 w-3" /></Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {triggers.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-amber-500/10 border border-amber-500/30 text-amber-300">
                      {t} <X className="h-3 w-3 cursor-pointer hover:text-red-400" onClick={() => setTriggers(triggers.filter(tr => tr !== t))} />
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-foreground">Тематический матчинг + AI</span>
                    <span className="text-xs text-muted-foreground">ⓘ</span>
                  </div>
                  <button onClick={() => setThematicAI(!thematicAI)} className={cn("w-11 h-6 rounded-full transition-colors relative", thematicAI ? "bg-primary" : "bg-muted")}>
                    <div className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform", thematicAI ? "left-[22px]" : "left-0.5")} />
                  </button>
                </div>
                {thematicAI && (
                  <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-300 space-y-1">
                    <p>✦ AI расширит ваши ключевые слова при запуске (1 запрос, кэш 7 дней).</p>
                    <p>Например: «крипта» → биткоин, eth, блокчейн, defi, binance и ещё ~40 слов.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT — Work mode */}
          <div className="rounded-lg border border-border/50 bg-background/30 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <span>⏱</span><span className="text-sm font-bold text-foreground">Режим работы</span><span className="text-xs text-muted-foreground">ⓘ</span>
            </div>
            <div className="flex gap-1 bg-muted/20 rounded-lg p-0.5 w-fit">
              <button onClick={() => setWorkMode("count")} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all", workMode === "count" ? "bg-primary/15 text-primary" : "text-muted-foreground")}>По количеству</button>
              <button onClick={() => setWorkMode("time")} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all", workMode === "time" ? "bg-primary/15 text-primary" : "text-muted-foreground")}>По времени</button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Макс. сообщений</span>
                <span className="text-xs px-2 py-0.5 rounded bg-primary/15 text-primary font-mono">{maxMessages[0]}</span>
              </div>
              <Slider value={maxMessages} onValueChange={setMaxMessages} min={1} max={2000} />
            </div>
            <div className="border-t border-border/30 pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <span>🔄</span><span className="text-xs font-bold text-foreground">Ротация аккаунтов</span><span className="text-xs text-muted-foreground">ⓘ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Сообщений на аккаунт</span>
                <Input type="number" value={msgsPerAccount} onChange={e => setMsgsPerAccount(+e.target.value)} className="w-20 bg-background/50" min={1} />
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* ═══ SECTION 4 — Target Groups ═══ */}
      <CollapsibleSection title="Целевые группы" icon={MessageSquare} iconBg="bg-primary/20 text-primary" badge="В разработке">
        <div className="flex gap-1 bg-muted/20 rounded-lg p-0.5 w-fit mb-4">
          {[
            { id: "link", label: "Юзернейм/Ссылка" },
            { id: "parsed", label: "С парсинга" },
            { id: "past", label: "Прошлые задачи" },
            { id: "folder", label: "Папка" },
          ].map(t => (
            <button key={t.id} onClick={() => setGroupSourceTab(t.id)} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all", groupSourceTab === t.id ? "bg-blue-500/15 text-blue-400" : "text-muted-foreground")}>
              {t.label}
            </button>
          ))}
        </div>

        {groupSourceTab === "link" && (
          <div className="space-y-3">
            <textarea
              value={groupInput}
              onChange={e => setGroupInput(e.target.value)}
              placeholder={"@group или https://t.me/group\nМожно вводить несколько ссылок (каждая с новой строки)"}
              className="w-full min-h-[96px] rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button size="sm" className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 gap-1" onClick={addGroup}>
              <Plus className="h-3 w-3" /> Добавить
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{groups.length} группа</span>
              {groups.length > 0 && <button onClick={() => setGroups([])} className="text-xs text-red-400 hover:underline flex items-center gap-1"><Trash2 className="h-3 w-3" /> Очистить</button>}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {groups.map(g => (
                <span key={g} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-blue-500/10 border border-blue-500/30 text-blue-300">
                  {g} <X className="h-3 w-3 cursor-pointer hover:text-red-400" onClick={() => setGroups(groups.filter(gr => gr !== g))} />
                </span>
              ))}
            </div>
          </div>
        )}
        {groupSourceTab !== "link" && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/60">
            <Inbox className="h-8 w-8 mb-2" /><span className="text-xs">Скоро будет доступно</span>
          </div>
        )}
      </CollapsibleSection>

      {/* ═══ SECTION 5 — Message Settings / Prompts ═══ */}
      <CollapsibleSection title="Настройки сообщений" icon={MessageSquare} iconBg="bg-amber-500/20 text-amber-400">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-foreground">Использовать AI промпт</span>
          <button onClick={() => setUseAIPrompt(!useAIPrompt)} className={cn("w-11 h-6 rounded-full transition-colors relative", useAIPrompt ? "bg-primary" : "bg-muted")}>
            <div className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform", useAIPrompt ? "left-[22px]" : "left-0.5")} />
          </button>
        </div>

        {useAIPrompt && (
          <>
            {/* System prompts */}
            <div className="mb-4">
              <span className="text-xs font-semibold text-muted-foreground mb-2 block">Системные ({systemPrompts.length})</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {systemPrompts.map(p => (
                  <div key={p.id} className={cn("rounded-lg border p-3 transition-all cursor-pointer", selectedPrompt === p.id ? "border-violet-500/40 bg-violet-500/10" : "border-border/30 bg-background/30 hover:border-border/60")} onClick={() => setSelectedPrompt(p.id)}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-foreground">{p.name}</span>
                      {selectedPrompt === p.id && <Star className="h-3 w-3 text-amber-400 fill-amber-400" />}
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={e => { e.stopPropagation(); setPreviewPrompt({ name: p.name, content: p.content }); }}><Eye className="h-3 w-3" /></Button>
                      <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={(e) => { e.stopPropagation(); setSelectedPrompt(p.id); }}><Play className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User prompts */}
            <div>
              <span className="text-xs font-semibold text-muted-foreground mb-2 block">Мои промпты ({userPrompts.length})</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {userPrompts.map(p => (
                  <div key={p.id} className={cn("rounded-lg border p-3 transition-all cursor-pointer", selectedPrompt === p.id ? "border-primary/40 bg-primary/10" : "border-border/30 bg-background/30 hover:border-border/60")} onClick={() => setSelectedPrompt(p.id)}>
                    <div className="text-xs font-bold text-foreground mb-0.5">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground mb-2">{p.date}</div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={e => { e.stopPropagation(); setPreviewPrompt({ name: p.name, content: p.content || "Промпт пустой" }); }}><Eye className="h-3 w-3" /></Button>
                      <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={(e) => { e.stopPropagation(); setSelectedPrompt(p.id); }}><Play className="h-3 w-3" /></Button>
                      <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={(e) => { e.stopPropagation(); setEditingPrompt({ id: p.id, name: p.name, desc: "", content: p.content, maxLen: [150] }); setPromptModalOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 text-red-400" onClick={async e => { e.stopPropagation(); await fetch(`/api/prompts/${p.id}`, { method: "DELETE", credentials: "include" }); setUserPrompts(prev => prev.filter(x => x.id !== p.id)); if (selectedPrompt === p.id) setSelectedPrompt(1); }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
                <button onClick={() => { setEditingPrompt({ id: null, name: "", desc: "", content: "", maxLen: [150] }); setPromptModalOpen(true); }} className="rounded-lg border border-dashed border-border/50 p-3 flex flex-col items-center justify-center gap-2 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer min-h-[100px]">
                  <Plus className="h-6 w-6 text-primary" />
                  <span className="text-xs text-muted-foreground">Создать</span>
                </button>
              </div>
            </div>
          </>
        )}
      </CollapsibleSection>

      {/* ═══ SECTION 6 — Language + Auto-reply + Context + Organic ═══ */}
      <CollapsibleSection title="Языки и продвижение" icon={Settings2} iconBg="bg-blue-500/20 text-blue-400">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            {/* Language mode */}
            <div className="rounded-lg border border-border/50 bg-background/30 p-4 space-y-3">
              <div className="flex items-center gap-2"><span>🔤</span><span className="text-sm font-bold text-foreground">Режим определения языка</span></div>
              <p className="text-xs text-muted-foreground">Язык будет автоматически определяться из текста сообщения</p>
              <div className="flex gap-1 bg-muted/20 rounded-lg p-0.5 w-fit">
                <button onClick={() => setLangMode("auto")} className={cn("px-3 py-1.5 rounded-md text-xs font-medium", langMode === "auto" ? "bg-primary/15 text-primary" : "text-muted-foreground")}>⚡ Авто</button>
                <button onClick={() => setLangMode("manual")} className={cn("px-3 py-1.5 rounded-md text-xs font-medium", langMode === "manual" ? "bg-primary/15 text-primary" : "text-muted-foreground")}>≡ Ручной</button>
              </div>
            </div>

            {/* Auto reply */}
            <div className="rounded-lg border border-border/50 bg-background/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span>↩️</span><span className="text-sm font-bold text-foreground">Автоответчик</span><span className="text-xs text-muted-foreground">ⓘ</span></div>
                <button onClick={() => setAutoReply(!autoReply)} className={cn("w-11 h-6 rounded-full transition-colors relative", autoReply ? "bg-primary" : "bg-muted")}>
                  <div className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform", autoReply ? "left-[22px]" : "left-0.5")} />
                </button>
              </div>
              {autoReply && (
                <>
                  <textarea value={autoReplyText} onChange={e => setAutoReplyText(e.target.value)} onBlur={() => { fetch("/api/tools/chatting/config", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reply_text: autoReplyText, auto_reply: autoReply }) }).catch(() => {}); }} placeholder="Привет! Я сейчас занят..." className="w-full min-h-[80px] rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring" />
                  <p className="text-[10px] text-muted-foreground">ⓘ Текст сохраняется автоматически при потере фокуса</p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Context */}
            <div className="rounded-lg border border-border/50 bg-background/30 p-4 space-y-3">
              <div className="flex items-center gap-2"><span>🔔</span><span className="text-sm font-bold text-foreground">Контекст разговора</span><span className="text-xs text-muted-foreground">ⓘ</span></div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Глубина контекста</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/15 text-primary font-mono">{contextDepth[0]} сообщений</span>
                </div>
                <Slider value={contextDepth} onValueChange={setContextDepth} min={0} max={20} />
              </div>
              <p className="text-[10px] text-muted-foreground">ⓘ 0 = без контекста (как раньше). Больше сообщений = точнее ответы.</p>
            </div>

            {/* Organic */}
            <div className="rounded-lg border border-orange-500/30 bg-background/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span>🟠</span><span className="text-sm font-bold text-foreground">Органичное продвижение</span><span className="text-xs text-muted-foreground">ⓘ</span></div>
                <button onClick={() => setOrganicEnabled(!organicEnabled)} className={cn("w-11 h-6 rounded-full transition-colors relative", organicEnabled ? "bg-orange-500" : "bg-muted")}>
                  <div className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform", organicEnabled ? "left-[22px]" : "left-0.5")} />
                </button>
              </div>
              {organicEnabled && (
                <div className="space-y-3">
                  <Input value={organicProduct} onChange={e => setOrganicProduct(e.target.value)} placeholder="Например: TELEBOOST" className="bg-background/50" />
                  <textarea value={organicDesc} onChange={e => setOrganicDesc(e.target.value)} placeholder="Что делает сервис, ключевые преимущества..." className="w-full min-h-[64px] rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring" />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Вероятность упоминания</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 font-mono">{organicChance[0]}% сообщений</span>
                    </div>
                    <Slider value={organicChance} onValueChange={setOrganicChance} min={1} max={50} />
                  </div>
                  <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-300">
                    ⓘ Рекомендуется 10-20%. Слишком частые упоминания выглядят как спам.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* ═══ SECTION 7 — Delays ═══ */}
      <CollapsibleSection title="Настройка задержек" icon={Settings2} iconBg="bg-orange-500/20 text-orange-400">
        <div className="flex justify-end gap-1 mb-4">
          {[
            { id: "min", label: "⚡ Мин", color: "" },
            { id: "recommended", label: "✓ Рекомендованные", color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" },
            { id: "max", label: "❤ Макс", color: "" },
          ].map(p => (
            <button key={p.id} onClick={() => { setDelayPreset(p.id); if (p.id === "min") { setJoinDelay([30]); setSendDelay([15]); } else if (p.id === "recommended") { setJoinDelay([95]); setSendDelay([60]); } else { setJoinDelay([180]); setSendDelay([120]); } }} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all border", delayPreset === p.id && p.color ? p.color : delayPreset === p.id ? "bg-primary/15 text-primary border-primary/30" : "border-transparent bg-muted/30 text-muted-foreground")}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">Задержка входа в группу <span className="text-muted-foreground/60">ⓘ</span></span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-mono">{joinDelay[0]} сек</span>
            </div>
            <Slider value={joinDelay} onValueChange={setJoinDelay} min={10} max={300} />
            <p className="text-[10px] text-muted-foreground mt-1">{Math.round(joinDelay[0] * 0.9)}—{Math.round(joinDelay[0] * 1.3)} сек</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">Задержка перед отправкой <span className="text-muted-foreground/60">ⓘ</span></span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-mono">{sendDelay[0]} сек</span>
            </div>
            <Slider value={sendDelay} onValueChange={setSendDelay} min={5} max={200} />
            <p className="text-[10px] text-muted-foreground mt-1">{Math.round(sendDelay[0] * 0.7)}—{Math.round(sendDelay[0] * 1.3)} сек</p>
          </div>
        </div>
      </CollapsibleSection>

      {/* ═══ SECTION 8 — Presets ═══ */}
      <CollapsibleSection title="Пресеты настроек" icon={Star} iconBg="bg-amber-500/20 text-amber-400" defaultOpen={false}>
        <p className="text-xs text-muted-foreground mb-3">Сохраняйте и загружайте конфигурации</p>
        {savedPresets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground/60 mb-3">
            <Inbox className="h-6 w-6 mb-2" />
            <span className="text-xs">Нет сохранённых пресетов</span>
          </div>
        ) : (
          <div className="space-y-2 mb-3">
            {savedPresets.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border/30 bg-background/30">
                <div>
                  <div className="text-sm font-bold text-foreground">{p.name}</div>
                  <div className="text-[10px] text-muted-foreground">{p.date}</div>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Download className="h-3 w-3" /> Загрузить</Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs text-red-400"><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <Button variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
          <Plus className="h-4 w-4" /> Сохранить текущие настройки
        </Button>
      </CollapsibleSection>

      {/* ═══ SECTION 9 — Launch ═══ */}
      <CollapsibleSection title="Запуск чаттинга" icon={Play} iconBg="bg-primary/20 text-primary">
        <div className="flex flex-wrap gap-3 mb-4">
          {[
            { icon: "🟣", label: "Аккаунты", value: selectedIds.length },
            { icon: "🔵", label: "Группы", value: groups.length },
            { icon: "🟡", label: "Режим", value: reactionMode === "interval" ? "По интервалу" : "На триггеры" },
            { icon: "🟢", label: "Промпт", value: activePromptName },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/30 bg-background/30">
              <span>{s.icon}</span><span className="text-xs text-muted-foreground">{s.label}:</span><span className="text-sm font-bold text-foreground">{s.value}</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border/50 bg-background/30 p-4 flex items-center gap-4">
          {!running ? (
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8" onClick={handleStart}>
              <Play className="h-4 w-4" /> Запустить автоответчик
            </Button>
          ) : (
            <Button variant="destructive" className="gap-2 px-8" onClick={handleStop}>
              <Square className="h-4 w-4" /> Остановить
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${running ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            <span className="text-sm text-muted-foreground">{running ? "Запущено" : "Остановлено"}</span>
          </div>
        </div>
        {logs.length > 0 && (
          <div className="bg-background rounded-lg p-3 font-mono text-xs space-y-1 max-h-[200px] overflow-y-auto border border-border/30 mt-3">
            {logs.map((l, i) => (
              <div key={i} className={`flex gap-2 ${l.ok ? "text-emerald-400" : "text-red-400"}`}>
                <span className="text-muted-foreground shrink-0">{l.time}</span>
                <span>{l.msg}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </CollapsibleSection>

      {/* ═══ SECTION 10 — Logs ═══ */}
      <CollapsibleSection title="Логи автоответчика" icon={Terminal} iconBg="bg-muted-foreground/20 text-muted-foreground" defaultOpen={false}>
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/60 rounded-lg border border-border/30">
            <Inbox className="h-8 w-8 mb-2" />
            <span className="text-xs">Нет данных — запустите автоответчик</span>
          </div>
        ) : (
          <div className="bg-background rounded-lg p-3 font-mono text-xs space-y-1 max-h-[300px] overflow-y-auto border border-border/30">
            {logs.map((l, i) => (
              <div key={i} className={cn("flex gap-2", l.ok ? "text-emerald-400" : "text-red-400")}>
                <span className="text-muted-foreground shrink-0">{l.time}</span>
                <span>{l.msg}</span>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* ═══ PROMPT EDITOR MODAL ═══ */}
      <Dialog open={promptModalOpen} onOpenChange={setPromptModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingPrompt.id ? "Редактировать промпт" : "Создать промпт"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input value={editingPrompt.name} onChange={e => setEditingPrompt({ ...editingPrompt, name: e.target.value })} placeholder="Название промпта" className="bg-background/50" />
              <Input value={editingPrompt.desc} onChange={e => setEditingPrompt({ ...editingPrompt, desc: e.target.value })} placeholder="Описание (необязательно)" className="bg-background/50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Шаблон промпта</label>
              <textarea
                ref={promptTextareaRef}
                value={editingPrompt.content}
                onChange={e => setEditingPrompt({ ...editingPrompt, content: e.target.value })}
                placeholder={`Запиши ответ на сообщение в Telegram чате.\nЧат: {chat_title}\nОтправитель: {sender_name}\nСообщение: {message}\n\nТребования:\n- Ответ должен быть релевантным сообщению\n- Используй естественный, дружелюбный стиль\n- Длина: 4-5 слов`}
                className="w-full min-h-[160px] rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 space-y-2">
              <span className="text-xs font-bold text-amber-300">НАЖМИТЕ ДЛЯ ВСТАВКИ</span>
              <p className="text-[10px] text-amber-300/80">Переменные автоматически заменяются реальными данными при генерации</p>
              <div className="flex gap-1.5">
                {["{message}", "{chat_title}", "{sender_name}"].map(v => (
                  <button key={v} onClick={() => insertVariable(v)} className="px-2 py-1 rounded text-xs bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-mono">{v}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Максимальная длина</span>
                <span className="text-xs px-2 py-0.5 rounded bg-primary/15 text-primary font-mono">{editingPrompt.maxLen[0]}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground">Короткий</span>
                <Slider value={editingPrompt.maxLen} onValueChange={v => setEditingPrompt({ ...editingPrompt, maxLen: v })} min={10} max={500} className="flex-1" />
                <span className="text-[10px] text-muted-foreground">Длинный</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setPromptModalOpen(false)}>Отмена</Button>
            <Button className="bg-violet-500 hover:bg-violet-600 text-white gap-2" onClick={async () => {
              if (!editingPrompt.name.trim()) { toast({ title: "Введите название промпта", variant: "destructive" }); return; }
              if (editingPrompt.id) {
                await fetch(`/api/prompts/${editingPrompt.id}`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editingPrompt.name, content: editingPrompt.content }) });
                setUserPrompts(prev => prev.map(p => p.id === editingPrompt.id ? { ...p, name: editingPrompt.name, content: editingPrompt.content } : p));
              } else {
                const res = await fetch("/api/prompts", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool: "chatting", name: editingPrompt.name, content: editingPrompt.content }) });
                const data = await res.json();
                if (data.id) setUserPrompts(prev => [...prev, { id: data.id, name: editingPrompt.name, content: editingPrompt.content, date: new Date().toISOString().slice(0, 10) }]);
              }
              setPromptModalOpen(false);
              toast({ title: "Промпт сохранён" });
            }}>
              <Check className="h-4 w-4" /> Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview prompt dialog */}
      <Dialog open={!!previewPrompt} onOpenChange={v => { if (!v) setPreviewPrompt(null); }}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> {previewPrompt?.name}</DialogTitle>
          </DialogHeader>
          <div className="bg-muted/30 rounded-lg p-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap border border-border/40">
            {previewPrompt?.content}
          </div>
          <div className="flex justify-end mt-2">
            <Button variant="outline" onClick={() => setPreviewPrompt(null)}>Закрыть</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chatting;
