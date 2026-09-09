# Mahindra I2P — Invoice to Payment Tracker

A complete React + Redux application for tracking supplier invoices end-to-end —
from upload through approval, booking, and payment — across four processing
channels (Msetu/SRM, PO Portal, Manual, MFOX Portal).

Built with Mahindra's brand identity: the red used throughout (`#DD052B`) is
lifted directly from mahindra.com; the logo is used as supplied.

## Getting started

```bash
npm install
npm run dev      # starts the dev server (Vite)
npm run build    # production build to /dist
npm run test     # runs the automated test suite (27 tests)
npm run lint     # oxlint
```

## Demo logins

**Internal Team** — pick a portal scope, then sign in:
- Username: `admin`
- Password: `admin123`
- Portal / Team: *All Channels (HQ / Admin)* or *Internal Team*

**Supplier** — pick a company, then a vendor code (no password needed, this
path simulates an OTP login): any company/vendor-code combination works.

## What's in it

- **3 login contexts**: HQ/Admin (sees everything), Internal Team (scoped to
  three of the four channels, no Manual, no HQ-only pages), and Supplier
  (scoped to exactly one vendor code — never a sibling code under the same PAN).
- **Invoice tracking** across 4 channels, each with its own real stage list,
  sub-views (Approver Assignment, SAP Booking, Payment & UTR, etc.), search,
  and history.
- **Supplier Visibility**: browse any supplier's vendor codes and see every
  invoice against each one, individually or consolidated.
- **Inquiry Desk**: a full ticketing system with SLA tracking, list and Kanban
  board views (drag a card to change its status), threaded replies, and a
  complete activity audit log.
- **Reports, Sync Log, and a global Logs/History audit trail** with CSV export.
- **Settings**: role/permission matrix, user management, notification rules,
  audit logs, integration status — all with proper role-based access control.
- **Live identity switcher** in the top bar: flip between HQ, Internal Team,
  or any supplier vendor code without logging out, and every page instantly
  re-scopes.

## Architecture

```
src/
  data/            Static seed data (invoices, tickets, channel definitions)
  utils/           Pure business logic (stage progress, SLA breach, PAN/vendor
                    code identity, CSV export) — framework-agnostic, unit-testable
  app/store.js     Redux store configuration
  features/
    auth/          Login/logout/identity-switch slice + role-permission selector
    tickets/       Full ticket lifecycle slice (create, comment, status, assignee)
    tables/        Generic editable-table slice (used by Users, Notifications, etc.)
    settings/      Role permission matrix slice
    ui/            Navigation, modals, toasts, filters, search, pagination
  components/      Reusable UI: layout (Sidebar/Topbar), tables, charts, modals
  pages/           One file per route
  routes/          React Router route tree + role-based route guards
```

State management follows standard Redux Toolkit conventions: one slice per
domain, memoized selectors (`createSelector`) wherever a selector derives a
new array, and all business rules live in plain, tested functions under
`utils/` rather than inside components.

## Testing

`src/__tests__/app.test.jsx` exercises the application end-to-end with
React Testing Library: both login flows, every navigation destination for
every role, every modal, ticket creation and replies, the Kanban board,
identity switching, permission toggles, user CRUD, and route guards. All 27
tests pass with zero console warnings.

## Notes on scope

This app fixes one issue found while reviewing the reference prototype it was
built from: that prototype had extensive code for a "single-channel-scoped"
internal login that was never actually reachable through any UI control. That
dead code path has been removed here; the only two internal scopes — *All
Channels* and *Internal Team* — are the ones the login screen and identity
switcher actually offer, and both are fully wired and tested.
