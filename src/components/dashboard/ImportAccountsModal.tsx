import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Upload, FileText, FolderOpen, Shield, CheckCircle2, Save,
  Trash2, X, Download, Loader2, Database, Plus, ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import JSZip from "jszip";

/** Безопасный fetch — всегда возвращает объект, не бросает при не-JSON ответе */
async function safeFetch(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, { credentials: "include", ...init });
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return res.json().catch(() => ({ error: "Не удалось разобрать ответ сервера" }));
  }
  // Не JSON — читаем текст и вырезаем HTML-теги для читаемости
  const text = await res.text().catch(() => "");
  const clean = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
  return { error: `HTTP ${res.status}${clean ? ": " + clean : ""}` };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported?: () => void;
}

interface UploadedAccount {
  file: File;
  phone: string;
  name?: string;
  username?: string;
  status: "pending" | "checking" | "ok" | "error";
  detail?: string;
  proxy?: string;
  proxyStatus: "none" | "checking" | "ok" | "slow" | "error";
  format?: "session" | "tdata";
}

interface PoolProxy {
  line: string;
  status: "none" | "checking" | "ok" | "slow" | "error";
  latency?: number;
  error?: string;
}

interface DbProxy {
  id: number;
  name: string;
  type: string;
  host: string;
  port: number;
  user?: string;
}

const proxyDot: Record<string, { color: string; label: string }> = {
  ok:       { color: "bg-emerald-400", label: "Работает" },
  slow:     { color: "bg-amber-400",   label: "Медленный" },
  error:    { color: "bg-red-400",     label: "Не работает" },
  none:     { color: "bg-muted-foreground", label: "Не проверен" },
  checking: { color: "bg-primary animate-pulse", label: "Проверка..." },
};

const accDot: Record<string, { color: string; label: string }> = {
  ok:       { color: "bg-emerald-400", label: "OK" },
  error:    { color: "bg-red-400",     label: "Ошибка" },
  pending:  { color: "bg-muted-foreground", label: "Не загружен" },
  checking: { color: "bg-primary animate-pulse", label: "Импорт..." },
};

const ImportAccountsModal = ({ open, onOpenChange, onImported }: Props) => {
  const { toast } = useToast();

  const [importMode, setImportMode] = useState<"session" | "tdata">("session");
  const [accounts, setAccounts] = useState<UploadedAccount[]>([]);
  const [proxyPool, setProxyPool] = useState("");
  const [poolProxies, setPoolProxies] = useState<PoolProxy[]>([]);
  const [uploading, setUploading] = useState(false);
  const [checkingAccs, setCheckingAccs] = useState(false);
  const [checkingProxies, setCheckingProxies] = useState(false);
  const [loadingDbProxies, setLoadingDbProxies] = useState(false);
  const [savingProxies, setSavingProxies] = useState(false);
  const [saved, setSaved] = useState(0);

  // Session proxy state (from DB)
  const [sessionProxyId, setSessionProxyId] = useState<number | null>(null);
  const [sessionDbProxies, setSessionDbProxies] = useState<DbProxy[]>([]);

  // Device type for .session import (affects api_id/api_hash stored in DB)
  const [deviceType, setDeviceType] = useState<"desktop" | "android">("desktop");
  const DEVICE_CREDS = {
    desktop: { api_id: "2040",  api_hash: "b18441a1ff607e10a989891a5462e627", label: "Telegram Desktop" },
    android: { api_id: "6",     api_hash: "eb06d4abfb49dc3eeb1aeb98ae0f581e", label: "Telegram Android" },
  };

  // TData state
  const [tdataZip, setTdataZip] = useState<File | null>(null);
  const [tdataProxies, setTdataProxies] = useState<DbProxy[]>([]);
  const [tdataProxyId, setTdataProxyId] = useState<number | null>(null);
  const [tdataUploading, setTdataUploading] = useState(false);
  const [tdataProxyStr, setTdataProxyStr] = useState("");  // inline proxy string
  const [tdataDragOver, setTdataDragOver] = useState(false);
  const [noProxyWarning, setNoProxyWarning] = useState(false);

  const sessionRef = useRef<HTMLInputElement>(null);
  const tdataRef = useRef<HTMLInputElement>(null);       // ZIP input
  const tdataFolderRef = useRef<HTMLInputElement>(null); // folder input

  const parsePoolLines = (text: string): string[] =>
    text.split("\n").map(s => s.trim()).filter(Boolean);

  // Load DB proxies
  const loadDbProxies = async () => {
    try {
      const data = await safeFetch("/api/converter/proxies");
      const list = Array.isArray(data) ? data : [];
      setTdataProxies(list);
      setSessionDbProxies(list);
      if (list.length > 0) {
        setTdataProxyId(list[0].id);
        setSessionProxyId(list[0].id);
      }
    } catch {
      setTdataProxies([]);
      setSessionDbProxies([]);
    }
  };

  useEffect(() => {
    if (open) loadDbProxies();
  }, [open]);

  const switchMode = (mode: "session" | "tdata") => {
    setImportMode(mode);
  };

  // Add .session files to table
  const addSessionFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles = Array.from(fileList).filter((f) => f.name.endsWith(".session"));
    setAccounts((prev) => {
      const existing = new Set(prev.map((a) => a.file.name));
      const toAdd: UploadedAccount[] = newFiles
        .filter((f) => !existing.has(f.name))
        .map((f) => ({
          file: f,
          phone: f.name.replace(".session", ""),
          status: "pending",
          proxyStatus: "none",
          format: "session",
        }));
      return [...prev, ...toAdd];
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addSessionFiles(e.dataTransfer.files);
  };

  // Рекурсивно читает FileSystemEntry в объект {path: File}
  const readEntryRecursive = (entry: FileSystemEntry, basePath = ""): Promise<{path: string; file: File}[]> => {
    return new Promise((resolve) => {
      if (entry.isFile) {
        (entry as FileSystemFileEntry).file(f => resolve([{ path: basePath + f.name, file: f }]));
      } else if (entry.isDirectory) {
        const reader = (entry as FileSystemDirectoryEntry).createReader();
        const allEntries: FileSystemEntry[] = [];
        const readBatch = () => {
          reader.readEntries(async (batch) => {
            if (!batch.length) {
              const nested = await Promise.all(allEntries.map(e => readEntryRecursive(e, basePath + entry.name + "/")));
              resolve(nested.flat());
            } else {
              allEntries.push(...batch);
              readBatch();
            }
          });
        };
        readBatch();
      } else {
        resolve([]);
      }
    });
  };

  // Упаковывает файлы в ZIP через JSZip
  const packToZip = async (files: {path: string; file: File}[]): Promise<File> => {
    const zip = new JSZip();
    for (const { path, file } of files) {
      const buf = await file.arrayBuffer();
      zip.file(path, buf);
    }
    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
    return new File([blob], "tdata.zip", { type: "application/zip" });
  };

  // Сразу импортирует ZIP на сервер и заполняет строку реальными данными
  const importTdataZip = async (zipFile: File) => {
    const rowKey = `tdata_${Date.now()}`;
    const sizeMB = (zipFile.size / 1024 / 1024).toFixed(1);
    // Добавляем строку в состоянии "проверка"
    setAccounts(prev => [
      ...prev.filter(a => a.format !== "tdata" || a.status === "ok"),
      { file: zipFile, phone: `Загрузка... (${sizeMB}MB)`, status: "checking", proxyStatus: "none", format: "tdata", detail: rowKey },
    ]);
    try {
      const fd = new FormData();
      fd.append("tdata_zip", zipFile);
      const hasProxy = !!tdataProxyId;
      if (tdataProxyId) fd.append("proxy_id", String(tdataProxyId));

      const d = await safeFetch("/api/accounts/tdata/import", { method: "POST", body: fd });

      if (d.error || !d.ok) {
        const errMsg = d.error || d.detail || "Ошибка импорта";
        setAccounts(prev => prev.map(a =>
          a.detail === rowKey ? { ...a, status: "error", phone: "Ошибка", detail: errMsg } : a
        ));
        toast({ title: "Ошибка импорта TData", description: errMsg, variant: "destructive", duration: 10000 });
      } else {
        setAccounts(prev => prev.map(a =>
          a.detail === rowKey ? {
            ...a,
            status: "ok",
            phone: d.phone || "Неизвестен",
            name: d.name || d.username || d.phone || "Неизвестен",
            username: d.username || "",
            detail: "Импортирован из TData",
          } : a
        ));
        if (!hasProxy) setNoProxyWarning(true);
        else setNoProxyWarning(false);
        onImported?.();
        toast({ title: `✅ Импортирован: ${d.phone || d.username || "аккаунт"}` });
      }
    } catch (err: any) {
      setAccounts(prev => prev.map(a =>
        a.detail === rowKey ? { ...a, status: "error", phone: "Ошибка", detail: err.message } : a
      ));
      toast({ title: "Ошибка", description: err.message, variant: "destructive", duration: 10000 });
    }
  };

  // Обрабатывает drop — одна или несколько папок / ZIP
  const handleTdataDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setTdataDragOver(false);
    const items = Array.from(e.dataTransfer.items);

    const folderItems = items.filter(i => i.kind === "file" && i.webkitGetAsEntry()?.isDirectory);
    if (folderItems.length > 0) {
      // Может быть несколько папок — обрабатываем все последовательно
      toast({ title: `Найдено ${folderItems.length} папок, начинаем импорт...` });
      for (const item of folderItems) {
        const entry = item.webkitGetAsEntry();
        if (!entry) continue;
        setTdataUploading(true);
        try {
          const files = await readEntryRecursive(entry);
          if (!files.length) { toast({ title: `Папка «${entry.name}» пустая`, variant: "destructive" }); continue; }
          const zipFile = await packToZip(files);
          setTdataUploading(false);
          await importTdataZip(zipFile);
        } catch (err: any) {
          toast({ title: "Ошибка упаковки", description: err.message, variant: "destructive" });
          setTdataUploading(false);
        }
      }
      return;
    }

    // ZIP файлы — тоже можно несколько
    const fileItems = items.filter(i => i.kind === "file");
    const zips = fileItems.map(i => i.getAsFile()).filter(f => f?.name.endsWith(".zip")) as File[];
    if (zips.length > 0) {
      for (const f of zips) await importTdataZip(f);
    } else if (fileItems.length > 0) {
      toast({ title: "Перетащите папки tdata или ZIP-архивы", variant: "destructive" });
    }
  };

  // Обрабатывает выбор папки через input[webkitdirectory]
  const handleFolderSelect = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setTdataUploading(true);
    toast({ title: "Упаковка папки..." });
    try {
      const entries = Array.from(files).map(f => ({
        path: (f as any).webkitRelativePath || f.name,
        file: f,
      }));
      const zipFile = await packToZip(entries);
      toast({ title: `Упаковано ${entries.length} файлов, импортируем...` });
      setTdataUploading(false);
      await importTdataZip(zipFile);
    } catch (err: any) {
      toast({ title: "Ошибка упаковки", description: err.message, variant: "destructive" });
      setTdataUploading(false);
    }
  };

  // Обрабатывает ZIP-файл напрямую
  const handleTdataZipFile = (f: File | null) => {
    if (!f) return;
    if (!f.name.endsWith(".zip")) {
      toast({ title: "Нужен ZIP-архив или папка tdata", variant: "destructive" });
      return;
    }
    setTdataZip(f);
  };

  const uploadTData = async () => {
    if (!tdataZip) { toast({ title: "Выберите ZIP-файл", variant: "destructive" }); return; }
    setTdataUploading(true);
    try {
      const fd = new FormData();
      fd.append("tdata_zip", tdataZip);
      if (tdataProxyId) fd.append("proxy_id", String(tdataProxyId));
      else if (tdataProxyStr.trim()) fd.append("proxy_str", tdataProxyStr.trim());

      const data = await safeFetch("/api/accounts/tdata/import", {
        method: "POST",
        body: fd,
      });

      if (data.error) {
        toast({ title: "Ошибка импорта TData", description: data.error, variant: "destructive", duration: 10000 });
      } else {
        const proxy = tdataProxies.find(p => p.id === tdataProxyId);
        // Add to accounts table for visual feedback
        const fakeFile = new File([], `${data.phone || "tdata"}.session`);
        setAccounts(prev => [...prev, {
          file: fakeFile,
          phone: data.phone || "Неизвестен",
          status: "ok",
          detail: "Импортирован из TData",
          proxy: proxy ? `${proxy.host}:${proxy.port}` : undefined,
          proxyStatus: proxy ? "ok" : "none",
          format: "tdata",
        }]);
        setTdataZip(null);
        onImported?.();
        toast({ title: "✅ Аккаунт импортирован", description: `Телефон: ${data.phone || "—"}` });
      }
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive", duration: 10000 });
    } finally {
      setTdataUploading(false);
    }
  };

  // Assign proxies from pool to accounts
  const distributeProxies = () => {
    const proxies = parsePoolLines(proxyPool);
    if (!proxies.length) { toast({ title: "Пул прокси пуст", variant: "destructive" }); return; }
    if (!accounts.length) { toast({ title: "Сначала загрузите аккаунты", variant: "destructive" }); return; }
    setAccounts((prev) =>
      prev.map((a, i) => ({ ...a, proxy: proxies[i % proxies.length], proxyStatus: "none" }))
    );
    toast({ title: `Распределено на ${accounts.length} акк.` });
  };

  const clearProxies = () => {
    setAccounts((prev) => prev.map((a) => ({ ...a, proxy: undefined, proxyStatus: "none" })));
  };

  const loadProxiesFromDb = async () => {
    setLoadingDbProxies(true);
    try {
      const data = await safeFetch("/api/proxies");
      if (data.error) throw new Error(data.error);
      if (!data.length) {
        toast({ title: "В базе нет прокси", variant: "destructive" });
        return;
      }
      const lines = data.map((p: any) => {
        const auth = p.username ? `${p.username}:${p.password || ""}@` : "";
        return `${p.proxy_type}://${auth}${p.host}:${p.port}`;
      });
      setProxyPool(lines.join("\n"));
      setPoolProxies(lines.map((l: string) => ({ line: l, status: "none" })));
      toast({ title: `Загружено ${lines.length} прокси из базы` });
    } catch {
      toast({ title: "Ошибка загрузки прокси", variant: "destructive" });
    } finally {
      setLoadingDbProxies(false);
    }
  };

  const checkProxies = async () => {
    const lines = parsePoolLines(proxyPool);
    if (!lines.length) { toast({ title: "Пул прокси пуст", variant: "destructive" }); return; }
    const initial: PoolProxy[] = lines.map(l => ({ line: l, status: "checking" }));
    setPoolProxies(initial);
    setCheckingProxies(true);
    setAccounts(prev => prev.map(a => ({ ...a, proxyStatus: "checking" })));
    const results: PoolProxy[] = [...initial];
    await Promise.all(lines.map(async (line, i) => {
      try {
          const data = await safeFetch("/api/proxies/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proxy_str: line }),
        });
        const latency = data.latency_ms || 0;
        results[i] = { line, status: data.ok ? (latency > 3000 ? "slow" : "ok") : "error", latency: data.latency_ms, error: data.error };
      } catch {
        results[i] = { line, status: "error", error: "Сетевая ошибка" };
      }
      setPoolProxies([...results]);
      setAccounts(prev => prev.map(a => a.proxy === line ? { ...a, proxyStatus: results[i].status } : a));
    }));
    setCheckingProxies(false);
    const ok = results.filter(r => r.status === "ok" || r.status === "slow").length;
    // Update accounts without explicit proxy (tdata imported accounts) with best pool result
    const bestStatus = (results.find(r => r.status === "ok")?.status
      || results.find(r => r.status === "slow")?.status
      || "error") as PoolProxy["status"];
    setAccounts(prev => prev.map(a => !a.proxy ? { ...a, proxyStatus: bestStatus } : a));
    if (bestStatus === "ok" || bestStatus === "slow") setNoProxyWarning(false);
    toast({ title: `Проверка завершена: ${ok}/${lines.length} рабочих` });
  };

  const saveProxiesToDb = async () => {
    const lines = parsePoolLines(proxyPool);
    if (!lines.length) { toast({ title: "Пул прокси пуст", variant: "destructive" }); return; }
    setSavingProxies(true);
    try {
      const data = await safeFetch("/api/proxies/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proxies: lines }),
      });
      if (data.ok) toast({ title: `Сохранено ${data.saved} прокси в базу` });
      else toast({ title: "Ошибка сохранения", variant: "destructive" });
    } catch {
      toast({ title: "Ошибка сохранения", variant: "destructive" });
    } finally {
      setSavingProxies(false);
    }
  };

  const checkAccounts = async () => {
    if (!accounts.length) { toast({ title: "Нет аккаунтов для загрузки", variant: "destructive" }); return; }
    await uploadAll(false);
  };

  const uploadAll = async (closeAfter = true) => {
    if (!accounts.length) { toast({ title: "Нет файлов для загрузки", variant: "destructive" }); return; }
    if (importMode === "session" && !sessionProxyId && accounts.some(a => a.format !== "tdata")) {
      toast({
        title: "⚠️ Прокси не выбран",
        description: "Аккаунты сохранятся, но без прокси ни один инструмент не сможет подключиться к Telegram. Назначьте прокси в менеджере аккаунтов после сохранения.",
        variant: "destructive",
        duration: 8000,
      });
    }
    setUploading(true);
    let ok = 0;
    for (const acc of accounts) {
      if (acc.status === "ok") { ok++; continue; }
      // TData format - upload via tdata endpoint
      if (acc.format === "tdata") {
        const fd = new FormData();
        fd.append("tdata_zip", acc.file);
        const wp = poolProxies.find(p => p.status === "ok" || p.status === "slow");
        if (wp?.id) fd.append("proxy_id", String(wp.id));
        else if (proxyPool.trim()) { const lines = proxyPool.split(String.fromCharCode(10)); const firstLine = lines[0].trim(); if (firstLine) fd.append("proxy_str", firstLine); }
        try {
          const d = await safeFetch("/api/accounts/tdata/import", { method: "POST", body: fd });
          if (d.ok) {
            setAccounts(prev => prev.map(a => a.file.name === acc.file.name ? { ...a, status: "ok", phone: d.phone || "Импортирован", detail: "Импортирован из TData" } : a));
            ok++;
          } else {
            setAccounts(prev => prev.map(a => a.file.name === acc.file.name ? { ...a, status: "error", detail: d.error || d.detail || "Ошибка" } : a));
          }
        } catch {
          setAccounts(prev => prev.map(a => a.file.name === acc.file.name ? { ...a, status: "error", detail: "Сетевая ошибка" } : a));
        }
        continue;
      }
      const form = new FormData();
      form.append("session_file", acc.file);
      form.append("phone", acc.phone);
      form.append("api_id",   DEVICE_CREDS[deviceType].api_id);
      form.append("api_hash", DEVICE_CREDS[deviceType].api_hash);
      if (sessionProxyId) form.append("proxy_id", String(sessionProxyId));
      try {
        const d = await safeFetch("/api/accounts/upload-session", { method: "POST", body: form });
        if (!d.error && !d.detail) {
          const assignedProxy = sessionProxyId
            ? sessionDbProxies.find(p => p.id === sessionProxyId)
            : undefined;
          const proxyLabel = assignedProxy
            ? `${assignedProxy.host}:${assignedProxy.port}`
            : undefined;
          setAccounts((prev) => prev.map((a) => a.file.name === acc.file.name ? {
            ...a, status: "ok", detail: "Загружен",
            proxy: proxyLabel ?? a.proxy,
            proxyStatus: proxyLabel ? "ok" : a.proxyStatus,
          } : a));
          ok++;
        } else {
          setAccounts((prev) => prev.map((a) => a.file.name === acc.file.name ? { ...a, status: "error", detail: d.detail || d.error || "Ошибка" } : a));
        }
      } catch {
        setAccounts((prev) => prev.map((a) => a.file.name === acc.file.name ? { ...a, status: "error", detail: "Сетевая ошибка" } : a));
      }
    }
    setSaved(ok);
    setUploading(false);
    if (ok > 0) onImported?.();
    toast({ title: `Сохранено: ${ok} из ${accounts.length}` });
    if (closeAfter && ok > 0) onOpenChange(false);
  };

  const poolLines = parsePoolLines(proxyPool);
  const withProxy = accounts.filter((a) =>
    a.proxy || (a.format === "session" && !!sessionProxyId) || (a.format === "tdata" && !!tdataProxyId)
  ).length;
  const workingProxy = accounts.filter((a) => a.proxyStatus === "ok" || a.proxyStatus === "slow").length;
  const readyCount = accounts.filter((a) => a.status === "ok").length;
  const poolOk = poolProxies.filter(p => p.status === "ok" || p.status === "slow").length;
  const proxyOnlyMode = poolLines.length > 0 && accounts.length === 0;
  const selectedProxy = tdataProxies.find(p => p.id === tdataProxyId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" /> Импортировать Аккаунты
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">

          {/* ── Upload section ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
                <Upload className="h-3.5 w-3.5 text-primary" />
              </div>
              Загрузка аккаунтов
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* TData card */}
              <button
                className={cn(
                  "panel-card rounded-xl p-5 flex flex-col items-center gap-3 hover:border-orange-400/40 transition-colors group",
                  importMode === "tdata" && "border-orange-400/60 bg-orange-500/5"
                )}
                onClick={() => switchMode("tdata")}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                  importMode === "tdata" ? "bg-orange-500/30" : "bg-orange-500/15 group-hover:bg-orange-500/25"
                )}>
                  <FolderOpen className={cn("h-6 w-6", importMode === "tdata" ? "text-orange-300" : "text-orange-400")} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">TData</p>
                  <p className="text-xs text-muted-foreground">Папки tdata</p>
                  {importMode === "tdata" && (
                    <p className="text-[10px] text-orange-400 mt-1 font-medium">Выбрано</p>
                  )}
                </div>
              </button>

              {/* Session card */}
              <button
                className={cn(
                  "panel-card rounded-xl p-5 flex flex-col items-center gap-3 hover:border-primary/40 transition-colors group",
                  importMode === "session" && "border-primary/60 bg-primary/5"
                )}
                onClick={() => switchMode("session")}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                  importMode === "session" ? "bg-primary/30" : "bg-primary/15 group-hover:bg-primary/25"
                )}>
                  <FileText className={cn("h-6 w-6", importMode === "session" ? "text-primary/80" : "text-primary")} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">.session</p>
                  <p className="text-xs text-muted-foreground">Файлы сессий</p>
                  {importMode === "session" && (
                    <p className="text-[10px] text-primary mt-1 font-medium">Выбрано</p>
                  )}
                </div>
              </button>
            </div>

            {/* TData mode UI */}
            {importMode === "tdata" && (
              <div className="space-y-3">

                {/* Шаг 1 — прокси */}
                <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-xs font-semibold text-violet-300">Прокси для аккаунтов</span>
                    {!tdataProxyId && (
                      <span className="ml-auto text-[10px] text-amber-400 font-medium">⚠ Рекомендуется выбрать</span>
                    )}
                  </div>
                  {tdataProxies.length > 0 ? (
                    <div className="grid gap-1 max-h-36 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => setTdataProxyId(null)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-xs transition-all",
                          tdataProxyId === null
                            ? "border-red-500/40 bg-red-500/5 text-red-400"
                            : "border-border/30 text-muted-foreground hover:border-border/60 hover:text-foreground"
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", tdataProxyId === null ? "bg-red-400" : "bg-muted-foreground/30")} />
                        <span>Без прокси <span className="opacity-60">(не рекомендуется)</span></span>
                      </button>
                      {tdataProxies.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setTdataProxyId(p.id)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-xs transition-all",
                            tdataProxyId === p.id
                              ? "border-emerald-500/40 bg-emerald-500/5"
                              : "border-border/30 hover:border-border/60"
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", tdataProxyId === p.id ? "bg-emerald-400" : "bg-muted-foreground/30")} />
                          <span className={cn("font-medium", tdataProxyId === p.id ? "text-emerald-400" : "text-foreground")}>
                            {p.name || `${p.host}:${p.port}`}
                          </span>
                          <span className="text-muted-foreground font-mono ml-1">{p.host}:{p.port}</span>
                          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">{p.type.toUpperCase()}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Нет прокси в базе — <span className="text-primary">добавьте в разделе Прокси</span> перед импортом</p>
                  )}
                </div>

                {/* Шаг 2 — дроп зона */}
                <div className="rounded-xl border border-border/40 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">2</span>
                    Загрузите папку TData
                  </div>
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 text-muted-foreground transition-colors",
                      tdataDragOver ? "border-orange-400/60 bg-orange-500/5" : "border-border/60 hover:border-orange-400/40",
                      tdataUploading ? "opacity-60 pointer-events-none" : "cursor-pointer"
                    )}
                    onDrop={handleTdataDrop}
                    onDragOver={e => { e.preventDefault(); setTdataDragOver(true); }}
                    onDragLeave={() => setTdataDragOver(false)}
                    onClick={() => tdataFolderRef.current?.click()}
                  >
                    {tdataUploading
                      ? <Loader2 className="h-7 w-7 text-orange-400 animate-spin" />
                      : <FolderOpen className="h-7 w-7 opacity-40 text-orange-400" />}
                    {tdataUploading
                      ? <p className="text-sm text-orange-400">Импорт...</p>
                      : <>
                          <p className="text-sm font-medium">Перетащите папку tdata сюда</p>
                          <p className="text-xs opacity-60">или нажмите · ZIP тоже поддерживается</p>
                        </>}
                  </div>
                  <div className="flex justify-center">
                    <button className="text-xs text-muted-foreground hover:text-orange-400 transition-colors"
                      onClick={e => { e.stopPropagation(); tdataRef.current?.click(); }} type="button">
                      или выбрать ZIP-архив
                    </button>
                  </div>
                </div>

                {/* Скрытые инпуты */}
                <input ref={tdataFolderRef} type="file" className="hidden"
                  {...{ webkitdirectory: "", directory: "" } as any}
                  onChange={e => handleFolderSelect(e.target.files)} />
                <input ref={tdataRef} type="file" accept=".zip" className="hidden"
                  onChange={e => handleTdataZipFile(e.target.files?.[0] ?? null)} />

                {/* Баннер: импортировано без прокси */}
                {noProxyWarning && (
                  <div className="rounded-xl border border-amber-400 bg-amber-400 p-3 flex items-start gap-2">
                    <span className="text-amber-900 text-base shrink-0">⚠️</span>
                    <div className="text-xs text-amber-900">
                      <p className="font-bold">Аккаунт импортирован без прокси</p>
                      <p className="mt-0.5">Введите прокси в поле выше и нажмите «Распределить по аккаунтам» чтобы назначить его.</p>
                    </div>
                    <button className="ml-auto text-amber-800 hover:text-amber-950 shrink-0" onClick={() => setNoProxyWarning(false)}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* Session mode UI */}
            {importMode === "session" && (
              <>
                {/* Proxy selector — обязательно выбрать перед импортом */}
                <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-xs font-semibold text-violet-300">Прокси для аккаунтов</span>
                    {!sessionProxyId && (
                      <span className="ml-auto text-[10px] text-amber-400 font-medium">⚠ Рекомендуется выбрать</span>
                    )}
                  </div>
                  {sessionDbProxies.length > 0 ? (
                    <div className="grid gap-1 max-h-36 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => setSessionProxyId(null)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-xs transition-all",
                          sessionProxyId === null
                            ? "border-red-500/40 bg-red-500/5 text-red-400"
                            : "border-border/30 text-muted-foreground hover:border-border/60 hover:text-foreground"
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", sessionProxyId === null ? "bg-red-400" : "bg-muted-foreground/30")} />
                        <span>Без прокси <span className="opacity-60">(не рекомендуется)</span></span>
                      </button>
                      {sessionDbProxies.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSessionProxyId(p.id)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-xs transition-all",
                            sessionProxyId === p.id
                              ? "border-emerald-500/40 bg-emerald-500/5"
                              : "border-border/30 hover:border-border/60"
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", sessionProxyId === p.id ? "bg-emerald-400" : "bg-muted-foreground/30")} />
                          <span className={cn("font-medium", sessionProxyId === p.id ? "text-emerald-400" : "text-foreground")}>
                            {p.name || `${p.host}:${p.port}`}
                          </span>
                          <span className="text-muted-foreground font-mono ml-1">{p.host}:{p.port}</span>
                          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">{p.type.toUpperCase()}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Нет прокси в базе — <span className="text-primary">добавьте в разделе Прокси</span> перед импортом</p>
                  )}
                </div>
                {/* Device type selector */}
                <div className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Тип устройства</p>
                  <div className="flex gap-2">
                    {(["desktop", "android"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDeviceType(type)}
                        className={cn(
                          "flex-1 px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                          deviceType === type
                            ? "border-primary/60 bg-primary/10 text-primary"
                            : "border-border/30 text-muted-foreground hover:border-border/60"
                        )}
                      >
                        {DEVICE_CREDS[type].label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground opacity-70">
                    Рекомендуется Desktop. Выбирайте Android если сессия создана на Android-клиенте.
                  </p>
                </div>

                <div
                  className="border-2 border-dashed border-border/60 rounded-xl p-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 transition-colors cursor-pointer"
                  onClick={() => sessionRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <Upload className="h-8 w-8 opacity-40" />
                  <p className="text-sm">Перетащите файлы сюда или нажмите для выбора</p>
                  <p className="text-xs opacity-50">.session файлы Telethon</p>
                </div>
                <input
                  ref={sessionRef} type="file" multiple accept=".session" className="hidden"
                  onChange={(e) => addSessionFiles(e.target.files)}
                />
              </>
            )}
          </div>

          {/* ── Proxy section (только для session режима — в tdata режиме прокси в Шаге 1) ── */}
          {importMode === "session" &&
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-violet-500/20 flex items-center justify-center">
                  <Shield className="h-3.5 w-3.5 text-violet-400" />
                </div>
                Прокси
              </h3>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-muted-foreground">
                    Пул прокси
                    {poolLines.length > 0 && (
                      <span className="ml-2 text-primary font-medium">{poolLines.length} шт.</span>
                    )}
                  </label>
                  <Button
                    size="sm" variant="outline"
                    className="h-6 text-[11px] gap-1 px-2 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                    onClick={loadProxiesFromDb}
                    disabled={loadingDbProxies}
                  >
                    {loadingDbProxies ? <Loader2 className="h-3 w-3 animate-spin" /> : <Database className="h-3 w-3" />}
                    Из базы
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground/60 mb-2">
                  По одному на строку: <code className="bg-muted px-1 rounded">socks5://user:pass@ip:port</code> или <code className="bg-muted px-1 rounded">ip:port</code>
                </p>
                <textarea
                  className="w-full h-24 bg-background border border-border rounded-lg p-3 text-sm text-foreground font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder={"socks5://user:pass@ip:port\nhttp://user:pass@ip:port\nip:port"}
                  value={proxyPool}
                  onChange={(e) => { setProxyPool(e.target.value); setPoolProxies([]); }}
                />
              </div>

              {poolProxies.length > 0 && (
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="max-h-36 overflow-y-auto">
                    {poolProxies.map((p, i) => {
                      const dot = proxyDot[p.status] ?? proxyDot.none;
                      return (
                        <div key={i} className="flex items-center gap-3 px-3 py-1.5 border-b border-border/40 last:border-0 text-xs">
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dot.color)} />
                          <span className="font-mono text-muted-foreground flex-1 truncate">{p.line.replace(/:[^@:]+@/, ":***@")}</span>
                          {p.status === "ok" && <span className="text-emerald-400 shrink-0">{p.latency}ms</span>}
                          {p.status === "slow" && <span className="text-amber-400 shrink-0">{p.latency}ms</span>}
                          {p.status === "error" && <span className="text-red-400 shrink-0 max-w-[200px] truncate" title={p.error}>{p.error || "Недоступен"}</span>}
                          {p.status === "checking" && <span className="text-muted-foreground shrink-0">проверка...</span>}
                        </div>
                      );
                    })}
                  </div>
                  {poolProxies.some(p => p.status !== "checking") && (
                    <div className="px-3 py-1.5 bg-muted/20 text-xs text-muted-foreground flex gap-3">
                      <span className="text-emerald-400">{poolOk} рабочих</span>
                      <span className="text-red-400">{poolProxies.filter(p => p.status === "error").length} нерабочих</span>
                      <span>{poolProxies.filter(p => p.status === "none" || p.status === "checking").length} не проверено</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="bg-primary/15 text-primary hover:bg-primary/25 gap-1.5"
                  onClick={distributeProxies}
                  disabled={!poolLines.length || !accounts.length}
                >
                  <Download className="h-3.5 w-3.5" /> Распределить по аккаунтам
                </Button>
                <Button
                  size="sm" variant="outline" className="gap-1.5"
                  onClick={() => { setProxyPool(""); setPoolProxies([]); }}
                  disabled={!proxyPool}
                >
                  <X className="h-3.5 w-3.5" /> Очистить
                </Button>
                {withProxy > 0 && (
                  <Button
                    size="sm" variant="outline" className="text-red-400 border-red-500/30 hover:bg-red-500/10 gap-1.5"
                    onClick={clearProxies}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Снять с аккаунтов
                  </Button>
                )}
              </div>
            </div>
          }

          {/* ── No-proxy warning banner (session mode) ── */}
          {importMode === "session" && !sessionProxyId && accounts.some(a => a.format !== "tdata") && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-300">
              <span className="mt-0.5 shrink-0">⚠️</span>
              <span>
                <strong>Прокси не выбран.</strong> Без прокси аккаунты не смогут подключиться к Telegram —
                инструменты (прогрев, инвайтинг и др.) не запустятся.
                Выберите прокси выше или назначьте его в менеджере аккаунтов после сохранения.
              </span>
            </div>
          )}

          {/* ── Stats row ── */}
          {accounts.length > 0 && (
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>Всего акк.: <strong className="text-foreground">{accounts.length}</strong></span>
              <span>С прокси: <strong className="text-foreground">{withProxy}</strong></span>
              <span>Рабочие прокси: <strong className="text-foreground">{workingProxy}</strong></span>
              <span>Готово: <strong className="text-emerald-400">{readyCount}</strong></span>
            </div>
          )}

          {/* ── Table ── */}
          {accounts.length > 0 && (
            <div className="panel-card rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/50">
                      {["Аккаунт", "Формат", "Телефон", "Username", "ГЕО", "Прокси", "Статус акк.", "Статус прокси"].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-left text-[10px] text-muted-foreground font-medium uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                      <th className="px-3 py-2.5 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((acc) => {
                      const aStatus = accDot[acc.status] ?? accDot.pending;
                      const pStatus = proxyDot[acc.proxyStatus] ?? proxyDot.none;
                      return (
                        <tr key={acc.file.name} className="border-b border-border/30 last:border-0 hover:bg-secondary/30 transition-colors">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0",
                                acc.format === "tdata" ? "bg-orange-500/15 text-orange-400" : "bg-primary/15 text-primary"
                              )}>
                                {acc.status === "checking" ? "…" : (acc.name || acc.phone)[0]?.toUpperCase() || "?"}
                              </div>
                              <div>
                                <span className="text-foreground font-medium truncate max-w-[120px] block">
                                  {acc.status === "checking"
                                    ? "Импорт..."
                                    : acc.status === "error"
                                    ? "Ошибка"
                                    : acc.name || acc.phone}
                                </span>
                                {acc.status === "error" && acc.detail && (
                                  <span className="text-[10px] text-red-400 truncate max-w-[120px] block" title={acc.detail}>{acc.detail}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-medium",
                              acc.format === "tdata" ? "bg-orange-500/10 text-orange-400" : "bg-primary/10 text-primary"
                            )}>
                              {acc.format === "tdata" ? "tdata" : ".session"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {acc.format === "tdata" && acc.status === "pending" ? "—" : acc.phone}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {acc.username ? <span className="text-primary/80">@{acc.username}</span> : "—"}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">—</td>
                          <td className="px-3 py-2">
                            {acc.proxy ? (
                              <span className="text-[10px] text-muted-foreground truncate max-w-[100px] block">{acc.proxy.replace(/:[^@:]+@/, ":***@")}</span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/40">Нет</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center gap-1.5 text-xs">
                              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", aStatus.color)} />
                              <span className={acc.status === "ok" ? "text-emerald-400" : acc.status === "error" ? "text-red-400" : "text-muted-foreground"}>
                                {aStatus.label}
                              </span>
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", pStatus.color)} />
                              {pStatus.label}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <button
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              onClick={() => setAccounts((prev) => prev.filter((a) => a.file.name !== acc.file.name))}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Action buttons (both modes) ── */}
          {
            <div className="flex flex-wrap gap-2">
              <Button
                className="gap-2 bg-primary/15 text-primary hover:bg-primary/25 border border-primary/20"
                variant="ghost"
                disabled={checkingProxies || !poolLines.length}
                onClick={checkProxies}
              >
                {checkingProxies ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                Проверить прокси
              </Button>

              {proxyOnlyMode && (
                <Button
                  className="gap-2 bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/20"
                  variant="ghost"
                  disabled={savingProxies}
                  onClick={saveProxiesToDb}
                >
                  {savingProxies ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Сохранить прокси в базу
                </Button>
              )}

              {accounts.length > 0 && poolLines.length > 0 && (
                <Button
                  className="gap-2 bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 border border-orange-500/20"
                  variant="ghost"
                  onClick={() => { distributeProxies(); setNoProxyWarning(false); }}
                >
                  <Download className="h-4 w-4" /> Назначить прокси аккаунтам
                </Button>
              )}

              {accounts.length > 0 && (
                <>
                  <Button
                    className="gap-2 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20"
                    variant="ghost"
                    disabled={checkingAccs || !accounts.length}
                    onClick={checkAccounts}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Проверить аккаунты
                  </Button>
                  <Button
                    className="gap-2 bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 border border-violet-500/20"
                    variant="ghost"
                    disabled={uploading}
                    onClick={() => uploadAll(true)}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {uploading ? "Сохранение..." : "Сохранить в комбайн"}
                  </Button>
                </>
              )}
            </div>
          }

          {/* ── Legend ── */}
          <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Работает</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Медленный/Нестабильный</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" /> Не работает</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted-foreground" /> Не проверен</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportAccountsModal;
