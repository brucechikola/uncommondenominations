import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useListProducts, useListReviews } from "@workspace/api-client-react";
import { useCartStore } from "@/lib/store";
import { Star, ShieldCheck, Truck, BookOpen, Award, ChevronDown } from "lucide-react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  type Variants,
} from "framer-motion";
import { useRef } from "react";

/* ── animation helpers ───────────────────────────────────────── */
const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};
const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8 } },
};

function RevealSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── BookCover ───────────────────────────────────────────────── */
function BookCover() {
  return (
    <div className="relative w-52 lg:w-60 mx-auto book-float" style={{ perspective: "800px" }}>
      {/* Glow */}
      <div className="absolute -inset-6 bg-primary/15 blur-3xl rounded-full pointer-events-none" />
      {/* Book body */}
      <div
        className="relative rounded-sm overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.7)] aspect-[2/3]"
        style={{ background: "linear-gradient(135deg, hsl(222,52%,14%) 0%, hsl(218,58%,10%) 60%, hsl(220,52%,8%) 100%)" }}
      >
        {/* Spine glow left edge */}
        <div className="absolute left-0 inset-y-0 w-[3px]" style={{ background: "linear-gradient(180deg, hsl(42,80%,52%), hsl(42,80%,40%), hsl(42,80%,52%))" }} />

        {/* Top gold line */}
        <div className="absolute top-8 inset-x-6 h-px bg-primary/50" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center gap-3">
          <p className="font-display text-[0.6rem] tracking-[0.35em] uppercase text-primary/80 font-medium">
            Dr. Amara Zulu
          </p>
          <div className="w-6 h-px bg-primary/40" />
          <h2
            className="font-display font-bold leading-tight text-white"
            style={{ fontSize: "clamp(1.15rem, 3.5vw, 1.6rem)", letterSpacing: "0.08em" }}
          >
            THE<br />LUMINOUS<br />PATH
          </h2>
          <div className="w-6 h-px bg-primary/40" />
          <p className="font-serif text-[0.6rem] text-white/40 italic tracking-wide">
            A Guide to Purposeful Living
          </p>
        </div>

        {/* Bottom gold band */}
        <div
          className="absolute bottom-0 inset-x-0 h-[18%] flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, hsl(42,75%,38%), hsl(44,82%,52%), hsl(42,75%,38%))" }}
        >
          <p className="font-display text-[0.55rem] tracking-[0.3em] uppercase text-[hsl(220,52%,8%)] font-bold">
            Amara Zulu
          </p>
        </div>

        {/* Bottom gold line */}
        <div className="absolute bottom-[18%] inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(42,80%,65%), transparent)" }} />
      </div>

      {/* Shadow beneath book */}
      <div className="mt-4 mx-6 h-2 bg-black/30 blur-md rounded-full" />

      {/* "Delivered" badge */}
      <motion.div
        initial={{ opacity: 0, x: 20, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 1.1, duration: 0.6 }}
        className="absolute -bottom-3 -right-4 bg-primary text-primary-foreground rounded-sm px-3.5 py-2.5 shadow-lg shadow-primary/30"
      >
        <p className="font-sans text-[0.6rem] font-medium opacity-80">Delivered across</p>
        <p className="font-display text-xs font-bold tracking-widest uppercase">All Zambia</p>
      </motion.div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────── */
export default function Home() {
  const { data: products } = useListProducts();
  const { data: reviews } = useListReviews();
  const setProductType = useCartStore((s) => s.setProductType);

  const paperback = products?.find((p) => p.type === "paperback");
  const hardcover = products?.find((p) => p.type === "hardcover");
  const topReviews = reviews?.slice(0, 3) ?? [];

  /* Parallax */
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const bookY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);
  const opacity = useTransform(scrollYProgress, [0.6, 1], [1, 0]);

  const reasons = [
    { title: "African Wisdom", desc: "Rooted in centuries of indigenous philosophy and lived Zambian experience." },
    { title: "Research-Backed", desc: "Every principle bridging ancient wisdom with contemporary psychological science." },
    { title: "Actionable", desc: "Practical exercises end every chapter — a clear path forward from page one." },
    { title: "Written for Now", desc: "Addressing modern African life — career, family, purpose, identity — with honesty." },
  ];

  return (
    <div className="overflow-x-hidden bg-background">

      {/* ═══════════ HERO ═══════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden noise-overlay" style={{ position: "relative" }}>
        {/* Parallax background layer */}
        <motion.div
          style={{ y: bgY }}
          className="absolute inset-0 pointer-events-none"
        >
          {/* Radial glow centre-right */}
          <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] rounded-full"
            style={{ background: "radial-gradient(circle, hsl(42,80%,52%,0.07) 0%, transparent 70%)" }} />
          {/* Top left accent */}
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full"
            style={{ background: "radial-gradient(circle, hsl(220,60%,30%,0.4) 0%, transparent 70%)" }} />
          {/* Grid pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
                <path d="M 64 0 L 0 0 0 64" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </motion.div>

        <div className="relative z-10 container mx-auto px-6 pt-24 pb-20 grid lg:grid-cols-[1fr_auto] gap-12 lg:gap-16 items-center min-h-screen">
          {/* Text column */}
          <motion.div style={{ y: textY, opacity }} initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 text-[0.65rem] font-sans font-medium tracking-[0.3em] uppercase text-primary mb-8 border border-primary/30 rounded-sm px-4 py-1.5 bg-primary/5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Now Available in Zambia
              </span>
            </motion.div>

            <motion.div variants={fadeUp} className="mb-6">
              <h1 className="font-display font-bold leading-[0.88] tracking-wide">
                <span className="block text-[clamp(3rem,7vw,5.5rem)] text-foreground/90">THE</span>
                <span
                  className="block text-[clamp(3rem,7vw,5.5rem)] gold-shimmer"
                  style={{ WebkitTextFillColor: "transparent" }}
                >
                  LUMINOUS
                </span>
                <span className="block text-[clamp(3rem,7vw,5.5rem)] text-foreground/90">PATH</span>
              </h1>
            </motion.div>

            <motion.div variants={fadeUp} className="gold-line w-20 mb-6" />

            <motion.p variants={fadeUp} className="font-serif text-lg text-foreground/60 leading-relaxed mb-3 max-w-md italic">
              by Dr. Amara Zulu
            </motion.p>
            <motion.p variants={fadeUp} className="font-sans text-[0.9rem] text-muted-foreground leading-relaxed mb-10 max-w-md">
              A transformative guide to purposeful living — drawing on African wisdom, modern psychology, and a life lived with extraordinary intention.
            </motion.p>

            <motion.blockquote variants={fadeUp} className="border-l-2 border-primary/40 pl-4 mb-10">
              <p className="font-serif text-sm italic text-foreground/50">
                "The book Zambia has been waiting for."
              </p>
              <footer className="text-xs text-muted-foreground/50 mt-1 font-sans">— Chanda Mwale, Lusaka</footer>
            </motion.blockquote>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 mb-12">
              <Link href="/shop">
                <Button
                  size="lg"
                  onClick={() => setProductType("paperback")}
                  className="font-display text-[0.7rem] tracking-[0.15em] uppercase px-8 h-12 bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30 transition-all"
                >
                  Buy Paperback — K400
                </Button>
              </Link>
              <Link href="/shop">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setProductType("hardcover")}
                  className="font-display text-[0.7rem] tracking-[0.15em] uppercase px-8 h-12 border-foreground/20 text-foreground/70 hover:bg-foreground/5 hover:border-primary/50 hover:text-primary transition-all"
                >
                  Hardcover — K500
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="flex items-center gap-8 pt-8 border-t border-white/8">
              {[
                { val: "6+", label: "Cities" },
                { val: "256", label: "Pages" },
                { val: "★ 5.0", label: "Rating" },
              ].map(({ val, label }) => (
                <div key={label} className="text-center">
                  <div className="font-display text-xl font-bold text-primary">{val}</div>
                  <div className="font-sans text-[0.65rem] tracking-[0.15em] uppercase text-muted-foreground mt-0.5">{label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Book column */}
          <motion.div style={{ y: bookY }} className="flex justify-center lg:justify-center pr-0 lg:pr-8">
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}>
              <BookCover />
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="font-sans text-[0.6rem] tracking-[0.3em] uppercase text-muted-foreground/40">Scroll</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <ChevronDown className="h-4 w-4 text-primary/40" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════ TRUST BAR ═══════════ */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-5 border-y border-white/6"
        style={{ background: "hsl(220,52%,6%)" }}
      >
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-10 md:gap-20">
            {[
              { icon: ShieldCheck, label: "Secure Payment" },
              { icon: Truck, label: "Nationwide Delivery" },
              { icon: BookOpen, label: "Genuine First Edition" },
              { icon: Award, label: "Educator Recommended" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 text-xs text-muted-foreground/60 font-sans tracking-wide">
                <Icon className="h-3.5 w-3.5 text-primary/70" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ═══════════ ABOUT THE BOOK ═══════════ */}
      <section className="py-28 container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <RevealSection>
            <motion.p variants={fadeUp} className="font-sans text-[0.65rem] tracking-[0.35em] uppercase text-primary mb-5">
              The Book
            </motion.p>
            <motion.h2 variants={fadeUp} className="font-display text-4xl lg:text-5xl font-bold leading-tight text-foreground mb-6">
              A Book That Demands to Be<br />
              <span className="gold-shimmer" style={{ WebkitTextFillColor: "transparent" }}>Read More Than Once</span>
            </motion.h2>
            <motion.div variants={fadeUp} className="gold-line w-16 mb-8" />
            <motion.p variants={fadeUp} className="font-serif text-base text-muted-foreground leading-relaxed mb-5">
              The Luminous Path is not a quick-fix guide. It is a serious, sustained conversation about what it means to live well — grounded in African philosophy, enriched by global psychological research, and written with the warmth of someone who genuinely wants you to succeed.
            </motion.p>
            <motion.p variants={fadeUp} className="font-serif text-base text-muted-foreground leading-relaxed mb-10">
              Eight chapters. Eight dimensions of a purposeful life: identity, resilience, relationships, vocation, wealth, community, health, and legacy. Together they form a complete framework you will return to again and again.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link href="/about-book">
                <Button variant="outline" className="font-display text-[0.7rem] tracking-[0.15em] uppercase border-foreground/20 text-foreground/60 hover:border-primary/50 hover:text-primary transition-colors h-10 px-6">
                  Learn More
                </Button>
              </Link>
            </motion.div>
          </RevealSection>

          <RevealSection className="grid grid-cols-2 gap-4">
            {reasons.map((r, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="rounded-sm border border-white/8 p-6 bg-card/50 hover:border-primary/30 hover:bg-card transition-all group"
              >
                <div className="w-6 h-px bg-primary/50 mb-4 group-hover:w-10 transition-all duration-300" />
                <h3 className="font-display text-xs font-bold tracking-wider uppercase text-foreground/80 mb-2">{r.title}</h3>
                <p className="font-sans text-xs text-muted-foreground leading-relaxed">{r.desc}</p>
              </motion.div>
            ))}
          </RevealSection>
        </div>
      </section>

      {/* ═══════════ EDITIONS ═══════════ */}
      <section className="py-28" style={{ background: "hsl(220,52%,6%)" }}>
        <div className="container mx-auto px-6">
          <RevealSection className="text-center mb-16">
            <motion.p variants={fadeUp} className="font-sans text-[0.65rem] tracking-[0.35em] uppercase text-primary mb-4">
              Choose Your Edition
            </motion.p>
            <motion.h2 variants={fadeUp} className="font-display text-4xl lg:text-5xl font-bold text-foreground">
              Own Your Copy Today
            </motion.h2>
            <motion.p variants={fadeUp} className="font-serif text-base text-muted-foreground mt-4 max-w-md mx-auto">
              Both editions contain the full text. Choose the format that fits your life.
            </motion.p>
          </RevealSection>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {paperback && (
              <RevealSection>
                <motion.div
                  variants={fadeUp}
                  whileHover={{ y: -6 }}
                  className="rounded-sm border border-white/10 p-8 bg-card hover:border-primary/20 transition-all group"
                >
                  <div className="text-[0.6rem] tracking-[0.3em] uppercase text-muted-foreground mb-4 font-sans">Paperback</div>
                  <div className="font-display text-5xl font-bold text-primary mb-2">K{paperback.priceKwacha}</div>
                  <p className="font-serif text-sm text-muted-foreground mb-6 leading-relaxed">{paperback.description.substring(0, 110)}…</p>
                  <ul className="space-y-2.5 mb-8">
                    {(paperback.features as string[]).map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground font-sans">
                        <span className="text-primary mt-0.5 text-[0.7rem]">✦</span>{f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/shop">
                    <Button onClick={() => setProductType("paperback")} className="w-full font-display text-[0.65rem] tracking-[0.15em] uppercase h-11 bg-foreground/5 border border-foreground/15 text-foreground/70 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                      Buy Paperback
                    </Button>
                  </Link>
                </motion.div>
              </RevealSection>
            )}
            {hardcover && (
              <RevealSection>
                <motion.div
                  variants={fadeUp}
                  whileHover={{ y: -6 }}
                  className="rounded-sm p-8 relative overflow-hidden"
                  style={{ background: "linear-gradient(135deg, hsl(222,52%,14%), hsl(218,58%,10%))", border: "1px solid hsl(42,80%,52%,0.3)" }}
                >
                  <div className="absolute top-4 right-4">
                    <span className="font-display text-[0.55rem] tracking-[0.2em] uppercase text-primary/70 border border-primary/25 rounded-sm px-2.5 py-1">Premium</span>
                  </div>
                  <div className="text-[0.6rem] tracking-[0.3em] uppercase text-primary/50 mb-4 font-sans">Hardcover</div>
                  <div className="font-display text-5xl font-bold text-primary mb-2">K{hardcover.priceKwacha}</div>
                  <p className="font-serif text-sm text-foreground/50 mb-6 leading-relaxed">{hardcover.description.substring(0, 110)}…</p>
                  <ul className="space-y-2.5 mb-8">
                    {(hardcover.features as string[]).map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/60 font-sans">
                        <span className="text-primary mt-0.5 text-[0.7rem]">✦</span>{f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/shop">
                    <Button onClick={() => setProductType("hardcover")} className="w-full font-display text-[0.65rem] tracking-[0.15em] uppercase h-11 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
                      Buy Hardcover
                    </Button>
                  </Link>
                </motion.div>
              </RevealSection>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════ AUTHOR ═══════════ */}
      <section className="py-28 container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <RevealSection className="flex justify-center order-2 lg:order-1">
            <motion.div variants={fadeIn} className="relative">
              <div
                className="w-64 h-64 lg:w-80 lg:h-80 rounded-sm flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, hsl(222,52%,14%), hsl(218,58%,10%))", border: "1px solid hsl(42,80%,52%,0.2)" }}
              >
                <div className="text-center">
                  <div className="font-display text-7xl font-bold text-primary mb-1" style={{ WebkitTextFillColor: "transparent", background: "linear-gradient(135deg, hsl(42,80%,42%), hsl(44,82%,62%))", WebkitBackgroundClip: "text" }}>AZ</div>
                  <div className="font-sans text-[0.6rem] tracking-[0.3em] uppercase text-muted-foreground">Dr. Amara Zulu</div>
                </div>
                <div className="absolute inset-0 rounded-sm" style={{ boxShadow: "inset 0 0 40px hsl(42,80%,52%,0.05)" }} />
              </div>
              {/* Credential card */}
              <motion.div
                variants={fadeUp}
                className="absolute -bottom-4 -right-4 rounded-sm px-5 py-3 shadow-xl"
                style={{ background: "hsl(220,52%,6%)", border: "1px solid hsl(42,80%,52%,0.25)" }}
              >
                <p className="font-display text-xs font-bold tracking-wider">PhD Psychology</p>
                <p className="font-sans text-[0.65rem] text-muted-foreground mt-0.5">University of Zambia</p>
              </motion.div>
            </motion.div>
          </RevealSection>

          <RevealSection className="order-1 lg:order-2">
            <motion.p variants={fadeUp} className="font-sans text-[0.65rem] tracking-[0.35em] uppercase text-primary mb-5">The Author</motion.p>
            <motion.h2 variants={fadeUp} className="font-display text-4xl lg:text-5xl font-bold mb-4">Dr. Amara Zulu</motion.h2>
            <motion.div variants={fadeUp} className="gold-line w-16 mb-8" />
            <motion.p variants={fadeUp} className="font-serif text-base text-muted-foreground leading-relaxed mb-5">
              Psychologist, educator, and community leader based in Lusaka, Zambia. With over two decades of work in human development and organizational psychology, she has dedicated her career to helping individuals and institutions unlock their fullest potential.
            </motion.p>
            <motion.p variants={fadeUp} className="font-serif text-base text-muted-foreground leading-relaxed mb-10">
              The Luminous Path draws on everything she has learned: from the villages of the Copperbelt where she grew up, to the research halls of UNZA, to the boardrooms and community centres where she has worked for twenty years.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link href="/about-author">
                <Button variant="outline" className="font-display text-[0.7rem] tracking-[0.15em] uppercase border-foreground/20 text-foreground/60 hover:border-primary/50 hover:text-primary transition-colors h-10 px-6">
                  Full Biography
                </Button>
              </Link>
            </motion.div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════ REVIEWS ═══════════ */}
      {topReviews.length > 0 && (
        <section className="py-28 relative overflow-hidden" style={{ background: "hsl(220,52%,6%)" }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(42,80%,52%,0.15), transparent)" }} />
          </div>
          <div className="container mx-auto px-6">
            <RevealSection className="text-center mb-16">
              <motion.p variants={fadeUp} className="font-sans text-[0.65rem] tracking-[0.35em] uppercase text-primary mb-4">Reader Reviews</motion.p>
              <motion.h2 variants={fadeUp} className="font-display text-4xl lg:text-5xl font-bold text-foreground">
                What Readers Are Saying
              </motion.h2>
            </RevealSection>

            <div className="grid md:grid-cols-3 gap-6">
              {topReviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-sm border border-white/8 p-7 bg-card/30 hover:border-primary/20 transition-all"
                >
                  <div className="font-display text-5xl text-primary/15 leading-none mb-3 select-none">"</div>
                  <p className="font-serif text-sm text-foreground/60 leading-relaxed italic mb-6">
                    "{review.comment}"
                  </p>
                  <div className="flex items-center gap-0.5 mb-3">
                    {Array.from({ length: review.rating }).map((_, j) => (
                      <Star key={j} className="h-3 w-3 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="font-display text-xs font-bold tracking-wide text-foreground/70">{review.reviewerName}</p>
                  {review.reviewerTitle && (
                    <p className="font-sans text-[0.65rem] text-muted-foreground mt-0.5">{review.reviewerTitle}</p>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/reviews">
                <Button variant="outline" className="font-display text-[0.65rem] tracking-[0.15em] uppercase border-white/15 text-foreground/50 hover:border-primary/40 hover:text-primary transition-all h-10 px-8">
                  Read All Reviews
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="py-28 container mx-auto px-6">
        <RevealSection className="text-center mb-20">
          <motion.p variants={fadeUp} className="font-sans text-[0.65rem] tracking-[0.35em] uppercase text-primary mb-4">Simple Process</motion.p>
          <motion.h2 variants={fadeUp} className="font-display text-4xl lg:text-5xl font-bold">Delivered to Your Door</motion.h2>
          <motion.p variants={fadeUp} className="font-serif text-base text-muted-foreground mt-4 max-w-md mx-auto">
            We ship nationwide across Zambia. Payment via mobile money, card, or bank transfer.
          </motion.p>
        </RevealSection>

        <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto mb-16">
          {[
            { step: "01", title: "Order Online", desc: "Choose your edition and complete the checkout form with your delivery details." },
            { step: "02", title: "Pay Securely", desc: "Airtel Money, MTN, Zamtel, Visa/Mastercard, or direct bank transfer." },
            { step: "03", title: "Receive Your Book", desc: "We arrange delivery to your city. Most orders arrive within 2–5 business days." },
          ].map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6 }}
              className="text-left relative pl-5 border-l border-primary/20"
            >
              <div className="font-display text-6xl font-bold text-primary/8 mb-3 leading-none">{s.step}</div>
              <h3 className="font-display text-sm font-bold tracking-wider uppercase text-foreground/80 mb-2">{s.title}</h3>
              <p className="font-sans text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/shop">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                className="font-display text-[0.7rem] tracking-[0.2em] uppercase px-12 h-13 bg-primary text-primary-foreground shadow-2xl shadow-primary/25 hover:bg-primary/90 transition-all"
              >
                Order Your Copy Now
              </Button>
            </motion.div>
          </Link>
        </div>
      </section>
    </div>
  );
}
