import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap, Shield, Headphones, Trophy, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const perkIcons = [Zap, Shield, Headphones, Trophy];

const CTASection = () => {
  const { t } = useLanguage();
  const perks = [
    { icon: perkIcons[0], title: t("cta.perk1.title"), desc: t("cta.perk1.desc") },
    { icon: perkIcons[1], title: t("cta.perk2.title"), desc: t("cta.perk2.desc") },
    { icon: perkIcons[2], title: t("cta.perk3.title"), desc: t("cta.perk3.desc") },
    { icon: perkIcons[3], title: t("cta.perk4.title"), desc: t("cta.perk4.desc") },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-indigo-700" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.13),transparent_55%)] pointer-events-none" />
      <div className="absolute -top-24 left-1/3 w-[480px] h-[480px] rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 right-10 w-72 h-72 rounded-full bg-indigo-500/25 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}>
          <span className="inline-flex items-center gap-2 bg-white/15 text-white/80 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6 tracking-wide">
            <Zap size={12} className="fill-white/60" />Автоматизация Telegram-продвижения
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">{t("cta.title")}</h2>
          <p className="mt-4 text-white/65 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">{t("cta.desc")}</p>
          <p className="mt-3 text-xs text-white/35 font-medium tracking-wide">{t("cta.social")}</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-12">
          {perks.map((p, i) => (
            <motion.div key={p.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.09, duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="bg-white/8 border border-white/12 rounded-2xl p-5 text-left backdrop-blur-sm hover:bg-white/12 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-white/12 flex items-center justify-center mb-4"><p.icon size={18} className="text-white/80" /></div>
              <h3 className="font-bold text-white text-sm leading-snug mb-1.5">{p.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div className="mt-10 flex flex-wrap justify-center gap-3" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.35 }}>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Button size="lg" className="rounded-full px-8 bg-white text-primary hover:bg-white/92 font-bold gap-2 h-12 shadow-lg shadow-black/20 text-sm">
              {t("cta.start")}<ArrowRight size={16} />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Button size="lg" variant="outline" className="rounded-full px-8 font-semibold border-white/25 text-white hover:bg-white/10 bg-transparent h-12 text-sm">
              {t("cta.demo")}
            </Button>
          </motion.div>
        </motion.div>

        <motion.div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs text-white/40" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 }}>
          <span>{t("cta.check1")}</span>
          <span className="hidden sm:inline text-white/20">·</span>
          <span>{t("cta.check2")}</span>
          <span className="hidden sm:inline text-white/20">·</span>
          <span>{t("cta.check3")}</span>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
