import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";
import { useGetOrder, useGetPayment, getGetOrderQueryKey, getGetPaymentQueryKey } from "@workspace/api-client-react";
import { CheckCircle2, Package, Truck, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";

export default function Confirmation() {
  const { currentOrderId, currentPaymentId, clearCart } = useCartStore();

  const { data: order } = useGetOrder(currentOrderId!, {
    query: { enabled: !!currentOrderId, queryKey: getGetOrderQueryKey(currentOrderId!) },
  });
  const { data: payment } = useGetPayment(currentPaymentId!, {
    query: { enabled: !!currentPaymentId, queryKey: getGetPaymentQueryKey(currentPaymentId!) },
  });

  useEffect(() => {
    // Clear cart after showing confirmation
    const timer = setTimeout(() => clearCart(), 30000);
    return () => clearTimeout(timer);
  }, [clearCart]);

  return (
    <div className="py-16 container mx-auto px-6">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
          <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-6" />
          <p className="text-xs tracking-[0.3em] uppercase text-primary font-medium mb-3">Step 3 of 3</p>
          <h1 className="font-serif text-4xl lg:text-5xl font-bold mb-4">Order Confirmed!</h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-12">
            Thank you for your order. Your copy of <em>The Luminous Path</em> is on its way to you.
          </p>
        </motion.div>

        {(order || payment) && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-card border border-card-border rounded-2xl p-8 text-left mb-12">
            <h2 className="font-serif font-bold text-lg mb-6">Receipt</h2>
            <div className="space-y-4 text-sm">
              {order && (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">Order ID</span><span className="font-mono font-medium">#{order.id}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{order.fullName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Edition</span><span className="font-medium capitalize">{order.productType}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Quantity</span><span className="font-medium">{order.quantity}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Delivery to</span><span className="font-medium">{order.city}</span></div>
                  <div className="flex justify-between border-t border-border pt-4"><span className="font-medium">Total Paid</span><span className="font-serif font-bold text-primary text-lg">K{order.totalAmount}</span></div>
                </>
              )}
              {payment && (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">Payment Method</span><span className="font-medium capitalize">{payment.method.replace("_", " ")}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-mono text-xs bg-muted px-2 py-1 rounded">{payment.reference}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Status</span>
                    <span className={`font-medium capitalize ${payment.status === "successful" ? "text-green-600" : payment.status === "failed" ? "text-destructive" : "text-amber-600"}`}>
                      {payment.status}
                    </span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Package, title: "Order Received", desc: "We have received your order and payment." },
            { icon: Phone, title: "We Will Call You", desc: "Our team will contact you within 24 hours to arrange delivery." },
            { icon: Truck, title: "Fast Delivery", desc: "Most orders are delivered within 2–5 business days." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card border border-card-border rounded-xl p-5 text-center">
              <Icon className="h-6 w-6 text-primary mx-auto mb-3" />
              <h3 className="font-serif font-semibold text-sm mb-1">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/"><Button className="font-serif" variant="outline">Back to Home</Button></Link>
          <Link href="/shop"><Button className="font-serif">Order Another Copy</Button></Link>
        </div>
      </div>
    </div>
  );
}
