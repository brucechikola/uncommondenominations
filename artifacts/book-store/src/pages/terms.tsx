import { motion } from "framer-motion";

const sections = [
  {
    title: "Terms of Sale",
    content: `By placing an order on this website, you agree to these terms. All prices are in Zambian Kwacha (ZMW). Prices are correct at time of publication. We reserve the right to change prices without notice.\n\nOrders are subject to availability. We reserve the right to cancel any order at our discretion. You will be notified and fully refunded if this occurs.\n\nDelivery fees are not included in the listed price and will be communicated to you after order placement. Delivery is available nationwide within Zambia.`,
  },
  {
    title: "Payment",
    content: `We accept Airtel Money, MTN Mobile Money, Zamtel Money, Visa/Mastercard, and bank transfer. Payment must be completed before an order is dispatched.\n\nFor mobile money payments, please use the contact number 0979 697 853 as the reference. For bank transfers, use your order ID as the reference.\n\nAll transactions are processed securely. We do not store card details on our servers.`,
  },
  {
    title: "Returns and Refunds",
    content: `We do not accept returns for change of mind. If your order arrives damaged or defective, contact us within 7 days of receipt at 0979 697 853 and we will arrange a replacement at no additional cost.\n\nRefunds for cancelled orders (where cancellation is initiated by us) will be processed within 5–10 business days via the original payment method.`,
  },
  {
    title: "Intellectual Property",
    content: `Uncommon Denominators and all content on this website are the intellectual property of Monde Mwanalushi, Eric Nalishebo, and LIBROS Academic Publishing. No part of the book or this website may be reproduced, distributed, or transmitted without prior written permission.\n\nExcerpts of up to 300 words may be quoted for reviews, educational, or non-commercial purposes with full attribution.`,
  },
  {
    title: "Privacy Policy",
    content: `We collect personal information (name, phone, email, delivery address) only for the purpose of processing and delivering your order. We do not sell, share, or rent your personal information to any third party.\n\nWe use your email address to send order confirmations and delivery updates. You may unsubscribe at any time by contacting us.\n\nWe use standard web analytics to understand how visitors use this website. No personally identifiable data is collected through analytics.`,
  },
  {
    title: "Cookies",
    content: `This website uses essential cookies to maintain your session and shopping cart. No marketing or tracking cookies are used without your consent. By continuing to use this site, you accept our use of essential cookies.`,
  },
  {
    title: "Limitation of Liability",
    content: `To the maximum extent permitted by law, LIBROS Academic Publishing shall not be liable for any indirect, incidental, or consequential damages arising from the use of this website or the purchase of products from it.\n\nOur total liability for any claim arising from a purchase shall not exceed the amount paid for the relevant product.`,
  },
  {
    title: "Governing Law",
    content: `These terms are governed by the laws of the Republic of Zambia. Any disputes shall be subject to the exclusive jurisdiction of the courts of Zambia.`,
  },
  {
    title: "Contact",
    content: `For any questions about these terms, contact us at info@uncommondenominators.co.zm or call 0979 697 853.\n\nThese terms were last updated in May 2026.`,
  },
];

export default function Terms() {
  return (
    <div className="overflow-x-hidden">
      <section className="py-16 bg-gradient-to-b from-muted/60 to-background">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs tracking-[0.3em] uppercase text-primary font-medium mb-4">Legal</p>
            <h1 className="font-serif text-5xl font-bold mb-4">Terms & Privacy</h1>
            <p className="text-muted-foreground">Our terms of sale, privacy policy, and legal information.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 container mx-auto px-6 max-w-3xl">
        <div className="space-y-12">
          {sections.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}>
              <h2 className="font-serif text-xl font-bold mb-4 pb-3 border-b border-border">{s.title}</h2>
              {s.content.split("\n\n").map((para, j) => (
                <p key={j} className="text-muted-foreground leading-relaxed mb-3 text-sm">{para}</p>
              ))}
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
