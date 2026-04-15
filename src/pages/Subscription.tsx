import { useEffect, useState } from "react";
import { Crown, Check, Zap, ArrowRight, RefreshCw, Users, ListTodo, CalendarClock, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useNavigate } from "@tanstack/react-router";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlanInfo {
  label:     string;
  price_rub: number;
  accounts:  number;
  tasks:     number;
  features:  string[];
  color:     string;
}

interface SubData {
  plan:             string;
  plan_label:       string;
  price_rub:        number;
  features:         string[];
  accounts_used:    number;
  accounts_limit:   number;
  tasks_used:       number;
  tasks_limit:      number;
  subscription_end: number | null;
  plans:            Record<string, PlanInfo>;
  plan_order:       string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PLAN_COLORS: Record<string, { border: string; badge: string; btn: string }> = {
  zinc:   { border: "border-border",       badge: "bg-zinc-500/20 text-zinc-300",       btn: "bg-zinc-600 hover:bg-zinc-500 text-white" },
  blue:   { border: "border-blue-500/40",  badge: "bg-blue-500/20 text-blue-300",       btn: "bg-blue-600 hover:bg-blue-500 text-white" },
  violet: { border: "border-primary/50",   badge: "bg-primary/20 text-primary",         btn: "bg-primary hover:bg-primary/80 text-white" },
  amber:  { border: "border-amber-500/40", badge: "bg-amber-500/20 text-amber-300",     btn: "bg-amber-500 hover:bg-amber-400 text-black" },
};

function formatDate(ts: number | null): string {
  if (!ts) return "Бессрочно";
  return new Date(ts * 1000).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function daysLeft(ts: number | null): number | null {
  if (!ts) return null;
  return Math.max(0, Math.ceil((ts * 1000 - Date.now()) / 86_400_000));
}

function UsageBar({ label, used, limit, color }: { label: string; used: number; limit: number; color: string }) {
  const pct = limit >= 9999 ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const isHigh = pct >= 80;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-medium", isHigh ? "text-amber-400" : "text-foreground")}>
          {used.toLocaleString()} / {limit >= 9999 ? "∞" : limit.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", isHigh ? "bg-amber-400" : color)}
          style={{ width: limit >= 9999 ? "8%" : `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const Subscription = () => {
  const [data,    setData]    = useState<SubData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    fetch("/api/subscription", { credentials: "include" })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center h-48">
        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-sm text-muted-foreground">Не удалось загрузить данные подписки.</p>
      </div>
    );
  }

  const planOrder = data.plan_order ?? Object.keys(data.plans);
  const currentIdx = planOrder.indexOf(data.plan);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-400" />
            Подписка
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Управление тарифным планом</p>
        </div>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="gap-1.5 h-8 text-xs text-muted-foreground">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Обновить
        </Button>
      </div>

      {/* Current plan card */}
      {(() => {
        const days = daysLeft(data.subscription_end);
        const expiring = days !== null && days <= 7;
        const accPct  = data.accounts_limit >= 9999 ? 0 : Math.round(data.accounts_used / data.accounts_limit * 100);
        const taskPct = Math.round(data.tasks_used / data.tasks_limit * 100);
        const hasWarning = expiring || accPct >= 80 || taskPct >= 80;
        return (
          <div className={cn("panel-card p-5 space-y-4", hasWarning && "border-amber-500/30")}>
            {/* Expiry warning banner */}
            {expiring && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>Подписка истекает через <strong>{days} {days === 1 ? "день" : days < 5 ? "дня" : "дней"}</strong> — продлите чтобы не потерять доступ</span>
              </div>
            )}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide",
                    PLAN_COLORS[data.plans[data.plan]?.color ?? "zinc"]?.badge
                  )}>
                    {data.plan_label}
                  </span>
                  <span className="text-sm font-medium text-foreground">Текущий план</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {data.subscription_end
                      ? <>до {formatDate(data.subscription_end)}
                          {days !== null && !expiring && (
                            <span className="ml-1 text-foreground/50">({days} дн.)</span>
                          )}
                        </>
                      : "Бессрочно"}
                  </span>
                  {data.price_rub > 0 && (
                    <span className="text-primary font-semibold">{data.price_rub.toLocaleString()} ₽/мес</span>
                  )}
                </div>
              </div>
              <ShieldCheck className="h-8 w-8 text-primary shrink-0 opacity-60" />
            </div>

            {/* Usage bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/30">
              <UsageBar label="Аккаунты"       used={data.accounts_used} limit={data.accounts_limit} color="bg-violet-400" />
              <UsageBar label="Активные задачи" used={data.tasks_used}    limit={data.tasks_limit}    color="bg-emerald-400" />
            </div>

            {/* Quota warnings */}
            {(accPct >= 80 || taskPct >= 80) && (
              <div className="space-y-1.5">
                {accPct >= 80 && data.accounts_limit < 9999 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    Использовано {accPct}% лимита аккаунтов — рассмотрите обновление плана
                  </div>
                )}
                {taskPct >= 80 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    Использовано {taskPct}% лимита задач
                  </div>
                )}
              </div>
            )}

            {/* Stat pills */}
            <div className="flex gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-violet-500/10 text-violet-300">
                <Users className="h-3.5 w-3.5" />
                {data.accounts_used} / {data.accounts_limit >= 9999 ? "∞" : data.accounts_limit} аккаунтов
              </div>
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300">
                <ListTodo className="h-3.5 w-3.5" />
                {data.tasks_used} / {data.tasks_limit} задач
              </div>
            </div>
          </div>
        );
      })()}

      {/* Plan grid */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Доступные планы</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {planOrder.map((planKey, idx) => {
            const p = data.plans[planKey];
            if (!p) return null;
            const isCurrent = planKey === data.plan;
            const isUpgrade = idx > currentIdx;
            const colors = PLAN_COLORS[p.color ?? "zinc"];

            return (
              <div
                key={planKey}
                className={cn(
                  "panel-card p-4 space-y-4 transition-all relative",
                  colors.border,
                  isCurrent && "ring-1 ring-primary/40",
                )}
              >
                {isCurrent && (
                  <div className="absolute -top-2 left-3">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary text-white uppercase tracking-wide">
                      Текущий
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground flex items-center gap-1">
                      {planKey === "unlimited" && <Zap className="h-3.5 w-3.5 text-amber-400" />}
                      {p.label}
                    </h3>
                  </div>
                  <p className="text-lg font-bold text-foreground mt-1">
                    {p.price_rub === 0 ? (
                      <span className="text-muted-foreground">Бесплатно</span>
                    ) : (
                      <>{p.price_rub.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">₽/мес</span></>
                    )}
                  </p>
                </div>

                <ul className="space-y-1.5">
                  {p.features.map((f) => (
                    <li key={f} className="text-xs flex items-start gap-2 text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  size="sm"
                  className={cn("w-full text-xs h-8", isCurrent ? "opacity-50 cursor-default" : colors.btn)}
                  disabled={isCurrent}
                  onClick={() => !isCurrent && navigate({ to: `/payment?plan=${planKey}&price=${p.price_rub}&currency=rub` })}
                >
                  {isCurrent ? "Ваш план" : isUpgrade ? (
                    <span className="flex items-center gap-1">Перейти <ArrowRight className="h-3 w-3" /></span>
                  ) : "Выбрать"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact support note */}
      <button
        className="panel-card p-4 flex items-center gap-3 border-border/50 w-full text-left hover:border-primary/30 transition-colors"
        onClick={() => navigate({ to: "/payment" })}
      >
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Crown className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Нужен другой план?</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Выберите способ оплаты — менеджер оформит подписку вручную.
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </button>
    </div>
  );
};

export default Subscription;
