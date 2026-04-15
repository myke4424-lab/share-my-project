import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Trash2, RefreshCw, BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParsedResult {
  id: string;
  channel: string;
  mode: string;
  date: string;
  count: number;
}

const MODE_LABELS: Record<string, string> = {
  members: "участники",
  comments: "комментарии",
  chat: "чат",
  reactions: "реакции",
  search: "поиск",
};

interface Props {
  /** URL of the backend import endpoint, e.g. "/api/tools/masslooking/import-from-library" */
  importEndpoint: string;
  onImported?: (count: number) => void;
  className?: string;
}

export default function ParsedResultSelector({ importEndpoint, onImported, className }: Props) {
  const [results, setResults] = useState<ParsedResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/tools/parsing/results", { credentials: "include" });
      if (r.ok) setResults(await r.json());
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleImport = async () => {
    if (!selected) return;
    setImporting(true);
    try {
      const r = await fetch(importEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ result_id: selected }),
      });
      const d = await r.json();
      if (r.ok && d.count !== undefined) {
        onImported?.(d.count);
        setOpen(false);
      }
    } catch {
      /* ignore */
    }
    setImporting(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(id);
    try {
      await fetch(`/api/tools/parsing/results/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      setResults(prev => prev.filter(r => r.id !== id));
      if (selected === id) setSelected(null);
    } catch {
      /* ignore */
    }
    setDeleting(null);
  };

  const fmt = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" })
        + " " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    } catch { return iso; }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
      >
        <BookOpen className="h-3.5 w-3.5" />
        Библиотека результатов парсинга
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        {results.length > 0 && (
          <span className="ml-1 bg-primary/15 text-primary rounded px-1.5 py-0.5 text-[10px] font-semibold">
            {results.length}
          </span>
        )}
      </button>

      {open && (
        <div className="border border-border/40 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-muted/10 border-b border-border/30">
            <span className="text-[11px] text-muted-foreground">
              {results.length === 0 ? "Нет сохранённых результатов" : `${results.length} результатов`}
            </span>
            <button onClick={load} className="text-muted-foreground hover:text-foreground transition-colors" title="Обновить">
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            </button>
          </div>

          {/* List */}
          {results.length > 0 && (
            <div className="max-h-52 overflow-y-auto divide-y divide-border/20">
              {results.map(r => (
                <div
                  key={r.id}
                  onClick={() => setSelected(r.id === selected ? null : r.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-muted/20 transition-colors text-xs",
                    selected === r.id && "bg-primary/8 border-l-2 border-primary"
                  )}
                >
                  <div className={cn(
                    "w-3.5 h-3.5 rounded-full border-2 flex-shrink-0",
                    selected === r.id ? "border-primary bg-primary" : "border-muted-foreground"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-foreground truncate max-w-[120px]">
                        {r.channel ? `@${r.channel.replace(/^@/, "")}` : "—"}
                      </span>
                      <span className="text-[10px] bg-muted/40 text-muted-foreground rounded px-1 py-0.5">
                        {MODE_LABELS[r.mode] ?? r.mode}
                      </span>
                      <span className="text-muted-foreground">{r.count} польз.</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{fmt(r.date)}</div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(r.id, e)}
                    disabled={deleting === r.id}
                    className="text-muted-foreground hover:text-red-400 transition-colors flex-shrink-0"
                    title="Удалить"
                  >
                    {deleting === r.id
                      ? <RefreshCw className="h-3 w-3 animate-spin" />
                      : <Trash2 className="h-3 w-3" />}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Footer action */}
          {results.length > 0 && (
            <div className="px-3 py-2 bg-muted/10 border-t border-border/30">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-7"
                disabled={!selected || importing}
                onClick={handleImport}
              >
                {importing
                  ? <RefreshCw className="h-3 w-3 animate-spin" />
                  : <Download className="h-3 w-3" />}
                Загрузить выбранный результат
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
