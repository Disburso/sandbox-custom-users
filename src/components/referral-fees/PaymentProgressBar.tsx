import React from "react";

interface PaymentProgressBarProps {
  feeAmount: number;
  amountPaid: number;
}

export const PaymentProgressBar: React.FC<PaymentProgressBarProps> = ({
  feeAmount,
  amountPaid,
}) => {
  const pct = feeAmount > 0 ? Math.min((amountPaid / feeAmount) * 100, 100) : 0;
  const rounded = Math.round(pct);

  // Color transitions: gray(0%) → blue(partial) → green(100%)
  let barColor = "#3b82f6"; // blue
  if (rounded === 0) barColor = "#d1d5db"; // gray
  if (rounded >= 100) barColor = "#10b981"; // green

  return (
    <div style={containerStyle}>
      <div style={trackStyle}>
        <div
          style={{
            ...fillStyle,
            width: `${pct}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
      <span style={labelStyle}>{rounded}%</span>
    </div>
  );
};

// ── Inline Styles ───────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  minWidth: "100px",
};

const trackStyle: React.CSSProperties = {
  flex: 1,
  height: "6px",
  backgroundColor: "#f3f4f6",
  borderRadius: "3px",
  overflow: "hidden",
};

const fillStyle: React.CSSProperties = {
  height: "100%",
  borderRadius: "3px",
  transition: "width 0.3s ease",
};

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 500,
  color: "#6b7280",
  minWidth: "32px",
  textAlign: "right",
};
