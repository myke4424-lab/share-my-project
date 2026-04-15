import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

const dataOptions = [
  { id: "basic", label: "Базовые данные", desc: "Название, ссылка, username, подписчики", checked: true },
  { id: "ai", label: "AI данные", desc: "Язык, рейтинг спама, уровень активности", checked: true },
  { id: "tech", label: "Технические данные", desc: "Тип канала, тип входа, верификация, даты", checked: true },
  { id: "stats", label: "Статистика активности", desc: "Комментарии, частота постов, вовлечённость", checked: true },
];

const formats = ["CSV", "JSON", "TXT", "XLSX"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExportModal = ({ open, onOpenChange }: Props) => {
  const [selectedData, setSelectedData] = useState<string[]>(dataOptions.map((d) => d.id));
  const [format, setFormat] = useState("CSV");

  const toggleData = (id: string) => {
    setSelectedData((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">Настройки расширенного экспорта</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {dataOptions.map((opt) => (
            <label key={opt.id} className="flex items-start gap-3 cursor-pointer group">
              <Checkbox
                checked={selectedData.includes(opt.id)}
                onCheckedChange={() => toggleData(opt.id)}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium text-foreground">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="space-y-2 mt-2">
          <label className="text-xs font-medium text-foreground">Формат</label>
          <div className="flex gap-1.5">
            {formats.map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-medium transition-colors border",
                  format === f
                    ? "bg-violet-500/20 text-violet-400 border-violet-500/30"
                    : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50"
                )}
              >
                {f === "JSON" ? "<> JSON" : f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отменить</Button>
          <Button className="bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 gap-2">
            <Download className="h-4 w-4" /> Скачать
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;
