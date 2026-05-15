import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useListReviews, useCreateReview } from "@workspace/api-client-react";
import { getListReviewsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";

export default function Reviews() {
  const queryClient = useQueryClient();
  const { data: reviews, isLoading } = useListReviews();
  const createReview = useCreateReview();

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [productType, setProductType] = useState<"paperback" | "hardcover" | "">("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createReview.mutateAsync({
        data: { reviewerName: name, reviewerTitle: title || null, rating, comment, productType: productType || null },
      });
      await queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey() });
      setSubmitted(true);
      setShowForm(false);
    } catch { /* handle */ }
  };

  const avgRating = reviews?.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : "0";

  return (
    <div className="overflow-x-hidden">
      <section className="py-16 bg-gradient-to-b from-muted/60 to-background">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-primary font-medium mb-4">Reviews</p>
          <h1 className="font-serif text-5xl font-bold mb-4">What Readers Say</h1>
          {reviews && reviews.length > 0 && (
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex gap-1">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-5 w-5 ${i < Math.round(Number(avgRating)) ? "fill-primary text-primary" : "text-muted"}`} />)}</div>
              <span className="font-serif text-2xl font-bold text-primary">{avgRating}</span>
              <span className="text-muted-foreground text-sm">/ 5 from {reviews.length} reviews</span>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 container mx-auto px-6 max-w-4xl">
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">Loading reviews…</div>
        ) : reviews && reviews.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {reviews.map((review, i) => (
              <motion.div key={review.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className="bg-card border border-card-border rounded-2xl p-6">
                <Quote className="h-6 w-6 text-primary/30 mb-4" />
                <p className="text-muted-foreground leading-relaxed mb-4 italic text-sm">"{review.comment}"</p>
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "fill-primary text-primary" : "text-muted"}`} />
                  ))}
                </div>
                <p className="font-serif font-semibold text-sm">{review.reviewerName}</p>
                {review.reviewerTitle && <p className="text-xs text-muted-foreground">{review.reviewerTitle}</p>}
                {review.productType && <p className="text-xs text-primary/60 mt-1 capitalize">{review.productType} edition</p>}
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">No reviews yet — be the first!</p>
        )}

        {/* Submit review */}
        <div className="border-t border-border pt-12">
          {submitted ? (
            <div className="text-center py-8">
              <p className="text-green-600 font-medium font-serif text-xl mb-2">Thank you for your review!</p>
              <p className="text-muted-foreground text-sm">Your review will be published after approval.</p>
            </div>
          ) : !showForm ? (
            <div className="text-center">
              <h2 className="font-serif text-2xl font-bold mb-3">Share Your Experience</h2>
              <p className="text-muted-foreground mb-6">Have you read The Luminous Path? Tell others what you thought.</p>
              <Button onClick={() => setShowForm(true)} className="font-serif">Write a Review</Button>
            </div>
          ) : (
            <motion.form initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit}
              className="max-w-xl mx-auto space-y-5">
              <h2 className="font-serif text-2xl font-bold mb-6">Write a Review</h2>

              <div className="space-y-2">
                <Label>Your Rating *</Label>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button key={i} type="button" onClick={() => setRating(i + 1)}
                      onMouseEnter={() => setHoverRating(i + 1)} onMouseLeave={() => setHoverRating(0)}>
                      <Star className={`h-7 w-7 transition-colors ${i < (hoverRating || rating) ? "fill-primary text-primary" : "text-muted"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Your Name *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required />
                </div>
                <div className="space-y-2">
                  <Label>Your Title (optional)</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Teacher, Lusaka" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Edition</Label>
                <div className="flex gap-3">
                  {["", "paperback", "hardcover"].map((v) => (
                    <button key={v} type="button" onClick={() => setProductType(v as "" | "paperback" | "hardcover")}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${productType === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                      {v === "" ? "Not specified" : v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Your Review *</Label>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} required minLength={10}
                  placeholder="Share your thoughts about the book…"
                  className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="font-serif" disabled={createReview.isPending || !name || !comment}>
                  {createReview.isPending ? "Submitting…" : "Submit Review"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </motion.form>
          )}
        </div>
      </section>
    </div>
  );
}
