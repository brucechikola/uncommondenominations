import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <div className="overflow-x-hidden">
      <section className="py-16 bg-gradient-to-b from-muted/60 to-background">
        <div className="container mx-auto px-6 text-center max-w-2xl">
          <p className="text-xs tracking-[0.3em] uppercase text-primary font-medium mb-4">Shop</p>
          <h1 className="font-serif text-5xl font-bold mb-4">Choose Your Edition</h1>
          <p className="text-muted-foreground">Both editions contain the complete text. Select the one that's right for you.</p>
        </div>
      </section>

      <section className="py-16 container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="text-center py-24 text-muted-foreground">Loading products…</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {products?.map((product) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  onClick={() => setProductType(product.type as "paperback" | "hardcover")}
                  className={cn(
                    "relative rounded-2xl border-2 p-8 cursor-pointer transition-all hover:shadow-xl",
                    productType === product.type
                      ? "border-primary bg-primary/5 shadow-lg"
                      : "border-card-border bg-card hover:border-primary/40"
                  )}>
                  {product.type === "hardcover" && (
                    <div className="absolute top-4 right-4"><Badge className="bg-primary text-primary-foreground text-xs">Premium</Badge></div>
                  )}
                  {productType === product.type && (
                    <div className="absolute top-4 left-4 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  )}
                  <div className="text-xs tracking-widest uppercase text-muted-foreground mb-3 mt-1 capitalize">{product.type}</div>
                  <div className="font-serif text-4xl font-bold text-primary mb-4">K{product.priceKwacha}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">{product.description}</p>
                  <ul className="space-y-2">
                    {(product.features as string[]).map((f: string) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary mt-0.5 flex-shrink-0">✓</span>{f}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          )}

          {/* Quantity + proceed */}
          <div className="bg-card border border-card-border rounded-2xl p-8 max-w-xl mx-auto">
            <h2 className="font-serif text-xl font-bold mb-6">Your Selection</h2>
            {!productType ? (
              <p className="text-muted-foreground text-sm text-center py-4">Select an edition above to continue.</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="font-medium capitalize">{productType}</p>
                    <p className="text-sm text-muted-foreground">K{selectedProduct?.priceKwacha} per copy</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 p-0 font-bold">−</Button>
                    <span className="font-serif text-lg font-bold w-6 text-center">{quantity}</span>
                    <Button variant="outline" size="sm" onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 p-0 font-bold">+</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between py-4 border-t border-border mb-6">
                  <span className="font-medium">Total</span>
                  <span className="font-serif text-2xl font-bold text-primary">K{total}</span>
                </div>
                <Link href="/checkout">
                  <Button size="lg" className="w-full font-serif text-base py-6">Proceed to Checkout</Button>
                </Link>
              </>
            )}
          </div>

          {/* Trust */}
          <div className="grid grid-cols-3 gap-6 mt-12 max-w-xl mx-auto">
            {[
              { icon: ShieldCheck, text: "Secure payment" },
              { icon: Truck, text: "Nationwide delivery" },
              { icon: Phone, text: "Call 0962 219 419" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex flex-col items-center gap-2 text-center">
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-xs text-muted-foreground">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
