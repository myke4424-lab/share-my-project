import { motion, useInView, animate } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRef, useEffect, useState } from "react";
import { Activity, TrendingUp, Zap, Shield } from "lucide-react";

const AnimatedNumber = ({ value }: { value: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!isInView) return;
    const numeric = parseFloat(value.replace(/[^0-9.]/g, ""));
    const suffix = value.replace(/[0-9.]/g, "");
    if (isNaN(numeric)) { setDisplay(value); return; }
    const controls = animate(0, numeric, {
      duration: 1.8, ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        const rounded = numeric % 1 === 0 ? Math.round(v).toString() : v.toFixed(1);
        setDisplay(rounded + suffix);
      },
    });
    return controls.stop;
  }, [isInView, value]);

  return <span ref={ref}>{display}</span>;
};

const StatsSection = () => {
  const { t } = useLanguage();

  const stats = [
    {
      icon: TrendingUp,
      value: "2.4M",
      label: "Лидов привлечено клиентами за 2024 год",
      sub: "leads.generated",
      delta: "↑ 312% YoY",
    },
    {
      icon: Zap,
      value: "8940",
      label: "Действий в час на одном аккаунте без блокировок",
      sub: "actions.per_hour",
      delta: "× 47 быстрее",
    },
    {
      icon: Shield,
      value: "95%",
      label: "Аккаунтов выживают первый месяц работы",
      sub: "survival.rate",
      delta: "vs 38% рынок",
    },
    {
      icon: Activity,
      value: "11",
      label: "Минут от регистрации до первой кампании",
      sub: "time.to.value",
      delta: "без кода",
    },
  ];

  return (
    <section className="relative py-16 sm:py-24">
      {/* Telegram blue ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] rounded-full opacity-[0.08] blur-3xl"
          style={{ background: "radial-gradient(ellipse, oklch(0.65 0.20 250) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-4">
        {/* Section header — terminal style */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-card border border-border/60 font-mono text-[11px] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>результаты_клиентов.live</span>
            <span className="text-border">|</span>
            <span className="text-foreground/70">не_кейсы_из_2019</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-border/60 to-transparent" />
          <span className="font-mono text-[11px] text-muted-foreground hidden sm:inline">
            данные за 30 дней · обновлено 2 мин назад
          </span>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-5 sm:p-6 hover:border-primary/40 transition-all duration-300"
              >
                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: "radial-gradient(circle at 50% 0%, oklch(0.65 0.20 250 / 0.08), transparent 70%)" }}
                />

                {/* Top row: icon + delta */}
                <div className="relative flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Icon className="w-4 h-4" strokeWidth={2.2} />
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    {s.delta}
                  </span>
                </div>

                {/* Big number */}
                <div className="relative">
                  <div className="text-4xl sm:text-5xl font-black tracking-tight text-foreground leading-none">
                    <AnimatedNumber value={s.value} />
                  </div>
                  <div className="mt-2 text-sm text-foreground/80 leading-snug">
                    {s.label}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/40 font-mono text-[10px] text-muted-foreground tracking-wider uppercase">
                    {s.sub}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom strip — trust line */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[11px] text-muted-foreground"
        >
          <span className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-primary" />
            no_card_required
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-primary" />
            3_day_trial
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-primary" />
            cancel_anytime
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-primary" />
            200+_teams_onboard
          </span>
        </motion.div>
      </div>
    </section>
  );
};

export default StatsSection;
