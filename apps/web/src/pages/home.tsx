import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import bookPhoto from "/book-cover.jpeg";
import { useListProducts, useListReviews } from "@workspace/api-client-react";
import { useCartStore } from "@/lib/store";
import { Star, ShieldCheck, Truck, BookOpen, Award, ChevronDown } from "lucide-react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  useSpring,
  animate,
  type Variants,
} from "framer-motion";
import { useRef, useEffect } from "react";
import { fmtMoney } from "@/components/purchase-ui";

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
function BookCover({ bookWidth = "clamp(220px,24vw,320px)" }: { bookWidth?: string }) {
  return (
    <div className="relative mx-auto w-fit">
      {/* Layered glow behind book */}
      <motion.div
        className="absolute pointer-events-none"
        animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.04, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          inset: "-60px",
          background: "radial-gradient(ellipse 80% 70% at 50% 60%, hsl(42,78%,52%,0.10) 0%, hsl(220,60%,30%,0.15) 50%, transparent 80%)",
          filter: "blur(20px)",
        }}
      />

      {/* Book body */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative overflow-hidden"
        style={{
          width: bookWidth,
          aspectRatio: "2/3",
          borderRadius: "2px 5px 5px 2px",
          background: "linear-gradient(170deg, hsl(222,60%,18%) 0%, hsl(218,62%,12%) 40%, hsl(220,54%,10%) 100%)",
          boxShadow: "6px 0 18px rgba(0,0,0,0.35), 0 60px 100px rgba(0,0,0,0.6), 0 24px 48px rgba(0,0,0,0.35), inset -3px 0 12px rgba(0,0,0,0.45)",
        }}
      >
        {/* Gold spine */}
        <div className="absolute left-0 top-0 bottom-0 w-[6px]"
          style={{ background: "linear-gradient(180deg, hsl(44,90%,65%) 0%, hsl(42,78%,44%) 45%, hsl(44,90%,65%) 100%)" }} />
        {/* Spine inner shadow */}
        <div className="absolute left-[6px] top-0 bottom-0 w-[16px]"
          style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.28), transparent)" }} />
        {/* Right-edge shadow */}
        <div className="absolute right-0 top-0 bottom-0 w-[20px]"
          style={{ background: "linear-gradient(270deg, rgba(0,0,0,0.18), transparent)" }} />

        {/* Top rule */}
        <div className="absolute top-[10%] left-[12%] right-[8%] h-px" style={{ background: "rgba(255,255,255,0.12)" }} />

        {/* Cover content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-[10%] text-center" style={{ gap: "5%" }}>
          <p className="font-sans font-medium tracking-[0.3em] uppercase"
            style={{ fontSize: "clamp(0.38rem,0.75vw,0.5rem)", color: "hsl(42,78%,60%)", letterSpacing: "0.35em" }}>
            Mwanalushi &amp; Nalishebo
          </p>
          <div className="w-[28%] h-px" style={{ background: "hsl(42,78%,52%,0.45)" }} />
          <h2 className="font-display font-bold text-white leading-[1.05]"
            style={{ fontSize: "clamp(0.95rem,2vw,1.35rem)", letterSpacing: "0.06em" }}>
            UNCOMMON<br />DENOMINATORS
          </h2>
          <div className="w-[28%] h-px" style={{ background: "hsl(42,78%,52%,0.45)" }} />
          <p className="font-serif italic" style={{ fontSize: "clamp(0.36rem,0.72vw,0.48rem)", color: "rgba(255,255,255,0.3)" }}>
            Zambia's Economic Transformation
          </p>
        </div>

        {/* Bottom rule */}
        <div className="absolute left-0 right-0 h-px" style={{ bottom: "22%", background: "linear-gradient(90deg,transparent,hsl(42,80%,55%,0.4),transparent)" }} />

        {/* Gold band */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center"
          style={{ height: "22%", background: "linear-gradient(135deg, hsl(42,68%,32%), hsl(44,80%,48%), hsl(42,68%,32%))" }}>
          <p className="font-sans font-bold tracking-[0.28em] uppercase"
            style={{ fontSize: "clamp(0.38rem,0.78vw,0.52rem)", color: "hsl(220,52%,10%)" }}>
            MWANALUSHI &amp; NALISHEBO
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────── particles ────────────────────────────── */
const PARTICLES = [
  { id:0,  x:"6%",  y:"18%", s:2.4, dur:9,  del:0   },
  { id:1,  x:"13%", y:"8%",  s:1.6, dur:11, del:1.8 },
  { id:2,  x:"19%", y:"28%", s:2.8, dur:8,  del:0.6 },
  { id:3,  x:"27%", y:"12%", s:1.4, dur:13, del:3.1 },
  { id:4,  x:"34%", y:"6%",  s:2.0, dur:10, del:1.2 },
  { id:5,  x:"41%", y:"22%", s:1.8, dur:7,  del:2.4 },
  { id:6,  x:"48%", y:"10%", s:2.2, dur:12, del:0.3 },
  { id:7,  x:"55%", y:"16%", s:1.5, dur:9,  del:4.0 },
  { id:8,  x:"62%", y:"25%", s:2.6, dur:11, del:1.5 },
  { id:9,  x:"69%", y:"8%",  s:1.9, dur:8,  del:2.8 },
  { id:10, x:"76%", y:"19%", s:2.1, dur:14, del:0.9 },
  { id:11, x:"83%", y:"11%", s:1.7, dur:10, del:3.5 },
  { id:12, x:"90%", y:"24%", s:2.3, dur:7,  del:1.1 },
  { id:13, x:"9%",  y:"35%", s:1.5, dur:12, del:5.2 },
  { id:14, x:"23%", y:"42%", s:2.0, dur:9,  del:0.4 },
  { id:15, x:"37%", y:"38%", s:1.3, dur:11, del:2.7 },
  { id:16, x:"52%", y:"45%", s:2.5, dur:8,  del:4.6 },
  { id:17, x:"68%", y:"33%", s:1.8, dur:13, del:1.9 },
  { id:18, x:"79%", y:"41%", s:2.2, dur:10, del:3.3 },
  { id:19, x:"88%", y:"36%", s:1.6, dur:7,  del:0.7 },
  { id:20, x:"16%", y:"55%", s:2.0, dur:9,  del:6.1 },
  { id:21, x:"44%", y:"58%", s:1.4, dur:12, del:2.2 },
];

/* slide-up from clip (used for individual title words) */
const slideUp: Variants = {
  hidden:  { y: "105%", opacity: 0 },
  visible: { y: "0%",   opacity: 1, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } },
};

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
          fontSize: "clamp(1.6rem,2.8vw,2.2rem)",
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

  /* Book mouse-parallax */
  const panelRef   = useRef<HTMLDivElement>(null);
  const bookRotX   = useMotionValue(1.5);
  const bookRotY   = useMotionValue(-10);
  const springRotX = useSpring(bookRotX, { stiffness: 50, damping: 18 });
  const springRotY = useSpring(bookRotY, { stiffness: 50, damping: 18 });

  function handleBookMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = panelRef.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const cx = ((e.clientX - left) / width  - 0.5) * 2;
    const cy = ((e.clientY - top)  / height - 0.5) * 2;
    bookRotY.set(-10 + cx * 8);
    bookRotX.set(1.5 + cy * -5);
  }
  function handleBookMouseLeave() { bookRotY.set(-10); bookRotX.set(1.5); }

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
      <section ref={heroRef} className="relative overflow-hidden"
        style={{ minHeight: "100svh", background: "hsl(222,58%,6%)", marginTop: "-56px", paddingTop: "56px" }}>

        {/* ── BACKGROUND LAYERS ── */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">

          {/* Film grain via inline SVG noise filter */}
          <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.038 }} xmlns="http://www.w3.org/2000/svg">
            <filter id="hero-noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#hero-noise)" />
          </svg>

          {/* Giant "LUMINOUS" watermark in outlined type */}
          <div className="absolute inset-0 flex items-center overflow-hidden">
            <span style={{
              fontFamily: "var(--app-font-display)", fontWeight: 900,
              fontSize: "21vw", lineHeight: 1,
              color: "transparent",
              WebkitTextStroke: "1px hsl(42,80%,52%,0.052)",
              letterSpacing: "0.07em", whiteSpace: "nowrap", userSelect: "none",
              transform: "translateX(-1vw) translateY(8%)",
            }}>LUMINOUS</span>
          </div>

          {/* Atmospheric light blooms (parallax) */}
          <motion.div style={{ y: bgY }} className="absolute inset-0">
            <div className="absolute -top-28 left-1/2 -translate-x-1/2 rounded-full"
              style={{ width: "1100px", height: "750px",
                background: "radial-gradient(ellipse, hsl(222,65%,18%,0.8) 0%, transparent 65%)" }} />
            <div className="absolute top-[18%] right-0 rounded-full"
              style={{ width: "520px", height: "620px",
                background: "radial-gradient(ellipse 70% 80% at 80% 50%, hsl(42,78%,50%,0.07) 0%, transparent 68%)" }} />
            <div className="absolute bottom-0 inset-x-0 h-56"
              style={{ background: "linear-gradient(0deg, hsl(222,58%,5%) 0%, transparent 100%)" }} />
          </motion.div>

          {/* Floating gold particles */}
          {PARTICLES.map(p => (
            <motion.span key={p.id} className="absolute rounded-full"
              style={{ left: p.x, top: p.y, width: p.s, height: p.s, background: "hsl(44,84%,64%)" }}
              animate={{ y: [0, -65, 0], opacity: [0, 0.55, 0] }}
              transition={{ duration: p.dur, delay: p.del, repeat: Infinity, ease: "easeInOut" }} />
          ))}
        </div>

        {/* ── MAIN GRID: text | book ── */}
        <div className="relative z-10 grid lg:grid-cols-[1fr_460px]"
          style={{ minHeight: "100svh", paddingTop: "4.5rem" }}>

          {/* ──────────── LEFT: editorial text ──────────── */}
          <motion.div style={{ y: textY, opacity: fadeOp }}
            initial="hidden" animate="visible" variants={stagger}
            className="flex flex-col justify-center px-5 sm:px-8 lg:px-16 xl:px-24 py-10 sm:py-16">

            {/* Eyebrow row — stars inline */}
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-10 flex-wrap">
              <div className="flex items-center gap-2">
                <motion.span className="w-1.5 h-1.5 rounded-full block flex-shrink-0"
                  style={{ background: "hsl(42,80%,58%)" }}
                  animate={{ opacity: [1, 0.18, 1] }} transition={{ duration: 2.2, repeat: Infinity }} />
                <span className="font-sans text-[0.57rem] font-semibold tracking-[0.36em] uppercase"
                  style={{ color: "hsl(42,78%,60%)" }}>Bestselling · Zambia 2024</span>
              </div>
              <div className="w-px h-3 flex-shrink-0" style={{ background: "hsl(220,38%,22%)" }} />
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} className="h-2.5 w-2.5 fill-current" style={{ color: "hsl(42,78%,54%)" }} />)}
                </div>
                <span className="font-sans text-[0.57rem] font-medium" style={{ color: "hsl(220,14%,48%)" }}>5.0</span>
              </div>
            </motion.div>

            {/* Main title — per-word clip-path slide-up */}
            <motion.div variants={stagger} className="mb-9">
              <h1 className="font-display font-bold leading-[0.92]" style={{ letterSpacing: "-0.015em" }}>
                <div style={{ overflow: "hidden" }}>
                  <motion.span className="block" variants={slideUp}
                    style={{
                      fontSize: "clamp(3.2rem,6.5vw,5.4rem)",
                      color: "hsl(40,24%,96%)",
                      textShadow: "0 0 90px hsl(222,72%,44%,0.4), 0 0 180px hsl(222,65%,36%,0.2)",
                    }}>Uncommon</motion.span>
                </div>
                <div style={{ overflow: "hidden" }}>
                  <motion.span className="block" variants={slideUp}
                    style={{
                      fontSize: "clamp(3.2rem,6.5vw,5.4rem)",
                      background: "linear-gradient(118deg, hsl(44,92%,72%) 0%, hsl(42,78%,50%) 38%, hsl(44,90%,66%) 68%, hsl(42,76%,48%) 100%)",
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                    }}>Denominators</motion.span>
                </div>
              </h1>
            </motion.div>

            {/* Ornament rule */}
            <motion.div variants={fadeUp} className="flex items-center gap-4 mb-6">
              <div className="h-px w-10 flex-shrink-0" style={{ background: "hsl(42,78%,50%,0.55)" }} />
              <span className="font-sans text-[0.56rem] tracking-[0.4em] uppercase font-semibold flex-shrink-0"
                style={{ color: "hsl(42,78%,54%,0.6)" }}>Understanding Zambia's Economic Transformation</span>
              <div className="h-px flex-1" style={{ background: "hsl(42,78%,48%,0.1)" }} />
            </motion.div>

            {/* Author */}
            <motion.p variants={fadeUp} className="font-serif italic mb-5"
              style={{ fontSize: "clamp(1rem,1.5vw,1.14rem)", color: "hsl(40,20%,58%)" }}>
              by Monde Mwanalushi &amp; Eric Nalishebo
            </motion.p>

            {/* Description */}
            <motion.p variants={fadeUp} className="font-serif leading-[1.8] mb-8 max-w-[500px]"
              style={{ fontSize: "clamp(0.9rem,1.3vw,1rem)", color: "hsl(220,14%,50%)" }}>
              A rigorous, accessible diagnosis of the structural factors holding back
              Zambia's economic transformation — written for policymakers, business
              leaders, students, and every Zambian who wants to understand the real picture.
            </motion.p>

            {/* Pull quote — with oversized decorative mark */}
            <motion.div variants={fadeUp} className="relative mb-10 pl-3">
              <span className="absolute font-display italic font-bold"
                style={{ top: "-0.5em", left: "-0.1em", fontSize: "5.5rem", lineHeight: 1,
                  color: "hsl(42,78%,50%,0.1)", userSelect: "none", pointerEvents: "none" }}>"</span>
              <p className="font-serif italic leading-snug relative z-10"
                style={{ fontSize: "clamp(0.96rem,1.38vw,1.06rem)", color: "hsl(40,18%,56%)" }}>
                "The book Zambia has been waiting for."
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-px w-5" style={{ background: "hsl(42,78%,48%,0.35)" }} />
                <span className="font-sans text-[0.67rem] tracking-wide" style={{ color: "hsl(220,18%,36%)" }}>
                  Chanda Mwale, Lusaka
                </span>
              </div>
            </motion.div>

            {/* CTA buttons */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 mb-12">
              <Link href="/shop">
                <motion.div whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" onClick={() => setProductType("paperback")}
                    className="font-sans uppercase w-full sm:w-auto"
                    style={{ height: "3rem", padding: "0 2.2rem",
                      background: "#8d6b3d", color: "#fff", fontWeight: 700,
                      boxShadow: "0 4px 28px rgba(141,107,61,0.32), inset 0 1px 0 rgba(176,138,88,0.28)" }}>
                    Buy Paperback — K400
                  </Button>
                </motion.div>
              </Link>
              <Link href="/shop">
                <motion.div whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" variant="outline" onClick={() => setProductType("hardcover")}
                    className="font-sans uppercase w-full sm:w-auto"
                    style={{ height: "3rem", padding: "0 2.2rem",
                      color: "hsl(40,22%,60%)", background: "transparent" }}>
                    Hardcover — K500
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-7"
              style={{ borderTop: "1px solid hsl(220,38%,14%)" }}>
              {[
                { to: 6,   suffix: "+",     label: "Cities Served" },
                { to: 256,                  label: "Pages"         },
                { to: 5.0, decimals: 1, prefix: "★ ", label: "Avg Rating" },
              ].map((s, i) => (
                <div key={s.label} className="flex items-center gap-8">
                  {i > 0 && <div className="hidden sm:block w-px h-8" style={{ background: "hsl(220,38%,16%)" }} />}
                  <StatItem {...s} />
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ──────────── RIGHT: book showcase ──────────── */}
          <motion.div ref={panelRef} style={{ y: bookY }}
            onMouseMove={handleBookMouseMove} onMouseLeave={handleBookMouseLeave}
            className="hidden lg:flex flex-col items-center justify-center relative overflow-hidden">

            {/* Panel bg */}
            <div className="absolute inset-0" style={{ background: "hsl(222,58%,5%)" }} />

            {/* Gold vertical separator */}
            <div className="absolute left-0 top-[10%] bottom-[10%] w-px"
              style={{ background: "linear-gradient(180deg, transparent, hsl(42,78%,48%,0.22) 22%, hsl(42,78%,48%,0.22) 78%, transparent)" }} />

            {/* Deep background bloom */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "radial-gradient(ellipse 90% 70% at 55% 42%, hsl(42,72%,42%,0.11) 0%, hsl(222,72%,18%,0.18) 45%, transparent 70%)",
              filter: "blur(32px)",
            }} />

            {/* Tight hot spotlight behind book */}
            <div className="absolute pointer-events-none" style={{
              top: "8%", left: "50%", transform: "translateX(-50%)",
              width: "320px", height: "420px",
              background: "radial-gradient(ellipse 55% 65% at 50% 38%, hsl(42,90%,62%,0.13) 0%, hsl(42,60%,50%,0.06) 50%, transparent 72%)",
              filter: "blur(12px)",
            }} />

            {/* Floating gold orbs */}
            {[
              { top: "14%", left: "12%", size: 6, opacity: 0.35, delay: 0 },
              { top: "22%", right: "10%", size: 4, opacity: 0.25, delay: 0.6 },
              { top: "68%", left: "8%",  size: 5, opacity: 0.3,  delay: 1.1 },
              { top: "76%", right: "14%",size: 7, opacity: 0.2,  delay: 0.3 },
            ].map((o, i) => (
              <motion.div key={i}
                className="absolute rounded-full pointer-events-none"
                style={{
                  top: o.top, left: (o as { left?: string }).left, right: (o as { right?: string }).right,
                  width: o.size, height: o.size,
                  background: "hsl(42,90%,62%)",
                  opacity: o.opacity,
                  boxShadow: `0 0 ${o.size * 3}px hsl(42,90%,62%,0.6)`,
                }}
                animate={{ y: [0, -7, 0], opacity: [o.opacity, o.opacity * 1.7, o.opacity] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: o.delay }}
              />
            ))}

            {/* Book photo + reflection */}
            <motion.div
              initial={{ opacity: 0, y: 48, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.18, duration: 1.15, ease: EASE }}
              className="relative z-10 flex flex-col items-center"
              style={{ perspective: "1400px" }}
            >
              <motion.div style={{ rotateY: springRotY, rotateX: springRotX, transformStyle: "preserve-3d" }}
                className="relative">
                {/* Gold rim glow */}
                <div className="absolute -inset-[3px] rounded-[14px] pointer-events-none" style={{
                  background: "linear-gradient(135deg, hsl(42,90%,62%,0.45), hsl(42,60%,40%,0.1) 50%, hsl(42,90%,62%,0.3))",
                  filter: "blur(2px)",
                  zIndex: -1,
                }} />
                <img
                  src={bookPhoto}
                  alt="Uncommon Denominators — physical book"
                  style={{
                    width: "clamp(240px,23vw,305px)",
                    height: "auto",
                    display: "block",
                    borderRadius: "12px",
                    boxShadow: "0 48px 96px rgba(0,0,0,0.65), 0 16px 36px rgba(0,0,0,0.4), 0 0 0 1px hsl(42,60%,50%,0.15)",
                  }}
                />
              </motion.div>

              {/* Mirror reflection */}
              <div style={{
                width: "clamp(240px,23vw,305px)",
                overflow: "hidden",
                height: "60px",
                marginTop: "2px",
                borderRadius: "0 0 12px 12px",
                flexShrink: 0,
              }}>
                <img
                  src={bookPhoto}
                  alt=""
                  aria-hidden="true"
                  style={{
                    width: "100%",
                    display: "block",
                    transform: "scaleY(-1)",
                    opacity: 0.18,
                    maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)",
                    WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)",
                    filter: "blur(1px)",
                  }}
                />
              </div>
            </motion.div>

            {/* Edition price strip */}
            <motion.div
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.58, duration: 0.7, ease: EASE }}
              className="relative z-10 flex gap-2 mt-5 w-full max-w-[305px] px-6"
            >
              {[
                { label: "Paperback", price: "K400", type: "paperback" as const },
                { label: "Hardcover", price: "K500", type: "hardcover" as const },
              ].map(({ label, price, type }) => (
                <Link href="/shop" key={type} className="flex-1">
                  <motion.div whileHover={{ y: -3, borderColor: "hsl(42,78%,50%,0.5)" }}
                    onClick={() => setProductType(type)}
                    className="flex flex-col items-center gap-0.5 py-3 rounded-xl cursor-pointer"
                    style={{
                      background: "hsl(222,55%,8%,0.85)",
                      border: "1px solid hsl(220,36%,18%,0.8)",
                      backdropFilter: "blur(18px)",
                      WebkitBackdropFilter: "blur(18px)",
                    }}>
                    <span className="font-sans text-[0.5rem] tracking-[0.28em] uppercase font-semibold"
                      style={{ color: "hsl(220,18%,38%)" }}>{label}</span>
                    <span className="font-display font-bold text-[1.18rem]"
                      style={{ color: "hsl(42,78%,60%)" }}>{price}</span>
                  </motion.div>
                </Link>
              ))}
            </motion.div>

            {/* Rating */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.95, duration: 0.6 }}
              className="relative z-10 flex items-center gap-2 mt-4">
              <div className="flex gap-[2px]">
                {[1,2,3,4,5].map(i => <Star key={i} className="h-2.5 w-2.5 fill-current" style={{ color: "hsl(42,78%,52%)" }} />)}
              </div>
              <span className="font-sans text-[0.58rem] tracking-wide" style={{ color: "hsl(220,16%,38%)" }}>
                5.0 · Nationwide delivery
              </span>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll cue — horizontal + label */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.8 }}
          className="absolute bottom-7 left-8 lg:left-16 xl:left-24 flex items-center gap-3">
          <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}>
            <ChevronDown className="h-3.5 w-3.5" style={{ color: "hsl(220,18%,32%)", transform: "rotate(-90deg)" }} />
          </motion.div>
          <span className="font-sans text-[0.52rem] tracking-[0.38em] uppercase" style={{ color: "hsl(220,18%,30%)" }}>
            Scroll to explore
          </span>
          <div className="h-px max-w-[36px] w-full" style={{ background: "hsl(220,38%,16%)" }} />
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
      <section className="py-14 lg:py-28 container mx-auto px-5 sm:px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-28 items-center">
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
              style={{ fontSize: "clamp(1.7rem,3vw,2.4rem)", lineHeight: 1.15 }}
            >
              A Book Zambia{" "}
              <span className="gold-shimmer" style={{ WebkitTextFillColor: "transparent" }}>
                Needs to Read
              </span>
            </motion.h2>
            <motion.div variants={fadeUp} className="gold-line-left w-14 mb-7" />
            <motion.p
              variants={fadeUp}
              className="font-serif text-muted-foreground leading-relaxed mb-4"
              style={{ fontSize: "clamp(1rem,1.6vw,1.1rem)" }}
            >
              Uncommon Denominators is not a complaint about Zambia. It is a
              clear-eyed, evidence-based examination of why the country's growth
              has not translated into transformation — and what it would take
              to change that.
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="font-serif text-muted-foreground leading-relaxed mb-10"
              style={{ fontSize: "clamp(1rem,1.6vw,1.1rem)" }}
            >
              Eight chapters. Eight structural obstacles: resource dependence,
              agricultural stagnation, infrastructure deficits, fiscal pressures,
              human capital gaps, weak private sector, governance constraints,
              and the path forward.
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

          {/* Book photo */}
          <Reveal>
            <motion.div variants={fadeUp} className="relative">
              {/* Soft shadow halo */}
              <div className="absolute -inset-6 rounded-3xl pointer-events-none"
                style={{ background: "radial-gradient(ellipse, hsl(42,78%,46%,0.08) 0%, transparent 70%)", filter: "blur(18px)" }} />
              <motion.div
                whileHover={{ scale: 1.015, y: -4 }}
                transition={{ type: "spring", stiffness: 200, damping: 22 }}
                className="relative rounded-2xl overflow-hidden shadow-2xl"
                style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.12)" }}
              >
                <img
                  src={bookPhoto}
                  alt="Uncommon Denominators — physical book"
                  className="w-full h-auto block"
                  style={{ display: "block" }}
                />
                {/* Subtle gold bottom fade */}
                <div className="absolute bottom-0 inset-x-0 h-24 pointer-events-none"
                  style={{ background: "linear-gradient(to top, hsl(42,78%,46%,0.08), transparent)" }} />
              </motion.div>
            </motion.div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════ EDITIONS (dark) ══ */}
      <section
        className="py-14 lg:py-28 relative"
        style={{ background: "hsl(220,52%,9%)" }}
      >

        <div className="container mx-auto px-5 sm:px-6 lg:px-10">
          <Reveal className="text-center mb-8 lg:mb-16">
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
                fontSize: "clamp(1.7rem,3vw,2.4rem)",
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
                  className="rounded-2xl p-5 sm:p-9"
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
                    {fmtMoney(paperback.priceKwacha)}
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
                      className="w-full uppercase"
                      style={{
                        height:     "3rem",
                        background: "#8d6b3d",
                        color:      "#fff",
                        fontWeight: 700,
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
                  className="rounded-2xl p-5 sm:p-9 relative overflow-hidden"
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
                      className="font-display text-[0.55rem] tracking-[0.2em] uppercase border rounded-full px-2.5 py-1"
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
                    {fmtMoney(hardcover.priceKwacha)}
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
                      className="w-full uppercase shadow-xl"
                      style={{
                        height:     "3rem",
                        background: "#8d6b3d",
                        color:      "#fff",
                        fontWeight: 700,
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

      </section>

      {/* ══════════════════════════════════════ AUTHOR ══ */}
      <section className="py-14 lg:py-28 container mx-auto px-5 sm:px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-28 items-center">
          {/* Portrait */}
          <Reveal className="flex justify-center order-2 lg:order-1">
            <motion.div variants={fadeLeft} className="relative">
              <div
                className="w-64 h-64 lg:w-80 lg:h-80 rounded-3xl flex items-center justify-center shadow-2xl"
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
                    MM
                  </div>
                  <div
                    className="font-sans text-[0.6rem] tracking-[0.28em] uppercase"
                    style={{ color: "hsl(40,22%,38%)" }}
                  >
                    Mwanalushi &amp; Nalishebo
                  </div>
                </div>
              </div>
              {/* Credential card */}
              <motion.div
                initial={{ opacity: 0, x: 12, y: 12 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35, duration: 0.55, ease: EASE }}
                className="absolute -bottom-5 -right-5 rounded-2xl px-5 py-4 shadow-xl bg-card border border-border"
              >
                <p className="font-display text-[0.72rem] font-bold tracking-wider text-foreground">
                  Senior Economists
                </p>
                <p className="font-sans text-[0.68rem] text-muted-foreground mt-0.5">
                  ZIPAR, Zambia
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
              The Authors
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="font-display font-bold text-foreground mb-5"
              style={{ fontSize: "clamp(1.7rem,3vw,2.4rem)" }}
            >
              Mwanalushi &amp; Nalishebo
            </motion.h2>
            <motion.div variants={fadeUp} className="gold-line-left w-14 mb-7" />
            <motion.p
              variants={fadeUp}
              className="font-serif text-muted-foreground leading-relaxed mb-4"
              style={{ fontSize: "clamp(1rem,1.6vw,1.1rem)" }}
            >
              Monde Mwanalushi and Eric Nalishebo are Senior Economists at the
              Zambia Institute for Policy Analysis and Research (ZIPAR), bringing
              over fifteen years of combined research on fiscal policy, economic
              diversification, and Zambia's development agenda.
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="font-serif text-muted-foreground leading-relaxed mb-10"
              style={{ fontSize: "clamp(1rem,1.6vw,1.1rem)" }}
            >
              Uncommon Denominators draws on years of fieldwork, budget analysis,
              and policy research — a book written for everyone who wants to
              understand Zambia's economic story, not just read about it.
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
          className="py-14 lg:py-28 relative overflow-hidden"
          style={{ background: "hsl(220,52%,9%)" }}
        >

          <div className="container mx-auto px-5 sm:px-6 lg:px-10">
            <Reveal className="text-center mb-8 lg:mb-16">
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
                  fontSize: "clamp(1.7rem,3vw,2.4rem)",
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
                  className="rounded-2xl p-8 flex flex-col"
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

        </section>
      )}

    </div>
  );
}
