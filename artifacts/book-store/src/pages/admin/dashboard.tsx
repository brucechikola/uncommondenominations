import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAdminAuthStore } from "@/lib/store";
import {
  useGetAdminStats,
  useListAdminOrders,
  useListAdminReviews,
  useListAdminContacts,
  useListAdminPayments,
  useApproveReview,
  useDeleteReview,
  useUpdateOrderStatus,
  useGetAdminPaymentSettings,
  useUpdatePaymentSetting,
  getListAdminReviewsQueryKey,
  getListAdminOrdersQueryKey,
  getListAdminContactsQueryKey,
  getListAdminPaymentsQueryKey,
  getGetAdminPaymentSettingsQueryKey,
  type Review,
  type Order,
  type ContactMessage,
  type PaymentSetting,
  type AdminPayment,
  type ListAdminReviewsApproved,
} from "@workspace/api-client-react";
import { fmtMoney, fmtDate } from "@/components/purchase-ui";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as XLSX from "xlsx";
import {
  ShoppingBag, Users, Star, TrendingUp, LogOut,
  Check, Trash2, X, Phone, Mail,
  BookOpen, MessageSquare, FileSpreadsheet, FileText,
  ChevronRight, Settings, ToggleLeft, ToggleRight,
  Search, CreditCard, ChevronLeft, Filter,
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
  pending:           "bg-yellow-400/15 text-yellow-300 border border-yellow-400/30",
  confirmed:         "bg-blue-400/15 text-blue-300 border border-blue-400/30",
  awaiting_delivery: "bg-orange-400/15 text-orange-300 border border-orange-400/30",
  shipped:           "bg-indigo-400/15 text-indigo-300 border border-indigo-400/30",
  delivered:         "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30",
  cancelled:         "bg-red-400/15 text-red-300 border border-red-400/30",
  successful:        "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30",
  failed:            "bg-red-400/15 text-red-300 border border-red-400/30",
};

const PAYMENT_METHOD_META: Record<string, { label: string; color: string; abbr: string }> = {
  airtel_money:    { label: "Airtel Money",    color: "#ef4444", abbr: "A"    },
  mtn_money:       { label: "MTN MoMo",        color: "#eab308", abbr: "MTN"  },
  zamtel_money:    { label: "Zamtel Kwacha",   color: "#22c55e", abbr: "ZM"   },
  visa_mastercard: { label: "Visa/Mastercard", color: "#3b82f6", abbr: "CARD" },
  bank_transfer:    { label: "Bank Transfer",   color: "#6366f1", abbr: "BNK"  },
  cash_on_delivery: { label: "Cash on Delivery", color: "#f59e0b", abbr: "COD"  },
};

const ORDER_STATUSES = ["pending", "confirmed", "awaiting_delivery", "shipped", "delivered", "cancelled"] as const;
const formatStatus = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
type Tab = "overview" | "orders" | "reviews" | "contacts" | "payments" | "settings";
const PAGE_SIZE = 15;

/* ─── Search bar ─────────────────────────────────────────────── */
function SearchBar({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className={cn("relative flex items-center rounded-lg border overflow-hidden", D.border, "bg-[#131e2e]")}>
      <Search className={cn("absolute left-3 h-4 w-4 pointer-events-none", D.muted)} />
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search…"}
        className={cn("w-full pl-9 pr-9 py-2 text-sm bg-transparent outline-none", D.text, "placeholder:text-slate-500")}
      />
      {value && (
        <button onClick={() => { onChange(""); ref.current?.focus(); }}
          className={cn("absolute right-2 p-1 rounded transition-colors hover:bg-white/10", D.muted)}>
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/* ─── Pagination ──────────────────────────────────────────────── */
function Pagination({
  page, total, limit, onChange,
}: { page: number; total: number; limit: number; onChange: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  if (totalPages <= 1 && total <= limit) return null;

  return (
    <div className={cn("flex items-center justify-between px-4 py-3 border-t", D.border)}>
      <span className={cn("text-xs", D.muted)}>
        {total === 0 ? "0 results" : `${from}–${to} of ${total}`}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className={cn("p-1.5 rounded-lg transition-colors",
            page <= 1 ? "text-slate-700 cursor-not-allowed" : cn(D.muted, "hover:bg-white/5 hover:text-slate-200"))}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let p = i + 1;
          if (totalPages > 5) {
            if (page <= 3) p = i + 1;
            else if (page >= totalPages - 2) p = totalPages - 4 + i;
            else p = page - 2 + i;
          }
          return (
            <button key={p} onClick={() => onChange(p)}
              className={cn("min-w-[32px] h-8 px-2 rounded-lg text-xs font-medium transition-colors",
                p === page
                  ? "bg-[#8d6b3d] text-white"
                  : cn(D.muted, "hover:bg-white/5 hover:text-slate-200"))}>
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className={cn("p-1.5 rounded-lg transition-colors",
            page >= totalPages ? "text-slate-700 cursor-not-allowed" : cn(D.muted, "hover:bg-white/5 hover:text-slate-200"))}>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

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
    <SlidePanel open title={`Order #${order.id}`} subtitle={fmtDate(order.createdAt)} onClose={onClose}>
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

      <div className={cn("rounded-xl p-4", D.card, "border", D.border)}>
        <p className={cn("text-xs font-semibold uppercase mb-3", D.muted)}>Customer</p>
        <Field label="Full Name" value={order.fullName} />
        <Field label="Phone" value={<a href={`tel:${order.phone}`} className={cn(D.accent, "hover:underline")}>{order.phone}</a>} />
        {(order as Order & { email?: string }).email && <Field label="Email" value={(order as Order & { email?: string }).email} />}
        <Field label="City" value={order.city} />
        {(order as Order & { address?: string }).address && <Field label="Address" value={(order as Order & { address?: string }).address} />}
      </div>

      <div className={cn("rounded-xl p-4", D.card, "border", D.border)}>
        <p className={cn("text-xs font-semibold uppercase mb-3", D.muted)}>Order Details</p>
        <Field label="Edition" value={<span className="capitalize">{order.productType}</span>} />
        <Field label="Quantity" value={order.quantity} />
        <Field label="Total Amount" value={<span className={D.accent}>{fmtMoney(order.totalAmount)}</span>} accent />
        <Field label="Date" value={fmtDate(order.createdAt)} />
      </div>

      <div className={cn("rounded-xl p-4", D.card, "border", D.border)}>
        <p className={cn("text-xs font-semibold uppercase mb-3", D.muted)}>Update Status</p>
        <div className="flex gap-2 flex-wrap mb-3">
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
          className={cn("w-full py-2.5 rounded-lg text-sm font-medium transition-all",
            status !== order.status
              ? cn(D.accentBg, "text-white hover:opacity-90")
              : "bg-white/5 text-slate-500 cursor-not-allowed")}>
          {saving ? "Saving…" : status === order.status ? "No changes" : `Save — Mark as ${formatStatus(status)}`}
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
    <SlidePanel open title={`Review by ${review.reviewerName}`} subtitle={fmtDate(review.createdAt)} onClose={onClose}>
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

      <div className={cn("rounded-xl p-4", D.card, "border", D.border)}>
        <Field label="Reviewer Name" value={review.reviewerName} />
        {review.reviewerTitle && <Field label="Title / Occupation" value={review.reviewerTitle} />}
        <Field label="Edition" value={<span className="capitalize">{review.productType ?? "—"}</span>} />
        <Field label="Rating" value={`${review.rating} / 5`} />
        <Field label="Submitted" value={fmtDate(review.createdAt)} />
      </div>

      <div className={cn("rounded-xl p-4", D.card, "border", D.border)}>
        <p className={cn("text-xs font-semibold uppercase mb-3", D.muted)}>Review</p>
        <p className={cn("text-sm leading-relaxed italic", D.sub)}>"{review.comment}"</p>
      </div>

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
    <SlidePanel open title={`Message from ${contact.name}`} subtitle={fmtDate(contact.createdAt)} onClose={onClose}>
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
        <Field label="Received" value={fmtDate(contact.createdAt)} />
      </div>

      <div className={cn("rounded-xl p-4", D.card, "border", D.border)}>
        <p className={cn("text-xs font-semibold uppercase mb-3", D.muted)}>Message</p>
        <p className={cn("text-sm leading-relaxed whitespace-pre-wrap", D.sub)}>{contact.message}</p>
      </div>
    </SlidePanel>
  );
}

/* ─── Payment detail panel ──────────────────────────────────── */
function PaymentPanel({ payment, onClose }: { payment: AdminPayment; onClose: () => void }) {
  const meta = PAYMENT_METHOD_META[payment.method];
  return (
    <SlidePanel open title={`Transaction #${payment.id}`} subtitle={fmtDate(payment.createdAt)} onClose={onClose}>
      <div className="flex items-center gap-3">
        <span className={cn("px-3 py-1 rounded-full text-xs font-medium capitalize border", STATUS_COLORS[payment.status] ?? "bg-white/10 text-slate-400")}>
          {payment.status}
        </span>
        {meta && (
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}30` }}>
              <span className="font-bold text-[0.45rem]" style={{ color: meta.color }}>{meta.abbr}</span>
            </div>
            <span className={cn("text-sm", D.sub)}>{meta.label}</span>
          </div>
        )}
      </div>

      <div className={cn("rounded-xl p-4", D.card, "border", D.border)}>
        <p className={cn("text-xs font-semibold uppercase mb-3", D.muted)}>Transaction</p>
        <Field label="Amount" value={<span className={cn("font-bold", D.accent)}>{fmtMoney(payment.amount)}</span>} accent />
        <Field label="Reference" value={<span className="font-mono text-xs">{payment.reference}</span>} />
        <Field label="Method" value={meta?.label ?? payment.method} />
        <Field label="Status" value={<span className="capitalize">{formatStatus(payment.status)}</span>} />
        {payment.phoneNumber && <Field label="Phone Number" value={payment.phoneNumber} />}
        {payment.accountName && <Field label="Account Name" value={payment.accountName} />}
        <Field label="Date" value={fmtDate(payment.createdAt)} />
      </div>

      {(payment.orderName || payment.orderPhone) && (
        <div className={cn("rounded-xl p-4", D.card, "border", D.border)}>
          <p className={cn("text-xs font-semibold uppercase mb-3", D.muted)}>Customer</p>
          {payment.orderName && <Field label="Name" value={payment.orderName} />}
          {payment.orderPhone && <Field label="Phone" value={<a href={`tel:${payment.orderPhone}`} className={cn(D.accent, "hover:underline")}>{payment.orderPhone}</a>} />}
          {payment.orderCity && <Field label="City" value={payment.orderCity} />}
          <Field label="Order" value={
            <span className={cn("font-mono text-xs", D.muted)}>Order #{payment.orderId}</span>
          } />
        </div>
      )}
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
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);

  /* ── Per-tab pagination & search ── */
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersSearch, setOrdersSearch] = useState("");
  const [ordersStatus, setOrdersStatus] = useState("");

  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsSearch, setReviewsSearch] = useState("");
  const [reviewsFilter, setReviewsFilter] = useState<"all" | "true" | "false">("all");

  const [contactsPage, setContactsPage] = useState(1);
  const [contactsSearch, setContactsSearch] = useState("");

  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsSearch, setPaymentsSearch] = useState("");
  const [paymentsStatus, setPaymentsStatus] = useState("");

  /* Reset page when search/filter changes */
  useEffect(() => { setOrdersPage(1); }, [ordersSearch, ordersStatus]);
  useEffect(() => { setReviewsPage(1); }, [reviewsSearch, reviewsFilter]);
  useEffect(() => { setContactsPage(1); }, [contactsSearch]);
  useEffect(() => { setPaymentsPage(1); }, [paymentsSearch, paymentsStatus]);

  if (!isAuthenticated) { navigate("/admin/login"); return null; }

  const { data: stats } = useGetAdminStats();

  const ordersParams = { page: ordersPage, limit: PAGE_SIZE, ...(ordersSearch ? { search: ordersSearch } : {}), ...(ordersStatus ? { status: ordersStatus } : {}) };
  const { data: ordersResult } = useListAdminOrders(ordersParams, {
    query: { enabled: tab === "orders" || tab === "overview", queryKey: getListAdminOrdersQueryKey(ordersParams) },
  });

  const reviewsParams = { page: reviewsPage, limit: PAGE_SIZE, ...(reviewsSearch ? { search: reviewsSearch } : {}), ...(reviewsFilter !== "all" ? { approved: reviewsFilter as ListAdminReviewsApproved } : {}) };
  const { data: reviewsResult } = useListAdminReviews(reviewsParams, {
    query: { enabled: tab === "reviews", queryKey: getListAdminReviewsQueryKey(reviewsParams) },
  });

  const contactsParams = { page: contactsPage, limit: PAGE_SIZE, ...(contactsSearch ? { search: contactsSearch } : {}) };
  const { data: contactsResult } = useListAdminContacts(contactsParams, {
    query: { enabled: tab === "contacts", queryKey: getListAdminContactsQueryKey(contactsParams) },
  });

  const paymentsParams = { page: paymentsPage, limit: PAGE_SIZE, ...(paymentsSearch ? { search: paymentsSearch } : {}), ...(paymentsStatus ? { status: paymentsStatus } : {}) };
  const { data: paymentsResult } = useListAdminPayments(paymentsParams, {
    query: { enabled: tab === "payments", queryKey: getListAdminPaymentsQueryKey(paymentsParams) },
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
  const ordersTotal: number = ordersResult?.total ?? 0;
  const reviewList: Review[] = reviewsResult?.reviews ?? [];
  const reviewsTotal: number = reviewsResult?.total ?? 0;
  const contactList: ContactMessage[] = contactsResult?.contacts ?? [];
  const contactsTotal: number = contactsResult?.total ?? 0;
  const paymentList: AdminPayment[] = paymentsResult?.payments ?? [];
  const paymentsTotal: number = paymentsResult?.total ?? 0;

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
  const exportExcel = (data: Record<string, unknown>[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, filename);
  };

  const exportOrdersExcel = () => {
    exportExcel(orders.map((o) => ({
      ID: o.id, "Full Name": o.fullName, Phone: o.phone,
      Edition: o.productType, Quantity: o.quantity,
      "Total (K)": o.totalAmount, City: o.city, Status: o.status,
      Date: fmtDate(o.createdAt),
    })), "orders.xlsx");
  };

  const statCards = [
    { label: "Total Orders", value: stats?.totalOrders ?? "—", icon: ShoppingBag, color: "text-blue-400" },
    { label: "Total Revenue", value: stats ? fmtMoney(stats.totalRevenue) : "—", icon: TrendingUp, color: "text-[#b08a58]" },
    { label: "Total Visitors", value: stats?.totalVisitors ?? "—", icon: Users, color: "text-purple-400" },
    { label: "Total Buyers", value: stats?.totalBuyers ?? "—", icon: BookOpen, color: "text-emerald-400" },
  ];

  const tabs: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "overview",  label: "Overview",     icon: TrendingUp  },
    { id: "orders",    label: "Orders",        icon: ShoppingBag, count: ordersTotal  },
    { id: "reviews",   label: "Reviews",       icon: Star,        count: reviewsTotal },
    { id: "contacts",  label: "Messages",      icon: MessageSquare, count: contactsTotal },
    { id: "payments",  label: "Transactions",  icon: CreditCard,  count: paymentsTotal },
    { id: "settings",  label: "Settings",      icon: Settings    },
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
              { label: "Paperback Sales",  value: stats.paperbackSales,  color: D.text },
              { label: "Hardcover Sales",  value: stats.hardcoverSales,  color: D.text },
            ].map((item) => (
              <div key={item.label} className={cn("rounded-xl p-5 border", D.card, D.border)}>
                <p className={cn("text-xs mb-1", D.muted)}>{item.label}</p>
                <p className={cn("font-serif text-xl font-bold", item.color)}>{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className={cn("flex gap-1 mb-6 rounded-xl p-1 w-fit border overflow-x-auto", D.card, D.border)}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                tab === t.id
                  ? "bg-[#8d6b3d] text-white shadow"
                  : cn(D.muted, "hover:text-slate-200 hover:bg-white/5"))}>
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
              {t.count !== undefined && t.count > 0 && tab !== t.id && (
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
                      <td className={cn("px-4 py-3 font-semibold", D.accent)}>{fmtMoney(order.totalAmount)}</td>
                      <td className={cn("px-4 py-3", D.muted)}>{order.city}</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLORS[order.status] ?? "bg-white/10 text-slate-400")}>{formatStatus(order.status)}</span>
                      </td>
                      <td className={cn("px-4 py-3 text-xs whitespace-nowrap", D.muted)}>{fmtDate(order.createdAt)}</td>
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
              <h2 className={cn("font-serif text-xl font-bold", D.text)}>
                Orders
                {ordersTotal > 0 && <span className={cn("ml-2 text-sm font-normal", D.muted)}>{ordersTotal} total</span>}
              </h2>
              <div className="flex gap-2">
                <button onClick={() => window.location.assign("/api/admin/export/orders")}
                  className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors", D.muted, D.border, "hover:bg-white/5")}>
                  <FileText className="h-4 w-4" />CSV
                </button>
                <button onClick={exportOrdersExcel}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-800/60 text-emerald-300 border border-emerald-700/40 hover:bg-emerald-800/80 transition-colors">
                  <FileSpreadsheet className="h-4 w-4" />Excel
                </button>
              </div>
            </div>

            {/* Search + filter bar */}
            <div className="flex gap-2 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <SearchBar value={ordersSearch} onChange={setOrdersSearch} placeholder="Search by name, phone, city…" />
              </div>
              <select
                value={ordersStatus}
                onChange={(e) => setOrdersStatus(e.target.value)}
                className={cn("px-3 py-2 text-sm rounded-lg border bg-[#131e2e] outline-none", D.border, D.sub)}>
                <option value="">All statuses</option>
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{formatStatus(s)}</option>)}
              </select>
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
                      <td className={cn("px-4 py-3 font-semibold", D.accent)}>{fmtMoney(order.totalAmount)}</td>
                      <td className={cn("px-4 py-3", D.muted)}>{order.city}</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLORS[order.status] ?? "bg-white/10 text-slate-400")}>{formatStatus(order.status)}</span>
                      </td>
                      <td className={cn("px-4 py-3 text-xs whitespace-nowrap", D.muted)}>{fmtDate(order.createdAt)}</td>
                      <td className="px-4 py-3"><ChevronRight className={cn("h-4 w-4", D.muted)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && <div className={cn("py-12 text-center text-sm", D.muted)}>No orders found.</div>}
              <Pagination page={ordersPage} total={ordersTotal} limit={PAGE_SIZE} onChange={setOrdersPage} />
            </div>
          </div>
        )}

        {/* ── REVIEWS ── */}
        {tab === "reviews" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className={cn("font-serif text-xl font-bold", D.text)}>
                Reviews
                {reviewsTotal > 0 && <span className={cn("ml-2 text-sm font-normal", D.muted)}>{reviewsTotal} total</span>}
              </h2>
            </div>

            {/* Search + filter */}
            <div className="flex gap-2 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <SearchBar value={reviewsSearch} onChange={setReviewsSearch} placeholder="Search by name or review text…" />
              </div>
              <div className={cn("flex rounded-lg border overflow-hidden", D.border)}>
                {(["all", "false", "true"] as const).map((f) => (
                  <button key={f} onClick={() => setReviewsFilter(f)}
                    className={cn("px-4 py-2 text-xs font-medium transition-colors",
                      reviewsFilter === f
                        ? "bg-[#8d6b3d] text-white"
                        : cn("bg-[#131e2e]", D.muted, "hover:bg-white/5"))}>
                    {f === "all" ? "All" : f === "false" ? "Pending" : "Approved"}
                  </button>
                ))}
              </div>
            </div>

            <div className={cn("rounded-xl border overflow-hidden", D.card, D.border)}>
              <div className="divide-y divide-[#1e3050]">
                {reviewList.map((review) => (
                  <div key={review.id} onClick={() => setSelectedReview(review)}
                    className={cn("p-4 cursor-pointer transition-colors flex items-center gap-4", D.cardHov)}>
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
                {reviewList.length === 0 && <div className={cn("py-12 text-center text-sm", D.muted)}>No reviews found.</div>}
              </div>
              <Pagination page={reviewsPage} total={reviewsTotal} limit={PAGE_SIZE} onChange={setReviewsPage} />
            </div>
          </div>
        )}

        {/* ── CONTACTS ── */}
        {tab === "contacts" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className={cn("font-serif text-xl font-bold", D.text)}>
                Contact Messages
                {contactsTotal > 0 && <span className={cn("ml-2 text-sm font-normal", D.muted)}>{contactsTotal} total</span>}
              </h2>
            </div>

            <SearchBar value={contactsSearch} onChange={setContactsSearch} placeholder="Search by name, email, or message…" />

            <div className={cn("rounded-xl border overflow-hidden", D.card, D.border)}>
              <div className="divide-y divide-[#1e3050]">
                {contactList.map((contact) => (
                  <div key={contact.id} onClick={() => setSelectedContact(contact)}
                    className={cn("p-4 cursor-pointer transition-colors", D.cardHov)}>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="min-w-0">
                        <p className={cn("font-medium text-sm", D.text)}>{contact.name}</p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className={cn("text-xs", D.accent)}>{contact.email}</span>
                          {contact.phone && <span className={cn("text-xs", D.muted)}>{contact.phone}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn("text-xs whitespace-nowrap", D.muted)}>{fmtDate(contact.createdAt)}</span>
                        <ChevronRight className={cn("h-4 w-4", D.muted)} />
                      </div>
                    </div>
                    <p className={cn("text-xs line-clamp-2 leading-relaxed", D.muted)}>{contact.message}</p>
                  </div>
                ))}
                {contactList.length === 0 && <div className={cn("py-12 text-center text-sm", D.muted)}>No messages found.</div>}
              </div>
              <Pagination page={contactsPage} total={contactsTotal} limit={PAGE_SIZE} onChange={setContactsPage} />
            </div>
          </div>
        )}

        {/* ── PAYMENTS ── */}
        {tab === "payments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className={cn("font-serif text-xl font-bold", D.text)}>
                Transactions
                {paymentsTotal > 0 && <span className={cn("ml-2 text-sm font-normal", D.muted)}>{paymentsTotal} total</span>}
              </h2>
            </div>

            {/* Search + filter */}
            <div className="flex gap-2 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <SearchBar value={paymentsSearch} onChange={setPaymentsSearch} placeholder="Search by reference, name, or method…" />
              </div>
              <select
                value={paymentsStatus}
                onChange={(e) => setPaymentsStatus(e.target.value)}
                className={cn("px-3 py-2 text-sm rounded-lg border bg-[#131e2e] outline-none", D.border, D.sub)}>
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="successful">Successful</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className={cn("rounded-xl border overflow-x-auto", D.card, D.border)}>
              <table className="w-full text-sm">
                <thead>
                  <tr className={cn("border-b", D.border)}>
                    {["#", "Customer", "Method", "Amount", "Reference", "Status", "Date", ""].map((h) => (
                      <th key={h} className={cn("text-left px-4 py-3 text-xs font-medium whitespace-nowrap", D.muted)}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paymentList.map((p) => {
                    const meta = PAYMENT_METHOD_META[p.method];
                    return (
                      <tr key={p.id} onClick={() => setSelectedPayment(p)}
                        className={cn("border-b last:border-0 cursor-pointer transition-colors", D.border, D.cardHov)}>
                        <td className={cn("px-4 py-3 font-mono text-xs", D.muted)}>#{p.id}</td>
                        <td className={cn("px-4 py-3 whitespace-nowrap", D.text)}>
                          {p.orderName ?? <span className={D.muted}>—</span>}
                          {p.orderCity && <span className={cn("text-xs ml-2", D.muted)}>{p.orderCity}</span>}
                        </td>
                        <td className="px-4 py-3">
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
                        <td className={cn("px-4 py-3 font-semibold", D.accent)}>{fmtMoney(p.amount)}</td>
                        <td className={cn("px-4 py-3 font-mono text-xs", D.muted)}>{p.reference}</td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLORS[p.status] ?? "bg-white/10 text-slate-400")}>
                            {formatStatus(p.status)}
                          </span>
                        </td>
                        <td className={cn("px-4 py-3 text-xs whitespace-nowrap", D.muted)}>{fmtDate(p.createdAt)}</td>
                        <td className="px-4 py-3"><ChevronRight className={cn("h-4 w-4", D.muted)} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {paymentList.length === 0 && <div className={cn("py-12 text-center text-sm", D.muted)}>No transactions found.</div>}
              <Pagination page={paymentsPage} total={paymentsTotal} limit={PAGE_SIZE} onChange={setPaymentsPage} />
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
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}30` }}>
                      <span className="font-bold text-[0.48rem]" style={{ color: meta.color }}>{meta.abbr}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium", D.text)}>{ch.label}</p>
                      <p className={cn("text-xs", D.muted)}>{meta.desc}</p>
                    </div>
                    <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium border",
                      ch.enabled
                        ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                        : "bg-white/5 text-slate-500 border-white/10")}>
                      {ch.enabled ? "Active" : "Disabled"}
                    </span>
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
      {selectedPayment && (
        <PaymentPanel payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
      )}
    </div>
  );
}
