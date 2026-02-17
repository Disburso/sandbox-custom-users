import React from "react";
import type { ReferralFee, ReferralFeeCallbacks } from "./types";
import { ReferralFeeOverview } from "./ReferralFeeOverview";

// ── Component ───────────────────────────────────────────────────────

interface ReferralFeeSidePanelProps {
  fee: ReferralFee | null;
  isOpen: boolean;
  onClose: () => void;
  callbacks: ReferralFeeCallbacks;
}

/**
 * Right slide-out panel triggered by clicking "View" on a table row.
 *
 * Renders the redesigned Overview tab inside a sliding panel.
 * Record Payment and Dispute are in Quick Actions at the TOP
 * (moved from the old sticky bottom bar).
 */
export const ReferralFeeSidePanel: React.FC<ReferralFeeSidePanelProps> = ({
  fee,
  isOpen,
  onClose,
  callbacks,
}) => {
  if (!fee) return null;

  return (
    <>
      {/* ── Backdrop ─────────────────────────────────────────── */}
      {isOpen && <div style={backdropStyle} onClick={onClose} />}

      {/* ── Panel ────────────────────────────────────────────── */}
      <div
        style={{
          ...panelStyle,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={titleStyle}>Referral Fee Details</h2>
          <button type="button" onClick={onClose} style={closeBtnStyle}>
            <CloseIcon />
          </button>
        </div>

        {/* Content: Redesigned Overview (no sticky bottom bar) */}
        <div style={contentStyle}>
          <ReferralFeeOverview fee={fee} callbacks={callbacks} />
        </div>

        {/* NOTE: The old sticky bottom bar with Record Payment + Dispute
           has been REMOVED. Those actions now live in the Quick Actions
           row at the top of the Overview tab. */}
      </div>
    </>
  );
};

// ── Inline Icons ────────────────────────────────────────────────────

const CloseIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ── Inline Styles ───────────────────────────────────────────────────

const backdropStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.3)",
  zIndex: 45,
  transition: "opacity 0.25s",
};

const panelStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  right: 0,
  bottom: 0,
  width: "520px",
  maxWidth: "100vw",
  backgroundColor: "#fff",
  boxShadow: "-8px 0 24px rgba(0,0,0,0.12)",
  zIndex: 50,
  display: "flex",
  flexDirection: "column",
  transition: "transform 0.25s ease-in-out",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "20px 24px",
  borderBottom: "1px solid #e5e7eb",
  flexShrink: 0,
};

const titleStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 700,
  color: "#111827",
  margin: 0,
};

const closeBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "36px",
  height: "36px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#f3f4f6",
  color: "#6b7280",
  cursor: "pointer",
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "24px",
};
