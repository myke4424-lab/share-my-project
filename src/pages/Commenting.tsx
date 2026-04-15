import { useState, useRef, useEffect } from "react";
import { useRunningTask } from "@/hooks/useRunningTask";
import {
  ChevronDown, ChevronRight, Users, Settings2, Play, Terminal,
  X, Plus, Shield, Inbox, Download, ChevronsRight, ChevronsLeft,
  ChevronLeft, Check, Star, Eye, Pencil, Trash2, Hash, MessageSquare, Square, Copy,
} from "lucide-react";
import ToolHeader from "@/components/dashboard/ToolHeader";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import AccountSelector, { SelectorAccount } from "@/components/dashboard/AccountSelector";

// ── Data ──────────────────────────────────────────────────────

const systemPrompts = [
  { id: 1, name: "Дружелюбный собеседник", selected: true,  content: "Ты дружелюбный комментатор. Оставляй тёплые, позитивные комментарии. Задавай вопросы, поддерживай дискуссию. Избегай агрессии и негатива." },
  { id: 2, name: "Экспертный тон",         selected: false, content: "Ты эксперт в теме публикации. Комментируй по существу, добавляй полезную информацию, ссылайся на факты. Используй профессиональные термины." },
  { id: 3, name: "Краткие ответы",         selected: false, content: "Комментируй кратко — 1 предложение максимум. Только суть, никакой воды. Будь чётким и по делу." },
  { id: 4, name: "Юморной подход",         selected: false, content: "Добавляй лёгкий юмор и иронию в комментарии. Используй эмодзи, игру слов, мемы (уместно). Оставайся дружелюбным и позитивным." },
  { id: 5, name: "Провокационный",         selected: false, content: "Задавай острые вопросы, провоцируй дискуссию. Выражай неожиданную точку зрения, оспаривай утверждения автора — но без оскорблений." },
  { id: 6, name: "Формальный тон",         selected: false, content: "Оставляй официальные, уважительные комментарии. Используй полные предложения, деловой стиль, без сленга и сокращений." },
];


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
const Commenting = () => {
  const { toast } = useToast();
  // Real data
  const [allAccounts, setAllAccounts] = useState<SelectorAccount[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Task state
  const { taskId, taskStatus, setTaskId, setTaskStatus, busyAccountIds } = useRunningTask("commenting");
  const running = taskStatus === "running";
  const setRunning = (v: boolean) => setTaskStatus(v ? "running" : "idle");
  const [logs, setLogs] = useState<{ time: string; msg: string; ok: boolean }[]>([]);
  const [statsData, setStatsData] = useState<{ name: string; comments: number }[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

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

  const [aiProtection, setAiProtection] = useState(false);
  const [commentMode, setCommentMode] = useState("all");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [thematicAI, setThematicAI] = useState(false);
  const [workMode, setWorkMode] = useState("count");
  const [maxComments, setMaxComments] = useState([500]);
  const [commentsPerAccount, setCommentsPerAccount] = useState(5);

  const [channelSourceTab, setChannelSourceTab] = useState("link");
  const [channelInput, setChannelInput] = useState("");
  const [channels, setChannels] = useState<string[]>([]);
  const [selectedParsedIds, setSelectedParsedIds] = useState<number[]>([1]);

  const [parsedSets] = useState<{ id: number; keywords: string; date: string; count: number; color: string }[]>([]);
  const [savedPresets, setSavedPresets] = useState<{ id: number; name: string; date: string; config: object }[]>(() => {
    try { return JSON.parse(localStorage.getItem("commenting_presets") || "[]"); } catch { return []; }
  });
  const [presetNameInput, setPresetNameInput] = useState("");
  const [presetNameDialogOpen, setPresetNameDialogOpen] = useState(false);

  const [useAIPrompt, setUseAIPrompt] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState(1);
  const [userPrompts, setUserPrompts] = useState<{ id: number; name: string; date: string; content: string }[]>([]);
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<{ id: number | null; name: string; desc: string; content: string; maxLen: number[] }>({ id: null, name: "", desc: "", content: "", maxLen: [150] });
  const [previewPrompt, setPreviewPrompt] = useState<{ name: string; content: string } | null>(null);

  const [langMode, setLangMode] = useState("auto");
  const [organicEnabled, setOrganicEnabled] = useState(false);
  const [organicProduct, setOrganicProduct] = useState("");
  const [organicDesc, setOrganicDesc] = useState("");
  const [organicChance, setOrganicChance] = useState([15]);

  const [delayPreset, setDelayPreset] = useState("recommended");
  const [commentDelay, setCommentDelay] = useState([45]);
  const [joinDelay, setJoinDelay] = useState([95]);

  const [whitelistThreshold, setWhitelistThreshold] = useState([100]);

  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Token usage
  const [tokenUsage, setTokenUsage] = useState<{
    month: string; used: number; limit: number; remaining: number; percent: number;
  } | null>(null);

  const loadTokenUsage = () => {
    fetch("/api/tools/commenting/token-usage", { credentials: "include" })
      .then(r => r.json())
      .then(d => setTokenUsage(d))
      .catch(() => {});
  };

  // Load on mount
  useEffect(() => {
    fetch("/api/accounts", { credentials: "include" })
      .then(r => r.json())
      .then(data => setAllAccounts(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch("/api/tools/commenting/user-config", { credentials: "include" })
      .then(r => r.json())
      .then(data => { if (data.channel_pool) setChannels(data.channel_pool); })
      .catch(() => {});
    fetch("/api/tools/commenting/stats", { credentials: "include" })
      .then(r => r.json())
      .then(data => setStatsData(data.accounts ?? []))
      .catch(() => {});
    fetch("/api/prompts?tool=commenting", { credentials: "include" })
      .then(r => r.json())
      .then(d => Array.isArray(d) && setUserPrompts(d))
      .catch(() => {});
    loadTokenUsage();
  }, []);

  useEffect(() => { if (logs.length > 0) logsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  const addLog = (msg: string) => {
    const now = new Date().toTimeString().slice(0, 8);
    const ok = !msg.toLowerCase().includes("ошиб") && !msg.toLowerCase().includes("error");
    setLogs(p => [...p, { time: now, msg, ok }]);
  };

  const saveChannelsToConfig = async (newChannels: string[]) => {
    try {
      const res = await fetch("/api/tools/commenting/user-config", { credentials: "include" });
      const cfg = res.ok ? await res.json() : {};
      cfg.channel_pool = newChannels;
      const saveRes = await fetch("/api/tools/commenting/user-config", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      if (!saveRes.ok) throw new Error(`HTTP ${saveRes.status}`);
    } catch (e) {
      toast({ title: "Ошибка сохранения каналов", description: String(e), variant: "destructive" });
    }
  };

  const handleStart = async () => {
    // Валидация перед запуском
    if (selectedIds.length === 0) {
      toast({ title: "Выберите аккаунты", description: "Нужен хотя бы один аккаунт для комментинга", variant: "destructive" });
      return;
    }
    if (channels.length === 0) {
      toast({ title: "Добавьте каналы", description: "Нужен хотя бы один канал для комментирования", variant: "destructive" });
      return;
    }

    // Сохраняем все настройки в user-config перед запуском
    try {
      const cfgRes = await fetch("/api/tools/commenting/user-config", { credentials: "include" });
      const cfg = cfgRes.ok ? await cfgRes.json() : {};

      // Prompt / tone
      if (useAIPrompt) {
        const allPrompts = [...systemPrompts, ...userPrompts];
        const sel = allPrompts.find(p => p.id === selectedPrompt);
        if (sel?.content) {
          cfg.comment_style = cfg.comment_style ?? {};
          cfg.comment_style.tone = sel.content;
          if (cfg.account_personas) {
            for (const key of Object.keys(cfg.account_personas)) {
              (cfg.account_personas as Record<string, string>)[key] = sel.content;
            }
          }
        }
      }

      // Режим, задержки, лимиты
      cfg.comment_mode = commentMode;
      cfg.max_comments = maxComments[0];
      cfg.comments_per_account = commentsPerAccount;
      cfg.keywords = keywords;
      cfg.delays = { comment_delay: commentDelay[0], join_delay: joinDelay[0] };
      cfg.language_mode = langMode;
      if (organicEnabled) {
        cfg.organic = {
          enabled: true,
          product: organicProduct,
          desc: organicDesc,
          chance: organicChance[0],
        };
      } else {
        cfg.organic = { enabled: false };
      }

      await fetch("/api/tools/commenting/user-config", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
    } catch (e) {
      // Не блокируем запуск — настройки могут быть уже сохранены ранее
      console.warn("handleStart: не удалось сохранить user-config:", e);
    }

    let res: Response;
    try {
      res = await fetch("/api/tools/commenting/start", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_ids: selectedIds }),
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
    toast({ title: "Комментинг запущен" });
    loadTokenUsage();
  };

  const handleStop = async () => {
    if (!taskId) return;
    esRef.current?.close();
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE", credentials: "include" });
    setRunning(false); addLog("⛔ Задача остановлена");
    toast({ title: "Комментинг остановлен" });
    loadTokenUsage();
  };

  const addKeyword = () => { const w = keywordInput.trim(); if (w && !keywords.includes(w)) { setKeywords([...keywords, w]); setKeywordInput(""); } };
  const addChannel = () => {
    const lines = channelInput.split("\n").map(l => l.trim()).filter(l => l && !channels.includes(l));
    if (lines.length) {
      const updated = [...channels, ...lines];
      setChannels(updated);
      setChannelInput("");
      saveChannelsToConfig(updated);
    }
  };
  const removeChannel = (c: string) => {
    const updated = channels.filter(ch => ch !== c);
    setChannels(updated);
    saveChannelsToConfig(updated);
  };
  const toggleParsedSet = (id: number) => setSelectedParsedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const activePromptName = selectedPrompt <= 6 ? systemPrompts.find(p => p.id === selectedPrompt)?.name || "—" : userPrompts.find(p => p.id === selectedPrompt)?.name || "—";

  const insertVariable = (v: string) => {
    setEditingPrompt({ ...editingPrompt, content: editingPrompt.content + v });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      <ToolHeader
        icon={MessageSquare}
        iconBg="bg-violet-500/15"
        iconColor="text-violet-400"
        title="Нейрокомментинг"
        description="AI-комментарии под постами в Telegram каналах"
        accentColor="from-violet-500/10"
        steps={[
          { label: "Аккаунты", done: selectedIds.length > 0, hint: "Выберите хотя бы один аккаунт" },
          { label: "Каналы", done: channels.length > 0, hint: "Добавьте каналы для комментирования" },
        ]}
        running={running}
        onStart={handleStart}
        onStop={handleStop}
        startLabel="Запустить комментинг"
        taskId={taskId}
      />

      {/* ═══ Token usage banner ═══ */}
      {tokenUsage && tokenUsage.limit === 0 && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-xs text-amber-300 flex items-center gap-2">
          <span className="shrink-0">⚠️</span>
          Нейрокомментинг недоступен на вашем тарифе. Подключите план «Нейрокомментинг» или «Pro System».
        </div>
      )}
      {tokenUsage && tokenUsage.limit > 0 && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">GPT-токены — {tokenUsage.month}</span>
              <span className="text-xs font-mono text-foreground">
                {tokenUsage.used.toLocaleString("ru-RU")} / {tokenUsage.limit.toLocaleString("ru-RU")}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  tokenUsage.percent >= 90 ? "bg-red-500" : tokenUsage.percent >= 70 ? "bg-amber-500" : "bg-violet-500"
                )}
                style={{ width: `${Math.min(tokenUsage.percent, 100)}%` }}
              />
            </div>
          </div>
          <span className={cn(
            "text-xs font-bold shrink-0",
            tokenUsage.percent >= 90 ? "text-red-400" : tokenUsage.percent >= 70 ? "text-amber-400" : "text-violet-400"
          )}>
            {tokenUsage.remaining.toLocaleString("ru-RU")} ост.
          </span>
        </div>
      )}

      {/* ═══ SECTION 2 — Account Select ═══ */}
      <CollapsibleSection title="Выбор аккаунтов" icon={Users} iconBg="bg-violet-500/20 text-violet-400" badge={selectedIds.length > 0 ? `${selectedIds.length} Выбрано` : undefined}>
        <AccountSelector accounts={allAccounts} selectedIds={selectedIds} onChange={setSelectedIds} label="для комментинга" busyIds={busyAccountIds} />
      </CollapsibleSection>

      {/* ═══ SECTION 3 — Settings ═══ */}
      <CollapsibleSection title="Настройки" icon={Settings2} iconBg="bg-emerald-500/20 text-emerald-400" badge={channels.length > 0 ? `${channels.length} каналов` : undefined}>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* LEFT — Comment mode */}
          <div className="rounded-lg border border-border/50 bg-background/30 p-4 space-y-4">
            <div className="flex items-center gap-2"><span>⚙️</span><span className="text-sm font-bold text-foreground">Режим комментирования</span><span className="text-xs text-muted-foreground">ⓘ</span></div>
            <div className="flex gap-1 bg-muted/20 rounded-lg p-0.5 w-fit">
              {[{ id: "random", label: "Случайный" }, { id: "keywords", label: "По ключевым словам" }, { id: "all", label: "Все посты" }].map(m => (
                <button key={m.id} onClick={() => setCommentMode(m.id)} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all", commentMode === m.id ? "bg-violet-500/15 text-violet-400" : "text-muted-foreground")}>{m.label}</button>
              ))}
            </div>
            {commentMode === "keywords" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input value={keywordInput} onChange={e => setKeywordInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addKeyword()} placeholder="Введите ключевое слово..." className="bg-background/50" />
                  <Button size="sm" variant="outline" onClick={addKeyword}><Plus className="h-3 w-3" /></Button>
                </div>
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {keywords.map(k => (
                      <span key={k} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-amber-500/10 border border-amber-500/30 text-amber-300">
                        {k} <X className="h-3 w-3 cursor-pointer hover:text-red-400" onClick={() => setKeywords(keywords.filter(kw => kw !== k))} />
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <div className="flex items-center gap-2"><span className="text-xs text-foreground">Тематический матчинг + AI</span><span className="text-xs text-muted-foreground">ⓘ</span></div>
                  <button onClick={() => setThematicAI(!thematicAI)} className={cn("w-11 h-6 rounded-full transition-colors relative", thematicAI ? "bg-primary" : "bg-muted")}>
                    <div className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform", thematicAI ? "left-[22px]" : "left-0.5")} />
                  </button>
                </div>
                {thematicAI && (
                  <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-300">
                    ✦ AI расширит ключевые слова при запуске (1 запрос, кэш 7 дней).
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT — Work mode */}
          <div className="rounded-lg border border-border/50 bg-background/30 p-4 space-y-4">
            <div className="flex items-center gap-2"><span>⏱</span><span className="text-sm font-bold text-foreground">Режим работы</span><span className="text-xs text-muted-foreground">ⓘ</span></div>
            <div className="flex gap-1 bg-muted/20 rounded-lg p-0.5 w-fit">
              <button onClick={() => setWorkMode("count")} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all", workMode === "count" ? "bg-violet-500/15 text-violet-400" : "text-muted-foreground")}>По количеству</button>
              <button onClick={() => setWorkMode("time")} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all", workMode === "time" ? "bg-violet-500/15 text-violet-400" : "text-muted-foreground")}>По времени</button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Макс. комментариев</span><span className="text-xs px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-mono">{maxComments[0]}</span></div>
              <Slider value={maxComments} onValueChange={setMaxComments} min={1} max={2000} />
            </div>
            <div className="border-t border-border/30 pt-4 space-y-3">
              <div className="flex items-center gap-2"><span>🔄</span><span className="text-xs font-bold text-foreground">Ротация аккаунтов</span><span className="text-xs text-muted-foreground">ⓘ</span></div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Комментариев на аккаунт</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-mono">{commentsPerAccount}</span>
                <Input type="number" value={commentsPerAccount} onChange={e => setCommentsPerAccount(+e.target.value)} className="w-20 bg-background/50" min={1} />
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* ═══ SECTION 4 — Target Channels ═══ */}
      <CollapsibleSection title="Целевые каналы" icon={Hash} iconBg="bg-blue-500/20 text-blue-400" badge={channels.length > 0 ? `${channels.length} каналов` : undefined}>
        <div className="flex gap-1 bg-muted/20 rounded-lg p-0.5 w-fit mb-4">
          {[{ id: "link", label: "Юзернейм/Ссылка" }, { id: "parsed", label: "С парсинга" }, { id: "past", label: "Прошлые задачи" }, { id: "folder", label: "Папка" }].map(t => (
            <button key={t.id} onClick={() => setChannelSourceTab(t.id)} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all", channelSourceTab === t.id ? "bg-blue-500/15 text-blue-400" : "text-muted-foreground")}>{t.label}</button>
          ))}
        </div>

        {channelSourceTab === "link" && (
          <div className="space-y-3 mb-4">
            <textarea value={channelInput} onChange={e => setChannelInput(e.target.value)} placeholder={"@channel или https://t.me/channel\nПо одному на строку"} className="w-full min-h-[80px] rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring" />
            <Button size="sm" className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 gap-1" onClick={addChannel}><Plus className="h-3 w-3" /> Добавить</Button>
          </div>
        )}

        {channelSourceTab === "parsed" && (
          <div className="mb-4">
            {parsedSets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/60">
                <Inbox className="h-8 w-8 mb-2" />
                <span className="text-xs">Нет сохранённых наборов парсинга</span>
                <span className="text-[10px] mt-1">Запустите парсинг каналов — результаты появятся здесь</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {parsedSets.map(s => (
                  <button key={s.id} onClick={() => toggleParsedSet(s.id)} className={cn("rounded-lg border p-3 text-left transition-all", selectedParsedIds.includes(s.id) ? "border-violet-500/40 bg-violet-500/10" : "border-border/30 bg-background/30 hover:border-border/60")}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={cn("w-6 h-6 rounded flex items-center justify-center text-xs", s.color)}>#</div>
                      {selectedParsedIds.includes(s.id) && <Check className="h-3 w-3 text-violet-400 ml-auto" />}
                    </div>
                    <div className="text-xs font-bold text-foreground">{s.keywords}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{s.date}</div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-mono mt-1 inline-block">#{s.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {(channelSourceTab === "past" || channelSourceTab === "folder") && (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground/60 mb-4"><Inbox className="h-8 w-8 mb-2" /><span className="text-xs">Скоро будет доступно</span></div>
        )}

        {/* Bottom — selected channels */}
        <div className="border-t border-border/30 pt-3">
          <span className="text-xs text-muted-foreground">{channels.length} каналов</span>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {channels.map(c => (
              <span key={c} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-blue-500/10 border border-blue-500/30 text-blue-300">
                {c} <X className="h-3 w-3 cursor-pointer hover:text-red-400" onClick={() => removeChannel(c)} />
              </span>
            ))}
          </div>
        </div>
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
                      <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={e => { e.stopPropagation(); setPreviewPrompt({ name: p.name, content: p.content }); }}><Eye className="h-3 w-3" /></Button>
                      <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={e => { e.stopPropagation(); setSelectedPrompt(p.id); }}><Play className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground mb-2 block">Мои промпты ({userPrompts.length})</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {userPrompts.map(p => (
                  <div key={p.id} className={cn("rounded-lg border p-3 transition-all cursor-pointer", selectedPrompt === p.id ? "border-primary/40 bg-primary/10" : "border-border/30 bg-background/30 hover:border-border/60")} onClick={() => setSelectedPrompt(p.id)}>
                    <div className="text-xs font-bold text-foreground mb-0.5">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground mb-2">{p.date}</div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={e => { e.stopPropagation(); setPreviewPrompt({ name: p.name, content: p.content || "Промпт пустой" }); }}><Eye className="h-3 w-3" /></Button>
                      <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={e => { e.stopPropagation(); setSelectedPrompt(p.id); }}><Play className="h-3 w-3" /></Button>
                      <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={e => { e.stopPropagation(); setEditingPrompt({ id: p.id, name: p.name, desc: "", content: p.content, maxLen: [150] }); setPromptModalOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 text-red-400" onClick={async e => { e.stopPropagation(); await fetch(`/api/prompts/${p.id}`, { method: "DELETE", credentials: "include" }); setUserPrompts(prev => prev.filter(x => x.id !== p.id)); if (selectedPrompt === p.id) setSelectedPrompt(1); }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
                <button onClick={() => { setEditingPrompt({ id: null, name: "", desc: "", content: "", maxLen: [150] }); setPromptModalOpen(true); }} className="rounded-lg border border-dashed border-border/50 p-3 flex flex-col items-center justify-center gap-2 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer min-h-[100px]">
                  <Plus className="h-6 w-6 text-primary" /><span className="text-xs text-muted-foreground">Создать</span>
                </button>
              </div>
            </div>
          </>
        )}
      </CollapsibleSection>

      {/* ═══ SECTION 6 — Language + Organic ═══ */}
      <CollapsibleSection title="Языки и продвижение" icon={Settings2} iconBg="bg-blue-500/20 text-blue-400">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border/50 bg-background/30 p-4 space-y-3">
            <div className="flex items-center gap-2"><span>🔤</span><span className="text-sm font-bold text-foreground">Режим определения языка</span></div>
            <p className="text-xs text-muted-foreground">Язык будет автоматически определяться из текста поста</p>
            <div className="flex gap-1 bg-muted/20 rounded-lg p-0.5 w-fit">
              <button onClick={() => setLangMode("auto")} className={cn("px-3 py-1.5 rounded-md text-xs font-medium", langMode === "auto" ? "bg-primary/15 text-primary" : "text-muted-foreground")}>⚡ Авто</button>
              <button onClick={() => setLangMode("manual")} className={cn("px-3 py-1.5 rounded-md text-xs font-medium", langMode === "manual" ? "bg-primary/15 text-primary" : "text-muted-foreground")}>≡ Ручной</button>
            </div>
          </div>
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
                  <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Вероятность упоминания</span><span className="text-xs px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 font-mono">{organicChance[0]}% сообщений</span></div>
                  <Slider value={organicChance} onValueChange={setOrganicChance} min={1} max={50} />
                </div>
                <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-300">ⓘ Рекомендуется 10-20%.</div>
              </div>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* ═══ SECTION 7 — Delays ═══ */}
      <CollapsibleSection title="Настройка задержек" icon={Settings2} iconBg="bg-orange-500/20 text-orange-400">
        <div className="flex justify-end gap-1 mb-4">
          {[{ id: "min", label: "⚡ Мин" }, { id: "recommended", label: "✓ Рекомендованные" }, { id: "max", label: "❤ Макс" }].map(p => (
            <button key={p.id} onClick={() => { setDelayPreset(p.id); if (p.id === "min") { setCommentDelay([45]); setJoinDelay([60]); } else if (p.id === "recommended") { setCommentDelay([60]); setJoinDelay([120]); } else { setCommentDelay([90]); setJoinDelay([180]); } }} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all border", delayPreset === p.id ? (p.id === "recommended" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "bg-primary/15 text-primary border-primary/30") : "border-transparent bg-muted/30 text-muted-foreground")}>{p.label}</button>
          ))}
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5"><span className="text-xs text-muted-foreground">Задержка между комментариями</span><span className="text-xs px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-mono">{commentDelay[0]} сек</span></div>
            <Slider value={commentDelay} onValueChange={setCommentDelay} min={45} max={120} />
            <p className="text-[10px] text-muted-foreground mt-1">{Math.round(commentDelay[0] * 0.7)}—{Math.round(commentDelay[0] * 1.3)} сек</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5"><span className="text-xs text-muted-foreground">Задержка входа в канал</span><span className="text-xs px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-mono">{joinDelay[0]} сек</span></div>
            <Slider value={joinDelay} onValueChange={setJoinDelay} min={60} max={300} />
            <p className="text-[10px] text-muted-foreground mt-1">{Math.round(joinDelay[0] * 0.7)}—{Math.round(joinDelay[0] * 1.3)} сек</p>
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
                <div><div className="text-sm font-bold text-foreground">{p.name}</div><div className="text-[10px] text-muted-foreground">{p.date}</div></div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => { const c = p.config as Record<string, unknown>; if (c.commentMode) setCommentMode(c.commentMode as string); if (c.maxComments) setMaxComments(c.maxComments as number[]); if (c.commentsPerAccount) setCommentsPerAccount(c.commentsPerAccount as number); if (c.channels) setChannels(c.channels as string[]); if (c.commentDelay) setCommentDelay(c.commentDelay as number[]); toast({ title: `Пресет "${p.name}" загружен` }); }}><Download className="h-3 w-3" /> Загрузить</Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs text-red-400" onClick={() => { const updated = savedPresets.filter(x => x.id !== p.id); setSavedPresets(updated); localStorage.setItem("commenting_presets", JSON.stringify(updated)); }}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <Button variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10" onClick={() => setPresetNameDialogOpen(true)}><Plus className="h-4 w-4" /> Сохранить текущие настройки</Button>
      </CollapsibleSection>

      {/* Preset name dialog */}
      <Dialog open={presetNameDialogOpen} onOpenChange={setPresetNameDialogOpen}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader><DialogTitle>Название пресета</DialogTitle></DialogHeader>
          <Input value={presetNameInput} onChange={e => setPresetNameInput(e.target.value)} placeholder="Например: Крипто каналы" className="bg-background/50" onKeyDown={e => { if (e.key === "Enter") { if (!presetNameInput.trim()) return; const newPreset = { id: Date.now(), name: presetNameInput.trim(), date: new Date().toISOString().slice(0, 10), config: { commentMode, maxComments, commentsPerAccount, channels, commentDelay, joinDelay, keywords } }; const updated = [...savedPresets, newPreset]; setSavedPresets(updated); localStorage.setItem("commenting_presets", JSON.stringify(updated)); setPresetNameInput(""); setPresetNameDialogOpen(false); toast({ title: `Пресет "${newPreset.name}" сохранён` }); }}} />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setPresetNameDialogOpen(false)}>Отмена</Button>
            <Button onClick={() => { if (!presetNameInput.trim()) return; const newPreset = { id: Date.now(), name: presetNameInput.trim(), date: new Date().toISOString().slice(0, 10), config: { commentMode, maxComments, commentsPerAccount, channels, commentDelay, joinDelay, keywords } }; const updated = [...savedPresets, newPreset]; setSavedPresets(updated); localStorage.setItem("commenting_presets", JSON.stringify(updated)); setPresetNameInput(""); setPresetNameDialogOpen(false); toast({ title: `Пресет "${newPreset.name}" сохранён` }); }}>Сохранить</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ SECTION 9 — Launch ═══ */}
      <CollapsibleSection title="Запуск комментинга" icon={Play} iconBg="bg-primary/20 text-primary">
        <div className="flex flex-wrap gap-3 mb-4">
          {[{ icon: "🟣", label: "Аккаунты", value: selectedIds.length }, { icon: "🔵", label: "Каналы", value: channels.length }, { icon: "🟡", label: "Режим", value: commentMode === "all" ? "Все посты" : commentMode === "keywords" ? "По ключевым словам" : "Случайный" }, { icon: "🟢", label: "Промпт", value: activePromptName }].map(s => (
            <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/30 bg-background/30"><span>{s.icon}</span><span className="text-xs text-muted-foreground">{s.label}:</span><span className="text-sm font-bold text-foreground">{s.value}</span></div>
          ))}
        </div>
        <div className="rounded-lg border border-border/50 bg-background/30 p-4 flex items-center gap-4">
          {!running ? (
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8" onClick={handleStart}>
              <Play className="h-4 w-4" /> Запустить комментинг
            </Button>
          ) : (
            <Button variant="destructive" className="gap-2 px-8" onClick={handleStop}>
              <Square className="h-4 w-4" /> Остановить
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", running ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
            <span className="text-sm text-muted-foreground">{running ? "Запущено" : "Остановлено"}</span>
          </div>
        </div>

        {/* Inline logs */}
        {logs.length > 0 && (
          <div className="bg-background rounded-lg p-3 font-mono text-xs space-y-1 max-h-[200px] overflow-y-auto border border-border/30 mt-3">
            {logs.map((l, i) => (
              <div key={i} className={cn("flex gap-2", l.ok ? "text-emerald-400" : "text-red-400")}>
                <span className="text-muted-foreground shrink-0">{l.time}</span>
                <span>{l.msg}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </CollapsibleSection>

      {/* ═══ SECTION 10 — History ═══ */}
      <CollapsibleSection title="Статистика аккаунтов" icon={Terminal} iconBg="bg-muted-foreground/20 text-muted-foreground" defaultOpen={false}>
        {(() => {
          const total = statsData.reduce((s, a) => s + (a.comments || 0), 0);
          return (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {[
                { icon: "🟣", label: "Аккаунтов", value: String(statsData.length), color: "border-violet-500/30" },
                { icon: "🔵", label: "Всего комментариев", value: String(total), color: "border-blue-500/30" },
                { icon: "🟢", label: "Ср. на аккаунт", value: statsData.length ? String(Math.round(total / statsData.length)) : "—", color: "border-emerald-500/30" },
              ].map(s => (
                <div key={s.label} className={cn("rounded-lg border p-3 bg-background/30", s.color)}>
                  <div className="text-xs text-muted-foreground">{s.icon} {s.label}</div>
                  <div className="text-lg font-bold text-foreground mt-1">{s.value}</div>
                </div>
              ))}
            </div>
          );
        })()}

        {statsData.length > 0 && (() => {
          const total = statsData.reduce((s, a) => s + (a.comments || 0), 0);
          const threshold = whitelistThreshold[0];
          const whitelist = statsData.filter(a => total > 0 && (a.comments / total) * 100 >= threshold).map(a => a.name);
          const blacklist = statsData.filter(a => total > 0 && (a.comments / total) * 100 < threshold).map(a => a.name);
          return (
            <div className="rounded-lg border border-border/50 bg-background/30 p-4 mb-4 space-y-3">
              <span className="text-sm font-bold text-foreground">Генератор списков аккаунтов</span>
              <div className="flex items-center gap-3"><span className="text-xs text-muted-foreground">Порог активности:</span><Slider value={whitelistThreshold} onValueChange={setWhitelistThreshold} min={0} max={100} className="flex-1" /><span className="text-xs font-mono text-foreground">{whitelistThreshold[0]}%</span></div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" onClick={() => { navigator.clipboard.writeText(whitelist.join("\n")); toast({ title: `Whitelist скопирован (${whitelist.length} акк.)` }); }}><Copy className="h-3 w-3" /> Whitelist ({whitelist.length})</Button>
                <Button variant="outline" size="sm" className="gap-1 border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => { navigator.clipboard.writeText(blacklist.join("\n")); toast({ title: `Blacklist скопирован (${blacklist.length} акк.)` }); }}><Copy className="h-3 w-3" /> Blacklist ({blacklist.length})</Button>
              </div>
            </div>
          );
        })()}
        {statsData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/60 rounded-lg border border-border/30">
            <Inbox className="h-8 w-8 mb-2" />
            <span className="text-xs">Нет данных — запустите комментинг</span>
          </div>
        ) : (
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr] bg-muted/20 px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <span>Аккаунт</span><span>Комментариев</span>
            </div>
            <div className="divide-y divide-border/20">
              {statsData.map(a => (
                <div key={a.name} className="grid grid-cols-[2fr_1fr] px-4 py-3 text-sm items-center hover:bg-muted/10">
                  <div className="text-xs font-bold text-foreground">{a.name}</div>
                  <div className="text-xs text-primary font-mono">{a.comments}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* ═══ PROMPT EDITOR MODAL ═══ */}
      <Dialog open={promptModalOpen} onOpenChange={setPromptModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-card border-border">
          <DialogHeader><DialogTitle>{editingPrompt.id ? "Редактировать промпт" : "Создать промпт"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input value={editingPrompt.name} onChange={e => setEditingPrompt({ ...editingPrompt, name: e.target.value })} placeholder="Название промпта" className="bg-background/50" />
              <Input value={editingPrompt.desc} onChange={e => setEditingPrompt({ ...editingPrompt, desc: e.target.value })} placeholder="Описание (необязательно)" className="bg-background/50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Шаблон промпта</label>
              <textarea ref={promptTextareaRef} value={editingPrompt.content} onChange={e => setEditingPrompt({ ...editingPrompt, content: e.target.value })} placeholder={`Напиши комментарий к посту в Telegram канале.\nКанал: {chat_title}\nПост: {message}\n\nТребования:\n- Релевантный комментарий\n- Естественный стиль\n- 1-2 предложения`} className="w-full min-h-[160px] rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 space-y-2">
              <span className="text-xs font-bold text-amber-300">НАЖМИТЕ ДЛЯ ВСТАВКИ</span>
              <div className="flex gap-1.5">
                {["{message}", "{chat_title}", "{sender_name}"].map(v => (
                  <button key={v} onClick={() => insertVariable(v)} className="px-2 py-1 rounded text-xs bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-mono">{v}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Максимальная длина</span><span className="text-xs px-2 py-0.5 rounded bg-primary/15 text-primary font-mono">{editingPrompt.maxLen[0]}</span></div>
              <div className="flex items-center gap-3"><span className="text-[10px] text-muted-foreground">Короткий</span><Slider value={editingPrompt.maxLen} onValueChange={v => setEditingPrompt({ ...editingPrompt, maxLen: v })} min={10} max={500} className="flex-1" /><span className="text-[10px] text-muted-foreground">Длинный</span></div>
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
                const res = await fetch("/api/prompts", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool: "commenting", name: editingPrompt.name, content: editingPrompt.content }) });
                const data = await res.json();
                if (data.id) setUserPrompts(prev => [...prev, { id: data.id, name: editingPrompt.name, content: editingPrompt.content, date: new Date().toISOString().slice(0, 10) }]);
              }
              setPromptModalOpen(false);
              toast({ title: "Промпт сохранён" });
            }}><Check className="h-4 w-4" /> Сохранить</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview prompt dialog */}
      <Dialog open={!!previewPrompt} onOpenChange={v => { if (!v) setPreviewPrompt(null); }}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Eye className="h-4 w-4 text-violet-400" /> {previewPrompt?.name}</DialogTitle>
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

export default Commenting;
