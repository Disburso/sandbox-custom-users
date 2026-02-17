// ── Referral Fees — Component Barrel Export ─────────────────────────
//
// Redesigned for volume referral fee businesses.
// Import from "@/components/referral-fees" to use any component.

export { SummaryCards, computeSummaryCards } from "./SummaryCards";
export { ReferralFeesTable } from "./ReferralFeesTable";
export { BulkActionBar } from "./BulkActionBar";
export { DirectionBadge } from "./DirectionBadge";
export { DirectionBanner } from "./DirectionBanner";
export { PaymentProgressBar } from "./PaymentProgressBar";
export { PaymentReadyIndicator } from "./PaymentReadyIndicator";
export { QuickActions } from "./QuickActions";
export { CompactSummary } from "./CompactSummary";
export { ActivityTimeline } from "./ActivityTimeline";
export { AttorneyDetailHeader } from "./AttorneyDetailHeader";
export { ReferralFeeOverview } from "./ReferralFeeOverview";
export { ReferralFeeSidePanel } from "./ReferralFeeSidePanel";

// Types
export type {
  FeeDirection,
  FeeStatus,
  PaymentReadiness,
  PaymentReadinessDetail,
  Attorney,
  ReferralFee,
  ActivityEvent,
  SummaryCardData,
  TableFilter,
  BulkAction,
  AttorneyNetBalance,
  ReferralFeeCallbacks,
} from "./types";
