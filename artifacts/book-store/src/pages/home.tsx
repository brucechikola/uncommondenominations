import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useListProducts, useListReviews } from "@workspace/api-client-react";
import { useCartStore } from "@/lib/store";
import { Star, ShieldCheck, Truck, BookOpen, Award, Quote } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } }),
};

export default function Home() {
  const { data: products } = useListProducts();
  const { data: reviews } = useListReviews();
  const setProductType = useCartStore((s) => s.setProductType);

  const paperback = products?.find((p) => p.type === "paperback");
  const hardcover = products?.find((p) => p.type === "hardcover");
  const topReviews = reviews?.slice(0, 3) ?? [];

  const reasons = [
    { title: "Rooted in African Wisdom", desc: "Drawing on centuries of indigenous philosophy and lived Zambian experience, Dr. Zulu offers insights no Western self-help book can replicate." },
    { title: "Backed by Research", desc: "Every principle in this book is grounded in contemporary psychological research, bridging the gap between ancient wisdom and modern science." },
    { title: "Immediately Actionable", desc: "Practical exercises end every chapter. You won't just feel inspired — you'll have a clear path forward from the very first read." },
    { title: "Written for Our Time", desc: "Addressing the pressures of modern African life — career, family, purpose, identity — with honesty and grace." },
  ];

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-[hsl(39,36%,91%)] via-[hsl(39,36%,95%)] to-[hsl(32,60%,92%)]">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="container mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
            <motion.div custom={0} variants={fadeUp}>
              <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 font-medium px-4 py-1.5 text-sm">
                Now Available in Zambia
              </Badge>
            </motion.div>
            <motion.h1 custom={1} variants={fadeUp} className="font-serif text-5xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-foreground mb-6">
              The<br />
              <span className="text-primary">Luminous</span><br />
              Path
            </motion.h1>
            <motion.p custom={2} variants={fadeUp} className="text-lg text-muted-foreground leading-relaxed mb-4 max-w-lg">
              A transformative guide to purposeful living by Dr. Amara Zulu — drawing on African wisdom, modern psychology, and a life lived with extraordinary intention.
            </motion.p>
            <motion.p custom={3} variants={fadeUp} className="text-sm text-muted-foreground mb-10 italic">
              "The book Zambia has been waiting for." — Chanda Mwale, Lusaka
            </motion.p>
            <motion.div custom={4} variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
              <Link href="/shop">
                <Button size="lg" className="font-serif text-base px-8 py-6 shadow-lg hover:shadow-xl transition-shadow" onClick={() => setProductType("paperback")}>
                  Buy Paperback — K400
                </Button>
              </Link>
              <Link href="/shop">
                <Button size="lg" variant="outline" className="font-serif text-base px-8 py-6 border-2" onClick={() => setProductType("hardcover")}>
                  Buy Hardcover — K500
                </Button>
              </Link>
            </motion.div>
            <motion.div custom={5} variants={fadeUp} className="flex items-center gap-8 mt-10 pt-10 border-t border-border/60">
              <div className="text-center"><div className="font-serif text-2xl font-bold text-primary">6+</div><div className="text-xs text-muted-foreground">Cities shipping</div></div>
              <div className="text-center"><div className="font-serif text-2xl font-bold text-primary">256</div><div className="text-xs text-muted-foreground">Pages</div></div>
              <div className="text-center"><div className="font-serif text-2xl font-bold text-primary">★ 5.0</div><div className="text-xs text-muted-foreground">Avg. rating</div></div>
            </motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.8 }} className="relative flex justify-center">
            <div className="relative w-64 lg:w-80">
              <div className="absolute -inset-4 bg-primary/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-[hsl(32,80%,40%)] to-[hsl(32,60%,25%)] rounded-xl aspect-[2/3] shadow-2xl flex flex-col items-center justify-center p-8 text-white">
                <div className="w-full h-px bg-white/20 mb-6" />
                <p className="text-xs tracking-[0.3em] uppercase font-medium text-white/60 mb-4">Dr. Amara Zulu</p>
                <h2 className="font-serif text-3xl font-bold text-center leading-tight mb-2">The<br />Luminous<br />Path</h2>
                <div className="w-12 h-px bg-white/40 my-6" />
                <p className="text-xs text-white/50 text-center leading-relaxed">A Guide to Purposeful<br />Living</p>
                <div className="w-full h-px bg-white/20 mt-6" />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground rounded-lg px-4 py-3 shadow-lg">
                <p className="text-xs font-medium">Delivered across</p>
                <p className="font-serif text-sm font-bold">All Zambia</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-y border-border bg-card py-6">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { icon: ShieldCheck, label: "Secure Payment" },
              { icon: Truck, label: "Nationwide Delivery" },
              { icon: BookOpen, label: "Genuine First Edition" },
              { icon: Award, label: "Recommended by Educators" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="h-4 w-4 text-primary" />
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About the Book */}
      <section className="py-24 container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <p className="text-xs tracking-[0.3em] uppercase text-primary font-medium mb-4">The Book</p>
            <h2 className="font-serif text-4xl font-bold mb-6 leading-tight">A Book That Demands to Be Read More Than Once</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The Luminous Path is not a quick-fix guide. It is a serious, sustained conversation about what it means to live well — grounded in African philosophy, enriched by global psychological research, and written with the warmth of someone who genuinely wants you to succeed.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Each of the book's eight chapters addresses a core dimension of purposeful life: identity, resilience, relationships, vocation, wealth, community, health, and legacy. Together they form a complete framework — one you will return to again and again.
            </p>
            <Link href="/about-book">
              <Button variant="outline" className="font-serif">Read more about the book</Button>
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="grid grid-cols-2 gap-4">
            {reasons.map((r, i) => (
              <div key={i} className="bg-card border border-card-border rounded-xl p-5 hover:shadow-md transition-shadow">
                <h3 className="font-serif font-semibold mb-2 text-sm">{r.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Products */}
      <section className="py-24 bg-secondary/5">
        <div className="container mx-auto px-6 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-primary font-medium mb-4">Choose Your Edition</p>
          <h2 className="font-serif text-4xl font-bold mb-4">Own Your Copy Today</h2>
          <p className="text-muted-foreground mb-16 max-w-xl mx-auto">
            Both editions contain the full text. Choose the format that fits your lifestyle.
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {paperback && (
              <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card border border-card-border rounded-2xl p-8 text-left hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="text-xs tracking-widest uppercase text-muted-foreground mb-4">Paperback</div>
                <div className="font-serif text-5xl font-bold text-primary mb-2">K{paperback.priceKwacha}</div>
                <p className="text-sm text-muted-foreground mb-6">{paperback.description.substring(0, 100)}…</p>
                <ul className="space-y-2 mb-8">
                  {(paperback.features as string[]).map((f: string) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-0.5">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link href="/shop">
                  <Button className="w-full font-serif" onClick={() => setProductType("paperback")}>Buy Paperback</Button>
                </Link>
              </motion.div>
            )}
            {hardcover && (
              <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-primary rounded-2xl p-8 text-left text-primary-foreground hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden">
                <div className="absolute top-4 right-4"><Badge className="bg-white/20 text-white border-0 text-xs">Premium</Badge></div>
                <div className="text-xs tracking-widest uppercase text-primary-foreground/70 mb-4">Hardcover</div>
                <div className="font-serif text-5xl font-bold mb-2">K{hardcover.priceKwacha}</div>
                <p className="text-sm text-primary-foreground/80 mb-6">{hardcover.description.substring(0, 100)}…</p>
                <ul className="space-y-2 mb-8">
                  {(hardcover.features as string[]).map((f: string) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-primary-foreground/80">
                      <span className="text-white mt-0.5">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link href="/shop">
                  <Button variant="secondary" className="w-full font-serif" onClick={() => setProductType("hardcover")}>Buy Hardcover</Button>
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* About the Author */}
      <section className="py-24 container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="flex justify-center">
            <div className="relative">
              <div className="w-64 h-64 lg:w-80 lg:h-80 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shadow-xl">
                <div className="text-center p-8">
                  <div className="font-serif text-6xl font-bold text-primary mb-2">AZ</div>
                  <div className="text-muted-foreground text-sm">Dr. Amara Zulu</div>
                </div>
              </div>
              <div className="absolute -bottom-3 -right-3 bg-card border border-card-border rounded-xl px-5 py-3 shadow-lg">
                <p className="font-serif text-sm font-bold">PhD Psychology</p>
                <p className="text-xs text-muted-foreground">University of Zambia</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <p className="text-xs tracking-[0.3em] uppercase text-primary font-medium mb-4">The Author</p>
            <h2 className="font-serif text-4xl font-bold mb-6 leading-tight">Dr. Amara Zulu</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Dr. Amara Zulu is a psychologist, educator, and community leader based in Lusaka, Zambia. With over two decades of work in human development and organizational psychology, she has dedicated her career to helping individuals and institutions unlock their fullest potential.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              The Luminous Path is her first book — and it draws on everything she has learned: from the villages of the Copperbelt where she grew up, to the research halls of the University of Zambia, to the boardrooms and community centers where she has worked for twenty years.
            </p>
            <Link href="/about-author">
              <Button variant="outline" className="font-serif">Read Dr. Zulu's full story</Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      {topReviews.length > 0 && (
        <section className="py-24 bg-secondary text-secondary-foreground">
          <div className="container mx-auto px-6">
            <p className="text-xs tracking-[0.3em] uppercase text-secondary-foreground/50 font-medium mb-4 text-center">What Readers Say</p>
            <h2 className="font-serif text-4xl font-bold text-center mb-16">Real Reviews from Real Readers</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {topReviews.map((review) => (
                <motion.div key={review.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-secondary-foreground/5 rounded-2xl p-8 border border-secondary-foreground/10">
                  <Quote className="h-6 w-6 text-primary mb-4" />
                  <p className="text-secondary-foreground/80 leading-relaxed mb-6 italic text-sm">"{review.comment}"</p>
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: review.rating }).map((_, i) => <Star key={i} className="h-3 w-3 fill-primary text-primary" />)}
                  </div>
                  <p className="font-serif font-semibold text-sm">{review.reviewerName}</p>
                  {review.reviewerTitle && <p className="text-xs text-secondary-foreground/50">{review.reviewerTitle}</p>}
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href="/reviews">
                <Button variant="outline" className="border-secondary-foreground/20 text-secondary-foreground hover:bg-secondary-foreground/10 font-serif">
                  Read all reviews
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Delivery */}
      <section className="py-24 container mx-auto px-6 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-primary font-medium mb-4">Delivery</p>
        <h2 className="font-serif text-4xl font-bold mb-6">Delivered to Your Door</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
          We ship nationwide across Zambia. After your purchase, our team will contact you to arrange delivery to your city. Payment is simple — use any mobile money network or card.
        </p>
        <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto mb-12">
          {[
            { step: "01", title: "Order Online", desc: "Choose your edition and complete the checkout form with your delivery details." },
            { step: "02", title: "Pay Securely", desc: "Pay via Airtel Money, MTN, Zamtel, Visa/Mastercard, or bank transfer." },
            { step: "03", title: "Receive Your Book", desc: "We arrange delivery to your city. Most orders arrive within 2–5 business days." },
          ].map((s) => (
            <div key={s.step} className="text-left">
              <div className="font-serif text-5xl font-bold text-primary/20 mb-3">{s.step}</div>
              <h3 className="font-serif font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <Link href="/shop">
          <Button size="lg" className="font-serif px-10 py-6">Order Your Copy Now</Button>
        </Link>
      </section>
    </div>
  );
}
