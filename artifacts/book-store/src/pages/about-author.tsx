import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { PAGE_BG, CARD_BG, CARD_BORDER, GOLD, TEXT_PRIMARY, TEXT_MUTED, TEXT_DIM } from "@/components/purchase-ui";

const EASE = [0.22, 1, 0.36, 1] as const;

const timeline = [
  { year: "1974", event: "Born in Ndola, Copperbelt Province" },
  { year: "1996", event: "BA Psychology, University of Zambia" },
  { year: "1999", event: "MA Organizational Psychology, University of Zimbabwe" },
  { year: "2005", event: "PhD in Community Psychology, UNZA" },
  { year: "2006", event: "Founded the Lumina Institute for Human Development" },
  { year: "2012", event: "Appointed Chairperson of the Zambia Psychology Council" },
  { year: "2018", event: "Named among Africa's Top 50 Thought Leaders" },
  { year: "2026", event: "Published The Luminous Path" },
];

const stats = [
  { value: "20+", label: "Years of Practice" },
  { value: "10k+", label: "Lives Impacted" },
  { value: "4",    label: "Languages Spoken" },
  { value: "1",    label: "Essential Book" },
];

export default function AboutAuthor() {
  return (
    <div style={{ background: PAGE_BG, minHeight: "100svh" }} className="overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        {/* Gold glow bloom */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 0 }}>
          <div style={{
            width: "900px", height: "500px",
            background: "radial-gradient(ellipse, hsl(42,78%,46%,0.07) 0%, transparent 65%)",
            filter: "blur(30px)",
          }} />
        </div>

        <div className="relative z-10 container mx-auto px-6 max-w-5xl">
          <div className="grid lg:grid-cols-[1fr,360px] gap-16 items-center">

            {/* Left: text */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>
              <p className="font-sans text-[0.6rem] tracking-[0.32em] uppercase font-semibold mb-5"
                style={{ color: GOLD }}>The Author</p>
              <h1 className="font-display font-bold leading-[1.05] mb-6"
                style={{ fontSize: "clamp(2.8rem,6vw,5rem)", color: TEXT_PRIMARY }}>
                Dr. Amara<br />Zulu
              </h1>
              <div className="w-14 h-[2px] mb-7" style={{ background: `linear-gradient(90deg,${GOLD},transparent)` }} />
              <p className="font-serif text-lg leading-relaxed mb-8" style={{ color: TEXT_MUTED }}>
                Psychologist. Educator. Author. Zambian.
              </p>
              <p className="font-sans text-[0.85rem] leading-relaxed max-w-lg" style={{ color: TEXT_DIM }}>
                For over two decades, Dr. Amara Zulu has worked at the intersection of community psychology, 
                leadership, and purposeful living — helping thousands across Zambia and the continent find 
                clarity, direction, and the courage to build meaningful lives.
              </p>
            </motion.div>

            {/* Right: portrait card */}
            <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.7, ease: EASE }}>
              <div className="relative mx-auto" style={{ maxWidth: 320 }}>
                {/* Decorative frame */}
                <div className="absolute -inset-3 rounded-2xl opacity-30" style={{
                  background: `linear-gradient(135deg, ${GOLD}, transparent 60%)`,
                  filter: "blur(12px)",
                }} />
                <div className="relative rounded-2xl overflow-hidden"
                  style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, aspectRatio: "3/4" }}>
                  {/* Portrait placeholder */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                      <div className="w-28 h-28 rounded-full flex items-center justify-center"
                        style={{
                          background: "hsl(42,78%,46%,0.1)",
                          border: `2px solid hsl(42,78%,46%,0.3)`,
                          boxShadow: `0 0 48px hsl(42,78%,46%,0.12)`,
                        }}>
                        <span className="font-display font-bold" style={{ fontSize: "2.4rem", color: GOLD }}>AZ</span>
                      </div>
                      <div className="absolute -inset-3 rounded-full" style={{
                        border: `1px solid hsl(42,78%,46%,0.15)`,
                      }} />
                    </div>
                    <div className="text-center px-8">
                      <p className="font-display font-bold text-sm mb-1" style={{ color: TEXT_PRIMARY }}>Dr. Amara Zulu</p>
                      <p className="font-sans text-[0.65rem] tracking-[0.15em] uppercase" style={{ color: TEXT_DIM }}>PhD Psychology · UNZA</p>
                    </div>
                  </div>
                  {/* Bottom gradient overlay */}
                  <div className="absolute bottom-0 inset-x-0 h-32"
                    style={{ background: `linear-gradient(to top, ${PAGE_BG}, transparent)` }} />
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section style={{ borderTop: `1px solid ${CARD_BORDER}`, borderBottom: `1px solid ${CARD_BORDER}` }}>
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {stats.map(({ value, label }, i) => (
              <motion.div key={label}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08, ease: EASE }}
                className="flex flex-col items-center justify-center py-9 gap-1.5"
                style={{ borderRight: i < stats.length - 1 ? `1px solid ${CARD_BORDER}` : undefined }}>
                <span className="font-display font-bold" style={{ fontSize: "2rem", color: GOLD }}>{value}</span>
                <span className="font-sans text-[0.62rem] tracking-[0.18em] uppercase" style={{ color: TEXT_DIM }}>{label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bio ── */}
      <section className="py-24">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid lg:grid-cols-[280px,1fr] gap-16">

            {/* Sidebar info */}
            <motion.div initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ ease: EASE }}>
              <div className="rounded-2xl p-6 space-y-5 sticky top-24"
                style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                <h3 className="font-sans text-[0.58rem] tracking-[0.28em] uppercase font-bold" style={{ color: GOLD }}>
                  At a Glance
                </h3>
                {[
                  { label: "Based in",   value: "Lusaka, Zambia" },
                  { label: "Specialty",  value: "Community & Organizational Psychology" },
                  { label: "Institute",  value: "Lumina Institute for Human Development" },
                  { label: "Languages", value: "English, Nyanja, Bemba, Tonga" },
                  { label: "Education", value: "PhD, University of Zambia" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ borderBottom: `1px solid ${CARD_BORDER}`, paddingBottom: "0.875rem" }}>
                    <p className="font-sans text-[0.58rem] tracking-[0.15em] uppercase mb-1" style={{ color: TEXT_DIM }}>{label}</p>
                    <p className="font-sans text-[0.8rem] font-medium" style={{ color: TEXT_PRIMARY }}>{value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Bio copy */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ ease: EASE }}>
              <h2 className="font-display font-bold mb-8" style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", color: TEXT_PRIMARY }}>
                About Dr. Zulu
              </h2>
              <div className="space-y-5 font-sans text-[0.88rem] leading-[1.85]" style={{ color: TEXT_MUTED }}>
                <p>
                  Dr. Amara Zulu grew up in Ndola during the final years of the Second Republic — a time of upheaval and resilience that shaped her understanding of the human capacity to endure and transform. The eldest of six children, she was the first in her family to attend university.
                </p>
                <p>
                  After completing her doctorate at the University of Zambia, Dr. Zulu founded the Lumina Institute for Human Development — a Lusaka-based organization that has worked with thousands of individuals, schools, and organizations across the country, offering psychological support, leadership training, and community development programs.
                </p>
                <p>
                  Her work has taken her from rural villages in the Northern Province to boardrooms in Lusaka and Ndola; from primary schools on the Copperbelt to international conferences in Nairobi, Johannesburg, and London. Everywhere she goes, she carries the same conviction: that the tools people need to live well already exist — they simply need to be organized, articulated, and made accessible.
                </p>
                <p>
                  The Luminous Path is the culmination of that conviction. It is the book Dr. Zulu has been preparing to write her entire career — and she wrote it, she says, primarily for the person she was at twenty-three: brilliant, hungry, overwhelmed, and without a map.
                </p>
              </div>

              {/* Pull quote */}
              <div className="mt-12 pl-8 py-2" style={{ borderLeft: `3px solid hsl(42,78%,46%,0.4)` }}>
                <p className="font-serif italic text-lg leading-relaxed" style={{ color: TEXT_MUTED }}>
                  "I did not write this book for the person who has it all figured out. I wrote it for the person who is trying — and hasn't yet been given a map."
                </p>
                <p className="font-sans text-[0.68rem] tracking-[0.14em] uppercase mt-4 font-semibold" style={{ color: GOLD }}>
                  — Dr. Amara Zulu
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="py-20" style={{ borderTop: `1px solid ${CARD_BORDER}` }}>
        <div className="container mx-auto px-6 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="font-sans text-[0.6rem] tracking-[0.3em] uppercase font-semibold mb-4 text-center" style={{ color: GOLD }}>
              Life & Career
            </p>
            <h2 className="font-display font-bold text-center mb-16" style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", color: TEXT_PRIMARY }}>
              A Life's Journey
            </h2>
          </motion.div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[5.5rem] top-0 bottom-0 w-px" style={{ background: `hsl(42,78%,46%,0.15)` }} />

            <div className="space-y-8">
              {timeline.map((item, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.07, ease: EASE }}
                  className="flex gap-6 items-start">
                  <div className="w-16 text-right font-display font-bold text-sm flex-shrink-0"
                    style={{ color: GOLD }}>{item.year}</div>
                  {/* Dot */}
                  <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1 relative z-10"
                    style={{ background: GOLD, boxShadow: `0 0 10px hsl(42,78%,46%,0.4)` }} />
                  <p className="font-sans text-[0.83rem] leading-relaxed" style={{ color: TEXT_MUTED }}>{item.event}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20" style={{ borderTop: `1px solid ${CARD_BORDER}` }}>
        <div className="container mx-auto px-6 text-center max-w-xl">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="font-sans text-[0.6rem] tracking-[0.3em] uppercase font-semibold mb-5" style={{ color: GOLD }}>
              Read Her Work
            </p>
            <h2 className="font-display font-bold mb-4" style={{ fontSize: "clamp(1.5rem,3vw,2rem)", color: TEXT_PRIMARY }}>
              The Luminous Path
            </h2>
            <p className="font-sans text-[0.88rem] leading-relaxed mb-10" style={{ color: TEXT_DIM }}>
              Now available in paperback (K400) and hardcover (K500) across Zambia.
            </p>
            <Link href="/shop">
              <motion.div whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }} className="inline-block">
                <Button className="font-display tracking-[0.18em] uppercase border-0"
                  style={{ fontSize: "0.72rem", height: "3rem", padding: "0 3rem",
                    background: GOLD, color: "hsl(222,58%,7%)", boxShadow: "0 4px 28px hsl(42,78%,46%,0.3)" }}>
                  Order Your Copy
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
