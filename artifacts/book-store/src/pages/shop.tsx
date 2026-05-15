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
      {/* Header – dark navy */}
      <section className="py-20 relative" style={{ background: "hsl(220,52%,10%)" }}>
        <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(42,80%,52%,0.2), transparent)" }} />
        <div className="container mx-auto px-6 text-center max-w-2xl">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="font-sans text-[0.62rem] tracking-[0.32em] uppercase font-semibold mb-5" style={{ color: "hsl(42,80%,58%)" }}>
            Shop
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
            className="font-display text-5xl lg:text-6xl font-bold mb-4" style={{ color: "hsl(40,28%,93%)" }}>
            Choose Your Edition
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
            className="font-serif text-base" style={{ color: "hsl(220,15%,55%)" }}>
            Both editions contain the complete text. Select the one that's right for you.
          </motion.p>
        </div>
      </section>

      {/* Products – light */}
      <section className="py-16 container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="text-center py-24">
              <div className="font-display text-[0.62rem] tracking-[0.3em] uppercase text-muted-foreground animate-pulse">Loading editions…</div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {products?.map((product, i) => (
                <motion.div key={product.id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setProductType(product.type as "paperback" | "hardcover")}
                  className={cn(
                    "relative rounded-sm border-2 p-8 cursor-pointer transition-all",
                    productType === product.type
                      ? "border-primary bg-primary/5 shadow-lg"
                      : "border-border bg-card hover:border-primary/40 hover:shadow-md"
                  )}>
                  {product.type === "hardcover" && (
                    <div className="absolute top-4 right-4">
                      <span className="font-display text-[0.55rem] tracking-[0.18em] uppercase border rounded-sm px-2.5 py-1 bg-secondary text-secondary-foreground border-secondary/50">
                        Premium
                      </span>
                    </div>
                  )}
                  {productType === product.type && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="absolute top-4 left-4 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                      <span className="text-primary-foreground text-xs font-bold">✓</span>
                    </motion.div>
                  )}
                  <div className="font-sans text-[0.58rem] tracking-[0.3em] uppercase text-muted-foreground mb-3 mt-1 capitalize">{product.type}</div>
                  <div className="font-display text-5xl font-bold text-primary mb-3">K{product.priceKwacha}</div>
                  <p className="font-serif text-sm text-muted-foreground leading-relaxed mb-5">{product.description}</p>
                  <ul className="space-y-2">
                    {(product.features as string[]).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground font-sans">
                        <span className="text-primary mt-0.5 flex-shrink-0 text-[0.65rem]">✦</span>{f}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          )}

          {/* Summary */}
          <motion.div layout className="rounded-sm border border-border bg-card p-8 max-w-xl mx-auto shadow-sm">
            <h2 className="font-display text-sm font-bold tracking-wider uppercase text-foreground mb-6">Your Selection</h2>
            {!productType ? (
              <p className="font-serif text-sm text-muted-foreground text-center py-4">Select an edition above to continue.</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="font-display text-xs font-bold tracking-wider uppercase text-foreground capitalize">{productType}</p>
                    <p className="font-sans text-xs text-muted-foreground mt-0.5">K{selectedProduct?.priceKwacha} per copy</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 p-0 font-bold border-border hover:border-primary hover:text-primary">−</Button>
                    <span className="font-display text-lg font-bold w-6 text-center">{quantity}</span>
                    <Button variant="outline" size="sm" onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 p-0 font-bold border-border hover:border-primary hover:text-primary">+</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between py-4 border-t border-border mb-6">
                  <span className="font-sans text-xs uppercase tracking-[0.14em] text-muted-foreground">Total</span>
                  <span className="font-display text-3xl font-bold text-primary">K{total}</span>
                </div>
                <Link href="/checkout">
                  <Button size="lg" className="w-full font-display text-[0.68rem] tracking-[0.16em] uppercase h-12 shadow-lg transition-all"
                    style={{ background: "hsl(220,52%,10%)", color: "hsl(40,28%,93%)" }}>
                    Proceed to Checkout
                  </Button>
                </Link>
              </>
            )}
          </motion.div>

          {/* Trust */}
          <div className="grid grid-cols-3 gap-6 mt-10 max-w-sm mx-auto">
            {[
              { icon: ShieldCheck, text: "Secure payment" },
              { icon: Truck,       text: "Nationwide delivery" },
              { icon: Phone,       text: "0962 219 419" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex flex-col items-center gap-2 text-center">
                <Icon className="h-4 w-4 text-primary" />
                <span className="font-sans text-[0.62rem] text-muted-foreground">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
