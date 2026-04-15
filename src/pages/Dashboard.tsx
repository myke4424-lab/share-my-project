import { useEffect, useState } from "react";
import {
  Users, ListTodo, ShieldOff, CheckCircle2, Send, Brain, Flame, Eye,
  ClipboardList, ArrowRight, Clock, RefreshCw, Crown, Zap, TrendingUp, AlertTriangle,
  Bot, ExternalLink, Copy, CheckCheck,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useNavigate } from "@tanstack/react-router";

interface DashboardStats {
  accounts: { total: number; valid: number; banned: number; spamblock: number };
  tasks: { total: number; running: number; completed: number };
}

interface SubData {
  plan: string; plan_label: string; price_rub: number;
  accounts_used: number; accounts_limit: number;
  tasks_used: number; tasks_limit: number;
  subscription_end: number | null;
}

interface Task {
  task_id: string; tool: string; params_summary: string;
  status: string; started_at: string;
}

const PLAN_BADGE: Record<string, string> = {
  trial:     "bg-zinc-500/20 text-zinc-300 border border-zinc-500/20",
  starter:   "bg-blue-500/20 text-blue-300 border border-blue-500/20",
  pro:       "bg-violet-500/20 text-violet-300 border border-violet-500/20",
  unlimited: "bg-amber-500/20 text-amber-300 border border-amber-500/20",
};

const PLAN_GLOW: Record<string, string> = {
  trial:     "hover:border-border/80",
  starter:   "hover:border-primary/40",
  pro:       "hover:border-violet-500/40",
  unlimited: "hover:border-amber-500/40",
};

const tools = [
  { label: "Инвайтинг",    icon: Send,         path: "/inviting",     color: "text-cyan-500 bg-cyan-500/8",    hover: "hover:bg-cyan-500/15"    },
  { label: "Комментинг",   icon: Brain,        path: "/commenting",   color: "text-violet-500 bg-violet-500/8", hover: "hover:bg-violet-500/15" },
  { label: "Прогрев",      icon: Flame,        path: "/warming",      color: "text-orange-500 bg-orange-500/8", hover: "hover:bg-orange-500/15" },
  { label: "Масслукинг",   icon: Eye,          path: "/storylooking", color: "text-emerald-500 bg-emerald-500/8", hover: "hover:bg-emerald-500/15" },
  { label: "Парсер",       icon: ClipboardList,path: "/parsing",      color: "text-blue-500 bg-blue-500/8",    hover: "hover:bg-blue-500/15"    },
  { label: "Реакции",      icon: Zap,          path: "/reactions",    color: "text-amber-500 bg-amber-500/8",  hover: "hover:bg-amber-500/15"   },
];

const TOOL_ICONS: Record<string, React.ElementType> = {
  inviting:     Send,
  commenting:   Brain,
  warming:      Flame,
  masslooking:  Eye,
  parsing:      ClipboardList,
  reactions:    Zap,
};

const TOOL_COLORS: Record<string, string> = {
  inviting:     "text-cyan-500",
  commenting:   "text-violet-500",
  warming:      "text-orange-500",
  masslooking:  "text-emerald-500",
  parsing:      "text-blue-500",
  reactions:    "text-amber-500",
};

const statusMap: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  running:   { label: "Работает",   dot: "bg-emerald-400 animate-pulse", text: "text-emerald-400",  bg: "bg-emerald-500/10 border-emerald-500/20"  },
  stopped:   { label: "Остановлен", dot: "bg-amber-400",                 text: "text-amber-400",    bg: "bg-amber-500/10 border-amber-500/20"      },
  completed: { label: "Завершён",   dot: "bg-primary",                   text: "text-primary",      bg: "bg-primary/10 border-primary/20"          },
  failed:    { label: "Ошибка",     dot: "bg-red-400",                   text: "text-red-400",      bg: "bg-red-500/10 border-red-500/20"          },
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff} сек назад`;
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return `${Math.floor(diff / 86400)} дн назад`;
}

const TOOL_LABELS: Record<string, string> = {
  inviting:    "Инвайтинг",
  commenting:  "Комментинг",
  warming:     "Прогрев",
  masslooking: "Масслукинг",
  parsing:     "Парсер",
  reactions:   "Реакции",
};

function daysLeft(ts: number | null): number | null {
  if (!ts) return null;
  return Math.max(0, Math.ceil((ts * 1000 - Date.now()) / 86_400_000));
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats,      setStats]      = useState<DashboardStats | null>(null);
  const [tasks,      setTasks]      = useState<Task[]>([]);
  const [hasRunning, setHasRunning] = useState(false);
  const [sub,        setSub]        = useState<SubData | null>(null);
  const [loading,    setLoading]    = useState(true);

  // Telegram bot state
  const [botLinked,   setBotLinked]   = useState<boolean | null>(null);
  const [botTgName,   setBotTgName]   = useState("");
  const [botLink,     setBotLink]     = useState("");
  const [botLinkLoad, setBotLinkLoad] = useState(false);
  const [copied,      setCopied]      = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/dashboard/stats", { credentials: "include" }).then(r => r.json()).catch(() => null),
      fetch("/api/tasks", { credentials: "include" }).then(r => r.json()).catch(() => []),
      fetch("/api/subscription", { credentials: "include" }).then(r => r.json()).catch(() => null),
    ]).then(([s, t, subData]) => {
      if (s) setStats(s);
      if (Array.isArray(t)) {
        setHasRunning(t.some((task: Task) => task.status === "running"));
        setTasks(t.slice(0, 8));
      }
      if (subData?.plan) setSub(subData);
      setLoading(false);
    });
  };

  // Load bot status once on mount
  useEffect(() => {
    fetch("/api/bot/status", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setBotLinked(d.linked);
          if (d.tg_username) setBotTgName("@" + d.tg_username);
          else if (d.tg_first_name) setBotTgName(d.tg_first_name);
        }
      })
      .catch(() => {});
  }, []);

  const handleGetBotLink = async () => {
    setBotLinkLoad(true);
    try {
      const r = await fetch("/api/bot/link", { credentials: "include" });
      if (r.ok) {
        const d = await r.json();
        setBotLink(d.bot_link);
      }
    } catch {}
    setBotLinkLoad(false);
  };

  const handleCopy = () => {
    if (!botLink) return;
    navigator.clipboard.writeText(botLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => { load(); }, []);

  // Тихое авто-обновление каждые 10с только когда есть активные задачи
  useEffect(() => {
    if (!hasRunning) return;
    const timer = setInterval(() => {
      Promise.all([
        fetch("/api/dashboard/stats", { credentials: "include" }).then(r => r.json()).catch(() => null),
        fetch("/api/tasks",           { credentials: "include" }).then(r => r.json()).catch(() => []),
      ]).then(([s, t]) => {
        if (s) setStats(s);
        if (Array.isArray(t)) {
          setHasRunning(t.some((task: Task) => task.status === "running"));
          setTasks(t.slice(0, 8));
        }
      });
    }, 10_000);
    return () => clearInterval(timer);
  }, [hasRunning]);

  const cards = [
    {
      label: "Аккаунты",      value: stats ? stats.accounts.total   : null,
      icon: Users,            color: "text-violet-400",
      iconBg: "bg-violet-500/15", border: "border-l-violet-500",
      tint: "rgba(139,92,246,0.04)",
      sub: stats ? `${stats.accounts.valid} активных` : "",
    },
    {
      label: "Активных задач", value: stats ? stats.tasks.running    : null,
      icon: TrendingUp,        color: "text-emerald-400",
      iconBg: "bg-emerald-500/15", border: "border-l-emerald-500",
      tint: "rgba(52,211,153,0.04)",
      sub: stats ? `${stats.tasks.completed} завершено` : "",
    },
    {
      label: "Забанено",      value: stats ? stats.accounts.banned  : null,
      icon: ShieldOff,        color: "text-red-400",
      iconBg: "bg-red-500/15",    border: "border-l-red-500",
      tint: "rgba(248,113,113,0.04)",
      sub: stats ? `${stats.accounts.spamblock} спамблок` : "",
    },
    {
      label: "Всего задач",   value: stats ? stats.tasks.total      : null,
      icon: CheckCircle2,     color: "text-amber-400",
      iconBg: "bg-amber-500/15",  border: "border-l-amber-500",
      tint: "rgba(251,191,36,0.04)",
      sub: "за сессию",
    },
  ];

  const runningTasks = tasks.filter(t => t.status === "running");
  const recentTasks  = tasks.filter(t => t.status !== "running").slice(0, 5);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1280px] fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Дашборд</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Обзор активности системы</p>
        </div>
        <Button
          variant="ghost" size="sm" onClick={load} disabled={loading}
          className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Обновить
        </Button>
      </div>

      {/* Running tasks alert */}
      {runningTasks.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <p className="text-xs text-emerald-400 font-medium">
            {runningTasks.length} {runningTasks.length === 1 ? "задача выполняется" : "задачи выполняются"}: {runningTasks.map(t => TOOL_LABELS[t.tool] ?? t.tool).join(", ")}
          </p>
          <button onClick={() => navigate({ to: "/notifications" })} className="ml-auto text-[10px] text-emerald-400/70 hover:text-emerald-400 flex items-center gap-1">
            Подробнее <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading && !stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card border-l-2 border-border">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-2.5 w-20" />
              </div>
              <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            </div>
          ))
        ) : (
          cards.map((c) => (
            <div key={c.label}
              className={cn("stat-card border-l-2 transition-all duration-200", c.border)}
              style={{ background: `linear-gradient(135deg, ${c.tint} 0%, transparent 60%)` }}
            >
              <div>
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{c.label}</p>
                <p className="text-3xl font-black text-foreground mt-1 tabular-nums">{c.value ?? "—"}</p>
                {c.sub && <p className={cn("text-[10px] mt-1", c.color)}>{c.sub}</p>}
              </div>
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", c.iconBg)}>
                <c.icon className={cn("h-5 w-5", c.color)} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Two column layout: subscription + quick launch */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

        {/* Subscription card */}
        {sub && (() => {
          const days = daysLeft(sub.subscription_end);
          const expiring = days !== null && days <= 7;
          return (
            <div
              className={cn("panel-card p-4 cursor-pointer transition-all col-span-1", PLAN_GLOW[sub.plan] ?? PLAN_GLOW.trial)}
              onClick={() => navigate({ to: "/subscription" })}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Crown className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", PLAN_BADGE[sub.plan] ?? PLAN_BADGE.trial)}>
                      {sub.plan_label}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {days === null
                        ? "Бессрочно"
                        : expiring
                        ? <span className="text-amber-400 flex items-center gap-1"><AlertTriangle className="h-2.5 w-2.5" />Истекает через {days} дн.</span>
                        : `${days} дн. осталось`}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "Аккаунты", used: sub.accounts_used, limit: sub.accounts_limit, color: "bg-violet-400" },
                  { label: "Задачи",   used: sub.tasks_used,    limit: sub.tasks_limit,    color: "bg-emerald-400" },
                ].map(({ label, used, limit, color }) => {
                  const pct = limit >= 9999 ? 6 : Math.min(100, Math.round(used / limit * 100));
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>{label}</span>
                        <span className={cn("font-medium", pct >= 80 ? "text-amber-400" : "text-foreground")}>
                          {used}/{limit >= 9999 ? "∞" : limit}
                        </span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", pct >= 80 ? "bg-amber-400" : color)}
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Quick launch */}
        <div className={cn("panel-card p-4", sub ? "col-span-1 md:col-span-2" : "col-span-1 md:col-span-3")}>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Быстрый запуск</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {tools.map((t) => (
              <button
                key={t.label}
                onClick={() => navigate(t.path)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-transparent hover:border-border transition-all group hover:bg-secondary/60"
              >
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-all", t.color, `group-hover:${t.hover.replace("hover:","")}`)}>
                  <t.icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Telegram Bot card */}
      {botLinked !== null && (
        <div className={cn(
          "panel-card p-4 flex items-center gap-4",
          botLinked
            ? "border-emerald-500/20 bg-emerald-500/5"
            : "border-primary/20"
        )}>
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            botLinked ? "bg-emerald-500/15" : "bg-primary/10"
          )}>
            <Bot className={cn("h-5 w-5", botLinked ? "text-emerald-400" : "text-primary")} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">
              {botLinked ? "Telegram подключён" : "Подключить Telegram-бота"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {botLinked
                ? `Аккаунт привязан${botTgName ? ` — ${botTgName}` : ""}. Вы будете получать уведомления в боте.`
                : "Получайте уведомления о задачах и управляйте системой прямо из Telegram."}
            </p>
            {botLink && !botLinked && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[11px] font-mono text-primary/80 bg-primary/5 px-2 py-1 rounded-md border border-primary/10 truncate max-w-[260px]">
                  {botLink}
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  {copied ? <CheckCheck className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Скопировано" : "Копировать"}
                </button>
              </div>
            )}
          </div>
          {!botLinked && (
            <div className="flex items-center gap-2 shrink-0">
              {botLink ? (
                <a href={botLink} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="h-8 text-xs gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" /> Открыть бота
                  </Button>
                </a>
              ) : (
                <Button size="sm" className="h-8 text-xs" onClick={handleGetBotLink} disabled={botLinkLoad}>
                  {botLinkLoad ? "Генерация..." : "Получить ссылку"}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tasks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Последние задачи</h2>
            {tasks.length > 0 && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                показаны {tasks.length} последних
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/notifications" })}
            className="text-primary hover:text-primary/80 gap-1 h-7 text-xs">
            Все задачи <ArrowRight className="h-3 w-3" />
          </Button>
        </div>

        <div className="panel-card overflow-hidden">
          {loading && tasks.length === 0 ? (
            <div className="divide-y divide-border/50">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2.5 w-40" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-12 text-center">
              <ListTodo className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">Задач пока нет — запустите любой модуль</p>
            </div>
          ) : (
            <div>
              {/* Running tasks first */}
              {runningTasks.map((task) => {
                const ToolIcon = TOOL_ICONS[task.tool] ?? ListTodo;
                const toolColor = TOOL_COLORS[task.tool] ?? "text-muted-foreground";
                return (
                  <div key={task.task_id}
                    className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0 bg-emerald-500/5 hover:bg-emerald-500/8 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <ToolIcon className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-foreground">{TOOL_LABELS[task.tool] ?? task.tool}</span>
                      <p className="text-[11px] text-muted-foreground truncate">{task.params_summary}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Работает
                    </div>
                  </div>
                );
              })}
              {/* Recent tasks */}
              {recentTasks.map((task) => {
                const st = statusMap[task.status] ?? statusMap.stopped;
                const ToolIcon = TOOL_ICONS[task.tool] ?? ListTodo;
                const toolColor = TOOL_COLORS[task.tool] ?? "text-muted-foreground";
                return (
                  <div key={task.task_id}
                    className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-secondary/40 transition-colors">
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", `bg-secondary`)}>
                      <ToolIcon className={cn("h-3.5 w-3.5", toolColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-foreground">{TOOL_LABELS[task.tool] ?? task.tool}</span>
                      <p className="text-[11px] text-muted-foreground truncate hidden md:block">{task.params_summary}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("hidden sm:flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border", st.bg, st.text)}>
                        <span className={cn("w-1 h-1 rounded-full", st.dot)} />
                        {st.label}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" /> {timeAgo(task.started_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
