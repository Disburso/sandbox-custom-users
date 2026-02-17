import React from "react";

// ── Component ───────────────────────────────────────────────────────

interface QuickActionsProps {
  feeId: string;
  onRecordPayment: (id: string) => void;
  onSendReminder: (id: string) => void;
  onEdit: (id: string) => void;
  onDispute: (id: string) => void;
}

/**
 * Quick Actions row displayed at the top of the Overview tab / Side Panel.
 * Record Payment and Dispute are moved here FROM the old sticky bottom bar.
 */
export const QuickActions: React.FC<QuickActionsProps> = ({
  feeId,
  onRecordPayment,
  onSendReminder,
  onEdit,
  onDispute,
}) => {
  return (
    <div style={containerStyle}>
      <button
        type="button"
        onClick={() => onRecordPayment(feeId)}
        style={{ ...btnStyle, ...recordPaymentStyle }}
      >
        <DollarIcon />
        Record Payment
      </button>

      <button
        type="button"
        onClick={() => onSendReminder(feeId)}
        style={{ ...btnStyle, ...reminderStyle }}
      >
        <BellIcon />
        Send Reminder
      </button>

      <button
        type="button"
        onClick={() => onEdit(feeId)}
        style={{ ...btnStyle, ...editStyle }}
      >
        <PencilIcon />
        Edit
      </button>

      <button
        type="button"
        onClick={() => onDispute(feeId)}
        style={{ ...btnStyle, ...disputeStyle }}
      >
        <FlagIcon />
        Dispute
      </button>
    </div>
  );
};

// ── Inline Icons ────────────────────────────────────────────────────

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

const PencilIcon: React.FC = () => (
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
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
);

const FlagIcon: React.FC = () => (
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
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);

// ── Inline Styles ───────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  marginBottom: "20px",
};

const btnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 16px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  border: "none",
  transition: "opacity 0.15s",
  flex: "1 1 0",
  justifyContent: "center",
  minWidth: "120px",
};

const recordPaymentStyle: React.CSSProperties = {
  backgroundColor: "#059669",
  color: "#fff",
};

const reminderStyle: React.CSSProperties = {
  backgroundColor: "#3b82f6",
  color: "#fff",
};

const editStyle: React.CSSProperties = {
  backgroundColor: "#f3f4f6",
  color: "#374151",
  border: "1px solid #d1d5db",
};

const disputeStyle: React.CSSProperties = {
  backgroundColor: "#fef2f2",
  color: "#dc2626",
  border: "1px solid #fecaca",
};
