import { useState, useEffect, useRef } from "react";
import { useRunningTask } from "@/hooks/useRunningTask";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Camera, Upload, Clock, Users, Play, Square } from "lucide-react";
import ToolHeader from "@/components/dashboard/ToolHeader";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import AccountSelector, { SelectorAccount } from "@/components/dashboard/AccountSelector";
import ParsedResultSelector from "@/components/dashboard/ParsedResultSelector";

import { Link } from "@tanstack/react-router";

interface LogLine {
  time: string;
  msg: string;
  type: "info" | "success" | "error" | "skip";
}

interface Settings {
  story_url: string;
  tags_per_story: number;
  delay_between_tags: number;
  daily_post_limit: number;
  delay_between_posts_sec: number;
  story_duration_hours: number;
}

const DEFAULT_SETTINGS: Settings = {
  story_url: "",
  tags_per_story: 1,
  delay_between_tags: 5,
  daily_post_limit: 30,
  delay_between_posts_sec: 420,
  story_duration_hours: 24,
};

const LOG_COLORS: Record<string, string> = {
  success: "text-emerald-400",
  error: "text-red-400",
  skip: "text-amber-400",
  info: "text-blue-400",
};

function classifyLog(msg: string): LogLine["type"] {
  const m = msg.toLowerCase();
  if (m.includes("ошиб") || m.includes("error") || m.includes("failed")) return "error";
  if (m.includes("пропущ") || m.includes("skip") || m.includes("не найден")) return "skip";
  if (m.includes("успеш") || m.includes("опублик") || m.includes("tagged") || m.includes("✓")) return "success";
  return "info";
}

const StoryTagger = () => {
  const { toast } = useToast();
  const [allAccounts, setAllAccounts] = useState<SelectorAccount[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [audienceCount, setAudienceCount] = useState(0);
  const [savingSettings, setSavingSettings] = useState(false);

  const { taskId, taskStatus, setTaskId, setTaskStatus, busyAccountIds } = useRunningTask("story_tagger");
  const running = taskStatus === "running";
  const setRunning = (v: boolean) => setTaskStatus(v ? "running" : "idle");
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [logFilter, setLogFilter] = useState<"all" | "success" | "error" | "skip">("all");
  const logsEndRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  // Reconnect logs after page refresh
  useEffect(() => {
    if (taskId && running && !esRef.current) {
      const es = new EventSource(`/api/tasks/${taskId}/logs`);
      esRef.current = es;
      es.onmessage = e => { if (e.data) addLog(e.data); };
      es.addEventListener("done", () => { es.close(); esRef.current = null; setRunning(false); });
      es.onerror = () => { es.close(); esRef.current = null; setRunning(false); };
    }
    return () => { esRef.current?.close(); esRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, running]);

  const [stats, setStats] = useState({ published: 0, mentions: 0, errors: 0 });
  const [results, setResults] = useState<{ account: string; mentions: string; status: string; time: string }[]>([]);

  // Load on mount
  useEffect(() => {
    fetch("/api/accounts", { credentials: "include" })
      .then(r => r.json())
      .then(data => setAllAccounts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingAccounts(false));

    fetch("/api/tools/story_tagger/settings", { credentials: "include" })
      .then(r => r.json())
      .then(data => setSettings(s => ({ ...s, ...data })))
      .catch(() => {});

    fetch("/api/tools/story_tagger/audience-stats", { credentials: "include" })
      .then(r => r.json())
      .then(data => setAudienceCount(data.count ?? 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (logs.length > 0) logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);


  const addLog = (raw: string) => {
    const now = new Date().toTimeString().slice(0, 8);
    setLogs(p => [...p, { time: now, msg: raw, type: classifyLog(raw) }]);
  };

  const handleStart = async () => {
    if (!settings.story_url.trim()) {
      toast({ title: "Укажите ссылку на историю", variant: "destructive" });
      return;
    }
    if (audienceCount === 0) {
      toast({ title: "Загрузите файл аудитории", variant: "destructive" });
      return;
    }
    // Save settings first
    await fetch("/api/tools/story_tagger/settings", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    const res = await fetch("/api/tools/story_tagger/start", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_id: selectedIds.length > 0 ? selectedIds[0] : null }),
    });
    const data = await res.json();
    if (data.error || data.detail) { const msg = data.error || data.detail; addLog("❌ " + msg); toast({ title: "Ошибка запуска", description: msg, variant: "destructive" }); return; }

    const tid = data.task_id;
    if (!tid) { addLog("❌ Неожиданный ответ сервера"); return; }
    setTaskId(tid);
    setRunning(true);
    setLogs([]);
    setStats({ published: 0, mentions: 0, errors: 0 });
    setResults([]);
    addLog("✅ Задача запущена: " + tid);
    toast({ title: "Теггер запущен" });
    // EventSource будет создан автоматически через useEffect
  };

  const handleStop = async () => {
    if (!taskId) return;
    esRef.current?.close();
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE", credentials: "include" });
    setRunning(false);
    addLog("⛔ Задача остановлена");
    toast({ title: "Теггер остановлен" });
  };

  const handleAudienceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/tools/story_tagger/upload-audience", {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    const data = await res.json();
    if (data.ok) setAudienceCount(data.count ?? 0);
    e.target.value = "";
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    await fetch("/api/tools/story_tagger/settings", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSavingSettings(false);
  };

  const filteredLogs = logFilter === "all" ? logs : logs.filter(l => l.type === logFilter);

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1280px]">
      <ToolHeader
        icon={Camera}
        iconBg="bg-pink-500/15"
        iconColor="text-pink-400"
        title="Теггер в историях"
        description="Публикация историй с упоминанием пользователей для привлечения внимания"
        accentColor="from-pink-500/10"
        steps={[
          { label: "Аккаунт", done: selectedIds.length > 0, hint: "Выберите аккаунт" },
          { label: "Аудитория", done: audienceCount > 0, hint: "Загрузите аудиторию" },
          { label: "История", done: settings.story_url.length > 0, hint: "Укажите ссылку на историю" },
        ]}
        running={running}
        onStart={handleStart}
        onStop={handleStop}
        startLabel="Запустить теггер"
        taskId={taskId}
      />

      {/* ACCOUNTS */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-violet-400" /> Выбор аккаунта
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-violet-500/10 rounded-lg p-2 text-center w-fit">
            <span className="text-violet-400 text-xs">Аудитория</span>
            <p className="text-violet-400 font-bold text-lg">{audienceCount}</p>
          </div>
          {loadingAccounts ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
          ) : (
            <AccountSelector accounts={allAccounts} selectedIds={selectedIds} onChange={setSelectedIds} label="для теггера" busyIds={busyAccountIds} />
          )}
        </CardContent>
      </Card>

      {/* SETTINGS */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">⚙️ Настройки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* LEFT */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Link className="h-3 w-3" /> Ссылка на историю (t.me/...)
                </label>
                <Input
                  placeholder="https://t.me/c/123456/789"
                  value={settings.story_url}
                  onChange={e => setSettings(s => ({ ...s, story_url: e.target.value }))}
                  className="bg-background border-border/50 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Упоминаний на историю</label>
                <Input
                  type="number"
                  min={1} max={5}
                  value={settings.tags_per_story}
                  onChange={e => setSettings(s => ({ ...s, tags_per_story: +e.target.value }))}
                  className="bg-background border-border/50 text-xs"
                />
                <p className="text-[10px] text-muted-foreground">Максимум 5 по ограничениям Telegram</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Задержка между тегами (сек)
                </label>
                <Input
                  type="number"
                  min={5}
                  value={settings.delay_between_tags}
                  onChange={e => setSettings(s => ({ ...s, delay_between_tags: +e.target.value }))}
                  className="bg-background border-border/50 text-xs"
                />
              </div>
            </div>

            {/* RIGHT */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Дневной лимит публикаций</label>
                <Input
                  type="number"
                  min={1}
                  value={settings.daily_post_limit}
                  onChange={e => setSettings(s => ({ ...s, daily_post_limit: +e.target.value }))}
                  className="bg-background border-border/50 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Задержка между публикациями (сек)</label>
                <Input
                  type="number"
                  min={60}
                  value={settings.delay_between_posts_sec}
                  onChange={e => setSettings(s => ({ ...s, delay_between_posts_sec: +e.target.value }))}
                  className="bg-background border-border/50 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Длительность истории (часов)</label>
                <Input
                  type="number"
                  min={6} max={48}
                  value={settings.story_duration_hours}
                  onChange={e => setSettings(s => ({ ...s, story_duration_hours: +e.target.value }))}
                  className="bg-background border-border/50 text-xs"
                />
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="border-border/50"
            onClick={saveSettings}
            disabled={savingSettings}
          >
            {savingSettings ? "Сохранение..." : "💾 Сохранить настройки"}
          </Button>
        </CardContent>
      </Card>

      {/* AUDIENCE */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-violet-400" /> Аудитория для упоминаний
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="bg-violet-500/10 rounded-lg p-3 text-center min-w-[100px]">
              <p className="text-violet-400 font-bold text-2xl">{audienceCount}</p>
              <p className="text-xs text-muted-foreground">пользователей</p>
            </div>
            <div className="space-y-2 flex-1">
              <p className="text-xs text-muted-foreground">
                Загрузите .txt файл с @username — по одному на строке. Теггер будет по очереди упоминать каждого.
              </p>
              <label className="cursor-pointer">
                <input type="file" accept=".txt" className="hidden" onChange={handleAudienceUpload} />
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/40 bg-background hover:bg-muted/20 transition-colors w-fit">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Загрузить файл аудитории</span>
                </div>
              </label>
            </div>
          </div>
          <ParsedResultSelector
            importEndpoint="/api/tools/story_tagger/import-from-library"
            onImported={(count: number) => {
              setAudienceCount(count);
              toast({ title: `Загружено ${count} пользователей из библиотеки` });
            }}
          />
        </CardContent>
      </Card>

      {/* LAUNCH */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-violet-500/20 text-violet-400 border-0">Аккаунтов: {selectedIds.length > 0 ? selectedIds.length : "не выбрано"}</Badge>
                <Badge className="bg-primary/20 text-primary border-0">Аудитория: {audienceCount}</Badge>
                <Badge className={cn("border-0", running ? "bg-emerald-500/20 text-emerald-400" : "bg-muted/30 text-muted-foreground")}>
                  {running ? "● Запущено" : "● Остановлено"}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              {!running ? (
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleStart}
                  disabled={!settings.story_url || audienceCount === 0}
                >
                  <Play className="h-4 w-4 mr-2" /> Запустить теггер
                </Button>
              ) : (
                <Button variant="destructive" onClick={handleStop}>
                  <Square className="h-4 w-4 mr-2" /> Остановить
                </Button>
              )}
            </div>
          </div>
          {!settings.story_url && (
            <p className="text-xs text-amber-400 mt-2">⚠ Укажите ссылку на историю в настройках</p>
          )}
          {audienceCount === 0 && (
            <p className="text-xs text-amber-400 mt-1">⚠ Загрузите файл аудитории</p>
          )}
        </CardContent>
      </Card>

      {/* LOGS */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">📋 Журнал</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-1">
            {(["all", "success", "error", "skip"] as const).map(f => (
              <button
                key={f}
                onClick={() => setLogFilter(f)}
                className={cn(
                  "px-3 py-1 rounded text-[10px] font-medium transition-all",
                  logFilter === f ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted/20"
                )}
              >
                {f === "all" ? "ВСЕ" : f === "success" ? "УСПЕХ" : f === "error" ? "ОШИБКИ" : "ПРОПУЩЕНО"}
              </button>
            ))}
          </div>
          <div className="bg-background rounded-lg p-3 font-mono text-xs space-y-1 max-h-[240px] overflow-y-auto border border-border/30">
            {filteredLogs.length === 0 ? (
              <p className="text-muted-foreground">Журнал пуст. Запустите задачу.</p>
            ) : (
              filteredLogs.map((l, i) => (
                <div key={i} className={cn("flex gap-2", LOG_COLORS[l.type] || "text-muted-foreground")}>
                  <span className="text-muted-foreground shrink-0">{l.time}</span>
                  <span>{l.msg}</span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* STATS */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">📊 Статистика сессии</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="bg-primary/10 rounded-lg p-2 text-center">
              <span className="text-primary">Публикаций</span>
              <p className="text-primary font-bold text-lg">{stats.published}</p>
            </div>
            <div className="bg-violet-500/10 rounded-lg p-2 text-center">
              <span className="text-violet-400">Упоминаний</span>
              <p className="text-violet-400 font-bold text-lg">{stats.mentions}</p>
            </div>
            <div className="bg-red-500/10 rounded-lg p-2 text-center">
              <span className="text-red-400">Ошибок</span>
              <p className="text-red-400 font-bold text-lg">{stats.errors}</p>
            </div>
            <div className="bg-emerald-500/10 rounded-lg p-2 text-center">
              <span className="text-emerald-400">Успешность</span>
              <p className="text-emerald-400 font-bold text-lg">
                {stats.published + stats.errors > 0
                  ? Math.round((stats.published / (stats.published + stats.errors)) * 100) + "%"
                  : "—"}
              </p>
            </div>
          </div>

          {results.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30">
                    <TableHead className="text-xs text-muted-foreground">АККАУНТ</TableHead>
                    <TableHead className="text-xs text-muted-foreground">УПОМИНАНИЯ</TableHead>
                    <TableHead className="text-xs text-muted-foreground">СТАТУС</TableHead>
                    <TableHead className="text-xs text-muted-foreground">ВРЕМЯ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r, i) => (
                    <TableRow key={i} className="border-border/30">
                      <TableCell className="text-xs text-foreground">{r.account}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.mentions}</TableCell>
                      <TableCell>
                        <Badge className={cn("border-0 text-xs",
                          r.status === "success" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                        )}>
                          {r.status === "success" ? "✓ Успешно" : "⚠ Частично"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StoryTagger;
