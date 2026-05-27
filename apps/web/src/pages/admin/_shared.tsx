import { useRef } from "react";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Theme tokens ─────────────────────────────────────────── */
export const D = {
  bg:       "bg-slate-50",
  card:     "bg-white",
  card2:    "bg-slate-50",
  cardHov:  "hover:bg-slate-50",
  border:   "border-slate-200",
  divide:   "divide-slate-200",
  header:   "bg-white",
  sidebar:  "bg-white",
  accent:   "text-[#7a5c30]",
  accentBg: "bg-[#8d6b3d]",
  muted:    "text-slate-500",
  text:     "text-slate-800",
  sub:      "text-slate-600",
};

export const STATUS_COLORS: Record<string, string> = {
  pending:           "bg-amber-50 text-amber-700 border border-amber-200",
  confirmed:         "bg-blue-50 text-blue-700 border border-blue-200",
  awaiting_delivery: "bg-orange-50 text-orange-700 border border-orange-200",
  picked_up:         "bg-cyan-50 text-cyan-700 border border-cyan-200",
  in_transit:        "bg-violet-50 text-violet-700 border border-violet-200",
  shipped:           "bg-indigo-50 text-indigo-700 border border-indigo-200",
  delivered:         "bg-emerald-50 text-emerald-700 border border-emerald-200",
  failed_delivery:   "bg-rose-50 text-rose-700 border border-rose-200",
  cancelled:         "bg-red-50 text-red-700 border border-red-200",
  successful:        "bg-emerald-50 text-emerald-700 border border-emerald-200",
  failed:            "bg-red-50 text-red-700 border border-red-200",
};

export const STATUS_HEX: Record<string, string> = {
  pending:           "#facc15",
  confirmed:         "#60a5fa",
  awaiting_delivery: "#fb923c",
  picked_up:         "#22d3ee",
  in_transit:        "#a78bfa",
  shipped:           "#818cf8",
  delivered:         "#34d399",
  failed_delivery:   "#fb7185",
  cancelled:         "#f87171",
};

export const PAYMENT_METHOD_META: Record<string, { label: string; color: string; abbr: string }> = {
  airtel_money:             { label: "Airtel Money",              color: "#ef4444", abbr: "A"    },
  mtn_money:                { label: "MTN MoMo",                  color: "#eab308", abbr: "MTN"  },
  zamtel_money:             { label: "Zamtel Kwacha",             color: "#22c55e", abbr: "ZM"   },
  visa_mastercard:          { label: "Visa/Mastercard",           color: "#3b82f6", abbr: "CARD" },
  bank_transfer:            { label: "Bank Transfer",             color: "#6366f1", abbr: "BNK"  },
  mobile_money_on_delivery: { label: "Mobile Money on Delivery",  color: "#f59e0b", abbr: "MOD"  },
};

export const ORDER_STATUSES = [
  "pending", "confirmed", "awaiting_delivery", "picked_up", "in_transit",
  "delivered", "failed_delivery", "cancelled",
] as const;

export const formatStatus = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const PAGE_SIZE = 15;

/* ─── Search bar ─────────────────────────────────────────────── */
export function SearchBar({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className={cn("relative flex items-center rounded-lg border overflow-hidden", D.border, D.card)}>
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

/* ─── Pagination ─────────────────────────────────────────────── */
export function Pagination({
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
        <button onClick={() => onChange(page - 1)} disabled={page <= 1}
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
                p === page ? "bg-[#8d6b3d] text-white" : cn(D.muted, "hover:bg-white/5 hover:text-slate-200"))}>
              {p}
            </button>
          );
        })}
        <button onClick={() => onChange(page + 1)} disabled={page >= totalPages}
          className={cn("p-1.5 rounded-lg transition-colors",
            page >= totalPages ? "text-slate-700 cursor-not-allowed" : cn(D.muted, "hover:bg-white/5 hover:text-slate-200"))}>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── Field row ─────────────────────────────────────────────── */
export function Field({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-0.5 py-3 border-b", D.border, "last:border-0")}>
      <span className={cn("text-xs font-medium uppercase tracking-wider", D.muted)}>{label}</span>
      <span className={cn("text-sm", accent ? D.accent : D.sub)}>{value ?? "—"}</span>
    </div>
  );
}
