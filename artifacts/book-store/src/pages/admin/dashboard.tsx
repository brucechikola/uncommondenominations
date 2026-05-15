import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminAuthStore } from "@/lib/store";
import {
  useGetAdminStats,
  useListAdminOrders,
  useListAdminReviews,
  useListAdminContacts,
  useApproveReview,
  useDeleteReview,
  useUpdateOrderStatus,
  getListAdminReviewsQueryKey,
  getListAdminOrdersQueryKey,
  getListAdminContactsQueryKey,
  type Review,
  type Order,
  type ContactMessage,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShoppingBag, Users, Star, TrendingUp, LogOut,
  Check, Trash2, Download, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "overview" | "orders" | "reviews" | "contacts";
const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { isAuthenticated, logout } = useAdminAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");

  if (!isAuthenticated) {
    navigate("/admin/login");
    return null;
  }

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

  const orders: Order[] = ordersResult?.orders ?? [];
  const contactList: ContactMessage[] = Array.isArray(contacts) ? (contacts as ContactMessage[]) : [];

  const handleApproveReview = async (id: number) => {
    await approveReview.mutateAsync({ id });
    await queryClient.invalidateQueries({ queryKey: getListAdminReviewsQueryKey() });
  };

  const handleDeleteReview = async (id: number) => {
    if (!confirm("Delete this review?")) return;
    await deleteReview.mutateAsync({ id });
    await queryClient.invalidateQueries({ queryKey: getListAdminReviewsQueryKey() });
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    await updateOrderStatus.mutateAsync({
      id,
      data: { status: status as "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" },
    });
    await queryClient.invalidateQueries({ queryKey: getListAdminOrdersQueryKey() });
  };

  const handleLogout = () => { logout(); navigate("/"); };

  const statCards = [
    { label: "Total Orders", value: stats?.totalOrders ?? "—", icon: ShoppingBag, color: "text-blue-500" },
    { label: "Total Revenue", value: stats ? `K${stats.totalRevenue}` : "—", icon: TrendingUp, color: "text-green-500" },
    { label: "Total Visitors", value: stats?.totalVisitors ?? "—", icon: Users, color: "text-purple-500" },
    { label: "Total Buyers", value: stats?.totalBuyers ?? "—", icon: Eye, color: "text-amber-500" },
  ];

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "orders", label: "Orders" },
    { id: "reviews", label: "Reviews" },
    { id: "contacts", label: "Messages" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif font-bold">Admin Dashboard</span>
            <Badge variant="secondary" className="text-xs">The Luminous Path</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground">
            <LogOut className="h-4 w-4" />Log Out
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-card border border-card-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className="font-serif text-2xl font-bold">{s.value}</p>
            </motion.div>
          ))}
        </div>

        {stats && (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-card border border-card-border rounded-xl p-5">
              <p className="text-xs text-muted-foreground mb-1">Pending Payments</p>
              <p className="font-serif text-xl font-bold text-yellow-600">{stats.pendingPayments}</p>
            </div>
            <div className="bg-card border border-card-border rounded-xl p-5">
              <p className="text-xs text-muted-foreground mb-1">Paperback Sales</p>
              <p className="font-serif text-xl font-bold">{stats.paperbackSales}</p>
            </div>
            <div className="bg-card border border-card-border rounded-xl p-5">
              <p className="text-xs text-muted-foreground mb-1">Hardcover Sales</p>
              <p className="font-serif text-xl font-bold">{stats.hardcoverSales}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-muted/40 rounded-xl p-1 w-fit">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("px-5 py-2 rounded-lg text-sm font-medium transition-all",
                tab === t.id ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground")}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="space-y-6">
            <h2 className="font-serif text-xl font-bold">Recent Orders</h2>
            <div className="bg-card border border-card-border rounded-xl overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    {["ID", "Name", "Edition", "Qty", "Total", "City", "Status", "Date"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.slice(0, 8).map((order) => (
                    <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{order.id}</td>
                      <td className="px-4 py-3 font-medium">{order.fullName}</td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{order.productType}</td>
                      <td className="px-4 py-3 text-muted-foreground">{order.quantity}</td>
                      <td className="px-4 py-3 font-semibold text-primary">K{order.totalAmount}</td>
                      <td className="px-4 py-3 text-muted-foreground">{order.city}</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", statusColor[order.status] ?? "bg-muted")}>{order.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && (
                <div className="py-12 text-center text-muted-foreground text-sm">No orders yet.</div>
              )}
            </div>
          </div>
        )}

        {/* Orders */}
        {tab === "orders" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold">All Orders</h2>
              <Button variant="outline" size="sm" onClick={() => { window.location.href = "/api/admin/export/orders"; }} className="gap-2">
                <Download className="h-4 w-4" />Export CSV
              </Button>
            </div>
            <div className="bg-card border border-card-border rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    {["ID", "Name", "Phone", "Edition", "Qty", "Total", "City", "Status", "Date", "Action"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{order.id}</td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{order.fullName}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{order.phone}</td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{order.productType}</td>
                      <td className="px-4 py-3 text-muted-foreground">{order.quantity}</td>
                      <td className="px-4 py-3 font-semibold text-primary">K{order.totalAmount}</td>
                      <td className="px-4 py-3 text-muted-foreground">{order.city}</td>
                      <td className="px-4 py-3">
                        <select value={order.status} onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          className={cn("rounded-full px-2 py-0.5 text-xs font-medium border-0 cursor-pointer capitalize", statusColor[order.status] ?? "bg-muted")}>
                          {ORDER_STATUSES.map((s) => <option key={s} value={s} className="bg-background text-foreground">{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <a href={`tel:${order.phone}`} className="text-primary hover:underline text-xs">Call</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && (
                <div className="py-12 text-center text-muted-foreground text-sm">No orders yet.</div>
              )}
            </div>
          </div>
        )}

        {/* Reviews */}
        {tab === "reviews" && (
          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold">Reviews</h2>
            <div className="space-y-3">
              {(reviews as Review[] | undefined)?.map((review: Review) => (
                <div key={review.id} className="bg-card border border-card-border rounded-xl p-5 flex gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-serif font-semibold">{review.reviewerName}</span>
                      {review.reviewerTitle && <span className="text-xs text-muted-foreground">{review.reviewerTitle}</span>}
                      <div className="flex gap-0.5 ml-auto">
                        {Array.from({ length: review.rating }).map((_, i) => <Star key={i} className="h-3 w-3 fill-primary text-primary" />)}
                      </div>
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", review.approved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800")}>
                        {review.approved ? "Approved" : "Pending"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground italic">"{review.comment}"</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(review.createdAt).toLocaleDateString()}{review.productType ? ` · ${review.productType}` : ""}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {!review.approved && (
                      <Button size="sm" variant="outline" onClick={() => handleApproveReview(review.id)} className="gap-1 text-green-600 border-green-200 hover:bg-green-50">
                        <Check className="h-3.5 w-3.5" />Approve
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleDeleteReview(review.id)} className="gap-1 text-destructive border-red-200 hover:bg-red-50">
                      <Trash2 className="h-3.5 w-3.5" />Delete
                    </Button>
                  </div>
                </div>
              ))}
              {(!reviews || (reviews as Review[]).length === 0) && (
                <div className="py-12 text-center text-muted-foreground text-sm">No reviews yet.</div>
              )}
            </div>
          </div>
        )}

        {/* Contacts */}
        {tab === "contacts" && (
          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold">Contact Messages</h2>
            <div className="space-y-3">
              {contactList.map((contact: ContactMessage) => (
                <div key={contact.id} className="bg-card border border-card-border rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="font-serif font-semibold">{contact.name}</p>
                      <div className="flex gap-4 mt-0.5">
                        <a href={`mailto:${contact.email}`} className="text-xs text-primary hover:underline">{contact.email}</a>
                        {contact.phone && <a href={`tel:${contact.phone}`} className="text-xs text-muted-foreground hover:underline">{contact.phone}</a>}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(contact.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{contact.message}</p>
                </div>
              ))}
              {contactList.length === 0 && (
                <div className="py-12 text-center text-muted-foreground text-sm">No messages yet.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
