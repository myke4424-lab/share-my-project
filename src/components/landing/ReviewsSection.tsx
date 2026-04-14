import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const ReviewsSection = () => {
  const { t } = useLanguage();
  const reviews = [
    { name: t("review.1.name"), role: t("review.1.role"), text: t("review.1.text"), avatar: "АК", stars: 5 },
    { name: t("review.2.name"), role: t("review.2.role"), text: t("review.2.text"), avatar: "ДВ", stars: 5 },
    { name: t("review.3.name"), role: t("review.3.role"), text: t("review.3.text"), avatar: "ЕМ", stars: 5 },
    { name: t("review.4.name"), role: t("review.4.role"), text: t("review.4.text"), avatar: "МЛ", stars: 5 },
    { name: t("review.5.name"), role: t("review.5.role"), text: t("review.5.text"), avatar: "АС", stars: 5 },
    { name: t("review.6.name"), role: t("review.6.role"), text: t("review.6.text"), avatar: "ИР", stars: 5 },
  ];

  return (
    <section id="reviews" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">{t("reviews.title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t("reviews.desc")}</p>
        </motion.div>
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((review, i) => (
            <motion.div key={i} variants={cardVariants} whileHover={{ y: -5, transition: { duration: 0.2 } }} className="relative bg-card rounded-2xl border border-border p-6 flex flex-col gap-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all">
              <Quote size={24} className="text-primary/15 absolute top-4 right-4" />
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} size={14} className={j < review.stars ? "fill-primary text-primary" : "text-muted-foreground/20"} />
                ))}
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed flex-1">"{review.text}"</p>
              <div className="flex items-center gap-3 pt-3 border-t border-border">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">{review.avatar}</div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{review.name}</p>
                  <p className="text-xs text-muted-foreground">{review.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ReviewsSection;
