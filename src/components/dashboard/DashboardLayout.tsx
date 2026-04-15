import { Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Users, Send, Brain, Flame, Zap,
  Eye, ClipboardList, Settings, Bell, Crown, LogOut, ChevronDown,
  ChevronLeft, ChevronRight, Camera, Menu, Moon, Sun,
  Globe, MessageSquare, Gift, CalendarClock, ListTodo,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

interface NavItem {
  title: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
  comingSoon?: boolean;
  children?: { title: string; path: string }[];
}

const mainNav: NavItem[] = [
  { title: "Дашборд",     path: "/dashboard",     icon: LayoutDashboard },
  { title: "Аккаунты",    path: "/accounts",      icon: Users           },
  { title: "Прокси",      path: "/proxies",       icon: Globe           },
  { title: "Задачи",      path: "/tasks",         icon: ListTodo        },
  { title: "История",     path: "/notifications", icon: Bell            },
];

const userModulesNav: NavItem[] = [
  { title: "Прогрев",      path: "/warming",     icon: Flame        },
  { title: "Инвайтинг",    path: "/inviting",    icon: Send         },
  { title: "Парсинг",      path: "/parsing",     icon: ClipboardList},
  { title: "Реакции",      path: "/reactions",   icon: Zap,         comingSoon: true },
  { title: "Комментинг",   path: "/commenting",  icon: Brain        },
  { title: "Масслукинг",   path: "/storylooking",icon: Eye,         comingSoon: true },
  { title: "Теггер",       path: "/storytagger", icon: Camera,      comingSoon: true },
  { title: "Чаттинг",      path: "/chatting",    icon: MessageSquare, comingSoon: true },
];

const adminModulesNav: NavItem[] = [
  { title: "Реакции",    path: "/reactions",    icon: Zap           },
  { title: "Масслукинг", path: "/storylooking", icon: Eye           },
  { title: "Теггер",     path: "/storytagger",  icon: Camera        },
  { title: "Чаттинг",   path: "/chatting",     icon: MessageSquare },
];

const managementNav: NavItem[] = [
  { title: "Планировщик", path: "/schedule", icon: CalendarClock },
  { title: "Рефералка",   path: "/referral", icon: Gift          },
  { title: "Настройки",   path: "/settings", icon: Settings      },
];

const MODULE_COLORS: Record<string, { icon: string; bg: string; dot: string }> = {
  "/inviting":    { icon: "text-cyan-500",    bg: "bg-cyan-500/8",    dot: "bg-cyan-500"    },
  "/commenting":  { icon: "text-violet-500",  bg: "bg-violet-500/8",  dot: "bg-violet-500"  },
  "/warming":     { icon: "text-orange-500",  bg: "bg-orange-500/8",  dot: "bg-orange-500"  },
  "/storylooking":{ icon: "text-emerald-500", bg: "bg-emerald-500/8", dot: "bg-emerald-500" },
  "/storytagger": { icon: "text-pink-500",    bg: "bg-pink-500/8",    dot: "bg-pink-500"    },
  "/reactions":   { icon: "text-amber-500",   bg: "bg-amber-500/8",   dot: "bg-amber-500"   },
  "/parsing":     { icon: "text-blue-500",    bg: "bg-blue-500/8",    dot: "bg-blue-500"    },
  "/proxies":     { icon: "text-sky-500",     bg: "bg-sky-500/8",     dot: "bg-sky-500"     },
  "/chatting":    { icon: "text-teal-500",    bg: "bg-teal-500/8",    dot: "bg-teal-500"    },
  "/referral":    { icon: "text-purple-500",  bg: "bg-purple-500/8",  dot: "bg-purple-500"  },
  "/schedule":    { icon: "text-sky-500",     bg: "bg-sky-500/8",     dot: "bg-sky-500"     },
  "/tasks":       { icon: "text-slate-500",   bg: "bg-slate-500/8",   dot: "bg-slate-500"   },
};

const NavSection = ({
  label, items, collapsed, pathname, onNav, runningPaths,
}: {
  label: string; items: NavItem[]; collapsed: boolean;
  pathname: string;
  onNav: (path: string) => void;
  runningPaths?: string[];
}) => {
  const [openSubs, setOpenSubs] = useState<Record<string, boolean>>({});

  return (
    <div className="mb-1">
      {!collapsed && (
        <p className="px-4 pt-3 pb-1 text-[9px] font-semibold tracking-widest uppercase text-muted-foreground/35 select-none">
          {label}
        </p>
      )}
      {collapsed && <div className="mx-3 my-2 h-px bg-border/40" />}
      <div className="space-y-0.5 px-2">
        {items.map((item) => {
          const active = pathname === item.path || pathname.startsWith(item.path + "/");
          const hasChildren = item.children && item.children.length > 0;
          const isOpen = openSubs[item.path] ?? active;
          const mc = MODULE_COLORS[item.path];
          const isRunning = runningPaths?.includes(item.path);

          if (hasChildren) {
            return (
              <Collapsible key={item.path} open={isOpen} onOpenChange={(o) => setOpenSubs(s => ({ ...s, [item.path]: o }))}>
                <CollapsibleTrigger asChild>
                  <button className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all relative",
                    active ? cn("text-primary", mc ? mc.bg : "bg-primary/10") : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}>
                    {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />}
                    <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : mc?.icon)} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left truncate">{item.title}</span>
                        <ChevronDown className={cn("h-3 w-3 transition-transform opacity-40", isOpen && "rotate-180")} />
                      </>
                    )}
                  </button>
                </CollapsibleTrigger>
                {!collapsed && (
                  <CollapsibleContent>
                    <div className="ml-7 mt-0.5 space-y-0.5 border-l border-border/50 pl-3">
                      {item.children!.map((child) => {
                        const childActive = pathname === child.path;
                        return (
                          <button key={child.path}
                            onClick={() => onNav(child.path)}
                            className={cn(
                              "w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all",
                              childActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                            )}
                          >
                            {child.title}
                          </button>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                )}
              </Collapsible>
            );
          }

          if (item.comingSoon) {
            return (
              <div key={item.path}
                title={collapsed ? `${item.title} — скоро` : undefined}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium cursor-default select-none relative text-muted-foreground/40",
                  collapsed && "justify-center px-0"
                )}
              >
                <div className={cn("relative shrink-0", collapsed && "flex items-center justify-center w-8 h-8 rounded-xl")}>
                  <item.icon className="h-4 w-4 opacity-40" />
                </div>
                {!collapsed && (
                  <>
                    <span className="truncate flex-1 opacity-50">{item.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted/60 text-muted-foreground/60 font-medium border border-border/40 shrink-0">Скоро</span>
                  </>
                )}
                {collapsed && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-muted-foreground/30 border border-background" title="Скоро" />
                )}
              </div>
            );
          }

          return (
            <button key={item.path}
              onClick={() => onNav(item.path)}
              title={collapsed ? item.title : undefined}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all relative group",
                active ? cn("text-primary", mc ? mc.bg : "bg-primary/10") : "text-muted-foreground hover:text-foreground hover:bg-secondary/70",
                collapsed && "justify-center px-0"
              )}
            >
              {active && !collapsed && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />}
              <div className={cn("relative shrink-0", collapsed && "flex items-center justify-center w-8 h-8 rounded-xl", active && collapsed && mc && mc.bg)}>
                <item.icon className={cn("h-4 w-4", active ? "text-primary" : mc?.icon)} />
                {isRunning && (
                  <span className={cn("absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ring-1 ring-background animate-pulse", mc?.dot ?? "bg-primary")} />
                )}
              </div>
              {!collapsed && <span className="flex-1 text-left truncate">{item.title}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [runningPaths, setRunningPaths] = useState<string[]>([]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    fetch("/api/tasks", { credentials: "include" })
      .then(r => r.json())
      .then(tasks => {
        if (!Array.isArray(tasks)) return;
        const toolPathMap: Record<string, string> = {
          inviting: "/inviting", commenting: "/commenting", warming: "/warming",
          masslooking: "/storylooking", parsing: "/parsing", reactions: "/reactions",
          story_tagger: "/storytagger", chatting: "/chatting",
        };
        const running = tasks
          .filter((t: any) => t.status === "running")
          .map((t: any) => toolPathMap[t.tool])
          .filter(Boolean);
        setRunningPaths(running as string[]);
      })
      .catch(() => {});
  }, [location.pathname]);

  const isAdmin = user?.is_admin ?? false;
  const modulesNav = isAdmin ? [...userModulesNav.filter(m => !m.comingSoon), ...adminModulesNav] : userModulesNav;
  const uniqueModules = modulesNav.filter((m, i, arr) => arr.findIndex(x => x.path === m.path) === i);

  const handleNav = (path: string) => {
    navigate({ to: path as any });
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" as any });
    toast.success("Вы вышли из системы");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className={cn("flex items-center gap-2 px-4 py-4 border-b border-border/40", collapsed && "justify-center px-2")}>
        <img src="/logo.png" className="w-8 h-8 object-contain" alt="TeleBoost" />
        {!collapsed && (
          <span className="text-lg font-black tracking-tight text-foreground">
            Tele<span className="text-primary">Boost</span>
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <NavSection label="Навигация" items={mainNav} collapsed={collapsed} pathname={location.pathname} onNav={handleNav} runningPaths={runningPaths} />
        <NavSection label="Инструменты" items={uniqueModules} collapsed={collapsed} pathname={location.pathname} onNav={handleNav} runningPaths={runningPaths} />
        <NavSection label="Управление" items={[...managementNav, ...(isAdmin ? [{ title: "Админ", path: "/admin", icon: Crown }] : [])] as NavItem[]} collapsed={collapsed} pathname={location.pathname} onNav={handleNav} />
      </div>

      <div className="border-t border-border/40 p-3 space-y-2">
        {!collapsed && (
          <button
            onClick={() => handleNav("/subscription")}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium text-amber-400 hover:bg-amber-500/10 transition-colors"
          >
            <Crown className="h-4 w-4" />
            Подписка
          </button>
        )}
        <div className="flex items-center justify-between">
          <button onClick={() => setDark(!dark)} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Тема">
            {dark ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
          </button>
          {!isMobile && (
            <button onClick={() => setCollapsed(!collapsed)} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Свернуть">
              {collapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronLeft className="h-4 w-4 text-muted-foreground" />}
            </button>
          )}
          <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors" title="Выйти">
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-card/95 backdrop-blur-md border-b border-border/50">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              {sidebarContent}
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <img src="/logo.png" className="w-6 h-6 object-contain" alt="" />
            <span className="text-sm font-bold text-foreground">Tele<span className="text-primary">Boost</span></span>
          </div>
        </div>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AnimatePresence mode="wait">
        <motion.aside
          key={collapsed ? "collapsed" : "expanded"}
          initial={{ width: collapsed ? 240 : 72 }}
          animate={{ width: collapsed ? 72 : 240 }}
          transition={{ duration: 0.2 }}
          className="sticky top-0 h-screen border-r border-border/40 bg-card/50 overflow-hidden shrink-0"
        >
          {sidebarContent}
        </motion.aside>
      </AnimatePresence>
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
