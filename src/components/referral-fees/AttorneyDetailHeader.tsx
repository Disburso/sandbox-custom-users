import React from "react";
import type { Attorney, FeeDirection, ReferralFee } from "./types";

// ── Helpers ─────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface NetBalance {
  direction: FeeDirection;
  netAmount: number;
}

function computeNetBalance(fees: ReferralFee[]): NetBalance {
  let owedToMe = 0;
  let iOwe = 0;

  for (const fee of fees) {
    const outstanding = fee.feeAmount - fee.amountPaid;
    if (outstanding <= 0) continue;
    if (fee.direction === "owed_to_me") owedToMe += outstanding;
    else iOwe += outstanding;
  }

  const net = owedToMe - iOwe;
  return {
    direction: net >= 0 ? "owed_to_me" : "i_owe",
    netAmount: Math.abs(net),
  };
}

// ── Component ───────────────────────────────────────────────────────

interface AttorneyDetailHeaderProps {
  attorney: Attorney;
  fees: ReferralFee[];
  onSendBulkReminder: () => void;
}

/**
 * Header for the Attorney Detail page (/referral-fees/firm/[id]).
 * Shows attorney info, Net Balance summary, and Send Bulk Reminder button.
 */
export const AttorneyDetailHeader: React.FC<AttorneyDetailHeaderProps> = ({
  attorney,
  fees,
  onSendBulkReminder,
}) => {
  const balance = computeNetBalance(fees);
  const isOwedToMe = balance.direction === "owed_to_me";

  const outstandingFees = fees.filter(
    (f) => f.status !== "paid" && f.feeAmount - f.amountPaid > 0
  );

  return (
    <div style={containerStyle}>
      {/* ── Attorney Info ─────────────────────────────────────── */}
      <div style={infoSectionStyle}>
        <h1 style={nameStyle}>{attorney.name}</h1>
        <span style={firmStyle}>{attorney.firmName}</span>
        {attorney.email && (
          <span style={contactStyle}>{attorney.email}</span>
        )}
      </div>

      {/* ── Net Balance ──────────────────────────────────────── */}
      <div
        style={{
          ...netBalanceBoxStyle,
          backgroundColor: isOwedToMe ? "#ecfdf5" : "#fef2f2",
          borderColor: isOwedToMe ? "#a7f3d0" : "#fecaca",
        }}
      >
        <span style={netLabelStyle}>Net Balance</span>
        <span
          style={{
            ...netAmountStyle,
            color: isOwedToMe ? "#065f46" : "#991b1b",
          }}
        >
          {isOwedToMe
            ? `They owe you ${formatCurrency(balance.netAmount)}`
            : `You owe them ${formatCurrency(balance.netAmount)}`}
        </span>
      </div>

      {/* ── Send Bulk Reminder ───────────────────────────────── */}
      <div style={actionSectionStyle}>
        <button
          type="button"
          onClick={onSendBulkReminder}
          disabled={outstandingFees.length === 0}
          style={{
            ...bulkReminderBtnStyle,
            opacity: outstandingFees.length === 0 ? 0.5 : 1,
            cursor: outstandingFees.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          <BellIcon />
          Send Bulk Reminder
          {outstandingFees.length > 0 && (
            <span style={badgeStyle}>{outstandingFees.length}</span>
          )}
        </button>
      </div>
    </div>
  );
};

// ── Inline Icons ────────────────────────────────────────────────────

const BellIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

// ── Inline Styles ───────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "24px",
  padding: "24px",
  backgroundColor: "#fff",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  marginBottom: "24px",
  flexWrap: "wrap",
};

const infoSectionStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  minWidth: "200px",
};

const nameStyle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 700,
  color: "#111827",
  margin: 0,
};

const firmStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b7280",
};

const contactStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#9ca3af",
};

const netBalanceBoxStyle: React.CSSProperties = {
  padding: "16px 24px",
  borderRadius: "8px",
  border: "1px solid",
  textAlign: "center",
  minWidth: "220px",
};

const netLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#6b7280",
  marginBottom: "4px",
};

const netAmountStyle: React.CSSProperties = {
  display: "block",
  fontSize: "16px",
  fontWeight: 700,
};

const actionSectionStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
};

const bulkReminderBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px 20px",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: 600,
  backgroundColor: "#3b82f6",
  color: "#fff",
  border: "none",
  transition: "background-color 0.15s",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "20px",
  height: "20px",
  borderRadius: "9999px",
  backgroundColor: "rgba(255,255,255,0.25)",
  fontSize: "11px",
  fontWeight: 700,
  padding: "0 6px",
};
