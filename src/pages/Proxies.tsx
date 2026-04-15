import { useState, useEffect } from "react";
import { Plus, Trash2, Shuffle, Globe, Lock, User, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Proxy {
  id: number;
  name: string;
  proxy_type: string;
  host: string;
  port: number;
  username: string;
  password: string;
  created_at: string;
}

const defaultForm = {
  name: "",
  proxy_type: "socks5",
  host: "",
  port: "",
  username: "",
  password: "",
};

export default function Proxies() {
  const { toast } = useToast();
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [bulkText, setBulkText] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkAdding, setBulkAdding] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const loadProxies = async () => {
    try {
      const res = await fetch("/api/proxies", { credentials: "include" });
      if (res.ok) setProxies(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProxies(); }, []);

  const handleAdd = async () => {
    if (!form.host || !form.port) {
      toast({ title: "Ошибка", description: "Хост и порт обязательны", variant: "destructive" });
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/proxies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, port: parseInt(form.port) }),
      });
      const data = await res.json();
      if (data.ok) {
        toast({ title: "Прокси добавлен" });
        setForm(defaultForm);
        setShowForm(false);
        loadProxies();
      } else {
        toast({ title: "Ошибка", description: data.error || data.detail || "Не удалось добавить", variant: "destructive" });
      }
    } finally {
      setAdding(false);
    }
  };

  const parseBulkLine = (line: string) => {
    // Formats: host:port:user:pass  or  type://user:pass@host:port  or  host:port
    line = line.trim();
    if (!line) return null;

    // socks5://user:pass@host:port
    const schemeMatch = line.match(/^(socks5|socks4|http):\/\/(?:([^:@]+):([^@]*)@)?([^:]+):(\d+)$/i);
    if (schemeMatch) {
      const port = parseInt(schemeMatch[5]);
      if (isNaN(port) || port < 1 || port > 65535) return null;
      return {
        proxy_type: schemeMatch[1].toLowerCase(),
        username: schemeMatch[2] || "",
        password: schemeMatch[3] || "",
        host: schemeMatch[4],
        port,
        name: "",
      };
    }
    // host:port:user:pass or host:port
    const parts = line.split(":");
    if (parts.length >= 2) {
      const port = parseInt(parts[1]);
      if (isNaN(port) || port < 1 || port > 65535) return null;
      return {
        proxy_type: "socks5",
        host: parts[0],
        port,
        username: parts[2] || "",
        password: parts[3] || "",
        name: "",
      };
    }
    return null;
  };

  const handleBulkAdd = async () => {
    const lines = bulkText.split("\n").filter(l => l.trim());
    const parsed = lines.map(parseBulkLine).filter(Boolean) as any[];
    if (parsed.length === 0) {
      toast({ title: "Ошибка", description: "Не удалось распарсить ни одной строки", variant: "destructive" });
      return;
    }
    setBulkAdding(true);
    try {
      const res = await fetch("/api/proxies/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ proxies: parsed }),
      });
      const data = await res.json();
      const added = data.added ?? 0;
      toast({ title: `Добавлено ${added} из ${parsed.length} прокси` });
    } catch {
      toast({ title: "Ошибка при добавлении прокси", variant: "destructive" });
    }
    setBulkAdding(false);
    setBulkText("");
    setBulkMode(false);
    loadProxies();
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/proxies/${id}`, { method: "DELETE", credentials: "include" });
    const data = await res.json();
    if (data.ok) {
      setProxies(p => p.filter(x => x.id !== id));
      toast({ title: "Прокси удалён" });
    }
  };

  const proxyToDelete = proxies.find(p => p.id === confirmDeleteId);

  const handleDistribute = async () => {
    setDistributing(true);
    try {
      const res = await fetch("/api/proxies/distribute", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (data.ok) {
        const msg = data.assigned === 0 ? (data.message || "Все аккаунты уже имеют прокси") : `Распределено на ${data.assigned} аккаунт(ов)`;
        toast({ title: "Готово", description: msg });
      } else {
        toast({ title: "Ошибка", description: data.error || data.detail || "Не удалось распределить", variant: "destructive" });
      }
    } finally {
      setDistributing(false);
    }
  };

  const typeColor = (t: string) => {
    if (t === "socks5") return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    if (t === "socks4") return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    return "bg-orange-500/10 text-orange-400 border-orange-500/20";
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Прокси</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {proxies.length} прокси в пуле
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadProxies} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Обновить
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDistribute}
            disabled={distributing || proxies.length === 0}
            className="gap-1.5 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
          >
            <Shuffle className="h-3.5 w-3.5" />
            {distributing ? "Распределяем..." : "Распределить по аккаунтам"}
          </Button>
          <Button
            size="sm"
            onClick={() => { setShowForm(true); setBulkMode(false); }}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> Добавить
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-sm text-blue-300">
        <strong>Распределение из пула</strong> — назначает прокси в режиме round-robin всем аккаунтам, у которых прокси не задан.
        Аккаунты с прокси не затрагиваются.
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-foreground">Новый прокси</h3>
            <div className="flex gap-2 text-xs">
              <button
                onClick={() => setBulkMode(false)}
                className={`px-2.5 py-1 rounded-md transition-colors ${!bulkMode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Одиночный
              </button>
              <button
                onClick={() => setBulkMode(true)}
                className={`px-2.5 py-1 rounded-md transition-colors ${bulkMode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Список
              </button>
            </div>
          </div>

          {!bulkMode ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Тип</Label>
                  <Select value={form.proxy_type} onValueChange={v => setForm(f => ({ ...f, proxy_type: v }))}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="socks5">SOCKS5</SelectItem>
                      <SelectItem value="socks4">SOCKS4</SelectItem>
                      <SelectItem value="http">HTTP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Название (необязательно)</Label>
                  <Input
                    className="h-8 text-sm"
                    placeholder="Мой прокси"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Хост</Label>
                  <Input
                    className="h-8 text-sm"
                    placeholder="192.168.1.1"
                    value={form.host}
                    onChange={e => setForm(f => ({ ...f, host: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Порт</Label>
                  <Input
                    className="h-8 text-sm"
                    placeholder="1080"
                    value={form.port}
                    onChange={e => setForm(f => ({ ...f, port: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Логин (необязательно)</Label>
                  <Input
                    className="h-8 text-sm"
                    placeholder="user"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Пароль (необязательно)</Label>
                  <Input
                    className="h-8 text-sm"
                    type="password"
                    placeholder="••••••"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setForm(defaultForm); }}>
                  Отмена
                </Button>
                <Button size="sm" onClick={handleAdd} disabled={adding}>
                  {adding ? "Добавляем..." : "Добавить"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Один прокси на строку. Форматы:
                  <code className="ml-1 bg-muted px-1 rounded text-[10px]">host:port</code>
                  <code className="ml-1 bg-muted px-1 rounded text-[10px]">host:port:user:pass</code>
                  <code className="ml-1 bg-muted px-1 rounded text-[10px]">socks5://user:pass@host:port</code>
                </Label>
                <textarea
                  className="w-full h-36 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder={"192.168.1.1:1080\n192.168.1.2:1080:user:pass\nsocks5://user:pass@1.2.3.4:1080"}
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setBulkText(""); }}>
                  Отмена
                </Button>
                <Button size="sm" onClick={handleBulkAdd} disabled={bulkAdding || !bulkText.trim()}>
                  {bulkAdding
                    ? "Добавляем..."
                    : `Добавить ${bulkText.split("\n").filter(l => l.trim()).length} прокси`}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Proxy list */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
      ) : proxies.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Globe className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Прокси не добавлены</p>
          <p className="text-xs mt-1">Нажмите «Добавить», чтобы добавить прокси в пул</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Тип</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Хост:Порт</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Название</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Авторизация</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {proxies.map(p => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${typeColor(p.proxy_type)}`}>
                      {p.proxy_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[13px] text-foreground">
                    {p.host}:{p.port}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {p.name || <span className="opacity-40">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {p.username ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" /> {p.username}
                        <Lock className="h-3 w-3 ml-1" /> ••••
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">без авторизации</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setConfirmDeleteId(p.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={confirmDeleteId !== null} onOpenChange={v => { if (!v) setConfirmDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить прокси?</AlertDialogTitle>
            <AlertDialogDescription>
              Прокси <strong>{proxyToDelete?.name || proxyToDelete?.host}</strong> будет удалён. Аккаунты, которые его используют, останутся без прокси.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => { if (confirmDeleteId !== null) { handleDelete(confirmDeleteId); setConfirmDeleteId(null); } }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
