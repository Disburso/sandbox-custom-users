// ── Referral Fee Types ──────────────────────────────────────────────

export type FeeDirection = "owed_to_me" | "i_owe";

export type FeeStatus =
  | "pending"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "disputed";

export type PaymentReadiness = "ready" | "not_ready";

export interface PaymentReadinessDetail {
  ready: boolean;
  reason?: string; // e.g. "Payment info missing", "Bank account not verified"
}

export interface Attorney {
  id: string;
  name: string;
  firmName: string;
  email?: string;
  phone?: string;
}

export interface ReferralFee {
  id: string;
  direction: FeeDirection;
  status: FeeStatus;
  attorney: Attorney;
  clientName: string;
  caseType: string;
  feePercentage: number;
  settlementAmount: number;
  feeAmount: number;
  amountPaid: number;
  dueDate: string;
  createdAt: string;
  paymentReadiness: PaymentReadinessDetail;
  activities: ActivityEvent[];
}

export interface ActivityEvent {
  id: string;
  type:
    | "created"
    | "payment_recorded"
    | "reminder_sent"
    | "edited"
    | "disputed"
    | "resolved"
    | "note"
    | "status_change";
  description: string;
  timestamp: string;
  actor?: string;
  metadata?: Record<string, unknown>;
}

// ── Summary Card Types ──────────────────────────────────────────────

export interface SummaryCardData {
  label: string;
  amount: number;
  count: number;
  variant: "green" | "red" | "orange" | "blue";
}

// ── Table / Bulk Action Types ───────────────────────────────────────

export interface TableFilter {
  direction?: FeeDirection;
  status?: FeeStatus;
  search?: string;
}

export interface BulkAction {
  type: "send_reminders" | "export_csv";
  selectedIds: string[];
}

// ── Attorney Detail Types ───────────────────────────────────────────

export interface AttorneyNetBalance {
  direction: FeeDirection;
  netAmount: number;
}

// ── Callback Types ──────────────────────────────────────────────────

export interface ReferralFeeCallbacks {
  onRecordPayment: (feeId: string) => void;
  onSendReminder: (feeId: string) => void;
  onEdit: (feeId: string) => void;
  onDispute: (feeId: string) => void;
  onViewDetail: (feeId: string) => void;
  onBulkSendReminders: (feeIds: string[]) => void;
  onExportCsv: (feeIds: string[]) => void;
  onGenerateStatement: () => void;
  onNavigateToAttorney: (attorneyId: string) => void;
}
