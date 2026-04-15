import { useState } from "react";
import { Inbox, Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LogEntry {
  time: string;
  account: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "debug";
}

const mockLogs: LogEntry[] = [
  { time: "14:23:01", account: "+7 999 123-45-67", message: "Начинаю поиск по запросу \"crypto\"...", type: "info" },
  { time: "14:23:04", account: "+7 999 123-45-67", message: "✓ Найдено 3 группы по запросу \"crypto\"", type: "success" },
  { time: "14:23:07", account: "+7 999 234-56-78", message: "Поиск по запросу \"bitcoin\"...", type: "info" },
  { time: "14:23:10", account: "+7 999 234-56-78", message: "⚠ Нет результатов для \"bitcoin\", пробую \"bitcoin chat\"...", type: "warning" },
  { time: "14:23:14", account: "+7 999 234-56-78", message: "✓ Найдено 5 групп по запросу \"bitcoin chat\"", type: "success" },
  { time: "14:23:18", account: "+7 999 123-45-67", message: "✗ Ошибка FloodWait, пауза 30 сек", type: "error" },
  { time: "14:23:20", account: "+7 999 234-56-78", message: "Переход к следующему запросу...", type: "debug" },
];

const filterTabs = [
  { id: "waiting", label: "ОЖИДАНИЕ ЗАПУСКА" },
  { id: "all", label: "ВСЕ", count: 7 },
  { id: "info", label: "ИНФО", count: 3 },
  { id: "success", label: "УСПЕХ", count: 2 },
  { id: "warning", label: "ПРЕДУПРЕЖДЕНИЕ", count: 1 },
  { id: "error", label: "ОШИБКА", count: 1 },
  { id: "debug", label: "ДЕБАГ", count: 0 },
];

const typeColors: Record<string, string> = {
  info: "text-muted-foreground",
  success: "text-emerald-400",
  warning: "text-yellow-400",
  error: "text-red-400",
  debug: "text-muted-foreground/60",
};

const ParserLogs = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filteredLogs = mockLogs.filter((l) => {
    if (activeFilter !== "all" && activeFilter !== "waiting" && l.type !== activeFilter) return false;
    if (search && !l.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const successCount = mockLogs.filter((l) => l.type === "success").length;
  const errorCount = mockLogs.filter((l) => l.type === "error").length;

  return (
    <div className="space-y-3">
      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={cn(
              "px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors",
              activeFilter === tab.id
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            )}
          >
            {tab.label}{tab.count !== undefined ? ` (${tab.count})` : ""}
          </button>
        ))}
        <div className="ml-auto">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск в логах..." className="h-7 w-40 pl-7 text-[10px] bg-background border-border" />
          </div>
        </div>
      </div>

      {/* Log area */}
      <div className="bg-[hsl(0,0%,4%)] rounded-lg border border-border/30 max-h-64 overflow-y-auto font-mono text-[11px] p-3 space-y-0.5">
        {activeFilter === "waiting" || filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/40">
            <Inbox className="h-8 w-8 mb-2" />
            <p className="text-xs">Логов пока нет</p>
          </div>
        ) : (
          filteredLogs.map((log, i) => (
            <div key={i} className={cn("leading-relaxed", typeColors[log.type])}>
              <span className="text-muted-foreground/50">[{log.time}]</span>{" "}
              <span className="text-muted-foreground/70">[{log.account}]</span>{" "}
              {log.message}
            </div>
          ))
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex gap-3">
          <span>Всего: {mockLogs.length}</span>
          <span className="text-emerald-400">✓ {successCount}</span>
          <span className="text-red-400">✗ {errorCount}</span>
        </div>
        <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-muted-foreground">
          <Download className="h-3 w-3" /> Загрузить историю
        </Button>
      </div>
    </div>
  );
};

export default ParserLogs;
