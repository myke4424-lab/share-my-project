import { motion } from "framer-motion";
import { Check, X, ArrowRight, Crown, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const ALL_FEATURES = [
  "Парсинг аудитории", "Инвайтинг", "AI-комментинг", "Прогрев аккаунтов", "Нейрочаттинг (ЛС)",
  "Массовые реакции", "Масслукинг историй", "Стори-теггер", "Конвертер сессий", "Защита от банов",
  "Аналитика", "Поддержка 24/7", "Веб-приложение",
];

const COMPETITORS = [
  { name: "Софт", examples: "TeleRaptor, TG Expert", color: "text-sky-500", bg: "bg-sky-500/8", border: "border-sky-500/20", have: [0, 1, 3, 5, 11], partial: [0, 3, 5, 11] },
  { name: "Аналитика", examples: "TGStat, Telemetr", color: "text-violet-500", bg: "bg-violet-500/8", border: "border-violet-500/20", have: [10, 12], partial: [6] },
  { name: "Нейро-боты", examples: "Socrupor, Easy AI", color: "text-rose-500", bg: "bg-rose-500/8", border: "border-rose-500/20", have: [2, 4, 12], partial: [2, 4, 12] },
];

export default function ComparisonSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Сравнение</p>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground">Почему выбирают TeleBoost?</h2>
          <p className="mt-3 text-muted-foreground max-w-xl">Единственная платформа, где все инструменты работают вместе.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }} className="relative rounded-2xl bg-primary p-6 sm:p-8 mb-4 overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-start gap-6">
            <div className="shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Crown size={18} className="text-primary-foreground/80" />
                <span className="text-xl font-black text-primary-foreground">TeleBoost</span>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
                <span className="text-2xl font-black text-white">13</span>
                <span className="text-xs text-white/70 font-medium">/ 13 функций</span>
              </div>
              <div className="mt-4 hidden sm:block">
                <Button size="sm" className="rounded-full bg-white text-primary hover:bg-white/90 font-semibold gap-1.5 h-9 text-sm">
                  Попробовать бесплатно <ArrowRight size={14} />
                </Button>
              </div>
            </div>
            <div className="flex-1 flex flex-wrap gap-2">
              {ALL_FEATURES.map((f, i) => (
                <motion.span key={f} initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.04, type: "spring", stiffness: 200 }} className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                  <Check size={11} strokeWidth={3} />{f}
                </motion.span>
              ))}
            </div>
          </div>
          <div className="mt-5 sm:hidden">
            <Button size="sm" className="rounded-full bg-white text-primary hover:bg-white/90 font-semibold gap-1.5 h-9 w-full">
              Попробовать бесплатно <ArrowRight size={14} />
            </Button>
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-3">
          {COMPETITORS.map((comp, ci) => {
            const score = comp.have.length;
            const pct = Math.round((score / ALL_FEATURES.length) * 100);
            const missing = ALL_FEATURES.filter((_, i) => !comp.have.includes(i));
            return (
              <motion.div key={comp.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: ci * 0.1 + 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className={`rounded-xl border ${comp.border} ${comp.bg} p-5 space-y-4`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`font-bold text-sm ${comp.color}`}>{comp.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{comp.examples}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-lg font-black text-foreground">{score}</span>
                    <span className="text-xs text-muted-foreground">/{ALL_FEATURES.length}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground"><span>Покрытие функций</span><span>{pct}%</span></div>
                  <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                    <motion.div className={`h-full rounded-full bg-current ${comp.color}`} initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: ci * 0.1 + 0.4, ease: "easeOut" }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendingDown size={11} className="text-muted-foreground/60" />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Нет в наличии</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {missing.slice(0, 6).map((f) => (
                      <span key={f} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60 bg-muted/40 px-2 py-1 rounded-full"><X size={9} strokeWidth={2.5} />{f}</span>
                    ))}
                    {missing.length > 6 && <span className="text-[10px] text-muted-foreground/50 px-2 py-1">+{missing.length - 6} ещё</span>}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
