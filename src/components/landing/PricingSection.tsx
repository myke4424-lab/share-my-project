import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Star, Flame, Rocket, BarChart3, Crown, Zap } from "lucide-react";

const toolPlans = [
  { id: "warming", Icon: Flame, iconColor: "text-amber-500", iconBg: "bg-amber-500/10", accentBar: "bg-amber-500", hoverBorder: "hover:border-amber-500/40", name: "Прогрев", desc: "Автопрогрев аккаунтов с имитацией живого поведения.", priceMonth: 15, features: ["Прогрев аккаунтов", "∞ аккаунтов", "∞ задач", "Умные задержки"] },
  { id: "inviting", Icon: Rocket, iconColor: "text-emerald-500", iconBg: "bg-emerald-500/10", accentBar: "bg-emerald-500", hoverBorder: "hover:border-emerald-500/40", name: "Инвайтинг", desc: "Массовый инвайтинг в чаты и каналы с контролем лимитов.", priceMonth: 25, features: ["Инвайтинг", "∞ аккаунтов", "∞ задач", "Контроль FloodWait"] },
  { id: "parsing", Icon: BarChart3, iconColor: "text-blue-500", iconBg: "bg-blue-500/10", accentBar: "bg-blue-500", hoverBorder: "hover:border-blue-500/40", name: "Парсинг", desc: "Сбор целевой аудитории из чатов и каналов.", priceMonth: 10, features: ["Парсинг аудитории", "∞ аккаунтов", "∞ задач", "Быстрый экспорт"] },
];

const PRO_FEATURES = ["Все инструменты", "Прогрев аккаунтов", "Инвайтинг", "Парсинг аудитории", "Нейрокомментинг", "Нейрочаттинг ЛС", "Реакции и истории", "∞ аккаунтов", "∞ задач", "Поддержка 24/7", "Новые инструменты сразу"];

const PricingSection = () => {
  const [yearly, setYearly] = useState(false);
  const price = (m: number) => yearly ? Math.round(m * 12 * 0.7) : m;
  const suffix = yearly ? "/год" : "/мес";

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Тарифы</p>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground">Прозрачные тарифы</h2>
            <p className="mt-2 text-muted-foreground max-w-md">Один инструмент или полный арсенал — выбор за вами.</p>
          </div>
          <div className="shrink-0 flex flex-col items-start sm:items-end gap-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Zap size={12} className="fill-current" />Trial — 3 дня всех инструментов бесплатно
            </span>
            <div className="inline-flex items-center gap-0.5 p-1 rounded-full bg-card border border-border">
              <button onClick={() => setYearly(false)} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${!yearly ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Ежемесячно</button>
              <button onClick={() => setYearly(true)} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${yearly ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                Ежегодно
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${yearly ? "bg-white/25 text-white" : "bg-emerald-500/15 text-emerald-600"}`}>−30%</span>
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }} className="relative rounded-2xl bg-primary overflow-hidden mb-3">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.14),transparent_55%)] pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute -top-3.5 left-8">
            <span className="inline-flex items-center gap-1.5 bg-background text-foreground text-xs font-bold px-4 py-1.5 rounded-full shadow-md border border-border/60">
              <Star size={11} className="fill-primary text-primary" />Выгодный
            </span>
          </div>
          <div className="relative z-10 p-7 sm:p-8 pt-10">
            <div className="flex flex-col lg:flex-row lg:items-center gap-8">
              <div className="lg:w-56 shrink-0">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <Crown size={18} className="text-white/85" />
                  <h3 className="text-2xl font-black text-white tracking-tight">Pro System</h3>
                </div>
                <p className="text-sm text-white/60 mb-5 leading-relaxed">Все инструменты в одном. Новые модули сразу после релиза.</p>
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-white tabular-nums">${price(39)}</span>
                    <span className="text-sm text-white/55">{suffix}</span>
                  </div>
                  {!yearly ? <p className="text-xs text-white/45 mt-1">или $328 при оплате за год (−30%)</p> : <p className="text-xs text-white/35 line-through mt-0.5">${39 * 12} без скидки</p>}
                </div>
                <Button className="w-full rounded-full h-11 font-bold bg-white text-primary hover:bg-white/92 text-sm shadow-sm">Начать сейчас</Button>
              </div>
              <div className="flex-1 flex flex-wrap gap-2">
                {PRO_FEATURES.map((f, i) => (
                  <motion.span key={f} initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.04, type: "spring", stiffness: 200 }} className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full">
                    <Check size={11} strokeWidth={3} />{f}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex items-center gap-4 my-5">
          <div className="flex-1 h-px bg-border/40" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 px-1">или отдельные модули</span>
          <div className="flex-1 h-px bg-border/40" />
        </div>

        <motion.div variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.09 } } }} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="grid md:grid-cols-3 gap-3">
          {toolPlans.map((plan) => {
            const { Icon } = plan;
            return (
              <motion.div key={plan.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } } }} whileHover={{ y: -5, transition: { duration: 0.2 } }} className={`relative bg-card border border-border rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-md ${plan.hoverBorder}`}>
                <div className={`h-[3px] w-full ${plan.accentBar}`} />
                <div className="p-6 flex flex-col flex-1">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${plan.iconBg}`}>
                    <Icon size={20} className={plan.iconColor} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{plan.desc}</p>
                  <div className="mb-5">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-4xl font-black tabular-nums ${plan.iconColor}`}>${price(plan.priceMonth)}</span>
                      <span className="text-sm text-muted-foreground">{suffix}</span>
                    </div>
                    {yearly && <p className="text-xs text-muted-foreground/40 line-through mt-0.5">${plan.priceMonth * 12} без скидки</p>}
                  </div>
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                        <Check size={14} className={`${plan.iconColor} shrink-0`} />{f}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full rounded-full h-10 font-semibold text-sm" variant="outline">Подключить</Button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
