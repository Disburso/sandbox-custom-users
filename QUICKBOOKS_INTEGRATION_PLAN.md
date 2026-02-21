# QuickBooks Online Integration for Law Firms — Implementation Plan

## Context

Disburso currently handles law firm disbursements via Modern Treasury (payments) and Plaid (bank feeds), with a 3-way reconciliation system (Bank Balance <> Trust Journal <> Client Sub-Ledgers). Many law firms use QuickBooks Online (QBO) as their general ledger / accounting system. This integration will make QBO a first-class data source in Disburso so that:

1. **Payments In/Out are reconciled** — even if the firm doesn't use Disbo to send payments, we pull QBO transaction data and reconcile it against bank feeds and ledger entries.
2. **Doctor/vendor data flows bidirectionally** — pull QBO vendors into Disbo as Recipients, invite them to the platform, and push payment data back into QBO.
3. **Full QBO feature access** — Chart of Accounts, Invoices, Bills, Journal Entries, Reports, Class/Location tracking (mapped to cases).
4. **IOLTA compliance** — trust vs. operating account segregation is enforced in the QBO integration layer.

**Decisions confirmed by user:**
- QuickBooks Online only (no Desktop)
- Auto-create standard IOLTA-compliant Chart of Accounts in QBO
- Smart auto-match + manual review for vendor import

---

## Phase 1: Foundation — OAuth, Models, Core Sync Engine

### 1.1 Gem & Configuration

**File:** `Gemfile`
```ruby
gem 'oauth2'  # For QBO OAuth 2.0 flow (lightweight, no heavy SDK)
```

We use the `oauth2` gem + direct QBO REST API calls rather than the abandoned `quickbooks-ruby` gem. This gives us full control over endpoints, rate limiting, and error handling.

**File:** `config/initializers/quickbooks.rb`
- Configure QBO client_id, client_secret, redirect_uri, environment (sandbox/production)
- Read from `config/application.yml` (Figaro) — keys: `QUICKBOOKS_CLIENT_ID`, `QUICKBOOKS_CLIENT_SECRET`, `QUICKBOOKS_REDIRECT_URI`, `QUICKBOOKS_ENVIRONMENT`

**File:** `config/application.yml.example` — add QBO placeholder keys

### 1.2 Database Migrations

#### Migration 1: `quickbooks_connections`
```
create_table :quickbooks_connections, id: :uuid do |t|
  t.references :organization, type: :uuid, null: false, foreign_key: true, index: { unique: true }
  t.string     :realm_id, null: false                    # QBO Company ID
  t.text       :access_token_ciphertext, null: false     # encrypted
  t.text       :refresh_token_ciphertext, null: false    # encrypted
  t.datetime   :access_token_expires_at, null: false
  t.datetime   :refresh_token_expires_at, null: false
  t.string     :company_name
  t.string     :status, null: false, default: 'active'   # active, disconnected, refresh_failed
  t.jsonb      :sync_state, null: false, default: {}     # cursor positions per entity type
  t.jsonb      :settings, null: false, default: {}       # firm-level QB prefs
  t.datetime   :last_synced_at
  t.datetime   :discarded_at
  t.timestamps
end
add_index :quickbooks_connections, :realm_id, unique: true
add_index :quickbooks_connections, :status
add_index :quickbooks_connections, :discarded_at, where: 'discarded_at IS NULL'
```

#### Migration 2: `quickbooks_account_mappings`
Maps Disbo ledger accounts <> QBO Chart of Accounts entries.
```
create_table :quickbooks_account_mappings, id: :uuid do |t|
  t.references :organization, type: :uuid, null: false, foreign_key: true
  t.references :ledger_account, type: :uuid, foreign_key: { to_table: :ledger_accounts }, null: true
  t.references :firm_bank_account, type: :uuid, foreign_key: true, null: true
  t.string     :qbo_account_id, null: false
  t.string     :qbo_account_name
  t.string     :qbo_account_type                         # Asset, Liability, Equity, Revenue, Expense
  t.string     :mapping_purpose, null: false              # iolta_trust, operating, client_cost, attorney_fee, medical_lien, etc.
  t.boolean    :auto_created, default: false
  t.timestamps
end
add_index :quickbooks_account_mappings, [:organization_id, :qbo_account_id], unique: true, name: 'idx_qb_acct_map_org_qbo'
add_index :quickbooks_account_mappings, [:organization_id, :mapping_purpose], name: 'idx_qb_acct_map_org_purpose'
```

#### Migration 3: `quickbooks_sync_records`
Idempotency + audit trail for every entity synced to/from QBO.
```
create_table :quickbooks_sync_records, id: :uuid do |t|
  t.references :organization, type: :uuid, null: false, foreign_key: true
  t.string     :syncable_type, null: false               # polymorphic: 'Recipient', 'Payout', 'Invoice', 'Case', etc.
  t.uuid       :syncable_id, null: false
  t.string     :qbo_entity_type, null: false             # Vendor, Bill, BillPayment, JournalEntry, Customer, Invoice, etc.
  t.string     :qbo_entity_id, null: false               # QBO ID
  t.string     :sync_direction, null: false              # push, pull
  t.string     :status, null: false, default: 'synced'   # synced, failed, conflict, stale
  t.jsonb      :last_sync_data, default: {}              # snapshot of what was synced
  t.jsonb      :error_details, default: {}
  t.string     :idempotency_key                          # for dedup
  t.datetime   :last_synced_at
  t.timestamps
end
add_index :quickbooks_sync_records, [:syncable_type, :syncable_id, :qbo_entity_type], unique: true, name: 'idx_qb_sync_poly_entity'
add_index :quickbooks_sync_records, [:organization_id, :qbo_entity_type, :qbo_entity_id], unique: true, name: 'idx_qb_sync_org_qbo'
add_index :quickbooks_sync_records, :idempotency_key, unique: true, where: 'idempotency_key IS NOT NULL'
add_index :quickbooks_sync_records, :status
```

#### Migration 4: `quickbooks_vendor_import_candidates`
Staging table for smart auto-match vendor import.
```
create_table :quickbooks_vendor_import_candidates, id: :uuid do |t|
  t.references :organization, type: :uuid, null: false, foreign_key: true
  t.string     :qbo_vendor_id, null: false
  t.string     :display_name
  t.string     :company_name
  t.string     :email
  t.string     :phone
  t.string     :tax_id
  t.jsonb      :raw_qbo_data, default: {}
  t.references :matched_recipient, type: :uuid, foreign_key: { to_table: :recipients }, null: true
  t.decimal    :match_confidence, precision: 5, scale: 2
  t.string     :match_reason                              # email_exact, name_fuzzy, npi_match, tax_id_match
  t.string     :status, null: false, default: 'pending'   # pending, accepted, rejected, imported
  t.uuid       :reviewed_by_id
  t.datetime   :reviewed_at
  t.timestamps
end
add_index :quickbooks_vendor_import_candidates, [:organization_id, :qbo_vendor_id], unique: true, name: 'idx_qb_vendor_import_org_qbo'
add_index :quickbooks_vendor_import_candidates, :status
```

#### Migration 5: `quickbooks_webhook_events`
```
create_table :quickbooks_webhook_events, id: :uuid do |t|
  t.references :organization, type: :uuid, foreign_key: true
  t.string     :realm_id, null: false
  t.string     :event_type, null: false
  t.jsonb      :payload, null: false, default: {}
  t.string     :status, null: false, default: 'pending'  # pending, processing, processed, failed
  t.string     :idempotency_key
  t.integer    :attempts, default: 0
  t.timestamps
end
add_index :quickbooks_webhook_events, :idempotency_key, unique: true, where: 'idempotency_key IS NOT NULL'
add_index :quickbooks_webhook_events, [:realm_id, :status]
```

#### Migration 6: Update `org_integrations`
```ruby
# Add 'quickbooks' to the kind enum validation in the OrgIntegration model
```

#### Migration 7: Add `qbo_class_id` to `cases`
```
add_column :cases, :qbo_class_id, :string
add_index  :cases, :qbo_class_id
```

### 1.3 Models

**Namespace:** `Integrations::QuickBooks::*`

| Model | File | Purpose |
|-------|------|---------|
| `Connection` | `app/models/integrations/quick_books/connection.rb` | OAuth tokens, realm_id, sync state. Uses `lockbox` gem for token encryption. `belongs_to :organization`. |
| `AccountMapping` | `app/models/integrations/quick_books/account_mapping.rb` | Maps Disbo ledger accounts <> QBO accounts. |
| `SyncRecord` | `app/models/integrations/quick_books/sync_record.rb` | Polymorphic audit trail for every sync operation. Idempotency key enforcement. |
| `VendorImportCandidate` | `app/models/integrations/quick_books/vendor_import_candidate.rb` | Staging records for vendor smart-match review. |
| `WebhookEvent` | `app/models/integrations/quick_books/webhook_event.rb` | Inbound webhook event log. |

**Update existing model:**
- `app/models/org_integration.rb` — Add `quickbooks` to the `kind` enum and all relevant validations/scopes. Add `accounting_providers` scope for `quickbooks`.

### 1.4 OrgIntegration Update

**File:** `app/models/org_integration.rb`
- Add `quickbooks: 'quickbooks'` to the enum
- Add `quickbooks` to the `validates :kind, inclusion:` array
- Add scope: `scope :accounting_providers, -> { where(kind: 'quickbooks') }`
- Add `def accounting_integration?` method

### 1.5 Feature Flag

**Flipper flag:** `quickbooks_integration`
- Gate by organization (actor gate) for phased rollout
- Seed: `Flipper.register(:quickbooks_beta) { |actor| actor.respond_to?(:quickbooks_beta?) }`

---

## Phase 2: OAuth 2.0 Flow

### 2.1 Backend — OAuth Controller

**File:** `app/controllers/api/v1/integrations/quickbooks_controller.rb`

```
Actions:
  GET  /api/v1/integrations/quickbooks/auth_url     → Generate OAuth URL with state param (CSRF token stored in session/Redis)
  GET  /api/v1/integrations/quickbooks/callback      → Exchange auth code for tokens, create Connection + OrgIntegration
  POST /api/v1/integrations/quickbooks/disconnect     → Revoke tokens, soft-delete Connection, disable OrgIntegration
  GET  /api/v1/integrations/quickbooks/status         → Return connection status, company name, last sync, health
```

**OAuth flow details:**
1. Frontend redirects user to QBO authorization URL (generated by backend)
2. QBO redirects back to `QUICKBOOKS_REDIRECT_URI` with auth code + realm_id
3. Backend exchanges code for access_token (1hr) + refresh_token (100 days)
4. Tokens stored encrypted in `quickbooks_connections` table
5. `OrgIntegration` record created with `kind: 'quickbooks'`, `enabled: true`
6. Triggers initial sync job

**Security:**
- State parameter validated against Redis-stored CSRF token
- Tokens encrypted at rest via `lockbox` gem
- Only org admins can connect/disconnect (CanCanCan ability)

### 2.2 Token Refresh

**File:** `app/jobs/integrations/quick_books/refresh_tokens_job.rb`
- Scheduled via Sidekiq-Cron every 45 minutes
- Iterates all active `QuickBooks::Connection` records where `access_token_expires_at < 15.minutes.from_now`
- Refreshes token, updates DB
- If refresh fails (invalid_grant), marks connection as `refresh_failed`, sends notification to org admin
- Retry with exponential backoff (3 attempts)

### 2.3 Frontend — OAuth UI

**File:** `src/portals/law-firm/pages/SettingsPage/components/Integrations/index.tsx`
- Replace "Coming Soon" placeholder with integration cards grid
- QuickBooks card shows: Connect button (opens OAuth popup), status badge, company name, last sync time, disconnect button
- Uses new RTK Query endpoints in `src/store/api/quickbooksApi.ts`

**File:** `src/store/api/quickbooksApi.ts` (new)
```typescript
Endpoints:
  getQuickBooksAuthUrl     → GET /integrations/quickbooks/auth_url
  quickBooksCallback       → POST /integrations/quickbooks/callback
  disconnectQuickBooks     → POST /integrations/quickbooks/disconnect
  getQuickBooksStatus      → GET /integrations/quickbooks/status
  // ... more endpoints added in later phases
```

---

## Phase 3: Chart of Accounts & Core Data Sync

### 3.1 QBO API Client

**File:** `app/services/quick_books_integration.rb`
- Module pattern matching `PlaidIntegration` (`app/services/plaid_integration.rb`)
- `configure(client_id:, client_secret:, redirect_uri:, environment:)`
- Wraps `oauth2` gem for token management

**File:** `app/services/quick_books_integration/api_client.rb`
- HTTP client wrapper for QBO REST API v3
- Handles: auth headers, JSON serialization, rate limiting (QBO allows 500 req/min), retries with exponential backoff
- Methods: `get`, `post`, `query` (QBO query language), `batch`
- Automatic token refresh on 401
- Circuit breaker pattern for sustained failures

**File:** `app/services/quick_books_integration/rate_limiter.rb`
- Redis-based sliding window rate limiter (500 req/min per realm_id)
- Queues requests when near limit, applies backpressure

### 3.2 Chart of Accounts Setup

**File:** `app/services/quick_books_integration/chart_of_accounts_setup.rb`

On first connect, auto-creates a standard IOLTA-compliant CoA in QBO:

| QBO Account | Type | Purpose | `mapping_purpose` |
|-------------|------|---------|-------------------|
| IOLTA Trust Account | Bank/Other Current Asset | Trust funds held for clients | `iolta_trust` |
| Operating Account | Bank | Firm's operating funds | `operating` |
| Client Trust Liability | Other Current Liability | Per-client trust sub-ledger | `client_trust_liability` |
| Settlement Income | Income | Settlement proceeds | `settlement_income` |
| Attorney Fees | Income | Firm's fee revenue | `attorney_fee` |
| Medical Liens | Expense | Medical provider payments | `medical_lien` |
| Case Costs | Expense | Case-related expenses | `case_cost` |
| Vendor Payments | Expense | General vendor disbursements | `vendor_payment` |
| Referral Fees | Expense | Referral fee payments | `referral_fee` |
| Trust → Operating Transfer | Equity | Internal transfers | `trust_operating_transfer` |

**Logic:**
1. Query existing QBO accounts first (avoid duplicates)
2. Create missing accounts via QBO API
3. Create `AccountMapping` records linking QBO account IDs to Disbo ledger accounts
4. If a QBO account with the same name already exists, map to it (don't duplicate)
5. Store setup completion in `quickbooks_connections.settings['coa_setup_complete']`

### 3.3 Class Tracking (Case Mapping)

**File:** `app/services/quick_books_integration/class_sync_service.rb`

QBO Classes map 1:1 to Disbo Cases. This enables per-case P&L reporting in QBO.

- When a Case is created/updated in Disbo → push as QBO Class
- Class name format: `{case_number} - {title}`
- Store `qbo_class_id` on the Case model
- Bidirectional: if a QBO class is created that matches a case number pattern, link it

### 3.4 Customer Sync (Plaintiffs/Clients)

**File:** `app/services/quick_books_integration/customer_sync_service.rb`

- Disbo `Participant` records with type `client`/`plaintiff` → QBO Customers
- Push on case creation and participant changes
- Enables QBO invoice tracking per client

---

## Phase 4: Vendor/Doctor Import & Invite Flow

### 4.1 Vendor Pull Service

**File:** `app/services/quick_books_integration/vendor_pull_service.rb`

1. **Fetch all QBO vendors** via `GET /v3/company/{realmId}/query?query=SELECT * FROM Vendor`
2. **Smart auto-match** against existing `Recipient` records:
   - **Email exact match** → confidence: 95%
   - **Tax ID match** → confidence: 90%
   - **NPI match** (if stored in QBO custom field) → confidence: 95%
   - **Name fuzzy match** (Levenshtein distance < 3 or trigram similarity > 0.7) → confidence: 60-80%
   - **Business name + city match** → confidence: 70%
3. **Create `VendorImportCandidate`** records with match results
4. No auto-import — all go to review queue

### 4.2 Vendor Import Review UI

**File:** `src/portals/law-firm/pages/SettingsPage/components/Integrations/QuickBooksVendorImport.tsx` (new)

- Table showing QBO vendors with match confidence, matched Disbo recipient (if any)
- Actions per row: Accept Match, Reject Match, Import as New, Skip
- Bulk actions: Accept All High-Confidence (>90%), Import All Unmatched
- On Accept: links QBO vendor to existing Recipient via `SyncRecord`
- On Import as New: creates new `Recipient` record with `recipient_type` inferred from QBO vendor category

### 4.3 Vendor Invite Flow

**File:** `app/services/quick_books_integration/vendor_invite_service.rb`

After import:
1. Create `Recipient` with data from QBO vendor (name, email, phone, business_name, tax_id)
2. Set `recipient_type` based on QBO vendor category or user selection (medical_facility, vendor)
3. Set status to `invited`
4. Trigger existing invitation email flow (Postmark)
5. Create `SyncRecord` linking Recipient <> QBO Vendor ID

### 4.4 Vendor Push (Disbo → QBO)

**File:** `app/services/quick_books_integration/vendor_push_service.rb`

When a new Recipient is created in Disbo (not from QBO):
1. Check if QBO vendor exists with same email/name
2. If not, create QBO Vendor
3. Create `SyncRecord`

---

## Phase 5: Payment Reconciliation — Payments In & Payments Out

### 5.1 Architecture: QBO as Fourth Reconciliation Dimension

The existing reconciliation is: **Bank (Plaid) <> Ledger (Modern Treasury) <> Client Sub-Ledgers**

With QBO, we add: **Bank (Plaid) <> Ledger (MT) <> Client Sub-Ledgers <> QBO General Ledger**

This means:
- Bank transactions from Plaid should match QBO bank feed entries
- Ledger entries from Modern Treasury should match QBO journal entries
- Disbursements in Disbo should match QBO bill payments
- Settlements received should match QBO deposits/invoices

### 5.2 QBO Transaction Pull

**File:** `app/services/quick_books_integration/transaction_pull_service.rb`

Pulls from QBO on a schedule (every 15 min) + on webhook:

| QBO Entity | Disbo Mapping | Direction |
|-----------|---------------|-----------|
| Purchase / Bill Payment | Payout / Disbursement | Pull for reconciliation |
| Deposit / Payment | Settlement received / Payment In | Pull for reconciliation |
| Bill | Invoice (AP) | Pull for reconciliation |
| Invoice | Invoice (AR) | Pull for reconciliation |
| Journal Entry | Ledger Entry | Pull for reconciliation |
| Transfer | Internal transfer (IOLTA <> Operating) | Pull for reconciliation |

**Key:** Even if the firm doesn't use Disbo to send payments, we pull all QBO Purchase/BillPayment records and surface them in the reconciliation UI. This is the "Payments Out without Disbo" flow.

### 5.3 Reconciliation Matching Enhancement

**File:** `app/services/quick_books_integration/reconciliation_matcher.rb`

Extends the existing `Accounting::Reconciliation` system:

1. **QBO transactions become a new source** alongside bank transactions and ledger entries
2. Add `qbo_transaction_id` and `qbo_transaction_type` to `reconciliation_items` (new migration)
3. Matching logic:
   - Match QBO transactions to bank transactions by: amount + date (±3 days) + description similarity
   - Match QBO bill payments to Disbo payouts by: `SyncRecord` link (exact) or amount + vendor + date
   - Match QBO deposits to settlement payments by: amount + case reference + date
4. Confidence scoring (same pattern as existing reconciliation):
   - Exact SyncRecord link: 100%
   - Amount + date + vendor match: 90%
   - Amount + date match only: 70%
   - Amount match only: 50% (manual review required)

**Migration:** Add to `reconciliation_items`:
```
add_column :reconciliation_items, :qbo_transaction_id, :string
add_column :reconciliation_items, :qbo_transaction_type, :string
add_index  :reconciliation_items, [:qbo_transaction_id, :qbo_transaction_type], name: 'idx_recon_items_qbo'
```

Update `item_type` validation to include `'qbo_transaction'`.

### 5.4 Payments Out (Non-Disbo)

When a firm pays a doctor/vendor outside of Disbo (e.g., via check, wire, or QBO bill pay):

1. QBO webhook or scheduled sync detects a new BillPayment/Purchase
2. Transaction pulled into `quickbooks_sync_records`
3. Matched against existing bank transactions (Plaid)
4. Surfaced in reconciliation UI as "External Payment" with QBO source badge
5. User can link it to a case and case_provider for tracking

### 5.5 Payments In

When the firm receives money (settlements, client payments):

1. QBO webhook or sync detects Deposit/Payment
2. Matched against bank feed (Plaid credit transactions)
3. Surfaced in reconciliation UI
4. User can link to a case for settlement tracking

---

## Phase 6: Push Disbo Data → QBO

### 6.1 Payout Push

**File:** `app/services/quick_books_integration/payout_push_service.rb`

When a Payout transitions to `processed`:

1. Create QBO **Bill** (vendor = matched QBO vendor, account = Medical Liens or Vendor Payments, class = case's QBO class)
2. Create QBO **Bill Payment** linked to the Bill (payment account = IOLTA Trust Account)
3. Create `SyncRecord` linking Payout <> QBO Bill + BillPayment
4. If the payout has a referral fee component, create separate Bill for referral fee

**Trigger:** `after_commit` callback on Payout status change to `processed`, or via Sidekiq job.

**File:** `app/jobs/integrations/quick_books/payout_sync_job.rb`

### 6.2 Disbursement Push

**File:** `app/services/quick_books_integration/disbursement_push_service.rb`

When a Disbursement completes:
1. Create QBO **Journal Entry** with debits/credits matching the disbursement breakdown
2. Each line tagged with the QBO Class (case)
3. Settlement amount → credit IOLTA Trust, debit Settlement Income
4. Attorney fees → credit IOLTA Trust, debit Attorney Fees
5. Each provider payment → separate Bill + BillPayment

### 6.3 Invoice Push

**File:** `app/services/quick_books_integration/invoice_push_service.rb`

When a medical Invoice is approved in Disbo:
1. Create QBO **Bill** (vendor = provider, line items from invoice list_items, class = case)
2. When payment is made, create QBO **Bill Payment**

### 6.4 Settlement Received Push

When settlement funds are received (detected via Plaid bank feed credit):
1. Create QBO **Deposit** or **Sales Receipt** to the IOLTA Trust Account
2. Tagged with case Class and client Customer

---

## Phase 7: QBO Feature Access Dashboard

### 7.1 Frontend — QuickBooks Dashboard Page

**File:** `src/portals/law-firm/pages/QuickBooksPage/index.tsx` (new page)

Tabs:
1. **Overview** — Connection status, sync health, last sync times per entity, error alerts
2. **Chart of Accounts** — View mapped accounts, re-map if needed, see QBO balances
3. **Vendor Sync** — Import queue, sync status, import candidates review
4. **Transactions** — QBO transactions pulled in, reconciliation status per transaction
5. **Reports** — Embedded QBO report views:
   - Profit & Loss by Case (using QBO Classes)
   - Trust Account Balance
   - Vendor Payment Summary
   - IOLTA Reconciliation Report
6. **Sync Log** — Audit trail of all sync operations, errors, retries

### 7.2 Frontend — Enhanced Reconciliation Page

**File:** `src/portals/law-firm/pages/BankReconciliationPage/` (modify existing)

- Add "QBO Transactions" as a new column/source in the unmatched panel
- Show QBO badge on transactions that have QBO matches
- In match history, show whether match includes QBO data
- New summary stat: "QBO Sync Status" card

### 7.3 Frontend — Settings Integration Card

**File:** `src/portals/law-firm/pages/SettingsPage/components/Integrations/QuickBooksCard.tsx` (new)

- OAuth connect/disconnect
- Connection health indicator (green/yellow/red)
- Quick actions: Force Sync, View Sync Log, Re-authorize
- Settings: sync frequency, auto-push preferences, account mapping

### 7.4 API Endpoints (new)

**File:** `app/controllers/api/v1/integrations/quickbooks_controller.rb`

```
GET    /quickbooks/status                    → Connection status + health
GET    /quickbooks/auth_url                  → OAuth URL
GET    /quickbooks/callback                  → OAuth callback
POST   /quickbooks/disconnect                → Disconnect
POST   /quickbooks/sync                      → Trigger manual full sync
GET    /quickbooks/accounts                  → Account mappings
PUT    /quickbooks/accounts/:id              → Update account mapping
GET    /quickbooks/vendors                   → Vendor import candidates
POST   /quickbooks/vendors/:id/accept        → Accept vendor match
POST   /quickbooks/vendors/:id/reject        → Reject vendor match
POST   /quickbooks/vendors/:id/import        → Import as new recipient
POST   /quickbooks/vendors/bulk_accept       → Bulk accept high-confidence matches
GET    /quickbooks/transactions              → QBO transactions (paginated)
GET    /quickbooks/sync_log                  → Sync audit trail (paginated)
GET    /quickbooks/reports/:report_type      → Proxy to QBO reports API
```

---

## Phase 8: Webhooks

### 8.1 Webhook Receiver

**File:** `app/controllers/api/v1/webhooks/quickbooks_controller.rb`

- Endpoint: `POST /api/v1/webhooks/quickbooks`
- Verifies HMAC-SHA256 signature using QBO webhook verifier token
- Stores raw event in `quickbooks_webhook_events`
- Enqueues processing job
- Returns 200 immediately (QBO requires fast response)

### 8.2 Webhook Processing

**File:** `app/jobs/integrations/quick_books/process_webhook_job.rb`

Handles QBO event notifications:

| Event | Action |
|-------|--------|
| `Vendor.Create` / `Vendor.Update` | Re-run vendor pull for that vendor |
| `Bill.Create` / `Bill.Update` | Pull bill, match to Disbo invoice |
| `Payment.Create` | Pull payment, add to reconciliation |
| `BillPayment.Create` | Pull bill payment, match to payout |
| `Account.Create` / `Account.Update` | Update account mappings |
| `JournalEntry.Create` | Pull and reconcile |

**Idempotency:** Each webhook event gets a unique key from `realm_id + entity_type + entity_id + operation + timestamp`. Duplicate events are skipped.

---

## Phase 9: Scheduled Sync Jobs

**File:** `app/jobs/integrations/quick_books/scheduled_sync_job.rb`

| Job | Schedule | Purpose |
|-----|----------|---------|
| `RefreshTokensJob` | Every 45 min | Refresh expiring OAuth tokens |
| `TransactionSyncJob` | Every 15 min | Pull new QBO transactions since last sync cursor |
| `VendorSyncJob` | Every 6 hours | Pull new/updated QBO vendors |
| `AccountSyncJob` | Every 24 hours | Sync Chart of Accounts changes |
| `ReconciliationJob` | Every 30 min | Run auto-matching on new QBO transactions |
| `ClassSyncJob` | Every 1 hour | Sync QBO Classes <> Disbo Cases |
| `HealthCheckJob` | Every 5 min | Verify connection health, alert on failures |

All jobs use `sync_state` cursor in `quickbooks_connections` to avoid re-processing. Each job is idempotent.

---

## Phase 10: IOLTA Compliance

### Critical Rules Enforced:

1. **Trust Account Segregation**
   - QBO IOLTA Trust Account and Operating Account are ALWAYS separate QBO accounts
   - CoA setup refuses to map both to the same QBO account
   - All trust transactions tagged with client/case Class

2. **No Commingling**
   - Push service validates: IOLTA disbursements only debit the IOLTA QBO account
   - Operating expenses only debit the Operating QBO account
   - Cross-account transfers create proper QBO Transfer transactions (not journal entries)

3. **Per-Client Sub-Ledger**
   - Every QBO transaction touching IOLTA must have a Class (case) tag
   - Reconciliation alerts if any IOLTA transaction in QBO lacks a Class
   - Monthly reconciliation report includes per-client trust balance check

4. **Audit Trail**
   - `SyncRecord` with `has_paper_trail` provides complete history
   - All QBO pushes are logged with before/after snapshots
   - Reconciliation discrepancies flagged with alerts, never auto-resolved

5. **Three-Way Trust Reconciliation Extended**
   - Existing: Bank (Plaid) balance = Trust journal balance = Sum of client sub-ledgers
   - Extended: QBO IOLTA account balance must also match
   - If QBO balance diverges, surface as "QBO Discrepancy" in the monthly reconciliation panel

---

## Phase 11: Error Handling & Edge Cases

### Rate Limiting
- QBO: 500 requests/min throttle, 10 concurrent requests max
- Redis-based sliding window with request queuing
- Jobs self-throttle, re-enqueue with delay if rate limited

### Token Expiration
- Access token: 1 hour → refresh every 45 min
- Refresh token: 100 days → warn org admin at day 90, alert at day 95
- If refresh fails: mark connection `refresh_failed`, pause all sync jobs, email admin

### Data Conflicts
- If QBO entity is modified in both QBO and Disbo between syncs: **QBO wins** for data pulled from QBO, **Disbo wins** for data pushed to QBO
- Conflicts logged in `SyncRecord` with status `conflict` for manual resolution

### Partial Sync Failures
- Each entity syncs independently — one failure doesn't block others
- Failed syncs: retry 3x with exponential backoff, then mark `failed` in `SyncRecord`
- Daily job surfaces all failed syncs to admin dashboard

### Disconnection
- When firm disconnects QBO: soft-delete `Connection`, disable `OrgIntegration`, pause all jobs
- `SyncRecord` data preserved for audit
- Reconciliation data preserved (QBO transactions already pulled remain in the system)

### QBO Company Switch
- If firm reconnects with a different QBO company (different `realm_id`): require explicit confirmation, archive old sync records, start fresh

---

## File Summary — All Files to Create/Modify

### Backend (disburso-ai-core)

**New files:**
```
config/initializers/quickbooks.rb
app/models/integrations/quick_books.rb
app/models/integrations/quick_books/connection.rb
app/models/integrations/quick_books/account_mapping.rb
app/models/integrations/quick_books/sync_record.rb
app/models/integrations/quick_books/vendor_import_candidate.rb
app/models/integrations/quick_books/webhook_event.rb
app/controllers/api/v1/integrations/quickbooks_controller.rb
app/controllers/api/v1/webhooks/quickbooks_controller.rb
app/services/quick_books_integration.rb
app/services/quick_books_integration/api_client.rb
app/services/quick_books_integration/rate_limiter.rb
app/services/quick_books_integration/chart_of_accounts_setup.rb
app/services/quick_books_integration/class_sync_service.rb
app/services/quick_books_integration/customer_sync_service.rb
app/services/quick_books_integration/vendor_pull_service.rb
app/services/quick_books_integration/vendor_invite_service.rb
app/services/quick_books_integration/vendor_push_service.rb
app/services/quick_books_integration/transaction_pull_service.rb
app/services/quick_books_integration/reconciliation_matcher.rb
app/services/quick_books_integration/payout_push_service.rb
app/services/quick_books_integration/disbursement_push_service.rb
app/services/quick_books_integration/invoice_push_service.rb
app/jobs/integrations/quick_books/refresh_tokens_job.rb
app/jobs/integrations/quick_books/scheduled_sync_job.rb
app/jobs/integrations/quick_books/transaction_sync_job.rb
app/jobs/integrations/quick_books/vendor_sync_job.rb
app/jobs/integrations/quick_books/account_sync_job.rb
app/jobs/integrations/quick_books/class_sync_job.rb
app/jobs/integrations/quick_books/reconciliation_job.rb
app/jobs/integrations/quick_books/health_check_job.rb
app/jobs/integrations/quick_books/payout_sync_job.rb
app/jobs/integrations/quick_books/process_webhook_job.rb
db/migrate/XXXXXX_create_quickbooks_connections.rb
db/migrate/XXXXXX_create_quickbooks_account_mappings.rb
db/migrate/XXXXXX_create_quickbooks_sync_records.rb
db/migrate/XXXXXX_create_quickbooks_vendor_import_candidates.rb
db/migrate/XXXXXX_create_quickbooks_webhook_events.rb
db/migrate/XXXXXX_add_quickbooks_to_org_integrations.rb
db/migrate/XXXXXX_add_qbo_class_id_to_cases.rb
db/migrate/XXXXXX_add_qbo_fields_to_reconciliation_items.rb
spec/models/integrations/quick_books/  (all model specs)
spec/services/quick_books_integration/ (all service specs)
spec/jobs/integrations/quick_books/    (all job specs)
spec/controllers/api/v1/integrations/quickbooks_controller_spec.rb
spec/controllers/api/v1/webhooks/quickbooks_controller_spec.rb
```

**Modified files:**
```
Gemfile                                    → add oauth2, lockbox gems
config/application.yml.example             → add QBO env vars
config/routes.rb                           → add QBO routes
app/models/org_integration.rb              → add quickbooks to kind enum
app/models/case.rb                         → add qbo_class_id attribute
app/models/accounting/reconciliation_item.rb → add qbo_transaction fields, update item_type validation
app/models/payout.rb                       → add after_commit hook for QBO push
app/models/ability.rb                      → add QBO permissions
```

### Frontend (disburso-ai-frontend)

**New files:**
```
src/store/api/quickbooksApi.ts
src/portals/law-firm/pages/SettingsPage/components/Integrations/QuickBooksCard.tsx
src/portals/law-firm/pages/SettingsPage/components/Integrations/QuickBooksVendorImport.tsx
src/portals/law-firm/pages/SettingsPage/components/Integrations/QuickBooksAccountMapping.tsx
src/portals/law-firm/pages/QuickBooksPage/index.tsx
src/portals/law-firm/pages/QuickBooksPage/components/OverviewTab.tsx
src/portals/law-firm/pages/QuickBooksPage/components/TransactionsTab.tsx
src/portals/law-firm/pages/QuickBooksPage/components/VendorSyncTab.tsx
src/portals/law-firm/pages/QuickBooksPage/components/ReportsTab.tsx
src/portals/law-firm/pages/QuickBooksPage/components/SyncLogTab.tsx
src/types/quickbooks.ts
```

**Modified files:**
```
src/portals/law-firm/pages/SettingsPage/components/Integrations/index.tsx  → replace "Coming Soon" with integration cards
src/portals/law-firm/pages/BankReconciliationPage/index.tsx                → add QBO data source
src/portals/law-firm/pages/BankReconciliationPage/types.ts                 → add QBO types
src/router/index.tsx                                                        → add QuickBooks page route
src/types/api.ts                                                            → add QBO API types
```

### Sandbox Custom Users (sandbox-custom-users)

**New files:**
```
quickbooks/README.md                → QBO sandbox setup instructions
quickbooks/sample_vendor_data.json  → Sample QBO vendor data for testing
quickbooks/sample_chart_of_accounts.json → Sample CoA for testing
```

---

## Implementation Order (Recommended for PR Sequencing)

| PR | Scope | Depends On |
|----|-------|------------|
| **PR 1** | Migrations + Models + OrgIntegration update + Feature flag | — |
| **PR 2** | OAuth flow (backend controller + token refresh job) | PR 1 |
| **PR 3** | QBO API Client + Rate Limiter | PR 1 |
| **PR 4** | Chart of Accounts setup + Account Mapping | PR 2, PR 3 |
| **PR 5** | Frontend: Integrations tab + QuickBooks OAuth card | PR 2 |
| **PR 6** | Vendor pull + smart match + import candidates | PR 3, PR 4 |
| **PR 7** | Frontend: Vendor import review UI | PR 6 |
| **PR 8** | Transaction pull + QBO reconciliation matcher | PR 3, PR 4 |
| **PR 9** | Payout push + Disbursement push + Invoice push | PR 4 |
| **PR 10** | Webhooks (receiver + processor) | PR 3 |
| **PR 11** | Scheduled sync jobs (all) | PR 6, PR 8 |
| **PR 12** | Frontend: QuickBooks dashboard page | PR 8, PR 9 |
| **PR 13** | Frontend: Enhanced reconciliation page with QBO | PR 8 |
| **PR 14** | IOLTA compliance validations + alerts | PR 4, PR 8 |
| **PR 15** | Comprehensive test suite + sandbox test data | All |

---

## Verification & Testing Strategy

### Unit Tests
- All models: validations, associations, scopes, enum behaviors
- All services: mock QBO API responses, test each sync direction
- All jobs: mock services, test scheduling, retry behavior, error handling

### Integration Tests
- OAuth flow end-to-end (with QBO sandbox)
- Full sync cycle: connect → CoA setup → vendor pull → payout push → reconciliation
- Webhook delivery → processing → data update

### Manual Testing Checklist
1. Connect QBO sandbox account from Settings → Integrations
2. Verify CoA auto-created in QBO sandbox
3. Verify vendors pulled and displayed in import review
4. Accept a vendor match, verify linked in Disbo
5. Import new vendor, verify Recipient created + invitation sent
6. Create a Payout in Disbo, verify Bill + BillPayment pushed to QBO
7. Create a transaction in QBO, verify it appears in Reconciliation page
8. Disconnect QBO, verify graceful degradation
9. Re-connect, verify re-sync works
10. Test with QBO rate limiting (simulate 500+ requests)

### QBO Sandbox
- Use Intuit Developer sandbox company
- Configure via `QUICKBOOKS_ENVIRONMENT=sandbox` in `application.yml`
- Add sandbox credentials to Heroku sandbox app config
