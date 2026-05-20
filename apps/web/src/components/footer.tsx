import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t border-white/8 bg-[hsl(220,52%,5%)] py-16">
      <div className="container mx-auto px-6">
        <div className="grid gap-12 md:grid-cols-4 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                <span className="text-primary font-display text-sm font-bold">U</span>
              </div>
              <h3 className="font-display text-sm font-bold tracking-[0.15em] uppercase text-foreground/90">
                Uncommon Denominators
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Understanding what holds back Zambia's economic transformation — by Monde Mwanalushi &amp; Eric Nalishebo.
              Available in Paperback and Hardcover across Zambia.
            </p>
            <div className="mt-6 gold-line w-24" />
            <p className="mt-4 text-xs text-muted-foreground/60 font-sans">
              To order by phone: <a href="tel:0979697853" className="text-primary hover:underline">0979 697 853</a>
            </p>
          </div>
          <div>
            <h4 className="font-display text-xs font-bold tracking-[0.2em] uppercase text-primary mb-5">Explore</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                ["/shop", "Shop"],
                ["/about-book", "About the Book"],
                ["/about-author", "About the Authors"],
                ["/reviews", "Reader Reviews"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-primary transition-colors tracking-wide">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display text-xs font-bold tracking-[0.2em] uppercase text-primary mb-5">Support</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                ["/faq", "FAQ"],
                ["/contact", "Contact Us"],
                ["/terms", "Terms & Privacy"],
                ["/admin/login", "Admin"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-primary transition-colors tracking-wide">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="gold-line mb-6" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground/50 font-sans">
          <p>&copy; {new Date().getFullYear()} Monde Mwanalushi &amp; Eric Nalishebo. All rights reserved.</p>
          <p>Published in Zambia · Delivered Nationwide</p>
        </div>
      </div>
    </footer>
  );
}
