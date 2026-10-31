# Feature: Building Management, Unit Owner assignment & per-page titles

This PR delivers the **Building Management** feature and rebuilds **User Management** around real user accounts, replacing the previous placeholder item-CRUD screen.

**Target branch:** `main` → **Source branch:** `staging`

---

## What's included

| Area                        | Summary                                                                  |
| --------------------------- | ------------------------------------------------------------------------ |
| **Building Management**     | New page + full CRUD API for buildings (`name`, `capacity`, `occupants`) |
| **Unit Owner assignment**   | Unit Owners are assigned to a building; occupancy is tracked live        |
| **User Management rebuild** | The screen now manages real accounts instead of items                    |
| **Flexible sign-in**        | Login accepts an email, unit number, or display name                     |
| **Per-page titles**         | Each route renders its own browser tab title                             |
| **Build fixes**             | `next build` now passes (removed dead boilerplate, fixed imports)        |

---

## Database changes

Applied via `npx prisma db push`.

### New `building` table

| Column        | Type           | Null | Key | Default                |
| ------------- | -------------- | ---- | --- | ---------------------- |
| `building_id` | `int(11)`      | NO   | PRI | auto_increment         |
| `name`        | `varchar(100)` | NO   | UNI | —                      |
| `capacity`    | `int(11)`      | NO   | —   | —                      |
| `occupants`   | `int(11)`      | NO   | —   | `0`                    |
| `created_at`  | `datetime(3)`  | YES  | —   | `current_timestamp(3)` |
| `updated_at`  | `datetime(3)`  | YES  | —   | —                      |

### `users` table additions

| Column        | Type           | Null | Notes                                       |
| ------------- | -------------- | ---- | ------------------------------------------- |
| `type`        | `varchar(20)`  | NO   | User Type — defaults to `Unit Owner`        |
| `name`        | `varchar(100)` | YES  | Unit Owner display name                     |
| `unit_number` | `varchar(20)`  | YES  | Unit number (also used as a fallback login) |
| `building`    | `int(11)`      | YES  | Assigned building id (indexed)              |

---

## API

All routes are behind `requireAuth` and use httpOnly-cookie JWT auth.

### `/api/buildings` (new)

| Method   | Path                 | Behaviour                                                             |
| -------- | -------------------- | --------------------------------------------------------------------- |
| `GET`    | `/api/buildings`     | List all buildings, newest first                                      |
| `POST`   | `/api/buildings`     | Create — name required & unique, capacity required (whole number > 0) |
| `PATCH`  | `/api/buildings/:id` | Update name and/or capacity                                           |
| `DELETE` | `/api/buildings/:id` | Delete                                                                |

### `/api/users` (new)

| Method   | Path             | Behaviour                                                                        |
| -------- | ---------------- | -------------------------------------------------------------------------------- |
| `GET`    | `/api/users`     | List all users (passwords and refresh tokens stripped)                           |
| `POST`   | `/api/users`     | Create a user with User Type, Unit Number, Building and optional Unit Owner name |
| `PATCH`  | `/api/users/:id` | Update any of the above fields                                                   |
| `DELETE` | `/api/users/:id` | Delete (users cannot delete their own account)                                   |

### `/api/auth` (updated)

- `login` now resolves the user by **email, unit number, or display name** via `findByIdentifier`. Non-unique names resolve to the most recently created match.
- `register`, `login` and `me` now return `type`, `name`, `unit_number` and `building`.

---

## Rules and validation

### User Type

`Unit Owner` (default) · `Admin` · `Super Admin`

- The value is validated against a whitelist server-side.
- Only `Unit Owner` requires a **Unit Number** and a **Building**.

### Unit number fallback login

When **both** the Unit Owner name and the email are left blank, the unit number becomes **both** the username and the password:

```
POST /api/users
{ "type": "Unit Owner", "unit_number": "7C", "name": "", "email": "" }
→ 201 { "user": { "email": "7C", "unit_number": "7C" }, "tempPassword": "7C" }
```

Logging in with `7C` / `7C` succeeds. A duplicate unit number is rejected.

### Building assignment and occupancy

- A `Unit Owner` **must** have a building → _"Building is required for Unit Owner accounts"_.
- The building must exist → _"Selected building does not exist"_.
- The building must have room → _"X is at full capacity (N)"_.
- `occupants` is incremented on create, **transferred** when a user's building changes on update, and decremented on delete.

### Temporary passwords

Admin-created users get a server-generated temporary password that is returned **once** and displayed in a success dialog for the admin to share. A name without an email is rejected (_"Email is required when a name is provided"_) so the account always has a way to sign in.

---

## Frontend

### Building Management (new page)

- Sidebar entry **Building Management** → `/home/building-management`
- Table with **Building Name**, **Occupants**, **Capacity** and Actions
- Add/Edit modal with Building Name and Capacity (both required)
- Occupancy is shown live in the unit-owner dropdown as `Tower A — 1/80 occupied`

### User Management (rebuilt)

- Table with **Email**, **User Type** (colour-coded badge), **Unit Owner**, **Building**, **Unit No.** and Actions
- Add/Edit modal with Email (optional), User Type dropdown, Unit Number, **Building dropdown** (shown only for `Unit Owner`, required) and Unit Owner name (optional)
- Building dropdown displays current availability; counts refresh after any create/update/delete
- A `Building` column resolves the building name from its id

### Login

- Field relabelled **"Email or Username"** with placeholder _"Email, unit number, or name"_
- `autoComplete="username"` so password managers fill it correctly

### Per-page titles

Each route now declares its own title through a server-side segment layout, so titles are correct in the SSR HTML **and** on client-side navigation.

| Route                       | Title                                             |
| --------------------------- | ------------------------------------------------- |
| `/home`                     | Home \| Property Management System                |
| `/home/user-management`     | User Management \| Property Management System     |
| `/home/building-management` | Building Management \| Property Management System |
| `/auth/login`               | Sign In \| Property Management System             |
| `/auth/register`            | Create Account \| Property Management System      |

> **Note:** the root layout uses a `title.template` and the `home` layout uses the `{ default, template }` object form — a plain string title would wipe the template for all descendant segments.

---

## Build & quality fixes

- **Removed dead boilerplate** (`components/RegisterModal.tsx`, `components/LogInModal.tsx`) that referenced a deleted `@/hooks/userRegister` hook and removed `auth.helper` exports. These were unreferenced but were type-checked by `next build`, failing it with TS2307/TS2305/TS7006.
- **Fixed broken imports** in `app/page.tsx` (`@/app/NavBar` and `@/app/Hero` no longer exist).
- **Navbar loading state** now keys off `userData.isLoggedIn` instead of the global `isLoading` flag, which was set by every page on mount and left the navbar stuck on "Loading…" across navigations.
- **Disabled font fallback tuning** (`adjustFontFallback: false`) for `Elms Sans`, which is newer than the bundled font-metrics snapshot.

`npm run build` now completes successfully and `npm run lint` is clean.

---

## Testing performed

Verified against a live MariaDB instance with the Express API and Next.js client running:

| Scenario                                     | Result                                   |
| -------------------------------------------- | ---------------------------------------- |
| Register / login / `GET /me` with cookies    | ✅ 200/201                               |
| Create building, list, update, delete        | ✅                                       |
| Duplicate building name                      | ✅ 400                                   |
| Invalid capacity (`0`, non-integer, missing) | ✅ 400                                   |
| Create user for each User Type               | ✅ 201                                   |
| Unit Owner without building                  | ✅ 400                                   |
| Unit Owner with nonexistent building id      | ✅ 400                                   |
| Occupant counter increments on create        | ✅ 0 → 1                                 |
| Occupant counter transfers on update         | ✅ old −1, new +1                        |
| Occupant counter decrements on delete        | ✅ 1 → 0                                 |
| Login by unit number (`7C` / `7C`)           | ✅ 200                                   |
| Login by display name                        | ✅ resolves user (401 on wrong password) |
| Login by email (legacy `email` key)          | ✅ 200 — backwards compatible            |
| Delete own account                           | ✅ 400 blocked                           |
| Unauthenticated requests                     | ✅ 401                                   |
| Per-route titles in SSR HTML                 | ✅ all routes                            |

---

## Notes & follow-ups

- **Existing users have `building = NULL`** and the `occupants` counters only reflect assignments made after this change. A backfill script to recount `occupants` from the `users` table has not been written.
- **Buildings are currently global** — there is no `Unit` table, and `unit_number` on `users` is still free text. A proper `Unit` model with a `building_id` foreign key would be the natural next step.
- **Building deletion does not reassign occupants.** Users pointing at a deleted building will end up with a dangling id. A cascade or reassignment step should be considered.
- The `Elms Sans` fallback warning still appears under the Turbopack builder — its native font loader ignores `adjustFontFallback`. The webpack build is clean.

---

## How to run

```powershell
# 1. Database
Set-Location server
npm install
npx prisma db push
npx prisma generate

# 2. API (http://localhost:5000)
npm run dev

# 3. Client (http://localhost:3000)
Set-Location ..\client
npm install
npm run dev
```

`client/.env` must point at the API:

```dotenv
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```
