import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAgentAuthStore } from "@/lib/store";
import { AgentLayout } from "./_layout";
import { ShoppingBag, TrendingUp, Clock, CheckCircle, PlusCircle, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface AgentStats {
  totalOrders: number;
  totalRevenue: number;
  pendingPayments: number;
  confirmedOrders: number;
}

interface AgentOrder {
  id: number;
  fullName: string;
  productType: string;
  quantity: number;
  totalAmount: number;
  status: string;
  pricingTier: string;
  paymentLink: string | null;
  createdAt: string;
  payment: { status: string } | null;
}

function fmtMoney(n: number) {
  return `K${n.toLocaleString("en-ZM", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const STATUS_PILL: Record<string, string> = {
  pending:           "bg-amber-50 text-amber-700 border border-amber-200",
  confirmed:         "bg-blue-50 text-blue-700 border border-blue-200",
  awaiting_delivery: "bg-orange-50 text-orange-700 border border-orange-200",
  shipped:           "bg-indigo-50 text-indigo-700 border border-indigo-200",
  delivered:         "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelled:         "bg-red-50 text-red-300 border border-red-200",
};

export default function AgentDashboard() {
  const [, navigate] = useLocation();
  const { token, isAuthenticated } = useAgentAuthStore();
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [orders, setOrders] = useState<AgentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { navigate("/agent/login"); return; }
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch("/api/agent/stats", { headers }).then(r => r.json()),
      fetch("/api/agent/orders?limit=5", { headers }).then(r => r.json()),
    ]).then(([s, o]) => {
      setStats(s);
      setOrders(o.orders ?? []);
    }).finally(() => setLoading(false));
  }, [isAuthenticated, token, navigate]);

  if (!isAuthenticated) return null;

  return (
    <AgentLayout>
      <div className="px-4 py-5 max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Your sales overview</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total Orders", value: loading ? "—" : stats?.totalOrders ?? 0, icon: ShoppingBag, color: "#b08a58" },
            { label: "Revenue", value: loading ? "—" : fmtMoney(stats?.totalRevenue ?? 0), icon: TrendingUp, color: "#34d399" },
            { label: "Pending Pay.", value: loading ? "—" : stats?.pendingPayments ?? 0, icon: Clock, color: "#fb923c" },
            { label: "Confirmed", value: loading ? "—" : stats?.confirmedOrders ?? 0, icon: CheckCircle, color: "#60a5fa" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl p-4 bg-white border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <span className="text-slate-400 text-xs">{label}</span>
              </div>
              <span className="text-xl font-bold text-slate-100">{value}</span>
            </div>
          ))}
        </div>

        {/* Quick action */}
        <Link href="/agent/new">
          <div className="rounded-2xl p-4 border flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
            style={{ background: "rgba(141,107,61,0.1)", borderColor: "rgba(141,107,61,0.35)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(141,107,61,0.2)" }}>
              <PlusCircle className="w-5 h-5 text-[#b08a58]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-100 font-semibold text-sm">Create New Order</p>
              <p className="text-slate-400 text-xs mt-0.5">Record a sale and get a payment link</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
          </div>
        </Link>

        {/* Recent orders */}
        {orders.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-300">Recent Orders</h2>
              <Link href="/agent/orders">
                <span className="text-[#b08a58] text-xs font-medium">View all</span>
              </Link>
            </div>
            <div className="space-y-2">
              {orders.map(order => (
                <div key={order.id} className="rounded-xl p-3.5 bg-white border border-slate-200 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-100 text-sm font-medium truncate">{order.fullName}</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {order.quantity}× {order.productType} · {fmtMoney(order.totalAmount)}
                    </p>
                  </div>
                  <span className={cn("text-[0.65rem] font-medium px-2 py-0.5 rounded-full capitalize flex-shrink-0",
                    STATUS_PILL[order.status] ?? STATUS_PILL.pending)}>
                    {order.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AgentLayout>
  );
}
