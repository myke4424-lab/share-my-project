import { motion } from "framer-motion";
import { Search, Flame, MessageSquare, UserPlus, Tag, Bot, Heart, BarChart3, Eye, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/* ============================================================
   WIDGETS — мини-визуализации для каждого инструмента
   ============================================================ */

const ParsingWidget = () => (
  <div className="mt-4 rounded-lg border border-[oklch(0.65_0.18_240)]/20 bg-[oklch(0.12_0.02_240)]/40 p-3 font-mono">
    <div className="flex items-center justify-between text-[10px] mb-2">
      <span className="text-[oklch(0.75_0.15_240)] tracking-wider">$ parse --target=channels</span>
      <span className="text-foreground/50">847 / 2000</span>
    </div>
    <div className="h-[3px] rounded-full bg-[oklch(0.65_0.18_240)]/15 overflow-hidden mb-2.5">
      <motion.div className="h-full bg-[oklch(0.65_0.18_240)]" initial={{ width: "0%" }} whileInView={{ width: "42%" }} viewport={{ once: true }} transition={{ duration: 1.4, delay: 0.2, ease: "easeOut" }} />
    </div>
    <div className="space-y-1">
      {[{ phone: "+7 916 ···47", tag: "TARGET", c: "text-[oklch(0.75_0.15_240)]" }, { phone: "+7 903 ···12", tag: "ACTIVE", c: "text-emerald-400" }, { phone: "+7 985 ···83", tag: "TARGET", c: "text-[oklch(0.75_0.15_240)]" }].map((row, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 + i * 0.1 }} className="flex items-center justify-between text-[10px]">
          <span className="text-foreground/55">› {row.phone}</span>
          <span className={`${row.c} font-bold tracking-widest`}>[{row.tag}]</span>
        </motion.div>
      ))}
    </div>
  </div>
);

const TrustWidget = () => (
  <div className="mt-4 space-y-2.5 font-mono">
    {[{ acc: "acc_01", score: 78 }, { acc: "acc_02", score: 84 }, { acc: "acc_03", score: 91 }].map((a, i) => (
      <div key={i}>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-foreground/50">@{a.acc}</span>
          <span className="text-[oklch(0.75_0.15_240)] font-bold tabular-nums">trust: {a.score}%</span>
        </div>
        <div className="h-[3px] rounded-full bg-[oklch(0.65_0.18_240)]/10 overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-[oklch(0.65_0.18_240)] to-[oklch(0.78_0.16_220)] rounded-full" initial={{ width: "0%" }} whileInView={{ width: `${a.score}%` }} viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.2 + i * 0.15 }} />
        </div>
      </div>
    ))}
  </div>
);

const CommentWidget = () => (
  <div className="mt-4 rounded-lg border border-[oklch(0.65_0.18_240)]/20 bg-[oklch(0.12_0.02_240)]/40 p-3">
    <div className="text-[9px] text-[oklch(0.75_0.15_240)]/70 font-mono tracking-wider mb-2">→ ai_reply @crypto_signal</div>
    <p className="text-[11px] text-foreground/75 leading-relaxed">«Отличный анализ! Именно то, о чём думал в последнее время 🔥»</p>
    <div className="mt-2.5 flex items-center gap-1.5 font-mono">
      <span className="inline-block w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
      <span className="text-[9px] text-emerald-400 tracking-wider">SENT · 2.3s · approved</span>
    </div>
  </div>
);

const InvitingWidget = () => (
  <div className="mt-4 flex items-center justify-between gap-4">
    <div className="flex -space-x-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div key={i} initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.07, type: "spring", stiffness: 260 }} className="w-8 h-8 rounded-full border-2 border-background bg-gradient-to-br from-[oklch(0.65_0.18_240)] to-[oklch(0.5_0.2_260)]" />
      ))}
      <motion.div initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.55, type: "spring", stiffness: 260 }} className="w-8 h-8 rounded-full border-2 border-background bg-emerald-500/20 flex items-center justify-center">
        <span className="text-xs font-black text-emerald-400">+</span>
      </motion.div>
    </div>
    <div className="text-right font-mono">
      <motion.p initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.35 }} className="text-2xl font-black text-emerald-400 tabular-nums leading-none">+156</motion.p>
      <p className="text-[9px] text-foreground/50 mt-1 tracking-wider uppercase">members / 24h</p>
    </div>
  </div>
);

const StoryTaggerWidget = () => (
  <div className="mt-4 space-y-1 font-mono">
    {[{ user: "marketing_pro", st: "TAGGED", c: "text-[oklch(0.75_0.15_240)]" }, { user: "crypto_fan95", st: "TAGGED", c: "text-[oklch(0.75_0.15_240)]" }, { user: "smm_guru", st: "QUEUE", c: "text-amber-400" }].map((r, i) => (
      <motion.div key={i} initial={{ opacity: 0, x: -6 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.1 }} className="flex items-center justify-between rounded bg-[oklch(0.12_0.02_240)]/40 px-2.5 py-1.5 text-[10px]">
        <span className="text-foreground/65">@{r.user}</span>
        <span className={`${r.c} font-bold tracking-widest`}>[{r.st}]</span>
      </motion.div>
    ))}
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 }} className="flex items-center gap-2 pt-1 text-[10px]">
      <span className="inline-block w-1 h-1 rounded-full bg-[oklch(0.65_0.18_240)] animate-pulse" />
      <span className="text-[oklch(0.75_0.15_240)] tracking-wider">234 tagged today</span>
    </motion.div>
  </div>
);

const ChatWidget = () => (
  <div className="mt-4 space-y-1.5">
    {[{ side: "right" as const, text: "Видел ваш пост про крипту 👋", delay: 0.15 }, { side: "left" as const, text: "Да, рынок сейчас интересный 📈", delay: 0.28 }, { side: "right" as const, text: "Как начать торговать?", delay: 0.4 }].map((m, i) => (
      <motion.div key={i} initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: m.delay }} className={`flex ${m.side === "right" ? "justify-end" : "justify-start"}`}>
        <div className={`text-[11px] px-2.5 py-1.5 rounded-2xl max-w-[85%] leading-snug ${m.side === "right" ? "bg-[oklch(0.65_0.18_240)]/20 text-foreground/85 rounded-br-sm" : "bg-foreground/8 text-foreground/70 rounded-bl-sm"}`}>{m.text}</div>
      </motion.div>
    ))}
  </div>
);

const ReactionsWidget = () => (
  <div className="mt-4">
    <div className="flex flex-wrap gap-1.5 mb-3">
      {[{ e: "🔥", c: "1.2K" }, { e: "👍", c: "892" }, { e: "❤️", c: "634" }, { e: "🚀", c: "421" }].map((r, i) => (
        <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.15 + i * 0.08, type: "spring", stiffness: 260 }} className="flex items-center gap-1.5 bg-[oklch(0.12_0.02_240)]/50 border border-[oklch(0.65_0.18_240)]/15 rounded-full px-2.5 py-1">
          <span className="text-xs">{r.e}</span>
          <span className="text-[10px] font-bold text-foreground/75 font-mono tabular-nums">{r.c}</span>
        </motion.div>
      ))}
    </div>
    <div className="flex items-center gap-1.5 text-[10px] text-foreground/50 font-mono">
      <Eye size={10} />
      <span className="tracking-wider">+3 890 story_views / 24h</span>
    </div>
  </div>
);

const AnalyticsWidget = () => {
  const TOTAL_H = 52;
  const data = [40, 65, 45, 80, 55, 90, 70].map(p => Math.round(p * TOTAL_H / 100));
  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  return (
    <div className="mt-4 font-mono">
      <div className="flex items-end gap-1 h-13" style={{ height: TOTAL_H + 4 }}>
        {data.map((h, i) => (
          <motion.div key={i} className="flex-1 bg-gradient-to-t from-[oklch(0.65_0.18_240)] to-[oklch(0.78_0.16_220)] rounded-sm" initial={{ height: 0 }} whileInView={{ height: h }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: "easeOut" }} />
        ))}
      </div>
      <div className="flex justify-between mt-1.5">
        {days.map(d => (<span key={d} className="flex-1 text-center text-[8px] text-foreground/35 tracking-wider">{d}</span>))}
      </div>
    </div>
  );
};

/* ============================================================
   STEPS DATA
   ============================================================ */

const STEPS = [
  { Icon: Search, id: "01", tag: "parser.module", title: "Сбор аудитории", desc: "4 типа парсеров: каналы, группы, сообщения, ключевики. До 50K контактов в час.", Widget: ParsingWidget },
  { Icon: Flame, id: "02", tag: "warmup.engine", title: "Прогрев аккаунтов", desc: "ИИ набирает Trust Score 90%+ и обходит спам-фильтры Telegram.", Widget: TrustWidget },
  { Icon: MessageSquare, id: "03", tag: "neuro.comments", title: "AI-комментарии", desc: "GPT-4 пишет контекстные комментарии в целевых каналах от ваших аккаунтов.", Widget: CommentWidget },
  { Icon: UserPlus, id: "04", tag: "invite.bot", title: "Инвайтинг + защита", desc: "Массовый инвайт с AI-контролем лимитов. До 200 приглашений/день/аккаунт.", Widget: InvitingWidget },
  { Icon: Tag, id: "05", tag: "story.tagger", title: "Отметки в историях", desc: "Автоматические отметки целевой аудитории в ваших историях. CTR до 18%.", Widget: StoryTaggerWidget },
  { Icon: Bot, id: "06", tag: "neuro.chatting", title: "Диалоги в ЛС", desc: "ИИ ведёт живые диалоги, квалифицирует лидов и передаёт менеджеру.", Widget: ChatWidget },
  { Icon: Heart, id: "07", tag: "reactions.boost", title: "Реакции и масслукинг", desc: "Накрутка реакций и массовый просмотр историй для роста охватов.", Widget: ReactionsWidget },
  { Icon: BarChart3, id: "08", tag: "analytics.live", title: "Аналитика в реальном времени", desc: "Трекинг конверсий, ROI по каналам, рост подписчиков. Экспорт в CSV.", Widget: AnalyticsWidget },
] as const;

/* ============================================================
   CARD
   ============================================================ */

interface CardProps { index: number; large?: boolean; delay?: number; }

const Card = ({ index, large = false, delay = 0 }: CardProps) => {
  const s = STEPS[index];
  const Icon = s.Icon;
  const Widget = s.Widget;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className={`relative rounded-2xl border border-[oklch(0.65_0.18_240)]/15 bg-gradient-to-br from-[oklch(0.14_0.02_240)]/60 to-[oklch(0.10_0.015_240)]/40 backdrop-blur-sm overflow-hidden group hover:border-[oklch(0.65_0.18_240)]/35 transition-colors duration-300 ${large ? "p-6 sm:p-7" : "p-5"}`}
    >
      {/* Ambient glow */}
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 bg-[oklch(0.65_0.18_240)]/30" />

      {/* Top bar: id + tag + icon */}
      <div className="relative z-10 flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 font-mono">
          <span className="text-[10px] font-bold text-[oklch(0.75_0.15_240)] tabular-nums">{s.id}</span>
          <span className="text-[10px] text-foreground/40 tracking-wider">// {s.tag}</span>
        </div>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[oklch(0.65_0.18_240)]/10 border border-[oklch(0.65_0.18_240)]/20 shrink-0 group-hover:bg-[oklch(0.65_0.18_240)]/20 transition-colors">
          <Icon size={15} className="text-[oklch(0.75_0.15_240)]" />
        </div>
      </div>

      {/* Title + desc */}
      <div className="relative z-10 flex flex-col h-full">
        <h3 className={`font-black text-foreground mb-1.5 leading-tight ${large ? "text-xl sm:text-2xl" : "text-base sm:text-lg"}`}>
          {s.title}
        </h3>
        <p className={`text-foreground/55 leading-relaxed ${large ? "text-sm" : "text-[13px]"}`}>{s.desc}</p>
        <Widget />
      </div>

      {/* corner indicator */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowUpRight size={12} className="text-[oklch(0.75_0.15_240)]" />
      </div>
    </motion.div>
  );
};

/* ============================================================
   SECTION
   ============================================================ */

const HowItWorksSection = () => {
  const { t } = useLanguage();
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden" id="features">
      {/* Background ambient */}
      <div className="absolute inset-0 -z-10 opacity-40" style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, oklch(0.65 0.18 240 / 0.08), transparent 70%)" }} />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-14">
          <div className="flex items-center gap-2 mb-4 font-mono">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[oklch(0.65_0.18_240)] animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-[oklch(0.75_0.15_240)] uppercase">teleboost.modules</span>
            <span className="text-[10px] text-foreground/40">/ 8_active</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-foreground leading-[1.05] tracking-tight">
            Полный цикл роста.<br />
            <span className="text-foreground/40">Один интерфейс.</span>
          </h2>
          <p className="mt-4 text-foreground/55 max-w-xl text-base leading-relaxed">
            8 модулей автоматизации работают как единая система: от парсинга холодной аудитории до квалификации горячих лидов в ЛС.
          </p>
        </motion.div>

        {/* Bento grid */}
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

        {/* Footer line */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[10px] text-foreground/40 tracking-wider">
          <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> all_modules_operational</span>
          <span>·</span>
          <span>uptime_99.97%</span>
          <span>·</span>
          <span>avg_response: 0.4s</span>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
