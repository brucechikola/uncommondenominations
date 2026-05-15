import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { PAGE_BG, CARD_BG, CARD_BORDER, GOLD, TEXT_PRIMARY, TEXT_MUTED, TEXT_DIM } from "@/components/purchase-ui";

const EASE = [0.22, 1, 0.36, 1] as const;

const timeline = [
  { year: "2010", event: "Monde Mwanalushi joins Zambia Institute for Policy Analysis and Research (ZIPAR)" },
  { year: "2013", event: "Eric Nalishebo appointed Research Fellow in Economics at ZIPAR" },
  { year: "2015", event: "Joint paper on Zambia's fiscal policy presented at the African Economic Research Consortium" },
  { year: "2017", event: "Mwanalushi appointed Senior Economist at ZIPAR" },
  { year: "2019", event: "Collaborative research on mining sector taxation and economic diversification begins" },
  { year: "2022", event: "Combined research shortlisted for the AERC Policy Award" },
  { year: "2025", event: "Manuscript of Uncommon Denominators completed" },
  { year: "2026", event: "Uncommon Denominators published by LIBROS Academic Publishing" },
];

const stats = [
  { value: "15+", label: "Years Combined Research" },
  { value: "30+", label: "Policy Papers" },
  { value: "2",   label: "Authors" },
  { value: "1",   label: "Essential Book" },
];

export default function AboutAuthor() {
  return (
    <div style={{ background: PAGE_BG, minHeight: "100svh" }} className="overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="relative pt-20 pb-12 lg:pt-28 lg:pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 0 }}>
          <div style={{
            width: "900px", height: "500px",
            background: "radial-gradient(ellipse, hsl(42,78%,46%,0.07) 0%, transparent 65%)",
            filter: "blur(30px)",
          }} />
        </div>

        <div className="relative z-10 container mx-auto px-5 sm:px-6 max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">

            {/* Monde Mwanalushi */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>
              <p className="font-sans text-[0.6rem] tracking-[0.32em] uppercase font-semibold mb-5"
                style={{ color: GOLD }}>The Authors</p>
              <h1 className="font-display font-bold leading-[1.05] mb-4"
                style={{ fontSize: "clamp(2.2rem,4.5vw,3.6rem)", color: TEXT_PRIMARY }}>
                Monde<br />Mwanalushi
              </h1>
              <div className="w-14 h-[2px] mb-5" style={{ background: `linear-gradient(90deg,${GOLD},transparent)` }} />
              <p className="font-serif text-base leading-relaxed mb-4" style={{ color: TEXT_MUTED }}>
                Senior Economist · Policy Analyst · Author
              </p>
              <p className="font-sans text-[0.85rem] leading-relaxed max-w-lg" style={{ color: TEXT_DIM }}>
                Monde Mwanalushi is a Senior Economist at the Zambia Institute for Policy Analysis and
                Research (ZIPAR), where he leads research on fiscal policy, natural resource management,
                and economic diversification. His work has directly informed government budget frameworks
                and development strategies across Zambia.
              </p>

              <div className="mt-10">
                <h2 className="font-display font-bold leading-[1.05] mb-4"
                  style={{ fontSize: "clamp(2.2rem,4.5vw,3.6rem)", color: TEXT_PRIMARY }}>
                  Eric<br />Nalishebo
                </h2>
                <div className="w-14 h-[2px] mb-5" style={{ background: `linear-gradient(90deg,${GOLD},transparent)` }} />
                <p className="font-serif text-base leading-relaxed mb-4" style={{ color: TEXT_MUTED }}>
                  Research Fellow · Development Economist · Author
                </p>
                <p className="font-sans text-[0.85rem] leading-relaxed max-w-lg" style={{ color: TEXT_DIM }}>
                  Eric Nalishebo is a Research Fellow in Economics at ZIPAR specialising in development
                  economics, public finance, and Zambia's structural transformation agenda. He has
                  published widely on topics from mining taxation to agricultural productivity and
                  human capital investment.
                </p>
              </div>
            </motion.div>

            {/* Portrait cards — hidden on mobile, shown alongside on desktop */}
            <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.7, ease: EASE }}
              className="hidden lg:flex flex-col gap-6 mt-8 lg:mt-16">
              {[
                { initials: "MM", name: "Monde Mwanalushi", role: "Senior Economist · ZIPAR" },
                { initials: "EN", name: "Eric Nalishebo",   role: "Research Fellow · ZIPAR" },
              ].map(({ initials, name, role }) => (
                <div key={initials} className="relative mx-auto w-full" style={{ maxWidth: 300 }}>
                  <div className="absolute -inset-3 rounded-2xl opacity-25" style={{
                    background: `linear-gradient(135deg, ${GOLD}, transparent 60%)`,
                    filter: "blur(12px)",
                  }} />
                  <div className="relative rounded-2xl overflow-hidden flex items-center gap-5 px-6 py-5"
                    style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                    <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "hsl(42,78%,46%,0.1)",
                        border: `2px solid hsl(42,78%,46%,0.3)`,
                        boxShadow: `0 0 28px hsl(42,78%,46%,0.1)`,
                      }}>
                      <span className="font-display font-bold text-base" style={{ color: GOLD }}>{initials}</span>
                    </div>
                    <div>
                      <p className="font-display font-bold text-sm mb-0.5" style={{ color: TEXT_PRIMARY }}>{name}</p>
                      <p className="font-sans text-[0.62rem] tracking-[0.12em] uppercase" style={{ color: TEXT_DIM }}>{role}</p>
                    </div>
                  </div>
                </div>
              ))}
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
      <section className="py-12 lg:py-24">
        <div className="container mx-auto px-5 sm:px-6 max-w-5xl">
          <div className="grid lg:grid-cols-[280px,1fr] gap-8 lg:gap-16">

            {/* Sidebar info — shows after bio on mobile, left col on desktop */}
            <motion.div initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ ease: EASE }}
              className="order-2 lg:order-1">
              <div className="rounded-2xl p-5 sm:p-6 space-y-4 sm:space-y-5 lg:sticky lg:top-24"
                style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                <h3 className="font-sans text-[0.58rem] tracking-[0.28em] uppercase font-bold" style={{ color: GOLD }}>
                  At a Glance
                </h3>
                {[
                  { label: "Based in",    value: "Lusaka, Zambia" },
                  { label: "Institution", value: "ZIPAR — Zambia Institute for Policy Analysis and Research" },
                  { label: "Specialties", value: "Fiscal Policy, Economic Diversification, Mining Economics" },
                  { label: "Publisher",   value: "LIBROS Academic Publishing" },
                  { label: "Editions",    value: "Paperback (K400) & Hardcover (K500)" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ borderBottom: `1px solid ${CARD_BORDER}`, paddingBottom: "0.875rem" }}>
                    <p className="font-sans text-[0.58rem] tracking-[0.15em] uppercase mb-1" style={{ color: TEXT_DIM }}>{label}</p>
                    <p className="font-sans text-[0.8rem] font-medium" style={{ color: TEXT_PRIMARY }}>{value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Bio copy — shows first on mobile */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ ease: EASE }}
              className="order-1 lg:order-2">
              <h2 className="font-display font-bold mb-8" style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", color: TEXT_PRIMARY }}>
                About the Authors
              </h2>
              <div className="space-y-5 font-sans text-[0.88rem] leading-[1.85]" style={{ color: TEXT_MUTED }}>
                <p>
                  Monde Mwanalushi and Eric Nalishebo are both Senior Economists at the Zambia Institute for
                  Policy Analysis and Research — an independent think tank established to inform evidence-based
                  public policy in Zambia. Together they bring over fifteen years of rigorous economic research
                  to this work.
                </p>
                <p>
                  Their collaboration began as a response to a question they kept returning to in their separate
                  research streams: why, despite decades of economic programmes, significant natural resource
                  wealth, and a relatively stable political environment, does Zambia continue to struggle with
                  structural transformation? What are the recurring factors — some visible, some hidden — that
                  keep holding back sustained, inclusive growth?
                </p>
                <p>
                  <em>Uncommon Denominators</em> is the product of that inquiry. It draws on field research,
                  budget analysis, interviews with policymakers and business leaders, and the accumulated body
                  of economic literature on sub-Saharan development to build a clear, unflinching portrait of
                  the obstacles Zambia faces — and the choices available to overcome them.
                </p>
                <p>
                  The book is written to be accessible to anyone who cares about Zambia's future — not only
                  economists and academics, but policymakers, business owners, students, and engaged citizens
                  who want to understand the real picture and act on it.
                </p>
              </div>

              {/* Pull quote */}
              <div className="mt-12 pl-8 py-2" style={{ borderLeft: `3px solid hsl(42,78%,46%,0.4)` }}>
                <p className="font-serif italic text-lg leading-relaxed" style={{ color: TEXT_MUTED }}>
                  "We did not write this book to be pessimistic. We wrote it because we believe Zambia has
                  every ingredient for prosperity — and that understanding the obstacles clearly is the
                  first step to removing them."
                </p>
                <p className="font-sans text-[0.68rem] tracking-[0.14em] uppercase mt-4 font-semibold" style={{ color: GOLD }}>
                  — Mwanalushi & Nalishebo
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="py-12 lg:py-20" style={{ borderTop: `1px solid ${CARD_BORDER}` }}>
        <div className="container mx-auto px-5 sm:px-6 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="font-sans text-[0.6rem] tracking-[0.3em] uppercase font-semibold mb-4 text-center" style={{ color: GOLD }}>
              Research Journey
            </p>
            <h2 className="font-display font-bold text-center mb-16" style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", color: TEXT_PRIMARY }}>
              From Research to Publication
            </h2>
          </motion.div>

          <div className="relative">
            <div className="absolute left-[5.5rem] top-0 bottom-0 w-px" style={{ background: `hsl(42,78%,46%,0.15)` }} />
            <div className="space-y-8">
              {timeline.map((item, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.07, ease: EASE }}
                  className="flex gap-6 items-start">
                  <div className="w-16 text-right font-display font-bold text-sm flex-shrink-0"
                    style={{ color: GOLD }}>{item.year}</div>
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
              Read Their Work
            </p>
            <h2 className="font-display font-bold mb-4" style={{ fontSize: "clamp(1.5rem,3vw,2rem)", color: TEXT_PRIMARY }}>
              Uncommon Denominators
            </h2>
            <p className="font-sans text-[0.88rem] leading-relaxed mb-10" style={{ color: TEXT_DIM }}>
              Now available in paperback (K400) and hardcover (K500) across Zambia.
            </p>
            <Link href="/shop">
              <motion.div whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }} className="inline-block">
                <Button className="uppercase"
                  style={{ height: "3rem", padding: "0 3rem",
                    background: GOLD, color: "#fff", fontWeight: 700, boxShadow: "0 4px 28px rgba(141,107,61,0.3)" }}>
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
