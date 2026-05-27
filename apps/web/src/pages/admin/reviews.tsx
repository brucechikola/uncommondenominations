import { useLocation } from "wouter";
import { useAdminAuthStore } from "@/lib/store";
import {
  useListAdminReviews, useApproveReview, useDeleteReview,
  getListAdminReviewsQueryKey, type Review, type ListAdminReviewsApproved,
} from "@workspace/api-client-react";
import { fmtDate } from "@/components/purchase-ui";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Star, ChevronRight, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { D, PAGE_SIZE, SearchBar, Pagination, Field } from "./_shared";
import { Modal } from "./_modal";
import { AdminLayout } from "./layout";

/* ─── Review detail modal ─────────────────────────────────────── */
function ReviewModal({
  review, onClose, onApprove, onDelete,
}: {
  review: Review;
  onClose: () => void;
  onApprove: (id: number) => Promise<void>;
  onDelete:  (id: number) => Promise<void>;
}) {
  const [approving, setApproving]       = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <Modal open onClose={onClose} title={`Review by ${review.reviewerName}`} subtitle={fmtDate(review.createdAt)}>
      {/* Status + rating */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={cn("px-3 py-1 rounded-full text-xs font-medium",
          review.approved
            ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30"
            : "bg-yellow-400/15 text-yellow-300 border border-yellow-400/30")}>
          {review.approved ? "Approved — visible on site" : "Pending — not yet visible"}
        </span>
        <div className="flex gap-0.5 ml-auto">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn("h-4 w-4", i < review.rating ? "fill-[#b08a58] text-[#b08a58]" : "text-slate-700")} />
          ))}
        </div>
      </div>

      {/* Details */}
      <div className={cn("rounded-xl p-4 border", "bg-slate-50", D.border)}>
        <Field label="Reviewer Name"      value={review.reviewerName} />
        {review.reviewerTitle && <Field label="Title / Occupation" value={review.reviewerTitle} />}
        <Field label="Edition"            value={<span className="capitalize">{review.productType ?? "—"}</span>} />
        <Field label="Rating"             value={`${review.rating} / 5`} />
        <Field label="Submitted"          value={fmtDate(review.createdAt)} />
      </div>

      {/* Review text */}
      <div className={cn("rounded-xl p-4 border", "bg-slate-50", D.border)}>
        <p className={cn("text-xs font-semibold uppercase tracking-wider mb-3", D.muted)}>Review</p>
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
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-red-900/30 text-red-300 hover:bg-red-900/50 transition-colors border border-red-800/40">
            <Trash2 className="h-4 w-4" />Delete Review
          </button>
        ) : (
          <div className="rounded-xl p-4 bg-red-900/20 border border-red-800/50">
            <p className="text-sm text-red-300 mb-3">Are you sure? This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 rounded-xl text-sm font-medium bg-slate-100 text-slate-400 hover:bg-slate-100 transition-colors">
                Cancel
              </button>
              <button onClick={async () => { setDeleting(true); await onDelete(review.id); onClose(); }}
                disabled={deleting}
                className="flex-1 py-2 rounded-xl text-sm font-medium bg-red-700 text-white hover:bg-red-600 transition-colors">
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ─── Reviews page ────────────────────────────────────────────── */
export default function AdminReviews() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAdminAuthStore();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "true" | "false">("all");
  const [selected, setSelected] = useState<Review | null>(null);

  useEffect(() => { setPage(1); }, [search, filter]);

  if (!isAuthenticated) { navigate("/admin/login"); return null; }

  const params = {
    page, limit: PAGE_SIZE,
    ...(search ? { search } : {}),
    ...(filter !== "all" ? { approved: filter as ListAdminReviewsApproved } : {}),
  };
  const { data: result } = useListAdminReviews(params, {
    query: { queryKey: getListAdminReviewsQueryKey(params) },
  });
  const approveReview = useApproveReview();
  const deleteReview  = useDeleteReview();

  const reviews: Review[] = result?.reviews ?? [];
  const total: number     = result?.total ?? 0;

  const handleApprove = async (id: number) => {
    await approveReview.mutateAsync({ id });
    await queryClient.invalidateQueries({ queryKey: getListAdminReviewsQueryKey() });
  };
  const handleDelete = async (id: number) => {
    await deleteReview.mutateAsync({ id });
    await queryClient.invalidateQueries({ queryKey: getListAdminReviewsQueryKey() });
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        {/* Heading */}
        <div className="mb-6">
          <h1 className={cn("text-2xl font-bold", D.text)}>Reviews</h1>
          {total > 0 && <p className={cn("text-sm mt-0.5", D.muted)}>{total} total</p>}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-4">
          <div className="flex-1 min-w-[200px]">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by name or review text…" />
          </div>
          <div className={cn("flex rounded-xl border overflow-hidden", D.border)}>
            {(["all", "false", "true"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("px-4 py-2 text-xs font-medium transition-colors",
                  filter === f ? "bg-[#8d6b3d] text-white" : cn(D.card, D.muted, "hover:bg-slate-100"))}>
                {f === "all" ? "All" : f === "false" ? "Pending" : "Approved"}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className={cn("rounded-2xl border overflow-hidden", D.card, D.border)}>
          <div className={cn("divide-y", D.divide)}>
            {reviews.map((review) => (
              <div key={review.id} onClick={() => setSelected(review)}
                className={cn("p-4 cursor-pointer transition-colors flex items-center gap-4", D.cardHov)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={cn("font-medium text-sm", D.text)}>{review.reviewerName}</span>
                    {review.reviewerTitle && <span className={cn("text-xs", D.muted)}>{review.reviewerTitle}</span>}
                    <div className="flex gap-0.5 ml-auto">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-[#b08a58] text-[#b08a58]" />
                      ))}
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                      review.approved
                        ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/20"
                        : "bg-yellow-400/15 text-yellow-300 border border-yellow-400/20")}>
                      {review.approved ? "Approved" : "Pending"}
                    </span>
                  </div>
                  <p className={cn("text-xs truncate italic", D.muted)}>"{review.comment}"</p>
                </div>
                <ChevronRight className={cn("h-4 w-4 flex-shrink-0", D.muted)} />
              </div>
            ))}
            {reviews.length === 0 && (
              <div className={cn("py-14 text-center text-sm", D.muted)}>No reviews found.</div>
            )}
          </div>
          <Pagination page={page} total={total} limit={PAGE_SIZE} onChange={setPage} />
        </div>
      </div>

      {selected && (
        <ReviewModal
          review={selected}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          onDelete={handleDelete}
        />
      )}
    </AdminLayout>
  );
}
