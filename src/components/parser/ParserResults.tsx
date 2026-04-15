import { useState } from "react";
import { Search, Copy, Download, Trash2, List, LayoutGrid, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Result {
  id: number;
  name: string;
  username: string;
  type: "group" | "channel";
  members: string;
}

const mockResults: Result[] = [
  { id: 1, name: "Crypto Trading RU", username: "@crypto_trading_ru", type: "group", members: "15.4K" },
  { id: 2, name: "Bitcoin Miners", username: "@btc_miners", type: "group", members: "8.2K" },
  { id: 3, name: "NFT Community", username: "@nft_comm", type: "channel", members: "32.1K" },
  { id: 4, name: "DeFi Россия", username: "@defi_russia", type: "group", members: "5.7K" },
  { id: 5, name: "Blockchain News", username: "@blockchain_news", type: "channel", members: "48.9K" },
];

interface Props {
  onExport: () => void;
}

const ParserResults = ({ onExport }: Props) => {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [search, setSearch] = useState("");

  const filtered = mockResults.filter(
    (r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-sm font-medium text-foreground">Результаты поиска: {filtered.length}</h4>
        <div className="flex gap-1">
          <button onClick={() => setViewMode("list")} className={cn("p-1.5 rounded", viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground")}>
            <List className="h-4 w-4" />
          </button>
          <button onClick={() => setViewMode("grid")} className={cn("p-1.5 rounded", viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground")}>
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск в результатах..." className="pl-8 h-8 text-xs bg-background border-border" />
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10 gap-1">
          <Trash2 className="h-3 w-3" /> Очистить
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs text-primary border-primary/30 hover:bg-primary/10 gap-1">
          <Copy className="h-3 w-3" /> Скопировать ссылки
        </Button>
        <Button size="sm" className="h-8 text-xs bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 gap-1" onClick={onExport}>
          <Download className="h-3 w-3" /> Экспорт
        </Button>
      </div>

      {/* Results list */}
      <div className="space-y-1.5">
        {filtered.map((r) => (
          <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/30 hover:border-border/60 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
              <p className="text-xs text-muted-foreground">{r.username}</p>
            </div>
            <span className={cn(
              "px-2 py-0.5 rounded text-[10px] font-medium border",
              r.type === "group" ? "bg-primary/10 text-primary border-primary/20" : "bg-violet-500/10 text-violet-400 border-violet-500/20"
            )}>
              {r.type === "group" ? "ГРУППА" : "КАНАЛ"}
            </span>
            <span className="text-xs text-muted-foreground font-medium">{r.members}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center py-8 text-sm text-muted-foreground/50">Нет результатов</p>
        )}
      </div>
    </div>
  );
};

export default ParserResults;
