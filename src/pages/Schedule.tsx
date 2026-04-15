import { useEffect, useState } from "react";
import {
  Calendar, Clock, Play, Trash2, Plus, ToggleLeft, ToggleRight,
  Zap, Send, Flame, ClipboardList, MessageSquare, RefreshCw, X, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScheduledTask {
  id: number;
  panel_user_id: number;
  tool: string;
  label: string;
  params: Record<string, unknown>;
  schedule_type: "once" | "daily" | "weekly" | "interval";
  run_at: number | null;
  cron_hour: number | null;
  cron_minute: number;
  cron_weekday: number | null;
  interval_hours: number | null;
  is_active: number;
  last_run_at: number | null;
  last_task_id: string | null;
  run_count: number;
  skip_count: number;
  last_skip_reason: string | null;
  created_at: number;
}

interface ConflictItem {
  sched_id: number;
  label: string;
  tool: string;
  run_at_str: string;
  account_ids: number[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TOOLS = [
  { value: "warming",   label: "Прогрев",    icon: Flame,        color: "text-orange-400  bg-orange-500/10"  },
  { value: "inviting",  label: "Инвайтинг",  icon: Send,         color: "text-cyan-400    bg-cyan-500/10"    },
  { value: "parsing",   label: "Парсинг",    icon: ClipboardList,color: "text-blue-400    bg-blue-500/10"    },
  { value: "commenting",label: "Комментинг", icon: MessageSquare,color: "text-violet-400  bg-violet-500/10"  },
];

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const SCHEDULE_TYPES = [
  { value: "once",     label: "Один раз"     },
  { value: "daily",    label: "Каждый день"  },
  { value: "weekly",   label: "Каждую неделю"},
  { value: "interval", label: "По интервалу" },
];

function toolMeta(tool: string) {
  return TOOLS.find(t => t.value === tool) ?? { value: tool, label: tool, icon: Zap, color: "text-muted-foreground bg-muted" };
}

function fmtDate(ts: number | null): string {
  if (!ts) return "—";
  const d = new Date(ts * 1000);
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function scheduleLabel(s: ScheduledTask): string {
  if (s.schedule_type === "once" && s.run_at) return `Один раз — ${fmtDate(s.run_at)}`;
  if (s.schedule_type === "daily")    return `Каждый день в ${String(s.cron_hour ?? 0).padStart(2,"0")}:${String(s.cron_minute).padStart(2,"0")}`;
  if (s.schedule_type === "weekly") {
    const wd = Math.min(Math.max(s.cron_weekday ?? 0, 0), 6);
    return `Каждую ${WEEKDAYS[wd]} в ${String(s.cron_hour ?? 0).padStart(2,"0")}:${String(s.cron_minute).padStart(2,"0")}`;
  }
  if (s.schedule_type === "interval") return `Каждые ${s.interval_hours}ч`;
  return "—";
}

// ── Create Modal ──────────────────────────────────────────────────────────────

function CreateModal({ onClose, onCreated, accountMap }: { onClose: () => void; onCreated: () => void; accountMap: Record<number, string> }) {
  const [tool, setTool]               = useState("warming");
  const [label, setLabel]             = useState("");
  const [schedType, setSchedType]     = useState<"once"|"daily"|"weekly"|"interval">("daily");
  const [runAt, setRunAt]             = useState("");       // datetime-local string
  const [cronHour, setCronHour]       = useState(9);
  const [cronMinute, setCronMinute]   = useState(0);
  const [cronWeekday, setCronWeekday] = useState(0);
  const [intervalH, setIntervalH]     = useState(24);
  const [params, setParams]           = useState("{}");
  const [paramsError, setParamsError] = useState("");
  const [saving, setSaving]           = useState(false);
  const [conflicts, setConflicts]     = useState<ConflictItem[]>([]);
  const [conflictChecked, setConflictChecked] = useState(false);

  const validateParams = (val: string) => {
    try { JSON.parse(val); setParamsError(""); return true; }
    catch { setParamsError("Неверный JSON"); return false; }
  };

  // Проверяем конфликты — возвращает найденные конфликты напрямую
  const checkConflicts = async (): Promise<ConflictItem[]> => {
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(params); } catch { return []; }
    const accountIds = (parsed.account_ids as number[] | undefined) ?? [];
    if (!accountIds.length) { setConflicts([]); return []; }

    const qs = new URLSearchParams({ account_ids: accountIds.join(","), schedule_type: schedType });
    if (schedType === "once" && runAt)        qs.set("run_at", String(new Date(runAt).getTime() / 1000));
    if (schedType === "daily" || schedType === "weekly") {
      qs.set("cron_hour", String(cronHour));
      qs.set("cron_minute", String(cronMinute));
    }
    if (schedType === "weekly")   qs.set("cron_weekday", String(cronWeekday));
    if (schedType === "interval") qs.set("interval_hours", String(intervalH));

    try {
      const res = await fetch(`/api/scheduler/conflicts?${qs}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const found: ConflictItem[] = data.conflicts ?? [];
        setConflicts(found);
        setConflictChecked(true);
        return found;
      }
    } catch { /* ignore */ }
    setConflictChecked(true);
    return [];
  };

  const handleCreate = async () => {
    if (!validateParams(params)) return;

    // Если конфликты ещё не показывались — проверяем и показываем пользователю
    if (conflicts.length === 0) {
      const foundConflicts = await checkConflicts();
      if (foundConflicts.length > 0) return; // Конфликты показаны, ждём подтверждения
    }
    // Если conflicts.length > 0, пользователь уже видел предупреждение и нажал
    // «Создать всё равно» — продолжаем создание

    setSaving(true);
    const body: Record<string, unknown> = {
      tool, label: label || undefined,
      params: JSON.parse(params),
      schedule_type: schedType,
    };
    if (schedType === "once")     body.run_at = new Date(runAt).getTime() / 1000;
    if (schedType === "daily")    { body.cron_hour = cronHour; body.cron_minute = cronMinute; }
    if (schedType === "weekly")   { body.cron_hour = cronHour; body.cron_minute = cronMinute; body.cron_weekday = cronWeekday; }
    if (schedType === "interval") body.interval_hours = intervalH;

    try {
      const res = await fetch("/api/scheduler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.detail || data.error || "Ошибка создания"); return; }
      toast.success("Расписание создано");
      onCreated();
      onClose();
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">Новое расписание</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4"/></Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Tool selector */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Инструмент</label>
            <div className="grid grid-cols-3 gap-1.5">
              {TOOLS.map(t => {
                const Icon = t.icon;
                const active = tool === t.value;
                return (
                  <button key={t.value} onClick={() => setTool(t.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-xs font-medium transition-colors",
                      active
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-border/80"
                    )}>
                    <Icon className="h-4 w-4"/>
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Label */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Название (необязательно)</label>
            <input
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
              placeholder="Например: Ночной прогрев"
              value={label}
              onChange={e => setLabel(e.target.value)}
            />
          </div>

          {/* Schedule type */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Тип расписания</label>
            <div className="grid grid-cols-2 gap-1.5">
              {SCHEDULE_TYPES.map(st => (
                <button key={st.value} onClick={() => setSchedType(st.value as typeof schedType)}
                  className={cn(
                    "px-3 py-2 rounded-lg border text-xs font-medium transition-colors text-left",
                    schedType === st.value
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  )}>
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule params */}
          {schedType === "once" && (
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Дата и время запуска</label>
              <input type="datetime-local"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                value={runAt} onChange={e => setRunAt(e.target.value)}
              />
            </div>
          )}

          {(schedType === "daily" || schedType === "weekly") && (
            <div className="flex gap-3">
              {schedType === "weekly" && (
                <div className="flex-1">
                  <label className="block text-xs text-muted-foreground mb-1.5 font-medium">День недели</label>
                  <select value={cronWeekday} onChange={e => setCronWeekday(+e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
                    {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
              )}
              <div className="flex-1">
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Час (0-23)</label>
                <input type="number" min={0} max={23} value={cronHour}
                  onChange={e => setCronHour(+e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Минута (0-59)</label>
                <input type="number" min={0} max={59} value={cronMinute}
                  onChange={e => setCronMinute(+e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
            </div>
          )}

          {schedType === "interval" && (
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Каждые N часов</label>
              <input type="number" min={1} step={0.5} value={intervalH}
                onChange={e => setIntervalH(+e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          )}

          {/* Params JSON */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
              Параметры задачи (JSON)
              <span className="text-muted-foreground/50 ml-1 font-normal">— оставь {"{ }"} для настроек по умолчанию</span>
            </label>
            <textarea
              rows={4}
              className={cn(
                "w-full bg-background border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none",
                paramsError ? "border-red-500/60" : "border-border"
              )}
              value={params}
              onChange={e => { setParams(e.target.value); validateParams(e.target.value); setConflicts([]); }}
              placeholder='{"account_ids": [1, 2], "join_only": false}'
            />
            {paramsError && <p className="text-xs text-red-400 mt-1">{paramsError}</p>}
            <p className="text-[10px] text-muted-foreground/50 mt-1">
              Параметры совпадают с телом запроса соответствующего инструмента.
            </p>
          </div>

          {/* Конфликты аккаунтов */}
          {conflicts.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/8 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Конфликт аккаунтов — выбранные аккаунты уже запланированы
              </div>
              {conflicts.map(c => (
                <div key={c.sched_id} className="text-[11px] text-amber-300/80 pl-5">
                  «{c.label}» ({c.run_at_str}) —{" "}
                  {c.account_ids.map(id => accountMap[id] ?? `#${id}`).join(", ")}
                </div>
              ))}
              <p className="text-[10px] text-amber-400/60 pl-5">
                Если аккаунты будут заняты в момент запуска, задача будет пропущена.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-border">
          <Button variant="ghost" size="sm" className="flex-1 h-9 text-xs" onClick={onClose}>Отмена</Button>
          <Button
            size="sm"
            className={cn("flex-1 h-9 text-xs", conflicts.length > 0 && "border-amber-500/30")}
            onClick={handleCreate}
            disabled={saving}
          >
            {saving ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin"/> : <Plus className="h-3.5 w-3.5 mr-1.5"/>}
            {conflicts.length > 0 ? "Создать всё равно" : "Создать"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const Schedule = () => {
  const [tasks, setTasks]           = useState<ScheduledTask[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setCreate]     = useState(false);
  const [runningId, setRunning]     = useState<number | null>(null);
  const [accountMap, setAccountMap] = useState<Record<number, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [schedRes, accRes] = await Promise.all([
        fetch("/api/scheduler", { credentials: "include" }),
        fetch("/api/accounts",  { credentials: "include" }),
      ]);
      const schedData = await schedRes.json();
      setTasks(Array.isArray(schedData) ? schedData : []);
      const accData = await accRes.json();
      if (Array.isArray(accData)) {
        const map: Record<number, string> = {};
        for (const a of accData) map[a.id] = a.name || a.phone || `#${a.id}`;
        setAccountMap(map);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (t: ScheduledTask) => {
    try {
      const res = await fetch(`/api/scheduler/${t.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_active: !t.is_active }),
      });
      if (!res.ok) { toast.error("Ошибка обновления"); return; }
      toast.success(t.is_active ? "Расписание приостановлено" : "Расписание активировано");
      load();
    } catch { toast.error("Ошибка соединения"); }
  };

  const deleteTask = async (t: ScheduledTask) => {
    if (!confirm(`Удалить расписание «${t.label}»?`)) return;
    try {
      const res = await fetch(`/api/scheduler/${t.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) { toast.error("Ошибка удаления"); return; }
      toast.success("Расписание удалено");
      setTasks(prev => prev.filter(x => x.id !== t.id));
    } catch { toast.error("Ошибка соединения"); }
  };

  const runNow = async (t: ScheduledTask) => {
    setRunning(t.id);
    try {
      const res = await fetch(`/api/scheduler/${t.id}/run-now`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.detail || data.error || "Ошибка запуска"); return; }
      toast.success(`Задача запущена: ${data.task_id?.slice(0,8) ?? "OK"}`);
      load();
    } catch { toast.error("Ошибка соединения"); }
    setRunning(null);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1280px]">
      {showCreate && <CreateModal onClose={() => setCreate(false)} onCreated={load} accountMap={accountMap} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Планировщик</h1>
          <p className="text-muted-foreground text-sm">Автоматический запуск инструментов по расписанию</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="gap-1.5 h-8 text-xs text-muted-foreground">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setCreate(true)}>
            <Plus className="h-3.5 w-3.5" /> Новое расписание
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-xs text-muted-foreground flex gap-2 items-start">
        <Clock className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5"/>
        <span>
          Планировщик проверяет задачи каждую минуту (время сервера — Europe/Moscow).
          Параметры задачи совпадают с настройками инструмента при ручном запуске.
        </span>
      </div>

      {/* Tasks list */}
      <div className="panel-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground/50">
            <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin"/>
            <span className="text-sm">Загрузка...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/50 gap-3">
            <Calendar className="h-12 w-12" />
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Нет расписаний</p>
              <p className="text-xs mt-1">Создайте первое расписание — инструмент будет запускаться автоматически</p>
            </div>
            <Button size="sm" className="mt-2 h-8 text-xs gap-1.5" onClick={() => setCreate(true)}>
              <Plus className="h-3.5 w-3.5" /> Создать расписание
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {tasks.map(t => {
              const meta = toolMeta(t.tool);
              const Icon = meta.icon;
              const active = !!t.is_active;
              return (
                <div key={t.id} className={cn(
                  "flex items-center gap-3 px-4 py-3.5 transition-colors",
                  active ? "hover:bg-secondary/40" : "opacity-50 hover:bg-secondary/20"
                )}>
                  {/* Icon */}
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", meta.color)}>
                    <Icon className="h-4 w-4"/>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{t.label}</span>
                      {!active && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/60 text-muted-foreground/60 border border-border/40 shrink-0">
                          Пауза
                        </span>
                      )}
                      {t.skip_count > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 flex items-center gap-0.5">
                          <AlertTriangle className="h-2.5 w-2.5" /> {t.skip_count} пропусков
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" /> {scheduleLabel(t)}
                      </span>
                      {t.run_at && active && (
                        <span className="text-[10px] text-primary/70 hidden sm:block">
                          Следующий: {fmtDate(t.run_at)}
                        </span>
                      )}
                    </div>
                    {/* Аккаунты из params */}
                    {Array.isArray(t.params?.account_ids) && (t.params.account_ids as number[]).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(t.params.account_ids as number[]).map(id => (
                          <span key={id} className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-md bg-muted/50 text-muted-foreground border border-border/40">
                            {accountMap[id] ?? `#${id}`}
                          </span>
                        ))}
                      </div>
                    )}
                    {t.last_skip_reason && (
                      <div className="flex items-start gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-[10px] text-amber-400/80 truncate">{t.last_skip_reason}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex flex-col items-end gap-0.5 shrink-0">
                    <span className="text-[11px] text-muted-foreground">{t.run_count} запусков</span>
                    {t.last_run_at && (
                      <span className="text-[10px] text-muted-foreground/50">
                        Последний: {fmtDate(t.last_run_at)}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => runNow(t)}
                      disabled={runningId === t.id}
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-40"
                      title="Запустить сейчас"
                    >
                      {runningId === t.id
                        ? <RefreshCw className="h-3.5 w-3.5 animate-spin"/>
                        : <Play className="h-3.5 w-3.5"/>
                      }
                    </button>
                    <button
                      onClick={() => toggleActive(t)}
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title={active ? "Приостановить" : "Возобновить"}
                    >
                      {active
                        ? <ToggleRight className="h-4 w-4 text-primary"/>
                        : <ToggleLeft  className="h-4 w-4"/>
                      }
                    </button>
                    <button
                      onClick={() => deleteTask(t)}
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="h-3.5 w-3.5"/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Schedule;
