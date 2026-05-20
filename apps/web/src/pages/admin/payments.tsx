import { useLocation } from "wouter";
import { useAdminAuthStore } from "@/lib/store";
import { useListAdminPayments, getListAdminPaymentsQueryKey, type AdminPayment } from "@workspace/api-client-react";
import { fmtMoney, fmtDate } from "@/components/purchase-ui";
import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { D, STATUS_COLORS, PAYMENT_METHOD_META, formatStatus, PAGE_SIZE, SearchBar, Pagination, Field } from "./_shared";
import { Modal } from "./_modal";
import { AdminLayout } from "./layout";

/* ─── Payment detail modal ────────────────────────────────────── */
function PaymentModal({ payment, onClose }: { payment: AdminPayment; onClose: () => void }) {
  const meta = PAYMENT_METHOD_META[payment.method];
  return (
    <Modal open onClose={onClose} title={`Transaction #${payment.id}`} subtitle={fmtDate(payment.createdAt)}>
      {/* Status + method badge */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={cn("px-3 py-1 rounded-full text-xs font-medium capitalize border", STATUS_COLORS[payment.status] ?? "bg-white/10 text-slate-400")}>
          {formatStatus(payment.status)}
        </span>
        {meta && (
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}30` }}>
              <span className="font-bold" style={{ color: meta.color, fontSize: "0.45rem" }}>{meta.abbr}</span>
            </div>
            <span className={cn("text-sm", D.sub)}>{meta.label}</span>
          </div>
        )}
      </div>

      {/* Transaction details */}
      <div className={cn("rounded-xl p-4 border", "bg-[#111f35]", D.border)}>
        <p className={cn("text-xs font-semibold uppercase tracking-wider mb-3", D.muted)}>Transaction</p>
        <Field label="Amount"    value={<span className={cn("font-bold text-lg", D.accent)}>{fmtMoney(payment.amount)}</span>} accent />
        <Field label="Reference" value={<span className="font-mono text-xs">{payment.reference}</span>} />
        <Field label="Method"    value={meta?.label ?? payment.method} />
        <Field label="Status"    value={<span className="capitalize">{formatStatus(payment.status)}</span>} />
        {payment.phoneNumber  && <Field label="Phone Number"  value={payment.phoneNumber} />}
        {payment.accountName  && <Field label="Account Name"  value={payment.accountName} />}
        <Field label="Date"      value={fmtDate(payment.createdAt)} />
      </div>

      {/* Customer */}
      {(payment.orderName || payment.orderPhone) && (
        <div className={cn("rounded-xl p-4 border", "bg-[#111f35]", D.border)}>
          <p className={cn("text-xs font-semibold uppercase tracking-wider mb-3", D.muted)}>Customer</p>
          {payment.orderName  && <Field label="Name"  value={payment.orderName} />}
          {payment.orderPhone && <Field label="Phone" value={<a href={`tel:${payment.orderPhone}`} className={cn(D.accent, "hover:underline")}>{payment.orderPhone}</a>} />}
          {payment.orderCity  && <Field label="City"  value={payment.orderCity} />}
          <Field label="Order" value={<span className={cn("font-mono text-xs", D.muted)}>Order #{payment.orderId}</span>} />
        </div>
      )}
    </Modal>
  );
}

/* ─── Payments page ───────────────────────────────────────────── */
export default function AdminPayments() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAdminAuthStore();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<AdminPayment | null>(null);

  useEffect(() => { setPage(1); }, [search, statusFilter]);

  if (!isAuthenticated) { navigate("/admin/login"); return null; }

  const params = { page, limit: PAGE_SIZE, ...(search ? { search } : {}), ...(statusFilter ? { status: statusFilter } : {}) };
  const { data: result } = useListAdminPayments(params, {
    query: { queryKey: getListAdminPaymentsQueryKey(params) },
  });

  const payments: AdminPayment[] = result?.payments ?? [];
  const total: number            = result?.total ?? 0;

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        {/* Heading */}
        <div className="mb-6">
          <h1 className={cn("text-2xl font-bold", D.text)}>Transactions</h1>
          {total > 0 && <p className={cn("text-sm mt-0.5", D.muted)}>{total} total</p>}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-4">
          <div className="flex-1 min-w-[200px]">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by reference, name, or method…" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className={cn("px-3 py-2 text-sm rounded-xl border outline-none", D.card, D.border, D.sub)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="successful">Successful</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Table */}
        <div className={cn("rounded-2xl border overflow-x-auto", D.card, D.border)}>
          <table className="w-full text-sm">
            <thead>
              <tr className={cn("border-b", D.border)}>
                {["#", "Customer", "Method", "Amount", "Reference", "Status", "Date", ""].map((h) => (
                  <th key={h} className={cn("text-left px-4 py-3 text-xs font-medium whitespace-nowrap", D.muted)}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const meta = PAYMENT_METHOD_META[p.method];
                return (
                  <tr key={p.id} onClick={() => setSelected(p)}
                    className={cn("border-b last:border-0 cursor-pointer transition-colors", D.border, D.cardHov)}>
                    <td className={cn("px-4 py-3.5 font-mono text-xs", D.muted)}>#{p.id}</td>
                    <td className={cn("px-4 py-3.5 whitespace-nowrap", D.text)}>
                      {p.orderName ?? <span className={D.muted}>—</span>}
                      {p.orderCity && <span className={cn("text-xs ml-2", D.muted)}>{p.orderCity}</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      {meta ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                            style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}30` }}>
                            <span className="font-bold leading-none" style={{ color: meta.color, fontSize: "0.42rem" }}>{meta.abbr}</span>
                          </div>
                          <span className={cn("text-xs whitespace-nowrap", D.sub)}>{meta.label}</span>
                        </div>
                      ) : (
                        <span className={cn("text-xs", D.muted)}>{p.method}</span>
                      )}
                    </td>
                    <td className={cn("px-4 py-3.5 font-semibold", D.accent)}>{fmtMoney(p.amount)}</td>
                    <td className={cn("px-4 py-3.5 font-mono text-xs", D.muted)}>{p.reference}</td>
                    <td className="px-4 py-3.5">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", STATUS_COLORS[p.status] ?? "bg-white/10 text-slate-400")}>
                        {formatStatus(p.status)}
                      </span>
                    </td>
                    <td className={cn("px-4 py-3.5 text-xs whitespace-nowrap", D.muted)}>{fmtDate(p.createdAt)}</td>
                    <td className="px-4 py-3.5"><ChevronRight className={cn("h-4 w-4", D.muted)} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {payments.length === 0 && <div className={cn("py-14 text-center text-sm", D.muted)}>No transactions found.</div>}
          <Pagination page={page} total={total} limit={PAGE_SIZE} onChange={setPage} />
        </div>
      </div>

      {selected && (
        <PaymentModal payment={selected} onClose={() => setSelected(null)} />
      )}
    </AdminLayout>
  );
}
