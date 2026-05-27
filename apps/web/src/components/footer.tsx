import { Link } from "wouter";

export function Footer() {
  return (
    <footer style={{ background: "hsl(222,52%,10%)" }} className="py-16">
      <div className="container mx-auto px-6">
        <div className="grid gap-12 md:grid-cols-4 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "hsl(42,78%,46%,0.15)", border: "1px solid hsl(42,78%,46%,0.3)" }}>
                <span className="font-display text-sm font-bold" style={{ color: "#b08a58" }}>U</span>
              </div>
              <h3 className="font-display text-sm font-bold tracking-[0.15em] uppercase"
                style={{ color: "hsl(40,24%,90%)" }}>
                Uncommon Denominators
              </h3>
            </div>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: "hsl(220,18%,58%)" }}>
              Understanding what holds back Zambia's economic transformation — by Monde Mwanalushi &amp; Eric Nalishebo.
              Available in Paperback and Hardcover across Zambia.
            </p>
            <div className="mt-6 gold-line w-24" />
            <p className="mt-4 text-xs font-sans" style={{ color: "hsl(220,18%,42%)" }}>
              To order by phone:{" "}
              <a href="tel:0979697853" className="hover:underline" style={{ color: "#b08a58" }}>0979 697 853</a>
            </p>
          </div>
          <div>
            <h4 className="font-display text-xs font-bold tracking-[0.2em] uppercase mb-5"
              style={{ color: "#b08a58" }}>Explore</h4>
            <ul className="space-y-3 text-sm" style={{ color: "hsl(220,18%,55%)" }}>
              {[
                ["/shop", "Shop"],
                ["/about-book", "About the Book"],
                ["/about-author", "About the Authors"],
                ["/reviews", "Reader Reviews"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="transition-colors tracking-wide hover:text-[#b08a58]">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display text-xs font-bold tracking-[0.2em] uppercase mb-5"
              style={{ color: "#b08a58" }}>Support</h4>
            <ul className="space-y-3 text-sm" style={{ color: "hsl(220,18%,55%)" }}>
              {[
                ["/faq", "FAQ"],
                ["/contact", "Contact Us"],
                ["/terms", "Terms & Privacy"],
                ["/admin/login", "Admin"],
                ["/agent/login", "Agent Portal"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="transition-colors tracking-wide hover:text-[#b08a58]">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="gold-line mb-6" style={{ opacity: 0.35 }} />
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-sans"
          style={{ color: "hsl(220,18%,38%)" }}>
          <p>&copy; {new Date().getFullYear()} Monde Mwanalushi &amp; Eric Nalishebo. All rights reserved.</p>
          <p>Published in Zambia · Delivered Nationwide</p>
        </div>
      </div>
    </footer>
  );
}
