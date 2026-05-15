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
          <Link href="/" className="flex items-center gap-3 group">
            {/* Book + fraction mark SVG */}
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Outer rounded square backdrop */}
              <rect width="34" height="34" rx="7" fill="rgba(141,107,61,0.13)" stroke="rgba(141,107,61,0.38)" strokeWidth="1"/>
              {/* Open book — left page */}
              <path d="M7 10.5 C7 10 7.5 9.5 8 9.5 L16 9.5 L16 23 L8 23 C7.5 23 7 22.5 7 22 Z"
                fill="none" stroke="#8d6b3d" strokeWidth="1.4" strokeLinejoin="round"/>
              {/* Open book — right page */}
              <path d="M27 10.5 C27 10 26.5 9.5 26 9.5 L18 9.5 L18 23 L26 23 C26.5 23 27 22.5 27 22 Z"
                fill="none" stroke="#8d6b3d" strokeWidth="1.4" strokeLinejoin="round"/>
              {/* Spine */}
              <line x1="17" y1="9.5" x2="17" y2="23" stroke="#8d6b3d" strokeWidth="1.4"/>
              {/* Fraction bar underneath — the "denominator" */}
              <line x1="10" y1="26.5" x2="24" y2="26.5" stroke="#8d6b3d" strokeWidth="1.5" strokeLinecap="round"/>
              {/* Dot above (numerator) */}
              <circle cx="17" cy="24.5" r="1.1" fill="#8d6b3d"/>
              {/* Dot below (denominator) */}
              <circle cx="17" cy="28.5" r="1.1" fill="#8d6b3d"/>
            </svg>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-[0.78rem] font-bold tracking-wide uppercase transition-colors group-hover:text-primary"
                style={{ color: muteColor }}>
                Uncommon
              </span>
              <span className="font-display text-[0.78rem] font-bold tracking-wide uppercase transition-colors group-hover:text-primary"
                style={{ color: muteColor, opacity: 0.75 }}>
                Denominators
              </span>
            </div>
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
