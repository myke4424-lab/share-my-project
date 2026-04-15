import { useState } from "react";
import { Shield, X, Plus, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const aiSuggestions = [
  { word: "криптовалюта", match: 95 },
  { word: "трейдинг", match: 92 },
  { word: "NFT сообщество", match: 90 },
  { word: "блокчейн", match: 88 },
];

const limitOptions = [10, 25, 50, 100, 200];
const activityOptions = ["Любая активность", "Только активные", "Неактивные"];

const ParserSearchSettings = () => {
  const [keywords, setKeywords] = useState<string[]>(["crypto", "bitcoin"]);
  const [keywordInput, setKeywordInput] = useState("");
  const [suffixes, setSuffixes] = useState<string[]>(["chat", "group"]);
  const [suffixInput, setSuffixInput] = useState("");
  const [suffixMode, setSuffixMode] = useState<"manual" | "auto">("manual");
  const [minMembers, setMinMembers] = useState(100);
  const [maxMembers, setMaxMembers] = useState(50000);
  const [rating, setRating] = useState(7);
  const [detectLang, setDetectLang] = useState(true);
  const [fastMode, setFastMode] = useState(false);
  const [limit, setLimit] = useState(50);
  const [activity, setActivity] = useState("Только активные");
  const [queryDelay, setQueryDelay] = useState(3);
  const [channelDelay, setChannelDelay] = useState(5);
  const [aiProtection, setAiProtection] = useState(true);

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const addSuffix = () => {
    if (suffixInput.trim() && !suffixes.includes(suffixInput.trim())) {
      setSuffixes([...suffixes, suffixInput.trim()]);
      setSuffixInput("");
    }
  };

  const combos = keywords.length * Math.max(suffixes.length, 1);

  return (
    <div className="space-y-5">
      {/* AI Protection banner */}
      <div className={cn(
        "rounded-xl p-4 flex items-center justify-between",
        "bg-gradient-to-r from-violet-500/15 via-primary/10 to-violet-500/15 border border-violet-500/20"
      )}>
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-violet-400" />
          <div>
            <p className="text-sm font-semibold text-foreground">AI Защита аккаунтов <span className="text-[10px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded ml-1">NEW</span></p>
            <p className="text-xs text-muted-foreground">Интеллектуальная защита от блокировок</p>
          </div>
        </div>
        <button
          onClick={() => setAiProtection(!aiProtection)}
          className={cn(
            "w-10 h-5 rounded-full transition-colors relative",
            aiProtection ? "bg-violet-500" : "bg-muted"
          )}
        >
          <span className={cn(
            "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
            aiProtection ? "left-5.5 translate-x-0" : "left-0.5"
          )} style={aiProtection ? { left: '22px' } : { left: '2px' }} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Keywords */}
          <div>
            <label className="text-xs font-medium text-foreground mb-2 block">Ключевые слова *</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                placeholder="Введите и нажмите Enter"
                className="h-8 text-xs bg-background border-border"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {keywords.map((kw) => (
                <span key={kw} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/15 text-primary text-xs font-medium">
                  {kw}
                  <button onClick={() => setKeywords((k) => k.filter((x) => x !== kw))}><X className="h-3 w-3" /></button>
                </span>
              ))}
              {keywords.length > 0 && (
                <button onClick={() => setKeywords([])} className="text-[10px] text-red-400 hover:underline ml-1">Очистить всё</button>
              )}
            </div>
          </div>

          {/* AI suggestions */}
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block">AI-предложенные ключевые слова</label>
            <div className="flex flex-wrap gap-1.5">
              {aiSuggestions.map((s) => (
                <button
                  key={s.word}
                  onClick={() => !keywords.includes(s.word) && setKeywords([...keywords, s.word])}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 border border-border/50 text-xs text-foreground hover:border-primary/30 transition-colors"
                >
                  {s.word}
                  <span className="text-[10px] text-emerald-400">{s.match}%</span>
                  <Plus className="h-2.5 w-2.5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>

          {/* Suffixes */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs font-medium text-foreground">Окончания</label>
              <div className="flex bg-muted/50 rounded-md p-0.5 text-[10px]">
                <button onClick={() => setSuffixMode("manual")} className={cn("px-2 py-0.5 rounded", suffixMode === "manual" ? "bg-primary/15 text-primary" : "text-muted-foreground")}>Вручную</button>
                <button onClick={() => setSuffixMode("auto")} className={cn("px-2 py-0.5 rounded", suffixMode === "auto" ? "bg-primary/15 text-primary" : "text-muted-foreground")}>Авто</button>
              </div>
            </div>
            {suffixMode === "manual" && (
              <>
                <div className="flex gap-2 mb-2">
                  <Input value={suffixInput} onChange={(e) => setSuffixInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSuffix())} placeholder="Добавить окончание" className="h-8 text-xs bg-background border-border" />
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={addSuffix}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {suffixes.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 text-foreground text-xs">
                      {s} <button onClick={() => setSuffixes((ss) => ss.filter((x) => x !== s))}><X className="h-3 w-3 text-muted-foreground" /></button>
                    </span>
                  ))}
                </div>
              </>
            )}
            <p className="text-[10px] text-muted-foreground mt-2">Будет создано {combos} комбинаций из {keywords.length} ключевых слов</p>
          </div>

          {/* Member range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Мин. участников</label>
              <Input type="number" value={minMembers} onChange={(e) => setMinMembers(Number(e.target.value))} className="h-8 text-xs bg-background border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Макс. участников</label>
              <Input type="number" value={maxMembers} onChange={(e) => setMaxMembers(Number(e.target.value))} className="h-8 text-xs bg-background border-border" />
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Рейтинг для рассылки</label>
            <div className="flex items-center gap-2">
              <Input type="number" min={1} max={10} value={rating} onChange={(e) => setRating(Number(e.target.value))} className="h-8 w-20 text-xs bg-background border-border" />
              <span className="text-xs text-muted-foreground">/10</span>
            </div>
          </div>

          {/* Language detection */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-foreground">Определение языка</label>
            <button
              onClick={() => setDetectLang(!detectLang)}
              className={cn("w-9 h-5 rounded-full transition-colors relative", detectLang ? "bg-primary" : "bg-muted")}
            >
              <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={detectLang ? { left: '18px' } : { left: '2px' }} />
            </button>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Fast mode */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-foreground">Быстрая работа</label>
            <button
              onClick={() => setFastMode(!fastMode)}
              className={cn("w-9 h-5 rounded-full transition-colors relative", fastMode ? "bg-red-500" : "bg-muted")}
            >
              <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={fastMode ? { left: '18px' } : { left: '2px' }} />
            </button>
          </div>
          {fastMode && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Повышенный риск блокировки аккаунтов
            </div>
          )}

          {/* Limit */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Лимит результатов</label>
            <div className="flex gap-1.5">
              {limitOptions.map((l) => (
                <button
                  key={l}
                  onClick={() => setLimit(l)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    limit === l ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" : "bg-muted/30 text-muted-foreground border border-border/50 hover:bg-muted/50"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Activity filter */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Фильтр активности</label>
            <div className="flex bg-muted/30 rounded-lg p-0.5 border border-border/50">
              {activityOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setActivity(opt)}
                  className={cn(
                    "flex-1 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors",
                    activity === opt ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt === "Только активные" ? "✓ " : ""}{opt}
                </button>
              ))}
            </div>
          </div>

          {/* Delays */}
          <div className="space-y-4">
            <p className="text-xs font-medium text-foreground">Настройки задержек</p>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] text-muted-foreground">Задержка между запросами (сек)</label>
                <span className="text-[11px] px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 font-medium">{queryDelay}с</span>
              </div>
              <input
                type="range" min={1} max={15} value={queryDelay}
                onChange={(e) => setQueryDelay(Number(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] text-muted-foreground">Задержка между каналами</label>
                <span className="text-[11px] px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 font-medium">{channelDelay}с</span>
              </div>
              <input
                type="range" min={1} max={30} value={channelDelay}
                onChange={(e) => setChannelDelay(Number(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParserSearchSettings;
