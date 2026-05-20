import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { D } from "./_shared";
import { useAdminAuthStore } from "@/lib/store";
import {
  LayoutDashboard, ShoppingBag, Star, MessageSquare,
  CreditCard, Settings, LogOut,
} from "lucide-react";

const NAV = [
  { href: "/admin",           label: "Dashboard",     icon: LayoutDashboard, exact: true },
  { href: "/admin/orders",    label: "Orders",        icon: ShoppingBag },
  { href: "/admin/reviews",   label: "Reviews",       icon: Star },
  { href: "/admin/messages",  label: "Messages",      icon: MessageSquare },
  { href: "/admin/payments",  label: "Payments",      icon: CreditCard },
  { href: "/admin/settings",  label: "Settings",      icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { logout } = useAdminAuthStore();

  const isActive = (href: string, exact?: boolean) =>
    exact ? location === href : location.startsWith(href);

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className={cn("min-h-screen flex", D.bg)}>
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className={cn(
        "hidden md:flex flex-col w-56 flex-shrink-0 fixed top-0 left-0 h-full z-30 border-r",
        D.sidebar, D.border,
      )}>
        {/* Logo */}
        <div className={cn("px-5 py-5 border-b", D.border)}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(141,107,61,0.15)", border: "1px solid rgba(141,107,61,0.35)" }}>
              <span className="text-[#b08a58] font-bold text-xs">UD</span>
            </div>
            <div className="min-w-0">
              <p className="text-[0.7rem] font-bold text-slate-100 uppercase tracking-wider leading-tight truncate">
                Uncommon
              </p>
              <p className="text-[0.6rem] text-slate-500 uppercase tracking-wider leading-tight truncate">
                Admin Panel
              </p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link key={href} href={href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer",
                  active
                    ? "bg-[#8d6b3d]/20 text-[#b08a58] border border-[#8d6b3d]/30"
                    : cn(D.muted, "hover:bg-white/5 hover:text-slate-200 border border-transparent"),
                )}>
                  <Icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-[#b08a58]" : "")} />
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className={cn("px-3 py-4 border-t", D.border)}>
          <button onClick={handleLogout}
            className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              D.muted, "hover:bg-white/5 hover:text-red-300")}>
            <LogOut className="h-4 w-4 flex-shrink-0" />
            Log Out
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ───────────────────────────────────────── */}
      <div className={cn("md:hidden fixed top-0 inset-x-0 z-30 border-b flex items-center justify-between px-4 h-13", D.sidebar, D.border)}>
        <span className={cn("text-sm font-bold", D.text)}>Admin</span>
        <div className="flex items-center gap-1 overflow-x-auto">
          {NAV.map(({ href, icon: Icon, label, exact }) => (
            <Link key={href} href={href}>
              <div title={label} className={cn(
                "p-2 rounded-lg transition-colors",
                isActive(href, exact) ? "text-[#b08a58]" : D.muted,
              )}>
                <Icon className="h-4 w-4" />
              </div>
            </Link>
          ))}
          <button onClick={handleLogout} className={cn("p-2 rounded-lg transition-colors", D.muted, "hover:text-red-300")}>
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="flex-1 md:ml-56 pt-13 md:pt-0 min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
