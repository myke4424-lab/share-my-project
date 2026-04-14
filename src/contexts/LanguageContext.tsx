import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "ru" | "en";

const translations = {
  "nav.video": { ru: "Обзор", en: "Overview" },
  "nav.features": { ru: "Модули", en: "Modules" },
  "nav.pricing": { ru: "Тарифы", en: "Plans" },
  "nav.reviews": { ru: "Кейсы", en: "Cases" },
  "nav.cta": { ru: "Попробовать", en: "Try Free" },
  "hero.badge": { ru: "🚀 Платформа нового поколения", en: "🚀 Next-gen platform" },
  "hero.line1": { ru: "Автоматизируй", en: "Automate" },
  "hero.line2": { ru: "продвижение", en: "your growth" },
  "hero.line3": { ru: "в Telegram", en: "on Telegram" },
  "hero.desc": { ru: "TeleBoost объединяет 16 инструментов в одной панели: от парсинга аудитории до нейросетевых диалогов. Настройте воронку за 10 минут — без ручной работы.", en: "TeleBoost combines 16 tools in one dashboard: from audience parsing to AI-driven conversations. Set up your funnel in 10 minutes — zero manual work." },
  "hero.start": { ru: "Начать бесплатно", en: "Start Free" },
  "hero.demo": { ru: "Живое демо", en: "Live Demo" },
  "hero.trust": { ru: "Нам доверяют 200+ команд", en: "Trusted by 200+ teams" },
  "stats.s1.val": { ru: "16", en: "16" },
  "stats.s1.label": { ru: "Модулей автоматизации", en: "Automation modules" },
  "stats.s2.val": { ru: "30K+", en: "30K+" },
  "stats.s2.label": { ru: "Лидов привлечено", en: "Leads generated" },
  "stats.s3.val": { ru: "10 мин", en: "10 min" },
  "stats.s3.label": { ru: "На настройку воронки", en: "To set up a funnel" },
  "stats.s4.val": { ru: "24/7", en: "24/7" },
  "stats.s4.label": { ru: "Работа без остановок", en: "Non-stop operation" },
  "how.title": { ru: "Как устроен TeleBoost", en: "How TeleBoost Works" },
  "how.desc": { ru: "Три этапа — от сбора аудитории до конверсий. Каждый шаг полностью автоматизирован.", en: "Three stages — from audience collection to conversions. Every step is fully automated." },
  "video.title": { ru: "Посмотрите TeleBoost в деле", en: "See TeleBoost in Action" },
  "video.desc": { ru: "За 5 минут покажем, как настроить полный цикл продвижения: от парсинга до первых лидов.", en: "In 5 minutes we'll show how to set up a full promotion cycle: from parsing to first leads." },
  "feat.title": { ru: "16 модулей. Одна панель.", en: "16 modules. One dashboard." },
  "feat.desc": { ru: "Каждый инструмент заточен под конкретную задачу Telegram-маркетинга.", en: "Each tool is built for a specific Telegram marketing task." },
  "feat.1.title": { ru: "Менеджер аккаунтов", en: "Account Manager" },
  "feat.1.desc": { ru: "Импорт, прокси, статусы — полный контроль над парком аккаунтов", en: "Import, proxy, statuses — full control over your account fleet" },
  "feat.2.title": { ru: "Нейрокомментинг", en: "Neural Commenting" },
  "feat.2.desc": { ru: "ИИ пишет релевантные комментарии, которые не отличить от живых", en: "AI writes relevant comments indistinguishable from real ones" },
  "feat.3.title": { ru: "Нейрочаттинг", en: "Neural Chatting" },
  "feat.3.desc": { ru: "Автоматические диалоги в группах для прогрева и продаж", en: "Automated conversations in groups for account warming and sales" },
  "feat.4.title": { ru: "Прогрев аккаунтов", en: "Account Warming" },
  "feat.4.desc": { ru: "ИИ-переписка поднимает Trust Score без риска бана", en: "AI chatting raises Trust Score without ban risk" },
  "feat.5.title": { ru: "Парсинг аудитории", en: "Audience Parsing" },
  "feat.5.desc": { ru: "Сбор подписчиков из каналов и групп с фильтрацией", en: "Collect subscribers from channels and groups with filtering" },
  "feat.6.title": { ru: "Инвайтинг", en: "Inviting" },
  "feat.6.desc": { ru: "Массовые приглашения с контролем лимитов и AI-защитой", en: "Mass invitations with limit control and AI protection" },
  "feat.7.title": { ru: "Реакции", en: "Reactions" },
  "feat.7.desc": { ru: "Накрутка реакций и просмотр историй для видимости", en: "Reaction boosting and story viewing for visibility" },
  "feat.8.title": { ru: "Конвертер", en: "Converter" },
  "feat.8.desc": { ru: "Конвертация баз, экспорт и аналитика в удобном формате", en: "Database conversion, export, and analytics in a convenient format" },
  "reviews.title": { ru: "Реальные результаты наших клиентов", en: "Real Results from Our Clients" },
  "reviews.desc": { ru: "Цифры и истории команд, которые уже используют TeleBoost", en: "Numbers and stories from teams already using TeleBoost" },
  "review.1.name": { ru: "Артём К.", en: "Artem K." },
  "review.1.role": { ru: "Telegram-маркетолог", en: "Telegram Marketer" },
  "review.1.text": { ru: "За месяц набрали 4 200 подписчиков на канал без единого бана. Нейрокомментинг — вещь.", en: "Got 4,200 subscribers in a month without a single ban. Neural commenting is amazing." },
  "review.2.name": { ru: "Дмитрий В.", en: "Dmitry V." },
  "review.2.role": { ru: "Владелец агентства", en: "Agency Owner" },
  "review.2.text": { ru: "Перевели 12 клиентов на TeleBoost. Парсер точнее любого конкурента.", en: "Moved 12 clients to TeleBoost. Parser is more precise than any competitor." },
  "review.3.name": { ru: "Елена М.", en: "Elena M." },
  "review.3.role": { ru: "SMM-менеджер", en: "SMM Manager" },
  "review.3.text": { ru: "Наконец-то всё в одном месте. Раньше жонглировала 5 сервисами.", en: "Finally everything in one place. Used to juggle 5 services." },
  "review.4.name": { ru: "Максим Л.", en: "Maxim L." },
  "review.4.role": { ru: "Крипто-проект", en: "Crypto Project" },
  "review.4.text": { ru: "Прогрев аккаунтов работает как часы. Ни одного спамблока за 3 месяца.", en: "Account warming works like clockwork. Not a single spam block in 3 months." },
  "review.5.name": { ru: "Анна С.", en: "Anna S." },
  "review.5.role": { ru: "Фрилансер", en: "Freelancer" },
  "review.5.text": { ru: "Использую для клиентов. Конвертер баз и экспорт — must have.", en: "Using for clients. Database converter and export is a must-have." },
  "review.6.name": { ru: "Игорь Р.", en: "Igor R." },
  "review.6.role": { ru: "Инфобизнес", en: "Info Business" },
  "review.6.text": { ru: "Нейрочаттинг реально конвертит. ROI вырос на 180%.", en: "Neural chatting actually converts. ROI increased by 180%." },
  "faq.title": { ru: "Часто задаваемые вопросы", en: "Frequently Asked Questions" },
  "faq.desc": { ru: "Ответы на популярные вопросы о TeleBoost", en: "Answers to popular questions about TeleBoost" },
  "faq.1.q": { ru: "Что такое TeleBoost?", en: "What is TeleBoost?" },
  "faq.1.a": { ru: "TeleBoost — это веб-платформа для автоматизации Telegram-маркетинга. 16 модулей: парсинг, инвайтинг, нейрокомментинг, прогрев, чаттинг, реакции, масслукинг и другие.", en: "TeleBoost is a web platform for Telegram marketing automation. 16 modules: parsing, inviting, neural commenting, warming, chatting, reactions, mass viewing and more." },
  "faq.2.q": { ru: "Сколько стоит TeleBoost?", en: "How much does TeleBoost cost?" },
  "faq.2.a": { ru: "Отдельные тарифы по инструментам: Парсинг — $10/мес, Прогрев — $15/мес, Инвайтинг — $25/мес. Тариф «Всё в одном» (Pro System) — $39/мес или $328 при оплате за год.", en: "Individual tool plans: Parsing — $10/mo, Warming — $15/mo, Inviting — $25/mo. All-in-one plan (Pro System) — $39/mo or $328/year (save 30%)." },
  "faq.3.q": { ru: "Как раскрутить Telegram-канал с помощью TeleBoost?", en: "How to grow a Telegram channel with TeleBoost?" },
  "faq.3.a": { ru: "TeleBoost автоматизирует полный цикл: парсинг → прогрев → AI-комментирование → нейрочаттинг → инвайтинг → реакции → масслукинг → теггинг. Настройка — 10 минут, первые результаты — через час.", en: "TeleBoost automates the full cycle: parsing → warming → AI commenting → neural chatting → inviting → reactions → mass viewing → tagging. Setup takes 10 minutes, first results within an hour." },
  "faq.4.q": { ru: "На каких устройствах работает платформа?", en: "What devices does the platform work on?" },
  "faq.4.a": { ru: "TeleBoost — полноценное веб-приложение, работает в любом браузере: на компьютере, планшете или смартфоне.", en: "TeleBoost is a full web application that works in any browser: desktop, tablet or smartphone." },
  "faq.5.q": { ru: "Какие функции есть в платформе?", en: "What features does the platform have?" },
  "faq.5.a": { ru: "16 модулей: менеджер аккаунтов, нейрокомментинг, нейрочаттинг, прогрев, парсер, инвайтинг, реакции, просмотр сторис, конвертер, аналитика, тегирование, управление профилями и другие.", en: "16 modules: account manager, neural commenting, neural chatting, warming, parser, inviting, reactions, story viewing, converter, analytics, tagging, profile management, and more." },
  "faq.6.q": { ru: "Есть ли обучение?", en: "Is there training?" },
  "faq.6.a": { ru: "Да. Внутри платформы — пошаговые инструкции, рекомендации и готовая логика работы. Даже без опыта вы быстро запустите процессы.", en: "Yes. Inside the platform — step-by-step guides, recommendations, and ready-to-use workflow. No prior experience needed." },
  "cta.title": { ru: "Начните продвижение в Telegram уже сегодня", en: "Start Your Telegram Growth Today" },
  "cta.desc": { ru: "Запустите первую кампанию за 10 минут. Без ручной работы, без риска бана.", en: "Launch your first campaign in 10 minutes. No manual work, no ban risk." },
  "cta.social": { ru: "Более 200 команд уже используют TeleBoost", en: "Over 200 teams already use TeleBoost" },
  "cta.start": { ru: "Начать бесплатно", en: "Start Free" },
  "cta.demo": { ru: "Живое демо", en: "Live Demo" },
  "cta.check1": { ru: "✓ Бесплатный trial 3 дня", en: "✓ Free 3-day trial" },
  "cta.check2": { ru: "✓ Без привязки карты", en: "✓ No card required" },
  "cta.check3": { ru: "✓ Поддержка 24/7", en: "✓ 24/7 support" },
  "cta.perk1.title": { ru: "Быстрый запуск", en: "Quick Start" },
  "cta.perk1.desc": { ru: "10 минут на настройку", en: "10 minutes to set up" },
  "cta.perk2.title": { ru: "AI-защита", en: "AI Protection" },
  "cta.perk2.desc": { ru: "Антиспамблок система", en: "Anti-spam block system" },
  "cta.perk3.title": { ru: "Поддержка", en: "Support" },
  "cta.perk3.desc": { ru: "Помощь в любое время", en: "Help anytime" },
  "cta.perk4.title": { ru: "Результат", en: "Results" },
  "cta.perk4.desc": { ru: "Первые лиды за час", en: "First leads in an hour" },
  "footer.copy": { ru: "© 2025 TeleBoost. Все права защищены.", en: "© 2025 TeleBoost. All rights reserved." },
  "footer.privacy": { ru: "Политика конфиденциальности", en: "Privacy Policy" },
  "footer.terms": { ru: "Условия использования", en: "Terms of Service" },
} as const;

type TranslationKey = keyof typeof translations;

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey | string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>("ru");
  const t = (key: TranslationKey | string): string => {
    const entry = (translations as Record<string, Record<Lang, string>>)[key];
    return entry?.[lang] ?? key;
  };
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
