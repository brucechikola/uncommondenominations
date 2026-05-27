import { useLocation } from "wouter";
import { useAdminAuthStore } from "@/lib/store";
import {
  useListAdminOrders, useUpdateOrderStatus,
  getListAdminOrdersQueryKey, type Order,
  useListAdminCouriers, useAssignCourier, useUnassignCourier,
  getListAdminCouriersQueryKey,
} from "@workspace/api-client-react";
import { fmtMoney, fmtDate } from "@/components/purchase-ui";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ChevronRight, FileText, FileSpreadsheet, Phone, MessageSquare, Truck, X } from "lucide-react";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import {
  D, STATUS_COLORS, ORDER_STATUSES, formatStatus, PAGE_SIZE,
  SearchBar, Pagination, Field,
} from "./_shared";
import { Modal } from "./_modal";
import { AdminLayout } from "./layout";

type ExtendedOrder = Order & {
  email?: string;
  courierId?: number | null;
  deliveryPaymentMethod?: string | null;
  trackingNotes?: string | null;
};

/* ─── Order detail modal ──────────────────────────────────────── */
function OrderModal({
  order, onClose, onStatusUpdate, token,
}: {
  order: ExtendedOrder;
  onClose: () => void;
  onStatusUpdate: (id: number, status: string) => Promise<void>;
  token: string | null;
}) {
  const [status, setStatus] = useState(order.status);
  const [saving, setSaving] = useState(false);
  const [selectedCourierId, setSelectedCourierId] = useState<string>(
    order.courierId ? String(order.courierId) : ""
  );
  const [deliveryMethod, setDeliveryMethod] = useState<string>(
    order.deliveryPaymentMethod ?? "mobile_money_on_delivery"
  );
  const [assigning, setAssigning] = useState(false);
  const [unassigning, setUnassigning] = useState(false);
  const qc = useQueryClient();

  const authHeader = { Authorization: `Bearer ${token}` };

  const { data: couriers } = useListAdminCouriers({
    query: { queryKey: getListAdminCouriersQueryKey() },
    request: { headers: authHeader },
  });

  const { mutateAsync: assignCourier } = useAssignCourier({
    request: { headers: authHeader },
  });
  const { mutateAsync: unassignCourier } = useUnassignCourier({
    request: { headers: authHeader },
  });

  const handleSave = async () => {
    if (status === order.status) return;
    setSaving(true);
    await onStatusUpdate(order.id, status);
    setSaving(false);
    onClose();
  };

  const handleAssign = async () => {
    if (!selectedCourierId) return;
    setAssigning(true);
    try {
      await assignCourier({
        id: order.id,
        data: {
          courierId: Number(selectedCourierId),
          deliveryPaymentMethod: deliveryMethod as "mobile_money_on_delivery" | "bank_transfer",
        },
      });
      qc.invalidateQueries({ queryKey: getListAdminOrdersQueryKey() });
      onClose();
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async () => {
    setUnassigning(true);
    try {
      await unassignCourier({ id: order.id });
      qc.invalidateQueries({ queryKey: getListAdminOrdersQueryKey() });
      onClose();
    } finally {
      setUnassigning(false);
    }
  };

  const activeCouriers = (couriers ?? []).filter(c => c.active);

  return (
    <Modal open onClose={onClose} title={`Order #${order.id}`} subtitle={`Placed ${fmtDate(order.createdAt)}`} wide>
      {/* Quick actions */}
      <div className="flex gap-2 flex-wrap">
        <a href={`tel:${order.phone}`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#8d6b3d] text-white hover:opacity-90 transition-colors">
          <Phone className="h-4 w-4" />Call Customer
        </a>
        <a href={`https://wa.me/${order.phone?.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-700 text-white hover:opacity-90 transition-colors">
          <MessageSquare className="h-4 w-4" />WhatsApp
        </a>
      </div>

      {/* Two-column detail grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={cn("rounded-xl p-4 border", D.card2, D.border)}>
          <p className={cn("text-xs font-semibold uppercase tracking-wider mb-3", D.muted)}>Customer</p>
          <Field label="Full Name" value={order.fullName} />
          <Field label="Phone"     value={<a href={`tel:${order.phone}`} className={cn(D.accent, "hover:underline")}>{order.phone}</a>} />
          {order.email && <Field label="Email" value={order.email} />}
          <Field label="City"    value={order.city} />
          <Field label="Address" value={order.deliveryAddress} />
        </div>

        <div className={cn("rounded-xl p-4 border", D.card2, D.border)}>
          <p className={cn("text-xs font-semibold uppercase tracking-wider mb-3", D.muted)}>Order Details</p>
          <Field label="Edition"  value={<span className="capitalize">{order.productType}</span>} />
          <Field label="Quantity" value={order.quantity} />
          <Field label="Total"    value={<span className={D.accent}>{fmtMoney(order.totalAmount)}</span>} accent />
          <Field label="Status"   value={
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLORS[order.status])}>
              {formatStatus(order.status)}
            </span>
          } />
          <Field label="Date"     value={fmtDate(order.createdAt)} />
          {order.notes && <Field label="Notes" value={order.notes} />}
          {order.deliveryPaymentMethod && (
            <Field label="Delivery Payment" value={
              <span className="text-amber-700 font-semibold">
                {order.deliveryPaymentMethod === "bank_transfer" ? "Bank Transfer" : "Mobile Money"} on Delivery — NO CASH
              </span>
            } />
          )}
          {order.trackingNotes && <Field label="Tracking Notes" value={order.trackingNotes} />}
        </div>
      </div>

      {/* Courier assignment */}
      <div className={cn("rounded-xl p-4 border", D.card2, D.border)}>
        <div className="flex items-center justify-between mb-3">
          <p className={cn("text-xs font-semibold uppercase tracking-wider", D.muted)}>Courier Assignment</p>
          {order.courierId && (
            <button onClick={handleUnassign} disabled={unassigning}
              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 transition-colors disabled:opacity-60">
              <X className="w-3 h-3" /> {unassigning ? "Removing…" : "Unassign"}
            </button>
          )}
        </div>
        {order.courierId ? (
          <div className="flex items-center gap-2 mb-3">
            <Truck className="w-4 h-4 text-cyan-600" />
            <span className="text-sm text-cyan-700 font-medium">
              {activeCouriers.find(c => c.id === order.courierId)?.name ?? `Courier #${order.courierId}`}
            </span>
            <span className="text-xs text-slate-500">— currently assigned</span>
          </div>
        ) : (
          <p className={cn("text-xs mb-3", D.muted)}>No courier assigned yet</p>
        )}

        <div className="flex gap-2 flex-wrap items-end">
          <div className="flex-1 min-w-[140px]">
            <label className={cn("block text-xs font-medium mb-1", D.muted)}>Select Courier</label>
            <select
              value={selectedCourierId}
              onChange={e => setSelectedCourierId(e.target.value)}
              className={cn("w-full px-3 py-2 rounded-xl text-sm border outline-none", D.card, D.border, D.sub)}>
              <option value="">— choose —</option>
              {activeCouriers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className={cn("block text-xs font-medium mb-1", D.muted)}>Payment on Delivery</label>
            <select
              value={deliveryMethod}
              onChange={e => setDeliveryMethod(e.target.value)}
              className={cn("w-full px-3 py-2 rounded-xl text-sm border outline-none", D.card, D.border, D.sub)}>
              <option value="mobile_money_on_delivery">Mobile Money</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
          <button
            onClick={handleAssign}
            disabled={!selectedCourierId || assigning}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap">
            <Truck className="w-4 h-4" />
            {assigning ? "Assigning…" : order.courierId ? "Reassign" : "Assign Courier"}
          </button>
        </div>
      </div>

      {/* Status update */}
      <div className={cn("rounded-xl p-4 border", D.card2, D.border)}>
        <p className={cn("text-xs font-semibold uppercase tracking-wider mb-3", D.muted)}>Update Status</p>
        <div className="flex gap-2 flex-wrap mb-4">
          {ORDER_STATUSES.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all border",
                status === s
                  ? STATUS_COLORS[s]
                  : "bg-slate-100 text-slate-400 border-slate-200 hover:border-slate-300")}>
              {formatStatus(s)}
            </button>
          ))}
        </div>
        <button onClick={handleSave} disabled={saving || status === order.status}
          className={cn("w-full py-2.5 rounded-xl text-sm font-medium transition-all",
            status !== order.status
              ? "bg-[#8d6b3d] text-white hover:opacity-90"
              : "bg-slate-100 text-slate-500 cursor-not-allowed")}>
          {saving ? "Saving…" : status === order.status ? "No changes" : `Save — Mark as ${formatStatus(status)}`}
        </button>
      </div>
    </Modal>
  );
}

/* ─── Orders page ─────────────────────────────────────────────── */
export default function AdminOrders() {
  const [, navigate] = useLocation();
  const { isAuthenticated, token } = useAdminAuthStore();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<ExtendedOrder | null>(null);

  useEffect(() => { setPage(1); }, [search, statusFilter]);

  if (!isAuthenticated) { navigate("/admin/login"); return null; }

  const params = { page, limit: PAGE_SIZE, ...(search ? { search } : {}), ...(statusFilter ? { status: statusFilter } : {}) };
  const { data: result } = useListAdminOrders(params, {
    query: { queryKey: getListAdminOrdersQueryKey(params) },
  });
  const updateOrderStatus = useUpdateOrderStatus();

  const orders = (result?.orders ?? []) as ExtendedOrder[];
  const total: number = result?.total ?? 0;

  const handleStatusUpdate = async (id: number, status: string) => {
    await updateOrderStatus.mutateAsync({ id, data: { status: status as typeof ORDER_STATUSES[number] } });
    await queryClient.invalidateQueries({ queryKey: getListAdminOrdersQueryKey() });
    if (selected?.id === id) setSelected((o) => o ? { ...o, status } as ExtendedOrder : null);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(orders.map((o) => ({
      ID: o.id, "Full Name": o.fullName, Phone: o.phone,
      Edition: o.productType, Quantity: o.quantity,
      "Total (K)": o.totalAmount, City: o.city, Status: o.status,
      Date: fmtDate(o.createdAt),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "orders.xlsx");
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        {/* Heading */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <h1 className={cn("text-2xl font-bold", D.text)}>Orders</h1>
            {total > 0 && <p className={cn("text-sm mt-0.5", D.muted)}>{total} total</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.location.assign("/api/admin/export/orders")}
              className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors", D.muted, D.border, "hover:bg-slate-100")}>
              <FileText className="h-4 w-4" />CSV
            </button>
            <button onClick={exportExcel}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-emerald-800/50 text-emerald-300 border border-emerald-700/40 hover:bg-emerald-800/70 transition-colors">
              <FileSpreadsheet className="h-4 w-4" />Excel
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-4">
          <div className="flex-1 min-w-[200px]">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by name, phone, city…" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className={cn("px-3 py-2 text-sm rounded-xl border outline-none", D.card, D.border, D.sub)}>
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{formatStatus(s)}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className={cn("rounded-2xl border overflow-x-auto", D.card, D.border)}>
          <table className="w-full text-sm">
            <thead>
              <tr className={cn("border-b", D.border)}>
                {["#", "Customer", "Phone", "Edition", "Qty", "Total", "City", "Status", "Date", ""].map((h) => (
                  <th key={h} className={cn("text-left px-4 py-3 text-xs font-medium whitespace-nowrap", D.muted)}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} onClick={() => setSelected(order)}
                  className={cn("border-b last:border-0 cursor-pointer transition-colors", D.border, D.cardHov)}>
                  <td className={cn("px-4 py-3.5 font-mono text-xs", D.muted)}>#{order.id}</td>
                  <td className={cn("px-4 py-3.5 font-medium whitespace-nowrap", D.text)}>{order.fullName}</td>
                  <td className={cn("px-4 py-3.5 font-mono text-xs", D.muted)}>{order.phone}</td>
                  <td className={cn("px-4 py-3.5 capitalize", D.muted)}>{order.productType}</td>
                  <td className={cn("px-4 py-3.5", D.muted)}>{order.quantity}</td>
                  <td className={cn("px-4 py-3.5 font-semibold", D.accent)}>{fmtMoney(order.totalAmount)}</td>
                  <td className={cn("px-4 py-3.5", D.muted)}>{order.city}</td>
                  <td className="px-4 py-3.5">
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", STATUS_COLORS[order.status] ?? "bg-slate-100 text-slate-400")}>
                      {formatStatus(order.status)}
                    </span>
                  </td>
                  <td className={cn("px-4 py-3.5 text-xs whitespace-nowrap", D.muted)}>{fmtDate(order.createdAt)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {order.courierId && (
                        <span title="Courier assigned"><Truck className="h-3.5 w-3.5 text-cyan-500" /></span>
                      )}
                      <ChevronRight className={cn("h-4 w-4", D.muted)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && <div className={cn("py-14 text-center text-sm", D.muted)}>No orders found.</div>}
          <Pagination page={page} total={total} limit={PAGE_SIZE} onChange={setPage} />
        </div>
      </div>

      {selected && (
        <OrderModal
          order={selected}
          onClose={() => setSelected(null)}
          onStatusUpdate={handleStatusUpdate}
          token={token}
        />
      )}
    </AdminLayout>
  );
}
