# Requirements — 001 Core Platform

> **Feature:** Split & Settle Core Platform
> **Version:** 1.0 · **Status:** VALIDATED ✅
> **Format:** EARS (Event-Action-Response-State)

---

## Functional Requirements

### Authentication

**FR-01** — User Registration
WHEN a new user submits a valid email, password (min 6 chars), and display name,
THEN the system SHALL create a Supabase Auth account and return a JWT session token.

**FR-02** — User Login
WHEN an existing user submits a valid email and password,
THEN the system SHALL return a JWT session token and persist the session in localStorage.

**FR-03** — Rate Limiting on Auth
WHEN any client makes more than 30 authentication requests within a 15-minute window,
THEN the system SHALL reject subsequent requests with HTTP 429 and a descriptive error message.

---

### Group Management

**FR-04** — Create Group
WHEN an authenticated user submits a group name,
THEN the system SHALL create a group record, generate a unique 6-character alphanumeric invite code, add the creator as a member, and return the group object.

**FR-05** — Join Group by Invite Code
WHEN an authenticated user submits a valid invite code and a display name,
THEN the system SHALL add the user to the corresponding group as a member.

**FR-06** — List Groups
WHEN an authenticated user requests their groups,
THEN the system SHALL return all groups where the user is a member, ordered by creation date descending.

**FR-07** — Update Group
WHEN the group creator submits updated name or currency fields,
THEN the system SHALL update the group record. If `regenerateInviteCode` is true, a new 6-character invite code SHALL be generated.

**FR-08** — Leave Group
WHEN an authenticated member requests to leave a group,
THEN the system SHALL remove them from `group_members`. IF the user is the group creator, the request SHALL be rejected with HTTP 403.

**FR-09** — Auto Currency Detection
WHEN a receipt is scanned and Gemini identifies a currency code (ISO 4217),
THEN the system SHALL automatically update the group currency field with the detected code.
IF the user wants to override the currency, they MAY do so from Group Settings.
The group creation form SHALL NOT include a currency selection field.

**FR-10** — Delete Group
WHEN the group creator requests group deletion,
THEN the system SHALL delete the group and all cascading records (receipts, items, shares, settlements).

---

### Receipt Management

**FR-11** — Scan Receipt with AI
WHEN an authenticated member uploads a receipt image to a group,
THEN the system SHALL send the image to Gemini Vision (gemini-3.6-flash), parse the response as JSON (stripping markdown fences), and store the merchant name, date, total amount, tax, tip, currency code, and line items in Supabase.

**FR-12** — Add Line Item
WHEN a member submits a new item name and price for an existing receipt,
THEN the system SHALL create a receipt_items record linked to that receipt.
The add item button label SHALL be "+ Add Item".

**FR-13** — Edit Line Item
WHEN a member submits updated name, price, or quantity for an existing item,
THEN the system SHALL update the receipt_items record.

**FR-14** — Delete Line Item
WHEN a member requests deletion of an existing item,
THEN the system SHALL delete the receipt_items record and cascade-delete related item_shares.

**FR-15** — Create Manual Expense
WHEN a member submits an expense without a receipt image (merchant name + at least 1 item),
THEN the system SHALL create a receipt record with status=confirmed and the associated items.

**FR-16** — Update Receipt Metadata
WHEN a member submits updated merchant name, date, category, notes, paidBy, tax, or tip for a receipt,
THEN the system SHALL update the receipts record.

**FR-17** — Receipt Status Flow
WHEN a receipt is first uploaded via scan, its status SHALL be `pending`.
WHEN the AI parse completes successfully, the status SHALL be set to `parsed`.
WHEN a member explicitly confirms the receipt, the status SHALL be set to `confirmed`.

---

### Splitting

**FR-18** — Split All Equally
WHEN a member triggers "Split All Equally" and the group has 2 or more members,
THEN the system SHALL divide the receipt total equally among all members using penny-reconciliation (greedy first-creditor rule) and write item_shares records.
IF the group has fewer than 2 members, the button SHALL be disabled with label "(Needs 2+ Members)".

**FR-19** — Split Selected Members Equally
WHEN a member triggers equal split for a selected subset of members (minimum 2),
THEN the system SHALL divide the total equally among only the selected members.

**FR-20** — Proportional Tax & Tip Split
WHEN a member triggers proportional split mode,
THEN the system SHALL distribute tax and tip amounts proportionally to each member's item subtotal.
IF all member subtotals are zero, tax and tip SHALL be split equally as a fallback.

**FR-21** — Manual Share Assignment
WHEN a member submits an explicit share_amount per user for a receipt,
THEN the system SHALL write item_shares records for each user:shareAmount pair.

---

### Settlement

**FR-22** — Compute Balances
WHEN a member requests the balance summary for a group,
THEN the system SHALL query all confirmed receipts, items, and shares for the group, compute each member's net balance (positive = owed money, negative = owes money), and return the balance map.

**FR-23** — Simplify Settlements
WHEN balances are computed,
THEN the system SHALL apply the greedy minimum cash flow algorithm to generate the minimum set of peer-to-peer payment instructions.
WHEN a debtor and creditor amounts differ, the larger shall absorb the smaller, reducing total transaction count.

**FR-24** — Record Payment
WHEN a member records a payment to another member,
THEN the system SHALL create a settlements record of type=payment and update relevant balances.

**FR-25** — Invite Banner for Solo Groups
WHEN a member views a receipt and the group has only 1 member,
THEN the system SHALL display an invite banner with a copy-to-clipboard invite code button.

---

## Non-Functional Requirements

**NFR-01 — Security**
All database operations MUST be protected by Supabase Row Level Security policies.
RLS policies on group_members MUST use SECURITY DEFINER helper functions to prevent infinite recursion.
HTTP headers MUST include Helmet security defaults.

**NFR-02 — Request Validation**
All incoming request bodies MUST be validated against a Zod schema before reaching any controller.
Invalid requests MUST return HTTP 400 with a descriptive validation error.

**NFR-03 — Request Tracing**
Every HTTP response MUST include an X-Request-Id header containing a UUID for distributed tracing.

**NFR-04 — Payload Size**
Request bodies MUST NOT exceed 2MB. Larger payloads MUST be rejected with HTTP 413.

**NFR-05 — Monetary Precision**
All monetary calculations MUST use NUMERIC(10,2) at the database layer.
All in-memory calculations MUST round to 2 decimal places at every computation boundary.

**NFR-06 — Multilingual AI**
The Gemini receipt parsing prompt MUST support receipts in any language or script without code changes.

**NFR-07 — Currency Formatting**
Zero-decimal currencies (JPY, KRW, VND, IDR) MUST display as whole numbers in the UI.
All other currencies MUST display with 2 decimal places.

**NFR-08 — Accessibility**
All modal dialogs MUST have role="dialog", aria-modal="true", and aria-labelledby pointing to the modal title.

**NFR-09 — Health Observability**
The backend MUST expose a GET /health endpoint returning service name, status, timestamp, and uptime.
