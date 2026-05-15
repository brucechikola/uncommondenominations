import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/lib/store";
import { useCreateOrder, useListProducts } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { StepIndicator, MiniBook,
  PAGE_BG, CARD_BG, CARD_BORDER, GOLD, TEXT_PRIMARY, TEXT_MUTED, TEXT_DIM } from "@/components/purchase-ui";

interface CheckoutForm {
  fullName: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  city: string;
  notes?: string;
}

const inputStyle = (err?: boolean): React.CSSProperties => ({
  background: "hsl(222,54%,8%)",
  borderColor: err ? "hsl(0,70%,50%)" : "hsl(220,38%,17%)",
  color: TEXT_PRIMARY,
  height: "3rem",
  borderRadius: "2px",
  fontSize: "0.875rem",
  fontFamily: "var(--app-font-sans)",
});

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-sans text-[0.67rem] tracking-[0.14em] uppercase font-medium mb-2"
      style={{ color: "hsl(40,18%,48%)" }}>
      {children}
    </label>
  );
}

export default function Checkout() {
  const [, navigate] = useLocation();
  const { productType, quantity, setProductType, setQuantity, setBuyerDetails, setCurrentOrderId } = useCartStore();
  const { data: products } = useListProducts();
  const createOrder = useCreateOrder();

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutForm>();

  const paperback = products?.find((p) => p.type === "paperback");
  const hardcover = products?.find((p) => p.type === "hardcover");
  const selectedProduct = products?.find((p) => p.type === productType);
  const total = selectedProduct ? selectedProduct.priceKwacha * quantity : 0;

  const onSubmit = async (data: CheckoutForm) => {
    if (!productType) return;
    setBuyerDetails(data);
    try {
      const order = await createOrder.mutateAsync({
        data: {
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
          deliveryAddress: data.deliveryAddress,
          city: data.city,
          productType: productType as "paperback" | "hardcover",
          quantity,
          notes: data.notes ?? null,
        },
      });
      setCurrentOrderId(order.id);
      navigate("/payment");
    } catch {
      // error handled by mutation state
    }
  };

  return (
    <div style={{ minHeight: "100svh", background: PAGE_BG, position: "relative" }}
      className="pt-[4.5rem] pb-24">

      {/* Page atmosphere */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[420px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, hsl(222,65%,13%,0.7) 0%, transparent 65%)", zIndex: 0 }} />

      <div className="relative z-10 container mx-auto px-6 pt-14 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <StepIndicator current={1} />
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-10">

          {/* ── LEFT: Form ── */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <h1 className="font-display text-[2.1rem] font-bold mb-2 leading-tight" style={{ color: TEXT_PRIMARY }}>
              Your Details
            </h1>
            <p className="font-serif text-sm mb-10" style={{ color: TEXT_MUTED }}>
              Enter your delivery information to complete the order.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Name + Phone */}
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <FieldLabel>Full Name *</FieldLabel>
                  <Input placeholder="e.g. Chanda Mwale"
                    style={inputStyle(!!errors.fullName)}
                    className="placeholder:text-[hsl(220,18%,28%)] focus-visible:ring-1 focus-visible:ring-[hsl(42,78%,46%,0.3)] focus-visible:ring-offset-0"
                    {...register("fullName", { required: "Full name is required", minLength: { value: 2, message: "Name too short" } })} />
                  {errors.fullName && (
                    <p className="mt-1.5 font-sans text-[0.65rem]" style={{ color: "hsl(0,72%,58%)" }}>
                      {errors.fullName.message}
                    </p>
                  )}
                </div>
                <div>
                  <FieldLabel>Phone Number *</FieldLabel>
                  <Input placeholder="e.g. 0977 123 456"
                    style={inputStyle(!!errors.phone)}
                    className="placeholder:text-[hsl(220,18%,28%)] focus-visible:ring-1 focus-visible:ring-[hsl(42,78%,46%,0.3)] focus-visible:ring-offset-0"
                    {...register("phone", { required: "Phone is required", minLength: { value: 8, message: "Invalid phone" } })} />
                  {errors.phone && (
                    <p className="mt-1.5 font-sans text-[0.65rem]" style={{ color: "hsl(0,72%,58%)" }}>
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <FieldLabel>Email Address *</FieldLabel>
                <Input type="email" placeholder="e.g. you@email.com"
                  style={inputStyle(!!errors.email)}
                  className="placeholder:text-[hsl(220,18%,28%)] focus-visible:ring-1 focus-visible:ring-[hsl(42,78%,46%,0.3)] focus-visible:ring-offset-0"
                  {...register("email", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" } })} />
                {errors.email && (
                  <p className="mt-1.5 font-sans text-[0.65rem]" style={{ color: "hsl(0,72%,58%)" }}>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Address */}
              <div>
                <FieldLabel>Delivery Address *</FieldLabel>
                <Input placeholder="Street address, house/flat number"
                  style={inputStyle(!!errors.deliveryAddress)}
                  className="placeholder:text-[hsl(220,18%,28%)] focus-visible:ring-1 focus-visible:ring-[hsl(42,78%,46%,0.3)] focus-visible:ring-offset-0"
                  {...register("deliveryAddress", { required: "Delivery address is required", minLength: { value: 5, message: "Address too short" } })} />
                {errors.deliveryAddress && (
                  <p className="mt-1.5 font-sans text-[0.65rem]" style={{ color: "hsl(0,72%,58%)" }}>
                    {errors.deliveryAddress.message}
                  </p>
                )}
              </div>

              {/* City */}
              <div>
                <FieldLabel>City / Town *</FieldLabel>
                <Input placeholder="e.g. Lusaka, Ndola, Kitwe"
                  style={inputStyle(!!errors.city)}
                  className="placeholder:text-[hsl(220,18%,28%)] focus-visible:ring-1 focus-visible:ring-[hsl(42,78%,46%,0.3)] focus-visible:ring-offset-0"
                  {...register("city", { required: "City is required", minLength: { value: 2, message: "City too short" } })} />
                {errors.city && (
                  <p className="mt-1.5 font-sans text-[0.65rem]" style={{ color: "hsl(0,72%,58%)" }}>
                    {errors.city.message}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <FieldLabel>Special Instructions <span style={{ color: TEXT_DIM }}>(optional)</span></FieldLabel>
                <Input placeholder="Any delivery notes or preferences"
                  style={inputStyle()}
                  className="placeholder:text-[hsl(220,18%,28%)] focus-visible:ring-1 focus-visible:ring-[hsl(42,78%,46%,0.3)] focus-visible:ring-offset-0"
                  {...register("notes")} />
              </div>

              {createOrder.isError && (
                <p className="font-sans text-sm rounded-sm px-4 py-3"
                  style={{ background: "hsl(0,60%,12%)", border: "1px solid hsl(0,60%,22%)", color: "hsl(0,72%,62%)" }}>
                  There was an error placing your order. Please try again.
                </p>
              )}

              {/* Divider */}
              <div className="h-px my-2" style={{ background: CARD_BORDER }} />

              <motion.div whileHover={{ scale: 1.015, y: -1 }} whileTap={{ scale: 0.98 }}>
                <Button type="submit" size="lg" className="w-full border-0 font-sans tracking-[0.14em] uppercase"
                  disabled={!productType || createOrder.isPending}
                  style={{ fontSize: "0.7rem", height: "3rem",
                    background: productType ? GOLD : "hsl(220,38%,12%)",
                    color: productType ? "hsl(222,58%,7%)" : TEXT_DIM,
                    boxShadow: productType ? "0 4px 24px hsl(42,78%,46%,0.28)" : "none",
                    transition: "all 0.2s" }}>
                  {createOrder.isPending ? "Placing order…" : "Proceed to Payment →"}
                </Button>
              </motion.div>
            </form>
          </motion.div>

          {/* ── RIGHT: sticky order summary ── */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}
            className="lg:sticky lg:top-24 self-start">
            <div className="rounded-sm overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>

              {/* Book visual */}
              <div className="flex items-center justify-center py-8"
                style={{ background: "hsl(222,58%,6%)", borderBottom: `1px solid ${CARD_BORDER}` }}>
                <div style={{ position: "relative" }}>
                  <div style={{
                    position: "absolute", inset: "-20px",
                    background: "radial-gradient(ellipse, hsl(42,78%,46%,0.08) 0%, transparent 70%)",
                    filter: "blur(8px)",
                  }} />
                  <MiniBook size={100} />
                </div>
              </div>

              <div className="p-6">
                <h2 className="font-sans text-[0.58rem] font-bold tracking-[0.28em] uppercase mb-5"
                  style={{ color: TEXT_DIM }}>Order Summary</h2>

                {/* Edition selector */}
                <div className="space-y-2.5 mb-5">
                  {[paperback, hardcover].filter(Boolean).map((p) => p && (
                    <button key={p.id} type="button"
                      onClick={() => setProductType(p.type as "paperback" | "hardcover")}
                      className="w-full text-left rounded-sm p-3.5 transition-all"
                      style={{
                        background: productType === p.type ? "hsl(222,52%,11%)" : "transparent",
                        border: `1px solid ${productType === p.type ? GOLD : "hsl(220,38%,14%)"}`,
                      }}>
                      <div className="flex justify-between items-center">
                        <span className="font-sans text-[0.72rem] capitalize font-medium" style={{ color: TEXT_PRIMARY }}>
                          {p.type}
                        </span>
                        <span className="font-display font-bold text-base" style={{ color: GOLD }}>
                          K{p.priceKwacha}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Qty */}
                <div className="flex items-center justify-between mb-5">
                  <span className="font-sans text-[0.67rem] uppercase tracking-[0.12em]" style={{ color: TEXT_DIM }}>
                    Quantity
                  </span>
                  <div className="flex items-center gap-2.5">
                    <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-7 h-7 rounded-sm flex items-center justify-center font-bold text-sm"
                      style={{ background: "hsl(220,38%,11%)", border: `1px solid ${CARD_BORDER}`, color: TEXT_MUTED }}>
                      −
                    </button>
                    <span className="font-display font-bold w-5 text-center" style={{ color: TEXT_PRIMARY }}>
                      {quantity}
                    </span>
                    <button type="button" onClick={() => setQuantity(quantity + 1)}
                      className="w-7 h-7 rounded-sm flex items-center justify-center font-bold text-sm"
                      style={{ background: "hsl(220,38%,11%)", border: `1px solid ${CARD_BORDER}`, color: TEXT_MUTED }}>
                      +
                    </button>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center py-4"
                  style={{ borderTop: `1px solid ${CARD_BORDER}` }}>
                  <span className="font-sans text-[0.65rem] uppercase tracking-[0.14em]" style={{ color: TEXT_DIM }}>
                    Total
                  </span>
                  <span className="font-display text-2xl font-bold" style={{ color: GOLD }}>
                    K{total}
                  </span>
                </div>

                <p className="font-sans text-[0.62rem] leading-relaxed mt-3" style={{ color: TEXT_DIM }}>
                  Delivery fee arranged after order confirmation.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
