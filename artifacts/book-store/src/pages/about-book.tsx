import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const chapters = [
  { num: "01", title: "Who Are You, Really?", desc: "An unflinching exploration of identity in the African context — between tradition and modernity, community and self, expectation and desire." },
  { num: "02", title: "The Architecture of Resilience", desc: "What African communities have always known about bouncing back — and the science that explains why it works." },
  { num: "03", title: "The People You Keep", desc: "On relationships: how to choose them, nurture them, and know when to let go. The hardest chapter, and the most essential." },
  { num: "04", title: "Work That Matters", desc: "Vocation, purpose, and how to find work that feeds your soul without starving your family." },
  { num: "05", title: "A Dignified Relationship with Money", desc: "Wealth is not the enemy of wisdom. Dr. Zulu dismantles the false choice between prosperity and integrity." },
  { num: "06", title: "The Debt We Owe Each Other", desc: "Ubuntu as a living practice — what genuine community demands of us and gives back in return." },
  { num: "07", title: "The Body That Carries You", desc: "Health as a prerequisite for everything else. Simple, profound, and frequently ignored." },
  { num: "08", title: "What You Leave Behind", desc: "Legacy. The final chapter — and the one that changes how you read the previous seven." },
];

export default function AboutBook() {
  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="py-24 bg-gradient-to-b from-muted/60 to-background">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-xs tracking-[0.3em] uppercase text-primary font-medium mb-4">The Book</p>
            <h1 className="font-serif text-5xl lg:text-6xl font-bold leading-tight mb-6">The Luminous Path</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              A complete guide to purposeful living — grounded in African wisdom, enriched by global psychology, and written for the realities of modern Zambian life.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-16 container mx-auto px-6 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-serif text-3xl font-bold mb-6">About the Book</h2>
          <div className="prose prose-stone max-w-none space-y-4 text-muted-foreground leading-relaxed">
            <p>
              The Luminous Path grew out of two decades of Dr. Amara Zulu's work with individuals, families, organizations, and communities across Zambia. What she found, again and again, was a hunger: people wanted to live more deliberately, with more meaning and less distraction — but they didn't have a framework that spoke to their actual lives.
            </p>
            <p>
              Western self-help books offered advice built for Western lives. Academic psychology was locked behind jargon and journal paywalls. Traditional wisdom was real and profound, but rarely codified in a way that young professionals could engage with on their morning commute.
            </p>
            <p>
              The Luminous Path bridges these worlds. It is serious but accessible, deeply African but globally informed, personally honest without being confessional. Each of its eight chapters addresses one dimension of a full life — and each ends with practical exercises that help you move from reading to living.
            </p>
            <p className="font-medium text-foreground italic font-serif text-lg">
              "I wrote this book because I needed it and it didn't exist. My hope is that it becomes the book you give to someone you love." — Dr. Amara Zulu
            </p>
          </div>
        </motion.div>
      </section>

      {/* Chapters */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="font-serif text-3xl font-bold mb-12 text-center">What's Inside</h2>
          <div className="space-y-4">
            {chapters.map((c, i) => (
              <motion.div key={c.num} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="flex gap-6 bg-card border border-card-border rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="font-serif text-3xl font-bold text-primary/30 flex-shrink-0 w-12">{c.num}</div>
                <div>
                  <h3 className="font-serif font-bold text-lg mb-1">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Book specs */}
      <section className="py-16 container mx-auto px-6 max-w-3xl">
        <h2 className="font-serif text-2xl font-bold mb-8">Book Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Pages", value: "256" },
            { label: "Language", value: "English" },
            { label: "Format", value: "Paperback & Hardcover" },
            { label: "First Edition", value: "2026" },
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
          <h2 className="font-serif text-3xl font-bold mb-4">Ready to Begin?</h2>
          <p className="text-secondary-foreground/70 mb-8">Order your copy today and begin the journey.</p>
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
