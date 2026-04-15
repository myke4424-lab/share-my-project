import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  activeTab: string;
}

const modeLabels: Record<string, string> = {
  groups: "Поиск групп",
  channels: "Поиск каналов",
  users: "Поиск юзеров",
  messages: "Поиск по сообщениям",
};

const ParserLaunch = ({ activeTab }: Props) => {
  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
          <span className="w-2 h-2 rounded-full bg-violet-400" />
          <span className="text-xs text-foreground">Аккаунты: <strong>2</strong></span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-xs text-foreground">Ключевые слова: <strong>2</strong></span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-xs text-foreground">Режим: <strong>{modeLabels[activeTab]}</strong></span>
        </div>
      </div>

      {/* Launch area */}
      <div className="flex items-center gap-4">
        <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6">
          <Play className="h-4 w-4" /> Начать
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Pause className="h-4 w-4" />
          <span>Остановлено</span>
        </div>
      </div>
    </div>
  );
};

export default ParserLaunch;
