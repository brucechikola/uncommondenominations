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

/* Blue used before scrolling — visible on all dark-background pages */
const BLUE   = "hsl(215,80%,68%)";
const WHITE  = "rgba(255,255,255,0.85)";
const WHITE2 = "rgba(255,255,255,0.60)";

export function Navbar() {
  const [location]  = useLocation();
  const cartQuantity = useCartStore((s) => s.quantity);
  const cartProduct  = useCartStore((s) => s.productType);
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 50));

  const isCurrent = (p: string) => location === p;

  /* Purchase pages sit on a fixed dark canvas — always treat as scrolled for styling */
  const isDarkPage = ["/shop", "/checkout", "/payment", "/confirmation"].includes(location);

  /* Text is blue before the user scrolls; once the backdrop appears it flips to white */
  const linkColor  = (scrolled || isDarkPage) ? WHITE  : BLUE;
  const muteColor  = (scrolled || isDarkPage) ? WHITE2 : BLUE;

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300"
        style={{
          background:   scrolled ? "hsl(222,58%,6%,0.88)"          : "transparent",
          borderBottom: scrolled ? "1px solid hsl(220,38%,18%,0.6)" : "1px solid transparent",
          boxShadow:    scrolled ? "0 4px 32px rgba(0,0,0,0.4)"     : "none",
          backdropFilter: scrolled ? "blur(18px) saturate(1.4)"     : "none",
        }}
      >
        <div className="container mx-auto flex h-14 items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(141,107,61,0.12)", border: "1px solid rgba(141,107,61,0.35)" }}>
              <span className="font-display text-xs font-bold text-primary">U</span>
            </div>
            <span className="font-sans text-xs font-bold uppercase transition-colors group-hover:text-primary"
              style={{ color: muteColor }}>
              Uncommon Denominators
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href}
                className="font-sans text-[0.85rem] font-medium uppercase transition-colors hover:text-white"
                style={{ color: isCurrent(href) ? "#8d6b3d" : linkColor }}>
                {label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link href="/shop">
              <Button size="sm"
                className="hidden md:flex uppercase px-5 h-9 transition-all"
                style={{ background: "#8d6b3d", color: "#fff", fontWeight: 700, boxShadow: "0 2px 12px rgba(141,107,61,0.35)" }}>
                {cartProduct ? (
                  <><ShoppingCart className="h-3.5 w-3.5 mr-1.5" />{cartQuantity} in cart</>
                ) : "Order Now"}
              </Button>
            </Link>
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 transition-colors hover:text-white"
              style={{ color: muteColor }}>
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
                className={`font-display text-sm uppercase py-2 border-b border-border/50 ${isCurrent(href) ? "text-primary" : "text-muted-foreground"}`}>
                {label}
              </Link>
            ))}
            <Link href="/shop" onClick={() => setMobileOpen(false)}>
              <Button className="w-full mt-2 uppercase"
                style={{ background: "#8d6b3d", color: "#fff", fontWeight: 700 }}>
                Order Now
              </Button>
            </Link>
          </nav>
        </motion.div>
      )}
    </>
  );
}
