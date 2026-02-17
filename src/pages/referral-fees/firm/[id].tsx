import React, { useState, useCallback, useMemo } from "react";
import type {
  Attorney,
  ReferralFee,
  ReferralFeeCallbacks,
} from "../../../components/referral-fees/types";
import { AttorneyDetailHeader } from "../../../components/referral-fees/AttorneyDetailHeader";
import { DirectionBadge } from "../../../components/referral-fees/DirectionBadge";
import { PaymentProgressBar } from "../../../components/referral-fees/PaymentProgressBar";
import { ReferralFeeSidePanel } from "../../../components/referral-fees/ReferralFeeSidePanel";

// ── Helpers ─────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isOverdue(fee: ReferralFee): boolean {
  return fee.status === "overdue" || (fee.status !== "paid" && new Date(fee.dueDate) < new Date());
}

// ── Page Component ──────────────────────────────────────────────────

interface AttorneyDetailPageProps {
  attorney: Attorney;
  fees: ReferralFee[];
}

/**
 * Attorney Detail page — /referral-fees/firm/[id]
 *
 * Changes from original:
 *   1. AttorneyDetailHeader with Net Balance summary + Send Bulk Reminder
 *   2. Direction column with visual badge (Owed to Me / I Owe)
 *   3. Side panel opens on "View" click
 */
export const AttorneyDetailPage: React.FC<AttorneyDetailPageProps> = ({
  attorney,
  fees,
}) => {
  const [selectedFeeId, setSelectedFeeId] = useState<string | null>(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);

  const selectedFee = useMemo(
    () => fees.find((f) => f.id === selectedFeeId) ?? null,
    [fees, selectedFeeId]
  );

  const handleSendBulkReminder = useCallback(() => {
    const outstandingIds = fees
      .filter((f) => f.status !== "paid" && f.feeAmount - f.amountPaid > 0)
      .map((f) => f.id);
    console.log("Send bulk reminder to", attorney.name, "for fees:", outstandingIds);
  }, [fees, attorney.name]);

  const callbacks: ReferralFeeCallbacks = {
    onRecordPayment: useCallback((id: string) => {
      console.log("Record payment for", id);
    }, []),
    onSendReminder: useCallback((id: string) => {
      console.log("Send reminder for", id);
    }, []),
    onEdit: useCallback((id: string) => {
      console.log("Edit fee", id);
    }, []),
    onDispute: useCallback((id: string) => {
      console.log("Dispute fee", id);
    }, []),
    onViewDetail: useCallback((id: string) => {
      setSelectedFeeId(id);
      setSidePanelOpen(true);
    }, []),
    onBulkSendReminders: useCallback((ids: string[]) => {
      console.log("Bulk reminders for", ids);
    }, []),
    onExportCsv: useCallback((ids: string[]) => {
      console.log("Export CSV for", ids);
    }, []),
    onGenerateStatement: useCallback(() => {}, []),
    onNavigateToAttorney: useCallback(() => {
      // Already on the attorney page
    }, []),
  };

  return (
    <div style={pageStyle}>
      {/* ── Header with Net Balance + Bulk Reminder ────────── */}
      <AttorneyDetailHeader
        attorney={attorney}
        fees={fees}
        onSendBulkReminder={handleSendBulkReminder}
      />

      {/* ── Cases Table ──────────────────────────────────────── */}
      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Direction</th>
              <th style={thStyle}>Client</th>
              <th style={thStyle}>Case Type</th>
              <th style={thStyle}>Fee Amount</th>
              <th style={thStyle}>Progress</th>
              <th style={thStyle}>Due Date</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {fees.map((fee) => {
              const overdue = isOverdue(fee);
              return (
                <tr
                  key={fee.id}
                  style={{
                    ...trStyle,
                    borderLeft: overdue
                      ? "3px solid #f97316"
                      : "3px solid transparent",
                    backgroundColor: overdue ? "#fffbeb" : undefined,
                  }}
                >
                  {/* Direction badge */}
                  <td style={tdStyle}>
                    <DirectionBadge direction={fee.direction} />
                  </td>

                  {/* Client */}
                  <td style={tdStyle}>{fee.clientName}</td>

                  {/* Case Type */}
                  <td style={tdStyle}>{fee.caseType}</td>

                  {/* Fee */}
                  <td style={tdStyle}>
                    <div>{formatCurrency(fee.feeAmount)}</div>
                    <div style={subtextStyle}>{fee.feePercentage}%</div>
                  </td>

                  {/* Progress */}
                  <td style={tdStyle}>
                    <PaymentProgressBar
                      feeAmount={fee.feeAmount}
                      amountPaid={fee.amountPaid}
                    />
                  </td>

                  {/* Due Date */}
                  <td style={tdStyle}>
                    <span style={overdue ? overdueDateStyle : undefined}>
                      {formatDate(fee.dueDate)}
                    </span>
                  </td>

                  {/* Status */}
                  <td style={tdStyle}>
                    <span style={statusBadge(fee.status)}>
                      {fee.status.replace("_", " ")}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={tdStyle}>
                    <div style={rowActionsStyle}>
                      <button
                        type="button"
                        onClick={() => callbacks.onRecordPayment(fee.id)}
                        style={actionBtnStyle}
                        title="Record Payment"
                      >
                        $
                      </button>
                      <button
                        type="button"
                        onClick={() => callbacks.onViewDetail(fee.id)}
                        style={viewBtnStyle}
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Side Panel ───────────────────────────────────────── */}
      <ReferralFeeSidePanel
        fee={selectedFee}
        isOpen={sidePanelOpen}
        onClose={() => setSidePanelOpen(false)}
        callbacks={callbacks}
      />
    </div>
  );
};

export default AttorneyDetailPage;

// ── Status badge helper ─────────────────────────────────────────────

function statusBadge(status: ReferralFee["status"]): React.CSSProperties {
  const map: Record<ReferralFee["status"], { bg: string; color: string }> = {
    pending: { bg: "#f3f4f6", color: "#6b7280" },
    partially_paid: { bg: "#dbeafe", color: "#1d4ed8" },
    paid: { bg: "#d1fae5", color: "#065f46" },
    overdue: { bg: "#fee2e2", color: "#991b1b" },
    disputed: { bg: "#fef3c7", color: "#92400e" },
  };
  const s = map[status] ?? map.pending;
  return {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "capitalize",
    backgroundColor: s.bg,
    color: s.color,
  };
}

// ── Inline Styles ───────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "32px 24px",
};

const tableWrapperStyle: React.CSSProperties = {
  overflowX: "auto",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "14px",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 16px",
  fontSize: "12px",
  fontWeight: 600,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  backgroundColor: "#f9fafb",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
};

const trStyle: React.CSSProperties = {
  borderBottom: "1px solid #f3f4f6",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  verticalAlign: "middle",
};

const subtextStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  marginTop: "2px",
};

const overdueDateStyle: React.CSSProperties = {
  color: "#dc2626",
  fontWeight: 600,
};

const rowActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: "6px",
};

const actionBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  borderRadius: "6px",
  border: "1px solid #d1d5db",
  backgroundColor: "#fff",
  color: "#374151",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
};

const viewBtnStyle: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: "6px",
  border: "1px solid #d1d5db",
  backgroundColor: "#fff",
  color: "#374151",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
};
