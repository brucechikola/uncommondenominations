import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useListProducts, useListReviews } from "@workspace/api-client-react";
import { useCartStore } from "@/lib/store";
import { Star, ShieldCheck, Truck, BookOpen, Award, ChevronDown } from "lucide-react";
import { motion, useScroll, useTransform, useInView, type Variants } from "framer-motion";
import { useRef } from "react";

/* ── animation helpers ───────────────────────────────────────── */
const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};
const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.7 } },
};

function RevealSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} variants={stagger} className={className}>
      {children}
    </motion.div>
  );
}

/* ── Book Cover ──────────────────────────────────────────────── */
function BookCover() {
  return (
    <div className="relative mx-auto w-fit book-float">
      {/* Cream pedestal/glow behind book */}
      <div
        className="absolute -inset-6 rounded-2xl"
        style={{
          background: "radial-gradient(ellipse at center, rgba(245,238,220,0.55) 0%, rgba(245,238,220,0.15) 60%, transparent 100%)",
          filter: "blur(8px)",
        }}
      />
      {/* Gold ambient glow */}
      <div
        className="absolute -inset-8 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, hsl(42,80%,52%,0.12) 0%, transparent 70%)" }}
      />

      {/* The actual book */}
      <div
        className="relative shadow-[0_40px_80px_rgba(0,0,0,0.5),0_8px_24px_rgba(0,0,0,0.3)] rounded-sm overflow-hidden"
        style={{
          width: "clamp(160px, 18vw, 220px)",
          aspectRatio: "2/3",
          background: "linear-gradient(160deg, hsl(222,58%,16%) 0%, hsl(218,60%,11%) 55%, hsl(220,52%,9%) 100%)",
        }}
      >
        {/* Spine strip */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[4px]"
          style={{ background: "linear-gradient(180deg, hsl(42,85%,58%), hsl(42,80%,42%), hsl(42,85%,58%))" }}
        />
        {/* Top line */}
        <div className="absolute top-7 left-5 right-5 h-px bg-white/20" />
        {/* Bottom line */}
        <div className="absolute bottom-[22%] left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(42,80%,58%,0.6), transparent)" }} />

        {/* Inner content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center gap-2">
          <p className="font-display text-[0.5rem] tracking-[0.35em] uppercase font-medium" style={{ color: "hsl(42,80%,62%)" }}>
            Dr. Amara Zulu
          </p>
          <div className="w-5 h-px" style={{ background: "hsl(42,80%,52%,0.5)" }} />
          <h2
            className="font-display font-bold leading-tight text-white"
            style={{ fontSize: "clamp(0.9rem, 2.5vw, 1.25rem)", letterSpacing: "0.08em" }}
          >
            THE<br />LUMINOUS<br />PATH
          </h2>
          <div className="w-5 h-px" style={{ background: "hsl(42,80%,52%,0.5)" }} />
          <p className="font-serif italic text-white/40" style={{ fontSize: "clamp(0.5rem, 1vw, 0.6rem)" }}>
            A Guide to Purposeful Living
          </p>
        </div>

        {/* Gold bottom band */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-center"
          style={{
            height: "22%",
            background: "linear-gradient(135deg, hsl(42,72%,36%), hsl(44,82%,50%), hsl(42,72%,36%))",
          }}
        >
          <p
            className="font-display font-bold"
            style={{ fontSize: "clamp(0.5rem, 1.1vw, 0.6rem)", letterSpacing: "0.25em", color: "hsl(220,52%,10%)" }}
          >
            AMARA ZULU
          </p>
        </div>
      </div>

      {/* "All Zambia" badge */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="absolute -bottom-4 -right-5 rounded-sm px-3.5 py-2.5 shadow-xl"
        style={{
          background: "hsl(42,80%,48%)",
          color: "hsl(220,52%,10%)",
        }}
      >
        <p className="font-sans text-[0.55rem] font-semibold opacity-70 uppercase tracking-wider">Delivered across</p>
        <p className="font-display text-[0.65rem] font-bold tracking-widest uppercase">All Zambia</p>
      </motion.div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────── */
export default function Home() {
  const { data: products } = useListProducts();
  const { data: reviews } = useListReviews();
  const setProductType = useCartStore((s) => s.setProductType);

  const paperback = products?.find((p) => p.type === "paperback");
  const hardcover = products?.find((p) => p.type === "hardcover");
  const topReviews = reviews?.slice(0, 3) ?? [];

  /* Parallax refs */
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const bgY    = useTransform(scrollYProgress, [0, 1], ["0%",  "25%"]);
  const textY  = useTransform(scrollYProgress, [0, 1], ["0%",  "15%"]);
  const bookY  = useTransform(scrollYProgress, [0, 1], ["0%",   "8%"]);
  const fadeOp = useTransform(scrollYProgress, [0.55, 0.95], [1, 0]);

  const reasons = [
    { title: "African Wisdom",   desc: "Rooted in centuries of indigenous philosophy and lived Zambian experience." },
    { title: "Research-Backed",  desc: "Every principle bridging ancient wisdom with contemporary psychological science." },
    { title: "Actionable",       desc: "Practical exercises end every chapter — a clear path forward from page one." },
    { title: "Written for Now",  desc: "Addressing modern African life — career, family, purpose, identity." },
  ];

  return (
    <div className="overflow-x-hidden">

      {/* ══════════════════════════════ HERO (dark) ══ */}
      <section
        ref={heroRef}
        className="relative flex items-center overflow-hidden"
        style={{ minHeight: "100vh", background: "hsl(220,52%,10%)" }}
      >
        {/* Parallax BG glows */}
        <motion.div style={{ y: bgY }} className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/3 right-1/3 w-[700px] h-[700px] rounded-full"
            style={{ background: "radial-gradient(circle, hsl(42,80%,52%,0.06) 0%, transparent 70%)" }}
          />
          <div
            className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
            style={{ background: "radial-gradient(circle, hsl(220,60%,28%,0.5) 0%, transparent 70%)" }}
          />
          {/* Faint grid */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
                <path d="M 64 0 L 0 0 0 64" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </motion.div>

        <div className="relative z-10 w-full container mx-auto px-6 pt-20 pb-16 grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-20 items-center">
          {/* ── Text ── */}
          <motion.div style={{ y: textY, opacity: fadeOp }} initial="hidden" animate="visible" variants={stagger}>
            {/* Badge */}
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 text-[0.62rem] font-sans font-medium tracking-[0.28em] uppercase mb-8 border rounded-sm px-4 py-1.5"
                style={{ color: "hsl(42,80%,62%)", borderColor: "hsl(42,80%,52%,0.35)", background: "hsl(42,80%,52%,0.07)" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "hsl(42,80%,62%)" }} />
                Now Available in Zambia
              </span>
            </motion.div>

            {/* Title */}
            <motion.div variants={fadeUp} className="mb-5">
              <h1 className="font-display font-bold leading-[0.88]" style={{ letterSpacing: "0.04em" }}>
                <span className="block text-[clamp(2.8rem,6.5vw,5rem)]" style={{ color: "hsl(40,28%,93%)" }}>THE</span>
                <span className="block text-[clamp(2.8rem,6.5vw,5rem)] gold-shimmer" style={{ WebkitTextFillColor: "transparent" }}>LUMINOUS</span>
                <span className="block text-[clamp(2.8rem,6.5vw,5rem)]" style={{ color: "hsl(40,28%,93%)" }}>PATH</span>
              </h1>
            </motion.div>

            <motion.div variants={fadeUp} className="gold-line w-16 mb-5" />

            <motion.p variants={fadeUp} className="font-serif text-lg italic mb-2" style={{ color: "hsl(40,28%,70%)" }}>
              by Dr. Amara Zulu
            </motion.p>
            <motion.p variants={fadeUp} className="font-sans text-sm leading-relaxed mb-8 max-w-[420px]" style={{ color: "hsl(220,15%,62%)" }}>
              A transformative guide to purposeful living — drawing on African wisdom, modern psychology, and a life lived with extraordinary intention.
            </motion.p>

            <motion.blockquote variants={fadeUp} className="border-l-2 pl-4 mb-9" style={{ borderColor: "hsl(42,80%,52%,0.4)" }}>
              <p className="font-serif text-sm italic" style={{ color: "hsl(40,28%,55%)" }}>"The book Zambia has been waiting for."</p>
              <footer className="font-sans text-xs mt-1" style={{ color: "hsl(220,15%,48%)" }}>— Chanda Mwale, Lusaka</footer>
            </motion.blockquote>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link href="/shop">
                <Button size="lg" onClick={() => setProductType("paperback")}
                  className="font-display text-[0.68rem] tracking-[0.14em] uppercase h-12 px-8 shadow-xl transition-all"
                  style={{ background: "hsl(42,80%,48%)", color: "hsl(220,52%,10%)" }}>
                  Buy Paperback — K400
                </Button>
              </Link>
              <Link href="/shop">
                <Button size="lg" variant="outline" onClick={() => setProductType("hardcover")}
                  className="font-display text-[0.68rem] tracking-[0.14em] uppercase h-12 px-8 transition-all"
                  style={{ borderColor: "hsl(40,28%,93%,0.2)", color: "hsl(40,28%,70%)" }}>
                  Hardcover — K500
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeUp} className="flex items-center gap-8 pt-7 border-t" style={{ borderColor: "hsl(220,38%,22%)" }}>
              {[{ val: "6+", label: "Cities" }, { val: "256", label: "Pages" }, { val: "★ 5.0", label: "Rating" }].map(({ val, label }) => (
                <div key={label} className="text-center">
                  <div className="font-display text-xl font-bold" style={{ color: "hsl(42,80%,58%)" }}>{val}</div>
                  <div className="font-sans text-[0.6rem] tracking-[0.15em] uppercase mt-0.5" style={{ color: "hsl(220,15%,50%)" }}>{label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Book ── */}
          <motion.div style={{ y: bookY }} className="flex justify-center">
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
              <BookCover />
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
          className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5">
          <span className="font-sans text-[0.58rem] tracking-[0.3em] uppercase" style={{ color: "hsl(220,15%,40%)" }}>Scroll</span>
          <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <ChevronDown className="h-4 w-4" style={{ color: "hsl(42,80%,48%,0.5)" }} />
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════ TRUST BAR (light) ══ */}
      <motion.section
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="py-5 border-y border-border bg-card"
      >
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-10 md:gap-20">
            {[
              { icon: ShieldCheck, label: "Secure Payment" },
              { icon: Truck,        label: "Nationwide Delivery" },
              { icon: BookOpen,     label: "Genuine First Edition" },
              { icon: Award,        label: "Educator Recommended" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 text-xs text-muted-foreground font-sans tracking-wide">
                <Icon className="h-3.5 w-3.5 text-primary" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ══════════════════════════════ ABOUT THE BOOK (light) ══ */}
      <section className="py-24 container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <RevealSection>
            <motion.p variants={fadeUp} className="font-sans text-[0.62rem] tracking-[0.32em] uppercase text-primary font-semibold mb-4">The Book</motion.p>
            <motion.h2 variants={fadeUp} className="font-display text-4xl lg:text-5xl font-bold leading-tight text-foreground mb-5">
              A Book That Demands to Be<br />
              <span className="gold-shimmer" style={{ WebkitTextFillColor: "transparent" }}>Read More Than Once</span>
            </motion.h2>
            <motion.div variants={fadeUp} className="gold-line-solid w-16 mb-7" />
            <motion.p variants={fadeUp} className="font-serif text-base text-muted-foreground leading-relaxed mb-4">
              The Luminous Path is not a quick-fix guide. It is a serious, sustained conversation about what it means to live well — grounded in African philosophy, enriched by global psychological research, and written with the warmth of someone who genuinely wants you to succeed.
            </motion.p>
            <motion.p variants={fadeUp} className="font-serif text-base text-muted-foreground leading-relaxed mb-9">
              Eight chapters. Eight dimensions of a purposeful life: identity, resilience, relationships, vocation, wealth, community, health, and legacy.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link href="/about-book">
                <Button variant="outline" className="font-display text-[0.68rem] tracking-[0.14em] uppercase h-10 px-6 border-foreground/20 hover:border-primary hover:text-primary transition-colors">
                  Learn More
                </Button>
              </Link>
            </motion.div>
          </RevealSection>

          <RevealSection className="grid grid-cols-2 gap-4">
            {reasons.map((r, i) => (
              <motion.div key={i} variants={fadeUp}
                className="rounded-sm border border-border p-5 bg-card hover:border-primary/40 hover:shadow-md transition-all group">
                <div className="w-5 h-0.5 bg-primary mb-4 group-hover:w-10 transition-all duration-300 rounded-full" />
                <h3 className="font-display text-xs font-bold tracking-wider uppercase text-foreground mb-2">{r.title}</h3>
                <p className="font-sans text-xs text-muted-foreground leading-relaxed">{r.desc}</p>
              </motion.div>
            ))}
          </RevealSection>
        </div>
      </section>

      {/* ══════════════════════════════ EDITIONS (dark) ══ */}
      <section className="py-24" style={{ background: "hsl(220,52%,10%)" }}>
        <div className="container mx-auto px-6">
          <RevealSection className="text-center mb-14">
            <motion.p variants={fadeUp} className="font-sans text-[0.62rem] tracking-[0.32em] uppercase font-semibold mb-4" style={{ color: "hsl(42,80%,58%)" }}>
              Choose Your Edition
            </motion.p>
            <motion.h2 variants={fadeUp} className="font-display text-4xl lg:text-5xl font-bold" style={{ color: "hsl(40,28%,93%)" }}>
              Own Your Copy Today
            </motion.h2>
            <motion.p variants={fadeUp} className="font-serif text-base mt-4 max-w-md mx-auto" style={{ color: "hsl(220,15%,58%)" }}>
              Both editions contain the full text. Choose the format that fits your life.
            </motion.p>
          </RevealSection>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {paperback && (
              <RevealSection>
                <motion.div variants={fadeUp} whileHover={{ y: -5 }}
                  className="rounded-sm p-8 transition-all"
                  style={{ background: "hsl(220,52%,13%)", border: "1px solid hsl(220,38%,22%)" }}>
                  <div className="font-sans text-[0.58rem] tracking-[0.3em] uppercase mb-4" style={{ color: "hsl(220,15%,50%)" }}>Paperback</div>
                  <div className="font-display text-5xl font-bold mb-2" style={{ color: "hsl(42,80%,58%)" }}>K{paperback.priceKwacha}</div>
                  <p className="font-serif text-sm leading-relaxed mb-6" style={{ color: "hsl(220,15%,58%)" }}>{paperback.description.substring(0, 110)}…</p>
                  <ul className="space-y-2.5 mb-8">
                    {(paperback.features as string[]).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm font-sans" style={{ color: "hsl(220,15%,55%)" }}>
                        <span className="mt-0.5 text-[0.65rem]" style={{ color: "hsl(42,80%,52%)" }}>✦</span>{f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/shop">
                    <Button onClick={() => setProductType("paperback")} className="w-full font-display text-[0.65rem] tracking-[0.14em] uppercase h-11 transition-all hover:opacity-90"
                      style={{ background: "hsl(42,80%,48%)", color: "hsl(220,52%,10%)" }}>
                      Buy Paperback
                    </Button>
                  </Link>
                </motion.div>
              </RevealSection>
            )}
            {hardcover && (
              <RevealSection>
                <motion.div variants={fadeUp} whileHover={{ y: -5 }}
                  className="rounded-sm p-8 relative overflow-hidden transition-all"
                  style={{ background: "linear-gradient(140deg, hsl(222,55%,15%), hsl(218,60%,11%))", border: "1px solid hsl(42,80%,52%,0.35)" }}>
                  <div className="absolute top-4 right-4">
                    <span className="font-display text-[0.52rem] tracking-[0.18em] uppercase border rounded-sm px-2.5 py-1"
                      style={{ color: "hsl(42,80%,62%)", borderColor: "hsl(42,80%,52%,0.3)" }}>Premium</span>
                  </div>
                  <div className="font-sans text-[0.58rem] tracking-[0.3em] uppercase mb-4" style={{ color: "hsl(42,80%,52%,0.6)" }}>Hardcover</div>
                  <div className="font-display text-5xl font-bold mb-2" style={{ color: "hsl(42,80%,62%)" }}>K{hardcover.priceKwacha}</div>
                  <p className="font-serif text-sm leading-relaxed mb-6" style={{ color: "hsl(40,28%,55%)" }}>{hardcover.description.substring(0, 110)}…</p>
                  <ul className="space-y-2.5 mb-8">
                    {(hardcover.features as string[]).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm font-sans" style={{ color: "hsl(40,28%,52%)" }}>
                        <span className="mt-0.5 text-[0.65rem]" style={{ color: "hsl(42,80%,58%)" }}>✦</span>{f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/shop">
                    <Button onClick={() => setProductType("hardcover")} className="w-full font-display text-[0.65rem] tracking-[0.14em] uppercase h-11 shadow-lg transition-all hover:opacity-90"
                      style={{ background: "hsl(42,80%,48%)", color: "hsl(220,52%,10%)" }}>
                      Buy Hardcover
                    </Button>
                  </Link>
                </motion.div>
              </RevealSection>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ AUTHOR (light) ══ */}
      <section className="py-24 bg-background container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <RevealSection className="flex justify-center order-2 lg:order-1">
            <motion.div variants={fadeIn} className="relative">
              <div className="w-60 h-60 lg:w-72 lg:h-72 rounded-sm flex items-center justify-center shadow-xl border border-border"
                style={{ background: "linear-gradient(135deg, hsl(220,52%,12%), hsl(218,58%,10%))" }}>
                <div className="text-center">
                  <div className="font-display text-6xl font-bold mb-1"
                    style={{ background: "linear-gradient(135deg, hsl(42,80%,42%), hsl(44,82%,62%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    AZ
                  </div>
                  <div className="font-sans text-[0.6rem] tracking-[0.28em] uppercase text-muted-foreground">Dr. Amara Zulu</div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 rounded-sm px-5 py-3 shadow-xl bg-card border border-border">
                <p className="font-display text-xs font-bold tracking-wider">PhD Psychology</p>
                <p className="font-sans text-[0.62rem] text-muted-foreground mt-0.5">University of Zambia</p>
              </div>
            </motion.div>
          </RevealSection>

          <RevealSection className="order-1 lg:order-2">
            <motion.p variants={fadeUp} className="font-sans text-[0.62rem] tracking-[0.32em] uppercase text-primary font-semibold mb-4">The Author</motion.p>
            <motion.h2 variants={fadeUp} className="font-display text-4xl lg:text-5xl font-bold mb-4">Dr. Amara Zulu</motion.h2>
            <motion.div variants={fadeUp} className="gold-line-solid w-14 mb-7" />
            <motion.p variants={fadeUp} className="font-serif text-base text-muted-foreground leading-relaxed mb-4">
              Psychologist, educator, and community leader based in Lusaka, Zambia. With over two decades of work in human development and organizational psychology, she has dedicated her career to helping individuals and institutions unlock their fullest potential.
            </motion.p>
            <motion.p variants={fadeUp} className="font-serif text-base text-muted-foreground leading-relaxed mb-9">
              The Luminous Path draws on everything she has learned: from the villages of the Copperbelt, to the research halls of UNZA, to the boardrooms and community centres where she has worked for twenty years.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link href="/about-author">
                <Button variant="outline" className="font-display text-[0.68rem] tracking-[0.14em] uppercase h-10 px-6 border-foreground/20 hover:border-primary hover:text-primary transition-colors">
                  Full Biography
                </Button>
              </Link>
            </motion.div>
          </RevealSection>
        </div>
      </section>

      {/* ══════════════════════════════ REVIEWS (dark) ══ */}
      {topReviews.length > 0 && (
        <section className="py-24 relative overflow-hidden" style={{ background: "hsl(220,52%,10%)" }}>
          <div className="container mx-auto px-6">
            <RevealSection className="text-center mb-14">
              <motion.p variants={fadeUp} className="font-sans text-[0.62rem] tracking-[0.32em] uppercase font-semibold mb-4" style={{ color: "hsl(42,80%,58%)" }}>
                Reader Reviews
              </motion.p>
              <motion.h2 variants={fadeUp} className="font-display text-4xl lg:text-5xl font-bold" style={{ color: "hsl(40,28%,93%)" }}>
                What Readers Are Saying
              </motion.h2>
            </RevealSection>
            <div className="grid md:grid-cols-3 gap-6">
              {topReviews.map((review, i) => (
                <motion.div key={review.id}
                  initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-sm p-7 hover:border-primary/30 transition-all"
                  style={{ background: "hsl(220,52%,13%)", border: "1px solid hsl(220,38%,22%)" }}>
                  <div className="font-display text-5xl leading-none mb-3 select-none" style={{ color: "hsl(42,80%,52%,0.2)" }}>"</div>
                  <p className="font-serif text-sm leading-relaxed italic mb-6" style={{ color: "hsl(220,15%,62%)" }}>"{review.comment}"</p>
                  <div className="flex items-center gap-0.5 mb-3">
                    {Array.from({ length: review.rating }).map((_, j) => (
                      <Star key={j} className="h-3 w-3" style={{ fill: "hsl(42,80%,52%)", color: "hsl(42,80%,52%)" }} />
                    ))}
                  </div>
                  <p className="font-display text-xs font-bold tracking-wide" style={{ color: "hsl(40,28%,78%)" }}>{review.reviewerName}</p>
                  {review.reviewerTitle && <p className="font-sans text-[0.62rem] mt-0.5" style={{ color: "hsl(220,15%,48%)" }}>{review.reviewerTitle}</p>}
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href="/reviews">
                <Button variant="outline" className="font-display text-[0.65rem] tracking-[0.14em] uppercase h-10 px-8 transition-all"
                  style={{ borderColor: "hsl(220,38%,28%)", color: "hsl(40,28%,60%)" }}>
                  Read All Reviews
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════ HOW IT WORKS (light) ══ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <RevealSection className="text-center mb-16">
            <motion.p variants={fadeUp} className="font-sans text-[0.62rem] tracking-[0.32em] uppercase text-primary font-semibold mb-4">Simple Process</motion.p>
            <motion.h2 variants={fadeUp} className="font-display text-4xl lg:text-5xl font-bold text-foreground">Delivered to Your Door</motion.h2>
            <motion.p variants={fadeUp} className="font-serif text-base text-muted-foreground mt-4 max-w-md mx-auto">
              We ship nationwide. Pay via mobile money, card, or bank transfer.
            </motion.p>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto mb-16">
            {[
              { step: "01", title: "Order Online",       desc: "Choose your edition and complete the checkout form with your delivery details." },
              { step: "02", title: "Pay Securely",       desc: "Airtel Money, MTN, Zamtel, Visa/Mastercard, or direct bank transfer." },
              { step: "03", title: "Receive Your Book",  desc: "We arrange delivery to your city. Most orders arrive within 2–5 business days." },
            ].map((s, i) => (
              <motion.div key={s.step}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-left pl-5 border-l-2 border-primary/25">
                <div className="font-display text-5xl font-bold mb-2 leading-none" style={{ color: "hsl(42,80%,48%,0.12)" }}>{s.step}</div>
                <h3 className="font-display text-xs font-bold tracking-wider uppercase text-foreground mb-2">{s.title}</h3>
                <p className="font-sans text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/shop">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" className="font-display text-[0.68rem] tracking-[0.18em] uppercase px-12 h-12 shadow-xl transition-all"
                  style={{ background: "hsl(220,52%,10%)", color: "hsl(40,28%,93%)" }}>
                  Order Your Copy Now
                </Button>
              </motion.div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
