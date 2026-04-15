import { useState } from "react";
import { Search, Filter, ChevronRight, ChevronsRight, ChevronLeft, ChevronsLeft, Globe, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Account {
  id: number;
  phone: string;
  username: string;
  geo: string;
  proxyOk: boolean;
}

const available: Account[] = [
  { id: 1, phone: "+7 999 123-45-67", username: "@alexey_iv", geo: "🇷🇺 RU", proxyOk: true },
  { id: 2, phone: "+7 999 234-56-78", username: "@maria_p", geo: "🇷🇺 RU", proxyOk: true },
  { id: 3, phone: "+7 999 345-67-89", username: "@dima_k", geo: "🇩🇪 DE", proxyOk: false },
  { id: 4, phone: "+7 999 456-78-90", username: "@elena_s", geo: "🇷🇺 RU", proxyOk: true },
  { id: 5, phone: "+7 999 567-89-01", username: "@sergey_v", geo: "🇺🇸 US", proxyOk: true },
];

const ParserAccountSelect = () => {
  const [selectedIds, setSelectedIds] = useState<number[]>([2, 4]);
  const [search, setSearch] = useState("");

  const selectedAccounts = available.filter((a) => selectedIds.includes(a.id));
  const availableAccounts = available.filter((a) => !selectedIds.includes(a.id));
  const filteredAvailable = availableAccounts.filter(
    (a) => a.phone.includes(search) || a.username.toLowerCase().includes(search.toLowerCase())
  );

  const moveRight = (ids: number[]) => setSelectedIds((s) => [...s, ...ids]);
  const moveLeft = (ids: number[]) => setSelectedIds((s) => s.filter((id) => !ids.includes(id)));
  const moveAllRight = () => setSelectedIds(available.map((a) => a.id));
  const moveAllLeft = () => setSelectedIds([]);

  const validCount = available.filter((a) => a.proxyOk).length;

  return (
    <div className="space-y-4">
      {/* Mini stats */}
      <div className="flex flex-wrap gap-4 text-xs">
        <span className="text-muted-foreground">Всего: <strong className="text-foreground">{available.length}</strong></span>
        <span className="text-muted-foreground">Валидных: <strong className="text-emerald-400">{validCount}</strong></span>
        <span className="text-muted-foreground flex items-center gap-1">
          <Star className="h-3 w-3 text-amber-400" /> Выбрано: <strong className="text-foreground">{selectedIds.length}</strong>
        </span>
      </div>

      {/* Search & filters */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs bg-background border-border" />
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1 border-border">
          <Filter className="h-3 w-3" /> Статус
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1 border-border">
          <Globe className="h-3 w-3" /> ГЕО
        </Button>
      </div>

      {/* Transfer list */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3">
        {/* Left — available */}
        <div className="bg-background/50 border border-border/50 rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-border/30 text-xs font-medium text-muted-foreground">
            Доступные аккаунты ({filteredAvailable.length})
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-border/20">
            {filteredAvailable.map((acc) => (
              <button
                key={acc.id}
                onClick={() => moveRight([acc.id])}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted/30 transition-colors text-left"
              >
                <span className="text-foreground font-medium">{acc.phone}</span>
                <span className="text-muted-foreground">{acc.username}</span>
                <span className="ml-auto text-[10px]">{acc.geo}</span>
                <span className={cn("w-1.5 h-1.5 rounded-full", acc.proxyOk ? "bg-emerald-400" : "bg-red-400")} />
              </button>
            ))}
            {filteredAvailable.length === 0 && (
              <p className="px-3 py-4 text-xs text-muted-foreground/50 text-center">Нет доступных</p>
            )}
          </div>
        </div>

        {/* Middle — controls */}
        <div className="flex flex-col items-center justify-center gap-1.5">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={moveAllRight}><ChevronsRight className="h-3 w-3" /></Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => {}}><ChevronRight className="h-3 w-3" /></Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => {}}><ChevronLeft className="h-3 w-3" /></Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={moveAllLeft}><ChevronsLeft className="h-3 w-3" /></Button>
        </div>

        {/* Right — selected */}
        <div className="bg-background/50 border border-border/50 rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-border/30 text-xs font-medium text-muted-foreground">
            Выбрано для парсинга ({selectedAccounts.length})
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-border/20">
            {selectedAccounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => moveLeft([acc.id])}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted/30 transition-colors text-left"
              >
                <span className="text-foreground font-medium">{acc.phone}</span>
                <span className="text-muted-foreground">{acc.username}</span>
                <span className="ml-auto text-[10px]">{acc.geo}</span>
                <span className={cn(
                  "inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium",
                  acc.proxyOk ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                )}>
                  {acc.proxyOk ? "OK" : "ERR"}
                </span>
              </button>
            ))}
            {selectedAccounts.length === 0 && (
              <p className="px-3 py-4 text-xs text-muted-foreground/50 text-center">Выберите аккаунты</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParserAccountSelect;
