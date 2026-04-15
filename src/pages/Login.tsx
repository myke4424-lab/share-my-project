import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, User, Eye, EyeOff, ShieldCheck, Clock, CheckCircle2, Send, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

import { useNavigate } from "@tanstack/react-router";

type Tab = "login" | "register";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: object) => void;
          renderButton: (el: HTMLElement, cfg: object) => void;
        };
      };
    };
  }
}

const Login = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const nextBot = searchParams.get("next") === "bot";
  const [tab, setTab] = useState<Tab>(nextBot ? "register" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false); // экран успеха после регистрации
  const [botLinkLoading, setBotLinkLoading] = useState(false);
  const [pendingTgUrl, setPendingTgUrl] = useState<string | null>(null);
  const [googleClientId, setGoogleClientId] = useState("");
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  // 2FA state
  const [requires2fa, setRequires2fa] = useState(false);
  const [tmpToken, setTmpToken] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const { loginWithEmail, loginWithGoogle, register, verify2fa } = useAuth();
  const navigate = useNavigate();

  const goNext = async () => {
    if (nextBot) {
      try {
        const r = await fetch("/api/bot/link", { credentials: "include" });
        if (r.ok) {
          const d = await r.json();
          if (d.bot_link) { window.location.href = d.bot_link; return; }
        }
      } catch {}
    }
    navigate({ to: "/dashboard" });
  };

  // Extract referral code from URL: ?ref=CODE or stored in localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get("ref");
    if (refParam) {
      setReferralCode(refParam);
      localStorage.setItem("pending_ref", refParam);
      setTab("register");
    } else {
      const stored = localStorage.getItem("pending_ref");
      if (stored) setReferralCode(stored);
    }
  }, []);

  // Fetch Google client id from backend
  useEffect(() => {
    fetch("/api/auth/config")
      .then((r) => r.json())
      .then((d) => setGoogleClientId(d.google_client_id || ""))
      .catch(() => {});
  }, []);

  // Load Google GSI script and render button
  useEffect(() => {
    if (!googleClientId) return;

    const initGoogle = () => {
      if (!window.google || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (resp: { credential: string }) => {
          setLoading(true);
          setError("");
          const result = await loginWithGoogle(resp.credential);
          setLoading(false);
          if (result.ok) { goNext(); return; }
          else setError(result.error || "Ошибка Google авторизации");
        },
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        width: 340,
        locale: "ru",
      });
    };

    if (window.google) {
      initGoogle();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, [googleClientId, tab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await loginWithEmail(email, password);
    setLoading(false);
    if (result.ok) {
      navigate({ to: "/dashboard" }); return;
    } else if (result.requires_2fa && result.tmp_token) {
      setRequires2fa(true);
      setTmpToken(result.tmp_token);
      setTotpCode("");
    } else if (result.redirect_telegram !== undefined) {
      setPendingTgUrl(result.redirect_telegram || null);
    } else {
      setError(result.error || "Неверный email или пароль");
    }
  };

  const handle2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await verify2fa(tmpToken, totpCode);
    setLoading(false);
    if (result.ok) { navigate({ to: "/dashboard" }); return; }
    else setError(result.error || "Неверный код");
  };


  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }
    if (password.length < 6) {
      setError("Пароль должен быть не менее 6 символов");
      return;
    }
    setLoading(true);
    const result = await register(email, password, name, referralCode || undefined);
    setLoading(false);
    if (result.ok) {
      localStorage.removeItem("pending_ref");
      if (nextBot) { setRegistered(true); return; }
      goNext(); return;
    } else if (result.registered) {
      setPendingTgUrl(result.redirect_telegram || null);
    } else {
      setError(result.error || "Ошибка регистрации");
    }
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setError("");
    setSuccessMsg("");
    setPassword("");
    setConfirmPassword("");
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        </div>
        <div className="w-full max-w-md relative z-10 text-center">
          <div className="inline-flex items-center gap-2 mb-8 justify-center">
            <img src="/logo.png" className="w-10 h-10 object-contain" alt="TeleBoost" />
            <span className="text-2xl font-black tracking-tight text-foreground">Tele<span className="text-primary">Boost</span></span>
          </div>
          <div className="panel-card rounded-2xl p-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Регистрация успешна!</h2>
            <p className="text-muted-foreground mb-6">
              Аккаунт создан. Нажмите кнопку ниже чтобы активировать <strong className="text-foreground">3 дня бесплатного доступа</strong> через Telegram-бота.
            </p>
            <Button
              className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12 text-base rounded-xl"
              disabled={botLinkLoading}
              onClick={async () => {
                setBotLinkLoading(true);
                try {
                  const r = await fetch("/api/bot/link", { credentials: "include" });
                  if (r.ok) {
                    const d = await r.json();
                    if (d.bot_link) { window.location.href = d.bot_link; return; }
                  }
                } catch {}
                setBotLinkLoading(false);
                navigate({ to: "/dashboard" });
              }}
            >
              {botLinkLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Активировать в Telegram
                </>
              )}
            </Button>
            <button onClick={() => navigate({ to: "/dashboard" })} className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors block w-full text-center">
              Перейти в панель управления →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <img src="/logo.png" className="w-10 h-10 object-contain" alt="TeleBoost" />
            <span className="text-2xl font-black tracking-tight text-foreground">
              Tele<span className="text-primary">Boost</span>
            </span>
          </div>
          <p className="text-muted-foreground">Панель управления</p>
        </div>

        {/* Card */}
        <div className="panel-card rounded-2xl p-8">
          {/* Tabs */}
          <div className="flex rounded-lg bg-muted/30 p-1 mb-6 gap-1">
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={cn(
                  "flex-1 py-2 rounded-md text-sm font-medium transition-all",
                  tab === t
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "login" ? "Войти" : "Регистрация"}
              </button>
            ))}
          </div>

          {/* 2FA step */}
          {requires2fa && (
            <form onSubmit={handle2fa} className="space-y-4">
              <div className="flex flex-col items-center gap-2 mb-2">
                <ShieldCheck className="h-10 w-10 text-primary" />
                <p className="font-semibold text-foreground">Двухфакторная аутентификация</p>
                <p className="text-sm text-muted-foreground text-center">
                  Введите 6-значный код из Google Authenticator<br/>
                  или backup-код формата <code className="text-xs">XXXX-XXXX</code>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="totp" className="text-foreground/80">Код</Label>
                <Input
                  id="totp"
                  type="text"
                  placeholder="000000 или XXXX-XXXX"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  className="bg-background/50 border-border/50 focus:border-primary/50 h-11 text-center text-lg tracking-widest"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={20}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                {loading ? "Проверка..." : "Подтвердить"}
              </Button>
              <button type="button" onClick={() => { setRequires2fa(false); setError(""); }} className="w-full text-sm text-muted-foreground hover:text-foreground text-center">
                ← Назад
              </button>
            </form>
          )}

          {/* Login form */}
          {!requires2fa && tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground/80">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground/80">Пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-background/50 border-border/50 focus:border-primary/50 h-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-destructive text-center">{error}</p>}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                {loading ? "Вход..." : "Войти"}
              </Button>

            </form>
          )}

          {/* Register form */}
          {!requires2fa && tab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground/80">Имя</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ваше имя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-email" className="text-foreground/80">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-password" className="text-foreground/80">Пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-password"
                    type={showPw ? "text" : "password"}
                    placeholder="Минимум 6 символов"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-background/50 border-border/50 focus:border-primary/50 h-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-foreground/80">Подтвердите пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showPw ? "text" : "password"}
                    placeholder="Повторите пароль"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 h-11"
                    required
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              {successMsg && (
                <p className="text-sm text-emerald-500 text-center bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
                  {successMsg}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading || !!successMsg}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                {loading ? "Регистрация..." : "Создать аккаунт"}
              </Button>
            </form>
          )}

          {/* Google OAuth — shown when client ID is configured */}
          {!requires2fa && googleClientId && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">или</span>
                </div>
              </div>

              {/* GSI renders the button here */}
              <div ref={googleBtnRef} className="flex justify-center" />
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          {tab === "login" ? (
            <>Нет аккаунта?{" "}
              <button onClick={() => switchTab("register")} className="text-primary hover:underline">
                Зарегистрироваться
              </button>
            </>
          ) : (
            <>Уже есть аккаунт?{" "}
              <button onClick={() => switchTab("login")} className="text-primary hover:underline">
                Войти
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default Login;
