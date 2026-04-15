import { useEffect, useState } from "react";
import { Shield, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface AccountHealth {
  id: number;
  age_days: number;
  safe_daily_limit: number;
  is_quarantined: boolean;
  quarantine_until: number;
  risk: "low" | "medium" | "high";
}

interface HealthData {
  accounts: AccountHealth[];
  overall_safe_limit: number;
  quarantined_count: number;
  high_risk_count: number;
}

interface Props {
  enabled: boolean;
  onToggle: (v: boolean) => void;
  accountIds: number[];
  tool?: string;
  /** Если передан — показываем рекомендованный лимит в родителе */
  onLimitChange?: (limit: number) => void;
}

export default function AiProtectionPanel({
  enabled, onToggle, accountIds, tool = "inviting", onLimitChange,
}: Props) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || accountIds.length === 0) { setHealth(null); return; }
    setLoading(true);
    fetch("/api/ai-protection/account-health", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_ids: accountIds, tool }),
    })
      .then(r => r.json())
      .then((d: HealthData) => {
        setHealth(d);
        onLimitChange?.(d.overall_safe_limit);
      })
      .catch(() => setHealth(null))
      .finally(() => setLoading(false));
  }, [enabled, accountIds.join(","), tool]);

  const hasWarning = health && (health.quarantined_count > 0 || health.high_risk_count > 0);

  return (
    <div className="space-y-2">
      {/* Toggle row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className={cn("h-3.5 w-3.5", enabled ? "text-emerald-400" : "text-muted-foreground")} />
          <span className="text-[11px] text-foreground font-medium">AI Protection</span>
          {enabled && hasWarning && (
            <AlertTriangle className="h-3 w-3 text-amber-400" />
          )}
          {enabled && health && !hasWarning && (
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
          )}
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>

      {/* Detail panel — only when enabled */}
      {enabled && (
        <div className="rounded-lg bg-muted/30 border border-border/40 p-2.5 space-y-1.5">
          {loading && (
            <p className="text-[10px] text-muted-foreground">Анализ аккаунтов...</p>
          )}

          {!loading && !health && accountIds.length === 0 && (
            <p className="text-[10px] text-muted-foreground">Выберите аккаунты для анализа</p>
          )}

          {!loading && health && (
            <>
              {/* Overall safe limit */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Безопасный лимит/день</span>
                <span className="text-[10px] font-semibold text-emerald-400">
                  ≤ {health.overall_safe_limit}
                </span>
              </div>

              {/* Quarantine warning */}
              {health.quarantined_count > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] text-red-400">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {health.quarantined_count} акк. в карантине PeerFlood
                </div>
              )}

              {/* High risk warning */}
              {health.high_risk_count > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
                  <Clock className="h-3 w-3 shrink-0" />
                  {health.high_risk_count} акк. моложе 14 дней (лимит {health.accounts.find(a => a.risk === "high")?.safe_daily_limit ?? 5}/день)
                </div>
              )}

              {/* Per-account risks */}
              {health.accounts.some(a => a.risk !== "low") && (
                <div className="space-y-0.5 pt-1 border-t border-border/30">
                  {health.accounts.filter(a => a.risk !== "low").map(a => (
                    <div key={a.id} className="flex items-center justify-between text-[9px]">
                      <span className={cn(
                        "font-medium",
                        a.is_quarantined ? "text-red-400" :
                        a.risk === "high" ? "text-amber-400" : "text-yellow-400"
                      )}>
                        ID {a.id}
                        {a.is_quarantined ? " 🚫 карантин" : ` · ${a.age_days}дн`}
                      </span>
                      <span className="text-muted-foreground">≤{a.safe_daily_limit}/день</span>
                    </div>
                  ))}
                </div>
              )}

              {!hasWarning && (
                <p className="text-[10px] text-emerald-400">Все аккаунты в норме</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
