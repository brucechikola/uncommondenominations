import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";

export function Navbar() {
  const [location] = useLocation();
  const cartQuantity = useCartStore((state) => state.quantity);
  const cartProduct = useCartStore((state) => state.productType);

  const isCurrent = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-xl font-bold tracking-tight">The Luminous Path</span>
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link href="/about-book" className={`text-sm font-medium transition-colors hover:text-primary ${isCurrent('/about-book') ? 'text-primary' : 'text-muted-foreground'}`}>
            The Book
          </Link>
          <Link href="/about-author" className={`text-sm font-medium transition-colors hover:text-primary ${isCurrent('/about-author') ? 'text-primary' : 'text-muted-foreground'}`}>
            Author
          </Link>
          <Link href="/reviews" className={`text-sm font-medium transition-colors hover:text-primary ${isCurrent('/reviews') ? 'text-primary' : 'text-muted-foreground'}`}>
            Reviews
          </Link>
          <Link href="/faq" className={`text-sm font-medium transition-colors hover:text-primary ${isCurrent('/faq') ? 'text-primary' : 'text-muted-foreground'}`}>
            FAQ
          </Link>
          <Link href="/contact" className={`text-sm font-medium transition-colors hover:text-primary ${isCurrent('/contact') ? 'text-primary' : 'text-muted-foreground'}`}>
            Contact
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/shop">
            <Button variant={isCurrent('/shop') ? "default" : "outline"} className="font-serif tracking-wide">
              {cartProduct ? `Cart (${cartQuantity})` : "Buy Now"}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
