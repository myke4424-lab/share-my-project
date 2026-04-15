import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Server, Plus, Trash2, CheckCircle2, Loader2, X, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Proxy {
  id: number;
  name: string;
  proxy_type: string;
  host: string;
  port: number;
  username?: string;
  panel_user_id?: number;
  last_check_ok?: number | null;
  last_checked_at?: number | null;
}

interface GeoInfo { country_code: string; country: string; city: string; }

interface TestResult {
  ok: boolean;
  latency_ms?: number;
  error?: string;
}

async function apiFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, { credentials: "include", ...init });
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  const text = await res.text().catch(() => "");
  const clean = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
  return { error: `HTTP ${res.status}${clean ? ": " + clean : ""}` };
}

const statusDot: Record<string, string> = {
  ok:       "bg-emerald-400",
  slow:     "bg-amber-400",
  error:    "bg-red-400",
  checking: "bg-primary animate-pulse",
  none:     "bg-muted-foreground/40",
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialShowAdd?: boolean;
}

export default function ProxyPoolModal({ open, onOpenChange, initialShowAdd }: Props) {
  const { toast } = useToast();
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<number, TestResult & { status: string }>>({});
  const [testingAll, setTestingAll] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [geoResults, setGeoResults] = useState<Record<number, GeoInfo>>({});

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [addStr, setAddStr] = useState("");
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/proxies");
      if (Array.isArray(data)) setProxies(data);
      else toast({ title: data.error || "Ошибка загрузки", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      load();
      if (initialShowAdd) setShowAdd(true);
    }
  }, [open]);

  const testOne = async (proxy: Proxy) => {
    setTestResults(prev => ({ ...prev, [proxy.id]: { ok: false, status: "checking" } }));
    // Строим proxy_str из полей — пароль запросим отдельным endpoint'ом
    // Используем /api/proxies/test с proxy_id чтобы сервер сам достал пароль
    const d = await apiFetch("/api/proxies/test-by-id", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proxy_id: proxy.id }),
    });
    const latency = d.latency_ms || 0;
    const status = d.ok ? (latency > 3000 ? "slow" : "ok") : "error";
    setTestResults(prev => ({ ...prev, [proxy.id]: { ...d, status } }));
  };

  const testAll = async () => {
    const snapshot = [...proxies];
    setTestingAll(true);
    const results = await Promise.all(snapshot.map(async (proxy) => {
      setTestResults(prev => ({ ...prev, [proxy.id]: { ok: false, status: "checking" } }));
      const d = await apiFetch("/api/proxies/test-by-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proxy_id: proxy.id }),
      });
      const latency = d.latency_ms || 0;
      const status = d.ok ? (latency > 3000 ? "slow" : "ok") : "error";
      setTestResults(prev => ({ ...prev, [proxy.id]: { ...d, status } }));
      return d.ok;
    }));
    setTestingAll(false);
    const ok = results.filter(Boolean).length;
    toast({ title: `Проверка завершена: ${ok}/${snapshot.length} рабочих` });
  };

  const fetchGeo = async (proxy: Proxy) => {
    const d = await apiFetch(`/api/proxies/${proxy.id}/geo`);
    if (d.ok && d.country_code) {
      setGeoResults(prev => ({ ...prev, [proxy.id]: d }));
    } else if (d.error) {
      toast({ title: `GEO: ${d.error}`, variant: "destructive" });
    }
  };

  const fetchAllGeo = async () => {
    const results = await Promise.allSettled(proxies.map(fetchGeo));
    const failed = results.filter(r => r.status === "rejected").length;
    if (failed > 0) toast({ title: `GEO: не удалось загрузить для ${failed} прокси`, variant: "destructive" });
    else toast({ title: "GEO загружен" });
  };

  const deleteProxy = async (id: number) => {
    setDeleting(id);
    const d = await apiFetch(`/api/proxies/${id}`, { method: "DELETE" });
    if (d.ok !== false && !d.error) {
      setProxies(prev => prev.filter(p => p.id !== id));
      setTestResults(prev => { const r = { ...prev }; delete r[id]; return r; });
    } else {
      toast({ title: d.error || "Ошибка удаления", variant: "destructive" });
    }
    setDeleting(null);
  };

  const addProxies = async () => {
    const lines = addStr.split("\n").map(s => s.trim()).filter(Boolean);
    if (!lines.length) return;
    setAdding(true);
    const d = await apiFetch("/api/proxies/bulk-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proxies: lines }),
    });
    setAdding(false);
    if (d.ok) {
      toast({ title: `Добавлено ${d.saved} прокси` });
      setAddStr("");
      setShowAdd(false);
      load();
    } else {
      toast({ title: d.error || "Ошибка добавления", variant: "destructive", duration: 8000 });
    }
  };

  const working = proxies.filter(p => testResults[p.id]?.status === "ok" || testResults[p.id]?.status === "slow").length;
  const failed  = proxies.filter(p => testResults[p.id]?.status === "error").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Server className="h-5 w-5 text-emerald-500" /> Пул Прокси
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stats */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>Всего: <strong className="text-foreground">{proxies.length}</strong></span>
            {working > 0 && <span className="text-emerald-400">Рабочих: <strong>{working}</strong></span>}
            {failed  > 0 && <span className="text-red-400">Нерабочих: <strong>{failed}</strong></span>}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm" variant="outline"
              className="gap-1.5 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
              onClick={() => setShowAdd(v => !v)}
            >
              <Plus className="h-3.5 w-3.5" /> Добавить прокси
            </Button>
            <Button
              size="sm" variant="outline"
              className="gap-1.5"
              onClick={testAll}
              disabled={testingAll || !proxies.length}
            >
              {testingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Проверить все
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 border-blue-500/30 text-blue-400 hover:bg-blue-500/10" onClick={fetchAllGeo} disabled={!proxies.length}>
              🌍 GEO все
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Обновить
            </Button>
          </div>

          {/* Add form */}
          {showAdd && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
              <p className="text-xs text-muted-foreground">
                По одному на строку: <code className="bg-muted px-1 rounded">socks5://user:pass@ip:port</code> или <code className="bg-muted px-1 rounded">ip:port</code>
              </p>
              <textarea
                className="w-full h-28 bg-background border border-border rounded-lg p-3 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder={"socks5://user:pass@ip:port\nhttp://user:pass@ip:port\nip:port"}
                value={addStr}
                onChange={e => setAddStr(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" className="gap-1.5 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20" variant="ghost" onClick={addProxies} disabled={adding || !addStr.trim()}>
                  {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Сохранить
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowAdd(false); setAddStr(""); }}>
                  <X className="h-3.5 w-3.5" /> Отмена
                </Button>
              </div>
            </div>
          )}

          {/* Proxy list */}
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : proxies.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Server className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Прокси не добавлены</p>
              <p className="text-xs opacity-60">Нажмите «Добавить прокси» чтобы начать</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    {["Статус", "GEO", "Прокси", "Тип", "Задержка", ""].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {proxies.map(proxy => {
                    const res = testResults[proxy.id];
                    const dot = statusDot[res?.status ?? "none"];
                    return (
                      <tr key={proxy.id} className="border-b border-border/30 last:border-0 hover:bg-secondary/20 transition-colors">
                        <td className="px-3 py-2.5">
                          <span className={cn("w-2 h-2 rounded-full inline-block", dot)} />
                        </td>
                        <td className="px-3 py-2.5">
                          {geoResults[proxy.id] ? (
                            <span className="flex items-center gap-1 text-xs" title={`${geoResults[proxy.id].country}, ${geoResults[proxy.id].city}`}>
                              <img
                                src={`https://flagcdn.com/16x12/${geoResults[proxy.id].country_code.toLowerCase()}.png`}
                                alt={geoResults[proxy.id].country_code}
                                className="w-4 h-3 object-cover rounded-sm"
                                onError={e => { e.currentTarget.style.display = "none"; }}
                              />
                              <span className="text-muted-foreground">{geoResults[proxy.id].country_code}</span>
                            </span>
                          ) : (
                            <button className="text-[10px] text-muted-foreground/50 hover:text-primary transition-colors" onClick={() => fetchGeo(proxy)}>
                              —
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-foreground">
                          {proxy.username ? `${proxy.username}:***@` : ""}{proxy.host}:{proxy.port}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] uppercase">
                            {proxy.proxy_type}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          {res?.status === "ok"   && <span className="text-emerald-400">{res.latency_ms}ms</span>}
                          {res?.status === "slow" && <span className="text-amber-400">{res.latency_ms}ms</span>}
                          {res?.status === "error" && <span className="text-red-400 max-w-[150px] truncate block" title={res.error}>{res.error || "Недоступен"}</span>}
                          {res?.status === "checking" && <span className="text-muted-foreground">проверка...</span>}
                          {!res && <span className="text-muted-foreground/40">—</span>}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1">
                            <button
                              className="text-muted-foreground hover:text-primary transition-colors p-0.5"
                              title="Проверить"
                              onClick={() => testOne(proxy)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                              title="Удалить"
                              onClick={() => deleteProxy(proxy.id)}
                              disabled={deleting === proxy.id}
                            >
                              {deleting === proxy.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Trash2 className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Работает</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Медленный</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" /> Не работает</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted-foreground/40" /> Не проверен</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
