import React, { useState, useRef, useEffect } from "react";
import type { PaymentReadinessDetail } from "./types";

interface PaymentReadyIndicatorProps {
  readiness: PaymentReadinessDetail;
}

/**
 * Shows "Not payment-ready" as a clickable element.
 * On click, displays a tooltip explaining why (e.g. "Payment info missing").
 */
export const PaymentReadyIndicator: React.FC<PaymentReadyIndicatorProps> = ({
  readiness,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    if (!showTooltip) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowTooltip(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showTooltip]);

  if (readiness.ready) {
    return (
      <span style={readyStyle}>
        <CheckIcon />
        Payment ready
      </span>
    );
  }

  return (
    <span ref={ref} style={wrapperStyle}>
      <button
        type="button"
        onClick={() => setShowTooltip(!showTooltip)}
        style={notReadyButtonStyle}
      >
        <WarningIcon />
        Not payment-ready
      </button>
      {showTooltip && (
        <div style={tooltipStyle}>
          <div style={tooltipArrowStyle} />
          <span style={tooltipTextStyle}>
            {readiness.reason || "Payment information is incomplete"}
          </span>
        </div>
      )}
    </span>
  );
};

// ── Inline Icons ────────────────────────────────────────────────────

const CheckIcon: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#10b981"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const WarningIcon: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#f59e0b"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// ── Inline Styles ───────────────────────────────────────────────────

const wrapperStyle: React.CSSProperties = {
  position: "relative",
  display: "inline-flex",
};

const readyStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  fontSize: "13px",
  color: "#065f46",
};

const notReadyButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  fontSize: "13px",
  color: "#92400e",
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
  textDecoration: "underline",
  textDecorationStyle: "dotted",
  textUnderlineOffset: "3px",
};

const tooltipStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "calc(100% + 8px)",
  left: "50%",
  transform: "translateX(-50%)",
  backgroundColor: "#1f2937",
  color: "#fff",
  padding: "8px 12px",
  borderRadius: "6px",
  whiteSpace: "nowrap",
  zIndex: 50,
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
};

const tooltipArrowStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "-4px",
  left: "50%",
  transform: "translateX(-50%) rotate(45deg)",
  width: "8px",
  height: "8px",
  backgroundColor: "#1f2937",
};

const tooltipTextStyle: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: 1.4,
};
