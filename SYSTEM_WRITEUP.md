# Site Access Management System — Full System Writeup

---

## 1. Overview

The **Site Access Management System (SAMS)** is a web-based security platform built for FCL to manage and audit all physical access to company sites. It replaces manual visitor logbooks and paper-based vehicle registers with a structured, role-controlled digital system that logs every person and vehicle entering or leaving a site.

The system handles:

- Visitor registration, pre-approval, check-in, and check-out
- Email-based approval workflow with one-click approve/reject links
- QR code generation for approved visitors (currently internal only; visitor delivery is planned for a future rollout)
- Company vehicle registry and movement logging with driver verification
- External (non-company) vehicle tracking
- Multi-site support with per-session site context
- Role-based access for Admins, Security Guards, Receptionists, and Logistics Managers
- Operational reports (visitor, vehicle, security, user activity)
- Email notifications to host employees — with PA/delegate email support

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 18 |
| Language | TypeScript 5.3 |
| Web Framework | Express 4 |
| Templating | EJS + express-ejs-layouts |
| Database | Microsoft SQL Server (MSSQL) |
| ORM | TypeORM 0.3 |
| Authentication | JWT (jsonwebtoken) — access token + refresh token |
| Password Hashing | bcryptjs (12 rounds default) |
| Email | Nodemailer (SMTP/Gmail) |
| Real-time | Socket.IO 4 |
| Logging | Winston (file + console) |
| Security | Helmet, CORS, express-validator, Joi, rate limiting |
| File Handling | Multer (uploads), Sharp (image), XLSX (Excel import/export) |
| QR Codes | qrcode |
| PDF Export | jsPDF + jspdf-autotable |
| Charts | Chart.js |
| UI Components | Bootstrap 5, Choices.js |
| API Docs | Swagger (swagger-jsdoc + swagger-ui-express) |
| Process Manager | IIS (Windows) via web.config reverse proxy |

---

## 3. Architecture

```
Browser
  │
  └─► Express Server (src/server.ts)
        │
        ├─── Middleware Stack
        │      ├─ Helmet (security headers)
        │      ├─ CORS
        │      ├─ Morgan (HTTP logging)
        │      ├─ Rate limiter
        │      ├─ JWT authenticate()
        │      ├─ authorize(...roles)
        │      └─ Joi/express-validator validation
        │
        ├─── API Routes (/api/...)
        │      ├─ /auth
        │      ├─ /visitors
        │      ├─ /employees
        │      ├─ /vehicles
        │      ├─ /vehicle-movements
        │      ├─ /external-vehicle-movements
        │      ├─ /drivers
        │      └─ /reports
        │
        ├─── View Routes (EJS pages)
        │      ├─ /login
        │      ├─ /dashboard
        │      ├─ /visitors
        │      ├─ /employees
        │      ├─ /vehicles
        │      ├─ /movements
        │      ├─ /drivers
        │      ├─ /reports
        │      ├─ /users
        │      └─ /settings
        │
        └─── Services
               ├─ EmailService (Nodemailer)
               └─ AuthService (JWT helpers)
```

The server is a monolithic Express application. EJS views are server-rendered on first load; all subsequent data operations use REST API calls from client-side JavaScript (no SPA framework). Socket.IO is available for real-time push events.

---

## 4. Database Schema

The database is a Microsoft SQL Server instance (`site_access`). All tables are managed through TypeORM migrations.

### Core Tables

#### `users`
System accounts who operate the application.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| firstName / lastName | varchar(50) | |
| email | varchar(100) | Unique |
| phone | varchar(20) | |
| role | enum | admin, security_guard, receptionist, logistics_manager, visitor |
| status | enum | active, inactive, suspended |
| password | varchar | bcrypt hash, excluded from default selects |
| employeeId | varchar(50) | Optional link to employees table |
| department | varchar(100) | |
| profileImage | varchar | File path |
| loginAttempts | int | Account lockout counter |
| lockUntil | datetime | Temporary lock expiry |
| lastLogin / lastActivity | datetime | |
| requirePasswordChange | boolean | Forces reset on next login |

#### `visitors`
All visitor access records, from registration through check-out.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| firstName / lastName | varchar(50) | |
| email | varchar(100) | Optional |
| phone | varchar(20) | |
| idNumber | varchar(50) | National ID or passport, indexed |
| visitorCardNumber | varchar(50) | Physical badge number |
| visitorFromLocation | varchar(100) | Where visitor is coming from |
| site | varchar(100) | Site where visit is to occur |
| company | varchar(100) | Visitor's employer |
| vehicleNumber | varchar(20) | Personal vehicle if any |
| photo | varchar | Uploaded photo path |
| qrCode | varchar | Generated upon approval |
| hostEmployee | varchar(100) | Name of employee being visited |
| hostDepartment | varchar(100) | |
| visitPurpose | enum | Business, Delivery, Interview, Official Visit, Personal, Tallow/Offals, etc. |
| expectedDate / Time | date / varchar | Scheduled visit time |
| actualCheckIn / CheckOut | datetime | Gate timestamps |
| receptionConfirmedAt | datetime | Reception sign-in timestamp |
| receptionConfirmedById | varchar | User who confirmed |
| status | enum | pending, approved, rejected, checked_in, checked_out |
| approvedById | varchar | FK: user who approved |
| rejectionReason | varchar(500) | |
| notes | varchar(500) | |

#### `employees`
The internal employee directory, used for host selection and approval routing.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| employeeId | varchar(20) | Auto-generated (EMP-0001 format), unique |
| firstName / lastName | varchar(50) | |
| email | varchar(100) | Unique, primary contact |
| phone | varchar(20) | |
| department | varchar(100) | |
| position | varchar(100) | |
| **preferredNotifyEmail** | varchar(100) | **Nullable.** If set, approval & check-in emails are sent here instead of `email`. Used for executive PA delegation. |
| isActive | boolean | Soft-disable without deletion |

#### `vehicles`
The company fleet registry.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| licensePlate | varchar(20) | Unique |
| make / model / year / color | varchar / int | |
| type | enum | car, truck, van, motorcycle, bus, other |
| status | enum | active, inactive, maintenance, retired |
| department | varchar(100) | Owning department |
| assignedDriver | varchar(100) | Default driver name |
| currentMileage | decimal(10,2) | Latest odometer reading |
| notes | text | |

#### `vehicle_movements`
Entry and exit records for company vehicles.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| vehicleId | uuid | FK: vehicles |
| area | varchar(100) | Gate/zone |
| movementType | enum | entry, exit |
| status | enum | pending, completed, cancelled |
| mileage | decimal(10,2) | Odometer at time of movement |
| driverName / Phone / License | varchar | |
| purpose | text | |
| destination | nvarchar(100) | For exits |
| recordedById | uuid | FK: users |
| recordedAt | datetime | |

#### `external_vehicle_movements`
Entry and exit records for non-company/visitor vehicles.

| Column | Type | Notes |
|---|---|---|
| vehiclePlate | nvarchar(50) | |
| area | nvarchar(100) | |
| movementType | nvarchar(20) | entry/exit |
| driverName | nvarchar(100) | |
| notes | nvarchar(1000) | |
| destination | nvarchar(100) | |
| recordedById | uuid | FK: users |

#### `drivers`
Registered drivers authorised to move company vehicles.

| Column | Type | Notes |
|---|---|---|
| name | varchar(100) | |
| status | enum | active, inactive |
| passCode | varchar(4) | 4-digit verification code, shown at gate |

#### `access_logs`
Immutable audit trail of all gate events.

| Column | Type | Notes |
|---|---|---|
| visitorId | uuid | FK: visitors |
| employeeId | uuid | FK: users |
| guardId | uuid | FK: users (who recorded) |
| action | enum | AccessAction |
| location | varchar(100) | Gate/zone |
| timestamp | datetime | |
| ipAddress / userAgent | varchar | Client info |

#### `alerts`
System-generated notifications and anomaly flags.

| Column | Type | Notes |
|---|---|---|
| type | enum | AlertType |
| severity | enum | AlertSeverity |
| title / message | varchar | |
| userId | uuid | Related user |
| isRead / actionRequired | boolean | |
| metadata | text | JSON string with context |

#### `company_settings`
Single-row global configuration.

| Column | Notes |
|---|---|
| companyName / address / phone / email / logo | Company branding |
| workingHours | JSON `{start, end}` |
| maxVisitorDuration | Minutes (default 480 = 8 hours) |
| requirePreApproval | Approval gate enabled |
| allowMultipleEntries | Repeat same-day entry |
| enableQRCode | QR code feature flag |
| enableEmailNotifications | Email feature flag |
| emergencyContact | Phone number |

---

## 5. User Roles & Permissions

| Role | Capabilities |
|---|---|
| **Admin** | Full access: manage users, employees, vehicles, settings, view all reports |
| **Security Guard** | Record vehicle movements (with driver passCode), check-in/out visitors, view visitor list |
| **Receptionist** | Register visitors, confirm reception, view visitors; reports are data-masked (sensitive fields hidden) |
| **Logistics Manager** | Record vehicle movements, view vehicle history |
| **Visitor** | System account type for visitor portal (limited scope) |

Role enforcement is applied at both the route middleware level (`authorize(...roles)`) and within individual controller methods where finer control is needed.

---

## 6. Authentication & Session Flow

1. **Login** — User submits email + password. The server verifies credentials against the `users` table (bcrypt comparison). On success, an **access token** (15-minute JWT) and a **refresh token** (7-day JWT) are issued.

2. **Site Selection** — After login, the user chooses their active site from a list of allowed sites. The selected site is encoded into a new token (`activeSite` claim). All subsequent API calls carry this context.

3. **Token Refresh** — When the access token expires, the client automatically exchanges the refresh token for a new pair. This happens transparently in `app.js`.

4. **Idle Logout** — The client detects inactivity (configurable, default 15 minutes) and redirects to login. `lastActivity` is updated server-side on each authenticated request.

5. **Account Lockout** — After 5 consecutive failed logins, the account is locked for 30 minutes (`lockUntil`). Admins can unlock accounts manually.

6. **Password Policy** — Passwords must contain at least 8 characters, one uppercase, one lowercase, one digit, and one special character. Users flagged with `requirePasswordChange = true` are forced to change on next login.

---

## 7. Visitor Workflow

```
Receptionist/Guard registers visitor
          │
          ▼
    Visitor record created (status: PENDING)
          │
          ▼
    Approval email sent to host employee
    (or their PA if preferredNotifyEmail is set)
          │
    ┌─────┴─────┐
    │           │
 APPROVE      REJECT
    │           │
    ▼           ▼
QR Code generated (stored internally;
not sent to visitor yet)  Rejection reason stored
                           Visitor notification email not sent yet
                           (planned for future rollout)
    │
    ▼
Visitor arrives at gate
Guard searches by name/ID (QR scan flow planned)
    │
    ▼
CHECK-IN recorded (actualCheckIn timestamp)
Host employee notified by email
Reception confirms (receptionConfirmedAt)
    │
    ▼
Visit occurs
    │
    ▼
Guard records CHECK-OUT (actualCheckOut timestamp)
Visit duration calculated
```

- **Email Approval Links** — The approval email contains two one-click links (approve/reject). These links include a SHA-256 token derived from the employee's ID and email. No login is required to use them. The token is time-independent so links don't expire unless the employee's record changes.
- **PA Email Delegation** — If an employee has a `preferredNotifyEmail` set, all approval and check-in notifications go to that address instead of the employee's own email. The email includes a visible banner identifying which employee the notification is on behalf of.
- **Repeat Visitors** — The visitor registration form supports pre-filling details by looking up a return visitor's ID number, reducing data entry for frequent visitors.
- **QR Code Generation** *(Implemented — Pending Rollout)* — The system generates a unique QR code for each approved visitor and stores it in the database. At present, this QR code is **not sent to visitors** and is not part of the active gate process. The intended future workflow is to email the QR code to visitors upon approval so they can present it at the gate for scan-based verification. This can be enabled once visitor email capture is introduced at registration.

---

## 8. Vehicle Movement Workflow

### Company Vehicles

1. Guard selects a vehicle from the registered fleet.
2. Selects movement type: **Entry** or **Exit**.
3. Enters destination (for exits), mileage, and purpose.
4. Verifies the driver by entering their 4-digit **passCode**.
5. If the passCode matches an active driver, the movement is recorded under `vehicle_movements`.

### External Vehicles

For vehicles not in the fleet (supplier trucks, visitor cars, etc.):

1. Guard selects External Vehicle.
2. Enters the license plate, driver name, area, movement type, and optional destination/notes.
3. Recorded under `external_vehicle_movements`.

Both company and external movements are displayed in a unified view on the Movements page with filtering by area, type, and date range.

---

## 9. Multi-Site Support

The system supports multiple physical locations:

- South Site
- Northsite
- Choice Meats
- Kasarani
- Uplands
- Kinangop
- Eldoret
- Main Gate
- Reception
- Others

On login, users select their active site. The selected site is embedded in the JWT (`activeSite` claim) and remains bound to the session. Visitor records store the `site` field to associate visits with the correct location. Reports can be filtered by site.

---

## 10. Reporting

Reports are accessible from the Reports page and cover four areas:

| Report | Content |
|---|---|
| **Visitor Reports** | Daily/weekly/monthly visitor counts, purpose breakdown, approval rates, duration averages |
| **Vehicle Movement Reports** | Entry/exit counts per vehicle, area usage, driver activity |
| **Access Log Reports** | Security audit trail: gate events, guard actions, timestamps |
| **User Activity Reports** | Login history, last activity per user, action counts |
| **Security Reports** | Failed login attempts, anomalies, unresolved alerts |

**Data Masking** — Receptionists see visitor reports with sensitive fields (ID number, phone, card number) redacted. Admins and Guards see full data.

**Export Options** — All reports can be exported as:
- PDF (jsPDF with autotable formatting)
- Excel (XLSX workbook)
- Print (browser print dialog)

Charts (Chart.js) visualise trends inline on the Reports page.

---

## 11. Email Notifications

Three types of automated emails are sent:

| Email | Trigger | Recipient |
|---|---|---|
| **Visitor Approval Request** | New visitor registered | Host employee (or `preferredNotifyEmail`) |
| **Visit Status Update** *(Planned — Not Active)* | Visitor approved or rejected | Visitor (if email provided; not currently sent) |
| **Check-In Notification** | Visitor checks in at gate | Host employee (or `preferredNotifyEmail`) |

All emails are HTML-formatted. If an employee has a `preferredNotifyEmail` configured, a yellow information banner is included in the email body stating that it was sent on behalf of the named employee, so PAs understand the context.

SMTP is configured via environment variables and supports Gmail as well as custom SMTP servers. TLS is required; self-signed certificates are permitted.

---

## 12. Security Measures

| Measure | Implementation |
|---|---|
| Security headers | Helmet (CSP, HSTS, X-Frame-Options, etc.) |
| CORS | Configured per environment |
| Rate limiting | 100 requests / 15 minutes per IP (configurable) |
| Password hashing | bcryptjs, 12 rounds |
| JWT access token | 15-minute expiry, RS256-equivalent secret |
| Refresh token | 7-day expiry, separate secret |
| Account lockout | 5 failed attempts → 30-minute lock |
| Input validation | Joi schemas on API inputs + express-validator |
| SQL injection | Prevented via TypeORM parameterised queries |
| File upload | Multer with type/size restrictions (5 MB default) |
| Error handling | Global error middleware — no stack traces exposed in production |
| Audit trail | `access_logs` table records every gate action with IP and user agent |

---

## 13. File & Directory Structure

```
site-access-management-system/
├── src/
│   ├── server.ts              # Express app bootstrap
│   ├── loadEnv.ts             # Environment loader
│   ├── config/                # DB, logger, JWT, site config
│   ├── controllers/           # Route handler logic
│   ├── entities/              # TypeORM entity definitions
│   ├── middleware/            # Auth, error handling, validation
│   ├── migrations/            # Database schema history
│   ├── routes/                # Route declarations
│   ├── scripts/               # Utility scripts (seed, migrate)
│   ├── seeders/               # Initial data population
│   ├── services/              # Email, auth business logic
│   ├── types/                 # TypeScript type declarations
│   ├── utils/                 # Shared utility functions
│   └── views/                 # EJS templates
├── public/
│   ├── css/                   # Bootstrap + custom styles
│   ├── js/                    # Client-side feature scripts
│   └── vendor/                # Vendored libraries (synced from node_modules)
├── logs/                      # Winston log output
├── deploy/                    # Windows service setup scripts, IIS web.config
├── dist/                      # Compiled JavaScript output (generated)
├── uploads/                   # User-uploaded files (photos, logos)
├── package.json
└── tsconfig.json
```

---

## 14. Deployment

The system is deployed on a Windows Server using **IIS as a reverse proxy** in front of Node.js (running on port 3027 internally).

### Production setup steps

```bat
npm ci                      # Clean install dependencies
copy .env.example .env      # Configure environment
npm run build:prod          # Compile TypeScript
npm run migration:run:prod  # Run pending DB migrations
```

The `deploy/windows-setup.bat` and `deploy/service-setup.bat` scripts automate Node.js Windows service registration.

### Environment Variables (`.env`)

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `PORT` | HTTP listen port (default 3000; production 3027) |
| `DB_HOST / PORT / USERNAME / PASSWORD / DATABASE` | SQL Server connection |
| `JWT_SECRET / REFRESH_TOKEN_SECRET` | Token signing keys |
| `JWT_EXPIRE / REFRESH_TOKEN_EXPIRE` | Token lifetimes |
| `EMAIL_HOST / PORT / USER / PASS` | SMTP configuration |
| `MAX_LOGIN_ATTEMPTS / LOCK_TIME` | Security policy |
| `IDLE_TIMEOUT_MINUTES` | Session idle timeout |
| `RATE_LIMIT_WINDOW / RATE_LIMIT_MAX` | API rate limiting |
| `BCRYPT_ROUNDS` | Password hashing strength |
| `MAX_FILE_SIZE` | Upload limit in bytes |

---

## 15. API Summary

All API routes are prefixed with `/api`. Authentication is required on all routes except `POST /api/auth/login` and `GET /api/visitors/approve-email`.

| Module | Endpoints |
|---|---|
| **Auth** | Login, register, refresh token, profile (get/update), change password, site select |
| **Visitors** | CRUD, approve, reject, check-in, check-out, email approval handler, lookup, dashboard stats |
| **Employees** | List, create, update, bulk upload |
| **Vehicles** | CRUD, active list, stats |
| **Vehicle Movements** | List, stats, get by ID, record movement |
| **External Movements** | Record external vehicle movement |
| **Drivers** | List, create, update, bulk upload |
| **Reports** | Visitor, vehicle, access log, user activity, security reports |

Swagger documentation is available at `/api-docs` when running in development.

---

## 16. Schema Migration History

| # | Migration | Change |
|---|---|---|
| 1 | InitialSchema | Core tables: users, visitors, employees |
| 2 | RemoveVisitorIdUniqueConstraint | Allow repeat visitor IDs |
| 3 | CreateEmployeesTable | Employee table |
| 4 | CreateVehicleManagementTables | Vehicles and movements |
| 5 | AddRequirePasswordChangeColumn | Force password reset flag |
| 6 | AddVisitorCardNumberColumn | Physical badge tracking |
| 7 | UpdateVisitPurposeEnum | Expanded purpose list |
| 8 | AddVehicleDestinationColumn | Destination on vehicle record |
| 9 | ExtendVisitPurposeEnum | Additional purpose types |
| 10 | MoveDestinationToVehicleMovements | Move destination to movements |
| 11 | AddLastActivityToUsers | Session activity tracking |
| 12 | AddVisitorFromLocation | Origin location on visitors |
| 13 | CreateExternalVehicleMovements | Non-company vehicle tracking |
| 14 | AddNotesToExternalVehicleMovements | Notes field |
| 15 | AddReceptionConfirmationToVisitors | Reception sign-in fields |
| 16 | ExtendVisitPurposeWithPersonal | "Personal" purpose type |
| 17 | CreateDriversTable | Drivers with 4-digit passCode |
| 18 | RelaxUserEmployeeIdConstraint | Optional employeeId on users |
| 19 | AddPreferredNotifyEmailToEmployees | PA/delegate notification email |
| 20 | ExtendVisitPurposeWithOfficialVisit | "Official Visit" type |
| 21 | ExtendVisitPurposeWithTallowOffals | Specialised purpose type |
| 22 | AddSiteToVisitors | Multi-site visitor records |
| 23 | FixBrokenQRCodes | QR code format repair |
