import { cn } from "@/lib/utils";
import { Play, Square, CheckCircle2, ChevronRight, AlertCircle, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

import { useNavigate } from "@tanstack/react-router";

export interface ToolStep {
  label: string;
  done: boolean;
  hint?: string; // shown as tooltip/warning if not done
}

interface ToolHeaderProps {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  steps: ToolStep[];
  running: boolean;
  onStart: () => void;
  onStop: () => void;
  startLabel?: string;
  startDisabled?: boolean;
  status?: "idle" | "running" | "completed" | "failed" | "stopped";
  accentColor?: string; // tailwind gradient color e.g. "from-orange-500/20"
  taskId?: string | null; // когда задача завершена — показываем кнопку "Логи"
}

const STATUS_STYLES = {
  running:   { dot: "bg-emerald-400 animate-pulse", text: "text-emerald-400", label: "Работает" },
  completed: { dot: "bg-primary",                   text: "text-primary",     label: "Завершён" },
  failed:    { dot: "bg-red-400",                   text: "text-red-400",     label: "Ошибка"   },
  stopped:   { dot: "bg-amber-400",                 text: "text-amber-400",   label: "Остановлен" },
  idle:      { dot: "bg-muted-foreground/30",       text: "text-muted-foreground", label: "Готов" },
};

const ToolHeader = ({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  description,
  steps,
  running,
  onStart,
  onStop,
  startLabel = "Запустить",
  startDisabled = false,
  status = "idle",
  accentColor = "from-primary/5",
  taskId,
}: ToolHeaderProps) => {
  const navigate = useNavigate();
  const allDone = steps.every(s => s.done);
  const st = STATUS_STYLES[running ? "running" : status] ?? STATUS_STYLES.idle;
  const firstMissing = steps.find(s => !s.done);
  const showLogsBtn = !running && taskId && (status === "completed" || status === "stopped" || status === "failed");

  return (
    <div className={cn(
      "sticky top-0 z-20 rounded-xl border border-border/60 overflow-hidden mb-5",
      "bg-card/95 backdrop-blur-md shadow-sm"
    )}>
      {/* Gradient accent strip */}
      <div className={cn("absolute inset-0 bg-gradient-to-r opacity-60 pointer-events-none", accentColor, "to-transparent")} />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 p-4">
        {/* Left: Icon + Title + Description */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-border/30", iconBg)}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-foreground truncate">{title}</h1>
              {/* Status badge */}
              <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-background/60 border border-border/50", st.text)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", st.dot)} />
                {st.label}
              </span>
            </div>
            {/* Step progress */}
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              {steps.map((step, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />}
                  <span className={cn(
                    "inline-flex items-center gap-1 text-[11px] font-medium",
                    step.done ? "text-emerald-400" : "text-muted-foreground/60"
                  )}>
                    {step.done
                      ? <CheckCircle2 className="h-3 w-3 shrink-0" />
                      : <span className={cn(
                          "w-4 h-4 rounded-full border text-[9px] flex items-center justify-center shrink-0 font-bold",
                          i === steps.findIndex(s => !s.done)
                            ? "border-amber-400/70 text-amber-400"
                            : "border-muted-foreground/30 text-muted-foreground/50"
                        )}>{i + 1}</span>
                    }
                    {step.label}
                  </span>
                </span>
              ))}
              <ChevronRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />
              <span className={cn("inline-flex items-center gap-1 text-[11px] font-bold",
                allDone ? "text-primary" : "text-muted-foreground/40"
              )}>
                <Play className="h-3 w-3" /> Запуск
              </span>
            </div>
          </div>
        </div>

        {/* Right: Hint + Button */}
        <div className="flex items-center gap-2 shrink-0">
          {showLogsBtn && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-9 text-xs text-muted-foreground border-border/60"
              onClick={() => navigate({ to: "/tasks" })}
            >
              <Terminal className="h-3.5 w-3.5" />
              Логи задачи
            </Button>
          )}
          {!running && firstMissing && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="text-xs text-amber-400">{firstMissing.hint ?? `Нужно: ${firstMissing.label}`}</span>
            </div>
          )}
          {!running ? (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={onStart}
                disabled={startDisabled || !allDone}
                className={cn(
                  "gap-2 h-10 px-5 font-semibold text-sm transition-all",
                  allDone
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <Play className="h-4 w-4" />
                <span className="hidden sm:inline">{startLabel}</span>
                <span className="sm:hidden">Старт</span>
              </Button>
            </motion.div>
          ) : (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={onStop}
                variant="destructive"
                className="gap-2 h-10 px-5 font-semibold text-sm animate-pulse"
              >
                <Square className="h-4 w-4" />
                <span className="hidden sm:inline">Остановить</span>
                <span className="sm:hidden">Стоп</span>
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Warning bar for missing requirements on mobile */}
      {!running && firstMissing && (
        <div className="lg:hidden px-4 pb-3 -mt-1 flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span className="text-xs text-amber-400">{firstMissing.hint ?? `Нужно: ${firstMissing.label}`}</span>
        </div>
      )}
    </div>
  );
};

export default ToolHeader;
