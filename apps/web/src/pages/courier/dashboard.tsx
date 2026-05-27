import { useLocation } from "wouter";
import { useCourierAuthStore } from "@/lib/store";
import { CourierLayout } from "./_layout";
import { useGetCourierStats, useListCourierOrders } from "@workspace/api-client-react";
import { Truck, CheckCircle, Clock, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  awaiting_delivery: "bg-orange-50 text-orange-700",
  picked_up:         "bg-cyan-50 text-cyan-300",
  in_transit:        "bg-violet-50 text-violet-700",
  delivered:         "bg-emerald-50 text-emerald-700",
  failed_delivery:   "bg-rose-50 text-rose-700",
};

const formatStatus = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

export default function CourierDashboard() {
  const [, navigate] = useLocation();
  const { token, isAuthenticated } = useCourierAuthStore();

  if (!isAuthenticated) {
    navigate("/courier/login");
    return null;
  }

  const authHeader = { Authorization: `Bearer ${token}` };

  const { data: stats, isLoading: statsLoading } = useGetCourierStats({
    request: { headers: authHeader },
  });

  const { data: activeOrders, isLoading: ordersLoading } = useListCourierOrders(
    { status: "awaiting_delivery,picked_up,in_transit" },
    { request: { headers: authHeader } },
  );

  const statCards = [
    { label: "Assigned",   value: stats?.assignedOrders  ?? 0, icon: Truck,         color: "text-cyan-400" },
    { label: "Delivered",  value: stats?.deliveredOrders ?? 0, icon: CheckCircle,   color: "text-emerald-400" },
    { label: "In Transit", value: stats?.inTransitOrders ?? 0, icon: Clock,         color: "text-violet-400" },
    { label: "Failed",     value: stats?.failedOrders    ?? 0, icon: AlertTriangle, color: "text-rose-400" },
  ];

  return (
    <CourierLayout>
      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Dashboard</h2>
          <p className="text-slate-500 text-sm mt-0.5">Your delivery overview</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn("w-4 h-4", color)} />
                <span className="text-xs text-slate-500 font-medium">{label}</span>
              </div>
              {statsLoading
                ? <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
                : <p className={cn("text-2xl font-bold", color)}>{value}</p>
              }
            </div>
          ))}
        </div>

        {/* Active deliveries */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-300">Active Deliveries</h3>
            <button onClick={() => navigate("/courier/orders")}
              className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {ordersLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
            </div>
          )}

          {!ordersLoading && (!activeOrders?.orders?.length) && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
              <Truck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No active deliveries right now</p>
            </div>
          )}

          {!ordersLoading && activeOrders?.orders?.map(order => (
            <div key={order.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 mb-3 cursor-pointer hover:border-cyan-800 transition-colors"
              onClick={() => navigate("/courier/orders")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-100 truncate">{order.fullName}</p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{order.deliveryAddress}, {order.city}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {order.quantity}× {order.productType} · K{Number(order.totalAmount).toLocaleString()}
                  </p>
                </div>
                <span className={cn("px-2 py-0.5 rounded-full text-[0.65rem] font-medium whitespace-nowrap flex-shrink-0",
                  STATUS_COLORS[order.status] ?? "bg-slate-400/15 text-slate-300")}>
                  {formatStatus(order.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CourierLayout>
  );
}
