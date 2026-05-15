import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useListProducts } from "@workspace/api-client-react";
import { useCartStore } from "@/lib/store";
import { ShieldCheck, Truck, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Shop() {
  const { data: products, isLoading } = useListProducts();
  const { productType, quantity, setProductType, setQuantity } = useCartStore();

  const selectedProduct = products?.find((p) => p.type === productType);
  const total = selectedProduct ? selectedProduct.priceKwacha * quantity : 0;

  return (
    <div className="overflow-x-hidden bg-background">
      {/* Header */}
      <section className="py-20 relative overflow-hidden" style={{ background: "hsl(220,52%,6%)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(42,80%,52%,0.12), transparent)" }} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(42,80%,52%,0.08), transparent)" }} />
        </div>
        <div className="container mx-auto px-6 text-center max-w-2xl relative z-10">
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="font-sans text-[0.65rem] tracking-[0.35em] uppercase text-primary mb-5"
          >
            Shop
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="font-display text-5xl lg:text-6xl font-bold mb-5"
          >
            Choose Your Edition
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
            className="font-serif text-base text-muted-foreground"
          >
            Both editions contain the complete text. Select the one that's right for you.
          </motion.p>
        </div>
      </section>

      <section className="py-20 container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="text-center py-24">
              <div className="font-display text-[0.65rem] tracking-[0.3em] uppercase text-muted-foreground animate-pulse">Loading editions…</div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6 mb-14">
              {products?.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setProductType(product.type as "paperback" | "hardcover")}
                  className={cn(
                    "relative rounded-sm border p-8 cursor-pointer transition-all",
                    productType === product.type
                      ? "border-primary/50 bg-card shadow-xl shadow-primary/5"
                      : "border-white/8 bg-card/50 hover:border-white/15"
                  )}
                >
                  {product.type === "hardcover" && (
                    <div className="absolute top-4 right-4">
                      <span className="font-display text-[0.55rem] tracking-[0.2em] uppercase text-primary/70 border border-primary/25 rounded-sm px-2.5 py-1">Premium</span>
                    </div>
                  )}
                  {productType === product.type && (
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="absolute top-4 left-4 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30"
                    >
                      <span className="text-primary-foreground text-xs font-bold">✓</span>
                    </motion.div>
                  )}
                  <div className="font-sans text-[0.6rem] tracking-[0.3em] uppercase text-muted-foreground mb-3 mt-1 capitalize">{product.type}</div>
                  <div className="font-display text-5xl font-bold text-primary mb-4">K{product.priceKwacha}</div>
                  <p className="font-serif text-sm text-muted-foreground leading-relaxed mb-6">{product.description}</p>
                  <ul className="space-y-2.5">
                    {(product.features as string[]).map((f) => (
                      <li key={f} className="flex items-start gap-2.5 font-sans text-xs text-muted-foreground">
                        <span className="text-primary mt-0.5 text-[0.65rem]">✦</span>{f}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          )}

          {/* Selection summary */}
          <motion.div
            layout
            className="rounded-sm border border-white/10 bg-card p-8 max-w-xl mx-auto"
          >
            <h2 className="font-display text-sm font-bold tracking-wider uppercase text-foreground/80 mb-6">Your Selection</h2>
            {!productType ? (
              <p className="font-serif text-sm text-muted-foreground text-center py-4">Select an edition above to continue.</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="font-display text-xs font-bold tracking-wider uppercase text-foreground/80 capitalize">{productType}</p>
                    <p className="font-sans text-xs text-muted-foreground mt-0.5">K{selectedProduct?.priceKwacha} per copy</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 p-0 font-bold border-white/15 text-foreground/60 hover:border-primary/40 hover:text-primary"
                    >
                      −
                    </Button>
                    <span className="font-display text-lg font-bold w-6 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 p-0 font-bold border-white/15 text-foreground/60 hover:border-primary/40 hover:text-primary"
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between py-4 border-t border-white/8 mb-6">
                  <span className="font-sans text-xs uppercase tracking-[0.15em] text-muted-foreground">Total</span>
                  <span className="font-display text-3xl font-bold text-primary">K{total}</span>
                </div>
                <Link href="/checkout">
                  <Button
                    size="lg"
                    className="w-full font-display text-[0.7rem] tracking-[0.18em] uppercase h-12 bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all"
                  >
                    Proceed to Checkout
                  </Button>
                </Link>
              </>
            )}
          </motion.div>

          {/* Trust icons */}
          <div className="grid grid-cols-3 gap-6 mt-12 max-w-sm mx-auto">
            {[
              { icon: ShieldCheck, text: "Secure payment" },
              { icon: Truck, text: "Nationwide delivery" },
              { icon: Phone, text: "0962 219 419" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex flex-col items-center gap-2 text-center">
                <Icon className="h-4 w-4 text-primary/60" />
                <span className="font-sans text-[0.65rem] text-muted-foreground">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
