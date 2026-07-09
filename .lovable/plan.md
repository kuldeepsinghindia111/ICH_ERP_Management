# College Management System — Feature Expansion

## 1. Payment form validation (inline errors)
- Extend `validatePaymentInput` to return per-field errors `{ amount?, reference?, method? }` alongside a summary.
- Add per-method reference format regex:
  - UPI: 12+ alphanumeric (e.g. `TXN123456`)
  - Card: last 4 digits or auth code (min 4 chars)
  - Bank/NEFT: 10–22 chars alphanumeric
  - Cheque: 6-digit numeric
- Update `collect-payment-dialog.tsx` and `pay.tsx` offline form to render inline `<p className="text-destructive text-xs">` under each field; validate on blur + submit.

## 2. Dashboard widget (`src/routes/index.tsx`)
- Add a "This semester" card showing:
  - Total received (sum of non-voided payments this calendar term)
  - Pending (sum of student balances)
  - Due today (charges added but not covered) — computed via `studentTotals` aggregate.
- Quick links: "View payment history" → `/fees`, "Audit log" → `/audit`.

## 3. Auto receipt number generation
- Add `nextReceiptNo(date)` helper in `store.ts`: format `RCPT-YYYYMMDD-####` (zero-padded sequence per day based on existing payments).
- Prefill the reference field in collect dialog and offline pay form when method is cash/other, and always for auto-generated online references (already exists). Editable, but auto-fills to prevent duplicates.

## 4. Student name search & auto-suggest
- Add a `<Command>`-based combobox (existing `command.tsx`) for student filter in:
  - `src/routes/fees.tsx` (payment history / student list search)
  - `src/routes/audit.tsx` (filter events by student)
- Suggestions match name, admission no, or roll; up to 8 results.

## 5. Roles, users, permissions

### Role model
- Add third role `accountant` to `UserRole` union: `"admin" | "accountant" | "faculty"`.
- New `AppUser` type in store:
  ```ts
  { id, userCode, name, role, permissions: Record<Section, {view: boolean, edit: boolean}>, createdAt }
  ```
- `Section` = `"students" | "fees" | "payments" | "reports" | "faculty" | "courses" | "settings" | "audit"`.
- Seed one Admin, one Accountant, one Faculty user.
- Default permission presets per role; Admin can override per user.

### Store additions
- `users: AppUser[]`, `currentUserId: string`.
- Actions: `addUser`, `updateUser`, `removeUser`, `setCurrentUser`, `setPermission(userId, section, perm, value)`.
- Derived helper `can(section, action)` reading `currentUser`.
- Replace `role` reads with `currentUser.role`; keep back-compat by deriving `role` from current user.

### Switcher (root header)
- Replace existing `RoleSwitcher` with a `UserSwitcher` dropdown listing users grouped by role, showing name + userCode. Selecting sets `currentUserId`.

### Admin permissions page
- New route `src/routes/users.tsx`:
  - Table of users with add/edit/remove.
  - Per-user permission matrix (checkbox grid of sections × view/edit).
  - Admin-only; other roles see access-denied panel.
- Sidebar link "Users & Roles" under Admin group.

### Gating
- Add `can()` guards to:
  - Void/unvoid (already admin — now `can("payments","edit")` + admin override for void).
  - Settings edits.
  - Add/edit students, faculty, courses, charges, adjustments, payments.
- Sidebar hides sections user cannot view.

## 6. Audit trail attribution
- Extend `AuditLog` with `actorUserId`, `actorName`, `actorCode`.
- `addAuditLog` reads `currentUser` for attribution.
- Add audit events for user/permission changes: `user.created`, `user.updated`, `user.removed`, `permissions.updated`.
- Audit route: add "User" column and filter by user + student name auto-suggest.

## Technical notes
- Bump persisted store key to `cms-store-v4` (schema change); on load, migrate legacy `role` into a synthesized default user.
- All new UI uses existing shadcn primitives; no new deps.
- Keep changes frontend + store only (no backend).

## Out of scope
- Real authentication / passwords (still demo switcher, but with multi-user IDs).
- Server-side persistence.
