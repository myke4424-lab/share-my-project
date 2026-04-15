import { ArrowLeft, Bitcoin, CreditCard, Globe, MessageCircle, CheckCircle2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

const TG_LINK = "https://t.me/vitallautomation";

const METHODS = [
  {
    id: "crypto",
    title: "Криптовалюта",
    subtitle: "USDT, BTC, ETH, TON",
    description: "Оплата в любой криптовалюте. Быстро, анонимно, без комиссии банка.",
    icon: Bitcoin,
    color: "text-amber-500",
    bg: "bg-amber-500/8",
    border: "border-amber-500/20 hover:border-amber-500/50",
    ring: "hover:ring-amber-500/15",
    badge: "USDT · BTC · ETH · TON",
    badgeColor: "bg-amber-500/10 text-amber-500",
  },
  {
    id: "ru-card",
    title: "Российская карта",
    subtitle: "Visa, MIR, МастерКард",
    description: "Оплата картой российского банка. Рубли, моментальное зачисление.",
    icon: CreditCard,
    color: "text-blue-500",
    bg: "bg-blue-500/8",
    border: "border-blue-500/20 hover:border-blue-500/50",
    ring: "hover:ring-blue-500/15",
    badge: "Visa · MIR · МастерКард",
    badgeColor: "bg-blue-500/10 text-blue-500",
  },
  {
    id: "intl-card",
    title: "Международная карта",
    subtitle: "Visa, Mastercard (иностранные)",
    description: "Оплата иностранной картой. Подходит для клиентов вне России.",
    icon: Globe,
    color: "text-violet-500",
    bg: "bg-violet-500/8",
    border: "border-violet-500/20 hover:border-violet-500/50",
    ring: "hover:ring-violet-500/15",
    badge: "Visa · Mastercard · International",
    badgeColor: "bg-violet-500/10 text-violet-500",
  },
];

const PLAN_NAMES: Record<string, string> = {
  warming:    "Прогрев",
  inviting:   "Инвайтинг",
  parsing:    "Парсинг",
  commenting: "Нейрокомментинг",
  pro:        "Pro System",
};

export default function Payment() {
  const [params] = URLSearchParams();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const planKey   = params.get("plan") ?? "";
  const priceRaw  = params.get("price") ?? "";
  const currency  = params.get("currency") ?? "usd";
  const planLabel = PLAN_NAMES[planKey] ?? planKey;
  const priceNum  = Number(priceRaw) || 0;

  const priceDisplay = priceNum
    ? currency === "rub"
      ? `${priceNum.toLocaleString("ru-RU")} ₽/мес`
      : `$${priceNum}/мес`
    : null;

  function handleSelect(methodId: string) {
    setSelected(methodId);
    setDone(true);
    window.open(TG_LINK, "_blank");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border/50 px-4 sm:px-6 h-14 flex items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад
        </button>
        <span className="text-border/70">·</span>
        <span className="text-sm font-medium text-foreground">Оплата</span>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 sm:px-6 py-10 sm:py-16">
        <div className="w-full max-w-2xl space-y-8">

          {/* Plan summary */}
          {planLabel && (
            <div className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-card border border-border/60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Выбранный план</p>
                  <p className="text-sm font-semibold text-foreground">{planLabel}</p>
                </div>
              </div>
              {priceDisplay && (
                <span className="text-sm font-bold text-foreground">{priceDisplay}</span>
              )}
            </div>
          )}

          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">
              Выберите способ оплаты
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              После выбора вас перенаправит в Telegram — менеджер оформит подписку в течение нескольких минут.
            </p>
          </div>

          {/* Methods */}
          <div className="space-y-3">
            {METHODS.map((m) => {
              const Icon = m.icon;
              const isSelected = selected === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => handleSelect(m.id)}
                  className={cn(
                    "w-full text-left group flex items-start gap-4 p-5 rounded-xl border bg-card",
                    "transition-all duration-150 ring-1 ring-transparent",
                    "focus-visible:outline-none focus-visible:ring-primary/50",
                    isSelected
                      ? "border-primary/50 ring-primary/20 bg-primary/5"
                      : `${m.border} ${m.ring}`,
                  )}
                >
                  {/* Icon */}
                  <div className={cn("mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center shrink-0", m.bg)}>
                    <Icon className={cn("h-5 w-5", m.color)} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground text-[15px]">{m.title}</span>
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", m.badgeColor)}>
                        {m.badge}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{m.description}</p>
                  </div>

                  {/* Arrow */}
                  <div className={cn(
                    "shrink-0 mt-1 w-7 h-7 rounded-lg border flex items-center justify-center transition-all",
                    isSelected
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border/50 text-muted-foreground group-hover:border-border group-hover:text-foreground",
                  )}>
                    <MessageCircle className="h-3.5 w-3.5" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* After selection hint */}
          {done && (
            <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Telegram открыт.</span>{" "}
                Напишите менеджеру выбранный способ оплаты{planLabel ? ` и план "${planLabel}"` : ""} — он пришлёт реквизиты.
              </div>
            </div>
          )}

          {/* Trust footer */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60 pt-2">
            <Shield className="h-3.5 w-3.5 shrink-0" />
            Все платежи обрабатываются вручную менеджером. Подписка активируется в течение нескольких минут после оплаты.
          </div>

        </div>
      </main>
    </div>
  );
}
