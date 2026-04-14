import { createFileRoute } from "@tanstack/react-router";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturesListSection from "@/components/landing/FeaturesListSection";
import ComparisonSection from "@/components/landing/ComparisonSection";
import PricingSection from "@/components/landing/PricingSection";
import ReviewsSection from "@/components/landing/ReviewsSection";
import FAQSection from "@/components/landing/FAQSection";
import CTASection from "@/components/landing/CTASection";
import VideoSection from "@/components/landing/VideoSection";
import Footer from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TeleBoost — Автоматизация продвижения в Telegram" },
      { name: "description", content: "16 инструментов в одной панели: парсинг, инвайтинг, нейрокомментинг, прогрев и другие. Запустите воронку за 10 минут." },
      { property: "og:title", content: "TeleBoost — Автоматизация продвижения в Telegram" },
      { property: "og:description", content: "16 инструментов в одной панели для Telegram-маркетинга." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <HeroSection />
        <StatsSection />
        <VideoSection />
        <HowItWorksSection />
        <FeaturesListSection />
        <ComparisonSection />
        <PricingSection />
        <ReviewsSection />
        <FAQSection />
        <CTASection />
        <Footer />
      </div>
    </LanguageProvider>
  );
}
