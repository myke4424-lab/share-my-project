import { useEffect, useRef, useState } from "react";
import {
  Bell, CheckCheck, Info, AlertTriangle, XCircle,
  RefreshCw, ListTodo, ChevronRight, Square, X, Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Task {
  task_id: string;
  tool: string;
  params_summary: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  exit_code: number | null;
}

type NotifType = "success" | "info" | "warning" | "error";

const typeConfig: Record<NotifType, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  success: { icon: CheckCheck,    color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  info:    { icon: Info,          color: "text-primary",     bg: "bg-primary/10",      border: "border-primary/30"   },
  warning: { icon: AlertTriangle, color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/30" },
  error:   { icon: XCircle,      color: "text-red-400",      bg: "bg-red-500/10",      border: "border-red-500/30"   },
};

const filterTabs = [
  { key: "all",     label: "Все"         },
  { key: "success", label: "Успех"       },
  { key: "info",    label: "Запущено"    },
  { key: "warning", label: "Остановлено" },
  { key: "error",   label: "Ошибки"      },
];

const TOOL_LABELS: Record<string, string> = {
  warming:      "Прогрев",
  inviting:     "Инвайтинг",
  commenting:   "Комментинг",
  masslooking:  "Масслукинг",
  parsing:      "Парсинг",
  story_tagger: "Story Tagger",
  cloning:      "Клонирование",
  reactions:    "Реакции",
};

function statusToType(status: string): NotifType {
  if (status === "completed") return "success";
  if (status === "running")   return "info";
  if (status === "stopped")   return "warning";
  return "error";
}

function statusLabel(status: string): string {
  if (status === "running")   return "Работает";
  if (status === "completed") return "Завершено";
  if (status === "stopped")   return "Остановлено";
  return "Ошибка";
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return `${diff} сек назад`;
  if (diff < 3600)  return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return `${Math.floor(diff / 86400)} дн назад`;
}

// ── Log Viewer Sheet ──────────────────────────────────────────────────────────

interface LogViewerProps {
  task: Task;
  onClose: () => void;
  onStop: (taskId: string) => void;
}

const LogViewer = ({ task, onClose, onStop }: LogViewerProps) => {
  const [lines, setLines]       = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [stopping, setStopping] = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const esRef                   = useRef<EventSource | null>(null);
  const autoScroll              = useRef(true);

  useEffect(() => {
    // Load logs via SSE (works for both running and finished tasks)
    const es = new EventSource(`/api/tasks/${task.task_id}/logs`);
    esRef.current = es;
    setConnected(true);

    es.onmessage = (e) => {
      setLines(prev => [...prev, e.data]);
    };
    es.addEventListener("done", () => {
      es.close();
      setConnected(false);
    });
    es.onerror = () => {
      es.close();
      setConnected(false);
    };

    return () => { es.close(); };
  }, [task.task_id]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [lines]);

  const handleStop = async () => {
    setStopping(true);
    await onStop(task.task_id);
    setStopping(false);
  };

  const cfg = typeConfig[statusToType(task.status)];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">
              {TOOL_LABELS[task.tool] ?? task.tool}
            </span>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium",
              task.status === "running"   ? "bg-emerald-500/15 text-emerald-400" :
              task.status === "completed" ? "bg-primary/15 text-primary" :
              task.status === "stopped"   ? "bg-amber-500/15 text-amber-400" :
              "bg-red-500/15 text-red-400")}>
              {statusLabel(task.status)}
            </span>
            {task.status === "running" && connected && (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                live
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{task.params_summary}</p>
        </div>
        {task.status === "running" && (
          <Button
            size="sm"
            variant="destructive"
            onClick={handleStop}
            disabled={stopping}
            className="h-7 text-xs gap-1 shrink-0"
          >
            <Square className="h-3 w-3" />
            {stopping ? "Стоп..." : "Стоп"}
          </Button>
        )}
      </div>

      {/* Log output */}
      <div
        className="flex-1 overflow-y-auto bg-black/90 p-3"
        onScroll={(e) => {
          const el = e.currentTarget;
          autoScroll.current = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
        }}
      >
        {lines.length === 0 ? (
          <p className="text-muted-foreground text-xs text-center py-8 font-mono">
            {connected ? "Ожидание логов..." : "Логи недоступны"}
          </p>
        ) : (
          <div className="font-mono text-[11px] leading-relaxed space-y-0.5">
            {lines.map((line, i) => (
              <div key={i} className={cn("whitespace-pre-wrap break-all",
                line.includes("ERROR") || line.includes("Ошибка") || line.includes("error") ? "text-red-400" :
                line.includes("WARNING") || line.includes("WARN") ? "text-amber-400" :
                line.includes("✓") || line.includes("успешно") || line.includes("Завершён") ? "text-emerald-400" :
                line.startsWith("===") || line.startsWith("---") ? "text-primary/80 font-semibold" :
                "text-gray-300")}>
                {line}
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-card shrink-0">
        <span className="text-[11px] text-muted-foreground font-mono">
          <Terminal className="h-3 w-3 inline mr-1" />
          {lines.length} строк
        </span>
        <span className="text-[11px] text-muted-foreground">
          {timeAgo(task.started_at)}
        </span>
      </div>
    </div>
  );
};

// ── Main Notifications Page ───────────────────────────────────────────────────

const Notifications = () => {
  const [tasks,       setTasks]       = useState<Task[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/tasks", { credentials: "include" })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setTasks(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Auto-refresh while tasks are running
  useEffect(() => {
    const hasRunning = tasks.some(t => t.status === "running");
    if (!hasRunning) return;
    const id = setInterval(() => {
      fetch("/api/tasks", { credentials: "include" })
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            setTasks(data);
            // Update selected task status if it's open
            setSelectedTask(prev => prev ? (data.find((t: Task) => t.task_id === prev.task_id) ?? prev) : null);
          }
        })
        .catch(() => {});
    }, 10_000);
    return () => clearInterval(id);
  }, [tasks]);

  const handleStop = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE", credentials: "include" });
    load();
  };

  const notifications = tasks.map(t => ({
    id: t.task_id, type: statusToType(t.status) as NotifType,
    tool: TOOL_LABELS[t.tool] ?? t.tool, text: t.params_summary,
    time: t.started_at, status: t.status, raw: t,
  }));

  const filtered = filter === "all" ? notifications : notifications.filter(n => n.type === filter);
  const runningCount = notifications.filter(n => n.status === "running").length;

  if (selectedTask) {
    return (
      <LogViewer
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onStop={handleStop}
      />
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Уведомления
            {runningCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                {runningCount} работает
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">История задач — {tasks.length} событий</p>
        </div>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="gap-1.5 h-8 text-xs text-muted-foreground">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Обновить
        </Button>
      </div>

      <div className="flex gap-1 bg-card rounded-lg p-1 border border-border w-fit flex-wrap">
        {filterTabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              filter === t.key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {loading && tasks.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-10">Загрузка...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Нет задач — запустите любой инструмент.</p>
          </div>
        ) : filtered.map(n => {
          const cfg = typeConfig[n.type];
          const Icon = cfg.icon;
          return (
            <button
              key={n.id}
              onClick={() => setSelectedTask(n.raw)}
              className={cn(
                "w-full text-left panel-card p-3 flex items-start gap-3 transition-colors border-l-2 hover:bg-muted/40 active:bg-muted/60",
                cfg.border
              )}
            >
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", cfg.bg)}>
                <Icon className={cn("h-4 w-4", cfg.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-foreground">{n.tool}</span>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                    n.status === "running"   ? "bg-emerald-500/15 text-emerald-400" :
                    n.status === "completed" ? "bg-primary/15 text-primary" :
                    n.status === "stopped"   ? "bg-amber-500/15 text-amber-400" :
                    "bg-red-500/15 text-red-400")}>
                    {statusLabel(n.status)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.text}</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">{timeAgo(n.time)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {n.status === "running" && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Notifications;
