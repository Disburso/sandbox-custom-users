import React, { useState, useCallback, useMemo } from "react";
import type {
  ReferralFee,
  ReferralFeeCallbacks,
  TableFilter,
} from "../../components/referral-fees/types";
import { SummaryCards } from "../../components/referral-fees/SummaryCards";
import { ReferralFeesTable } from "../../components/referral-fees/ReferralFeesTable";
import { ReferralFeeSidePanel } from "../../components/referral-fees/ReferralFeeSidePanel";

// ── Page Component ──────────────────────────────────────────────────

interface ReferralFeesPageProps {
  /** All referral fees for the current user / firm. */
  fees: ReferralFee[];
}

/**
 * Main /referral-fees page — redesigned for volume referral fee businesses.
 *
 * Layout:
 *   1. Summary Cards — "Owed to Me" (green), "I Owe" (red), Overdue, Paid This Month
 *   2. Table — checkboxes, direction badge, progress bar, Record Payment per row,
 *              overdue row highlighting, Generate Statement, payment-ready tooltip
 *   3. Floating Bulk Action Bar — appears when rows are selected
 *   4. Side Panel — slides in from right when "View" is clicked
 */
export const ReferralFeesPage: React.FC<ReferralFeesPageProps> = ({ fees }) => {
  const [filter, setFilter] = useState<TableFilter>({});
  const [selectedFeeId, setSelectedFeeId] = useState<string | null>(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);

  // ── Filtering ───────────────────────────────────────────────
  const filteredFees = useMemo(() => {
    let result = fees;
    if (filter.direction) {
      result = result.filter((f) => f.direction === filter.direction);
    }
    if (filter.status) {
      result = result.filter((f) => f.status === filter.status);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (f) =>
          f.attorney.name.toLowerCase().includes(q) ||
          f.clientName.toLowerCase().includes(q) ||
          f.caseType.toLowerCase().includes(q)
      );
    }
    return result;
  }, [fees, filter]);

  const selectedFee = useMemo(
    () => fees.find((f) => f.id === selectedFeeId) ?? null,
    [fees, selectedFeeId]
  );

  // ── Callbacks ───────────────────────────────────────────────
  const callbacks: ReferralFeeCallbacks = {
    onRecordPayment: useCallback((id: string) => {
      // TODO: integrate with payment modal
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
      console.log("Bulk send reminders for", ids);
    }, []),
    onExportCsv: useCallback((ids: string[]) => {
      console.log("Export CSV for", ids);
    }, []),
    onGenerateStatement: useCallback(() => {
      // "Coming soon" toast is handled inside the table component
    }, []),
    onNavigateToAttorney: useCallback((attorneyId: string) => {
      // In Next.js: router.push(`/referral-fees/firm/${attorneyId}`)
      console.log("Navigate to attorney", attorneyId);
    }, []),
  };

  // ── Filter controls ─────────────────────────────────────────
  const handleDirectionFilter = (dir: "owed_to_me" | "i_owe" | undefined) => {
    setFilter((prev) => ({ ...prev, direction: dir }));
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Referral Fees</h1>

        {/* Direction filter pills */}
        <div style={filterPillsStyle}>
          <button
            type="button"
            style={{
              ...pillStyle,
              ...(filter.direction === undefined ? activePillStyle : {}),
            }}
            onClick={() => handleDirectionFilter(undefined)}
          >
            All
          </button>
          <button
            type="button"
            style={{
              ...pillStyle,
              ...(filter.direction === "owed_to_me" ? activePillGreenStyle : {}),
            }}
            onClick={() => handleDirectionFilter("owed_to_me")}
          >
            Owed to Me
          </button>
          <button
            type="button"
            style={{
              ...pillStyle,
              ...(filter.direction === "i_owe" ? activePillRedStyle : {}),
            }}
            onClick={() => handleDirectionFilter("i_owe")}
          >
            I Owe
          </button>
        </div>
      </div>

      {/* 1. Summary Cards — values update based on active filter */}
      <SummaryCards fees={filteredFees} filter={filter} />

      {/* 2. Main Table */}
      <ReferralFeesTable fees={filteredFees} callbacks={callbacks} />

      {/* 3. Side Panel */}
      <ReferralFeeSidePanel
        fee={selectedFee}
        isOpen={sidePanelOpen}
        onClose={() => setSidePanelOpen(false)}
        callbacks={callbacks}
      />
    </div>
  );
};

export default ReferralFeesPage;

// ── Inline Styles ───────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "32px 24px",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "24px",
  flexWrap: "wrap",
  gap: "12px",
};

const titleStyle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 700,
  color: "#111827",
  margin: 0,
};

const filterPillsStyle: React.CSSProperties = {
  display: "flex",
  gap: "6px",
};

const pillStyle: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: "9999px",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
  border: "1px solid #d1d5db",
  backgroundColor: "#fff",
  color: "#6b7280",
  transition: "all 0.15s",
};

const activePillStyle: React.CSSProperties = {
  backgroundColor: "#111827",
  color: "#fff",
  borderColor: "#111827",
};

const activePillGreenStyle: React.CSSProperties = {
  backgroundColor: "#059669",
  color: "#fff",
  borderColor: "#059669",
};

const activePillRedStyle: React.CSSProperties = {
  backgroundColor: "#dc2626",
  color: "#fff",
  borderColor: "#dc2626",
};
