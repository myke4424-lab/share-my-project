import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Link2, Users, DollarSign, Copy, Share2, MousePointerClick, UserPlus,
  CreditCard, TrendingUp, Check, X, ArrowRight, Sparkles, Zap,
  Trophy, Medal, Crown, Star, FileText, Image, MessageSquare,
  Clock, CheckCircle2, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }
  })
};

function useAnimatedCounter(target: number, duration = 1500, startOnView = true) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(!startOnView);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!startOnView) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setStarted(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [startOnView]);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return { count, ref };
}

const TIERS = [
  { name: "Bronze", min: 0,  max: 4,        pct: 20, icon: Medal, color: "#CD7F32" },
  { name: "Silver", min: 5,  max: 19,       pct: 25, icon: Star,  color: "#9CA3AF" },
  { name: "Gold",   min: 20, max: Infinity, pct: 30, icon: Crown, color: "#F59E0B" },
];

const LEADERBOARD = [
  { rank: 1, name: "alex***@gmail.com", earned: "$12,450", refs: 87 },
  { rank: 2, name: "crypto_m***",       earned: "$9,320",  refs: 64 },
  { rank: 3, name: "tg_mark***",        earned: "$7,100",  refs: 51 },
  { rank: 4, name: "boost_pr***",       earned: "$5,840",  refs: 42 },
  { rank: 5, name: "digital_***",       earned: "$4,200",  refs: 35 },
];

const PROMO_TEMPLATES = [
  {
    icon: MessageSquare, title: "Пост для канала",
    text: "🚀 Нашёл мощный инструмент для автоматизации Telegram — TeleBoost AI. Парсинг, AI-комменты, прогрев аккаунтов. Попробуй бесплатно: [твоя ссылка]",
  },
  {
    icon: FileText, title: "Текст для ЛС",
    text: "Привет! Пользуюсь TeleBoost для продвижения в TG — реально экономит время. Если интересно, вот ссылка со скидкой: [твоя ссылка]",
  },
  {
    icon: Image, title: "Текст для Stories",
    text: "⚡ Автоматизирую Telegram с TeleBoost AI. Парсинг аудитории + AI-комменты = рост без рутины. Ссылка в описании 👇",
  },
];

const cyan   = "#00E5FF";
const purple = "#A855F7";

const ReferralPage = () => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [copiedPromo, setCopiedPromo] = useState<number | null>(null);
  const [calcRefs, setCalcRefs] = useState([15]);
  const [loading, setLoading] = useState(true);
  const [refData, setRefData] = useState<{
    referral_code: string;
    referral_link: string;
    total_refs: number;
    total_clicks: number;
    total_payments: number;
    total_earnings: number;
    tier: string;
    tier_pct: number;
  } | null>(null);
  const [earnings, setEarnings] = useState<Array<{
    amount: number;
    description: string;
    status: string;
    created_at: string;
  }>>([]);

  useEffect(() => {
    fetch("/api/referral", { credentials: "include" })
      .then(r => r.json())
      .then(data => { setRefData(data); setLoading(false); })
      .catch(() => setLoading(false));
    fetch("/api/referral/earnings", { credentials: "include" })
      .then(r => r.json())
      .then(data => setEarnings(data.earnings || []))
      .catch(() => {});
  }, []);

  const referralLink = refData?.referral_link || "https://teleboost.io/ref/...";

  const avgSpend = 80;
  const tier = TIERS.find(t => calcRefs[0] >= t.min && calcRefs[0] <= t.max) || TIERS[0];
  const currentTier = TIERS.find(t => t.name === refData?.tier) || TIERS[0];
  const monthlyEarnings = calcRefs[0] * avgSpend * (tier.pct / 100);
  const yearlyEarnings = monthlyEarnings * 12;

  const clicksCounter = useAnimatedCounter(refData?.total_clicks ?? 0);
  const regsCounter   = useAnimatedCounter(refData?.total_refs ?? 0);
  const paysCounter   = useAnimatedCounter(refData?.total_payments ?? 0);
  const earnCounter   = useAnimatedCounter(Math.round(refData?.total_earnings ?? 0));

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Ссылка скопирована!", description: "Поделитесь ей с друзьями" });
    setTimeout(() => setCopied(false), 2000);
  };

  const copyPromo = (idx: number, text: string) => {
    navigator.clipboard.writeText(text.replace("[твоя ссылка]", referralLink));
    setCopiedPromo(idx);
    toast({ title: "Текст скопирован!" });
    setTimeout(() => setCopiedPromo(null), 2000);
  };

  const shareLink = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("Попробуй TeleBoost — автоматизация Telegram нового уровня 🚀")}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.06] pointer-events-none"
          style={{ background: `radial-gradient(circle, ${cyan}, transparent 70%)` }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.04] pointer-events-none"
          style={{ background: `radial-gradient(circle, ${purple}, transparent 70%)` }} />

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-8 border border-primary/20 bg-primary/8 text-primary"
          >
            <Sparkles size={13} />
            Реферальная программа
          </motion.div>

          <motion.h1
            variants={fadeUp} initial="hidden" animate="visible" custom={0}
            className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-foreground"
          >
            Зарабатывай на Telegram-трафике
            <br />
            <span style={{ color: cyan }}>без продаж</span>
          </motion.h1>

          <motion.p
            variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="mt-5 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed text-muted-foreground"
          >
            Приглашай пользователей в TeleBoost и получай % с каждой оплаты.
            <br className="hidden sm:block" />
            Система конвертит за тебя.
          </motion.p>

          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={2}
            className="mt-10 flex flex-wrap justify-center gap-4"
          >
            <Button
              size="lg"
              className="rounded-full px-8 h-12 text-sm font-semibold gap-2 border-0 text-background"
              style={{ background: `linear-gradient(135deg, ${cyan}, #00B8D4)` }}
              onClick={copyLink}
            >
              <Link2 size={16} />
              Получить реферальную ссылку
            </Button>
            <Button
              size="lg" variant="outline"
              className="rounded-full px-8 h-12 text-sm font-semibold"
            >
              Начать зарабатывать
              <ArrowRight size={16} />
            </Button>
          </motion.div>

          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-14 max-w-3xl mx-auto"
          >
            <div className="rounded-2xl p-6 border border-border bg-card">
              <div className="flex items-end gap-1.5 justify-center h-32">
                {[20, 35, 28, 45, 40, 55, 50, 65, 58, 75, 70, 85, 80, 95, 92, 100].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 0.6 + i * 0.05, duration: 0.5, ease: "easeOut" }}
                    className="w-3 sm:w-4 rounded-t-sm"
                    style={{ background: `linear-gradient(to top, rgba(0,229,255,${0.3 + (h / 100) * 0.7}), rgba(168,85,247,${0.1 + (h / 100) * 0.3}))` }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-4 text-[11px] text-muted-foreground/50">
                <span>Янв</span><span>Фев</span><span>Мар</span><span>Апр</span>
                <span>Май</span><span>Июн</span><span>Июл</span><span>Авг</span>
              </div>
              <div className="text-center mt-4">
                <span className="text-2xl font-bold" style={{ color: cyan }}>${(refData?.total_earnings ?? 0).toLocaleString()}</span>
                <span className="text-xs ml-2 text-muted-foreground">ваш заработок</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Как это работает</h2>
            <p className="mt-3 text-sm text-muted-foreground">3 шага до заработка</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Link2,       title: "Получи ссылку", desc: "Скопируй персональную реферальную ссылку из панели",      num: "01" },
              { icon: Users,       title: "Поделись",      desc: "Отправь в Telegram, Stories, личные сообщения",           num: "02" },
              { icon: DollarSign,  title: "Зарабатывай",   desc: "Получай комиссию с каждого платежа приглашённого",        num: "03" },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i + 1}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="relative rounded-xl p-6 border border-border bg-card group cursor-default"
              >
                <span className="absolute top-4 right-4 text-4xl font-black text-foreground/[0.03] select-none">{step.num}</span>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 bg-primary/10">
                  <step.icon size={18} style={{ color: cyan }} />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiered Commissions */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Уровни комиссии</h2>
            <p className="mt-3 text-sm text-muted-foreground">Чем больше рефералов — тем выше процент</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {TIERS.map((t, i) => (
              <motion.div
                key={t.name}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={cn(
                  "rounded-2xl p-6 border text-center relative overflow-hidden bg-card",
                  t.name === currentTier.name ? "border-primary/40" : "border-border"
                )}
              >
                {t.name === "Gold" && (
                  <div className="absolute inset-0 opacity-[0.04]"
                    style={{ background: `radial-gradient(circle, ${t.color}, transparent 70%)` }} />
                )}
                <div className="relative">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: `${t.color}18` }}>
                    <t.icon size={24} style={{ color: t.color }} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{t.name}</h3>
                  <div className="text-3xl font-black mb-2" style={{ color: t.color }}>{t.pct}%</div>
                  <p className="text-xs text-muted-foreground">
                    {t.max === Infinity ? `${t.min}+ рефералов` : `${t.min}–${t.max} рефералов`}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings Calculator */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Калькулятор заработка</h2>
            <p className="mt-3 text-sm text-muted-foreground">Посмотри, сколько ты можешь зарабатывать</p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={1}
            className="max-w-2xl mx-auto rounded-2xl p-8 border border-border bg-card"
          >
            <div className="mb-8">
              <div className="flex justify-between mb-3">
                <span className="text-sm text-muted-foreground">Количество рефералов</span>
                <span className="text-sm font-bold" style={{ color: cyan }}>{calcRefs[0]}</span>
              </div>
              <Slider
                value={calcRefs}
                onValueChange={setCalcRefs}
                max={100} min={1} step={1}
              />
              <div className="flex justify-between mt-2 text-[11px] text-muted-foreground/40">
                <span>1</span><span>25</span><span>50</span><span>75</span><span>100</span>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6 p-3 rounded-xl"
              style={{ background: `${tier.color}12` }}>
              <tier.icon size={18} style={{ color: tier.color }} />
              <span className="text-sm font-medium" style={{ color: tier.color }}>
                Уровень: {tier.name} — {tier.pct}% комиссия
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl p-5 text-center border border-border bg-background">
                <div className="text-xs mb-2 text-muted-foreground">В месяц</div>
                <div className="text-2xl font-black" style={{ color: cyan }}>${monthlyEarnings.toLocaleString()}</div>
              </div>
              <div className="rounded-xl p-5 text-center border border-border bg-background">
                <div className="text-xs mb-2 text-muted-foreground">В год</div>
                <div className="text-2xl font-black" style={{ color: purple }}>${yearlyEarnings.toLocaleString()}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why it's easy */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
            className="rounded-2xl p-8 sm:p-12 border border-border bg-card text-center"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">
              Тебе <span style={{ color: cyan }}>не нужно</span>
            </h2>
            <div className="grid sm:grid-cols-3 gap-6 mb-8">
              {["Продавать", "Проводить созвоны", "Объяснять продукт"].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp} custom={i + 1}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  className="flex items-center justify-center gap-3 rounded-xl p-4 border border-border bg-muted/30"
                >
                  <X size={16} className="text-red-400/60" />
                  <span className="text-sm line-through text-muted-foreground">{item}</span>
                </motion.div>
              ))}
            </div>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-primary/10 text-primary">
              <Zap size={14} />
              Система конвертит пользователей автоматически
            </div>
          </motion.div>
        </div>
      </section>

      {/* Referral link block */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground">Твоя реферальная ссылка</h2>
            <p className="mt-3 text-sm text-muted-foreground">Скопируй и начни зарабатывать прямо сейчас</p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={1}
            className="max-w-2xl mx-auto rounded-2xl p-6 border border-primary/20 bg-card"
          >
            <div className="flex gap-3">
              <Input
                value={referralLink}
                readOnly
                className="flex-1 h-12 rounded-xl text-sm font-mono bg-muted/40"
              />
              <Button
                onClick={copyLink}
                className="h-12 px-5 rounded-xl gap-2 text-sm font-semibold border-0"
                style={{ background: copied ? "rgba(0,229,255,0.2)" : "rgba(0,229,255,0.12)", color: cyan }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Скопировано" : "Копировать"}
              </Button>
              <Button
                onClick={shareLink}
                className="h-12 px-5 rounded-xl gap-2 text-sm font-semibold border-0"
                style={{ background: "rgba(168,85,247,0.12)", color: purple }}
              >
                <Share2 size={16} />
                Telegram
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground">Твоя статистика</h2>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: MousePointerClick, label: "Клики",       counter: clicksCounter, prefix: "",  color: cyan   },
              { icon: UserPlus,          label: "Регистрации", counter: regsCounter,   prefix: "",  color: purple },
              { icon: CreditCard,        label: "Оплаты",      counter: paysCounter,   prefix: "",  color: cyan   },
              { icon: TrendingUp,        label: "Заработок",   counter: earnCounter,   prefix: "$", color: purple },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="rounded-xl p-5 border border-border bg-card text-center"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3"
                  style={{ background: `${stat.color}15` }}>
                  <stat.icon size={18} style={{ color: stat.color }} />
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">
                  <span ref={stat.counter.ref}>{stat.prefix}{stat.counter.count.toLocaleString()}</span>
                </div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground flex items-center justify-center gap-3">
              <Trophy size={28} className="text-amber-400" />
              Топ партнёров
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">Лучшие партнёры этого месяца</p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={1}
            className="max-w-2xl mx-auto rounded-2xl border border-border bg-card overflow-hidden"
          >
            <div className="grid grid-cols-[48px_1fr_100px_80px] gap-2 px-5 py-3 text-xs font-medium text-muted-foreground border-b border-border">
              <span>#</span><span>Партнёр</span><span className="text-right">Заработок</span><span className="text-right">Рефералы</span>
            </div>
            {LEADERBOARD.map((row, i) => {
              const rankColors = ["#F59E0B", "#9CA3AF", "#CD7F32"];
              return (
                <motion.div
                  key={row.rank}
                  initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className={cn(
                    "grid grid-cols-[48px_1fr_100px_80px] gap-2 px-5 py-3.5 items-center",
                    i < LEADERBOARD.length - 1 && "border-b border-border/50"
                  )}
                >
                  <span className="text-sm font-bold" style={{ color: rankColors[i] || undefined }}>
                    {!rankColors[i] ? <span className="text-muted-foreground">{row.rank}</span> : row.rank}
                  </span>
                  <span className="text-sm font-mono text-foreground/60">{row.name}</span>
                  <span className="text-sm font-semibold text-right" style={{ color: cyan }}>{row.earned}</span>
                  <span className="text-sm text-right text-muted-foreground">{row.refs}</span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Promo Materials */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Промо-материалы</h2>
            <p className="mt-3 text-sm text-muted-foreground">Готовые тексты — копируй и отправляй</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PROMO_TEMPLATES.map((promo, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className="rounded-xl p-5 border border-border bg-card flex flex-col"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
                    <promo.icon size={15} style={{ color: cyan }} />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{promo.title}</span>
                </div>
                <p className="text-xs leading-relaxed flex-1 mb-4 text-muted-foreground">{promo.text}</p>
                <Button
                  onClick={() => copyPromo(i, promo.text)}
                  className="w-full h-9 rounded-lg gap-2 text-xs font-semibold border-0"
                  style={{
                    background: copiedPromo === i ? "rgba(0,229,255,0.2)" : "rgba(0,229,255,0.1)",
                    color: cyan
                  }}
                >
                  {copiedPromo === i ? <Check size={13} /> : <Copy size={13} />}
                  {copiedPromo === i ? "Скопировано!" : "Копировать текст"}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Payout History */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">История выплат</h2>
            <p className="mt-3 text-sm text-muted-foreground">Прозрачная система выплат каждую неделю</p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={1}
            className="max-w-2xl mx-auto rounded-2xl border border-border bg-card overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-2 px-5 py-3 text-xs font-medium text-muted-foreground border-b border-border">
              <span className="flex items-center gap-1.5"><Clock size={12} /> Дата</span>
              <span className="text-right">Сумма</span>
              <span className="text-right">Статус</span>
            </div>
            {earnings.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                Начислений пока нет — пригласи первого пользователя
              </div>
            )}
            {earnings.map((payout, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className={cn(
                  "grid grid-cols-3 gap-2 px-5 py-3.5 items-center",
                  i < earnings.length - 1 && "border-b border-border/40"
                )}
              >
                <span className="text-sm text-foreground/60">
                  {new Date(payout.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <span className="text-sm font-semibold text-right" style={{ color: cyan }}>${payout.amount.toFixed(2)}</span>
                <div className="flex items-center justify-end gap-1.5">
                  {payout.status === "paid" ? (
                    <><CheckCircle2 size={13} className="text-emerald-400" /><span className="text-xs text-emerald-400">Выплачено</span></>
                  ) : (
                    <><AlertCircle size={13} className="text-amber-400" /><span className="text-xs text-amber-400">В обработке</span></>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FOMO */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
            className="rounded-2xl p-10 sm:p-14 text-center border border-purple-500/20 bg-purple-500/5 relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{ background: `radial-gradient(circle at 50% 50%, ${purple}, transparent 70%)` }} />
            <div className="relative">
              <p className="text-xl sm:text-2xl font-semibold text-foreground leading-relaxed">
                Пока ты просто используешь систему —
                <br />
                <span style={{ color: purple }}>другие зарабатывают на ней</span>
              </p>
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground/50">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: purple }} />
                127 партнёров уже получают выплаты
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 pb-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Начни зарабатывать <span style={{ color: cyan }}>сегодня</span>
            </h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Создай реферальную ссылку и получай пассивный доход
            </p>
            <motion.div className="mt-8" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="lg"
                className="rounded-full px-10 h-12 text-sm font-semibold gap-2 border-0 text-white"
                style={{ background: `linear-gradient(135deg, ${cyan}, ${purple})` }}
                onClick={copyLink}
              >
                Получить доступ
                <ArrowRight size={16} />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ReferralPage;
