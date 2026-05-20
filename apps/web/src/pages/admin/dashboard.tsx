import { useLocation } from "wouter";
import { useAdminAuthStore } from "@/lib/store";
import {
  useGetAdminStats,
  useListAdminOrders,
  useListAdminPayments,
  useListAdminContacts,
  getListAdminOrdersQueryKey,
  getListAdminPaymentsQueryKey,
  getListAdminContactsQueryKey,
  type Order,
  type AdminPayment,
  type ContactMessage,
} from "@workspace/api-client-react";
import { fmtMoney, fmtDate } from "@/components/purchase-ui";
import { motion } from "framer-motion";
import {
  ShoppingBag, TrendingUp, Users, BookOpen,
  CreditCard, Clock, ChevronRight, MessageSquare, ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Link } from "wouter";
import { D, STATUS_COLORS, STATUS_HEX, PAYMENT_METHOD_META, ORDER_STATUSES, formatStatus } from "./_shared";
import { AdminLayout } from "./layout";

/* ─── Custom tooltip ──────────────────────────────────────────── */
function ChartTooltip({ active, payload, label, prefix = "" }: {
  active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string; prefix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border px-4 py-3 text-sm shadow-xl"
      style={{ background: "#0e1829", borderColor: "#1a2d4a" }}>
      {label && <p className="text-slate-400 text-xs mb-2 font-medium">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="font-semibold" style={{ color: p.color }}>
          {p.name}: {prefix}{typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

/* ─── Stat card ───────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: React.ElementType; color: string; sub?: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-2xl p-5 border relative overflow-hidden", D.card, D.border)}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center")}
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <ArrowUpRight className="h-4 w-4 text-slate-700" />
      </div>
      <p className={cn("text-[0.7rem] font-medium uppercase tracking-wider mb-1", D.muted)}>{label}</p>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      {sub && <p className={cn("text-xs mt-1", D.muted)}>{sub}</p>}
      {/* Subtle glow */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-5"
        style={{ background: color, filter: "blur(16px)" }} />
    </motion.div>
  );
}

/* ─── Dashboard ───────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAdminAuthStore();

  if (!isAuthenticated) { navigate("/admin/login"); return null; }

  const { data: stats } = useGetAdminStats();

  /* Load recent data for charts */
  const ordersParams = { page: 1, limit: 100 };
  const { data: ordersResult } = useListAdminOrders(ordersParams, {
    query: { queryKey: getListAdminOrdersQueryKey(ordersParams) },
  });
  const paymentsParams = { page: 1, limit: 100 };
  const { data: paymentsResult } = useListAdminPayments(paymentsParams, {
    query: { queryKey: getListAdminPaymentsQueryKey(paymentsParams) },
  });
  const contactsParams = { page: 1, limit: 5 };
  const { data: contactsResult } = useListAdminContacts(contactsParams, {
    query: { queryKey: getListAdminContactsQueryKey(contactsParams) },
  });

  const orders: Order[]             = ordersResult?.orders ?? [];
  const payments: AdminPayment[]    = paymentsResult?.payments ?? [];
  const recentMessages: ContactMessage[] = contactsResult?.contacts ?? [];

  /* ── Chart data derivations ─────────────────────────────── */

  // Edition Sales (bar)
  const editionData = [
    {
      name: "Paperback",
      "Books Sold": stats?.paperbackSales ?? 0,
      "Revenue (K)": (stats?.paperbackSales ?? 0) * 400,
    },
    {
      name: "Hardcover",
      "Books Sold": stats?.hardcoverSales ?? 0,
      "Revenue (K)": (stats?.hardcoverSales ?? 0) * 500,
    },
  ];

  // Order Status distribution (pie/donut)
  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});
  const statusData = ORDER_STATUSES
    .map((s) => ({ name: formatStatus(s), value: statusCounts[s] ?? 0, color: STATUS_HEX[s] }))
    .filter((d) => d.value > 0);

  // Payment method distribution (horizontal bar)
  const methodCounts = payments.reduce<Record<string, number>>((acc, p) => {
    const label = PAYMENT_METHOD_META[p.method]?.label ?? p.method;
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});
  const methodData = Object.entries(methodCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  /* ── Stat cards config ──────────────────────────────────── */
  const statCards = [
    { label: "Total Orders",   value: stats?.totalOrders ?? "—",              icon: ShoppingBag, color: "#60a5fa", sub: "All time"        },
    { label: "Total Revenue",  value: stats ? fmtMoney(stats.totalRevenue) : "—", icon: TrendingUp,  color: "#b08a58", sub: "All time"   },
    { label: "Unique Buyers",  value: stats?.totalBuyers ?? "—",              icon: Users,       color: "#a78bfa", sub: "Distinct customers" },
    { label: "Pending Payments",value: stats?.pendingPayments ?? "—",         icon: Clock,       color: "#fb923c", sub: "Awaiting payment"  },
  ];

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-8">

        {/* ── Page title ── */}
        <div>
          <h1 className={cn("text-2xl font-bold", D.text)}>Dashboard</h1>
          <p className={cn("text-sm mt-1", D.muted)}>Overview of Uncommon Denominators sales and activity.</p>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <motion.div key={s.label} transition={{ delay: i * 0.06 }}>
              <StatCard {...s} />
            </motion.div>
          ))}
        </div>

        {/* ── Charts row 1: Edition Sales + Order Status ── */}
        <div className="grid lg:grid-cols-5 gap-6">

          {/* Edition Sales Bar Chart */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className={cn("lg:col-span-3 rounded-2xl border p-5", D.card, D.border)}>
            <div className="flex items-center justify-between mb-1">
              <h2 className={cn("text-sm font-semibold", D.text)}>Edition Sales</h2>
              <BookOpen className={cn("h-4 w-4", D.muted)} />
            </div>
            <p className={cn("text-xs mb-5", D.muted)}>Books sold and revenue by format</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={editionData} barCategoryGap="40%" barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2d4a" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Legend iconType="circle" iconSize={8}
                  wrapperStyle={{ fontSize: "0.7rem", color: "#64748b", paddingTop: "12px" }} />
                <Bar dataKey="Books Sold" fill="#8d6b3d" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Revenue (K)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Order Status Donut */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className={cn("lg:col-span-2 rounded-2xl border p-5", D.card, D.border)}>
            <div className="flex items-center justify-between mb-1">
              <h2 className={cn("text-sm font-semibold", D.text)}>Order Status</h2>
              <ShoppingBag className={cn("h-4 w-4", D.muted)} />
            </div>
            <p className={cn("text-xs mb-5", D.muted)}>Distribution across all orders</p>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%" cy="45%"
                    innerRadius={55} outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as { name: string; value: number; color: string };
                      return (
                        <div className="rounded-xl border px-3 py-2 text-xs shadow-xl"
                          style={{ background: "#0e1829", borderColor: "#1a2d4a" }}>
                          <p style={{ color: d.color }} className="font-semibold">{d.name}</p>
                          <p className="text-slate-400">{d.value} order{d.value !== 1 ? "s" : ""}</p>
                        </div>
                      );
                    }}
                  />
                  <Legend iconType="circle" iconSize={7}
                    wrapperStyle={{ fontSize: "0.65rem", color: "#64748b", paddingTop: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className={cn("flex items-center justify-center h-[220px] text-sm", D.muted)}>No order data yet</div>
            )}
          </motion.div>
        </div>

        {/* ── Charts row 2: Payment Methods + Recent messages ── */}
        <div className="grid lg:grid-cols-5 gap-6">

          {/* Payment Methods Horizontal Bar */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className={cn("lg:col-span-3 rounded-2xl border p-5", D.card, D.border)}>
            <div className="flex items-center justify-between mb-1">
              <h2 className={cn("text-sm font-semibold", D.text)}>Payment Channels</h2>
              <CreditCard className={cn("h-4 w-4", D.muted)} />
            </div>
            <p className={cn("text-xs mb-5", D.muted)}>Transaction count per channel</p>
            {methodData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={methodData} layout="vertical" barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2d4a" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="count" name="Transactions" fill="#8d6b3d" radius={[0, 6, 6, 0]}>
                    {methodData.map((entry) => {
                      const key = Object.entries(PAYMENT_METHOD_META).find(([, v]) => v.label === entry.name)?.[0];
                      const color = key ? PAYMENT_METHOD_META[key].color : "#8d6b3d";
                      return <Cell key={entry.name} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={cn("flex items-center justify-center h-[220px] text-sm", D.muted)}>No payment data yet</div>
            )}
          </motion.div>

          {/* Recent Contact Messages */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className={cn("lg:col-span-2 rounded-2xl border flex flex-col", D.card, D.border)}>
            <div className={cn("flex items-center justify-between px-5 py-4 border-b flex-shrink-0", D.border)}>
              <div className="flex items-center gap-2">
                <MessageSquare className={cn("h-4 w-4", D.muted)} />
                <h2 className={cn("text-sm font-semibold", D.text)}>Recent Messages</h2>
              </div>
              <Link href="/admin/messages">
                <span className={cn("text-xs font-medium cursor-pointer hover:text-slate-200 transition-colors", D.muted)}>View all →</span>
              </Link>
            </div>
            <div className={cn("flex-1 divide-y", D.divide)}>
              {recentMessages.length === 0 && (
                <div className={cn("flex items-center justify-center h-full py-10 text-sm", D.muted)}>No messages yet</div>
              )}
              {recentMessages.map((msg) => (
                <div key={msg.id} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={cn("text-sm font-medium", D.text)}>{msg.name}</p>
                    <p className={cn("text-xs", D.muted)}>{fmtDate(msg.createdAt)}</p>
                  </div>
                  <p className={cn("text-xs", D.accent)}>{msg.email}</p>
                  <p className={cn("text-xs mt-1 line-clamp-1", D.muted)}>{msg.message}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Recent Orders table ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className={cn("rounded-2xl border", D.card, D.border)}>
          <div className={cn("flex items-center justify-between px-5 py-4 border-b", D.border)}>
            <div className="flex items-center gap-2">
              <ShoppingBag className={cn("h-4 w-4", D.muted)} />
              <h2 className={cn("text-sm font-semibold", D.text)}>Recent Orders</h2>
            </div>
            <Link href="/admin/orders">
              <span className={cn("text-xs font-medium cursor-pointer hover:text-slate-200 transition-colors", D.muted)}>View all →</span>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("border-b", D.border)}>
                  {["#", "Customer", "Edition", "Qty", "Total", "City", "Status", "Date"].map((h) => (
                    <th key={h} className={cn("text-left px-4 py-3 text-xs font-medium whitespace-nowrap", D.muted)}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 8).map((order) => (
                  <tr key={order.id}
                    className={cn("border-b last:border-0 transition-colors", D.border)}>
                    <td className={cn("px-4 py-3.5 font-mono text-xs", D.muted)}>#{order.id}</td>
                    <td className={cn("px-4 py-3.5 font-medium whitespace-nowrap", D.text)}>{order.fullName}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && (
              <div className={cn("py-14 text-center text-sm", D.muted)}>No orders yet.</div>
            )}
          </div>
          {orders.length > 8 && (
            <div className={cn("px-5 py-3 border-t text-center", D.border)}>
              <Link href="/admin/orders">
                <span className={cn("text-xs font-medium cursor-pointer flex items-center justify-center gap-1 hover:text-slate-200 transition-colors", D.muted)}>
                  View all {ordersResult?.total} orders <ChevronRight className="h-3 w-3" />
                </span>
              </Link>
            </div>
          )}
        </motion.div>

      </div>
    </AdminLayout>
  );
}
