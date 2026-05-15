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
  useMotionValue,
  animate,
  type Variants,
} from "framer-motion";
import { useRef, useEffect } from "react";

/* ─────────────────────── animation presets ────────────────────── */
const EASE = [0.22, 1, 0.36, 1] as const;

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
};
const fadeUp: Variants = {
  hidden:   { opacity: 0, y: 28 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};
const fadeLeft: Variants = {
  hidden:   { opacity: 0, x: 40 },
  visible:  { opacity: 1, x: 0, transition: { duration: 0.7, ease: EASE } },
};
const scaleIn: Variants = {
  hidden:   { opacity: 0, scale: 0.92 },
  visible:  { opacity: 1, scale: 1,   transition: { duration: 0.55, ease: EASE } },
};

/* Scroll-reveal wrapper */
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={stagger}
      className={className}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────── animated counter ─────────────────────── */
function CountUp({
  to,
  suffix = "",
  prefix = "",
  decimals = 0,
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}) {
  const ref    = useRef<HTMLSpanElement>(null);
  const mv     = useMotionValue(0);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    if (!inView) return;
    const ctrl = animate(mv, to, {
      duration: 1.8,
      ease: "easeOut",
      onUpdate: (v) => {
        if (ref.current)
          ref.current.textContent =
            prefix + v.toFixed(decimals) + suffix;
      },
    });
    return () => ctrl.stop();
  }, [inView, mv, to, suffix, prefix, decimals]);

  return (
    <span ref={ref}>
      {prefix}0{suffix}
    </span>
  );
}

/* ─────────────────────── book cover ───────────────────────────── */
function BookCover() {
  return (
    <div className="relative mx-auto w-fit">
      {/* Cream glow pedestal */}
      <div
        className="absolute -inset-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 75% 80% at 50% 55%, rgba(245,238,215,0.45) 0%, rgba(245,238,215,0.08) 65%, transparent 100%)",
          filter: "blur(10px)",
        }}
      />
      {/* Gold ambient pulse */}
      <motion.div
        className="absolute -inset-14 rounded-full pointer-events-none"
        animate={{ opacity: [0.07, 0.14, 0.07] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(42,80%,52%) 0%, transparent 65%)",
        }}
      />

      {/* Book body */}
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [-0.4, 0.4, -0.4] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative overflow-hidden"
        style={{
          width: "clamp(170px, 17vw, 240px)",
          aspectRatio: "2/3",
          borderRadius: "2px 4px 4px 2px",
          background:
            "linear-gradient(160deg, hsl(222,58%,17%) 0%, hsl(218,60%,11%) 50%, hsl(220,52%,9%) 100%)",
          boxShadow:
            "0 50px 90px rgba(0,0,0,0.55), 0 20px 40px rgba(0,0,0,0.3), inset -2px 0 8px rgba(0,0,0,0.4)",
        }}
      >
        {/* Gold spine */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[5px]"
          style={{
            background:
              "linear-gradient(180deg, hsl(44,88%,62%) 0%, hsl(42,78%,44%) 50%, hsl(44,88%,62%) 100%)",
          }}
        />
        {/* Inner spine shadow */}
        <div
          className="absolute left-[5px] top-0 bottom-0 w-[12px]"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.22), transparent)",
          }}
        />

        {/* Top rule */}
        <div className="absolute top-8 left-7 right-5 h-px bg-white/15" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center gap-[6px]">
          <p
            className="font-display font-semibold tracking-[0.32em] uppercase"
            style={{ fontSize: "clamp(0.42rem,0.9vw,0.55rem)", color: "hsl(42,80%,60%)" }}
          >
            Dr. Amara Zulu
          </p>
          <div
            className="w-6 h-px"
            style={{ background: "hsl(42,78%,52%,0.5)" }}
          />
          <h2
            className="font-display font-bold text-white leading-[1.1]"
            style={{
              fontSize: "clamp(1rem,2.2vw,1.4rem)",
              letterSpacing: "0.07em",
            }}
          >
            THE
            <br />
            LUMINOUS
            <br />
            PATH
          </h2>
          <div
            className="w-6 h-px"
            style={{ background: "hsl(42,78%,52%,0.5)" }}
          />
          <p
            className="font-serif italic text-white/35"
            style={{ fontSize: "clamp(0.42rem,0.85vw,0.54rem)" }}
          >
            A Guide to Purposeful Living
          </p>
        </div>

        {/* Bottom rule (above gold band) */}
        <div
          className="absolute left-0 right-0 h-px"
          style={{
            bottom: "22%",
            background:
              "linear-gradient(90deg, transparent, hsl(42,80%,58%,0.5), transparent)",
          }}
        />

        {/* Gold band */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-center"
          style={{
            height: "22%",
            background:
              "linear-gradient(135deg, hsl(42,70%,34%), hsl(44,82%,50%), hsl(42,70%,34%))",
          }}
        >
          <p
            className="font-display font-bold"
            style={{
              fontSize: "clamp(0.42rem,0.9vw,0.58rem)",
              letterSpacing: "0.28em",
              color: "hsl(220,52%,10%)",
            }}
          >
            AMARA ZULU
          </p>
        </div>
      </motion.div>

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.5, ease: EASE }}
        className="absolute -bottom-5 -right-6 rounded-sm px-4 py-3 shadow-2xl"
        style={{
          background: "hsl(42,78%,46%)",
          color: "hsl(220,52%,10%)",
        }}
      >
        <p className="font-sans text-[0.52rem] font-semibold uppercase tracking-[0.22em] opacity-70 mb-0.5">
          Delivered across
        </p>
        <p className="font-display text-[0.7rem] font-bold tracking-[0.2em] uppercase">
          All Zambia
        </p>
      </motion.div>
    </div>
  );
}

/* ─────────────────────── stat item ────────────────────────────── */
function StatItem({
  to,
  suffix,
  prefix,
  decimals,
  label,
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-start gap-1">
      <div
        className="font-display font-bold leading-none"
        style={{
          fontSize: "clamp(2.2rem,4.5vw,3.5rem)",
          color: "hsl(42,78%,56%)",
          letterSpacing: "-0.01em",
        }}
      >
        <CountUp to={to} suffix={suffix} prefix={prefix} decimals={decimals} />
      </div>
      <div
        className="font-sans text-[0.65rem] tracking-[0.22em] uppercase"
        style={{ color: "hsl(220,18%,50%)" }}
      >
        {label}
      </div>
    </div>
  );
}

/* ─────────────────────── page ─────────────────────────────────── */
export default function Home() {
  const { data: products } = useListProducts();
  const { data: reviews }  = useListReviews();
  const setProductType     = useCartStore((s) => s.setProductType);

  const paperback  = products?.find((p) => p.type === "paperback");
  const hardcover  = products?.find((p) => p.type === "hardcover");
  const topReviews = reviews?.slice(0, 3) ?? [];

  /* Parallax */
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const bgY    = useTransform(scrollYProgress, [0, 1], ["0%",  "22%"]);
  const textY  = useTransform(scrollYProgress, [0, 1], ["0%",  "14%"]);
  const bookY  = useTransform(scrollYProgress, [0, 1], ["0%",   "7%"]);
  const fadeOp = useTransform(scrollYProgress, [0.5, 0.9], [1, 0]);

  const reasons = [
    {
      title: "African Wisdom",
      desc:  "Rooted in centuries of indigenous philosophy and lived Zambian experience.",
    },
    {
      title: "Research-Backed",
      desc:  "Every principle bridges ancient wisdom with contemporary psychological science.",
    },
    {
      title: "Actionable",
      desc:  "Practical exercises end every chapter — a clear path forward from page one.",
    },
    {
      title: "Written for Now",
      desc:  "Addressing modern African life: career, family, purpose, and identity.",
    },
  ];

  return (
    <div className="overflow-x-hidden">
      {/* ══════════════════════════════════════ HERO ══ */}
      <section
        ref={heroRef}
        className="relative overflow-hidden"
        style={{ minHeight: "100svh", background: "hsl(220,52%,9%)" }}
      >
        {/* BG layers */}
        <motion.div
          style={{ y: bgY }}
          className="absolute inset-0 pointer-events-none"
        >
          {/* Top-left blue bloom */}
          <div
            className="absolute -top-32 -left-32 w-[700px] h-[700px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, hsl(220,60%,26%,0.65) 0%, transparent 70%)",
            }}
          />
          {/* Centre-right gold hint */}
          <div
            className="absolute top-1/4 right-1/4 w-[800px] h-[600px] rounded-full"
            style={{
              background:
                "radial-gradient(ellipse, hsl(42,78%,52%,0.04) 0%, transparent 70%)",
            }}
          />
          {/* Grid */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.022]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="g"
                width="72"
                height="72"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 72 0 L 0 0 0 72"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.6"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#g)" />
          </svg>
        </motion.div>

        {/* Content grid */}
        <div className="relative z-10 w-full container mx-auto px-6 lg:px-10 grid lg:grid-cols-[1fr_auto] gap-12 lg:gap-16 items-center"
          style={{ minHeight: "100svh", paddingTop: "6rem", paddingBottom: "5rem" }}
        >
          {/* ── LEFT: text ── */}
          <motion.div
            style={{ y: textY, opacity: fadeOp }}
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {/* Pill badge */}
            <motion.div variants={fadeUp} className="mb-8">
              <span
                className="inline-flex items-center gap-2.5 font-sans text-[0.65rem] font-medium tracking-[0.28em] uppercase border rounded-sm px-4 py-2"
                style={{
                  color:        "hsl(42,80%,66%)",
                  borderColor:  "hsl(42,78%,52%,0.3)",
                  background:   "hsl(42,78%,52%,0.07)",
                }}
              >
                <motion.span
                  className="w-1.5 h-1.5 rounded-full block"
                  style={{ background: "hsl(42,80%,62%)" }}
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                Now Available in Zambia
              </span>
            </motion.div>

            {/* Giant title */}
            <motion.div variants={fadeUp} className="mb-6">
              <h1
                className="font-display font-bold leading-[0.9]"
                style={{ letterSpacing: "0.03em" }}
              >
                <span
                  className="block"
                  style={{
                    fontSize: "clamp(3.6rem,8.5vw,7.5rem)",
                    color: "hsl(40,22%,90%)",
                  }}
                >
                  THE
                </span>
                <span
                  className="block gold-shimmer"
                  style={{
                    fontSize: "clamp(3.6rem,8.5vw,7.5rem)",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  LUMINOUS
                </span>
                <span
                  className="block"
                  style={{
                    fontSize: "clamp(3.6rem,8.5vw,7.5rem)",
                    color: "hsl(40,22%,90%)",
                  }}
                >
                  PATH
                </span>
              </h1>
            </motion.div>

            {/* Gold rule */}
            <motion.div variants={fadeUp} className="gold-line-left w-20 mb-6" />

            {/* By-line */}
            <motion.p
              variants={fadeUp}
              className="font-serif italic mb-3"
              style={{
                fontSize: "clamp(1rem,1.8vw,1.25rem)",
                color: "hsl(40,22%,68%)",
              }}
            >
              by Dr. Amara Zulu
            </motion.p>

            {/* Description */}
            <motion.p
              variants={fadeUp}
              className="font-serif leading-relaxed mb-8 max-w-[440px]"
              style={{
                fontSize: "clamp(0.95rem,1.5vw,1.1rem)",
                color: "hsl(220,15%,60%)",
              }}
            >
              A transformative guide to purposeful living — drawing on African
              wisdom, modern psychology, and a life lived with extraordinary
              intention.
            </motion.p>

            {/* Testimonial pull-quote */}
            <motion.blockquote
              variants={fadeUp}
              className="border-l-[2px] pl-5 mb-9"
              style={{ borderColor: "hsl(42,78%,48%,0.45)" }}
            >
              <p
                className="font-serif italic leading-snug mb-1.5"
                style={{
                  fontSize: "clamp(0.95rem,1.4vw,1.05rem)",
                  color: "hsl(40,18%,58%)",
                }}
              >
                "The book Zambia has been waiting for."
              </p>
              <footer
                className="font-sans text-xs tracking-wide"
                style={{ color: "hsl(220,18%,44%)" }}
              >
                — Chanda Mwale, Lusaka
              </footer>
            </motion.blockquote>

            {/* CTA buttons */}
            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-3 mb-11"
            >
              <Link href="/shop">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="lg"
                    onClick={() => setProductType("paperback")}
                    className="font-display tracking-[0.13em] uppercase shadow-2xl border-0"
                    style={{
                      fontSize:   "0.72rem",
                      height:     "3.2rem",
                      padding:    "0 2.2rem",
                      background: "hsl(42,78%,46%)",
                      color:      "hsl(220,52%,9%)",
                      boxShadow:  "0 8px 32px hsl(42,78%,46%,0.32)",
                    }}
                  >
                    Buy Paperback — K400
                  </Button>
                </motion.div>
              </Link>
              <Link href="/shop">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setProductType("hardcover")}
                    className="font-display tracking-[0.13em] uppercase transition-colors"
                    style={{
                      fontSize:    "0.72rem",
                      height:      "3.2rem",
                      padding:     "0 2.2rem",
                      borderColor: "hsl(40,22%,88%,0.18)",
                      color:       "hsl(40,22%,72%)",
                    }}
                  >
                    Hardcover — K500
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            {/* Stats row */}
            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-end gap-x-10 gap-y-4 pt-8"
              style={{ borderTop: "1px solid hsl(220,38%,20%)" }}
            >
              <StatItem to={6}   suffix="+"       label="Cities served"   />
              <div className="w-px h-10 self-center" style={{ background: "hsl(220,38%,20%)" }} />
              <StatItem to={256}                  label="Pages"           />
              <div className="w-px h-10 self-center" style={{ background: "hsl(220,38%,20%)" }} />
              <StatItem to={5.0} decimals={1}     label="Star rating" prefix="★ " />
            </motion.div>
          </motion.div>

          {/* ── RIGHT: book ── */}
          <motion.div style={{ y: bookY }}>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.9, ease: EASE }}
              className="flex justify-center items-center"
            >
              <BookCover />
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span
            className="font-sans tracking-[0.3em] uppercase"
            style={{ fontSize: "0.58rem", color: "hsl(220,18%,38%)" }}
          >
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          >
            <ChevronDown
              className="h-4 w-4"
              style={{ color: "hsl(42,78%,46%,0.5)" }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════ TRUST BAR ══ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="py-5 border-y border-border bg-card"
      >
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { icon: ShieldCheck, label: "Secure Payment"       },
              { icon: Truck,       label: "Nationwide Delivery"  },
              { icon: BookOpen,    label: "Genuine First Edition" },
              { icon: Award,       label: "Educator Recommended" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 font-sans text-[0.78rem] text-muted-foreground tracking-wide"
              >
                <Icon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ══════════════════════════════════════ ABOUT BOOK ══ */}
      <section className="py-28 container mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-28 items-center">
          {/* text */}
          <Reveal>
            <motion.p
              variants={fadeUp}
              className="font-sans text-[0.65rem] tracking-[0.3em] uppercase text-primary font-semibold mb-5"
            >
              The Book
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="font-display font-bold text-foreground mb-5"
              style={{ fontSize: "clamp(2rem,4.5vw,3.4rem)", lineHeight: 1.05 }}
            >
              A Book That Demands to Be{" "}
              <span className="gold-shimmer" style={{ WebkitTextFillColor: "transparent" }}>
                Read Twice
              </span>
            </motion.h2>
            <motion.div variants={fadeUp} className="gold-line-left w-14 mb-7" />
            <motion.p
              variants={fadeUp}
              className="font-serif text-muted-foreground leading-relaxed mb-4"
              style={{ fontSize: "clamp(1rem,1.6vw,1.1rem)" }}
            >
              The Luminous Path is not a quick-fix guide. It is a serious,
              sustained conversation about what it means to live well — grounded
              in African philosophy, enriched by global research, and written
              with the warmth of someone who genuinely wants you to succeed.
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="font-serif text-muted-foreground leading-relaxed mb-10"
              style={{ fontSize: "clamp(1rem,1.6vw,1.1rem)" }}
            >
              Eight chapters. Eight dimensions of a purposeful life: identity,
              resilience, relationships, vocation, wealth, community, health,
              and legacy.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link href="/about-book">
                <motion.div
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="inline-flex items-center gap-3 font-display text-[0.7rem] tracking-[0.16em] uppercase text-foreground/70 hover:text-primary transition-colors"
                >
                  Learn More
                  <span className="block w-6 h-px bg-current" />
                </motion.div>
              </Link>
            </motion.div>
          </Reveal>

          {/* reason cards */}
          <Reveal className="grid grid-cols-2 gap-4">
            {reasons.map((r, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.08)" }}
                transition={{ type: "spring", stiffness: 260 }}
                className="rounded-sm border border-border p-6 bg-card group cursor-default"
              >
                <div className="w-6 h-[2px] bg-primary mb-5 group-hover:w-12 transition-all duration-400 ease-out rounded-full" />
                <h3 className="font-display text-[0.72rem] font-bold tracking-widest uppercase text-foreground mb-2.5">
                  {r.title}
                </h3>
                <p className="font-sans text-[0.8rem] text-muted-foreground leading-relaxed">
                  {r.desc}
                </p>
              </motion.div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════ EDITIONS (dark) ══ */}
      <section
        className="py-28 relative"
        style={{ background: "hsl(220,52%,9%)" }}
      >
        {/* Top fade */}
        <div
          className="absolute inset-x-0 top-0 h-24 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, hsl(40,28%,96%) 0%, transparent 100%)",
          }}
        />

        <div className="container mx-auto px-6 lg:px-10">
          <Reveal className="text-center mb-16">
            <motion.p
              variants={fadeUp}
              className="font-sans text-[0.65rem] tracking-[0.3em] uppercase font-semibold mb-5"
              style={{ color: "hsl(42,78%,62%)" }}
            >
              Choose Your Edition
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="font-display font-bold"
              style={{
                fontSize: "clamp(2.2rem,5vw,4rem)",
                color: "hsl(40,22%,92%)",
              }}
            >
              Own Your Copy Today
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="font-serif mt-4 max-w-sm mx-auto"
              style={{ fontSize: "1.05rem", color: "hsl(220,18%,55%)" }}
            >
              Both editions contain the full text. Choose the format that fits
              your life.
            </motion.p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {paperback && (
              <Reveal>
                <motion.div
                  variants={scaleIn}
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 220 }}
                  className="rounded-sm p-9"
                  style={{
                    background: "hsl(220,52%,12%)",
                    border: "1px solid hsl(220,38%,22%)",
                  }}
                >
                  <div
                    className="font-sans text-[0.6rem] tracking-[0.32em] uppercase mb-4"
                    style={{ color: "hsl(220,18%,48%)" }}
                  >
                    Paperback
                  </div>
                  <div
                    className="font-display font-bold leading-none mb-5"
                    style={{
                      fontSize: "clamp(3rem,5vw,4.2rem)",
                      color: "hsl(42,78%,56%)",
                    }}
                  >
                    K{paperback.priceKwacha}
                  </div>
                  <p
                    className="font-serif leading-relaxed mb-6"
                    style={{
                      fontSize: "0.95rem",
                      color: "hsl(220,18%,55%)",
                    }}
                  >
                    {paperback.description.substring(0, 115)}…
                  </p>
                  <ul className="space-y-3 mb-8">
                    {(paperback.features as string[]).map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2.5 font-sans text-[0.82rem]"
                        style={{ color: "hsl(220,15%,52%)" }}
                      >
                        <span
                          className="mt-0.5 flex-shrink-0 text-[0.6rem]"
                          style={{ color: "hsl(42,78%,52%)" }}
                        >
                          ✦
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/shop">
                    <Button
                      onClick={() => setProductType("paperback")}
                      className="w-full font-display tracking-[0.14em] uppercase border-0"
                      style={{
                        fontSize:   "0.7rem",
                        height:     "3rem",
                        background: "hsl(42,78%,46%)",
                        color:      "hsl(220,52%,9%)",
                      }}
                    >
                      Buy Paperback
                    </Button>
                  </Link>
                </motion.div>
              </Reveal>
            )}

            {hardcover && (
              <Reveal>
                <motion.div
                  variants={scaleIn}
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 220 }}
                  className="rounded-sm p-9 relative overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(145deg, hsl(222,56%,14%), hsl(218,60%,10%))",
                    border: "1px solid hsl(42,78%,50%,0.3)",
                  }}
                >
                  {/* Premium glow */}
                  <div
                    className="absolute -top-20 -right-20 w-48 h-48 rounded-full pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(circle, hsl(42,78%,52%,0.08) 0%, transparent 70%)",
                    }}
                  />
                  <div className="absolute top-4 right-4">
                    <span
                      className="font-display text-[0.55rem] tracking-[0.2em] uppercase border rounded-sm px-2.5 py-1"
                      style={{
                        color:       "hsl(42,80%,64%)",
                        borderColor: "hsl(42,78%,52%,0.3)",
                      }}
                    >
                      Premium
                    </span>
                  </div>
                  <div
                    className="font-sans text-[0.6rem] tracking-[0.32em] uppercase mb-4"
                    style={{ color: "hsl(42,60%,46%,0.7)" }}
                  >
                    Hardcover
                  </div>
                  <div
                    className="font-display font-bold leading-none mb-5"
                    style={{
                      fontSize: "clamp(3rem,5vw,4.2rem)",
                      color: "hsl(42,80%,60%)",
                    }}
                  >
                    K{hardcover.priceKwacha}
                  </div>
                  <p
                    className="font-serif leading-relaxed mb-6"
                    style={{
                      fontSize: "0.95rem",
                      color: "hsl(40,18%,52%)",
                    }}
                  >
                    {hardcover.description.substring(0, 115)}…
                  </p>
                  <ul className="space-y-3 mb-8">
                    {(hardcover.features as string[]).map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2.5 font-sans text-[0.82rem]"
                        style={{ color: "hsl(40,18%,50%)" }}
                      >
                        <span
                          className="mt-0.5 flex-shrink-0 text-[0.6rem]"
                          style={{ color: "hsl(42,80%,56%)" }}
                        >
                          ✦
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/shop">
                    <Button
                      onClick={() => setProductType("hardcover")}
                      className="w-full font-display tracking-[0.14em] uppercase border-0 shadow-xl"
                      style={{
                        fontSize:   "0.7rem",
                        height:     "3rem",
                        background: "hsl(42,78%,46%)",
                        color:      "hsl(220,52%,9%)",
                      }}
                    >
                      Buy Hardcover
                    </Button>
                  </Link>
                </motion.div>
              </Reveal>
            )}
          </div>
        </div>

        {/* Bottom fade out */}
        <div
          className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
          style={{
            background:
              "linear-gradient(0deg, hsl(40,28%,96%) 0%, transparent 100%)",
          }}
        />
      </section>

      {/* ══════════════════════════════════════ AUTHOR ══ */}
      <section className="py-28 container mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-28 items-center">
          {/* Portrait */}
          <Reveal className="flex justify-center order-2 lg:order-1">
            <motion.div variants={fadeLeft} className="relative">
              <div
                className="w-64 h-64 lg:w-80 lg:h-80 rounded-sm flex items-center justify-center shadow-2xl"
                style={{
                  background:
                    "linear-gradient(145deg, hsl(220,52%,13%), hsl(218,58%,10%))",
                  border: "1px solid hsl(40,14%,88%)",
                }}
              >
                <div className="text-center">
                  <div
                    className="font-display font-bold leading-none mb-2"
                    style={{
                      fontSize: "5rem",
                      background:
                        "linear-gradient(135deg, hsl(42,78%,42%), hsl(44,84%,62%))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    AZ
                  </div>
                  <div
                    className="font-sans text-[0.6rem] tracking-[0.28em] uppercase"
                    style={{ color: "hsl(40,22%,38%)" }}
                  >
                    Dr. Amara Zulu
                  </div>
                </div>
              </div>
              {/* Credential card */}
              <motion.div
                initial={{ opacity: 0, x: 12, y: 12 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35, duration: 0.55, ease: EASE }}
                className="absolute -bottom-5 -right-5 rounded-sm px-5 py-4 shadow-xl bg-card border border-border"
              >
                <p className="font-display text-[0.72rem] font-bold tracking-wider text-foreground">
                  PhD Psychology
                </p>
                <p className="font-sans text-[0.68rem] text-muted-foreground mt-0.5">
                  University of Zambia
                </p>
              </motion.div>
            </motion.div>
          </Reveal>

          {/* Bio */}
          <Reveal className="order-1 lg:order-2">
            <motion.p
              variants={fadeUp}
              className="font-sans text-[0.65rem] tracking-[0.3em] uppercase text-primary font-semibold mb-5"
            >
              The Author
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="font-display font-bold text-foreground mb-5"
              style={{ fontSize: "clamp(2.2rem,4.5vw,3.4rem)" }}
            >
              Dr. Amara Zulu
            </motion.h2>
            <motion.div variants={fadeUp} className="gold-line-left w-14 mb-7" />
            <motion.p
              variants={fadeUp}
              className="font-serif text-muted-foreground leading-relaxed mb-4"
              style={{ fontSize: "clamp(1rem,1.6vw,1.1rem)" }}
            >
              Psychologist, educator, and community leader based in Lusaka,
              Zambia. With over two decades of work in human development and
              organisational psychology, she has dedicated her career to helping
              individuals and institutions unlock their fullest potential.
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="font-serif text-muted-foreground leading-relaxed mb-10"
              style={{ fontSize: "clamp(1rem,1.6vw,1.1rem)" }}
            >
              The Luminous Path draws on everything she has learned — from
              Copperbelt villages, to UNZA research halls, to the boardrooms and
              community centres where she has worked for twenty years.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link href="/about-author">
                <motion.div
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="inline-flex items-center gap-3 font-display text-[0.7rem] tracking-[0.16em] uppercase text-foreground/70 hover:text-primary transition-colors"
                >
                  Full Biography
                  <span className="block w-6 h-px bg-current" />
                </motion.div>
              </Link>
            </motion.div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════ REVIEWS (dark) ══ */}
      {topReviews.length > 0 && (
        <section
          className="py-28 relative overflow-hidden"
          style={{ background: "hsl(220,52%,9%)" }}
        >
          {/* Top fade */}
          <div
            className="absolute inset-x-0 top-0 h-24 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, hsl(40,28%,96%) 0%, transparent 100%)",
            }}
          />

          <div className="container mx-auto px-6 lg:px-10">
            <Reveal className="text-center mb-16">
              <motion.p
                variants={fadeUp}
                className="font-sans text-[0.65rem] tracking-[0.3em] uppercase font-semibold mb-5"
                style={{ color: "hsl(42,78%,62%)" }}
              >
                Reader Reviews
              </motion.p>
              <motion.h2
                variants={fadeUp}
                className="font-display font-bold"
                style={{
                  fontSize: "clamp(2.2rem,5vw,4rem)",
                  color: "hsl(40,22%,92%)",
                }}
              >
                What Readers Are Saying
              </motion.h2>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-6">
              {topReviews.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.6, ease: EASE }}
                  whileHover={{ y: -5 }}
                  className="rounded-sm p-8 flex flex-col"
                  style={{
                    background: "hsl(220,52%,12%)",
                    border: "1px solid hsl(220,38%,21%)",
                  }}
                >
                  <div
                    className="font-serif leading-none mb-3 select-none"
                    style={{ fontSize: "4.5rem", color: "hsl(42,78%,48%,0.15)" }}
                  >
                    "
                  </div>
                  <p
                    className="font-serif italic leading-relaxed mb-6 flex-1"
                    style={{
                      fontSize: "clamp(0.9rem,1.4vw,1rem)",
                      color: "hsl(220,15%,60%)",
                    }}
                  >
                    "{r.comment}"
                  </p>
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: r.rating }).map((_, j) => (
                      <Star
                        key={j}
                        className="h-3.5 w-3.5"
                        style={{
                          fill: "hsl(42,78%,50%)",
                          color: "hsl(42,78%,50%)",
                        }}
                      />
                    ))}
                  </div>
                  <p
                    className="font-display text-[0.75rem] font-bold tracking-wide"
                    style={{ color: "hsl(40,22%,78%)" }}
                  >
                    {r.reviewerName}
                  </p>
                  {r.reviewerTitle && (
                    <p
                      className="font-sans text-[0.68rem] mt-0.5"
                      style={{ color: "hsl(220,15%,46%)" }}
                    >
                      {r.reviewerTitle}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/reviews">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    className="font-display tracking-[0.14em] uppercase"
                    style={{
                      fontSize:    "0.7rem",
                      height:      "2.8rem",
                      padding:     "0 2.5rem",
                      borderColor: "hsl(220,38%,25%)",
                      color:       "hsl(40,22%,60%)",
                    }}
                  >
                    Read All Reviews
                  </Button>
                </motion.div>
              </Link>
            </div>
          </div>

          {/* Bottom fade */}
          <div
            className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
            style={{
              background:
                "linear-gradient(0deg, hsl(40,28%,96%) 0%, transparent 100%)",
            }}
          />
        </section>
      )}

      {/* ══════════════════════════════════════ HOW IT WORKS ══ */}
      <section className="py-28 bg-background">
        <div className="container mx-auto px-6 lg:px-10">
          <Reveal className="text-center mb-16">
            <motion.p
              variants={fadeUp}
              className="font-sans text-[0.65rem] tracking-[0.3em] uppercase text-primary font-semibold mb-5"
            >
              Simple Process
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="font-display font-bold text-foreground"
              style={{ fontSize: "clamp(2.2rem,5vw,4rem)" }}
            >
              Delivered to Your Door
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="font-serif text-muted-foreground mt-4 max-w-sm mx-auto"
              style={{ fontSize: "1.05rem" }}
            >
              We ship nationwide. Pay via mobile money, card, or bank transfer.
            </motion.p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-10 max-w-3xl mx-auto mb-16">
            {[
              {
                step: "01",
                title: "Order Online",
                desc:  "Choose your edition and complete the checkout form with your delivery details.",
              },
              {
                step: "02",
                title: "Pay Securely",
                desc:  "Airtel Money, MTN, Zamtel, Visa/Mastercard, or direct bank transfer.",
              },
              {
                step: "03",
                title: "Receive Your Book",
                desc:  "We arrange delivery to your city. Most orders arrive within 2–5 business days.",
              },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.55, ease: EASE }}
                className="flex flex-col gap-3"
              >
                <div
                  className="font-display font-bold leading-none"
                  style={{
                    fontSize: "clamp(3.5rem,6vw,5rem)",
                    color: "hsl(42,78%,46%,0.1)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {s.step}
                </div>
                <div
                  className="w-8 h-[2px] -mt-2"
                  style={{ background: "hsl(42,78%,46%,0.35)" }}
                />
                <h3 className="font-display text-[0.78rem] font-bold tracking-widest uppercase text-foreground">
                  {s.title}
                </h3>
                <p className="font-sans text-[0.85rem] text-muted-foreground leading-relaxed">
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/shop">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  className="font-display tracking-[0.18em] uppercase shadow-xl border-0"
                  style={{
                    fontSize:   "0.72rem",
                    height:     "3.2rem",
                    padding:    "0 3rem",
                    background: "hsl(220,52%,10%)",
                    color:      "hsl(40,22%,92%)",
                  }}
                >
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
