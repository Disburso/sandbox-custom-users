import React, { useState, useCallback } from "react";
import type { ReferralFee, ReferralFeeCallbacks } from "./types";
import { DirectionBadge } from "./DirectionBadge";
import { PaymentProgressBar } from "./PaymentProgressBar";
import { PaymentReadyIndicator } from "./PaymentReadyIndicator";
import { BulkActionBar } from "./BulkActionBar";

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

// ── Toast (simple implementation) ───────────────────────────────────

function showComingSoonToast() {
  // In a real app this would use a toast library.
  // Fallback to a simple alert-style notification.
  const el = document.createElement("div");
  Object.assign(el.style, toastStyle);
  el.textContent = "Generate Statement — Coming Soon!";
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 2500);
}

// ── Component ───────────────────────────────────────────────────────

interface ReferralFeesTableProps {
  fees: ReferralFee[];
  callbacks: ReferralFeeCallbacks;
}

export const ReferralFeesTable: React.FC<ReferralFeesTableProps> = ({
  fees,
  callbacks,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allSelected = fees.length > 0 && selectedIds.size === fees.length;

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(fees.map((f) => f.id)));
    }
  }, [fees, allSelected]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  return (
    <>
      {/* ── Generate Statement button ────────────────────────────── */}
      <div style={toolbarStyle}>
        <button
          type="button"
          onClick={showComingSoonToast}
          style={generateStatementBtnStyle}
        >
          <FileIcon />
          Generate Statement
        </button>
      </div>

      {/* ── Table ────────────────────────────────────────────────── */}
      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  style={checkboxStyle}
                />
              </th>
              <th style={thStyle}>Direction</th>
              <th style={thStyle}>Attorney / Firm</th>
              <th style={thStyle}>Client</th>
              <th style={thStyle}>Case Type</th>
              <th style={thStyle}>Fee</th>
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
                  {/* Checkbox */}
                  <td style={tdStyle}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(fee.id)}
                      onChange={() => toggleOne(fee.id)}
                      style={checkboxStyle}
                    />
                  </td>

                  {/* Direction badge */}
                  <td style={tdStyle}>
                    <DirectionBadge direction={fee.direction} />
                  </td>

                  {/* Attorney */}
                  <td style={tdStyle}>
                    <button
                      type="button"
                      onClick={() =>
                        callbacks.onNavigateToAttorney(fee.attorney.id)
                      }
                      style={linkBtnStyle}
                    >
                      {fee.attorney.name}
                    </button>
                    <div style={subtextStyle}>{fee.attorney.firmName}</div>
                  </td>

                  {/* Client */}
                  <td style={tdStyle}>{fee.clientName}</td>

                  {/* Case Type */}
                  <td style={tdStyle}>{fee.caseType}</td>

                  {/* Fee amount */}
                  <td style={tdStyle}>
                    <div>{formatCurrency(fee.feeAmount)}</div>
                    <div style={subtextStyle}>{fee.feePercentage}%</div>
                  </td>

                  {/* Progress bar */}
                  <td style={tdStyle}>
                    <PaymentProgressBar
                      feeAmount={fee.feeAmount}
                      amountPaid={fee.amountPaid}
                    />
                  </td>

                  {/* Due date */}
                  <td style={tdStyle}>
                    <span style={overdue ? overdueDateStyle : undefined}>
                      {formatDate(fee.dueDate)}
                    </span>
                  </td>

                  {/* Payment readiness */}
                  <td style={tdStyle}>
                    <PaymentReadyIndicator readiness={fee.paymentReadiness} />
                  </td>

                  {/* Row actions */}
                  <td style={tdStyle}>
                    <div style={rowActionsStyle}>
                      <button
                        type="button"
                        onClick={() => callbacks.onRecordPayment(fee.id)}
                        style={rowActionBtnStyle}
                        title="Record Payment"
                      >
                        <DollarIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => callbacks.onViewDetail(fee.id)}
                        style={rowActionBtnStyle}
                        title="View"
                      >
                        <EyeIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Floating Bulk Action Bar ─────────────────────────────── */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onSendReminders={() =>
          callbacks.onBulkSendReminders(Array.from(selectedIds))
        }
        onExportCsv={() => callbacks.onExportCsv(Array.from(selectedIds))}
        onClearSelection={clearSelection}
      />
    </>
  );
};

// ── Inline Icons ────────────────────────────────────────────────────

const FileIcon: React.FC = () => (
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
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const DollarIcon: React.FC = () => (
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
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const EyeIcon: React.FC = () => (
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
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// ── Inline Styles ───────────────────────────────────────────────────

const toolbarStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginBottom: "12px",
};

const generateStatementBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 16px",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  backgroundColor: "#f3f4f6",
  color: "#374151",
  border: "1px solid #d1d5db",
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
  transition: "background-color 0.1s",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  verticalAlign: "middle",
};

const checkboxStyle: React.CSSProperties = {
  width: "16px",
  height: "16px",
  cursor: "pointer",
  accentColor: "#3b82f6",
};

const linkBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  color: "#2563eb",
  fontWeight: 500,
  cursor: "pointer",
  textDecoration: "none",
  fontSize: "14px",
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
  gap: "4px",
};

const rowActionBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  borderRadius: "6px",
  border: "1px solid #e5e7eb",
  backgroundColor: "#fff",
  color: "#6b7280",
  cursor: "pointer",
  transition: "background-color 0.1s",
};

const toastStyle: Record<string, string> = {
  position: "fixed",
  bottom: "24px",
  left: "50%",
  transform: "translateX(-50%)",
  backgroundColor: "#1f2937",
  color: "#fff",
  padding: "12px 24px",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: "500",
  zIndex: "9999",
  boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
  transition: "opacity 0.3s",
};
