import { useListReviews, useCreateReview, getListReviewsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PAGE_BG, CARD_BG, CARD_BORDER, GOLD, TEXT_PRIMARY, TEXT_MUTED, TEXT_DIM } from "@/components/purchase-ui";

const EASE = [0.22, 1, 0.36, 1] as const;

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "hsl(220,45%,9%)",
  border: `1px solid hsl(220,38%,20%)`,
  borderRadius: "12px",
  color: TEXT_PRIMARY,
  fontSize: "0.875rem",
  padding: "0.7rem 0.875rem",
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 0.15s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.58rem",
  fontFamily: "var(--font-sans, sans-serif)",
  fontWeight: 600,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: TEXT_DIM,
  marginBottom: "0.45rem",
};

export default function Reviews() {
  const queryClient = useQueryClient();
  const { data: reviews, isLoading } = useListReviews();
  const createReview = useCreateReview();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [productType, setProductType] = useState<"paperback" | "hardcover" | "">("");
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !comment) return;
    try {
      await createReview.mutateAsync({
        data: { reviewerName: name, reviewerTitle: title || null, rating, comment, productType: productType || null },
      });
      await queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey() });
      setSubmitted(true);
      setName(""); setTitle(""); setComment(""); setProductType(""); setRating(5);
    } catch { /* handle */ }
  };

  const avgRating = reviews?.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const focusStyle = (field: string): React.CSSProperties => ({
    ...inputStyle,
    borderColor: focused === field ? GOLD : inputStyle.border as string,
    boxShadow: focused === field ? `0 0 0 3px hsl(42,78%,46%,0.12)` : undefined,
  });

  return (
    <div style={{ background: PAGE_BG, minHeight: "100svh" }} className="overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none">
          <div style={{
            width: "800px", height: "400px",
            background: "radial-gradient(ellipse, hsl(42,78%,46%,0.07) 0%, transparent 65%)",
            filter: "blur(30px)",
          }} />
        </div>
        <div className="relative z-10 container mx-auto px-6 max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
            <p className="font-sans text-[0.6rem] tracking-[0.32em] uppercase font-semibold mb-5"
              style={{ color: GOLD }}>Reader Reviews</p>
            <h1 className="font-display font-bold mb-5"
              style={{ fontSize: "clamp(2.2rem,5vw,3.8rem)", color: TEXT_PRIMARY }}>
              What Readers Say
            </h1>
            <div className="w-14 h-[2px] mx-auto mb-8" style={{ background: `linear-gradient(90deg,transparent,${GOLD},transparent)` }} />

            {/* Average rating display */}
            {avgRating && reviews && (
              <div className="flex items-center justify-center gap-4">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-5 w-5" style={{
                      fill: i < Math.round(Number(avgRating)) ? GOLD : "transparent",
                      color: i < Math.round(Number(avgRating)) ? GOLD : "hsl(220,38%,28%)",
                    }} />
                  ))}
                </div>
                <span className="font-display font-bold text-3xl" style={{ color: GOLD }}>{avgRating}</span>
                <span className="font-sans text-[0.78rem]" style={{ color: TEXT_DIM }}>
                  / 5 from {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </span>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Reviews grid ── */}
      <section className="pb-16">
        <div className="container mx-auto px-6 max-w-5xl">
          {isLoading ? (
            <div className="text-center py-16 font-sans text-[0.85rem]" style={{ color: TEXT_DIM }}>
              Loading reviews…
            </div>
          ) : reviews && reviews.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-5">
              {reviews.map((review, i) => (
                <motion.div key={review.id}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.06, ease: EASE }}
                  className="rounded-2xl p-7 flex flex-col gap-4"
                  style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>

                  {/* Stars */}
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5" style={{
                        fill: j < review.rating ? GOLD : "transparent",
                        color: j < review.rating ? GOLD : "hsl(220,38%,28%)",
                      }} />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="font-serif italic text-[0.9rem] leading-relaxed flex-1"
                    style={{ color: TEXT_MUTED }}>
                    "{review.comment}"
                  </p>

                  {/* Reviewer */}
                  <div style={{ borderTop: `1px solid ${CARD_BORDER}`, paddingTop: "1rem" }}>
                    <p className="font-sans text-[0.78rem] font-semibold" style={{ color: TEXT_PRIMARY }}>
                      {review.reviewerName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {review.reviewerTitle && (
                        <span className="font-sans text-[0.68rem]" style={{ color: TEXT_DIM }}>
                          {review.reviewerTitle}
                        </span>
                      )}
                      {review.productType && (
                        <span className="font-sans text-[0.6rem] tracking-[0.12em] uppercase px-2 py-0.5 rounded-full"
                          style={{ background: "hsl(42,78%,46%,0.08)", color: "hsl(42,78%,56%)", border: "1px solid hsl(42,78%,46%,0.18)" }}>
                          {review.productType}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : !isLoading && (
            <div className="text-center py-16">
              <p className="font-sans text-[0.85rem]" style={{ color: TEXT_DIM }}>No reviews yet — be the first!</p>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════ LEAVE A REVIEW ══════════════════════ */}
      <section style={{ borderTop: `1px solid ${CARD_BORDER}` }} className="py-20">
        <div className="container mx-auto px-6 max-w-3xl">

          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ ease: EASE }}>
            <p className="font-sans text-[0.6rem] tracking-[0.32em] uppercase font-semibold mb-4 text-center"
              style={{ color: GOLD }}>Share Your Experience</p>
            <h2 className="font-display font-bold text-center mb-3"
              style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", color: TEXT_PRIMARY }}>
              Leave a Review
            </h2>
            <p className="font-sans text-[0.85rem] text-center mb-10" style={{ color: TEXT_DIM }}>
              Have you read Uncommon Denominators? Tell others what you thought.
            </p>
          </motion.div>

          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center py-12 gap-5">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "hsl(42,78%,46%,0.12)", border: `1px solid hsl(42,78%,46%,0.3)` }}>
                <span className="text-2xl font-bold" style={{ color: GOLD }}>✓</span>
              </div>
              <div>
                <h3 className="font-display font-bold text-xl mb-2" style={{ color: TEXT_PRIMARY }}>Thank You!</h3>
                <p className="font-sans text-[0.85rem]" style={{ color: TEXT_DIM }}>
                  Your review will be published after approval.
                </p>
              </div>
              <button onClick={() => setSubmitted(false)}
                className="font-sans text-[0.72rem] tracking-[0.1em] uppercase underline underline-offset-4 mt-2 transition-opacity hover:opacity-70"
                style={{ color: GOLD }}>
                Write Another
              </button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.1, ease: EASE }}>
              <form onSubmit={handleSubmit} className="rounded-2xl p-8 space-y-6"
                style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>

                {/* Star rating */}
                <div>
                  <label style={labelStyle}>Your Rating *</label>
                  <div className="flex gap-2 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button key={i} type="button"
                        onClick={() => setRating(i + 1)}
                        onMouseEnter={() => setHoverRating(i + 1)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110">
                        <Star className="h-8 w-8 transition-colors" style={{
                          fill: i < (hoverRating || rating) ? GOLD : "transparent",
                          color: i < (hoverRating || rating) ? GOLD : "hsl(220,38%,28%)",
                        }} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label style={labelStyle}>Your Name *</label>
                    <input value={name} onChange={(e) => setName(e.target.value)}
                      onFocus={() => setFocused("name")} onBlur={() => setFocused("")}
                      placeholder="Your full name" required
                      style={focusStyle("name")} />
                  </div>
                  <div>
                    <label style={labelStyle}>Title (optional)</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)}
                      onFocus={() => setFocused("title")} onBlur={() => setFocused("")}
                      placeholder="e.g. Teacher, Lusaka"
                      style={focusStyle("title")} />
                  </div>
                </div>

                {/* Edition selector */}
                <div>
                  <label style={labelStyle}>Edition (optional)</label>
                  <div className="flex gap-2.5 mt-1">
                    {(["", "paperback", "hardcover"] as const).map((v) => (
                      <button key={v} type="button" onClick={() => setProductType(v)}
                        className="px-4 py-2 rounded-sm font-sans text-[0.68rem] tracking-[0.1em] uppercase font-semibold transition-all"
                        style={{
                          border: `1px solid ${productType === v ? GOLD : CARD_BORDER}`,
                          background: productType === v ? "hsl(42,78%,46%,0.1)" : "transparent",
                          color: productType === v ? GOLD : TEXT_DIM,
                        }}>
                        {v === "" ? "Not specified" : v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review textarea */}
                <div>
                  <label style={labelStyle}>Your Review *</label>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                    onFocus={() => setFocused("comment")} onBlur={() => setFocused("")}
                    required minLength={10}
                    placeholder="Share your thoughts about the book…"
                    rows={5}
                    style={{ ...focusStyle("comment"), resize: "none" }}
                  />
                </div>

                {createReview.isError && (
                  <p className="text-[0.75rem]" style={{ color: "hsl(0,70%,58%)" }}>Something went wrong. Please try again.</p>
                )}

                <motion.div whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }} className="inline-block">
                  <Button type="submit" disabled={createReview.isPending || !name || !comment}
                    className="uppercase"
                    style={{ height: "3rem", padding: "0 2.5rem",
                      background: GOLD, color: "#fff", fontWeight: 700, boxShadow: "0 4px 20px rgba(141,107,61,0.25)",
                      opacity: (createReview.isPending || !name || !comment) ? 0.55 : 1 }}>
                    {createReview.isPending ? "Submitting…" : "Submit Review"}
                  </Button>
                </motion.div>

              </form>
            </motion.div>
          )}
        </div>
      </section>

    </div>
  );
}
