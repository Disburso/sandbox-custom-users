import React from "react";
import type { ReferralFee, ReferralFeeCallbacks } from "./types";
import { DirectionBanner } from "./DirectionBanner";
import { QuickActions } from "./QuickActions";
import { CompactSummary } from "./CompactSummary";
import { ActivityTimeline } from "./ActivityTimeline";

// ── Component ───────────────────────────────────────────────────────

interface ReferralFeeOverviewProps {
  fee: ReferralFee;
  callbacks: ReferralFeeCallbacks;
}

/**
 * Redesigned Overview tab for a single referral fee.
 *
 * Layout (top → bottom):
 *   1. Direction Banner — big green/red "They Owe You $X" / "You Owe Them $X"
 *   2. Quick Actions    — Record Payment, Send Reminder, Edit, Dispute
 *   3. Compact Summary  — attorney (link), client, case type, fee %, settlement, due date
 *   4. Activity Timeline — vertical timeline of all events
 *
 * The old redundant Metadata section is REMOVED.
 */
export const ReferralFeeOverview: React.FC<ReferralFeeOverviewProps> = ({
  fee,
  callbacks,
}) => {
  const outstanding = fee.feeAmount - fee.amountPaid;

  return (
    <div style={containerStyle}>
      {/* 1. Direction Banner */}
      <DirectionBanner direction={fee.direction} amount={outstanding} />

      {/* 2. Quick Actions (Record Payment & Dispute moved here from sticky bottom) */}
      <QuickActions
        feeId={fee.id}
        onRecordPayment={callbacks.onRecordPayment}
        onSendReminder={callbacks.onSendReminder}
        onEdit={callbacks.onEdit}
        onDispute={callbacks.onDispute}
      />

      {/* 3. Compact Summary */}
      <CompactSummary
        fee={fee}
        onNavigateToAttorney={callbacks.onNavigateToAttorney}
      />

      {/* 4. Activity Timeline */}
      <ActivityTimeline activities={fee.activities} />

      {/* NOTE: Old Metadata section has been intentionally REMOVED.
         All relevant data now lives in the Compact Summary above. */}
    </div>
  );
};

// ── Inline Styles ───────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  padding: "4px 0",
};
