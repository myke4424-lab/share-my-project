import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Check, Hash, Users } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface Template {
  id: number;
  name: string;
  description: string;
  system: boolean;
  icon: string;
  iconBg: string;
  keywords: string[];
  members: string;
}

const templates: Template[] = [
  {
    id: 1,
    name: "Крипто & Трейдинг",
    description: "Поиск криптовалютных групп и каналов для рассылки",
    system: true,
    icon: "₿",
    iconBg: "bg-amber-500/20 text-amber-400",
    keywords: ["crypto", "bitcoin", "трейдинг", "биткоин"],
    members: "1K-100K",
  },
  {
    id: 2,
    name: "Бизнес & Стартапы",
    description: "Бизнес-сообщества и предпринимательские группы",
    system: true,
    icon: "💼",
    iconBg: "bg-primary/20 text-primary",
    keywords: ["бизнес", "стартап", "инвестиции"],
    members: "500-50K",
  },
  {
    id: 3,
    name: "IT & Разработка",
    description: "IT-сообщества, программирование, DevOps",
    system: true,
    icon: "💻",
    iconBg: "bg-emerald-500/20 text-emerald-400",
    keywords: ["developer", "программист", "react", "python"],
    members: "1K-200K",
  },
  {
    id: 4,
    name: "Маркетинг & SMM",
    description: "Группы по маркетингу и продвижению",
    system: false,
    icon: "📢",
    iconBg: "bg-violet-500/20 text-violet-400",
    keywords: ["маркетинг", "smm", "реклама"],
    members: "500-30K",
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TemplatesModal = ({ open, onOpenChange }: Props) => {
  const [search, setSearch] = useState("");
  const [hideSystem, setHideSystem] = useState(false);

  const filtered = templates.filter((t) => {
    if (hideSystem && t.system) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">Управление шаблонами</DialogTitle>
        </DialogHeader>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск шаблонов..." className="pl-8 bg-background border-border" />
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <Checkbox checked={hideSystem} onCheckedChange={(c) => setHideSystem(!!c)} />
            Скрыть системные
          </label>
          <Button variant="outline" className="gap-2 ml-auto border-border">
            <Plus className="h-4 w-4" /> Новый шаблон
          </Button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          {filtered.map((tpl) => (
            <div key={tpl.id} className="panel-card rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0", tpl.iconBg)}>
                  {tpl.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{tpl.name}</p>
                    {tpl.system && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 font-medium border border-orange-500/20">
                        СИСТЕМНЫЙ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> {tpl.keywords.length} кл. слов</span>
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {tpl.members}</span>
              </div>

              <div className="flex flex-wrap gap-1">
                {tpl.keywords.slice(0, 3).map((kw) => (
                  <span key={kw} className="px-2 py-0.5 rounded bg-muted/50 text-[10px] text-foreground">{kw}</span>
                ))}
                {tpl.keywords.length > 3 && (
                  <span className="px-2 py-0.5 rounded bg-muted/50 text-[10px] text-muted-foreground">+{tpl.keywords.length - 3} more</span>
                )}
              </div>

              <Button variant="outline" className="w-full h-8 text-xs gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                <Check className="h-3 w-3" /> Применить
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplatesModal;
