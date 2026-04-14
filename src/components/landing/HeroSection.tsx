import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, Bot, TrendingUp, Users, MessageSquare, Activity } from "lucide-react";

const CARDS = [
  { icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", label: "Инвайтинг", value: "156", unit: "приглашений", delay: 0 },
  { icon: Bot, color: "text-violet-400", bg: "bg-violet-500/10", label: "Нейрокомментинг", value: "24", unit: "комментария", delay: 0.12 },
  { icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10", label: "Trust Score", value: "82%", unit: "+4% сегодня", delay: 0.24 },
  { icon: MessageSquare, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Прогрев #A-07", value: "День 7", unit: "из 14", delay: 0.36 },
];

const PILLS = [
  { icon: Bot, label: "AI-комментинг" },
  { icon: Zap, label: "Авто-прогрев" },
  { icon: Shield, label: "Анти-спамблок" },
];

const HeroSection = () => {
  return (
    <section className="relative pt-24 pb-16 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-[0.035]" style={{ backgroundImage: "radial-gradient(var(--color-foreground) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      <motion.div className="absolute -top-16 -left-48 w-[520px] h-[520px] rounded-full bg-primary/10 blur-3xl" animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute top-1/2 -right-40 w-[400px] h-[400px] rounded-full bg-violet-500/8 blur-3xl" animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 3 }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-7">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                <motion.span animate={{ rotate: [0, 15, -10, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>🚀</motion.span>
                Платформа нового поколения
              </span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="text-[2.6rem] sm:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight">
              Автоматизируй<br />
              <span className="text-gradient">продвижение</span><br />
              в Telegram
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.7 }} className="mt-5 text-base text-muted-foreground max-w-md leading-relaxed">
              Единая панель для инвайтинга, прогрева, парсинга и нейрокомментинга. Запустите первую кампанию за 10 минут — без ручной работы.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38, duration: 0.6 }} className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" className="rounded-full px-7 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 h-12">
                Начать бесплатно
                <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><ArrowRight size={17} /></motion.span>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-7 h-12 font-semibold border-border/60">
                Посмотреть тарифы
              </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="mt-8 space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex -space-x-2">
                  {["АК", "ДВ", "ЕМ", "МЛ"].map((a, i) => (
                    <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.65 + i * 0.08, type: "spring", stiffness: 280 }} className="w-7 h-7 rounded-full bg-primary/15 border-2 border-background flex items-center justify-center text-[9px] font-bold text-primary">
                      {a}
                    </motion.div>
                  ))}
                </div>
                <span>Нам доверяют 200+ команд</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PILLS.map((p, i) => (
                  <motion.div key={p.label} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 + i * 0.1, type: "spring", stiffness: 200 }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-xs font-medium text-foreground">
                    <p.icon size={12} className="text-primary" />
                    {p.label}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute left-7 top-6 bottom-6 w-px bg-gradient-to-b from-transparent via-border/60 to-transparent" />
            <div className="space-y-3 pl-4">
              {CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <motion.div key={card.label} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: card.delay + 0.5, duration: 0.55, ease: [0.16, 1, 0.3, 1] }} whileHover={{ x: 4, transition: { duration: 0.15 } }} className="relative flex items-center gap-4 bg-card border border-border rounded-xl px-4 py-4 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all cursor-default">
                    <div className="absolute -left-[1.45rem] w-3 h-3 rounded-full border-2 border-background bg-primary/80 shrink-0" />
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.bg}`}>
                      <Icon size={19} className={card.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                      <p className="text-lg font-black text-foreground leading-tight">{card.value}
                        <span className="text-xs font-normal text-muted-foreground ml-1.5">{card.unit}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <motion.span className="w-1.5 h-1.5 rounded-full bg-emerald-400" animate={{ scale: [1, 1.6, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity, delay: card.delay }} />
                      <span className="text-[10px] text-emerald-500 font-semibold">live</span>
                    </div>
                  </motion.div>
                );
              })}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0, duration: 0.5 }} className="ml-4 flex items-center justify-between rounded-xl bg-primary/8 border border-primary/15 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Activity size={15} />
                  4 инструмента активны
                </div>
                <span className="text-xs text-muted-foreground">прямо сейчас</span>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
