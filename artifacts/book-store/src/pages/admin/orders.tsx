import { useLocation } from "wouter";
import { useAdminAuthStore } from "@/lib/store";
import {
  useListAdminOrders, useUpdateOrderStatus,
  getListAdminOrdersQueryKey, type Order,
} from "@workspace/api-client-react";
import { fmtMoney, fmtDate } from "@/components/purchase-ui";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ChevronRight, FileText, FileSpreadsheet, Phone, MessageSquare } from "lucide-react";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import {
  D, STATUS_COLORS, ORDER_STATUSES, formatStatus, PAGE_SIZE,
  SearchBar, Pagination, Field,
} from "./_shared";
import { Modal } from "./_modal";
import { AdminLayout } from "./layout";

/* ─── Order detail modal ──────────────────────────────────────── */
function OrderModal({
  order, onClose, onStatusUpdate,
}: {
  order: Order;
  onClose: () => void;
  onStatusUpdate: (id: number, status: string) => Promise<void>;
}) {
  const [status, setStatus] = useState(order.status);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (status === order.status) return;
    setSaving(true);
    await onStatusUpdate(order.id, status);
    setSaving(false);
    onClose();
  };

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
          {(order as Order & { email?: string }).email && (
            <Field label="Email" value={(order as Order & { email?: string }).email} />
          )}
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
                  : "bg-white/5 text-slate-400 border-white/10 hover:border-white/20")}>
              {formatStatus(s)}
            </button>
          ))}
        </div>
        <button onClick={handleSave} disabled={saving || status === order.status}
          className={cn("w-full py-2.5 rounded-xl text-sm font-medium transition-all",
            status !== order.status
              ? "bg-[#8d6b3d] text-white hover:opacity-90"
              : "bg-white/5 text-slate-500 cursor-not-allowed")}>
          {saving ? "Saving…" : status === order.status ? "No changes" : `Save — Mark as ${formatStatus(status)}`}
        </button>
      </div>
    </Modal>
  );
}

/* ─── Orders page ─────────────────────────────────────────────── */
export default function AdminOrders() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAdminAuthStore();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);

  useEffect(() => { setPage(1); }, [search, statusFilter]);

  if (!isAuthenticated) { navigate("/admin/login"); return null; }

  const params = { page, limit: PAGE_SIZE, ...(search ? { search } : {}), ...(statusFilter ? { status: statusFilter } : {}) };
  const { data: result } = useListAdminOrders(params, {
    query: { queryKey: getListAdminOrdersQueryKey(params) },
  });
  const updateOrderStatus = useUpdateOrderStatus();

  const orders: Order[] = result?.orders ?? [];
  const total: number   = result?.total ?? 0;

  const handleStatusUpdate = async (id: number, status: string) => {
    await updateOrderStatus.mutateAsync({ id, data: { status: status as typeof ORDER_STATUSES[number] } });
    await queryClient.invalidateQueries({ queryKey: getListAdminOrdersQueryKey() });
    if (selected?.id === id) setSelected((o) => o ? { ...o, status } as Order : null);
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
              className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors", D.muted, D.border, "hover:bg-white/5")}>
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
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", STATUS_COLORS[order.status] ?? "bg-white/10 text-slate-400")}>
                      {formatStatus(order.status)}
                    </span>
                  </td>
                  <td className={cn("px-4 py-3.5 text-xs whitespace-nowrap", D.muted)}>{fmtDate(order.createdAt)}</td>
                  <td className="px-4 py-3.5"><ChevronRight className={cn("h-4 w-4", D.muted)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && <div className={cn("py-14 text-center text-sm", D.muted)}>No orders found.</div>}
          <Pagination page={page} total={total} limit={PAGE_SIZE} onChange={setPage} />
        </div>
      </div>

      {selected && (
        <OrderModal order={selected} onClose={() => setSelected(null)} onStatusUpdate={handleStatusUpdate} />
      )}
    </AdminLayout>
  );
}
