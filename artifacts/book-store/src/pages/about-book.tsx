import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const chapters = [
  { num: "01", title: "The Growth Paradox", desc: "Zambia's GDP has grown — yet poverty persists. This chapter unpacks the contradiction at the heart of the development story and sets the analytical framework for the book." },
  { num: "02", title: "The Resource Curse, Revisited", desc: "Why copper wealth has not translated into durable prosperity — and what the data reveals about revenue management, reinvestment, and the political economy of resource dependence." },
  { num: "03", title: "Agriculture's Broken Promise", desc: "Zambia has fertile land, water, and a large rural workforce. This chapter examines why agricultural productivity remains stubbornly low and what structural reforms could unlock the sector." },
  { num: "04", title: "The Infrastructure Gap", desc: "Roads, power, logistics, and connectivity: a rigorous assessment of how infrastructure deficits raise the cost of doing business and crowd out private investment across every sector." },
  { num: "05", title: "Human Capital — The Long Game", desc: "Education, health, and skills development as determinants of long-run growth. The chapter traces the gap between enrolment statistics and actual learning outcomes." },
  { num: "06", title: "Governance and the Fiscal Trap", desc: "Public finance, debt, and the incentive structures that shape how governments tax, spend, and borrow — with implications for Zambia's medium-term fiscal path." },
  { num: "07", title: "The Private Sector Paradox", desc: "Why Zambia's private sector remains small, informal, and risk-averse — and what the regulatory environment, access to finance, and market structure have to do with it." },
  { num: "08", title: "Uncommon Denominators", desc: "The concluding chapter synthesises the themes: the recurring factors that explain underperformance across sectors, and the strategic priorities that offer the most credible path forward." },
];

export default function AboutBook() {
  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="pt-12 pb-8 sm:pt-16 sm:pb-12 md:py-24 bg-gradient-to-b from-muted/60 to-background">
        <div className="container mx-auto px-5 sm:px-6 max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-xs tracking-[0.3em] uppercase text-primary font-medium mb-4">The Book</p>
            <h1 className="font-serif text-[2.2rem] sm:text-5xl lg:text-6xl font-bold leading-tight mb-5">Uncommon Denominators</h1>
            <p className="text-base sm:text-xl text-muted-foreground leading-relaxed">
              Understanding what holds back Zambia's economic transformation — a rigorous, accessible diagnosis
              from two of the country's leading economists.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-10 md:py-16 container mx-auto px-5 sm:px-6 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-serif text-3xl font-bold mb-6">About the Book</h2>
          <div className="prose prose-stone max-w-none space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Zambia should be prosperous. It has copper, cobalt, arable land, water, a young population, and
              decades of relative political stability. And yet: persistent poverty, recurring fiscal crises,
              low productivity, and structural dependence on a single commodity. Why?
            </p>
            <p>
              <em>Uncommon Denominators</em> is Monde Mwanalushi and Eric Nalishebo's attempt to answer that
              question honestly. Drawing on years of policy research at ZIPAR, field data, budget analysis,
              and the broader literature on African economic development, they identify the recurring
              factors — across sectors and administrations — that explain Zambia's underperformance.
            </p>
            <p>
              The book is not a counsel of despair. Each chapter concludes with concrete, evidence-based
              recommendations. The authors believe Zambia has the ingredients for transformation — but that
              transformation requires clear diagnosis before it can produce durable prescription.
            </p>
            <p className="font-medium text-foreground italic font-serif text-lg">
              "We did not write this book to be pessimistic. We wrote it because we believe Zambia has every
              ingredient for prosperity — and that understanding the obstacles clearly is the first step to
              removing them." — Mwanalushi & Nalishebo
            </p>
          </div>
        </motion.div>
      </section>

      {/* Chapters */}
      <section className="py-10 md:py-16 bg-muted/30">
        <div className="container mx-auto px-5 sm:px-6 max-w-4xl">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 text-center">What's Inside</h2>
          <div className="space-y-3">
            {chapters.map((c, i) => (
              <motion.div key={c.num} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="flex gap-4 sm:gap-6 bg-card border border-card-border rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow">
                <div className="font-serif text-2xl sm:text-3xl font-bold text-primary/30 flex-shrink-0 w-9 sm:w-12">{c.num}</div>
                <div className="min-w-0">
                  <h3 className="font-serif font-bold text-base sm:text-lg mb-1">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Book specs */}
      <section className="py-10 md:py-16 container mx-auto px-5 sm:px-6 max-w-3xl">
        <h2 className="font-serif text-2xl font-bold mb-6 sm:mb-8">Book Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {[
            { label: "Pages",        value: "248" },
            { label: "Language",     value: "English" },
            { label: "Format",       value: "Paperback & Hardcover" },
            { label: "Publisher",    value: "LIBROS" },
          ].map((d) => (
            <div key={d.label} className="bg-card border border-card-border rounded-xl p-5 text-center">
              <div className="font-serif text-2xl font-bold text-primary mb-1">{d.value}</div>
              <div className="text-xs text-muted-foreground">{d.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-6 text-center max-w-2xl">
          <h2 className="font-serif text-3xl font-bold mb-4">Ready to Read?</h2>
          <p className="text-secondary-foreground/70 mb-8">Order your copy today — paperback or hardcover, delivered across Zambia.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop">
              <Button size="lg" className="font-serif px-8">Buy Paperback — K400</Button>
            </Link>
            <Link href="/shop">
              <Button size="lg" variant="outline" className="font-serif px-8 border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10">Buy Hardcover — K500</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
