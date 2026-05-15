import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCartStore } from "@/lib/store";
import { useInitiatePayment, useSimulatePayment, useGetOrder } from "@workspace/api-client-react";
import { getGetOrderQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, CreditCard, Building2, Smartphone, CheckCircle2, XCircle, Loader2 } from "lucide-react";

const METHODS = [
  { id: "airtel_money", label: "Airtel Money", icon: Smartphone, detail: "Pay with your Airtel mobile wallet" },
  { id: "mtn_money", label: "MTN Mobile Money", icon: Smartphone, detail: "Pay with your MTN MoMo account" },
  { id: "zamtel_money", label: "Zamtel Money", icon: Smartphone, detail: "Pay with your Zamtel Kwacha wallet" },
  { id: "visa_mastercard", label: "Visa / Mastercard", icon: CreditCard, detail: "Pay with your debit or credit card" },
  { id: "bank_transfer", label: "Bank Transfer", icon: Building2, detail: "Transfer directly from your bank account" },
] as const;

type Method = (typeof METHODS)[number]["id"];

export default function Payment() {
  const [, navigate] = useLocation();
  const { currentOrderId, setCurrentPaymentId } = useCartStore();
  const [selectedMethod, setSelectedMethod] = useState<Method | null>(null);
  const [phone, setPhone] = useState("");
  const [accountName, setAccountName] = useState("");
  const [stage, setStage] = useState<"select" | "processing" | "success" | "failed">("select");

  const { data: order } = useGetOrder(currentOrderId!, { query: { enabled: !!currentOrderId, queryKey: getGetOrderQueryKey(currentOrderId!) } });

  const initiatePayment = useInitiatePayment();
  const simulatePayment = useSimulatePayment();

  const isMobileMoney = !!(selectedMethod && ["airtel_money", "mtn_money", "zamtel_money"].includes(selectedMethod));

  const handlePay = async () => {
    if (!selectedMethod || !currentOrderId) return;
    setStage("processing");

    try {
      const payment = await initiatePayment.mutateAsync({
        data: {
          orderId: currentOrderId,
          method: selectedMethod,
          phoneNumber: isMobileMoney ? phone : null,
          accountName: accountName || null,
        },
      });
      setCurrentPaymentId(payment.id);

      // Simulate processing delay
      await new Promise((r) => setTimeout(r, 2500));

      const result = await simulatePayment.mutateAsync({ id: payment.id, data: { outcome: "successful" } });
      if (result.status === "successful") {
        setStage("success");
        setTimeout(() => navigate("/confirmation"), 1800);
      } else {
        setStage("failed");
      }
    } catch {
      setStage("failed");
    }
  };

  return (
    <div className="py-16 container mx-auto px-6">
      <div className="max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs tracking-[0.3em] uppercase text-primary font-medium mb-2">Step 2 of 3</p>
          <h1 className="font-serif text-4xl font-bold mb-2">Payment</h1>
          {order && (
            <p className="text-muted-foreground mb-10">
              Order #{order.id} — <span className="capitalize">{order.productType}</span> ×{order.quantity} — <span className="font-semibold text-foreground">K{order.totalAmount}</span>
            </p>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {stage === "select" && (
            <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Manual payment note */}
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6 flex gap-3">
                <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Manual payment: <span className="font-bold text-primary">0962 219 419</span></p>
                  <p className="text-xs text-muted-foreground mt-0.5">You can also call or WhatsApp this number to arrange payment directly.</p>
                </div>
              </div>

              <h2 className="font-serif font-semibold text-lg mb-4">Choose Payment Method</h2>
              <div className="space-y-3 mb-8">
                {METHODS.map(({ id, label, icon: Icon, detail }) => (
                  <button key={id} type="button" onClick={() => setSelectedMethod(id)}
                    className={cn("w-full text-left rounded-xl border-2 p-4 transition-all flex items-start gap-4",
                      selectedMethod === id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 bg-card")}>
                    <div className={cn("mt-0.5 rounded-lg p-2", selectedMethod === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">{detail}</p>
                    </div>
                  </button>
                ))}
              </div>

              {selectedMethod && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4 mb-8">
                  {isMobileMoney && (
                    <div className="space-y-2">
                      <Label>Mobile Money Number *</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0977 123 456" />
                    </div>
                  )}
                  {selectedMethod === "bank_transfer" && (
                    <div className="bg-muted/60 rounded-xl p-4 text-sm space-y-2">
                      <p className="font-medium">Bank Transfer Details</p>
                      <p className="text-muted-foreground">Bank: <span className="text-foreground">First National Bank Zambia</span></p>
                      <p className="text-muted-foreground">Account: <span className="text-foreground">1234567890</span></p>
                      <p className="text-muted-foreground">Name: <span className="text-foreground">Lumina Publications Ltd</span></p>
                      <p className="text-muted-foreground">Reference: <span className="text-foreground">Order #{currentOrderId}</span></p>
                    </div>
                  )}
                  {selectedMethod === "visa_mastercard" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Cardholder Name</Label>
                        <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Name on card" />
                      </div>
                      <div className="space-y-2">
                        <Label>Card Number (demo)</Label>
                        <Input placeholder="4242 4242 4242 4242" disabled className="bg-muted" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Expiry</Label><Input placeholder="MM/YY" disabled className="bg-muted" /></div>
                        <div className="space-y-2"><Label>CVC</Label><Input placeholder="123" disabled className="bg-muted" /></div>
                      </div>
                      <p className="text-xs text-muted-foreground">This is a simulated payment. No real card data is collected.</p>
                    </div>
                  )}
                </motion.div>
              )}

              <Button size="lg" className="w-full font-serif text-base py-6" onClick={handlePay}
                disabled={!selectedMethod || (isMobileMoney && !phone)}>
                Pay K{order?.totalAmount ?? 0}
              </Button>
            </motion.div>
          )}

          {stage === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-24">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-6" />
              <h2 className="font-serif text-2xl font-bold mb-2">Processing Payment</h2>
              <p className="text-muted-foreground">Please wait while we confirm your transaction…</p>
              {isMobileMoney && (
                <p className="text-sm text-muted-foreground mt-4">Check your phone for a payment prompt.</p>
              )}
            </motion.div>
          )}

          {stage === "success" && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-24">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <h2 className="font-serif text-2xl font-bold mb-2">Payment Successful!</h2>
              <p className="text-muted-foreground">Redirecting to your confirmation…</p>
            </motion.div>
          )}

          {stage === "failed" && (
            <motion.div key="failed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-6" />
              <h2 className="font-serif text-2xl font-bold mb-2">Payment Failed</h2>
              <p className="text-muted-foreground mb-8">Something went wrong. Please try again or contact us on 0962 219 419.</p>
              <Button onClick={() => setStage("select")} className="font-serif">Try Again</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
