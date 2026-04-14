import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const VideoSection = () => {
  const { t } = useLanguage();
  return (
    <section className="py-24 bg-muted/30" id="video">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black">{t("video.title")}</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">{t("video.desc")}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative rounded-2xl overflow-hidden shadow-2xl border border-border aspect-video bg-black group cursor-pointer">
          <a href="https://www.youtube.com/watch?v=HeqogrdbFjc&list=PLadXErvaSotSUFyrFdequegWEqiRRlKJA" target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center">
            <img src="https://img.youtube.com/vi/HeqogrdbFjc/maxresdefault.jpg" alt="TeleBoost Video" className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default VideoSection;
