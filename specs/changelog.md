# Spec Changelog — Split & Settle

> Records all significant design decisions, pivots, and spec deviations during development.
> New entries go at the TOP. Format: ## [YYYY-MM-DD] — Short Title

---

## [2026-09-16] — Currency field removed from group creation UI

**Change type:** Requirement pivot
**Affected spec:** 001-core-platform/requirements.md FR-09

**Original intent:** Group creation form had a currency dropdown (USD, PHP, EUR, etc.).

**Decision:** Removed currency dropdown from CreateGroupModal. Currency is now auto-detected by Gemini AI when a receipt is scanned. Manual override remains in Group Settings (gear icon).

**Rationale:** Asking the user to pre-select currency is redundant — Gemini Vision detects currency from receipt text and ISO codes. The safe counter-measure (manual override) is available if AI detection fails.

**Code change:** frontend/src/components/CreateGroupModal.jsx — removed select currency field and related state.

---

## [2026-09-16] — "Add Missing Item" button renamed to "+ Add Item"

**Change type:** UX copy change
**Affected spec:** 001-core-platform/requirements.md FR-12

**Decision:** Renamed button from "Add Missing Item" to "+ Add Item" in ReceiptSplitView.jsx.

**Rationale:** "Missing" implied the item was absent from the AI-parsed receipt. Users add items for any reason. The simpler label is more intuitive.

---

## [2026-09-16] — Gemini model upgraded: gemini-2.5-flash → gemini-3.6-flash

**Change type:** Dependency change (breaking)
**Affected spec:** constitution.md Section 3.3

**Decision:** API key returns HTTP 404 for gemini-2.5-flash (deprecated). All Gemini calls updated to gemini-3.6-flash.

**Rationale:** Hard constraint of the current API key tier. gemini-2.5-flash was deprecated before development began.

---

## [2026-09-16] — responseMimeType removed from Gemini calls

**Change type:** Bug fix → permanent non-negotiable
**Affected spec:** constitution.md Section 3.3

**Decision:** Removed responseMimeType: application/json from @google/genai call options. JSON is extracted by stripping markdown fences from raw response string.

**Rationale:** Setting responseMimeType caused silent failures — API returned 200 with empty/malformed content. Stripping markdown fences is more reliable with this model version.

---

## [2026-09-16] — Storage bucket policies removed from schema.sql

**Change type:** Deployment process change
**Affected spec:** 001-core-platform/design.md Section 3

**Decision:** schema.sql no longer contains DO $$ ... $$ PL/pgSQL blocks for storage bucket policies. Must be created manually in Supabase Dashboard → Storage → receipts → Policies.

**Rationale:** Supabase SQL Editor terminates dollar-quoted strings prematurely when single quotes appear inside the block. This is a known Supabase dashboard parser limitation.

**Manual setup required:**
1. Dashboard → Storage → receipts bucket → Policies
2. INSERT policy: Allow authenticated role
3. SELECT policy: Allow authenticated role

---

## [2026-09-04] — Monorepo consolidation: split-and-settle-frontend folder deleted

**Change type:** Repository restructure
**Affected spec:** constitution.md Section 2 Infrastructure

**Decision:** Standalone split-and-settle-frontend/ directory permanently deleted. Frontend code now lives exclusively at split-and-settle/frontend/.

**Rationale:** Two directories for the same project created confusion about which was canonical. The monorepo structure (backend + frontend in one repo) simplifies deployment and is the standard for this project size.

---

## [2026-09-03] — RLS infinite recursion fix via SECURITY DEFINER functions

**Change type:** Critical bug fix → permanent non-negotiable
**Affected spec:** constitution.md Section 3.1, 001-core-platform/design.md Section 3

**Decision:** Replaced all direct subqueries into group_members within group_members RLS policies with SECURITY DEFINER helper functions: is_group_member(group_uuid UUID), is_member_of_group(gid UUID, uid UUID), is_group_creator(group_uuid UUID).

**Rationale:** RLS policies on group_members that subquery group_members to check membership cause infinite recursion — Supabase throws error 54001 "stack depth limit exceeded". SECURITY DEFINER functions bypass the calling user RLS context, breaking the recursion.
