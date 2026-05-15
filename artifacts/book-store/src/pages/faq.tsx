import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  {
    q: "How do I order the book?",
    a: "Click 'Buy Now' from any page, choose your edition (Paperback K400 or Hardcover K500), set your quantity, fill in your delivery details, and complete the payment. We will contact you to confirm delivery."
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept Airtel Money, MTN Mobile Money, Zamtel Money, Visa/Mastercard, and Bank Transfer. You can also call or WhatsApp 0962 219 419 to arrange payment manually."
  },
  {
    q: "How long does delivery take?",
    a: "Most orders are delivered within 2–5 business days, depending on your location. Lusaka and Copperbelt orders are typically faster. Our team will call you to confirm delivery arrangements."
  },
  {
    q: "Do you deliver outside Zambia?",
    a: "Currently, we deliver within Zambia only. We are working on international shipping — if you're based outside Zambia and would like a copy, please contact us on 0962 219 419 and we will try to assist."
  },
  {
    q: "Can I buy multiple copies?",
    a: "Absolutely. You can increase the quantity during checkout. Bulk orders (10+ copies) for schools, organizations, or gift-giving may qualify for a discount — contact us to discuss."
  },
  {
    q: "What is the difference between Paperback and Hardcover?",
    a: "Both editions contain the complete text of The Luminous Path. The Paperback (K400) is lightweight and great for everyday reading. The Hardcover (K500) features premium binding, thicker paper, a ribbon bookmark, and is designed to last a lifetime — ideal as a personal or gift purchase."
  },
  {
    q: "Can I return the book if I am not satisfied?",
    a: "We stand behind the quality of this book. If your copy arrives damaged or defective, contact us within 7 days at 0962 219 419 and we will arrange a replacement at no cost. We do not accept returns for change of mind."
  },
  {
    q: "Is my payment information secure?",
    a: "Yes. All payments are processed securely. We do not store card details. Mobile money payments follow the standard security protocols of each network. For any concerns, contact us directly."
  },
  {
    q: "Where can I read a sample of the book?",
    a: "Visit the 'About the Book' page for a detailed overview of each chapter. We will also be sharing selected excerpts on our social media pages."
  },
  {
    q: "How can I contact Dr. Zulu for speaking engagements or media?",
    a: "Use our Contact page to send a message, or call 0962 219 419. Serious inquiries for speaking, media appearances, or academic collaboration are welcome."
  },
];

export default function FAQ() {
  return (
    <div className="overflow-x-hidden">
      <section className="py-16 bg-gradient-to-b from-muted/60 to-background">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs tracking-[0.3em] uppercase text-primary font-medium mb-4">FAQ</p>
            <h1 className="font-serif text-5xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-muted-foreground">Everything you need to know about ordering and receiving your copy.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 container mx-auto px-6 max-w-3xl">
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
              <AccordionItem value={`item-${i}`} className="bg-card border border-card-border rounded-xl px-6 data-[state=open]:shadow-md transition-shadow">
                <AccordionTrigger className="font-serif font-semibold text-left hover:no-underline py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>

        <div className="mt-16 bg-secondary text-secondary-foreground rounded-2xl p-8 text-center">
          <h2 className="font-serif text-2xl font-bold mb-3">Still have questions?</h2>
          <p className="text-secondary-foreground/70 mb-6">Our team is happy to help. Reach us on WhatsApp or send a message.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button className="font-serif">Send a Message</Button>
            </Link>
            <a href="tel:0962219419">
              <Button variant="outline" className="font-serif border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10">
                Call 0962 219 419
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
