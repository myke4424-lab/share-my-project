import { useState } from "react";
import { Search, Check, Shield, User, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SelectorAccount {
  id: number;
  name: string;
  phone: string;
  status: string;
  tg_name?: string;
  category?: string;
  proxy_id?: number | null;
  proxy_label?: string;
  proxy_name?: string;
  days?: number;
  avatar?: string;
  has_avatar?: boolean;
}

interface AccountSelectorProps {
  accounts: SelectorAccount[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  label?: string;
  /** Account IDs currently busy in running tasks — shown with "В работе" badge */
  busyIds?: number[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active:    { label: "Активен",    color: "text-emerald-400", bg: "bg-emerald-500/15", dot: "bg-emerald-400" },
  banned:    { label: "Забанен",    color: "text-red-400",     bg: "bg-red-500/15",     dot: "bg-red-400" },
  spamblock: { label: "Спамблок",   color: "text-orange-400",  bg: "bg-orange-500/15",  dot: "bg-orange-400" },
  flood:     { label: "FloodWait",  color: "text-yellow-400",  bg: "bg-yellow-500/15",  dot: "bg-yellow-400" },
  unknown:   { label: "Неизвестно", color: "text-muted-foreground", bg: "bg-muted/40",  dot: "bg-muted-foreground" },
};

const AVATAR_COLORS = [
  "bg-violet-500/20 text-violet-400",
  "bg-blue-500/20 text-blue-400",
  "bg-emerald-500/20 text-emerald-400",
  "bg-orange-500/20 text-orange-400",
  "bg-pink-500/20 text-pink-400",
  "bg-cyan-500/20 text-cyan-400",
  "bg-amber-500/20 text-amber-400",
];

function getStatusKey(s: string) {
  if (!s) return "unknown";
  const lower = s.toLowerCase();
  if (lower === "active" || lower === "ok") return "active";
  if (lower.includes("ban")) return "banned";
  if (lower.includes("spam")) return "spamblock";
  if (lower.includes("flood")) return "flood";
  return "unknown";
}

function getInitials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(/[\s_]/);
  return parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function getAvatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

export default function AccountSelector({
  accounts,
  selectedIds,
  onChange,
  label = "для задачи",
  busyIds = [],
}: AccountSelectorProps) {
  const [search, setSearch] = useState("");

  const filtered = accounts.filter(
    (a) =>
      a.phone.includes(search) ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.tg_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.category ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = accounts.filter((a) => getStatusKey(a.status) === "active").length;
  const busySet = new Set(busyIds);

  const toggle = (id: number) => {
    if (busySet.has(id)) return; // cannot select busy accounts
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectAll = () => onChange(filtered.filter(a => !busySet.has(a.id)).map((a) => a.id));
  const clearAll = () => onChange([]);

  return (
    <div className="space-y-3">
      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs flex-wrap">
        <span className="text-muted-foreground">
          Всего: <strong className="text-foreground">{accounts.length}</strong>
        </span>
        <span className="text-muted-foreground">
          Активных: <strong className="text-emerald-400">{activeCount}</strong>
        </span>
        {busyIds.length > 0 && (
          <span className="text-muted-foreground">
            В работе: <strong className="text-amber-400">{busyIds.length}</strong>
          </span>
        )}
        <span className="text-muted-foreground">
          Выбрано:{" "}
          <strong className={selectedIds.length > 0 ? "text-primary" : "text-foreground"}>
            {selectedIds.length}
          </strong>
        </span>
      </div>

      {/* Search + buttons */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Поиск по телефону, юзернейму..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-background border-border/50"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs border-border/50"
          onClick={selectAll}
        >
          Выбрать все
        </Button>
        {selectedIds.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={clearAll}
          >
            Снять
          </Button>
        )}
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/50">
          <User className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-xs">Аккаунты не найдены</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[380px] overflow-y-auto pr-1">
          {filtered.map((acc) => {
            const stKey = getStatusKey(acc.status);
            const st = STATUS_CONFIG[stKey];
            const isSelected = selectedIds.includes(acc.id);
            const hasProxy = !!(acc.proxy_id || acc.proxy_name || acc.proxy_label);
            const isBusy = busySet.has(acc.id);

            return (
              <button
                key={acc.id}
                onClick={() => toggle(acc.id)}
                disabled={isBusy}
                className={cn(
                  "relative flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-150 group",
                  isBusy
                    ? "border-amber-500/30 bg-amber-500/5 cursor-not-allowed opacity-75"
                    : isSelected
                      ? "border-primary/60 bg-primary/8 shadow-sm shadow-primary/10 cursor-pointer"
                      : "border-border/50 bg-card hover:border-border hover:bg-muted/20 cursor-pointer"
                )}
              >
                {/* Checkmark overlay */}
                <div
                  className={cn(
                    "absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center transition-all",
                    isSelected
                      ? "bg-primary opacity-100 scale-100"
                      : "bg-muted/40 opacity-0 group-hover:opacity-50 scale-90"
                  )}
                >
                  <Check className="h-2.5 w-2.5 text-primary-foreground" />
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full shrink-0 mt-0.5 overflow-hidden">
                  {acc.has_avatar ? (
                    <img
                      src={`/avatars/${acc.id}.jpg`}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // fallback to initials on load error
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                        (e.currentTarget.parentElement as HTMLElement).classList.add(
                          ...getAvatarColor(acc.id).split(" "),
                          "flex", "items-center", "justify-center",
                          "text-[11px]", "font-bold"
                        );
                        (e.currentTarget.parentElement as HTMLElement).textContent = getInitials(acc.name);
                      }}
                    />
                  ) : (
                    <div
                      className={cn(
                        "w-full h-full flex items-center justify-center text-[11px] font-bold",
                        getAvatarColor(acc.id)
                      )}
                    >
                      {getInitials(acc.name)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 pr-4">
                  {/* Phone */}
                  <p className="text-xs font-semibold text-foreground truncate leading-tight">
                    {acc.phone}
                  </p>

                  {/* Username */}
                  {acc.tg_name && (
                    <p className="text-[11px] text-muted-foreground truncate">
                      @{acc.tg_name}
                    </p>
                  )}

                  {/* Category / label row */}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {/* Status badge */}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
                        st.bg,
                        st.color
                      )}
                    >
                      <span className={cn("w-1 h-1 rounded-full", st.dot)} />
                      {st.label}
                    </span>

                    {/* Proxy badge */}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]",
                        hasProxy
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-muted/40 text-muted-foreground"
                      )}
                    >
                      <Shield className="h-2.5 w-2.5" />
                      {hasProxy ? "Прокси" : "Без прокси"}
                    </span>

                    {/* Busy badge */}
                    {isBusy && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-400">
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        В работе
                      </span>
                    )}
                  </div>

                  {/* Category */}
                  {acc.category && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">
                      {acc.category}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected summary */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/8 border border-primary/20">
          <Check className="h-3.5 w-3.5 text-primary shrink-0" />
          <p className="text-xs text-primary">
            Выбрано <strong>{selectedIds.length}</strong> аккаунт{selectedIds.length === 1 ? "" : selectedIds.length < 5 ? "а" : "ов"} {label}
          </p>
        </div>
      )}
    </div>
  );
}
