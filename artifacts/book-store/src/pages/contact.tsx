import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSubmitContact } from "@workspace/api-client-react";
import { useState } from "react";
import { Phone, Mail, MapPin, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Contact() {
  const submitContact = useSubmitContact();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  return (
    <div className="overflow-x-hidden">
      <section className="py-16 bg-gradient-to-b from-muted/60 to-background">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs tracking-[0.3em] uppercase text-primary font-medium mb-4">Contact</p>
            <h1 className="font-serif text-5xl font-bold mb-4">Get in Touch</h1>
            <p className="text-muted-foreground">Questions, bulk orders, speaking requests, media inquiries — we are here.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 container mx-auto px-6">
        <div className="grid lg:grid-cols-[1fr,380px] gap-16 max-w-5xl mx-auto">
          <div>
            {done ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-6" />
                <h2 className="font-serif text-3xl font-bold mb-3">Message Sent!</h2>
                <p className="text-muted-foreground">Thank you for reaching out. We will get back to you within 24 hours.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="font-serif text-2xl font-bold mb-6">Send a Message</h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label>Your Name *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Full name" className={cn(errors.name && "border-destructive")} />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Phone (optional)</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0977 123 456" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email Address *</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@email.com" className={cn(errors.email && "border-destructive")} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Message *</Label>
                  <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Write your message here…" rows={5}
                    className={cn("w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", errors.message ? "border-destructive" : "border-input")} />
                  {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
                </div>
                {submitContact.isError && <p className="text-sm text-destructive">Something went wrong. Please try again.</p>}
                <Button type="submit" size="lg" className="font-serif px-10 py-6" disabled={submitContact.isPending}>
                  {submitContact.isPending ? "Sending…" : "Send Message"}
                </Button>
              </form>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-card border border-card-border rounded-2xl p-6 space-y-6">
              <h2 className="font-serif font-bold text-lg">Contact Details</h2>
              <div className="flex items-start gap-4">
                <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Phone / WhatsApp</p>
                  <a href="tel:0962219419" className="text-primary text-sm hover:underline font-mono">0962 219 419</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Mail className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Email</p>
                  <a href="mailto:info@luminouspath.co.zm" className="text-primary text-sm hover:underline">info@luminouspath.co.zm</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Office</p>
                  <p className="text-sm text-muted-foreground">Lusaka, Zambia</p>
                </div>
              </div>
            </div>

            <div className="bg-secondary text-secondary-foreground rounded-2xl p-6">
              <h3 className="font-serif font-bold mb-3">Bulk Orders</h3>
              <p className="text-secondary-foreground/70 text-sm leading-relaxed">
                Ordering 10 or more copies for a school, organization, or event? Contact us to discuss pricing and arrangements.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
