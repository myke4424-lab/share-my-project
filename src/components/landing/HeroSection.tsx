import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Send, Users, Sparkles, CheckCircle2 } from "lucide-react";

const LIVE_FEED = [
  { time: "00:12", action: "Инвайт", target: "@crypto_arb_chat", count: "+47", color: "text-sky-400" },
  { time: "00:09", action: "AI-комментарий", target: "@marketing_pro", count: "1", color: "text-violet-400" },
  { time: "00:06", action: "Прогрев аккаунта", target: "A-2841", count: "день 7/14", color: "text-emerald-400" },
  { time: "00:03", action: "Парсинг", target: "@traffic_chat", count: "1 240", color: "text-amber-400" },
  { time: "00:01", action: "Инвайт", target: "@smm_lab", count: "+62", color: "text-sky-400" },
];

const METRICS = [
  { label: "Аккаунтов в работе", value: "1 284", trend: "+12%" },
  { label: "Действий за час", value: "8 940", trend: "live" },
  { label: "Конверсия в подписку", value: "14.2%", trend: "+3.1%" },
];

const HeroSection = () => {
  return (
    <section className="relative pt-28 pb-20 overflow-hidden bg-background">
      {/* background — subtle telegram-blue ambient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)", backgroundSize: "64px 64px" }} />
        <motion.div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(closest-side, oklch(0.66 0.214 259.1 / 0.18), transparent)" }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* status bar */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-10 flex w-fit items-center gap-3 rounded-full border border-border bg-card/60 backdrop-blur px-4 py-1.5 text-xs"
        >
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-medium text-foreground">Платформа в работе</span>
          </span>
          <span className="h-3 w-px bg-border" />
          <span className="text-muted-foreground tabular-nums">1 284 аккаунта · 8 940 действий/час</span>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* LEFT */}
          <div className="lg:col-span-6">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-[2.75rem] sm:text-6xl lg:text-[4.25rem] font-black leading-[1.02] tracking-[-0.03em] text-foreground"
            >
              Telegram-маркетинг
              <br />
              <span className="relative inline-block">
                <span className="text-gradient">на автопилоте</span>
                <motion.span
                  className="absolute -bottom-2 left-0 h-[3px] w-full rounded-full bg-primary/70"
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.7, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mt-7 text-lg text-muted-foreground max-w-xl leading-relaxed"
            >
              Прогревайте аккаунты, парсите аудиторию, инвайтите и комментируйте через ИИ — <span className="text-foreground font-semibold">в одной панели</span>. Запуск воронки — 10 минут, без ручной работы и спам-блоков.
            </motion.p>

            {/* trust row */}
            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"
            >
              {["Без банов до 95%", "16 инструментов", "Старт за 10 минут"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-primary" />
                  <span>{t}</span>
                </li>
              ))}
            </motion.ul>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <Button size="lg" className="group rounded-full px-7 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 shadow-lg shadow-primary/25">
                Запустить бесплатно
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="ghost" className="rounded-full px-5 h-12 font-semibold gap-2 text-foreground hover:bg-muted">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Play size={12} fill="currentColor" />
                </span>
                Демо за 90 секунд
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-7 flex items-center gap-3 text-xs text-muted-foreground"
            >
              <div className="flex -space-x-2">
                {["АК", "ДВ", "ЕМ", "МЛ", "СР"].map((a, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-background flex items-center justify-center text-[9px] font-bold text-primary">
                    {a}
                  </div>
                ))}
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-foreground font-semibold">200+ команд</span>
                <span>уже автоматизировали Telegram</span>
              </div>
            </motion.div>
          </div>

          {/* RIGHT — live ops console */}
          <div className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {/* glow */}
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent blur-2xl" />

              <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/10 overflow-hidden">
                {/* console header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
                    </div>
                    <span className="ml-2 text-xs font-semibold text-foreground tracking-wide">teleboost · live ops</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">UTC 14:32:08</span>
                </div>

                {/* metrics */}
                <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
                  {METRICS.map((m, i) => (
                    <motion.div
                      key={m.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="px-4 py-4"
                    >
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{m.label}</p>
                      <p className="mt-1 text-xl font-black tabular-nums text-foreground">{m.value}</p>
                      <p className="text-[10px] font-semibold text-emerald-500 mt-0.5">{m.trend}</p>
                    </motion.div>
                  ))}
                </div>

                {/* live feed */}
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                      <Sparkles size={11} className="text-primary" />
                      Поток событий
                    </p>
                    <span className="text-[10px] text-muted-foreground">за последнюю минуту</span>
                  </div>
                  <div className="space-y-1.5">
                    {LIVE_FEED.map((e, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + i * 0.08, duration: 0.4 }}
                        className="flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-muted/50 transition-colors text-xs"
                      >
                        <span className="font-mono text-[10px] text-muted-foreground tabular-nums w-9">{e.time}</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${e.color.replace("text-", "bg-")} shrink-0`} />
                        <span className={`font-semibold ${e.color} w-32 shrink-0`}>{e.action}</span>
                        <span className="font-mono text-[11px] text-foreground/80 truncate flex-1">{e.target}</span>
                        <span className="font-bold text-foreground tabular-nums text-[11px]">{e.count}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* footer cta inside console */}
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary">
                      <Send size={12} />
                    </span>
                    <span className="text-foreground font-semibold">Следующая кампания</span>
                    <span className="text-muted-foreground">через 03:42</span>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider">
                    <Users size={10} /> авто
                  </span>
                </div>
              </div>

              {/* floating badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1, type: "spring", stiffness: 200 }}
                className="absolute -bottom-4 -left-4 hidden sm:flex items-center gap-2 rounded-full bg-background border border-border shadow-xl px-3.5 py-2"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                </div>
                <div className="leading-tight">
                  <p className="text-[10px] text-muted-foreground">Защита от блока</p>
                  <p className="text-xs font-bold text-foreground">95% выживаемость</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
