import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ArrowRight, ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ACCENT = [
  { num: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", open: "bg-blue-500/5" },
  { num: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20", open: "bg-violet-500/5" },
  { num: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", open: "bg-emerald-500/5" },
  { num: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", open: "bg-amber-500/5" },
  { num: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", open: "bg-rose-500/5" },
  { num: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20", open: "bg-cyan-500/5" },
];

const FAQSection = () => {
  const { t } = useLanguage();
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const faqs = Array.from({ length: 6 }, (_, i) => ({ q: t(`faq.${i + 1}.q`), a: t(`faq.${i + 1}.a`) }));
  const toggle = (i: number) => setOpenIdx(prev => (prev === i ? null : i));

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground">{t("faq.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("faq.desc")}</p>
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => window.open("https://t.me/vitallautomation", "_blank")} className="shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all text-sm font-medium text-foreground group">
            <MessageCircle size={16} className="text-primary" />
            Задать вопрос в Telegram
            <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </motion.button>
        </motion.div>

        <div className="space-y-2">
          {faqs.map((faq, i) => {
            const a = ACCENT[i];
            const isOpen = openIdx === i;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-20px" }} transition={{ delay: i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }} className={`rounded-2xl border overflow-hidden transition-colors duration-200 ${isOpen ? `${a.border} ${a.open}` : "border-border bg-card hover:border-border/80"}`}>
                <button onClick={() => toggle(i)} className="w-full flex items-center gap-4 px-5 py-4 text-left">
                  <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black ${a.bg} ${a.num}`}>{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1 font-semibold text-foreground text-sm leading-snug">{faq.q}</span>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25, ease: "easeInOut" }} className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${isOpen ? `${a.bg} ${a.num}` : "bg-muted/60 text-muted-foreground"}`}>
                    <ChevronDown size={14} strokeWidth={2.5} />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div key="answer" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} style={{ overflow: "hidden" }}>
                      <div className="px-5 pb-5 pl-16">
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{faq.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
