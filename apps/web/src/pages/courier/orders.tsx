import { useState } from "react";
import { useLocation } from "wouter";
import { useCourierAuthStore } from "@/lib/store";
import { CourierLayout } from "./_layout";
import { useListCourierOrders, useUpdateCourierOrderStatus } from "@workspace/api-client-react";
import { Truck, ChevronDown, ChevronUp, Loader2, AlertTriangle, Phone, MapPin, Package, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { getListCourierOrdersQueryKey } from "@workspace/api-client-react";

const STATUS_COLORS: Record<string, string> = {
  awaiting_delivery: "bg-orange-50 text-orange-700 border border-orange-200",
  picked_up:         "bg-cyan-50 text-cyan-300 border border-cyan-200",
  in_transit:        "bg-violet-50 text-violet-700 border border-violet-200",
  delivered:         "bg-emerald-50 text-emerald-700 border border-emerald-200",
  failed_delivery:   "bg-rose-50 text-rose-700 border border-rose-200",
};

const NEXT_STATUSES: Record<string, { value: string; label: string; color: string }[]> = {
  awaiting_delivery: [{ value: "picked_up", label: "Mark Picked Up", color: "bg-cyan-700 hover:bg-cyan-600" }],
  picked_up:         [{ value: "in_transit", label: "Mark In Transit", color: "bg-violet-700 hover:bg-violet-600" }],
  in_transit: [
    { value: "delivered",     label: "Mark Delivered",      color: "bg-emerald-700 hover:bg-emerald-600" },
    { value: "failed_delivery", label: "Mark Failed Delivery", color: "bg-rose-700 hover:bg-rose-600" },
  ],
};

const formatStatus = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

const DELIVERY_METHOD_LABELS: Record<string, string> = {
  mobile_money_on_delivery: "Mobile Money on Delivery",
  bank_transfer:            "Bank Transfer on Delivery",
};

export default function CourierOrders() {
  const [, navigate] = useLocation();
  const { token, isAuthenticated } = useCourierAuthStore();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const qc = useQueryClient();

  if (!isAuthenticated) {
    navigate("/courier/login");
    return null;
  }

  const authHeader = { Authorization: `Bearer ${token}` };

  const { data, isLoading } = useListCourierOrders(
    {},
    { request: { headers: authHeader } },
  );

  const { mutateAsync: updateStatus } = useUpdateCourierOrderStatus({
    request: { headers: authHeader },
  });

  const handleStatusUpdate = async (orderId: number, status: string) => {
    setUpdatingId(orderId);
    try {
      await updateStatus({ id: orderId, data: { status: status as "picked_up" | "in_transit" | "delivered" | "failed_delivery", trackingNotes: notes[orderId] || null } });
      qc.invalidateQueries({ queryKey: getListCourierOrdersQueryKey({}) });
      setExpandedId(null);
    } finally {
      setUpdatingId(null);
    }
  };

  const orders = data?.orders ?? [];

  return (
    <CourierLayout>
      <div className="px-4 py-6 space-y-4 max-w-lg mx-auto">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Deliveries</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {orders.length} order{orders.length !== 1 ? "s" : ""} assigned
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
          </div>
        )}

        {!isLoading && orders.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
            <Truck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No deliveries assigned</p>
            <p className="text-slate-600 text-sm mt-1">Check back once the admin assigns an order</p>
          </div>
        )}

        {orders.map(order => {
          const expanded = expandedId === order.id;
          const nextActions = NEXT_STATUSES[order.status] ?? [];
          const isDone = order.status === "delivered" || order.status === "failed_delivery";

          return (
            <div key={order.id} className={cn(
              "bg-white border rounded-2xl overflow-hidden transition-colors",
              expanded ? "border-cyan-800" : "border-slate-200",
            )}>
              {/* Header row */}
              <button
                className="w-full text-left px-4 py-4 flex items-start gap-3"
                onClick={() => setExpandedId(expanded ? null : order.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-100 text-sm">{order.fullName}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-[0.65rem] font-medium",
                      STATUS_COLORS[order.status] ?? "bg-slate-400/15 text-slate-300")}>
                      {formatStatus(order.status)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 truncate">{order.deliveryAddress}, {order.city}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-slate-500">Order #{order.id}</span>
                    <span className="text-xs text-slate-500">·</span>
                    <span className="text-xs text-slate-500">{order.quantity}× {order.productType}</span>
                    <span className="text-xs font-semibold text-[#b08a58]">K{Number(order.totalAmount).toLocaleString()}</span>
                  </div>
                </div>
                {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                           : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />}
              </button>

              {expanded && (
                <div className="border-t border-slate-200 px-4 py-4 space-y-4">
                  {/* Detail rows */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[0.65rem] text-slate-500 uppercase tracking-wider">Phone</p>
                        <a href={`tel:${order.phone}`} className="text-sm text-cyan-400 hover:underline">{order.phone}</a>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Package className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[0.65rem] text-slate-500 uppercase tracking-wider">Item</p>
                        <p className="text-sm text-slate-200">{order.quantity}× {order.productType}</p>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[0.65rem] text-slate-500 uppercase tracking-wider">Delivery Address</p>
                        <p className="text-sm text-slate-200">{order.deliveryAddress}, {order.city}</p>
                      </div>
                    </div>
                    {order.deliveryPaymentMethod && (
                      <div className="col-span-2 flex items-start gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[0.65rem] text-amber-500 uppercase tracking-wider font-semibold">Payment on Delivery</p>
                          <p className="text-sm text-amber-300">
                            {DELIVERY_METHOD_LABELS[order.deliveryPaymentMethod] ?? order.deliveryPaymentMethod} — NO CASH
                          </p>
                        </div>
                      </div>
                    )}
                    {order.notes && (
                      <div className="col-span-2">
                        <p className="text-[0.65rem] text-slate-500 uppercase tracking-wider mb-0.5">Order Notes</p>
                        <p className="text-sm text-slate-300 italic">{order.notes}</p>
                      </div>
                    )}
                    {order.trackingNotes && (
                      <div className="col-span-2">
                        <p className="text-[0.65rem] text-slate-500 uppercase tracking-wider mb-0.5">Tracking Notes</p>
                        <p className="text-sm text-slate-300">{order.trackingNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Status actions */}
                  {!isDone && nextActions.length > 0 && (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Notes (optional)</label>
                        <textarea
                          rows={2}
                          value={notes[order.id] ?? ""}
                          onChange={e => setNotes(prev => ({ ...prev, [order.id]: e.target.value }))}
                          placeholder="Add delivery notes…"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:border-cyan-700 resize-none"
                        />
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {nextActions.map(action => (
                          <button
                            key={action.value}
                            onClick={() => handleStatusUpdate(order.id, action.value)}
                            disabled={updatingId === order.id}
                            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60", action.color)}>
                            {updatingId === order.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {isDone && (
                    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium",
                      order.status === "delivered" ? "bg-emerald-400/10 text-emerald-700" : "bg-rose-400/10 text-rose-700")}>
                      <AlertTriangle className="w-4 h-4" />
                      {order.status === "delivered" ? "Delivery completed" : "Delivery failed"}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </CourierLayout>
  );
}
