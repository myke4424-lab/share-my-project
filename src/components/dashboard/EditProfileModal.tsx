import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles, RefreshCw, ImagePlus, Phone, AtSign, User, X, Check,
} from "lucide-react";
import { useState } from "react";

interface Account {
  id: number;
  name: string;
  username: string;
  phone: string;
  avatar: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
}

const EditProfileModal = ({ open, onOpenChange, account }: Props) => {
  const [firstName, setFirstName] = useState(account?.name.split(" ")[0] || "");
  const [lastName, setLastName] = useState(account?.name.split(" ")[1] || "");
  const [username, setUsername] = useState(account?.username.replace("@", "") || "");
  const [bio, setBio] = useState("Люблю путешествия и технологии 🚀");
  const [gender, setGender] = useState("male");
  const [country, setCountry] = useState("ru");
  const [minAge, setMinAge] = useState("20");
  const [maxAge, setMaxAge] = useState("35");
  const [addPhoto, setAddPhoto] = useState(false);

  // Reset on account change
  const displayName = account ? account.name : "Аккаунт";
  const displayId = account?.id || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-card border-border p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-lg font-bold text-foreground">
            Редактирование профиля — {displayName} • <span className="text-muted-foreground font-normal">ID: {displayId}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-6">
          {/* Left panel */}
          <div className="lg:col-span-3 space-y-6">
            {/* AI Generation */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-violet-500/20 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                </div>
                AI Генерация
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Пол</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                  >
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Страна / Язык</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                  >
                    <option value="ru">🇷🇺 Россия</option>
                    <option value="en">🇺🇸 США</option>
                    <option value="de">🇩🇪 Германия</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Мин. возраст</label>
                  <Input value={minAge} onChange={(e) => setMinAge(e.target.value)} className="bg-background border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Макс. возраст</label>
                  <Input value={maxAge} onChange={(e) => setMaxAge(e.target.value)} className="bg-background border-border" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                  <Sparkles className="h-4 w-4" /> Сгенерировать весь профиль
                </Button>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={addPhoto} onChange={(e) => setAddPhoto(e.target.checked)} className="rounded border-border" />
                  + фото
                </label>
              </div>
            </div>

            {/* Profile Data */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
                Данные профиля
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Имя</label>
                  <div className="relative">
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="bg-background border-border pr-8" />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Фамилия</label>
                  <div className="relative">
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-background border-border pr-8" />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Username</label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} className="bg-background border-border pl-8" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-muted-foreground">О себе</label>
                  <span className="text-[10px] text-muted-foreground">{bio.length}/70</span>
                </div>
                <textarea
                  value={bio}
                  onChange={(e) => { if (e.target.value.length <= 70) setBio(e.target.value); }}
                  className="w-full h-20 bg-background border border-border rounded-lg p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Photo section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Фото профиля</h3>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2 border-border">
                  <ImagePlus className="h-4 w-4" /> Выбрать фото
                </Button>
                <Button variant="outline" className="gap-2 border-violet-500/30 text-violet-400 hover:bg-violet-500/10">
                  <Sparkles className="h-4 w-4" /> Сгенерировать фото
                </Button>
              </div>
            </div>
          </div>

          {/* Right panel — Telegram Preview */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-foreground mb-3">Превью Telegram</h3>
            <div className="panel-card rounded-2xl overflow-hidden">
              {/* Telegram header */}
              <div className="bg-primary/15 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">User Info</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                </div>
              </div>

              {/* Avatar */}
              <div className="flex flex-col items-center py-6 gap-2">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/40 to-violet-500/40 flex items-center justify-center text-2xl font-bold text-foreground">
                  {firstName?.[0] || "?"}{lastName?.[0] || ""}
                </div>
                <p className="text-lg font-semibold text-foreground">{firstName} {lastName}</p>
                <p className="text-xs text-muted-foreground">last seen recently</p>
              </div>

              {/* Info rows */}
              <div className="px-4 pb-4 space-y-3">
                {bio && (
                  <div className="text-sm text-foreground">{bio}</div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <AtSign className="h-4 w-4 text-primary" />
                  <span className="text-foreground">@{username || "username"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="text-foreground">{account?.phone || "+7 999 000-00-00"}</span>
                </div>
              </div>

              {/* Add to contacts button */}
              <div className="px-4 pb-4">
                <div className="w-full py-2.5 rounded-lg bg-primary/15 text-primary text-center text-sm font-medium">
                  ADD TO CONTACTS
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border/50 px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Изменения будут применены к вашему Telegram аккаунту</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Отменить</Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Check className="h-4 w-4" /> Сохранить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;
