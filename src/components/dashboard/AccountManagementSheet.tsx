import { useState, useCallback, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  User, Image, Shield, Lock, Upload, Trash2, Loader2,
  Eye, Phone, Forward, PhoneCall, AlertTriangle,
  Radio, Users, PenLine, UserPlus, UserMinus,
  CheckCircle2, XCircle, Clock, Zap, KeyRound,
  Globe, Plus, Check, Monitor, MessageCircle,
  Send, RefreshCw, ChevronLeft, Tv, LogOut,
} from "lucide-react";

interface Account {
  id: number;
  name: string;
  username?: string;
  phone: string;
  avatar?: string;
  has_avatar?: boolean;
  status?: string;
  tg_name?: string;
  proxy_id?: number | null;
  proxy_label?: string;
  is_busy?: boolean; // true если сейчас выполняет задачу
}

function getStatusKey(s: string) {
  if (!s) return "unknown";
  const lower = s.toLowerCase();
  if (lower === "active" || lower === "ok") return "active";
  if (lower.includes("ban")) return "banned";
  if (lower.includes("spam")) return "spamblock";
  if (lower.includes("flood")) return "flood";
  return "unknown";
}

const STATUS_BADGE: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  active:    { label: "Валидный",   className: "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/25", icon: CheckCircle2 },
  banned:    { label: "Забанен",    className: "bg-red-500/15 text-red-500 dark:text-red-400 border border-red-500/25",                icon: XCircle },
  spamblock: { label: "Спамблок",   className: "bg-orange-500/15 text-orange-500 dark:text-orange-400 border border-orange-500/25",    icon: AlertTriangle },
  flood:     { label: "FloodWait",  className: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/25",    icon: Clock },
  unknown:   { label: "Неизвестно", className: "bg-muted/60 text-muted-foreground border border-border",                               icon: KeyRound },
};

const AVATAR_COLORS = [
  "bg-violet-500/20 text-violet-500",
  "bg-blue-500/20 text-blue-500",
  "bg-emerald-500/20 text-emerald-500",
  "bg-orange-500/20 text-orange-500",
  "bg-pink-500/20 text-pink-500",
  "bg-cyan-500/20 text-cyan-500",
  "bg-amber-500/20 text-amber-500",
];

function getAvatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(/[\s_]/);
  return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
  onSaved?: () => void;
}

// ── Profile Tab ──────────────────────────────────────────────
const ProfileTab = ({ account, onSaved }: { account: Account; onSaved?: () => void }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const nameParts = account.name.split(" ");
  const [firstName, setFirstName] = useState(nameParts[0] || "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" ") || "");
  const [about, setAbout] = useState("");
  const initialUsername = (account.username || "").replace("@", "");
  const [username, setUsername] = useState(initialUsername);

  const save = async () => {
    setLoading(true);
    try {
      // Step 1: save name / about
      const res = await fetch("/api/accounts/edit-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ account_ids: [account.id], first_name: firstName, last_name: lastName, about }),
      });
      const data = await res.json();

      // Step 2: change username only if it was modified
      let usernameError: string | null = null;
      if (username !== initialUsername) {
        const uRes = await fetch("/api/accounts/edit-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ account_ids: [account.id], username }),
        });
        const uData = await uRes.json();
        const uDetail = uData?.results?.[0];
        if (!uRes.ok || uDetail?.ok === false) {
          usernameError = uDetail?.detail || "Не удалось изменить username";
        }
      }

      if (usernameError) {
        toast({
          title: "Username не изменён",
          description: usernameError,
          variant: "destructive",
        });
      } else {
        toast({
          title: res.ok ? "Профиль обновлён" : "Ошибка",
          description: data?.results?.[0]?.detail || (res.ok ? "Изменения сохранены" : "Не удалось сохранить"),
          variant: res.ok ? "default" : "destructive",
        });
        if (res.ok) onSaved?.();
      }
    } catch {
      toast({ title: "Ошибка сети", description: "Не удалось подключиться к серверу", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Имя</label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="bg-background border-border h-9 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Фамилия</label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-background border-border h-9 text-sm" />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">О себе</label>
        <div className="relative">
          <Textarea
            value={about}
            onChange={(e) => setAbout(e.target.value.slice(0, 70))}
            placeholder="Расскажите о себе..."
            className="bg-background border-border text-sm min-h-[80px] resize-none"
          />
          <span className="absolute bottom-2 right-2 text-[10px] text-muted-foreground">{about.length}/70</span>
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Username</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} className="bg-background border-border h-9 text-sm pl-7" />
        </div>
      </div>
      <Button onClick={save} disabled={loading} className="w-full h-9 text-sm gap-2">
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Сохранить
      </Button>
    </div>
  );
};

// ── Avatar Tab ───────────────────────────────────────────────
const AvatarTab = ({ account, onSaved }: { account: Account; onSaved?: () => void }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.type.match(/^image\/(jpeg|png)$/)) {
      toast({ title: "Неверный формат", description: "Только JPG и PNG", variant: "destructive" });
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const upload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      fd.append("account_ids", JSON.stringify([account.id]));
      const res = await fetch("/api/accounts/change-avatar", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      toast({
        title: res.ok ? "Аватар установлен" : "Ошибка",
        description: data?.results?.[0]?.detail || (res.ok ? "Фото обновлено" : "Не удалось обновить"),
        variant: res.ok ? "default" : "destructive",
      });
      if (res.ok) onSaved?.();
    } catch {
      toast({ title: "Ошибка сети", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const deleteAvatar = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/accounts/delete-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ account_ids: [account.id] }),
      });
      const data = await res.json();
      toast({
        title: res.ok ? "Аватар удалён" : "Ошибка",
        description: data?.results?.[0]?.detail || (res.ok ? "Фото удалено" : "Не удалось удалить"),
        variant: res.ok ? "default" : "destructive",
      });
      if (res.ok) { setPreview(null); setFile(null); onSaved?.(); }
    } catch {
      toast({ title: "Ошибка сети", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 transition-colors"
      >
        {preview ? (
          <img src={preview} alt="Preview" className="w-24 h-24 rounded-full object-cover mx-auto mb-3" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Upload className="h-8 w-8 text-primary/50" />
          </div>
        )}
        <p className="text-sm text-muted-foreground">Перетащите фото или нажмите для выбора</p>
        <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG</p>
      </div>
      <div className="flex gap-2">
        <Button onClick={upload} disabled={!file || loading} className="flex-1 h-9 text-sm gap-2">
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Установить аватар
        </Button>
        <Button variant="outline" onClick={deleteAvatar} disabled={deleting} className="h-9 text-sm gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10">
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Удалить
        </Button>
      </div>
    </div>
  );
};

// ── Privacy Tab ──────────────────────────────────────────────
const privacySettings = [
  { key: "last_seen", label: "Последняя активность", icon: Eye },
  { key: "phone",     label: "Номер телефона",        icon: Phone },
  { key: "photo",     label: "Фото профиля",           icon: Image },
  { key: "forwards",  label: "Пересылка сообщений",   icon: Forward },
  { key: "calls",     label: "Звонки",                 icon: PhoneCall },
];

const ruleOptions = [
  { value: "all",      label: "Все" },
  { value: "contacts", label: "Контакты" },
  { value: "nobody",   label: "Никто" },
];

const PrivacyTab = ({ account }: { account: Account }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<Record<string, string>>({
    last_seen: "all", phone: "contacts", photo: "all", forwards: "all", calls: "contacts",
  });
  const [initial] = useState({ ...rules });

  const apply = async () => {
    setLoading(true);
    const changed = Object.entries(rules).filter(([k, v]) => initial[k] !== v);
    try {
      for (const [key, rule] of changed) {
        const res = await fetch("/api/accounts/privacy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ account_ids: [account.id], setting_key: key, rule }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast({ title: "Ошибка", description: data?.results?.[0]?.detail || "Не удалось применить", variant: "destructive" });
          setLoading(false);
          return;
        }
      }
      toast({ title: "Приватность обновлена", description: `Изменено ${changed.length} настроек` });
    } catch {
      toast({ title: "Ошибка сети", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {privacySettings.map((s) => (
        <div key={s.key} className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
          <div className="flex items-center gap-2.5">
            <s.icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{s.label}</span>
          </div>
          <select
            value={rules[s.key]}
            onChange={(e) => setRules({ ...rules, [s.key]: e.target.value })}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
          >
            {ruleOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      ))}
      <Button onClick={apply} disabled={loading} className="w-full h-9 text-sm gap-2 mt-2">
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Применить
      </Button>
    </div>
  );
};

// ── Security Tab ─────────────────────────────────────────────
const SecurityTab = ({ account }: { account: Account }) => {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [hint, setHint] = useState("");
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const set2FA = async () => {
    setTwoFaLoading(true);
    try {
      const res = await fetch("/api/accounts/set-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ account_ids: [account.id], new_password: newPassword, hint, current_password: currentPassword || undefined }),
      });
      const data = await res.json();
      toast({
        title: res.ok ? "2FA установлен" : "Ошибка",
        description: data?.results?.[0]?.detail || (res.ok ? "Пароль установлен" : "Не удалось"),
        variant: res.ok ? "default" : "destructive",
      });
    } catch {
      toast({ title: "Ошибка сети", variant: "destructive" });
    } finally {
      setTwoFaLoading(false);
    }
  };

  const terminateSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch("/api/accounts/terminate-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ account_ids: [account.id] }),
      });
      const data = await res.json();
      toast({
        title: res.ok ? "Сессии завершены" : "Ошибка",
        description: data?.results?.[0]?.detail || (res.ok ? "Все сторонние сессии завершены" : "Не удалось"),
        variant: res.ok ? "default" : "destructive",
      });
    } catch {
      toast({ title: "Ошибка сети", variant: "destructive" });
    } finally {
      setSessionsLoading(false);
    }
  };

  const leaveChats = async () => {
    if (!confirmLeave) { setConfirmLeave(true); return; }
    setLeaveLoading(true);
    try {
      const res = await fetch("/api/accounts/leave-chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ account_ids: [account.id] }),
      });
      const data = await res.json();
      toast({
        title: res.ok ? "Выход выполнен" : "Ошибка",
        description: data?.results?.[0]?.detail || (res.ok ? "Аккаунт вышел из всех групп" : "Не удалось"),
        variant: res.ok ? "default" : "destructive",
      });
      setConfirmLeave(false);
    } catch {
      toast({ title: "Ошибка сети", variant: "destructive" });
    } finally {
      setLeaveLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" /> Двухфакторная аутентификация
        </h4>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Текущий пароль (если установлен)</label>
          <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="bg-background border-border h-9 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Новый пароль</label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-background border-border h-9 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Подсказка</label>
          <Input value={hint} onChange={(e) => setHint(e.target.value)} className="bg-background border-border h-9 text-sm" placeholder="Подсказка для пароля" />
        </div>
        <Button onClick={set2FA} disabled={!newPassword || twoFaLoading} className="w-full h-9 text-sm gap-2">
          {twoFaLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Установить 2FA
        </Button>
      </div>
      <div className="border-t border-border/30" />
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Сессии</h4>
        <Button variant="outline" onClick={terminateSessions} disabled={sessionsLoading} className="w-full h-9 text-sm gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
          {sessionsLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Завершить сторонние сессии
        </Button>
      </div>
      <div className="border-t border-border/30" />
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Чаты</h4>
        {confirmLeave && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Аккаунт выйдет из всех групп и каналов кроме тех, где он является создателем. Нажмите ещё раз для подтверждения.</span>
          </div>
        )}
        <Button variant="outline" onClick={leaveChats} disabled={leaveLoading} className="w-full h-9 text-sm gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10">
          {leaveLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {confirmLeave ? "Подтвердить выход" : "Покинуть все группы и каналы"}
        </Button>
      </div>
    </div>
  );
};

interface AdminChannel {
  id: number;
  title: string;
  username: string;
  type: "channel" | "group";
  is_creator: boolean;
  ref: string;
  members_count?: number | null;
}

// ── Channel Tab ──────────────────────────────────────────────
const ChannelTab = ({ account }: { account: Account }) => {
  const { toast } = useToast();

  // Create section
  const [createTitle, setCreateTitle] = useState("");
  const [createAbout, setCreateAbout] = useState("");
  const [createType, setCreateType] = useState<"channel" | "group">("channel");
  const [createLoading, setCreateLoading] = useState(false);

  // Channel list
  const [channels, setChannels] = useState<AdminChannel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<AdminChannel | null>(null);

  // Edit section
  const [editTitle, setEditTitle] = useState("");
  const [editAbout, setEditAbout] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Avatar section
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  // Admin section
  const [adminUser, setAdminUser] = useState("");
  const [adminRank, setAdminRank] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    loadChannels();
  }, [account.id]);

  const loadChannels = async () => {
    setLoadingChannels(true);
    try {
      const res = await fetch(`/api/accounts/${account.id}/admin-channels`, { credentials: "include" });
      const data = await res.json();
      if (data.ok) setChannels(data.channels || []);
    } catch {}
    finally { setLoadingChannels(false); }
  };

  // Admin permissions (Telegram-like)
  const [adminPerms, setAdminPerms] = useState({
    change_info:     true,
    post_messages:   true,
    edit_messages:   true,
    delete_messages: true,
    ban_users:       true,
    invite_users:    true,
    pin_messages:    true,
    add_admins:      false,
    manage_call:     true,
    manage_topics:   false,
  });

  const ROLE_PRESETS: Record<string, Partial<typeof adminPerms> & { rank: string }> = {
    moderator:  { rank: "Модератор",     change_info: false, post_messages: false, edit_messages: false, delete_messages: true,  ban_users: true,  invite_users: true,  pin_messages: true,  add_admins: false, manage_call: false, manage_topics: false },
    editor:     { rank: "Редактор",      change_info: true,  post_messages: true,  edit_messages: true,  delete_messages: true,  ban_users: false, invite_users: true,  pin_messages: true,  add_admins: false, manage_call: false, manage_topics: false },
    admin:      { rank: "Администратор", change_info: true,  post_messages: true,  edit_messages: true,  delete_messages: true,  ban_users: true,  invite_users: true,  pin_messages: true,  add_admins: false, manage_call: true,  manage_topics: true  },
    full_admin: { rank: "Главный адм.",  change_info: true,  post_messages: true,  edit_messages: true,  delete_messages: true,  ban_users: true,  invite_users: true,  pin_messages: true,  add_admins: true,  manage_call: true,  manage_topics: true  },
  };

  const applyPreset = (key: string) => {
    const { rank, ...perms } = ROLE_PRESETS[key];
    setAdminPerms(prev => ({ ...prev, ...perms }));
    setAdminRank(rank);
  };

  const togglePerm = (key: keyof typeof adminPerms) => {
    setAdminPerms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const showResult = (data: { results?: { ok: boolean; detail: string }[] }, fallback: string) => {
    const r = data?.results?.[0];
    toast({
      title: r?.ok ? "Готово" : "Ошибка",
      description: r?.detail || fallback,
      variant: r?.ok ? "default" : "destructive",
    });
  };

  const handleCreate = async () => {
    if (!createTitle.trim()) { toast({ title: "Введите название", variant: "destructive" }); return; }
    setCreateLoading(true);
    try {
      const res = await fetch("/api/accounts/create-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          account_ids: [account.id],
          title: createTitle,
          about: createAbout,
          is_megagroup: createType === "group",
        }),
      });
      showResult(await res.json(), createType === "group" ? "Группа создана" : "Канал создан");
      if (res.ok) { setCreateTitle(""); setCreateAbout(""); }
    } catch {
      toast({ title: "Ошибка сети", variant: "destructive" });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedChannel) return;
    setEditLoading(true);
    try {
      const res = await fetch("/api/accounts/edit-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          account_ids: [account.id],
          channel_link: selectedChannel.ref,
          title: editTitle || undefined,
          about: editAbout !== "" ? editAbout : undefined,
        }),
      });
      showResult(await res.json(), "Канал обновлён");
      if (editTitle) setSelectedChannel(prev => prev ? { ...prev, title: editTitle } : prev);
    } catch {
      toast({ title: "Ошибка сети", variant: "destructive" });
    } finally {
      setEditLoading(false);
    }
  };

  const handleAvatarFile = (f: File) => {
    setAvatarFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile || !selectedChannel) {
      toast({ title: "Выберите канал и фото", variant: "destructive" }); return;
    }
    setAvatarLoading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", avatarFile);
      fd.append("account_ids", JSON.stringify([account.id]));
      fd.append("channel_link", selectedChannel.ref);
      const res = await fetch("/api/accounts/change-channel-avatar", { method: "POST", body: fd, credentials: "include" });
      showResult(await res.json(), "Аватар канала обновлён");
    } catch {
      toast({ title: "Ошибка сети", variant: "destructive" });
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleAdmin = async (add: boolean) => {
    if (!selectedChannel || !adminUser.trim()) {
      toast({ title: "Укажите пользователя", variant: "destructive" }); return;
    }
    setAdminLoading(true);
    try {
      const res = await fetch("/api/accounts/manage-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          account_ids: [account.id],
          channel_link: selectedChannel.ref,
          user: adminUser,
          add,
          rank: adminRank,
          permissions: add ? adminPerms : undefined,
        }),
      });
      showResult(await res.json(), add ? "Администратор добавлен" : "Администратор удалён");
    } catch {
      toast({ title: "Ошибка сети", variant: "destructive" });
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Создать ── */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" /> Создать канал / группу
        </h4>
        <div className="flex gap-2">
          {(["channel", "group"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setCreateType(t)}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                createType === t
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "text-muted-foreground border-border hover:bg-muted/20"
              )}
            >
              {t === "channel" ? "Канал" : "Группа (Supergroup)"}
            </button>
          ))}
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Название</label>
          <Input value={createTitle} onChange={(e) => setCreateTitle(e.target.value)}
            placeholder="Мой канал" className="bg-background border-border h-9 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Описание (необязательно)</label>
          <Textarea value={createAbout} onChange={(e) => setCreateAbout(e.target.value)}
            placeholder="О чём этот канал..." className="bg-background border-border text-sm min-h-[60px] resize-none" />
        </div>
        <Button onClick={handleCreate} disabled={createLoading || !createTitle.trim()} className="w-full h-9 text-sm gap-2">
          {createLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radio className="h-3.5 w-3.5" />}
          Создать {createType === "channel" ? "канал" : "группу"}
        </Button>
      </div>

      <div className="border-t border-border/30" />

      {/* ── Мои каналы / группы ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Tv className="h-4 w-4 text-violet-400" /> Мои каналы и группы
          </h4>
          <button
            onClick={loadChannels}
            disabled={loadingChannels}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loadingChannels && "animate-spin")} />
          </button>
        </div>

        {loadingChannels ? (
          <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground text-xs">
            <Loader2 className="h-4 w-4 animate-spin" /> Загрузка каналов...
          </div>
        ) : channels.length === 0 ? (
          <div className="text-center py-5 text-xs text-muted-foreground">
            Нет каналов/групп где аккаунт — создатель или администратор
          </div>
        ) : (
          <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
            {channels.map(ch => (
              <button
                key={ch.id}
                onClick={() => { setSelectedChannel(ch); setEditTitle(""); setEditAbout(""); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all",
                  selectedChannel?.id === ch.id
                    ? "border-primary/40 bg-primary/8 text-foreground"
                    : "border-border/30 hover:border-border/60 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold",
                  ch.type === "channel" ? "bg-violet-500/15 text-violet-400" : "bg-blue-500/15 text-blue-400"
                )}>
                  {ch.title.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{ch.title}</div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {ch.username ? `@${ch.username}` : ch.type === "channel" ? "Приватный канал" : "Приватная группа"}
                    {ch.members_count ? ` · ${ch.members_count.toLocaleString()} уч.` : ""}
                  </div>
                </div>
                <span className={cn(
                  "text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0",
                  ch.is_creator ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"
                )}>
                  {ch.is_creator ? "Создатель" : "Админ"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Настройки выбранного канала ── */}
      {selectedChannel && (
        <>
          <div className="border-t border-border/30" />
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <PenLine className="h-4 w-4 text-violet-400" />
              <span className="truncate">{selectedChannel.title}</span>
            </h4>

            {/* Edit title / about */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Новое название</label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                  placeholder={selectedChannel.title} className="bg-background border-border h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Описание</label>
                <Input value={editAbout} onChange={(e) => setEditAbout(e.target.value)}
                  placeholder="Описание" className="bg-background border-border h-9 text-sm" />
              </div>
            </div>
            <Button onClick={handleEdit} disabled={editLoading || (!editTitle.trim() && editAbout === "")} variant="outline" className="w-full h-9 text-sm gap-2">
              {editLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PenLine className="h-3.5 w-3.5" />}
              Сохранить изменения
            </Button>

            {/* Avatar for channel */}
            <div className="border-t border-border/20 pt-3 space-y-2">
              <label className="text-xs text-muted-foreground block">Аватар канала</label>
              <input ref={avatarRef} type="file" accept="image/jpeg,image/png" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleAvatarFile(e.target.files[0])} />
              <div className="flex items-center gap-3">
                <div
                  onClick={() => avatarRef.current?.click()}
                  className="w-14 h-14 rounded-xl border-2 border-dashed border-border/60 flex items-center justify-center cursor-pointer hover:border-primary/40 transition-colors shrink-0 overflow-hidden"
                >
                  {avatarPreview
                    ? <img src={avatarPreview} className="w-full h-full object-cover" />
                    : <Upload className="h-5 w-5 text-muted-foreground" />}
                </div>
                <Button onClick={handleAvatarUpload} disabled={avatarLoading || !avatarFile} variant="outline" className="flex-1 h-9 text-sm gap-2">
                  {avatarLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Image className="h-3.5 w-3.5" />}
                  Установить аватар
                </Button>
              </div>
            </div>

            {/* Admins */}
            <div className="border-t border-border/20 pt-3 space-y-3">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <UserPlus className="h-3.5 w-3.5 text-primary" /> Управление администраторами
              </label>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">@username пользователя</label>
                  <Input value={adminUser} onChange={(e) => setAdminUser(e.target.value)}
                    placeholder="@username" className="bg-background border-border h-8 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Звание</label>
                  <Input value={adminRank} onChange={(e) => setAdminRank(e.target.value)}
                    placeholder="Модератор" className="bg-background border-border h-8 text-xs" />
                </div>
              </div>

              {/* Role presets */}
              <div>
                <label className="text-[10px] text-muted-foreground mb-1.5 block">Быстрый выбор роли</label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries({ moderator: "Модератор", editor: "Редактор", admin: "Администратор", full_admin: "Главный адм." }).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => applyPreset(key)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-border/50 bg-background/50 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Permission toggles */}
              <div className="rounded-lg border border-border/40 bg-background/30 overflow-hidden">
                <div className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30">
                  Что может делать администратор?
                </div>
                {([
                  { key: "change_info",     label: "Изменять информацию канала" },
                  { key: "post_messages",   label: "Публиковать сообщения" },
                  { key: "edit_messages",   label: "Редактировать сообщения" },
                  { key: "delete_messages", label: "Удалять сообщения" },
                  { key: "ban_users",       label: "Блокировать участников" },
                  { key: "invite_users",    label: "Добавлять участников" },
                  { key: "pin_messages",    label: "Закреплять сообщения" },
                  { key: "manage_call",     label: "Управлять трансляциями" },
                  { key: "manage_topics",   label: "Управлять темами" },
                  { key: "add_admins",      label: "Добавлять администраторов", danger: true },
                ] as { key: keyof typeof adminPerms; label: string; danger?: boolean }[]).map(({ key, label, danger }) => (
                  <div
                    key={key}
                    className={cn("flex items-center justify-between px-3 py-2.5 border-b border-border/20 last:border-0 cursor-pointer hover:bg-muted/10 transition-colors", danger && "bg-red-500/5")}
                    onClick={() => togglePerm(key)}
                  >
                    <span className={cn("text-xs", danger ? "text-red-400" : "text-foreground")}>{label}</span>
                    <div className={cn(
                      "w-10 h-5 rounded-full transition-colors relative shrink-0",
                      adminPerms[key] ? (danger ? "bg-red-500" : "bg-primary") : "bg-muted-foreground/30"
                    )}>
                      <div className={cn(
                        "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                        adminPerms[key] ? "translate-x-5" : "translate-x-0.5"
                      )} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleAdmin(true)} disabled={adminLoading || !adminUser.trim()}
                  className="flex-1 h-9 text-sm gap-2">
                  {adminLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                  Добавить
                </Button>
                <Button onClick={() => handleAdmin(false)} disabled={adminLoading || !adminUser.trim()}
                  variant="outline" className="flex-1 h-9 text-sm gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10">
                  {adminLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserMinus className="h-3.5 w-3.5" />}
                  Удалить
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ── Sessions Tab ─────────────────────────────────────────────
interface TgSession {
  hash: number;
  device_model: string;
  platform: string;
  system_version: string;
  app_name: string;
  app_version: string;
  date_active: string | null;
  ip: string;
  country: string;
  region: string;
  current: boolean;
}

function fmtDateSession(iso: string | null) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "2-digit" }) +
      " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch { return "—"; }
}

const SessionsTab = ({ account }: { account: Account }) => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<TgSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [terminating, setTerminating] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/accounts/${account.id}/sessions`, { credentials: "include" });
      const d = await r.json();
      setSessions(d.sessions || []);
    } catch {
      toast({ title: "Ошибка загрузки сессий", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [account.id]);

  const terminate = async (sess: TgSession) => {
    if (sess.current) return;
    setTerminating(sess.hash);
    try {
      const r = await fetch(`/api/accounts/${account.id}/sessions/terminate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ session_hash: sess.hash }),
      });
      const d = await r.json();
      if (d.ok) {
        toast({ title: "Сессия завершена" });
        setSessions(prev => prev.filter(s => s.hash !== sess.hash));
      } else {
        toast({ title: "Ошибка", description: d.detail || "Не удалось завершить", variant: "destructive" });
      }
    } catch {
      toast({ title: "Ошибка сети", variant: "destructive" });
    } finally {
      setTerminating(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Устройства с активной сессией</p>
        <Button size="sm" variant="ghost" onClick={load} disabled={loading} className="h-7 gap-1 text-xs">
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          Обновить
        </Button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8 text-xs text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Загрузка...
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
          Нет активных сессий
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map(sess => (
            <div
              key={sess.hash}
              className={cn(
                "flex items-start justify-between gap-3 p-3 rounded-lg border transition-colors",
                sess.current
                  ? "border-primary/30 bg-primary/5"
                  : "border-border/40 bg-background/30"
              )}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  sess.current ? "bg-primary/15" : "bg-muted/50"
                )}>
                  <Monitor className={cn("h-4 w-4", sess.current ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-medium text-foreground">
                      {sess.device_model || sess.platform || "Устройство"}
                    </span>
                    {sess.current && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">
                        Текущая
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {sess.app_name} {sess.app_version}
                    {sess.ip && ` · ${sess.ip}`}
                    {sess.country && ` · ${sess.country}`}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                    Активна: {fmtDateSession(sess.date_active)}
                  </p>
                </div>
              </div>
              {!sess.current && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => terminate(sess)}
                  disabled={terminating === sess.hash}
                  className="h-7 px-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-400 shrink-0"
                >
                  {terminating === sess.hash
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <LogOut className="h-3 w-3" />}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// ── Messenger Tab ─────────────────────────────────────────────
interface TgDialog {
  id: number;
  name: string;
  type: "user" | "group" | "channel";
  unread: number;
  last_msg: string;
  last_date: string | null;
  username: string;
}

interface TgMessage {
  id: number;
  text: string;
  date: string | null;
  out: boolean;
  from_me: boolean;
}

function fmtMsgDate(iso: string | null) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString())
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
  } catch { return ""; }
}

function DlgIcon({ type }: { type: string }) {
  if (type === "channel") return <Tv className="h-3.5 w-3.5 text-blue-400" />;
  if (type === "group") return <Users className="h-3.5 w-3.5 text-violet-400" />;
  return <User className="h-3.5 w-3.5 text-emerald-400" />;
}

const MessengerTab = ({ account }: { account: Account }) => {
  const { toast } = useToast();
  const [dialogs, setDialogs] = useState<TgDialog[]>([]);
  const [loadingDlg, setLoadingDlg] = useState(false);
  const [selected, setSelected] = useState<TgDialog | null>(null);
  const [messages, setMessages] = useState<TgMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<TgDialog | null>(null);
  const pollingMsgs = useRef(false);
  const pollingDlg = useRef(false);

  useEffect(() => { selectedRef.current = selected; }, [selected]);

  useEffect(() => {
    loadDialogs();
    // Проверяем наличие активных задач (аккаунты в работе)
    fetch("/api/tasks", { credentials: "include" })
      .then(r => r.json())
      .then((tasks: { status: string }[]) => {
        const running = tasks.filter(t => t.status === "running");
        setIsBusy(running.length > 0);
      })
      .catch(() => {});

    const dlgTimer = setInterval(async () => {
      if (pollingDlg.current) return;
      pollingDlg.current = true;
      try {
        const r = await fetch(`/api/accounts/${account.id}/dialogs?limit=100`, { credentials: "include" });
        const d = await r.json();
        setDialogs(d.dialogs || []);
      } catch { /* тихо */ } finally { pollingDlg.current = false; }
    }, 30000);
    return () => clearInterval(dlgTimer);
  }, [account.id]);

  useEffect(() => {
    if (!selected) return;
    const t = setInterval(async () => {
      if (pollingMsgs.current || !selectedRef.current) return;
      pollingMsgs.current = true;
      try {
        const r = await fetch(`/api/accounts/${account.id}/messages/${selectedRef.current.id}?limit=50`, { credentials: "include" });
        const d = await r.json();
        const newMsgs: TgMessage[] = d.messages || [];
        setMessages(prev => {
          if (prev.length === 0) return newMsgs;
          const lastId = prev[prev.length - 1].id;
          return newMsgs.some(m => m.id > lastId) ? newMsgs : prev;
        });
      } catch { /* тихо */ } finally { pollingMsgs.current = false; }
    }, 5000);
    return () => clearInterval(t);
  }, [selected?.id, account.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const loadDialogs = async () => {
    setLoadingDlg(true);
    try {
      const r = await fetch(`/api/accounts/${account.id}/dialogs?limit=100`, { credentials: "include" });
      const d = await r.json();
      setDialogs(d.dialogs || []);
    } catch { toast({ title: "Ошибка загрузки диалогов", variant: "destructive" }); }
    setLoadingDlg(false);
  };

  const openDialog = async (dlg: TgDialog) => {
    setSelected(dlg);
    setMessages([]);
    setLoadingMsgs(true);
    try {
      const r = await fetch(`/api/accounts/${account.id}/messages/${dlg.id}?limit=50`, { credentials: "include" });
      const d = await r.json();
      setMessages(d.messages || []);
    } catch { toast({ title: "Ошибка загрузки сообщений", variant: "destructive" }); }
    setLoadingMsgs(false);
  };

  const sendMsg = async () => {
    if (!selected || !text.trim() || sending) return;
    setSending(true);
    const msgText = text.trim();
    setText("");
    try {
      const r = await fetch(`/api/accounts/${account.id}/send-message`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peer_id: selected.id, text: msgText }),
      });
      const d = await r.json();
      if (d.ok) {
        setMessages(prev => [...prev, { id: Date.now(), text: msgText, date: new Date().toISOString(), out: true, from_me: true }]);
      } else {
        toast({ title: `Ошибка: ${d.detail}`, variant: "destructive" });
        setText(msgText);
      }
    } catch {
      toast({ title: "Ошибка отправки", variant: "destructive" });
      setText(msgText);
    }
    setSending(false);
  };

  const filtered = dialogs.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col" style={{ height: "420px" }}>
      {isBusy && (
        <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Аккаунты сейчас в работе. Отправка сообщений может повлиять на текущие задачи.
        </div>
      )}
      <div className="flex flex-1 min-h-0 rounded-lg border border-border/40 overflow-hidden">
        {/* Список диалогов */}
        <div className={cn(
          "flex flex-col border-r border-border/50 shrink-0 transition-all",
          selected ? "w-0 overflow-hidden sm:w-52" : "w-full sm:w-52"
        )}>
          <div className="p-1.5 border-b border-border/50 flex gap-1.5">
            <Input
              placeholder="Поиск..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-7 text-xs bg-background border-border/50"
            />
            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={loadDialogs} disabled={loadingDlg}>
              <RefreshCw className={cn("h-3 w-3", loadingDlg && "animate-spin")} />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingDlg ? (
              <div className="flex items-center justify-center h-20 text-xs text-muted-foreground gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Загрузка...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
                Диалогов нет
              </div>
            ) : filtered.map(dlg => (
              <button
                key={dlg.id}
                onClick={() => openDialog(dlg)}
                className={cn(
                  "w-full flex items-start gap-2 px-2.5 py-2 text-left hover:bg-muted/40 border-b border-border/20 transition-colors",
                  selected?.id === dlg.id && "bg-primary/10"
                )}
              >
                <div className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
                  <DlgIcon type={dlg.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-medium truncate text-foreground">{dlg.name}</span>
                    <span className="text-[9px] text-muted-foreground shrink-0">{fmtMsgDate(dlg.last_date)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] text-muted-foreground truncate">{dlg.last_msg || "—"}</span>
                    {dlg.unread > 0 && (
                      <span className="shrink-0 text-[9px] bg-primary text-primary-foreground rounded-full px-1 py-0.5 font-bold">
                        {dlg.unread > 99 ? "99+" : dlg.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Область сообщений */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <MessageCircle className="h-8 w-8 opacity-20" />
              <span className="text-xs">Выберите диалог</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 px-2.5 py-2 border-b border-border/50 shrink-0">
                <button className="sm:hidden p-0.5 rounded hover:bg-muted/40" onClick={() => setSelected(null)}>
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                  <DlgIcon type={selected.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{selected.name}</div>
                  {selected.username && <div className="text-[10px] text-muted-foreground">@{selected.username}</div>}
                </div>
                <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => openDialog(selected)} disabled={loadingMsgs}>
                  <RefreshCw className={cn("h-3 w-3", loadingMsgs && "animate-spin")} />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-1">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center h-full text-xs text-muted-foreground gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Загрузка...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Сообщений нет</div>
                ) : messages.map(msg => (
                  <div key={msg.id} className={cn("flex", msg.from_me ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-2.5 py-1.5 text-xs",
                      msg.from_me ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted/60 text-foreground rounded-bl-sm"
                    )}>
                      <p className="whitespace-pre-wrap break-words leading-snug">{msg.text}</p>
                      <p className={cn("text-[9px] mt-0.5 text-right", msg.from_me ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {fmtMsgDate(msg.date)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              <div className="px-2.5 py-2 border-t border-border/50 flex gap-1.5 shrink-0">
                <Input
                  placeholder="Написать сообщение..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMsg()}
                  className="bg-background border-border/50 text-xs h-8"
                  disabled={sending}
                />
                <Button size="icon" onClick={sendMsg} disabled={!text.trim() || sending} className="h-8 w-8 shrink-0">
                  {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


// ── Main Dialog ──────────────────────────────────────────────
const AccountManagementSheet = ({ open, onOpenChange, account, onSaved }: Props) => {
  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            {/* Avatar — real photo or colored initials */}
            <div className="w-12 h-12 rounded-full shrink-0 overflow-hidden">
              {account.has_avatar ? (
                <img
                  src={`/avatars/${account.id}.jpg`}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const el = e.currentTarget;
                    el.style.display = "none";
                    const parent = el.parentElement!;
                    const colors = getAvatarColor(account.id).split(" ");
                    parent.classList.add(...colors, "flex", "items-center", "justify-center", "text-sm", "font-bold");
                    parent.textContent = getInitials(account.name);
                  }}
                />
              ) : (
                <div className={cn("w-full h-full flex items-center justify-center text-sm font-bold", getAvatarColor(account.id))}>
                  {getInitials(account.name)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-foreground leading-tight">{account.name}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {account.tg_name ? `@${account.tg_name} · ` : account.username ? `${account.username} · ` : ""}
                {account.phone}
              </p>
              {/* Status badges row */}
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {(() => {
                  const key = getStatusKey(account.status || "");
                  const badge = STATUS_BADGE[key];
                  const Icon = badge.icon;
                  return (
                    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium", badge.className)}>
                      <Icon className="h-2.5 w-2.5" />
                      {badge.label}
                    </span>
                  );
                })()}
                {account.is_busy && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-500/15 text-violet-400 border border-violet-500/25">
                    <Zap className="h-2.5 w-2.5" />
                    В работе
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6">
          <Tabs defaultValue="profile" className="mt-4">
            <TabsList className="w-full bg-muted/30 h-9 grid grid-cols-8">
              <TabsTrigger value="profile"   className="text-[11px] gap-1 px-1"><User className="h-3 w-3" /><span className="hidden sm:inline">Профиль</span></TabsTrigger>
              <TabsTrigger value="avatar"    className="text-[11px] gap-1 px-1"><Image className="h-3 w-3" /><span className="hidden sm:inline">Аватар</span></TabsTrigger>
              <TabsTrigger value="privacy"   className="text-[11px] gap-1 px-1"><Eye className="h-3 w-3" /><span className="hidden sm:inline">Привт.</span></TabsTrigger>
              <TabsTrigger value="security"  className="text-[11px] gap-1 px-1"><Shield className="h-3 w-3" /><span className="hidden sm:inline">Безоп.</span></TabsTrigger>
              <TabsTrigger value="sessions"  className="text-[11px] gap-1 px-1"><Monitor className="h-3 w-3" /><span className="hidden sm:inline">Сессии</span></TabsTrigger>
              <TabsTrigger value="messenger" className="text-[11px] gap-1 px-1"><MessageCircle className="h-3 w-3" /><span className="hidden sm:inline">Чат</span></TabsTrigger>
              <TabsTrigger value="channel"   className="text-[11px] gap-1 px-1"><Radio className="h-3 w-3" /><span className="hidden sm:inline">Канал</span></TabsTrigger>
              <TabsTrigger value="proxy"     className="text-[11px] gap-1 px-1"><Globe className="h-3 w-3" /><span className="hidden sm:inline">Прокси</span></TabsTrigger>
            </TabsList>

            <TabsContent value="profile"   className="mt-4"><ProfileTab   account={account} onSaved={onSaved} /></TabsContent>
            <TabsContent value="avatar"    className="mt-4"><AvatarTab    account={account} onSaved={onSaved} /></TabsContent>
            <TabsContent value="privacy"   className="mt-4"><PrivacyTab   account={account} /></TabsContent>
            <TabsContent value="security"  className="mt-4"><SecurityTab  account={account} /></TabsContent>
            <TabsContent value="sessions"  className="mt-4"><SessionsTab  account={account} /></TabsContent>
            <TabsContent value="messenger" className="mt-4"><MessengerTab account={account} /></TabsContent>
            <TabsContent value="channel"   className="mt-4"><ChannelTab   account={account} /></TabsContent>
            <TabsContent value="proxy"     className="mt-4"><ProxyTab     account={account} onSaved={onSaved} /></TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── ProxyTab ─────────────────────────────────────────────────────────────────
const ProxyTab = ({ account, onSaved }: { account: Account; onSaved?: () => void }) => {
  const { toast } = useToast();
  const [proxies, setProxies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(account.proxy_id ?? null);
  const [addMode, setAddMode] = useState(false);
  const [proxyStr, setProxyStr] = useState("");
  const [proxyName, setProxyName] = useState("");
  const [testResult, setTestResult] = useState("");

  useEffect(() => {
    fetch("/api/proxies", { credentials: "include" })
      .then(r => r.json()).then(d => setProxies(Array.isArray(d) ? d : [])).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const reload = () => {
    setLoading(true);
    fetch("/api/proxies", { credentials: "include" })
      .then(r => r.json()).then(d => setProxies(Array.isArray(d) ? d : [])).catch(() => {})
      .finally(() => setLoading(false));
  };

  const addProxy = async () => {
    if (!proxyStr.trim()) return;
    setSaving(true);
    const r = await fetch("/api/proxies", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proxy_str: proxyStr.trim(), name: proxyName.trim() || proxyStr.split("@").pop() || proxyStr }),
    });
    const d = await r.json();
    setSaving(false);
    if (d.id) {
      toast({ title: "Прокси добавлен" });
      setProxyStr(""); setProxyName(""); setAddMode(false);
      reload(); setSelectedId(d.id);
    } else {
      toast({ title: "Ошибка", description: d.detail || d.error || "Не удалось добавить", variant: "destructive" });
    }
  };

  const assignProxy = async () => {
    setSaving(true);
    const r = await fetch(`/api/accounts/${account.id}/proxy`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proxy_id: selectedId }),
    });
    setSaving(false);
    if (r.ok) {
      toast({ title: selectedId ? "Прокси привязан к аккаунту" : "Прокси снят" });
      account.proxy_id = selectedId;  // обновляем локально чтобы "Текущий прокси" отображал актуальное
      onSaved?.();
    } else {
      const d = await r.json();
      toast({ title: "Ошибка", description: d.detail || "Не удалось", variant: "destructive" });
    }
  };

  const testProxy = async () => {
    const body = selectedId ? { proxy_id: selectedId } : { proxy_str: proxyStr.trim() };
    if (!selectedId && !proxyStr.trim()) return;
    setTesting(true); setTestResult("");
    const endpoint = selectedId ? "/api/proxies/test-by-id" : "/api/proxies/test";
    const r = await fetch(endpoint, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const d = await r.json();
    setTestResult(d.ok ? `✓ Работает · ${d.ip || ""} · ${d.latency_ms || "?"}ms` : `✗ ${d.error || "Не работает"}`);
    setTesting(false);
  };

  const current = proxies.find(p => p.id === selectedId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-violet-400" />
          <div>
            <p className="text-xs font-medium text-foreground">Текущий прокси</p>
            <p className="text-[11px] text-muted-foreground">
              {current ? `${current.name} · ${current.host}:${current.port}` : account.proxy_label || "Не назначен"}
            </p>
          </div>
        </div>
        {(account.proxy_id || current) && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Активен</span>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Выбрать прокси</label>
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-2"><Loader2 className="h-3 w-3 animate-spin" /> Загрузка...</div>
        ) : (
          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            <button onClick={() => setSelectedId(null)}
              className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-xs text-left transition-all",
                selectedId === null ? "border-violet-500/40 bg-violet-500/5 text-violet-400" : "border-border/30 text-muted-foreground hover:border-border/60")}>
              <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", selectedId === null ? "bg-violet-400" : "bg-muted-foreground/30")} />
              Без прокси
            </button>
            {proxies.map(p => (
              <button key={p.id} onClick={() => setSelectedId(p.id)}
                className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-xs text-left transition-all",
                  selectedId === p.id ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/30 hover:border-border/60")}>
                <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", selectedId === p.id ? "bg-emerald-400" : "bg-muted-foreground/30")} />
                <span className={cn("font-medium", selectedId === p.id ? "text-emerald-400" : "text-foreground")}>{p.name}</span>
                <span className="text-muted-foreground font-mono ml-auto text-[10px]">{p.host}:{p.port}</span>
                {selectedId === p.id && <Check className="h-3 w-3 text-emerald-400 shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {!addMode ? (
        <button onClick={() => setAddMode(true)} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
          <Plus className="h-3.5 w-3.5" /> Добавить новый прокси
        </button>
      ) : (
        <div className="space-y-2 p-3 rounded-lg border border-border/40 bg-muted/20">
          <p className="text-xs font-medium text-foreground">Новый прокси</p>
          <Input placeholder="socks5://user:pass@host:port" value={proxyStr} onChange={e => setProxyStr(e.target.value)}
            className="h-8 text-xs font-mono bg-background border-border/50" />
          <Input placeholder="Название (необязательно)" value={proxyName} onChange={e => setProxyName(e.target.value)}
            className="h-8 text-xs bg-background border-border/50" />
          <div className="flex gap-2">
            <Button size="sm" onClick={addProxy} disabled={saving || !proxyStr.trim()} className="h-7 text-xs flex-1">
              {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />} Добавить
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setAddMode(false); setProxyStr(""); }} className="h-7 text-xs">Отмена</Button>
          </div>
        </div>
      )}

      {testResult && (
        <p className={cn("text-xs px-3 py-2 rounded-lg", testResult.startsWith("✓") ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
          {testResult}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Button size="sm" variant="outline" onClick={testProxy} disabled={testing} className="h-8 text-xs border-border/50">
          {testing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Globe className="h-3 w-3 mr-1" />} Проверить
        </Button>
        <Button size="sm" onClick={assignProxy} disabled={saving} className="h-8 text-xs flex-1 bg-violet-600 hover:bg-violet-700 text-white">
          {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
          {selectedId ? "Привязать прокси" : "Снять прокси"}
        </Button>
      </div>
    </div>
  );
};

export default AccountManagementSheet;
