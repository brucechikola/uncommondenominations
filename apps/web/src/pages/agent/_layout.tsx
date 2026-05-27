import { Link, useLocation } from "wouter";
import { useAgentAuthStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { LayoutDashboard, PlusCircle, List, LogOut } from "lucide-react";

const NAV = [
  { href: "/agent",        label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/agent/new",    label: "New Order",  icon: PlusCircle },
  { href: "/agent/orders", label: "My Orders",  icon: List },
];

export function AgentLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { agent, logout } = useAgentAuthStore();

  const isActive = (href: string, exact?: boolean) =>
    exact ? location === href : location.startsWith(href);

  const handleLogout = () => { logout(); navigate("/agent/login"); };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="fixed top-0 inset-x-0 z-30 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(141,107,61,0.15)", border: "1px solid rgba(141,107,61,0.35)" }}>
            <span className="text-[#b08a58] font-bold text-xs">UD</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-100 truncate">Agent Portal</p>
            {agent && <p className="text-[0.65rem] text-slate-500 truncate">{agent.name}</p>}
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-slate-400 hover:text-red-300 text-sm transition-colors">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Log Out</span>
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 pt-14 pb-20">
        {children}
      </main>

      {/* Bottom nav (mobile-first) */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 flex items-center justify-around h-16">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link key={href} href={href}>
              <div className={cn(
                "flex flex-col items-center gap-0.5 px-5 py-1 rounded-lg transition-colors cursor-pointer",
                active ? "text-[#b08a58]" : "text-slate-500",
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
