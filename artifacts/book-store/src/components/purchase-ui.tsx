/* Shared micro-components for the purchase flow */

export function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1 as const, label: "Your Details" },
    { n: 2 as const, label: "Payment" },
    { n: 3 as const, label: "Confirmed" },
  ];
  return (
    <div className="flex items-center mb-12">
      {steps.map(({ n, label }, i) => {
        const done   = n < current;
        const active = n === current;
        return (
          <div key={n} className="flex items-center">
            <div className="flex items-center gap-2.5">
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.62rem", fontWeight: 700, fontFamily: "var(--app-font-sans)",
                background: active ? "hsl(42,78%,46%)" : done ? "hsl(42,78%,22%,0.5)" : "hsl(220,38%,11%)",
                border: active ? "none" : done ? "1px solid hsl(42,78%,40%,0.45)" : "1px solid hsl(220,38%,16%)",
                color: active ? "hsl(222,58%,8%)" : done ? "hsl(42,78%,58%)" : "hsl(220,18%,30%)",
              }}>
                {done ? "✓" : n}
              </div>
              <span style={{
                fontFamily: "var(--app-font-sans)", fontSize: "0.6rem",
                fontWeight: active ? 600 : 400,
                letterSpacing: "0.12em", textTransform: "uppercase" as const,
                color: active ? "hsl(42,78%,62%)" : done ? "hsl(42,78%,42%)" : "hsl(220,18%,26%)",
              }}>{label}</span>
            </div>
            {i < 2 && (
              <div style={{
                width: 36, height: 1, margin: "0 10px",
                background: done ? "hsl(42,78%,38%,0.4)" : "hsl(220,38%,12%)",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function MiniBook({ size = 110 }: { size?: number }) {
  const h = Math.round(size * 1.42);
  const fs = (r: number) => `${Math.round(size * r)}px`;
  return (
    <div style={{ width: size, height: h, position: "relative", flexShrink: 0 }}>
      {/* Spine */}
      <div style={{
        position: "absolute", left: -Math.round(size * 0.07), top: 3, bottom: 3,
        width: Math.round(size * 0.07),
        background: "linear-gradient(90deg, hsl(222,62%,5%) 0%, hsl(222,62%,10%) 100%)",
        borderRadius: "2px 0 0 2px",
      }} />
      {/* Cover */}
      <div style={{
        width: "100%", height: "100%", position: "relative", overflow: "hidden",
        background: "linear-gradient(148deg, hsl(222,65%,17%) 0%, hsl(222,60%,12%) 100%)",
        border: "1px solid hsl(220,38%,20%)",
        borderRadius: 2,
        boxShadow: "-5px 8px 28px hsl(222,60%,3%,0.8), 0 1px 0 hsl(220,38%,26%) inset",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "14% 12%",
      }}>
        {/* Gold bottom strip */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "20%",
          background: "hsl(42,78%,46%)" }} />
        {/* Top divider */}
        <div style={{ width: "68%", height: 1, background: "hsl(42,78%,48%,0.5)", marginBottom: fs(0.14) }} />
        {/* Title */}
        <p style={{
          fontFamily: "var(--app-font-display)", fontWeight: 700, fontSize: fs(0.054),
          color: "hsl(40,28%,90%)", textAlign: "center", lineHeight: 1.2,
          letterSpacing: "0.02em", position: "relative", zIndex: 1,
        }}>THE<br/>LUMINOUS<br/>PATH</p>
        {/* Middle divider */}
        <div style={{ width: "68%", height: 1, background: "hsl(42,78%,48%,0.5)",
          margin: `${fs(0.12)} 0 ${fs(0.14)}` }} />
        {/* Author */}
        <p style={{
          fontFamily: "var(--app-font-display)", fontStyle: "italic", fontWeight: 400,
          fontSize: fs(0.038), color: "hsl(40,20%,58%)", textAlign: "center",
          letterSpacing: "0.03em", position: "relative", zIndex: 1,
        }}>DR. AMARA ZULU</p>
        {/* Gold strip label */}
        <p style={{
          position: "absolute", bottom: `calc(10% - ${fs(0.02)})`,
          fontFamily: "var(--app-font-display)", fontWeight: 600, fontSize: fs(0.034),
          color: "hsl(222,58%,10%)", letterSpacing: "0.08em",
          textTransform: "uppercase", zIndex: 2,
        }}>AMARA ZULU</p>
      </div>
    </div>
  );
}

/* Dark-themed form field primitives */
export const DK = {
  page:  "min-h-svh relative pt-[4.5rem] pb-20",
  glow:  "absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[440px] pointer-events-none",
  label: "block font-sans text-[0.67rem] tracking-[0.14em] uppercase font-medium mb-2",
  error: "mt-1.5 font-sans text-[0.65rem]",
} as const;

export const PAGE_BG = "hsl(222,58%,6%)";
export const CARD_BG = "hsl(222,54%,8.5%)";
export const CARD_BORDER = "hsl(220,38%,15%)";
export const GOLD = "hsl(42,78%,46%)";
export const TEXT_PRIMARY = "hsl(40,24%,90%)";
export const TEXT_MUTED = "hsl(220,16%,48%)";
export const TEXT_DIM = "hsl(220,14%,32%)";
