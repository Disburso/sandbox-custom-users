import React from "react";
import type { FeeDirection } from "./types";

// ── Arrow Icons (inline SVG to avoid external dependency) ───────────

const InboundArrow: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const OutboundArrow: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

// ── Component ───────────────────────────────────────────────────────

interface DirectionBadgeProps {
  direction: FeeDirection;
  /** Compact mode hides the label text, showing only the icon. */
  compact?: boolean;
}

export const DirectionBadge: React.FC<DirectionBadgeProps> = ({
  direction,
  compact = false,
}) => {
  const isOwedToMe = direction === "owed_to_me";
  const label = isOwedToMe ? "Owed to Me" : "I Owe";

  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: compact ? "4px 8px" : "4px 12px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: 600,
    lineHeight: 1,
    whiteSpace: "nowrap",
    backgroundColor: isOwedToMe ? "#ecfdf5" : "#fef2f2",
    color: isOwedToMe ? "#065f46" : "#991b1b",
    border: `1px solid ${isOwedToMe ? "#a7f3d0" : "#fecaca"}`,
  };

  return (
    <span style={style}>
      {isOwedToMe ? <InboundArrow /> : <OutboundArrow />}
      {!compact && label}
    </span>
  );
};
