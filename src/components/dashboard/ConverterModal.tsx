import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Smartphone, KeyRound, Lock, CheckCircle2, RefreshCw, Shield, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Step = "phone" | "code" | "twofa" | "done";

interface Proxy {
  id: number; name: string; type: string; host: string; port: number; user: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported?: () => void;
}

export default function ConverterModal({ open, onOpenChange, onImported }: Props) {
  const { toast } = useToast();
  const [step, setStep]               = useState<Step>("phone");
  const [phone, setPhone]             = useState("");
  const [code, setCode]               = useState("");
  const [password, setPassword]       = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [safePhone, setSafePhone]     = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [donePhone, setDonePhone]     = useState("");
  const [doneName, setDoneName]       = useState("");

  const [proxies, setProxies]         = useState<Proxy[]>([]);
  const [selectedProxy, setSelectedProxy] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/converter/proxies", { credentials: "include" })
      .then(r => r.json())
      .then((d: Proxy[]) => {
        const list = Array.isArray(d) ? d : [];
        setProxies(list);
        if (list.length > 0) setSelectedProxy(list[0].id);
      })
      .catch(() => {});
  }, [open]);

  const api = async (url: string, body: object) => {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const reset = async () => {
    if (sessionToken) {
      await api("/api/converter/cancel", { session_token: sessionToken }).catch(() => {});
    }
    setStep("phone");
    setPhone(""); setCode(""); setPassword("");
    setSessionToken(""); setSafePhone(""); setError("");
    setDonePhone(""); setDoneName("");
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleSendCode = async () => {
    setError(""); setLoading(true);
    const normalizedPhone = phone.trim().startsWith("+") ? phone.trim() : `+${phone.trim()}`;
    setPhone(normalizedPhone);
    const data = await api("/api/converter/send-code", { phone: normalizedPhone, proxy_id: selectedProxy });
    setLoading(false);
    if (data.error) { setError(data.error); return; }
    setSessionToken(data.session_token);
    setSafePhone(phone.replace("+", "").replace(/[\s\-]/g, ""));
    setStep("code");
  };

  const handleVerifyCode = async () => {
    setError(""); setLoading(true);
    const data = await api("/api/converter/verify-code", { session_token: sessionToken, code });
    setLoading(false);
    if (data.error === "CODE_EXPIRED") { setError("Код истёк. Отправьте новый."); setStep("phone"); return; }
    if (data.error) { setError(data.error); return; }
    if (data.needs_2fa) { setStep("twofa"); return; }
    setDonePhone(data.phone);
    setDoneName(data.name || data.phone);
    setStep("done");
    onImported?.();
  };

  const handleVerify2FA = async () => {
    setError(""); setLoading(true);
    const data = await api("/api/converter/verify-2fa", { session_token: sessionToken, password });
    setLoading(false);
    if (data.error) { setError(data.error); return; }
    setDonePhone(data.phone);
    setDoneName(data.name || data.phone);
    setStep("done");
    onImported?.();
  };

  const handleResend = async () => {
    setError(""); setCode(""); setLoading(true);
    const data = await api("/api/converter/send-code", { phone, proxy_id: selectedProxy });
    setLoading(false);
    if (data.error) { setError(data.error); return; }
    setSessionToken(data.session_token);
    toast({ title: "Код отправлен повторно" });
  };

  const steps = [
    { id: "phone", label: "Телефон", icon: Smartphone },
    { id: "code",  label: "SMS-код",  icon: KeyRound },
    { id: "twofa", label: "2FA",      icon: Lock },
    { id: "done",  label: "Готово",   icon: CheckCircle2 },
  ];
  const stepIdx = steps.findIndex(s => s.id === step);
  const selectedProxyObj = proxies.find(p => p.id === selectedProxy);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Smartphone className="h-5 w-5 text-violet-400" /> Добавить аккаунт по номеру
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress steps */}
          <div className="flex items-center gap-0">
            {steps.map((s, i) => {
              const done = i < stepIdx;
              const active = i === stepIdx;
              const Icon = s.icon;
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                      done   ? "bg-emerald-500 border-emerald-500" :
                      active ? "bg-primary/20 border-primary" :
                               "bg-muted/20 border-border/30"
                    )}>
                      <Icon className={cn("h-3.5 w-3.5", done ? "text-white" : active ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <span className={cn("text-[10px] font-medium", active ? "text-primary" : done ? "text-emerald-400" : "text-muted-foreground")}>
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={cn("flex-1 h-0.5 mx-1 -mt-4 transition-all", done ? "bg-emerald-500" : "bg-border/30")} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Proxy selector — только на шаге phone */}
          {step === "phone" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Shield className="h-3.5 w-3.5 text-violet-400" />
                Прокси
                {selectedProxy
                  ? <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">Выбран</span>
                  : <span className="ml-auto px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">Не выбран</span>}
              </div>

              {proxies.length === 0 ? (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  Нет прокси. Добавьте в «Пул Прокси» перед конвертацией.
                </div>
              ) : (
                <div className="grid gap-1 max-h-32 overflow-y-auto">
                  <button
                    onClick={() => setSelectedProxy(null)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all",
                      selectedProxy === null ? "border-red-500/40 bg-red-500/5" : "border-border/30 hover:border-border/60"
                    )}
                  >
                    <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", selectedProxy === null ? "bg-red-400" : "bg-muted-foreground/30")} />
                    <span className={selectedProxy === null ? "text-red-400" : "text-muted-foreground"}>Без прокси (не рекомендуется)</span>
                  </button>
                  {proxies.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProxy(p.id)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all",
                        selectedProxy === p.id ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/30 hover:border-border/60"
                      )}
                    >
                      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", selectedProxy === p.id ? "bg-emerald-400" : "bg-muted-foreground/30")} />
                      <div className="flex-1 min-w-0">
                        <span className={cn("font-medium", selectedProxy === p.id ? "text-emerald-400" : "text-foreground")}>{p.name}</span>
                        <span className="ml-2 text-muted-foreground font-mono">{p.host}:{p.port}</span>
                      </div>
                      {selectedProxy === p.id && <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP: Phone */}
          {step === "phone" && (
            <div className="space-y-3">
              <div className={cn("flex items-center gap-2 p-2.5 rounded-lg border text-xs",
                selectedProxyObj ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-400" : "bg-amber-500/5 border-amber-500/30 text-amber-400"
              )}>
                <Shield className="h-3.5 w-3.5 shrink-0" />
                {selectedProxyObj ? `Прокси: ${selectedProxyObj.name}` : "Без прокси — риск блокировки"}
              </div>
              <Input
                placeholder="+79991234567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === "Enter" && phone.length >= 7 && handleSendCode()}
                className="bg-background border-border/50 text-base font-mono"
                autoFocus
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button className="w-full" onClick={handleSendCode} disabled={loading || phone.length < 7}>
                {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Smartphone className="h-4 w-4 mr-2" />}
                {loading ? "Отправка..." : "Отправить SMS-код"}
              </Button>
            </div>
          )}

          {/* STEP: Code */}
          {step === "code" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Код отправлен на <strong className="text-foreground">{phone}</strong>
                {selectedProxyObj && <span className="ml-2 text-emerald-400">· {selectedProxyObj.name}</span>}
              </p>
              <Input
                placeholder="12345"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={e => e.key === "Enter" && code.length >= 4 && handleVerifyCode()}
                className="bg-background border-border/50 text-2xl font-mono text-center tracking-[0.5em]"
                autoFocus maxLength={6}
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button className="w-full" onClick={handleVerifyCode} disabled={loading || code.length < 4}>
                {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}
                {loading ? "Проверка..." : "Подтвердить код"}
              </Button>
              <div className="flex justify-between">
                <button onClick={handleResend} className="text-xs text-muted-foreground hover:text-foreground" disabled={loading}>
                  Отправить повторно
                </button>
                <button onClick={reset} className="text-xs text-muted-foreground hover:text-red-400">Отмена</button>
              </div>
            </div>
          )}

          {/* STEP: 2FA */}
          {step === "twofa" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400">
                <Lock className="h-3.5 w-3.5 shrink-0" /> На аккаунте включена 2FA. Введите пароль.
              </div>
              <Input
                type="password"
                placeholder="Пароль 2FA"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && password && handleVerify2FA()}
                className="bg-background border-border/50"
                autoFocus
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button className="w-full" onClick={handleVerify2FA} disabled={loading || !password}>
                {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                {loading ? "Проверка..." : "Войти"}
              </Button>
              <button onClick={reset} className="text-xs text-muted-foreground hover:text-red-400">Отмена</button>
            </div>
          )}

          {/* STEP: Done */}
          {step === "done" && (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Готово!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  <strong className="text-foreground">{doneName}</strong> успешно добавлен
                </p>
                {donePhone && doneName !== donePhone && (
                  <p className="text-xs text-muted-foreground mt-0.5">{donePhone}</p>
                )}
                {selectedProxyObj && (
                  <p className="text-xs text-emerald-400 mt-1 flex items-center justify-center gap-1">
                    <Shield className="h-3 w-3" /> Прокси {selectedProxyObj.name} привязан
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 border-border/50" onClick={reset}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Ещё один
                </Button>
                <Button className="flex-1" onClick={() => handleClose(false)}>
                  Закрыть
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
