import React from "react";
import type { ReferralFee, SummaryCardData, TableFilter } from "./types";

// ── Helpers ─────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function isOverdue(fee: ReferralFee): boolean {
  return fee.status === "overdue" || new Date(fee.dueDate) < new Date();
}

function isPaidThisMonth(fee: ReferralFee): boolean {
  if (fee.status !== "paid") return false;
  const now = new Date();
  const paid = new Date(fee.dueDate);
  return (
    paid.getMonth() === now.getMonth() &&
    paid.getFullYear() === now.getFullYear()
  );
}

/** Derive summary card data from the fee list, respecting active filter. */
export function computeSummaryCards(
  fees: ReferralFee[],
  _filter: TableFilter
): SummaryCardData[] {
  let owedToMe = 0;
  let owedToMeCount = 0;
  let iOwe = 0;
  let iOweCount = 0;
  let overdue = 0;
  let overdueCount = 0;
  let paidThisMonth = 0;
  let paidThisMonthCount = 0;

  for (const fee of fees) {
    const outstanding = fee.feeAmount - fee.amountPaid;

    if (fee.direction === "owed_to_me" && outstanding > 0) {
      owedToMe += outstanding;
      owedToMeCount++;
    }
    if (fee.direction === "i_owe" && outstanding > 0) {
      iOwe += outstanding;
      iOweCount++;
    }
    if (isOverdue(fee) && fee.status !== "paid") {
      overdue += outstanding;
      overdueCount++;
    }
    if (isPaidThisMonth(fee)) {
      paidThisMonth += fee.feeAmount;
      paidThisMonthCount++;
    }
  }

  return [
    {
      label: "Owed to Me",
      amount: owedToMe,
      count: owedToMeCount,
      variant: "green",
    },
    {
      label: "I Owe",
      amount: iOwe,
      count: iOweCount,
      variant: "red",
    },
    {
      label: "Overdue",
      amount: overdue,
      count: overdueCount,
      variant: "orange",
    },
    {
      label: "Paid This Month",
      amount: paidThisMonth,
      count: paidThisMonthCount,
      variant: "blue",
    },
  ];
}

// ── Styles ──────────────────────────────────────────────────────────

const variantStyles: Record<
  SummaryCardData["variant"],
  { bg: string; border: string; text: string }
> = {
  green: {
    bg: "#ecfdf5",
    border: "#10b981",
    text: "#065f46",
  },
  red: {
    bg: "#fef2f2",
    border: "#ef4444",
    text: "#991b1b",
  },
  orange: {
    bg: "#fff7ed",
    border: "#f97316",
    text: "#9a3412",
  },
  blue: {
    bg: "#eff6ff",
    border: "#3b82f6",
    text: "#1e40af",
  },
};

// ── Component ───────────────────────────────────────────────────────

interface SummaryCardsProps {
  fees: ReferralFee[];
  filter: TableFilter;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ fees, filter }) => {
  const cards = computeSummaryCards(fees, filter);

  return (
    <div style={containerStyle}>
      {cards.map((card) => {
        const v = variantStyles[card.variant];
        return (
          <div
            key={card.label}
            style={{
              ...cardStyle,
              backgroundColor: v.bg,
              borderLeft: `4px solid ${v.border}`,
            }}
          >
            <span style={{ ...labelStyle, color: v.text }}>{card.label}</span>
            <span style={{ ...amountStyle, color: v.text }}>
              {formatCurrency(card.amount)}
            </span>
            <span style={{ ...countStyle, color: v.text }}>
              {card.count} {card.count === 1 ? "case" : "cases"}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ── Inline Styles ───────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "16px",
  marginBottom: "24px",
};

const cardStyle: React.CSSProperties = {
  padding: "20px",
  borderRadius: "8px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const amountStyle: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: 700,
  lineHeight: 1.2,
};

const countStyle: React.CSSProperties = {
  fontSize: "13px",
  opacity: 0.7,
};
