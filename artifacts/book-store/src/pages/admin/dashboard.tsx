import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAdminAuthStore } from "@/lib/store";
import {
  useGetAdminStats,
  useListAdminOrders,
  useListAdminReviews,
  useListAdminContacts,
  useApproveReview,
  useDeleteReview,
  useUpdateOrderStatus,
  useGetAdminPaymentSettings,
  useUpdatePaymentSetting,
  getListAdminReviewsQueryKey,
  getListAdminOrdersQueryKey,
  getListAdminContactsQueryKey,
  getGetAdminPaymentSettingsQueryKey,
  type Review,
  type Order,
  type ContactMessage,
  type PaymentSetting,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as XLSX from "xlsx";
import {
  ShoppingBag, Users, Star, TrendingUp, LogOut,
  Check, Trash2, X, Phone, Mail,
  BookOpen, MessageSquare, FileSpreadsheet, FileText,
  ChevronRight, Settings, ToggleLeft, ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── theme tokens ─────────────────────────────────────────── */
const D = {
  bg:       "bg-[#0b1120]",
  card:     "bg-[#131e2e]",
  cardHov:  "hover:bg-[#1a2840]",
  border:   "border-[#1e3050]",
  header:   "bg-[#090e1a]",
  accent:   "text-[#b08a58]",
  accentBg: "bg-[#8d6b3d]",
  muted:    "text-slate-400",
  text:     "text-slate-100",
  sub:      "text-slate-300",
};

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-400/15 text-yellow-300 border border-yellow-400/30",
  confirmed: "bg-blue-400/15 text-blue-300 border border-blue-400/30",
  shipped:   "bg-indigo-400/15 text-indigo-300 border border-indigo-400/30",
  delivered: "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30",
  cancelled: "bg-red-400/15 text-red-300 border border-red-400/30",
};

const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
type Tab = "overview" | "orders" | "reviews" | "contacts" | "settings";

/* ─── Slide-over panel ──────────────────────────────────────── */
function SlidePanel({
  open, onClose, title, subtitle, children,
}: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn("fixed right-0 top-0 h-full w-full max-w-lg z-50 flex flex-col shadow-2xl", D.header, "border-l", D.border)}
          >
            <div className={cn("flex items-center justify-between px-6 py-4 border-b", D.border)}>
              <div>
                <h2 className={cn("font-serif font-bold text-lg", D.text)}>{title}</h2>
                {subtitle && <p className={cn("text-xs mt-0.5", D.muted)}>{subtitle}</p>}
              </div>
              <button onClick={onClose} className={cn("p-2 rounded-lg transition-colors hover:bg-white/5", D.muted)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Field row ─────────────────────────────────────────────── */
function Field({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-0.5 py-3 border-b", D.border, "last:border-0")}>
      <span className={cn("text-xs font-medium uppercase", D.muted)}>{label}</span>
      <span className={cn("text-sm", accent ? D.accent : D.sub)}>{value ?? "—"}</span>
    </div>
  );
}

/* ─── Order detail panel ────────────────────────────────────── */
function OrderPanel({
  order, onClose, onStatusUpdate,
}: {
  order: Order; onClose: () => void; onStatusUpdate: (id: number, status: string) => Promise<void>;
}) {
  const [status, setStatus] = useState(order.status);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (status === order.status) return;
    setSaving(true);
    await onStatusUpdate(order.id, status);
    setSaving(false);
  };

  return (
    <SlidePanel open title={`Order #${order.id}`} subtitle={new Date(order.createdAt).toLocaleString()} onClose={onClose}>
      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <a href={`tel:${order.phone}`}
          className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors", D.accentBg, "text-white hover:opacity-90")}>
          <Phone className="h-4 w-4" />Call Customer
        </a>
        <a href={`https://wa.me/${order.phone?.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-700 text-white hover:opacity-90 transition-colors">
          <MessageSquare className="h-4 w-4" />WhatsApp
        </a>
      </div>

      {/* Customer info */}
      <div className={cn("rounded-xl p-4", D.card, "border", D.border)}>
        <p className={cn("text-xs font-semibold uppercase mb-3", D.muted)}>Customer</p>
        <Field label="Full Name" value={order.fullName} />
        <Field label="Phone" value={<a href={`tel:${order.phone}`} className={cn(D.accent, "hover:underline")}>{order.phone}</a>} />
        {(order as Order & { email?: string }).email && <Field label="Email" value={(order as Order & { email?: string }).email} />}
        <Field label="City" value={order.city} />
        {(order as Order & { address?: string }).address && <Field label="Address" value={(order as Order & { address?: string }).address} />}
      </div>

      {/* Order info */}
      <div className={cn("rounded-xl p-4", D.card, "border", D.border)}>
        <p className={cn("text-xs font-semibold uppercase mb-3", D.muted)}>Order Details</p>
        <Field label="Edition" value={<span className="capitalize">{order.productType}</span>} />
        <Field label="Quantity" value={order.quantity} />
        <Field label="Total Amount" value={<span className={D.accent}>K{order.totalAmount}</span>} accent />
        <Field label="Date" value={new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} />
      </div>

      {/* Status update */}
      <div className={cn("rounded-xl p-4", D.card, "border", D.border)}>
        <p className={cn("text-xs font-semibold uppercase mb-3", D.muted)}>Update Status</p>
        <div className="flex gap-2 flex-wrap mb-3">
          {ORDER_STATUSES.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all border",
                status === s
                  ? STATUS_COLORS[s]
                  : "bg-white/5 text-slate-400 border-white/10 hover:border-white/20")}>
              {s}
            </button>
          ))}
        </div>
        <button onClick={handleSave} disabled={saving || status === order.status}
          className={cn("w-full py-2.5 rounded-lg text-sm font-medium transition-all",
            status !== order.status
              ? cn(D.accentBg, "text-white hover:opacity-90")
              : "bg-white/5 text-slate-500 cursor-not-allowed")}>
          {saving ? "Saving…" : status === order.status ? "No changes" : `Save — Mark as ${status}`}
        </button>
      </div>
    </SlidePanel>
  );
}

/* ─── Review detail panel ───────────────────────────────────── */
function ReviewPanel({
  review, onClose, onApprove, onDelete,
}: {
  review: Review; onClose: () => void; onApprove: (id: number) => Promise<void>; onDelete: (id: number) => Promise<void>;
}) {
  const [approving, setApproving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <SlidePanel open title={`Review by ${review.reviewerName}`} subtitle={new Date(review.createdAt).toLocaleDateString()} onClose={onClose}>
      {/* Status badge */}
      <div className="flex items-center gap-3">
        <span className={cn("px-3 py-1 rounded-full text-xs font-medium",
          review.approved ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30"
            : "bg-yellow-400/15 text-yellow-300 border border-yellow-400/30")}>
          {review.approved ? "Approved — visible on site" : "Pending — not yet visible"}
        </span>
        <div className="flex gap-0.5 ml-auto">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn("h-4 w-4", i < review.rating ? "fill-[#b08a58] text-[#b08a58]" : "text-slate-700")} />
          ))}
        </div>
      </div>

      {/* Reviewer info */}
      <div className={cn("rounded-xl p-4", D.card, "border", D.border)}>
        <Field label="Reviewer Name" value={review.reviewerName} />
        {review.reviewerTitle && <Field label="Title / Occupation" value={review.reviewerTitle} />}
        <Field label="Edition" value={<span className="capitalize">{review.productType ?? "—"}</span>} />
        <Field label="Rating" value={`${review.rating} / 5`} />
        <Field label="Submitted" value={new Date(review.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} />
      </div>

      {/* Review text */}
      <div className={cn("rounded-xl p-4", D.card, "border", D.border)}>
        <p className={cn("text-xs font-semibold uppercase mb-3", D.muted)}>Review</p>
        <p className={cn("text-sm leading-relaxed italic", D.sub)}>"{review.comment}"</p>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {!review.approved && (
          <button onClick={async () => { setApproving(true); await onApprove(review.id); onClose(); }}
            disabled={approving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-emerald-700/80 text-white hover:bg-emerald-700 transition-colors">
            <Check className="h-4 w-4" />{approving ? "Approving…" : "Approve — Publish to Site"}
          </button>
        )}
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-red-900/40 text-red-300 hover:bg-red-900/60 transition-colors border border-red-800/40">
            <Trash2 className="h-4 w-4" />Delete Review
          </button>
        ) : (
          <div className={cn("rounded-xl p-4 border border-red-800/50", "bg-red-900/20")}>
            <p className="text-sm text-red-300 mb-3">Are you sure? This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-white/5 text-slate-400 hover:bg-white/10 transition-colors">
                Cancel
              </button>
              <button onClick={async () => { setDeleting(true); await onDelete(review.id); onClose(); }}
                disabled={deleting}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-700 text-white hover:bg-red-600 transition-colors">
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        )}
      </div>
    </SlidePanel>
  );
}

/* ─── Contact detail panel ──────────────────────────────────── */
function ContactPanel({ contact, onClose }: { contact: ContactMessage; onClose: () => void }) {
  return (
    <SlidePanel open title={`Message from ${contact.name}`} subtitle={new Date(contact.createdAt).toLocaleString()} onClose={onClose}>
      <div className="flex gap-2 flex-wrap">
        <a href={`mailto:${contact.email}`}
          className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors", D.accentBg, "text-white hover:opacity-90")}>
          <Mail className="h-4 w-4" />Reply via Email
        </a>
        {contact.phone && (
          <a href={`tel:${contact.phone}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors">
            <Phone className="h-4 w-4" />Call
          </a>
        )}
      </div>

      <div className={cn("rounded-xl p-4", D.card, "border", D.border)}>
        <Field label="Name" value={contact.name} />
        <Field label="Email" value={<a href={`mailto:${contact.email}`} className={cn(D.accent, "hover:underline")}>{contact.email}</a>} />
        {contact.phone && <Field label="Phone" value={<a href={`tel:${contact.phone}`} className={cn(D.muted, "hover:underline")}>{contact.phone}</a>} />}
        <Field label="Received" value={new Date(contact.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" } as Intl.DateTimeFormatOptions)} />
      </div>

      <div className={cn("rounded-xl p-4", D.card, "border", D.border)}>
        <p className={cn("text-xs font-semibold uppercase mb-3", D.muted)}>Message</p>
        <p className={cn("text-sm leading-relaxed whitespace-pre-wrap", D.sub)}>{contact.message}</p>
      </div>
    </SlidePanel>
  );
}

/* ─── Main dashboard ────────────────────────────────────────── */
export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { isAuthenticated, logout } = useAdminAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactMessage | null>(null);

  if (!isAuthenticated) { navigate("/admin/login"); return null; }

  const { data: stats } = useGetAdminStats();
  const { data: ordersResult } = useListAdminOrders(undefined, {
    query: { enabled: tab === "orders" || tab === "overview", queryKey: getListAdminOrdersQueryKey() },
  });
  const { data: reviews } = useListAdminReviews({
    query: { enabled: tab === "reviews", queryKey: getListAdminReviewsQueryKey() },
  });
  const { data: contacts } = useListAdminContacts({
    query: { enabled: tab === "contacts", queryKey: getListAdminContactsQueryKey() },
  });

  const approveReview = useApproveReview();
  const deleteReview = useDeleteReview();
  const updateOrderStatus = useUpdateOrderStatus();
  const updatePaymentSetting = useUpdatePaymentSetting();
  const { data: paymentSettings } = useGetAdminPaymentSettings({
    query: { enabled: tab === "settings", queryKey: getGetAdminPaymentSettingsQueryKey() },
  });
  const paymentSettingsList: PaymentSetting[] = Array.isArray(paymentSettings) ? (paymentSettings as PaymentSetting[]) : [];

  const orders: Order[] = ordersResult?.orders ?? [];
  const reviewList: Review[] = Array.isArray(reviews) ? (reviews as Review[]) : [];
  const contactList: ContactMessage[] = Array.isArray(contacts) ? (contacts as ContactMessage[]) : [];

  const handleApproveReview = async (id: number) => {
    await approveReview.mutateAsync({ id });
    await queryClient.invalidateQueries({ queryKey: getListAdminReviewsQueryKey() });
  };
  const handleDeleteReview = async (id: number) => {
    await deleteReview.mutateAsync({ id });
    await queryClient.invalidateQueries({ queryKey: getListAdminReviewsQueryKey() });
  };
  const handleUpdateStatus = async (id: number, status: string) => {
    await updateOrderStatus.mutateAsync({ id, data: { status: status as typeof ORDER_STATUSES[number] } });
    await queryClient.invalidateQueries({ queryKey: getListAdminOrdersQueryKey() });
    if (selectedOrder?.id === id) setSelectedOrder((o) => o ? { ...o, status } as Order : null);
  };
  const handleTogglePaymentChannel = async (channelId: string, enabled: boolean) => {
    await updatePaymentSetting.mutateAsync({ channelId, data: { enabled } });
    await queryClient.invalidateQueries({ queryKey: getGetAdminPaymentSettingsQueryKey() });
  };

  const handleLogout = () => { logout(); navigate("/"); };

  /* ── Export helpers ── */
  const exportCSV = (url: string) => { window.location.href = url; };

  const exportExcel = (data: Record<string, unknown>[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, filename);
  };

  const exportOrdersExcel = () => {
    exportExcel(orders.map((o) => ({
      ID: o.id,
      "Full Name": o.fullName,
      Phone: o.phone,
      Edition: o.productType,
      Quantity: o.quantity,
      "Total (K)": o.totalAmount,
      City: o.city,
      Status: o.status,
      Date: new Date(o.createdAt).toLocaleDateString(),
    })), "orders.xlsx");
  };

  const exportReviewsExcel = () => {
    exportExcel(reviewList.map((r) => ({
      ID: r.id,
      Name: r.reviewerName,
      Title: r.reviewerTitle ?? "",
      Rating: r.rating,
      Comment: r.comment,
      Edition: r.productType ?? "",
      Approved: r.approved ? "Yes" : "No",
      Date: new Date(r.createdAt).toLocaleDateString(),
    })), "reviews.xlsx");
  };

  const exportContactsExcel = () => {
    exportExcel(contactList.map((c) => ({
      ID: c.id,
      Name: c.name,
      Email: c.email,
      Phone: c.phone ?? "",
      Message: c.message,
      Date: new Date(c.createdAt).toLocaleDateString(),
    })), "contacts.xlsx");
  };

  const statCards = [
    { label: "Total Orders", value: stats?.totalOrders ?? "—", icon: ShoppingBag, color: "text-blue-400" },
    { label: "Total Revenue", value: stats ? `K${stats.totalRevenue}` : "—", icon: TrendingUp, color: "text-[#b08a58]" },
    { label: "Total Visitors", value: stats?.totalVisitors ?? "—", icon: Users, color: "text-purple-400" },
    { label: "Total Buyers", value: stats?.totalBuyers ?? "—", icon: BookOpen, color: "text-emerald-400" },
  ];

  const tabs: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "orders", label: "Orders", icon: ShoppingBag, count: orders.length },
    { id: "reviews", label: "Reviews", icon: Star, count: reviewList.length },
    { id: "contacts", label: "Messages", icon: MessageSquare, count: contactList.length },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className={cn("min-h-screen", D.bg, D.text)}>
      {/* Header */}
      <header className={cn("sticky top-0 z-30 border-b", D.header, D.border)}>
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={cn("font-serif font-bold", D.text)}>Admin Dashboard</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#8d6b3d]/20 text-[#b08a58] border border-[#8d6b3d]/30">Uncommon Denominators</span>
          </div>
          <button onClick={handleLogout}
            className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-white/5", D.muted)}>
            <LogOut className="h-4 w-4" />Log Out
          </button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={cn("rounded-xl p-5 border", D.card, D.border)}>
              <div className="flex items-center justify-between mb-3">
                <span className={cn("text-xs", D.muted)}>{s.label}</span>
                <s.icon className={cn("h-4 w-4", s.color)} />
              </div>
              <p className={cn("font-serif text-2xl font-bold", D.text)}>{s.value}</p>
            </motion.div>
          ))}
        </div>

        {stats && (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {[
              { label: "Pending Payments", value: stats.pendingPayments, color: "text-yellow-300" },
              { label: "Paperback Sales", value: stats.paperbackSales, color: D.text },
              { label: "Hardcover Sales", value: stats.hardcoverSales, color: D.text },
            ].map((item) => (
              <div key={item.label} className={cn("rounded-xl p-5 border", D.card, D.border)}>
                <p className={cn("text-xs mb-1", D.muted)}>{item.label}</p>
                <p className={cn("font-serif text-xl font-bold", item.color)}>{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className={cn("flex gap-1 mb-6 rounded-xl p-1 w-fit border", D.card, D.border)}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                tab === t.id
                  ? "bg-[#8d6b3d] text-white shadow"
                  : cn(D.muted, "hover:text-slate-200 hover:bg-white/5"))}>
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
              {t.count !== undefined && tab !== t.id && (
                <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="space-y-5">
            <h2 className={cn("font-serif text-xl font-bold", D.text)}>Recent Orders</h2>
            <div className={cn("rounded-xl border overflow-auto", D.card, D.border)}>
              <table className="w-full text-sm">
                <thead>
                  <tr className={cn("border-b", D.border)}>
                    {["#", "Customer", "Edition", "Qty", "Total", "City", "Status", "Date", ""].map((h) => (
                      <th key={h} className={cn("text-left px-4 py-3 text-xs font-medium", D.muted)}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 8).map((order) => (
                    <tr key={order.id} onClick={() => setSelectedOrder(order)}
                      className={cn("border-b last:border-0 cursor-pointer transition-colors", D.border, D.cardHov)}>
                      <td className={cn("px-4 py-3 font-mono text-xs", D.muted)}>#{order.id}</td>
                      <td className={cn("px-4 py-3 font-medium whitespace-nowrap", D.text)}>{order.fullName}</td>
                      <td className={cn("px-4 py-3 capitalize", D.muted)}>{order.productType}</td>
                      <td className={cn("px-4 py-3", D.muted)}>{order.quantity}</td>
                      <td className={cn("px-4 py-3 font-semibold", D.accent)}>K{order.totalAmount}</td>
                      <td className={cn("px-4 py-3", D.muted)}>{order.city}</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", STATUS_COLORS[order.status] ?? "bg-white/10 text-slate-400")}>{order.status}</span>
                      </td>
                      <td className={cn("px-4 py-3 text-xs whitespace-nowrap", D.muted)}>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3"><ChevronRight className={cn("h-4 w-4", D.muted)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && <div className={cn("py-12 text-center text-sm", D.muted)}>No orders yet.</div>}
            </div>
          </div>
        )}

        {/* ── ORDERS ── */}
        {tab === "orders" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className={cn("font-serif text-xl font-bold", D.text)}>All Orders</h2>
              <div className="flex gap-2">
                <button onClick={() => exportCSV("/api/admin/export/orders")}
                  className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors", D.muted, D.border, "hover:bg-white/5")}>
                  <FileText className="h-4 w-4" />CSV
                </button>
                <button onClick={exportOrdersExcel}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-800/60 text-emerald-300 border border-emerald-700/40 hover:bg-emerald-800/80 transition-colors">
                  <FileSpreadsheet className="h-4 w-4" />Excel
                </button>
              </div>
            </div>
            <div className={cn("rounded-xl border overflow-x-auto", D.card, D.border)}>
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
                    <tr key={order.id} onClick={() => setSelectedOrder(order)}
                      className={cn("border-b last:border-0 cursor-pointer transition-colors", D.border, D.cardHov)}>
                      <td className={cn("px-4 py-3 font-mono text-xs", D.muted)}>#{order.id}</td>
                      <td className={cn("px-4 py-3 font-medium whitespace-nowrap", D.text)}>{order.fullName}</td>
                      <td className={cn("px-4 py-3 font-mono text-xs", D.muted)}>{order.phone}</td>
                      <td className={cn("px-4 py-3 capitalize", D.muted)}>{order.productType}</td>
                      <td className={cn("px-4 py-3", D.muted)}>{order.quantity}</td>
                      <td className={cn("px-4 py-3 font-semibold", D.accent)}>K{order.totalAmount}</td>
                      <td className={cn("px-4 py-3", D.muted)}>{order.city}</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", STATUS_COLORS[order.status] ?? "bg-white/10 text-slate-400")}>{order.status}</span>
                      </td>
                      <td className={cn("px-4 py-3 text-xs whitespace-nowrap", D.muted)}>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3"><ChevronRight className={cn("h-4 w-4", D.muted)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && <div className={cn("py-12 text-center text-sm", D.muted)}>No orders yet.</div>}
            </div>
          </div>
        )}

        {/* ── REVIEWS ── */}
        {tab === "reviews" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className={cn("font-serif text-xl font-bold", D.text)}>Reviews
                <span className={cn("ml-2 text-sm font-normal", D.muted)}>
                  {reviewList.filter((r) => !r.approved).length} pending
                </span>
              </h2>
              <button onClick={exportReviewsExcel}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-800/60 text-emerald-300 border border-emerald-700/40 hover:bg-emerald-800/80 transition-colors">
                <FileSpreadsheet className="h-4 w-4" />Export Excel
              </button>
            </div>
            <div className="space-y-2">
              {reviewList.map((review) => (
                <div key={review.id} onClick={() => setSelectedReview(review)}
                  className={cn("rounded-xl p-4 border cursor-pointer transition-colors flex items-center gap-4", D.card, D.border, D.cardHov)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className={cn("font-medium text-sm", D.text)}>{review.reviewerName}</span>
                      {review.reviewerTitle && <span className={cn("text-xs", D.muted)}>{review.reviewerTitle}</span>}
                      <div className="flex gap-0.5 ml-auto">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-[#b08a58] text-[#b08a58]" />
                        ))}
                      </div>
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                        review.approved ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/20"
                          : "bg-yellow-400/15 text-yellow-300 border border-yellow-400/20")}>
                        {review.approved ? "Approved" : "Pending"}
                      </span>
                    </div>
                    <p className={cn("text-xs truncate italic", D.muted)}>"{review.comment}"</p>
                  </div>
                  <ChevronRight className={cn("h-4 w-4 flex-shrink-0", D.muted)} />
                </div>
              ))}
              {reviewList.length === 0 && <div className={cn("py-12 text-center text-sm", D.muted)}>No reviews yet.</div>}
            </div>
          </div>
        )}

        {/* ── CONTACTS ── */}
        {tab === "contacts" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className={cn("font-serif text-xl font-bold", D.text)}>Contact Messages</h2>
              <button onClick={exportContactsExcel}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-800/60 text-emerald-300 border border-emerald-700/40 hover:bg-emerald-800/80 transition-colors">
                <FileSpreadsheet className="h-4 w-4" />Export Excel
              </button>
            </div>
            <div className="space-y-2">
              {contactList.map((contact) => (
                <div key={contact.id} onClick={() => setSelectedContact(contact)}
                  className={cn("rounded-xl p-4 border cursor-pointer transition-colors", D.card, D.border, D.cardHov)}>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="min-w-0">
                      <p className={cn("font-medium text-sm", D.text)}>{contact.name}</p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className={cn("text-xs", D.accent)}>{contact.email}</span>
                        {contact.phone && <span className={cn("text-xs", D.muted)}>{contact.phone}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={cn("text-xs whitespace-nowrap", D.muted)}>{new Date(contact.createdAt).toLocaleDateString()}</span>
                      <ChevronRight className={cn("h-4 w-4", D.muted)} />
                    </div>
                  </div>
                  <p className={cn("text-xs line-clamp-2 leading-relaxed", D.muted)}>{contact.message}</p>
                </div>
              ))}
              {contactList.length === 0 && <div className={cn("py-12 text-center text-sm", D.muted)}>No messages yet.</div>}
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab === "settings" && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h2 className={cn("font-serif text-xl font-bold", D.text)}>Payment Channels</h2>
              <p className={cn("text-sm mt-1", D.muted)}>Enable or disable payment methods shown to customers at checkout.</p>
            </div>

            <div className={cn("rounded-xl border divide-y", D.card, D.border, "divide-[#1e3050]")}>
              {paymentSettingsList.length === 0 && (
                <div className={cn("py-10 text-center text-sm", D.muted)}>Loading channels…</div>
              )}
              {paymentSettingsList.map((ch) => {
                const META: Record<string, { color: string; abbr: string; desc: string }> = {
                  airtel_money:    { color: "#ef4444", abbr: "A",    desc: "Airtel mobile wallet" },
                  mtn_money:       { color: "#eab308", abbr: "MTN",  desc: "MTN MoMo account" },
                  zamtel_money:    { color: "#22c55e", abbr: "ZM",   desc: "Zamtel Kwacha wallet" },
                  visa_mastercard: { color: "#3b82f6", abbr: "CARD", desc: "Debit or credit card" },
                  bank_transfer:   { color: "#6366f1", abbr: "BNK",  desc: "Direct bank transfer" },
                };
                const meta = META[ch.channelId] ?? { color: "#b08a58", abbr: "?", desc: "" };
                return (
                  <div key={ch.channelId} className="flex items-center gap-4 px-5 py-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}30` }}>
                      <span className="font-bold text-[0.48rem]" style={{ color: meta.color }}>{meta.abbr}</span>
                    </div>
                    {/* Label */}
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium", D.text)}>{ch.label}</p>
                      <p className={cn("text-xs", D.muted)}>{meta.desc}</p>
                    </div>
                    {/* Status badge */}
                    <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium border",
                      ch.enabled
                        ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                        : "bg-white/5 text-slate-500 border-white/10")}>
                      {ch.enabled ? "Active" : "Disabled"}
                    </span>
                    {/* Toggle */}
                    <button
                      onClick={() => handleTogglePaymentChannel(ch.channelId, !ch.enabled)}
                      className="flex-shrink-0 transition-opacity hover:opacity-80"
                      title={ch.enabled ? "Disable channel" : "Enable channel"}>
                      {ch.enabled
                        ? <ToggleRight className="h-8 w-8 text-emerald-400" />
                        : <ToggleLeft className="h-8 w-8 text-slate-600" />}
                    </button>
                  </div>
                );
              })}
            </div>

            <p className={cn("text-xs", D.muted)}>
              Changes take effect immediately — disabled channels disappear from the customer checkout page at once.
            </p>
          </div>
        )}
      </div>

      {/* ── Detail panels ── */}
      {selectedOrder && (
        <OrderPanel
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleUpdateStatus}
        />
      )}
      {selectedReview && (
        <ReviewPanel
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
          onApprove={handleApproveReview}
          onDelete={handleDeleteReview}
        />
      )}
      {selectedContact && (
        <ContactPanel contact={selectedContact} onClose={() => setSelectedContact(null)} />
      )}
    </div>
  );
}
