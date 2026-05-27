export type MobileNetworkMethod = "airtel_money" | "mtn_money" | "zamtel_money";

export const MOBILE_NETWORK_META: Record<MobileNetworkMethod, {
  label: string;
  accent: string;
  bg: string;
  abbr: string;
  network: string;
  logo: string;
}> = {
  airtel_money: {
    label: "Airtel Money",
    accent: "hsl(0,82%,52%)",
    bg: "hsl(0,70%,10%)",
    abbr: "A",
    network: "Airtel",
    logo: "/payment-networks/airtel.jpg",
  },
  mtn_money: {
    label: "MTN Mobile Money",
    accent: "hsl(44,96%,38%)",
    bg: "hsl(46,88%,14%)",
    abbr: "MTN",
    network: "MTN",
    logo: "/payment-networks/mtn.jpeg",
  },
  zamtel_money: {
    label: "Zamtel Money",
    accent: "hsl(146,72%,32%)",
    bg: "hsl(146,58%,12%)",
    abbr: "ZM",
    network: "Zamtel",
    logo: "/payment-networks/zamtel.png",
  },
};

export function extractZambianSubscriberDigits(input: string): string {
  const digits = input.replace(/\D/g, "");
  const subscriber = digits.startsWith("260")
    ? digits.slice(3)
    : digits.startsWith("0")
      ? digits.slice(1)
      : digits;

  return subscriber.slice(0, 9);
}

export function toNormalizedZambianPhone(subscriber: string): string {
  return subscriber.length === 9 ? `260${subscriber}` : "";
}

export function detectMobileNetwork(subscriber: string): MobileNetworkMethod | null {
  if (subscriber.length < 2) return null;

  const prefix = subscriber.slice(0, 2);
  if (prefix === "97" || prefix === "77") return "airtel_money";
  if (prefix === "96" || prefix === "76") return "mtn_money";
  if (prefix === "95" || prefix === "75") return "zamtel_money";
  return null;
}
