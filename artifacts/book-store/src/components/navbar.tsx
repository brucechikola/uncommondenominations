import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";
import { ShoppingCart, Menu, X } from "lucide-react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/about-book", label: "The Book" },
  { href: "/about-author", label: "Author" },
  { href: "/reviews", label: "Reviews" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [location] = useLocation();
  const cartQuantity = useCartStore((state) => state.quantity);
  const cartProduct = useCartStore((state) => state.productType);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 40));

  const isCurrent = (path: string) => location === path;

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "bg-[hsl(220,52%,6%)]/95 backdrop-blur-md border-b border-[hsl(42,80%,52%)]/15 shadow-xl shadow-black/20"
            : "bg-transparent border-b border-white/5"
        }`}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-7 h-7 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center">
              <span className="text-primary font-display text-xs font-bold">L</span>
            </div>
            <span
              className="font-display text-sm font-bold tracking-[0.15em] uppercase text-foreground/90 group-hover:text-primary transition-colors"
            >
              The Luminous Path
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-xs font-sans font-medium tracking-[0.12em] uppercase transition-colors ${
                  isCurrent(href) ? "text-primary" : "text-foreground/50 hover:text-foreground/90"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/shop">
              <Button
                size="sm"
                className="hidden md:flex font-display text-xs tracking-[0.1em] uppercase px-5 h-9 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                {cartProduct ? (
                  <>
                    <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                    {cartQuantity} in cart
                  </>
                ) : (
                  "Order Now"
                )}
              </Button>
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-foreground/60 hover:text-foreground transition-colors"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="fixed top-16 inset-x-0 z-40 bg-[hsl(220,52%,7%)] border-b border-white/10 shadow-2xl"
        >
          <nav className="container mx-auto px-6 py-6 flex flex-col gap-4">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`text-sm font-display tracking-widest uppercase py-2 border-b border-white/5 ${
                  isCurrent(href) ? "text-primary" : "text-foreground/60"
                }`}
              >
                {label}
              </Link>
            ))}
            <Link href="/shop" onClick={() => setMobileOpen(false)}>
              <Button className="w-full mt-2 font-display text-xs tracking-widest uppercase bg-primary text-primary-foreground">
                Order Now
              </Button>
            </Link>
          </nav>
        </motion.div>
      )}
    </>
  );
}
