import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t bg-card py-12 md:py-16">
      <div className="container mx-auto grid gap-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <h3 className="font-serif text-2xl font-bold">The Luminous Path</h3>
          <p className="mt-4 text-sm text-muted-foreground max-w-sm">
            A journey into purpose, leadership, and the enduring human spirit by Dr. Amara Zulu. 
            Available in Paperback and Hardcover across Zambia.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Explore</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/shop" className="hover:text-primary">Shop</Link></li>
            <li><Link href="/about-book" className="hover:text-primary">About the Book</Link></li>
            <li><Link href="/about-author" className="hover:text-primary">About Dr. Zulu</Link></li>
            <li><Link href="/reviews" className="hover:text-primary">Reviews</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Support</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/faq" className="hover:text-primary">FAQ</Link></li>
            <li><Link href="/contact" className="hover:text-primary">Contact Us</Link></li>
            <li><Link href="/terms" className="hover:text-primary">Terms & Privacy</Link></li>
            <li><Link href="/admin/login" className="hover:text-primary">Admin</Link></li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto mt-12 border-t pt-8 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Dr. Amara Zulu. All rights reserved.</p>
      </div>
    </footer>
  );
}
