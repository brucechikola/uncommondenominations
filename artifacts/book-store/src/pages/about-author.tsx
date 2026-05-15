import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

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

export default function AboutAuthor() {
  return (
    <div className="overflow-x-hidden">
      <section className="py-24 bg-gradient-to-b from-muted/60 to-background">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs tracking-[0.3em] uppercase text-primary font-medium mb-4">The Author</p>
            <h1 className="font-serif text-5xl lg:text-6xl font-bold leading-tight mb-6">Dr. Amara Zulu</h1>
            <p className="text-xl text-muted-foreground">Psychologist. Educator. Author. Zambian.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 container mx-auto px-6">
        <div className="grid lg:grid-cols-[280px,1fr] gap-16 max-w-5xl mx-auto">
          <div className="flex flex-col items-center gap-6">
            <div className="w-56 h-56 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shadow-xl border border-card-border">
              <div className="text-center p-6">
                <div className="font-serif text-5xl font-bold text-primary mb-2">AZ</div>
                <div className="text-muted-foreground text-xs">PhD Psychology</div>
              </div>
            </div>
            <div className="bg-card border border-card-border rounded-xl p-5 w-full text-sm space-y-3">
              <div><span className="text-muted-foreground text-xs uppercase tracking-wide">Based in</span><p className="font-medium mt-0.5">Lusaka, Zambia</p></div>
              <div><span className="text-muted-foreground text-xs uppercase tracking-wide">Specialty</span><p className="font-medium mt-0.5">Community & Organizational Psychology</p></div>
              <div><span className="text-muted-foreground text-xs uppercase tracking-wide">Languages</span><p className="font-medium mt-0.5">English, Nyanja, Bemba, Tonga</p></div>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-serif text-3xl font-bold mb-6">About Dr. Zulu</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
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
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="font-serif text-3xl font-bold mb-12 text-center">A Life's Journey</h2>
          <div className="relative">
            <div className="absolute left-[72px] top-0 bottom-0 w-px bg-border" />
            <div className="space-y-8">
              {timeline.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                  className="flex gap-6 items-start">
                  <div className="w-16 text-right font-serif font-bold text-primary text-sm flex-shrink-0">{item.year}</div>
                  <div className="w-4 h-4 rounded-full bg-primary border-4 border-background flex-shrink-0 mt-0.5 relative z-10" />
                  <p className="text-sm text-muted-foreground leading-relaxed pt-0.5">{item.event}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 container mx-auto px-6 text-center max-w-2xl">
        <h2 className="font-serif text-3xl font-bold mb-4">Read Her Work</h2>
        <p className="text-muted-foreground mb-8">The Luminous Path is now available in paperback and hardcover editions across Zambia.</p>
        <Link href="/shop">
          <Button size="lg" className="font-serif px-10">Order Your Copy</Button>
        </Link>
      </section>
    </div>
  );
}
