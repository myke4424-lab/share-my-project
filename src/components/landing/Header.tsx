import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "@tanstack/react-router";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const { lang, setLang, t } = useLanguage();

  const toggleDark = () => {
    setDark(!dark);
    document.documentElement.classList.toggle("dark");
  };

  const navItems = [
    { label: t("nav.video"), href: "#video" },
    { label: t("nav.features"), href: "#features" },
    { label: t("nav.reviews"), href: "#reviews" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="#" className="flex items-center gap-2">
            <img src="/logo.png" className="w-8 h-8 object-contain" alt="TeleBoost" />
            <span className="font-bold text-lg tracking-tight text-foreground">TELEBOOST</span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={toggleDark} className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors cursor-pointer">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={() => setLang(lang === "ru" ? "en" : "ru")} className="text-xs font-semibold text-muted-foreground border border-border rounded-full px-3 py-1 hover:bg-muted transition-colors cursor-pointer">
              {lang === "ru" ? "EN" : "RU"}
            </button>
            <Link to="/">
              <Button size="sm" className="rounded-full px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                {t("nav.cta")}
              </Button>
            </Link>
          </div>

          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-background border-b border-border">
            <div className="px-4 py-4 space-y-3">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} className="block text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>
                  {item.label}
                </a>
              ))}
              <div className="flex items-center gap-2">
                <button onClick={toggleDark} className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground">
                  {dark ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <button onClick={() => setLang(lang === "ru" ? "en" : "ru")} className="text-xs font-semibold text-muted-foreground border border-border rounded-full px-3 py-1">
                  {lang === "ru" ? "EN" : "RU"}
                </button>
              </div>
              <Button className="w-full rounded-full bg-primary text-primary-foreground" onClick={() => setMobileOpen(false)}>
                {t("nav.cta")}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
