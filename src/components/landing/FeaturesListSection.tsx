import { motion } from "framer-motion";
import { Users, MessageSquare, MessagesSquare, Flame, Search, UserPlus, Eye, FileOutput, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const icons = [Users, MessageSquare, MessagesSquare, Flame, Search, UserPlus, Eye, FileOutput];

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const FeaturesListSection = () => {
  const { t } = useLanguage();
  const features = Array.from({ length: 8 }, (_, i) => ({
    icon: icons[i], num: i + 1,
    title: t(`feat.${i + 1}.title`),
    desc: t(`feat.${i + 1}.desc`),
  }));

  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-black text-foreground">{t("feat.title")}</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">{t("feat.desc")}</p>
        </motion.div>
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <motion.div key={f.num} variants={itemVariants} whileHover={{ y: -6, transition: { duration: 0.2 } }} className="group relative p-5 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer overflow-hidden">
              <motion.div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <motion.div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors" whileHover={{ rotate: 10, scale: 1.1 }} transition={{ type: "spring" }}>
                    <f.icon size={20} className="text-primary" />
                  </motion.div>
                  <span className="text-[10px] font-bold text-muted-foreground/50">0{f.num}</span>
                </div>
                <h3 className="font-bold text-sm text-foreground mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
              <motion.div className="absolute bottom-5 right-5" initial={{ opacity: 0, x: -5 }} whileHover={{ opacity: 1, x: 0 }}>
                <ArrowRight size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesListSection;
