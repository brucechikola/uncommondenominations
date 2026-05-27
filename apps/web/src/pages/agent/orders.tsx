import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAgentAuthStore } from "@/lib/store";
import { AgentLayout } from "./_layout";
import { Copy, CheckCheck, Share2, ChevronRight, Truck, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentOrder {
  id: number;
  fullName: string;
  phone: string;
  productType: string;
  quantity: number;
  totalAmount: number;
  status: string;
  pricingTier: string;
  paymentLink: string | null;
  createdAt: string;
  payment: { status: string; method: string } | null;
  courierId?: number | null;
  trackingNotes?: string | null;
  deliveryPaymentMethod?: string | null;
  deliveryAddress?: string;
  city?: string;
}

const STATUS_PILL: Record<string, string> = {
  pending:           "bg-amber-50 text-amber-700 border border-amber-200",
  confirmed:         "bg-blue-50 text-blue-700 border border-blue-200",
  awaiting_delivery: "bg-orange-50 text-orange-700 border border-orange-200",
  picked_up:         "bg-cyan-50 text-cyan-300 border border-cyan-200",
  in_transit:        "bg-violet-50 text-violet-700 border border-violet-200",
  delivered:         "bg-emerald-50 text-emerald-700 border border-emerald-200",
  failed_delivery:   "bg-rose-50 text-rose-700 border border-rose-200",
  cancelled:         "bg-red-50 text-red-300 border border-red-200",
};

const PAY_STATUS_PILL: Record<string, string> = {
  pending:    "bg-amber-50 text-amber-700",
  successful: "bg-emerald-50 text-emerald-700",
  failed:     "bg-red-50 text-red-300",
};

function OrderCard({ order }: { order: AgentOrder }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const fullLink = order.paymentLink ? `${window.location.origin}${order.paymentLink}` : null;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fullLink) return;
    await navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fullLink) return;
    const text = `Hi ${order.fullName.split(" ")[0]},\n\nYour order for Uncommon Denominators is ready.\nTotal: K${order.totalAmount.toLocaleString()}\n\nPay here: ${fullLink}`;
    if (navigator.share) {
      await navigator.share({ title: "Payment Link", text });
    } else {
      await navigator.clipboard.writeText(fullLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
      <button className="w-full p-4 text-left flex items-start gap-3" onClick={() => setExpanded(v => !v)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-100 font-medium text-sm">{order.fullName}</span>
            <span className={cn("text-[0.6rem] font-medium px-2 py-0.5 rounded-full capitalize", STATUS_PILL[order.status] ?? STATUS_PILL.pending)}>
              {order.status.replace("_", " ")}
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-0.5">
            {order.quantity}× {order.productType} · <span className="text-emerald-400 font-medium">K{order.totalAmount.toLocaleString()}</span>
            {" · "}<span className="capitalize text-slate-400">{order.pricingTier}</span>
          </p>
          {order.payment && (
            <span className={cn("inline-block text-[0.6rem] px-2 py-0.5 rounded-full mt-1 capitalize", PAY_STATUS_PILL[order.payment.status])}>
              {order.payment.status} · {order.payment.method.replace("_", " ")}
            </span>
          )}
        </div>
        <ChevronRight className={cn("w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5 transition-transform", expanded && "rotate-90")} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-200 pt-3">
          <p className="text-slate-500 text-xs">
            {order.phone}
            {order.deliveryAddress && ` · ${order.deliveryAddress}, ${order.city}`}
            {" · "}{new Date(order.createdAt).toLocaleDateString("en-ZM", { day: "numeric", month: "short", year: "numeric" })}
          </p>

          {/* Courier tracking */}
          {order.courierId && (
            <div className="rounded-xl bg-white border border-cyan-900/40 px-3 py-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">Courier Assigned</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("text-[0.6rem] font-medium px-2 py-0.5 rounded-full capitalize",
                  STATUS_PILL[order.status] ?? "bg-slate-400/15 text-slate-300")}>
                  {order.status.replace(/_/g, " ")}
                </span>
                {order.deliveryPaymentMethod && (
                  <span className="text-[0.6rem] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-300 border border-amber-200">
                    {order.deliveryPaymentMethod === "bank_transfer" ? "Bank Transfer" : "Mobile Money"} on Delivery
                  </span>
                )}
              </div>
              {order.trackingNotes && (
                <div className="flex items-start gap-1.5 mt-1">
                  <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 italic">{order.trackingNotes}</p>
                </div>
              )}
            </div>
          )}

          {fullLink && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-medium">Payment Link</p>
              <div className="rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs text-slate-400 break-all">
                {fullLink}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleCopy}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-300 hover:border-[#8d6b3d] transition-colors">
                  {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button onClick={handleShare}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all"
                  style={{ background: "linear-gradient(135deg, #8d6b3d, #b08a58)" }}>
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AgentOrders() {
  const [, navigate] = useLocation();
  const { token, isAuthenticated } = useAgentAuthStore();
  const [orders, setOrders] = useState<AgentOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    if (!isAuthenticated) { navigate("/agent/login"); return; }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    setLoading(true);
    fetch(`/api/agent/orders?page=${page}&limit=${limit}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setOrders(d.orders ?? []); setTotal(d.total ?? 0); })
      .finally(() => setLoading(false));
  }, [isAuthenticated, token, page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <AgentLayout>
      <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-100">My Orders</h1>
            <p className="text-slate-400 text-sm mt-0.5">{total} total orders</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="text-base font-medium">No orders yet</p>
            <p className="text-sm mt-1">Create your first order to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(o => <OrderCard key={o.id} order={o} />)}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-300 disabled:opacity-30 hover:border-[#8d6b3d] transition-colors">
              Previous
            </button>
            <span className="text-xs text-slate-500">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-300 disabled:opacity-30 hover:border-[#8d6b3d] transition-colors">
              Next
            </button>
          </div>
        )}
      </div>
    </AgentLayout>
  );
}
