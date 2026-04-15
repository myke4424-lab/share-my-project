import { useEffect, useRef, useState } from "react";
import { Square, RefreshCw, Clock, Terminal, X, Inbox, AlertTriangle, Filter, Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Task {
  task_id: string;
  tool: string;
  params_summary: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  exit_code: number | null;
}

const statusMap: Record<string, { label: string; dot: string; text: string }> = {
  running:   { label: "Работает",   dot: "bg-emerald-400 animate-pulse", text: "text-emerald-400" },
  stopped:   { label: "Остановлен", dot: "bg-amber-400",                 text: "text-amber-400"  },
  completed: { label: "Завершён",   dot: "bg-primary",                   text: "text-primary"    },
  failed:    { label: "Ошибка",     dot: "bg-red-400",                   text: "text-red-400"    },
};

const statusOrder = ["running", "stopped", "failed", "completed"];

const TOOL_LABELS: Record<string, string> = {
  inviting:    "Инвайтинг",
  commenting:  "Комментинг",
  warming:     "Прогрев",
  masslooking: "Масслукинг",
  parsing:     "Парсер",
  reactions:   "Реакции",
  story_tagger: "Теггер",
};

function duration(started: string, finished: string | null): string {
  const end = finished ? new Date(finished).getTime() : Date.now();
  const s = Math.floor((end - new Date(started).getTime()) / 1000);
  if (s < 60) return `${s}с`;
  if (s < 3600) return `${Math.floor(s / 60)}м ${s % 60}с`;
  return `${Math.floor(s / 3600)}ч ${Math.floor((s % 3600) / 60)}м`;
}

function timeAgo(iso: string, now: number): string {
  const diff = Math.floor((now - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff} сек назад`;
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  return `${Math.floor(diff / 3600)} ч назад`;
}

// ── Export helpers ────────────────────────────────────────────────────────────

const EXPORT_TOOLS: Record<string, Array<{fmt: string; label: string}>> = {
  inviting:  [{ fmt: "csv", label: "CSV" }, { fmt: "txt", label: "TXT (приглашённые)" }, { fmt: "json", label: "JSON" }],
  parsing:   [{ fmt: "txt", label: "TXT" }, { fmt: "csv", label: "CSV" }, { fmt: "json", label: "JSON" }],
  warming:   [{ fmt: "txt", label: "Лог TXT" }, { fmt: "json", label: "Статистика JSON" }],
};

function ExportButton({ task }: { task: Task }) {
  const [open, setOpen] = useState(false);
  const options = EXPORT_TOOLS[task.tool];
  if (!options || task.status === "running") return null;

  const doExport = (fmt: string) => {
    setOpen(false);
    const url = `/api/tasks/${task.task_id}/export?fmt=${fmt}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Экспорт начался");
  };

  return (
    <div className="relative">
      <Button
        variant="ghost" size="sm"
        className="h-6 px-2 text-[10px] text-muted-foreground hover:text-primary gap-1"
        onClick={() => setOpen(v => !v)}
      >
        <Download className="h-3 w-3"/> Экспорт <ChevronDown className="h-3 w-3"/>
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}/>
          <div className="absolute right-0 bottom-full mb-1 z-50 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[160px]">
            {options.map(o => (
              <button
                key={o.fmt}
                className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-secondary/60 transition-colors"
                onClick={() => doExport(o.fmt)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Log Viewer ────────────────────────────────────────────────────────────────

function LogViewer({ task, onClose }: { task: Task; onClose: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const es = new EventSource(`/api/tasks/${task.task_id}/logs`);
    es.onmessage = (e) => setLines((prev) => [...prev.slice(-500), e.data]);
    es.addEventListener("done", () => es.close());
    es.onerror = () => es.close();
    return () => es.close();
  }, [task.task_id]);

  useEffect(() => {
    if (lines.length > 0) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <Terminal className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-semibold text-foreground truncate">{task.params_summary}</span>
            <span className={cn("text-xs shrink-0", statusMap[task.status]?.text ?? "text-muted-foreground")}>
              [{statusMap[task.status]?.label ?? task.status}]
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {task.finished_at && (
              <span className="text-[10px] text-muted-foreground hidden sm:block">
                {duration(task.started_at, task.finished_at)}
              </span>
            )}
            {task.exit_code !== null && task.exit_code !== 0 && (
              <span className="text-[10px] text-red-400">exit {task.exit_code}</span>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-background/80 p-3 font-mono text-[11px] space-y-0.5 min-h-[200px]">
          {lines.length === 0 ? (
            <p className="text-muted-foreground">Ожидание логов...</p>
          ) : (
            lines.map((l, i) => {
              const isErr = l.includes("ОШИБК") || l.includes("ERROR") || l.includes("error");
              const isOk  = l.startsWith("✅") || l.includes("Готово") || l.includes("Завершено");
              return (
                <div key={i} className={cn("leading-5", isErr ? "text-red-400" : isOk ? "text-emerald-400" : "text-muted-foreground")}>
                  {l}
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}

// ── Stop Confirmation ─────────────────────────────────────────────────────────

function ConfirmStop({ task, onConfirm, onCancel }: { task: Task; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-sm shadow-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Остановить задачу?</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[220px]">{task.params_summary}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Задача будет принудительно остановлена. Прогресс может быть сохранён частично.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onCancel}>Отмена</Button>
          <Button size="sm" className="h-8 text-xs bg-amber-500 hover:bg-amber-400 text-black" onClick={onConfirm}>
            <Square className="h-3 w-3 mr-1.5" /> Остановить
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const Tasks = () => {
  const [tasks, setTasks]             = useState<Task[]>([]);
  const [loading, setLoading]         = useState(true);
  const [viewTask, setViewTask]       = useState<Task | null>(null);
  const [confirmStop, setConfirmStop] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [now, setNow]                 = useState(Date.now());

  const load = () => {
    setLoading(true);
    fetch("/api/tasks", { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const sorted = [...data].sort((a, b) => {
            const ai = statusOrder.indexOf(a.status);
            const bi = statusOrder.indexOf(b.status);
            if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
            return new Date(b.started_at).getTime() - new Date(a.started_at).getTime();
          });
          setTasks(sorted);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Тихое автообновление только при наличии активных задач
  useEffect(() => {
    const hasRunning = tasks.some(t => t.status === "running");
    if (!hasRunning) return;
    const id = setInterval(() => {
      fetch("/api/tasks", { credentials: "include" })
        .then(r => r.json())
        .then(data => {
          if (!Array.isArray(data)) return;
          const sorted = [...data].sort((a, b) => {
            const ai = statusOrder.indexOf(a.status);
            const bi = statusOrder.indexOf(b.status);
            if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
            return new Date(b.started_at).getTime() - new Date(a.started_at).getTime();
          });
          setTasks(sorted);
        })
        .catch(() => {});
    }, 5_000);
    return () => clearInterval(id);
  }, [tasks]);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const doStop = async (task_id: string) => {
    await fetch(`/api/tasks/${task_id}`, { method: "DELETE", credentials: "include" });
    setConfirmStop(null);
    load();
  };

  const counts = Object.fromEntries(
    statusOrder.map(s => [s, tasks.filter(t => t.status === s).length])
  );

  const filtered = statusFilter === "all" ? tasks : tasks.filter(t => t.status === statusFilter);

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1280px]">
      {viewTask    && <LogViewer task={viewTask} onClose={() => setViewTask(null)} />}
      {confirmStop && (
        <ConfirmStop
          task={confirmStop}
          onConfirm={() => doStop(confirmStop.task_id)}
          onCancel={() => setConfirmStop(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Задачи</h1>
          <p className="text-muted-foreground text-sm">
            {filtered.length} {statusFilter === "all" ? `из ${tasks.length}` : ""}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="gap-1.5 h-8 text-xs text-muted-foreground">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Обновить
        </Button>
      </div>

      {/* Summary badges / filter */}
      <div className="flex gap-2 flex-wrap items-center">
        <button
          onClick={() => setStatusFilter("all")}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
            statusFilter === "all"
              ? "bg-primary/15 text-primary border-primary/30"
              : "bg-card border-border text-muted-foreground hover:text-foreground"
          )}
        >
          <Filter className="h-3 w-3" /> Все: {tasks.length}
        </button>
        {statusOrder.map((s) => {
          const st = statusMap[s];
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(active ? "all" : s)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                active
                  ? cn("bg-card border-border", st.text)
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", active ? st.dot : "bg-muted-foreground")} />
              {st.label}: {counts[s] ?? 0}
            </button>
          );
        })}
      </div>

      {/* Tasks table */}
      <div className="panel-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/50 gap-3">
            {loading ? (
              <>
                <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
                <p className="text-sm">Загрузка задач...</p>
              </>
            ) : (
              <>
                <Inbox className="h-12 w-12" />
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">
                    {statusFilter === "all" ? "Нет задач" : `Нет задач со статусом «${statusMap[statusFilter]?.label ?? statusFilter}»`}
                  </p>
                  {statusFilter === "all" && (
                    <p className="text-xs mt-1">Запустите любой инструмент — задача появится здесь</p>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-3 py-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Инструмент</th>
                <th className="text-left px-3 py-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider hidden md:table-cell">Описание</th>
                <th className="text-left px-3 py-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Статус</th>
                <th className="text-left px-3 py-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider hidden sm:table-cell">Время</th>
                <th className="text-left px-3 py-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider hidden lg:table-cell">Длительность</th>
                <th className="px-3 py-2 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((task) => {
                const st = statusMap[task.status] ?? statusMap.stopped;
                return (
                  <tr key={task.task_id} className="border-b border-border/50 last:border-0 hover:bg-secondary/50 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-foreground">
                      {TOOL_LABELS[task.tool] ?? task.tool}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground max-w-[200px] truncate hidden md:table-cell">
                      {task.params_summary}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", st.text)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", st.dot)} />
                          {st.label}
                        </span>
                        {task.status === "failed" && task.exit_code !== null && (
                          <span className="text-[10px] text-red-400/70 pl-3">exit {task.exit_code}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" /> {timeAgo(task.started_at, now)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 hidden lg:table-cell">
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {duration(task.started_at, task.finished_at)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost" size="sm"
                          className="h-6 px-2 text-[10px] text-muted-foreground hover:text-primary"
                          onClick={() => setViewTask(task)}
                        >
                          Логи
                        </Button>
                        <ExportButton task={task} />
                        {task.status === "running" && (
                          <Button
                            variant="ghost" size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-amber-400"
                            title="Остановить задачу"
                            onClick={() => setConfirmStop(task)}
                          >
                            <Square className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Tasks;
