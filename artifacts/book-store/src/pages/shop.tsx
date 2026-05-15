import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useListProducts } from "@workspace/api-client-react";
import { useCartStore } from "@/lib/store";
import { ShieldCheck, Truck, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PAGE_BG, CARD_BG, CARD_BORDER, GOLD, TEXT_PRIMARY, TEXT_MUTED, TEXT_DIM } from "@/components/purchase-ui";

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

export default function Shop() {
  const { data: products, isLoading } = useListProducts();
  const { productType, quantity, setProductType, setQuantity } = useCartStore();

  const selectedProduct = products?.find((p) => p.type === productType);
  const total = selectedProduct ? selectedProduct.priceKwacha * quantity : 0;

  return (
    <div style={{ minHeight: "100svh", background: PAGE_BG }} className="overflow-x-hidden">

      {/* ── Page atmosphere ── */}
      <div className="absolute inset-x-0 top-0 h-[480px] pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: "1000px", height: "480px",
          background: "radial-gradient(ellipse, hsl(222,65%,14%,0.8) 0%, transparent 65%)",
        }} />
      </div>

      {/* ── Header ── */}
      <section className="relative z-10 pt-20 pb-16">
        <div className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, hsl(42,80%,52%,0.15), transparent)" }} />
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="container mx-auto px-6 text-center max-w-xl">
          <motion.p variants={fadeUp}
            className="font-sans text-[0.58rem] tracking-[0.36em] uppercase font-semibold mb-5"
            style={{ color: GOLD }}>Shop</motion.p>
          <motion.h1 variants={fadeUp}
            className="font-display text-3xl lg:text-[2.6rem] font-bold leading-tight mb-4"
            style={{ color: TEXT_PRIMARY }}>
            Choose Your Edition
          </motion.h1>
          <motion.p variants={fadeUp} className="font-serif text-base leading-relaxed"
            style={{ color: TEXT_MUTED }}>
            Both editions contain the complete text. Select the one that's right for you.
          </motion.p>
        </motion.div>
      </section>

      {/* ── Products ── */}
      <section className="relative z-10 pb-10 container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="text-center py-24">
              <div className="font-sans text-[0.6rem] tracking-[0.3em] uppercase animate-pulse"
                style={{ color: TEXT_DIM }}>Loading editions…</div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5 mb-10">
              {products?.map((product, i) => {
                const selected = productType === product.type;
                return (
                  <motion.div key={product.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ y: -3 }}
                    onClick={() => setProductType(product.type as "paperback" | "hardcover")}
                    className="relative cursor-pointer rounded-2xl overflow-hidden transition-all"
                    style={{
                      background: CARD_BG,
                      border: `1px solid ${selected ? GOLD : CARD_BORDER}`,
                      boxShadow: selected
                        ? `0 0 0 1px ${GOLD}, 0 8px 40px hsl(42,78%,46%,0.08)`
                        : "0 4px 24px hsl(222,60%,3%,0.4)",
                    }}>

                    {/* Top accent bar */}
                    <div style={{
                      height: 3,
                      background: selected
                        ? "linear-gradient(90deg, hsl(44,92%,70%), hsl(42,78%,46%))"
                        : `hsl(220,38%,14%)`,
                      transition: "background 0.25s",
                    }} />

                    <div className="p-8">
                      {/* Header row */}
                      <div className="flex items-start justify-between mb-5">
                        <div>
                          <p className="font-sans text-[0.56rem] tracking-[0.32em] uppercase font-semibold mb-2"
                            style={{ color: selected ? GOLD : TEXT_DIM }}>
                            {product.type}
                          </p>
                          <p className="font-display text-[2.6rem] font-bold leading-none"
                            style={{ color: GOLD }}>
                            K{product.priceKwacha}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {product.type === "hardcover" && (
                            <span className="font-sans text-[0.5rem] tracking-[0.2em] uppercase px-2.5 py-1 rounded-sm"
                              style={{ background: "hsl(42,78%,46%,0.12)", border: "1px solid hsl(42,78%,46%,0.25)", color: GOLD }}>
                              Premium
                            </span>
                          )}
                          {selected && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                              className="w-6 h-6 rounded-full flex items-center justify-center"
                              style={{ background: GOLD }}>
                              <span className="text-[0.6rem] font-bold" style={{ color: "hsl(222,58%,8%)" }}>✓</span>
                            </motion.div>
                          )}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="mb-5 h-px" style={{ background: "hsl(220,38%,13%)" }} />

                      {/* Description */}
                      <p className="font-serif text-sm leading-relaxed mb-5" style={{ color: TEXT_MUTED }}>
                        {product.description}
                      </p>

                      {/* Features */}
                      <ul className="space-y-2.5">
                        {(product.features as string[]).map((f) => (
                          <li key={f} className="flex items-start gap-2.5">
                            <span className="mt-0.5 flex-shrink-0 text-[0.58rem]" style={{ color: GOLD }}>✦</span>
                            <span className="font-sans text-[0.75rem] leading-snug" style={{ color: TEXT_MUTED }}>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* ── Order summary ── */}
          <motion.div layout
            className="rounded-2xl p-8 max-w-xl mx-auto"
            style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
            <h2 className="font-sans text-[0.6rem] font-bold tracking-[0.28em] uppercase mb-6"
              style={{ color: TEXT_DIM }}>
              Your Selection
            </h2>

            {!productType ? (
              <p className="font-serif text-sm text-center py-4" style={{ color: TEXT_DIM }}>
                Select an edition above to continue.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="font-sans text-[0.62rem] tracking-[0.18em] uppercase font-semibold capitalize mb-1"
                      style={{ color: TEXT_PRIMARY }}>{productType}</p>
                    <p className="font-sans text-[0.72rem]" style={{ color: TEXT_MUTED }}>
                      K{selectedProduct?.priceKwacha} per copy
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors"
                      style={{ background: "hsl(220,38%,12%)", border: `1px solid ${CARD_BORDER}`, color: TEXT_MUTED }}>
                      −
                    </button>
                    <span className="font-display text-xl font-bold w-6 text-center" style={{ color: TEXT_PRIMARY }}>
                      {quantity}
                    </span>
                    <button onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors"
                      style={{ background: "hsl(220,38%,12%)", border: `1px solid ${CARD_BORDER}`, color: TEXT_MUTED }}>
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-5 mb-6"
                  style={{ borderTop: `1px solid ${CARD_BORDER}`, borderBottom: `1px solid ${CARD_BORDER}` }}>
                  <span className="font-sans text-[0.6rem] tracking-[0.18em] uppercase" style={{ color: TEXT_DIM }}>Total</span>
                  <span className="font-display text-3xl font-bold" style={{ color: GOLD }}>K{total}</span>
                </div>

                <Link href="/checkout">
                  <motion.div whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}>
                    <Button size="lg" className="w-full font-sans tracking-[0.14em] uppercase border-0"
                      style={{ fontSize: "0.7rem", height: "3rem",
                        background: GOLD, color: "hsl(222,58%,7%)",
                        boxShadow: "0 4px 24px hsl(42,78%,46%,0.28), inset 0 1px 0 hsl(44,90%,68%,0.25)" }}>
                      Proceed to Checkout →
                    </Button>
                  </motion.div>
                </Link>
              </>
            )}
          </motion.div>

          {/* Trust row */}
          <div className="flex flex-wrap justify-center gap-10 mt-10 pb-4">
            {[
              { icon: ShieldCheck, text: "Secure payment" },
              { icon: Truck,       text: "Nationwide delivery" },
              { icon: Phone,       text: "0962 219 419" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5">
                <Icon className="h-3.5 w-3.5" style={{ color: GOLD }} />
                <span className="font-sans text-[0.65rem]" style={{ color: TEXT_DIM }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
