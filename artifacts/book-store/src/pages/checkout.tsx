import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCartStore } from "@/lib/store";
import { useCreateOrder, useListProducts } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface CheckoutForm {
  fullName: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  city: string;
  notes?: string;
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
    <div className="py-16 container mx-auto px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs tracking-[0.3em] uppercase text-primary font-medium mb-2">Step 1 of 3</p>
          <h1 className="font-serif text-4xl font-bold mb-12">Your Details</h1>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr,360px] gap-12">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input id="fullName" placeholder="e.g. Chanda Mwale" className={cn(errors.fullName && "border-destructive")}
                  {...register("fullName", { required: "Full name is required", minLength: { value: 2, message: "Name too short" } })} />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" placeholder="e.g. 0977 123 456" className={cn(errors.phone && "border-destructive")}
                  {...register("phone", { required: "Phone is required", minLength: { value: 8, message: "Invalid phone" } })} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input id="email" type="email" placeholder="e.g. you@email.com" className={cn(errors.email && "border-destructive")}
                {...register("email", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" } })} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryAddress">Delivery Address *</Label>
              <Input id="deliveryAddress" placeholder="Street address, house/flat number" className={cn(errors.deliveryAddress && "border-destructive")}
                {...register("deliveryAddress", { required: "Delivery address is required", minLength: { value: 5, message: "Address too short" } })} />
              {errors.deliveryAddress && <p className="text-xs text-destructive">{errors.deliveryAddress.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City / Town *</Label>
              <Input id="city" placeholder="e.g. Lusaka, Ndola, Kitwe" className={cn(errors.city && "border-destructive")}
                {...register("city", { required: "City is required", minLength: { value: 2, message: "City too short" } })} />
              {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Special Instructions (optional)</Label>
              <Input id="notes" placeholder="Any delivery notes or preferences" {...register("notes")} />
            </div>

            {createOrder.isError && (
              <p className="text-sm text-destructive">There was an error placing your order. Please try again.</p>
            )}

            <Button type="submit" size="lg" className="w-full font-serif text-base py-6" disabled={!productType || createOrder.isPending}>
              {createOrder.isPending ? "Placing order…" : "Proceed to Payment"}
            </Button>
          </form>

          {/* Order summary */}
          <div className="lg:sticky lg:top-24 self-start">
            <div className="bg-card border border-card-border rounded-2xl p-6">
              <h2 className="font-serif font-bold text-lg mb-6">Order Summary</h2>

              {/* Edition selector */}
              <div className="space-y-3 mb-6">
                {[paperback, hardcover].filter(Boolean).map((p) => p && (
                  <button key={p.id} type="button" onClick={() => setProductType(p.type as "paperback" | "hardcover")}
                    className={cn("w-full text-left rounded-xl p-4 border-2 transition-all", productType === p.type ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
                    <div className="flex justify-between items-center">
                      <span className="capitalize text-sm font-medium">{p.type}</span>
                      <span className="font-serif font-bold text-primary">K{p.priceKwacha}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 mb-6">
                <Label className="text-sm">Quantity</Label>
                <div className="flex items-center gap-2 ml-auto">
                  <Button type="button" variant="outline" size="sm" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-7 h-7 p-0">−</Button>
                  <span className="font-bold w-5 text-center">{quantity}</span>
                  <Button type="button" variant="outline" size="sm" onClick={() => setQuantity(quantity + 1)} className="w-7 h-7 p-0">+</Button>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-serif text-2xl font-bold text-primary">K{total}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Delivery fee to be arranged after order confirmation.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
