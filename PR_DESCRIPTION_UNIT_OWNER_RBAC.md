# Unit Owner Access, Missed Bills Tracking & UI Consistency

This PR introduces Role-Based Access Control, reworks the unit-owner home experience around missed/advance bills, enforces server-side payment scoping, and brings management pages onto one shared table layout with mobile-friendly dashboards.

**Target branch:** `main` → **Source branch:** `staging`

---

## What's included

### 🔐 Feature: Role-Based Access Control

| Area                | Summary                                                                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **RBAC middleware** | New `requireRoles` / `requireStaff` middleware resolves the caller's role from the DB and gates every route group; unknown groups fail closed |
| **Role policy**     | Unit Owners → Dashboard, Payments, Settings only. Management routes (bills, buildings, users, expenses, audit, payment writes) are staff-only |
| **Client guards**   | Sidebar hides staff-only links for owners; `useStaffOnlyPage()` redirects owners off restricted pages                                         |
| **Data-leak fixes** | Dashboard, reminders and per-owner payment endpoints no longer expose other owners' data to unit owners                                       |

### 🐛 Fix: Payment scoping

| Area                        | Summary                                                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Server-enforced scoping** | Unit owners' payment lists are resolved from the auth token — client-supplied `unit_number` cannot bypass the filter |
| **Payments page**           | Unit owners now see only their own payments; staff lookups (bills/users/buildings) are skipped to avoid 403 noise    |

### ✨ Feature: Missed Bills & Advance Payments

| Area                | Summary                                                                                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner home page** | Dynamic panel — Missed Bills (with cycle counts and outstanding totals) when arrears exist, Advance Payments (credit + cycles paid ahead) when settled ahead, Account Standing otherwise |
| **Cycle-accurate**  | Standings are computed from the owner's `created_at` anchor, so adjusted creation dates exclude pre-dated payments                                                                       |

### 🎨 Improvements: UI consistency

| Area                      | Summary                                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Shared table layout**   | Expenses and Audit Logs pages rebuilt on the same sortable/searchable/paginated table shell as Payments, Users and Bills        |
| **Dashboard components**  | `UnitOwnerView` and `UnitAdminView` extracted from the monolithic home page into typed, presentational components               |
| **Mobile responsiveness** | Mobile-first scaling (`p-2 md:p-4`, `gap-2 md:gap-4`, smaller radii) across both dashboard views and all shared dashboard cards |
| **Modal & nav polish**    | Scrollable body in the user details modal, fixed-height layout, sidebar active-state and spacing fixes                          |

---

## Technical notes

- **No schema changes** — all RBAC role resolution is done from the existing `users.type` column.
- **New endpoint:** `GET /api/payments/owner/:unit_number` (owner-scoped recent payments, respects `created_at`).
- **New files:** `server/middleware/rbac.middleware.js`, `client/utils/rbac.helper.tsx`, `client/app/home/UnitOwnerView.tsx`, `client/app/home/UnitAdminView.tsx`, `ExpenseTable.tsx`, `AuditLogTable.tsx`.
- **Search added:** expenses and audit logs endpoints now accept `?search=` with server-side filtering, plus `?sort=&order=` for expenses.

## Verification

- RBAC tested end-to-end with real owner and admin tokens: management routes return `403` for owners, `200` for staff; unit spoofing is rejected; owner-scoped endpoints only return the caller's data.
- Client `next build` passes with no TypeScript errors; server boots cleanly against MySQL.
