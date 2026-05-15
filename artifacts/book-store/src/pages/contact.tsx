import { Button } from "@/components/ui/button";
import { useSubmitContact } from "@workspace/api-client-react";
import { useState } from "react";
import { Phone, Mail, MapPin, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { PAGE_BG, CARD_BG, CARD_BORDER, GOLD, TEXT_PRIMARY, TEXT_MUTED, TEXT_DIM } from "@/components/purchase-ui";

const EASE = [0.22, 1, 0.36, 1] as const;

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "hsl(220,45%,9%)",
  border: `1px solid ${CARD_BORDER}`,
  borderRadius: "12px",
  color: TEXT_PRIMARY,
  fontSize: "0.875rem",
  padding: "0.7rem 0.875rem",
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 0.15s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.58rem",
  fontFamily: "var(--font-sans, sans-serif)",
  fontWeight: 600,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: TEXT_DIM,
  marginBottom: "0.45rem",
};

export default function Contact() {
  const submitContact = useSubmitContact();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focused, setFocused] = useState("");

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name || form.name.length < 2) e.name = "Name is required";
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email is required";
    if (!form.message || form.message.length < 10) e.message = "Message must be at least 10 characters";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    try {
      await submitContact.mutateAsync({ data: { name: form.name, email: form.email, phone: form.phone || null, message: form.message } });
      setDone(true);
    } catch { /* handle */ }
  };

  const focusStyle = (field: string): React.CSSProperties => ({
    ...inputStyle,
    borderColor: focused === field ? GOLD : (errors[field] ? "hsl(0,70%,50%)" : CARD_BORDER),
    boxShadow: focused === field ? `0 0 0 3px hsl(42,78%,46%,0.12)` : undefined,
  });

  return (
    <div style={{ background: PAGE_BG, minHeight: "100svh" }} className="overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none">
          <div style={{
            width: "800px", height: "400px",
            background: "radial-gradient(ellipse, hsl(42,78%,46%,0.06) 0%, transparent 65%)",
            filter: "blur(30px)",
          }} />
        </div>
        <div className="relative z-10 container mx-auto px-6 max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
            <p className="font-sans text-[0.6rem] tracking-[0.32em] uppercase font-semibold mb-5"
              style={{ color: GOLD }}>Contact</p>
            <h1 className="font-display font-bold mb-5"
              style={{ fontSize: "clamp(2.2rem,5vw,3.8rem)", color: TEXT_PRIMARY }}>
              Get in Touch
            </h1>
            <div className="w-14 h-[2px] mx-auto mb-7" style={{ background: `linear-gradient(90deg,transparent,${GOLD},transparent)` }} />
            <p className="font-sans text-[0.88rem] max-w-md mx-auto" style={{ color: TEXT_DIM }}>
              Questions, bulk orders, speaking requests, media inquiries — we are here.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Main grid ── */}
      <section className="pb-24">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid lg:grid-cols-[1fr,320px] gap-10">

            {/* ── Form ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, ease: EASE }}>
              <div className="rounded-2xl p-8" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                {done ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-center gap-5">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ background: "hsl(42,78%,46%,0.12)", border: `1px solid hsl(42,78%,46%,0.3)` }}>
                      <span className="text-2xl font-bold" style={{ color: GOLD }}>✓</span>
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-2xl mb-2" style={{ color: TEXT_PRIMARY }}>Message Sent</h2>
                      <p className="font-sans text-[0.85rem]" style={{ color: TEXT_DIM }}>
                        Thank you for reaching out. We will get back to you within 24 hours.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <h2 className="font-display font-bold text-xl mb-6" style={{ color: TEXT_PRIMARY }}>Send a Message</h2>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label style={labelStyle}>Your Name *</label>
                        <input
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          onFocus={() => setFocused("name")} onBlur={() => setFocused("")}
                          placeholder="Full name"
                          style={focusStyle("name")}
                        />
                        {errors.name && <p className="text-[0.7rem] mt-1.5" style={{ color: "hsl(0,70%,58%)" }}>{errors.name}</p>}
                      </div>
                      <div>
                        <label style={labelStyle}>Phone (optional)</label>
                        <input
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          onFocus={() => setFocused("phone")} onBlur={() => setFocused("")}
                          placeholder="0977 123 456"
                          style={focusStyle("phone")}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>Email Address *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        onFocus={() => setFocused("email")} onBlur={() => setFocused("")}
                        placeholder="you@email.com"
                        style={focusStyle("email")}
                      />
                      {errors.email && <p className="text-[0.7rem] mt-1.5" style={{ color: "hsl(0,70%,58%)" }}>{errors.email}</p>}
                    </div>

                    <div>
                      <label style={labelStyle}>Message *</label>
                      <textarea
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        onFocus={() => setFocused("message")} onBlur={() => setFocused("")}
                        placeholder="Write your message here…"
                        rows={5}
                        style={{ ...focusStyle("message"), resize: "none" }}
                      />
                      {errors.message && <p className="text-[0.7rem] mt-1.5" style={{ color: "hsl(0,70%,58%)" }}>{errors.message}</p>}
                    </div>

                    {submitContact.isError && (
                      <p className="text-[0.78rem]" style={{ color: "hsl(0,70%,58%)" }}>Something went wrong. Please try again.</p>
                    )}

                    <motion.div whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }} className="inline-block">
                      <Button type="submit" disabled={submitContact.isPending}
                        className="font-display tracking-[0.14em] uppercase border-0"
                        style={{ fontSize: "0.7rem", height: "3rem", padding: "0 2.5rem",
                          background: GOLD, color: "#fff", fontWeight: 700, boxShadow: "0 4px 20px hsl(42,78%,46%,0.25)",
                          opacity: submitContact.isPending ? 0.7 : 1 }}>
                        {submitContact.isPending ? "Sending…" : "Send Message"}
                      </Button>
                    </motion.div>
                  </form>
                )}
              </div>
            </motion.div>

            {/* ── Sidebar ── */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18, ease: EASE }} className="space-y-5">

              {/* Contact details */}
              <div className="rounded-xl p-6" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                <h3 className="font-sans text-[0.58rem] tracking-[0.26em] uppercase font-bold mb-5" style={{ color: GOLD }}>
                  Contact Details
                </h3>
                <div className="space-y-5">
                  {[
                    { icon: Phone, label: "Phone / WhatsApp", content: <a href="tel:0979697853" className="font-mono hover:underline" style={{ color: GOLD, fontSize: "0.85rem" }}>0979 697 853</a> },
                    { icon: Mail,  label: "Email",            content: <a href="mailto:info@uncommondenominators.co.zm" className="hover:underline" style={{ color: GOLD, fontSize: "0.82rem" }}>info@uncommondenominators.co.zm</a> },
                    { icon: MapPin,label: "Office",           content: <span className="font-sans" style={{ color: TEXT_MUTED, fontSize: "0.82rem" }}>Lusaka, Zambia</span> },
                  ].map(({ icon: Icon, label, content }) => (
                    <div key={label} className="flex items-start gap-3.5"
                      style={{ borderBottom: `1px solid ${CARD_BORDER}`, paddingBottom: "1rem" }}>
                      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                        style={{ background: "hsl(42,78%,46%,0.08)", border: `1px solid hsl(42,78%,46%,0.2)` }}>
                        <Icon className="h-3.5 w-3.5" style={{ color: GOLD }} />
                      </div>
                      <div>
                        <p className="font-sans text-[0.6rem] tracking-[0.14em] uppercase mb-1" style={{ color: TEXT_DIM }}>{label}</p>
                        {content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bulk orders */}
              <div className="rounded-xl p-6" style={{ background: "hsl(42,78%,46%,0.06)", border: `1px solid hsl(42,78%,46%,0.18)` }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <MessageSquare className="h-4 w-4 flex-shrink-0" style={{ color: GOLD }} />
                  <h3 className="font-sans text-[0.62rem] tracking-[0.18em] uppercase font-bold" style={{ color: GOLD }}>
                    Bulk Orders
                  </h3>
                </div>
                <p className="font-sans text-[0.8rem] leading-relaxed" style={{ color: TEXT_DIM }}>
                  Ordering 10 or more copies for a school, organization, or event? Contact us to discuss pricing and arrangements.
                </p>
              </div>

            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}
