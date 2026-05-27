import { Link, useLocation } from "wouter";
import { useCourierAuthStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { LayoutDashboard, List, LogOut } from "lucide-react";

const NAV = [
  { href: "/courier",        label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/courier/orders", label: "Deliveries", icon: List },
];

export function CourierLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { courier, logout } = useCourierAuthStore();

  const isActive = (href: string, exact?: boolean) =>
    exact ? location === href : location.startsWith(href);

  const handleLogout = () => { logout(); navigate("/courier/login"); };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="fixed top-0 inset-x-0 z-30 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.3)" }}>
            <span className="text-cyan-400 font-bold text-xs">CR</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-100 truncate">Courier Portal</p>
            {courier && <p className="text-[0.65rem] text-slate-500 truncate">{courier.name}</p>}
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-slate-400 hover:text-red-300 text-sm transition-colors">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Log Out</span>
        </button>
      </header>

      <main className="flex-1 pt-14 pb-20">
        {children}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 flex items-center justify-around h-16">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link key={href} href={href}>
              <div className={cn(
                "flex flex-col items-center gap-0.5 px-5 py-1 rounded-lg transition-colors cursor-pointer",
                active ? "text-cyan-400" : "text-slate-500",
              )}>
                <Icon className="w-5 h-5" />
                <span className="text-[0.6rem] font-medium">{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
