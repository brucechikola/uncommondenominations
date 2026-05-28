import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { BookOpen, CheckCircle2, CreditCard, Download, Landmark, Loader2, Smartphone, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateReceiptPdf } from "@/lib/generate-receipt";
import { detectMobileNetwork, extractZambianSubscriberDigits, MOBILE_NETWORK_META, toNormalizedZambianPhone, type MobileNetworkMethod } from "@/lib/mobile-money";

interface OrderData {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  city: string;
  productType: string;
  quantity: number;
  totalAmount: number;
  status: string;
  pricingTier: string;
  notes?: string | null;
  payment: { id: number; status: string; method: string; reference: string } | null;
}

type PayMethod = "mobile_money" | "visa_mastercard" | "bank_transfer";

const PAYMENT_OPTIONS: Array<{ id: PayMethod; label: string; icon: typeof Smartphone }> = [
  { id: "mobile_money", label: "Mobile Money", icon: Smartphone },
  { id: "visa_mastercard", label: "Card", icon: CreditCard },
  { id: "bank_transfer", label: "Bank", icon: Landmark },
];

const POLL_TIMEOUT_MS = 3 * 60 * 1000;
const POLL_INTERVALS_MS = [5000, 7000, 10000] as const;
const PAYMENT_TIMEOUT_MESSAGE = "Timed out waiting for payment confirmation.";

function fmtMoney(n: number) {
  return `K${n.toLocaleString("en-ZM", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function methodLabel(method: string) {
  return method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function NetworkLogo({ method, size = 36 }: { method: MobileNetworkMethod; size?: number }) {
  const meta = MOBILE_NETWORK_META[method];
  return (
    <div
      className="overflow-hidden rounded-xl flex items-center justify-center flex-shrink-0 bg-white"
      style={{ width: size, height: size, border: `1px solid ${meta.accent}`, boxShadow: `0 0 0 3px ${meta.accent}12` }}
    >
      <img src={meta.logo} alt={meta.label} className="w-full h-full object-cover" />
    </div>
  );
}

export default function PayByLink() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PayMethod>("mobile_money");
  const [phoneInput, setPhoneInput] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [paymentDone, setPaymentDone] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [processingDeadline, setProcessingDeadline] = useState<number | null>(null);
  const [countdownRemainingMs, setCountdownRemainingMs] = useState(0);

  useEffect(() => {
    fetch(`/api/pay/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then(setOrder)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const subscriberDigits = extractZambianSubscriberDigits(phoneInput);
  const normalizedMobileNumber = toNormalizedZambianPhone(subscriberDigits);
  const detectedNetwork = detectMobileNetwork(subscriberDigits);
  const detectedMeta = detectedNetwork ? MOBILE_NETWORK_META[detectedNetwork] : null;
  const canPay = selectedMethod === "mobile_money" ? normalizedMobileNumber.length === 12 && !!detectedNetwork : true;
  const countdownProgress = Math.max(0, Math.min(100, (countdownRemainingMs / POLL_TIMEOUT_MS) * 100));

  useEffect(() => {
    if (!paying || selectedMethod !== "mobile_money" || !processingDeadline) {
      return;
    }

    const updateRemaining = () => {
      setCountdownRemainingMs(Math.max(0, processingDeadline - Date.now()));
    };

    updateRemaining();
    const intervalId = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(intervalId);
  }, [paying, processingDeadline, selectedMethod]);

  function resetCountdown() {
    setProcessingDeadline(null);
    setCountdownRemainingMs(0);
  }

  const handleDownload = async () => {
    if (!order) return;
    const payment = order.payment;
    setDownloading(true);
    try {
      await generateReceiptPdf({
        orderId: order.id,
        fullName: order.fullName,
        phone: order.phone,
        email: order.email ?? "",
        deliveryAddress: order.deliveryAddress ?? "",
        city: order.city ?? "",
        productType: order.productType,
        quantity: order.quantity,
        totalAmount: order.totalAmount,
        notes: order.notes,
        paymentMethod: payment ? methodLabel(payment.method) : "N/A",
        paymentReference: payment?.reference ?? "—",
        paymentStatus: payment?.status ?? "pending",
        issuedDate: new Date().toLocaleDateString("en-ZM", { day: "numeric", month: "long", year: "numeric" }),
      });
    } finally {
      setDownloading(false);
    }
  };

  async function pollPaymentStatus(paymentId: number) {
    const startedAt = Date.now();
    let attempt = 0;

    while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
      const delay = POLL_INTERVALS_MS[Math.min(attempt, POLL_INTERVALS_MS.length - 1)];
      await new Promise((resolve) => setTimeout(resolve, delay));
      const response = await fetch(`/api/payments/${paymentId}/refresh`, { method: "POST" });
      const refreshed = await response.json();
      if (refreshed.status === "successful" || refreshed.status === "failed") {
        return refreshed;
      }
      attempt += 1;
    }

    const response = await fetch(`/api/payments/${paymentId}/refresh`, { method: "POST" });
    return response.json();
  }

  async function markPaymentTimedOut(paymentId: number) {
    const response = await fetch(`/api/payments/${paymentId}/timeout`, { method: "POST" });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : PAYMENT_TIMEOUT_MESSAGE);
    }
    return body as { id: number; status: string; failureReason?: string | null; method: string; reference: string };
  }

  const handlePay = async () => {
    if (!order) return;
    setPaying(true);
    setPayError(null);

    const method = selectedMethod === "mobile_money" ? detectedNetwork : selectedMethod;
    if (!method) {
      setPayError("Enter a valid Zambian mobile money number.");
      setPaying(false);
      return;
    }

    if (selectedMethod === "mobile_money") {
      setProcessingDeadline(Date.now() + POLL_TIMEOUT_MS);
      setCountdownRemainingMs(POLL_TIMEOUT_MS);
    } else {
      resetCountdown();
    }

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          method,
          phoneNumber: selectedMethod === "mobile_money" ? normalizedMobileNumber : undefined,
        }),
      });
      const payment = await res.json();
      if (!res.ok) {
        setPayError(payment.error ?? "Payment failed");
        return;
      }

      if (selectedMethod === "mobile_money") {
        const result = await pollPaymentStatus(payment.id);
        if (result.status === "successful") {
          resetCountdown();
          setPaymentDone(true);
          setOrder((prev) => prev ? { ...prev, payment: result, status: "awaiting_delivery" } : prev);
          return;
        }
        if (result.status === "pending") {
          const timedOut = await markPaymentTimedOut(payment.id);
          resetCountdown();
          setOrder((prev) => prev ? { ...prev, payment: timedOut } : prev);
          setPayError(timedOut.failureReason ?? PAYMENT_TIMEOUT_MESSAGE);
          return;
        }
        resetCountdown();
        setPayError(result.failureReason ?? "Payment failed.");
        return;
      }

      if (payment.gatewayCheckoutUrl) {
        resetCountdown();
        window.location.assign(payment.gatewayCheckoutUrl);
        return;
      }

      resetCountdown();
      setPayError("Payment session could not be created.");
    } catch {
      resetCountdown();
      setPayError("Network error. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#b08a58] animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 text-center">
        <XCircle className="w-14 h-14 text-red-400 mb-4" />
        <h1 className="text-xl font-bold text-slate-100">Link Not Found</h1>
        <p className="text-slate-400 text-sm mt-2">This payment link is invalid or has expired.</p>
      </div>
    );
  }

  if (paymentDone || order?.payment?.status === "successful") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(52,211,153,0.12)", border: "1.5px solid rgba(52,211,153,0.35)" }}>
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Payment Confirmed</h1>
          <p className="text-slate-400 text-sm mt-1">Thank you, {order?.fullName.split(" ")[0]}!</p>
        </div>
        <div className="rounded-2xl p-4 bg-white border border-slate-200 w-full max-w-sm text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Order</span>
            <span className="text-slate-100">#{order?.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Amount paid</span>
            <span className="text-emerald-400 font-bold">{fmtMoney(order?.totalAmount ?? 0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Book</span>
            <span className="text-slate-100 capitalize">{order?.productType} × {order?.quantity}</span>
          </div>
        </div>
        <button onClick={handleDownload} disabled={downloading} className="flex items-center justify-center gap-2 w-full max-w-sm py-3.5 rounded-xl font-semibold text-white disabled:opacity-60 transition-all" style={{ background: "linear-gradient(135deg, #8d6b3d, #b08a58)" }}>
          {downloading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</> : <><Download className="w-4 h-4" />Download Receipt</>}
        </button>
      </div>
    );
  }

  const alreadyPaid = order?.payment?.status === "successful";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-sm mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(141,107,61,0.15)", border: "1px solid rgba(141,107,61,0.35)" }}>
            <BookOpen className="w-5 h-5 text-[#b08a58]" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100">Complete Payment</h1>
            <p className="text-xs text-slate-400">Uncommon Denominators</p>
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-white border border-slate-200 space-y-2">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-3">Order Summary</p>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Customer</span>
            <span className="text-slate-100 font-medium">{order?.fullName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Book</span>
            <span className="text-slate-100 capitalize">{order?.productType}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Quantity</span>
            <span className="text-slate-100">{order?.quantity}</span>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between">
            <span className="text-slate-300 font-semibold text-sm">Total</span>
            <span className="text-emerald-400 font-bold text-lg">{fmtMoney(order?.totalAmount ?? 0)}</span>
          </div>
        </div>

        {alreadyPaid ? (
          <div className="px-4 py-3 rounded-xl bg-yellow-400/10 border border-amber-200 text-amber-700 text-sm text-center">
            A payment for this order is already pending or processing.
          </div>
        ) : (
          <>
            <div>
              <p className="text-sm font-medium text-slate-300 mb-3">Choose Payment Path</p>
              <div className="space-y-2">
                {PAYMENT_OPTIONS.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedMethod(method.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm font-medium transition-all text-left",
                        selectedMethod === method.id
                          ? "border-[#8d6b3d] bg-[#8d6b3d]/10 text-slate-100"
                          : "border-slate-200 bg-white text-slate-500 hover:border-[#8d6b3d]/50",
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {method.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedMethod === "mobile_money" && (
              <div className="rounded-2xl p-4 bg-white border border-slate-200 space-y-3">
                <label className="block text-sm font-medium text-slate-300">Mobile Money Number</label>
                <div
                  className="flex items-center rounded-xl border px-3"
                  style={{
                    background: detectedMeta ? `${detectedMeta.accent}0D` : "#fff",
                    borderColor: detectedMeta ? detectedMeta.accent : "#e2e8f0",
                    borderWidth: detectedMeta ? "1.5px" : "1px",
                    boxShadow: detectedMeta ? `0 0 0 3px ${detectedMeta.accent}18` : "none",
                    minHeight: "3rem",
                  }}
                >
                  <span className="text-sm font-semibold mr-2" style={{ color: detectedMeta ? detectedMeta.accent : "#0f172a" }}>+260</span>
                  <input
                    type="tel"
                    value={subscriberDigits}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="977 123 456"
                    inputMode="numeric"
                    className="w-full bg-transparent outline-none text-base placeholder-slate-400"
                    style={{ color: detectedMeta ? detectedMeta.accent : "#0f172a" }}
                  />
                </div>
                <div className="rounded-xl p-3.5" style={{ background: detectedMeta ? `${detectedMeta.accent}12` : "#f8fafc", border: `1px solid ${detectedMeta ? `${detectedMeta.accent}40` : "#e2e8f0"}` }}>
                  {detectedNetwork && detectedMeta ? (
                    <div className="flex items-center gap-3">
                      <NetworkLogo method={detectedNetwork} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: detectedMeta.accent }}>Detected: {detectedMeta.label}</p>
                        <p className="text-xs text-slate-500">Normalized number: {normalizedMobileNumber}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Airtel: 097 / 077 · MTN: 096 / 076 · Zamtel: 095 / 075</p>
                  )}
                </div>
                {paying && (
                  <div className="rounded-xl p-3.5" style={{ background: "#fff8eb", border: "1px solid rgba(176,138,88,0.25)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8d6b3d]">Time Remaining</span>
                      <span className="font-mono text-lg font-bold text-[#8d6b3d]">{formatCountdown(countdownRemainingMs)}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-[#f1e5d2]">
                      <div
                        className="h-full rounded-full transition-[width] duration-700"
                        style={{ width: `${countdownProgress}%`, background: "linear-gradient(90deg, #8d6b3d 0%, #b08a58 100%)" }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-3">
                      Confirm the payment prompt on your phone before the timer reaches zero.
                    </p>
                  </div>
                )}
              </div>
            )}

            {selectedMethod === "visa_mastercard" && (
              <div className="rounded-2xl p-4 bg-white border border-slate-200 text-sm text-slate-500">
                When you continue, you&apos;ll be taken to the card payment page to finish the payment there.
              </div>
            )}

            {selectedMethod === "bank_transfer" && (
              <div className="rounded-2xl p-4 bg-white border border-slate-200 text-sm text-slate-500">
                When you continue, you&apos;ll be taken to the bank payment page to finish the payment there.
              </div>
            )}

            {payError && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-300 text-sm">{payError}</div>
            )}

            <button
              onClick={handlePay}
              disabled={!canPay || paying}
              className="w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              style={{ background: "linear-gradient(135deg, #8d6b3d, #b08a58)" }}
            >
              {paying && <Loader2 className="w-4 h-4 animate-spin" />}
              {paying
                ? "Processing…"
                : selectedMethod === "mobile_money"
                  ? `Send Prompt ${fmtMoney(order?.totalAmount ?? 0)}`
                  : `Continue ${fmtMoney(order?.totalAmount ?? 0)}`}
            </button>
          </>
        )}

        <p className="text-center text-xs text-slate-600">
          This is a secure payment link for your order of Uncommon Denominators.
        </p>
      </div>
    </div>
  );
}
