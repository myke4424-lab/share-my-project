import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon, Shield, ShieldCheck, ShieldOff,
  ChevronDown, ChevronRight, Eye, EyeOff, Save, RefreshCw,
  User, Mail, KeyRound, Chrome, Copy, CheckCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PanelConfig {
  panel_port:           number;
  panel_host:           string;
  token_ttl_hours:      number;
  max_log_buffer_lines: number;
  paths: Record<string, string>;
}

interface MeData {
  name:       string;
  email:      string;
  has_google: boolean;
  is_admin:   boolean;
}

// ── Components ─────────────────────────────────────────────────────────────────

const Section = ({
  title, icon: Icon, iconColor, children, defaultOpen = false,
}: {
  title: string; icon: React.ElementType; iconColor: string;
  children: React.ReactNode; defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="panel-card rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/20 transition-colors"
      >
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", iconColor)}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold text-foreground flex-1 text-left">{title}</span>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-5 border-t border-border/30 pt-4 space-y-4">{children}</div>}
    </div>
  );
};

const Msg = ({ text }: { text: string }) =>
  text ? (
    <p className={cn("text-xs px-3 py-2 rounded-md",
      text.startsWith("✓") ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
      {text}
    </p>
  ) : null;

// ── Main ───────────────────────────────────────────────────────────────────────

const Settings = () => {
  const [config, setConfig]   = useState<PanelConfig | null>(null);
  const [me,     setMe]       = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile
  const [profileName, setProfileName] = useState("");
  const [profileMsg,  setProfileMsg]  = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  // Password
  const [currentPwd,  setCurrentPwd]  = useState("");
  const [newPwd,      setNewPwd]      = useState("");
  const [confirmPwd,  setConfirmPwd]  = useState("");
  const [showPwd,     setShowPwd]     = useState(false);
  const [pwdMsg,      setPwdMsg]      = useState("");
  const [pwdSaving,   setPwdSaving]   = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/settings", { credentials: "include" }).then(r => r.json()).catch(() => null),
      fetch("/api/me", { credentials: "include" }).then(r => r.json()).catch(() => null),
    ]).then(([cfg, meData]) => {
      if (cfg) setConfig(cfg);
      if (meData?.authenticated) {
        setMe(meData);
        setProfileName(meData.name || "");
      }
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  // ── Profile save ──────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    setProfileMsg("");
    if (!profileName.trim()) { setProfileMsg("Введите имя"); return; }
    setProfileSaving(true);
    const r = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: profileName }),
    });
    const d = await r.json();
    setProfileMsg(d.ok ? "✓ Профиль обновлён" : (d.error || "Ошибка"));
    setProfileSaving(false);
  };

  // ── Password save ─────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    setPwdMsg("");
    if (!newPwd)             { setPwdMsg("Введите новый пароль"); return; }
    if (newPwd !== confirmPwd) { setPwdMsg("Пароли не совпадают"); return; }
    if (newPwd.length < 6)   { setPwdMsg("Минимум 6 символов"); return; }

    // If user has a password, require current
    if (me && !me.has_google && !currentPwd) {
      setPwdMsg("Введите текущий пароль");
      return;
    }

    setPwdSaving(true);
    const r = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        current_password: currentPwd || undefined,
        new_password: newPwd,
      }),
    });
    const d = await r.json();
    setPwdMsg(d.ok ? "✓ Пароль изменён" : (d.error || "Ошибка"));
    if (d.ok) { setCurrentPwd(""); setNewPwd(""); setConfirmPwd(""); }
    setPwdSaving(false);
  };

  // ── Fallback admin password change ────────────────────────────────────────
  const handleAdminPasswordChange = async () => {
    setPwdMsg("");
    if (!currentPwd || !newPwd) { setPwdMsg("Заполните все поля"); return; }
    if (newPwd !== confirmPwd)  { setPwdMsg("Пароли не совпадают"); return; }
    if (newPwd.length < 8)      { setPwdMsg("Минимум 8 символов"); return; }
    setPwdSaving(true);
    const r = await fetch("/api/settings/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ current_password: currentPwd, new_password: newPwd }),
    });
    const d = await r.json();
    setPwdMsg(r.ok ? "✓ Пароль изменён" : (d.detail || "Ошибка"));
    if (r.ok) { setCurrentPwd(""); setNewPwd(""); setConfirmPwd(""); }
    setPwdSaving(false);
  };

  const isAdmin = me?.is_admin ?? false;

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-primary" /> Настройки
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Профиль и конфигурация панели</p>
        </div>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="gap-1.5 h-8 text-xs text-muted-foreground">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </Button>
      </div>

      {/* ── Profile (only for non-admin users) ── */}
      {!isAdmin && (
        <Section title="Профиль" icon={User} iconColor="text-violet-400 bg-violet-500/10" defaultOpen>
          <div className="space-y-4">
            {/* User info */}
            {me && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/30">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {me.name ? me.name[0].toUpperCase() : me.email[0]?.toUpperCase() ?? "?"}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{me.name || "—"}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <Mail className="h-3 w-3 shrink-0" />
                    {me.email || "email не указан"}
                  </p>
                  {me.has_google && (
                    <p className="text-xs text-blue-400 flex items-center gap-1 mt-0.5">
                      <Chrome className="h-3 w-3" />
                      Google аккаунт привязан
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Change name */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Отображаемое имя</label>
              <Input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Ваше имя"
                className="h-9 text-sm bg-background border-border"
              />
            </div>
            <Msg text={profileMsg} />
            <Button
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleSaveProfile}
              disabled={profileSaving}
            >
              {profileSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Сохранить имя
            </Button>
          </div>
        </Section>
      )}

      {/* ── Password / Security ── */}
      <Section
        title={isAdmin ? "Безопасность — смена пароля панели" : "Безопасность — смена пароля"}
        icon={Shield}
        iconColor="text-emerald-400 bg-emerald-500/10"
        defaultOpen={isAdmin}
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              {isAdmin ? "Текущий пароль панели" : "Текущий пароль"}
            </label>
            <div className="relative">
              <Input
                type={showPwd ? "text" : "password"}
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                placeholder="Введите текущий пароль"
                className="h-9 text-sm bg-background border-border pr-10"
              />
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPwd(!showPwd)}
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1">
              <KeyRound className="h-3 w-3" />
              Новый пароль
            </label>
            <Input
              type={showPwd ? "text" : "password"}
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder={isAdmin ? "Минимум 4 символа" : "Минимум 6 символов"}
              className="h-9 text-sm bg-background border-border"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Подтверждение</label>
            <Input
              type={showPwd ? "text" : "password"}
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              placeholder="Повторите новый пароль"
              className="h-9 text-sm bg-background border-border"
            />
          </div>
          <Msg text={pwdMsg} />
          <Button
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={isAdmin ? handleAdminPasswordChange : handleChangePassword}
            disabled={pwdSaving}
          >
            {pwdSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Сменить пароль
          </Button>
        </div>
      </Section>

      {/* ── 2FA (admin only) ── */}
      {isAdmin && <TwoFASection />}

    </div>
  );
};

// ── 2FA Section ────────────────────────────────────────────────────────────────

const TwoFASection = () => {
  const [enabled, setEnabled]         = useState<boolean | null>(null);
  const [step, setStep]               = useState<"status" | "scan" | "backup">("status");
  const [secret, setSecret]           = useState("");
  const [uri, setUri]                 = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [msg, setMsg]                 = useState("");
  const [err, setErr]                 = useState("");
  const [loading, setLoading]         = useState(false);
  const [copied, setCopied]           = useState(false);

  useEffect(() => {
    fetch("/api/admin/2fa/status", { credentials: "include" })
      .then(r => r.json()).then(d => setEnabled(d.enabled)).catch(() => {});
  }, []);

  const startSetup = async () => {
    setErr(""); setLoading(true);
    const r = await fetch("/api/admin/2fa/setup", { method: "POST", credentials: "include" });
    const d = await r.json(); setLoading(false);
    setSecret(d.secret); setUri(d.uri); setConfirmCode(""); setStep("scan");
  };

  const confirmEnable = async () => {
    setErr(""); setLoading(true);
    const r = await fetch("/api/admin/2fa/enable", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, code: confirmCode }),
    });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setBackupCodes(d.backup_codes); setEnabled(true); setStep("backup"); }
    else setErr(d.detail || "Неверный код");
  };

  const disable2fa = async () => {
    setErr(""); setLoading(true);
    const r = await fetch("/api/admin/2fa/disable", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: disableCode }),
    });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setEnabled(false); setDisableCode(""); setMsg("2FA отключена"); }
    else setErr(d.detail || "Неверный код");
  };

  const copyBackup = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Section title="Двухфакторная аутентификация (2FA)" icon={ShieldCheck} iconColor="text-emerald-400 bg-emerald-500/10">
      {enabled === null && <p className="text-sm text-muted-foreground p-4">Загрузка...</p>}

      {/* Status + enable */}
      {enabled !== null && step === "status" && (
        <div className="space-y-4">
          <div className={`flex items-center gap-2 text-sm font-medium ${enabled ? "text-emerald-400" : "text-muted-foreground"}`}>
            {enabled ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
            {enabled ? "2FA включена" : "2FA отключена"}
          </div>

          {!enabled && (
            <Button onClick={startSetup} disabled={loading} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
              Включить 2FA
            </Button>
          )}

          {enabled && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Текущий TOTP-код для отключения</label>
                <input
                  type="text" placeholder="000000"
                  value={disableCode} onChange={e => setDisableCode(e.target.value)}
                  className="w-48 h-9 rounded-md border border-border/50 bg-background/50 px-3 text-sm text-center tracking-widest"
                  maxLength={10}
                />
              </div>
              <Button onClick={disable2fa} disabled={loading || !disableCode} size="sm" variant="destructive">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <ShieldOff className="h-4 w-4 mr-2" />}
                Отключить 2FA
              </Button>
            </div>
          )}

          {(err || msg) && (
            <p className={`text-sm ${err ? "text-destructive" : "text-emerald-400"}`}>{err || msg}</p>
          )}
        </div>
      )}

      {/* Scan QR */}
      {step === "scan" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Отсканируйте QR-код в Google Authenticator (или введите ключ вручную),
            затем введите 6-значный код для подтверждения.
          </p>
          {/* QR через qrserver.com API — секрет передаётся только в URL запроса, не в body */}
          <div className="flex justify-center">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(uri)}&size=200x200`}
              alt="QR код"
              className="rounded-lg border border-border/50"
              width={200} height={200}
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Ключ для ручного ввода:</p>
            <code className="text-xs bg-muted/30 rounded px-2 py-1 break-all block">{secret}</code>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Код из приложения</label>
            <input
              type="text" placeholder="000000" autoFocus
              value={confirmCode} onChange={e => setConfirmCode(e.target.value)}
              className="w-48 h-9 rounded-md border border-border/50 bg-background/50 px-3 text-sm text-center tracking-widest"
              maxLength={6}
            />
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <div className="flex gap-2">
            <Button onClick={confirmEnable} disabled={loading || confirmCode.length < 6} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Подтвердить и включить
            </Button>
            <Button onClick={() => setStep("status")} size="sm" variant="outline">Отмена</Button>
          </div>
        </div>
      )}

      {/* Backup codes */}
      {step === "backup" && (
        <div className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <p className="text-sm font-semibold text-amber-400 mb-1">⚠️ Сохраните backup-коды!</p>
            <p className="text-xs text-muted-foreground">Они показываются только один раз. Каждый код одноразовый.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((c, i) => (
              <code key={i} className="text-sm bg-muted/30 rounded px-3 py-1.5 text-center font-mono">{c}</code>
            ))}
          </div>
          <Button onClick={copyBackup} size="sm" variant="outline">
            {copied ? <CheckCheck className="h-4 w-4 mr-2 text-emerald-400" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Скопировано!" : "Скопировать все"}
          </Button>
          <Button onClick={() => setStep("status")} size="sm" className="w-full">Готово</Button>
        </div>
      )}
    </Section>
  );
};

export default Settings;
