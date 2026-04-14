import { motion, useInView, animate } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRef, useEffect, useState } from "react";

const AnimatedNumber = ({ value }: { value: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!isInView) return;
    const numeric = parseInt(value.replace(/[^0-9]/g, ""));
    const suffix = value.replace(/[0-9]/g, "");
    if (isNaN(numeric)) { setDisplay(value); return; }
    const controls = animate(0, numeric, {
      duration: 1.6, ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v) + suffix),
    });
    return controls.stop;
  }, [isInView, value]);

  return <span ref={ref}>{display}</span>;
};

const StatsSection = () => {
  const { t } = useLanguage();
  const stats = [
    { value: t("stats.s1.val"), label: t("stats.s1.label"), accent: "text-primary" },
    { value: t("stats.s2.val"), label: t("stats.s2.label"), accent: "text-emerald-500" },
    { value: t("stats.s3.val"), label: t("stats.s3.label"), accent: "text-amber-500" },
    { value: t("stats.s4.val"), label: t("stats.s4.label"), accent: "text-violet-500" },
  ];

  return (
    <section className="py-6">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-5xl mx-auto px-4">
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border/50">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }} className="flex flex-col items-center justify-center py-8 px-6 gap-1 group hover:bg-muted/30 transition-colors">
                <span className={`text-3xl sm:text-4xl font-black tracking-tight ${s.accent}`}>
                  <AnimatedNumber value={s.value} />
                </span>
                <span className="text-xs text-muted-foreground text-center leading-snug mt-0.5">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default StatsSection;
