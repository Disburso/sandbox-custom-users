import React from "react";
import type { FeeDirection } from "./types";

// ── Helpers ─────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ── Component ───────────────────────────────────────────────────────

interface DirectionBannerProps {
  direction: FeeDirection;
  amount: number;
}

/**
 * Big top-of-page direction banner for the Overview tab.
 * Green = "They Owe You $X"
 * Red   = "You Owe Them $X"
 */
export const DirectionBanner: React.FC<DirectionBannerProps> = ({
  direction,
  amount,
}) => {
  const isOwedToMe = direction === "owed_to_me";

  const bannerStyle: React.CSSProperties = {
    ...baseBannerStyle,
    background: isOwedToMe
      ? "linear-gradient(135deg, #059669 0%, #10b981 100%)"
      : "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
  };

  return (
    <div style={bannerStyle}>
      <div style={iconContainerStyle}>
        {isOwedToMe ? <InboundArrowLarge /> : <OutboundArrowLarge />}
      </div>
      <div style={textContainerStyle}>
        <span style={directionLabelStyle}>
          {isOwedToMe ? "They Owe You" : "You Owe Them"}
        </span>
        <span style={amountStyle}>{formatCurrency(amount)}</span>
      </div>
    </div>
  );
};

// ── Inline Icons ────────────────────────────────────────────────────

const InboundArrowLarge: React.FC = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="rgba(255,255,255,0.5)"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const OutboundArrowLarge: React.FC = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="rgba(255,255,255,0.5)"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

// ── Inline Styles ───────────────────────────────────────────────────

const baseBannerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  padding: "24px 32px",
  borderRadius: "12px",
  color: "#fff",
  marginBottom: "20px",
};

const iconContainerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "56px",
  height: "56px",
  borderRadius: "50%",
  backgroundColor: "rgba(255,255,255,0.15)",
  flexShrink: 0,
};

const textContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
};

const directionLabelStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 500,
  opacity: 0.9,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const amountStyle: React.CSSProperties = {
  fontSize: "36px",
  fontWeight: 800,
  lineHeight: 1.1,
};
