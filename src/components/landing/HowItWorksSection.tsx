import { motion } from "framer-motion";
import { Search, Flame, MessageSquare, UserPlus, Tag, Bot, Heart, BarChart3, Eye } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ParsingWidget = () => (
  <div className="mt-5 rounded-xl border border-blue-500/15 bg-black/20 p-3 space-y-2">
    <div className="flex items-center justify-between text-[10px] font-mono">
      <span className="text-blue-400/60 tracking-widest">PARSING…</span>
      <span className="text-blue-400/80">847 / 2 000</span>
    </div>
    <div className="h-1 rounded-full bg-blue-500/10 overflow-hidden">
      <motion.div className="h-full bg-blue-500 rounded-full" initial={{ width: "0%" }} whileInView={{ width: "42%" }} viewport={{ once: true }} transition={{ duration: 1.4, delay: 0.2, ease: "easeOut" }} />
    </div>
    <div className="pt-1 space-y-1.5">
      {[{ phone: "+7 916 ···47", badge: "Целевой", bc: "text-blue-400 bg-blue-400/10" }, { phone: "+7 903 ···12", badge: "Активен", bc: "text-emerald-400 bg-emerald-400/10" }, { phone: "+7 985 ···83", badge: "Целевой", bc: "text-blue-400 bg-blue-400/10" }].map((row, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 + i * 0.1 }} className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-foreground/50">{row.phone}</span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${row.bc}`}>{row.badge}</span>
        </motion.div>
      ))}
    </div>
  </div>
);

const TrustWidget = () => (
  <div className="mt-5 space-y-3">
    {[{ acc: "@acc_01", score: 78, bar: "bg-amber-500" }, { acc: "@acc_02", score: 84, bar: "bg-amber-400" }, { acc: "@acc_03", score: 91, bar: "bg-emerald-400" }].map((a, i) => (
      <div key={i}>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="font-mono text-foreground/50">{a.acc}</span>
          <span className="font-bold text-foreground/70">Trust {a.score}%</span>
        </div>
        <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
          <motion.div className={`h-full rounded-full ${a.bar}`} initial={{ width: "0%" }} whileInView={{ width: `${a.score}%` }} viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.2 + i * 0.15 }} />
        </div>
      </div>
    ))}
  </div>
);

const CommentWidget = () => (
  <div className="mt-5 rounded-xl border border-violet-500/15 bg-black/20 p-3">
    <div className="text-[9px] text-violet-400/50 font-mono tracking-widest mb-2">AI → @crypto_signal</div>
    <p className="text-[11px] text-foreground/70 italic leading-relaxed">"Отличный анализ! Именно то, о чём думал в последнее время 🔥"</p>
    <div className="mt-2.5 flex items-center gap-1.5">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      <span className="text-[10px] text-emerald-400 font-medium">Одобрено и отправлено · 2с</span>
    </div>
  </div>
);

const InvitingWidget = () => (
  <div className="mt-5 flex items-center justify-between gap-4">
    <div className="flex -space-x-2.5">
      {["from-blue-500 to-indigo-600", "from-violet-500 to-purple-700", "from-emerald-500 to-teal-600", "from-amber-400 to-orange-500", "from-rose-500 to-pink-600"].map((g, i) => (
        <motion.div key={i} initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.07, type: "spring", stiffness: 260 }} className={`w-9 h-9 rounded-full border-2 border-background bg-gradient-to-br ${g}`} />
      ))}
      <motion.div initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.55, type: "spring", stiffness: 260 }} className="w-9 h-9 rounded-full border-2 border-background bg-emerald-500/20 flex items-center justify-center">
        <span className="text-sm font-black text-emerald-400">+</span>
      </motion.div>
    </div>
    <div className="text-right">
      <motion.p initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.35 }} className="text-3xl font-black text-emerald-400 tabular-nums leading-none">+156</motion.p>
      <p className="text-[11px] text-muted-foreground mt-1">участников сегодня</p>
    </div>
  </div>
);

const StoryTaggerWidget = () => (
  <div className="mt-5 space-y-1.5">
    {[{ user: "@marketing_pro", status: "Отмечен", dot: "bg-rose-400" }, { user: "@crypto_fan95", status: "Отмечен", dot: "bg-rose-400" }, { user: "@smm_guru", status: "Очередь", dot: "bg-amber-400" }].map((r, i) => (
      <motion.div key={i} initial={{ opacity: 0, x: -6 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.1 }} className="flex items-center justify-between rounded-lg bg-muted/20 px-2.5 py-1.5">
        <span className="text-[11px] font-mono text-foreground/70">{r.user}</span>
        <div className="flex items-center gap-1.5">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${r.dot}`} />
          <span className="text-[10px] text-foreground/60">{r.status}</span>
        </div>
      </motion.div>
    ))}
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 }} className="flex items-center gap-2 pt-1">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
      <span className="text-[10px] text-rose-500 font-medium">Отмечено: 234 подписчика сегодня</span>
    </motion.div>
  </div>
);

const ChatWidget = () => (
  <div className="mt-5 space-y-2">
    {[{ side: "right" as const, text: "Привет! Видел ваш пост про крипту 👋", delay: 0.15 }, { side: "left" as const, text: "Да, рынок сейчас очень интересный 📈", delay: 0.28 }, { side: "right" as const, text: "Как начать торговать?", delay: 0.4 }].map((m, i) => (
      <motion.div key={i} initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: m.delay }} className={`flex ${m.side === "right" ? "justify-end" : "justify-start"}`}>
        <div className={`text-[11px] px-2.5 py-1.5 rounded-2xl max-w-[85%] leading-relaxed ${m.side === "right" ? "bg-purple-500/15 text-foreground/80 rounded-br-sm" : "bg-muted/50 text-foreground/65 rounded-bl-sm"}`}>{m.text}</div>
      </motion.div>
    ))}
  </div>
);

const ReactionsWidget = () => (
  <div className="mt-5">
    <div className="flex flex-wrap gap-2 mb-3">
      {[{ emoji: "🔥", count: "1.2K" }, { emoji: "👍", count: "892" }, { emoji: "❤️", count: "634" }, { emoji: "🚀", count: "421" }].map((r, i) => (
        <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.15 + i * 0.08, type: "spring", stiffness: 260 }} className="flex items-center gap-1.5 bg-muted/40 rounded-full px-2.5 py-1">
          <span className="text-sm">{r.emoji}</span>
          <span className="text-[11px] font-bold text-foreground/70">{r.count}</span>
        </motion.div>
      ))}
    </div>
    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
      <Eye size={10} />
      <span>+3 890 просмотров историй сегодня</span>
    </div>
  </div>
);

const AnalyticsWidget = () => {
  const TOTAL_H = 56;
  const data = [40, 65, 45, 80, 55, 90, 70].map(p => Math.round(p * TOTAL_H / 100));
  const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  return (
    <div className="mt-5">
      <div className="flex items-end gap-1 h-14">
        {data.map((h, i) => (
          <motion.div key={i} className="flex-1 bg-cyan-500/60 rounded-sm" initial={{ height: 0 }} whileInView={{ height: h }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: "easeOut" }} />
        ))}
      </div>
      <div className="flex justify-between mt-1.5">
        {days.map(d => (<span key={d} className="flex-1 text-center text-[9px] text-muted-foreground/40 font-mono">{d}</span>))}
      </div>
    </div>
  );
};

const STEPS = [
  { Icon: Search, color: "text-blue-500", bg: "bg-blue-500/8", border: "border-blue-500/20", glow: "bg-blue-500/20", tag: "Парсинг аудитории", title: "Сбор аудитории", desc: "4 типа парсеров: по каналам, группам, сообщениям и ключевикам.", Widget: ParsingWidget },
  { Icon: Flame, color: "text-amber-500", bg: "bg-amber-500/8", border: "border-amber-500/20", glow: "bg-amber-500/20", tag: "Прогрев", title: "Прогрев аккаунтов", desc: "ИИ набирает Trust Score и готовит аккаунты без спамблоков.", Widget: TrustWidget },
  { Icon: MessageSquare, color: "text-violet-500", bg: "bg-violet-500/8", border: "border-violet-500/20", glow: "bg-violet-500/20", tag: "Нейрокомментинг", title: "AI-комментарии", desc: "Нейросеть генерирует контекстные комментарии в целевых каналах.", Widget: CommentWidget },
  { Icon: UserPlus, color: "text-emerald-500", bg: "bg-emerald-500/8", border: "border-emerald-500/20", glow: "bg-emerald-500/20", tag: "Инвайтинг", title: "Инвайтинг и реакции", desc: "Массовый инвайтинг с AI-защитой и контролем лимитов.", Widget: InvitingWidget },
  { Icon: Tag, color: "text-rose-500", bg: "bg-rose-500/8", border: "border-rose-500/20", glow: "bg-rose-500/20", tag: "Стори-теггер", title: "Отметки в историях", desc: "Автоматические отметки целевых подписчиков в ваших историях.", Widget: StoryTaggerWidget },
  { Icon: Bot, color: "text-purple-500", bg: "bg-purple-500/8", border: "border-purple-500/20", glow: "bg-purple-500/20", tag: "Нейрочаттинг ЛС", title: "Диалоги в ЛС", desc: "ИИ ведёт живые диалоги от имени ваших аккаунтов.", Widget: ChatWidget },
  { Icon: Heart, color: "text-pink-500", bg: "bg-pink-500/8", border: "border-pink-500/20", glow: "bg-pink-500/20", tag: "Реакции и истории", title: "Реакции и масслукинг", desc: "Накрутка реакций и массовый просмотр историй.", Widget: ReactionsWidget },
  { Icon: BarChart3, color: "text-cyan-500", bg: "bg-cyan-500/8", border: "border-cyan-500/20", glow: "bg-cyan-500/20", tag: "Аналитика", title: "Аналитика и результат", desc: "Трекинг конверсий и рост подписчиков в реальном времени.", Widget: AnalyticsWidget },
] as const;

interface CardProps { index: number; large?: boolean; delay?: number; }

const Card = ({ index, large = false, delay = 0 }: CardProps) => {
  const s = STEPS[index];
  const Icon = s.Icon;
  const Widget = s.Widget;
  return (
    <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ delay, duration: 0.55, ease: [0.16, 1, 0.3, 1] }} className={`relative rounded-2xl border ${s.border} ${s.bg} overflow-hidden group ${large ? "p-7 sm:p-8" : "p-5 sm:p-6"}`}>
      <div className={`absolute -top-8 -left-8 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${s.glow}`} />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${s.color} opacity-70`}>{s.tag}</span>
          <motion.div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.bg} border ${s.border} shrink-0`} whileHover={{ rotate: 12, scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }}>
            <Icon size={17} className={s.color} />
          </motion.div>
        </div>
        <h3 className={`font-black text-foreground mb-1.5 ${large ? "text-xl sm:text-2xl" : "text-base sm:text-lg"}`}>{s.title}</h3>
        <p className={`text-muted-foreground leading-relaxed ${large ? "text-sm sm:text-base" : "text-sm"}`}>{s.desc}</p>
        <Widget />
      </div>
    </motion.div>
  );
};

const HowItWorksSection = () => {
  const { t } = useLanguage();
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8" id="features">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Инструменты</p>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground">{t("how.title")}</h2>
          <p className="mt-3 text-muted-foreground max-w-lg">8 инструментов автоматизации — от сбора аудитории до аналитики результатов.</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
          <div className="sm:col-span-4"><Card index={0} large delay={0} /></div>
          <div className="sm:col-span-2"><Card index={1} delay={0.08} /></div>
          <div className="sm:col-span-2"><Card index={2} delay={0.12} /></div>
          <div className="sm:col-span-4"><Card index={3} large delay={0.18} /></div>
          <div className="sm:col-span-4"><Card index={4} large delay={0.22} /></div>
          <div className="sm:col-span-2"><Card index={5} delay={0.28} /></div>
          <div className="sm:col-span-3"><Card index={6} delay={0.32} /></div>
          <div className="sm:col-span-3"><Card index={7} delay={0.36} /></div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
