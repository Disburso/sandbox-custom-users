import React from "react";
import type { ReferralFee } from "./types";

// ── Helpers ─────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Component ───────────────────────────────────────────────────────

interface CompactSummaryProps {
  fee: ReferralFee;
  onNavigateToAttorney: (attorneyId: string) => void;
}

/**
 * Compact summary section for the Overview tab.
 * Replaces the old verbose Metadata section.
 * Attorney name is a clickable link to their detail page.
 */
export const CompactSummary: React.FC<CompactSummaryProps> = ({
  fee,
  onNavigateToAttorney,
}) => {
  const isOverdue =
    fee.status !== "paid" && new Date(fee.dueDate) < new Date();

  return (
    <div style={containerStyle}>
      {/* Row 1 */}
      <div style={rowStyle}>
        <div style={fieldStyle}>
          <span style={labelStyle}>Attorney</span>
          <button
            type="button"
            onClick={() => onNavigateToAttorney(fee.attorney.id)}
            style={linkStyle}
          >
            {fee.attorney.name}
          </button>
          <span style={subLabelStyle}>{fee.attorney.firmName}</span>
        </div>

        <div style={fieldStyle}>
          <span style={labelStyle}>Client</span>
          <span style={valueStyle}>{fee.clientName}</span>
        </div>

        <div style={fieldStyle}>
          <span style={labelStyle}>Case Type</span>
          <span style={valueStyle}>{fee.caseType}</span>
        </div>
      </div>

      {/* Row 2 */}
      <div style={rowStyle}>
        <div style={fieldStyle}>
          <span style={labelStyle}>Fee</span>
          <span style={valueStyle}>
            {fee.feePercentage}% &mdash;{" "}
            {formatCurrency(fee.feeAmount)}
          </span>
        </div>

        <div style={fieldStyle}>
          <span style={labelStyle}>Settlement</span>
          <span style={valueStyle}>
            {formatCurrency(fee.settlementAmount)}
          </span>
        </div>

        <div style={fieldStyle}>
          <span style={labelStyle}>Due Date</span>
          <span
            style={{
              ...valueStyle,
              color: isOverdue ? "#dc2626" : undefined,
              fontWeight: isOverdue ? 700 : undefined,
            }}
          >
            {formatDate(fee.dueDate)}
            {isOverdue && " (Overdue)"}
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Inline Styles ───────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  padding: "16px 20px",
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  marginBottom: "20px",
};

const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "16px",
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "#9ca3af",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const subLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
};

const valueStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 500,
  color: "#111827",
};

const linkStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  color: "#2563eb",
  fontWeight: 600,
  fontSize: "14px",
  cursor: "pointer",
  textDecoration: "none",
  textAlign: "left",
};
