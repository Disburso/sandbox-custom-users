import React from "react";

interface BulkActionBarProps {
  selectedCount: number;
  onSendReminders: () => void;
  onExportCsv: () => void;
  onClearSelection: () => void;
}

/**
 * Floating action bar that appears at the bottom of the screen
 * when one or more table rows are selected via checkbox.
 */
export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onSendReminders,
  onExportCsv,
  onClearSelection,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div style={barStyle}>
      <div style={innerStyle}>
        <span style={countStyle}>
          {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
        </span>

        <div style={actionsStyle}>
          <button
            type="button"
            onClick={onSendReminders}
            style={primaryButtonStyle}
          >
            <BellIcon />
            Send Reminders
          </button>
          <button
            type="button"
            onClick={onExportCsv}
            style={secondaryButtonStyle}
          >
            <DownloadIcon />
            Export CSV
          </button>
          <button
            type="button"
            onClick={onClearSelection}
            style={clearButtonStyle}
          >
            Clear
          </button>
        </div>
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

const DownloadIcon: React.FC = () => (
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
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

// ── Inline Styles ───────────────────────────────────────────────────

const barStyle: React.CSSProperties = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 40,
  padding: "12px 24px",
  backgroundColor: "rgba(255,255,255,0.95)",
  backdropFilter: "blur(8px)",
  borderTop: "1px solid #e5e7eb",
  boxShadow: "0 -4px 16px rgba(0,0,0,0.08)",
};

const innerStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const countStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#374151",
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const baseButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 16px",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  border: "none",
  transition: "background-color 0.15s",
};

const primaryButtonStyle: React.CSSProperties = {
  ...baseButtonStyle,
  backgroundColor: "#3b82f6",
  color: "#fff",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...baseButtonStyle,
  backgroundColor: "#f3f4f6",
  color: "#374151",
  border: "1px solid #d1d5db",
};

const clearButtonStyle: React.CSSProperties = {
  ...baseButtonStyle,
  backgroundColor: "transparent",
  color: "#6b7280",
};
