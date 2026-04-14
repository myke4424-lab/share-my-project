import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer className="py-8 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src="/logo.png" className="w-6 h-6 object-contain" alt="TeleBoost" />
          <span className="font-bold text-sm text-foreground">TELEBOOST</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <a href="https://t.me/vitallautomation" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">{t("footer.privacy")}</a>
          <a href="https://t.me/vitallautomation" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">{t("footer.terms")}</a>
          <a href="https://t.me/vitallautomation" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Поддержка</a>
        </div>
        <p className="text-xs text-muted-foreground">{t("footer.copy")}</p>
      </div>
    </footer>
  );
};

export default Footer;
