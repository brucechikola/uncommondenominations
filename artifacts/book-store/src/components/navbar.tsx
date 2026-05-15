import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";
import { ShoppingCart, Menu, X } from "lucide-react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/about-book",   label: "The Book" },
  { href: "/about-author", label: "Author" },
  { href: "/reviews",      label: "Reviews" },
  { href: "/contact",      label: "Contact" },
];

export function Navbar() {
  const [location]  = useLocation();
  const cartQuantity = useCartStore((s) => s.quantity);
  const cartProduct  = useCartStore((s) => s.productType);
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 50));

  const isCurrent = (p: string) => location === p;

  /* Dark purchase pages always show the dark navbar (never switches to cream). */
  const isDarkPage = ["/shop", "/checkout", "/payment", "/confirmation"].includes(location);

  /* On hero (home, not scrolled) OR on any purchase page → transparent + light text. */
  const onHero = (location === "/" && !scrolled) || isDarkPage;

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 w-full transition-all duration-300"
        style={{
          background: onHero
            ? "transparent"
            : "hsl(40,25%,98%)",
          borderBottom: onHero ? "1px solid hsl(220,38%,22%)" : "1px solid hsl(40,15%,88%)",
          boxShadow: scrolled ? "0 1px 24px rgba(0,0,0,0.07)" : "none",
          backdropFilter: onHero ? "none" : "blur(12px)",
        }}
      >
        <div className="container mx-auto flex h-15 items-center justify-between px-6 h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "hsl(42,80%,48%,0.12)", border: "1px solid hsl(42,80%,48%,0.35)" }}>
              <span className="font-display text-xs font-bold text-primary">L</span>
            </div>
            <span className={`font-display text-xs font-bold tracking-[0.14em] uppercase transition-colors ${onHero ? "text-white/80" : "text-foreground"} group-hover:text-primary`}>
              The Luminous Path
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href}
                className={`font-sans text-[0.7rem] font-medium tracking-[0.1em] uppercase transition-colors ${
                  isCurrent(href)
                    ? "text-primary"
                    : onHero
                    ? "text-white/70 hover:text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                {label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link href="/shop">
              <Button size="sm"
                className="hidden md:flex font-display text-[0.65rem] tracking-[0.1em] uppercase px-5 h-9 transition-all"
                style={{ background: "hsl(42,80%,48%)", color: "hsl(220,52%,10%)", boxShadow: "0 2px 12px hsl(42,80%,48%,0.25)" }}>
                {cartProduct ? (
                  <><ShoppingCart className="h-3.5 w-3.5 mr-1.5" />{cartQuantity} in cart</>
                ) : "Order Now"}
              </Button>
            </Link>
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className={`md:hidden p-2 transition-colors ${onHero ? "text-white/60 hover:text-white" : "text-muted-foreground hover:text-foreground"}`}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="fixed top-14 inset-x-0 z-40 border-b border-border shadow-2xl bg-card"
        >
          <nav className="container mx-auto px-6 py-6 flex flex-col gap-4">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                className={`font-display text-xs tracking-widest uppercase py-2 border-b border-border/50 ${isCurrent(href) ? "text-primary" : "text-muted-foreground"}`}>
                {label}
              </Link>
            ))}
            <Link href="/shop" onClick={() => setMobileOpen(false)}>
              <Button className="w-full mt-2 font-display text-[0.65rem] tracking-widest uppercase"
                style={{ background: "hsl(42,80%,48%)", color: "hsl(220,52%,10%)" }}>
                Order Now
              </Button>
            </Link>
          </nav>
        </motion.div>
      )}
    </>
  );
}
