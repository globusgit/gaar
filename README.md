# GAAR — GlobusIT Accounts and Audit Reporting

**GAAR** is a multi-tenant ERP-style web application for managing tenders, work orders, payments, receivables, employees, clients, and fund requests. It is built for Indian organizations with role-based access control (RBAC) and supports multiple tenants (organizations) within a single deployment.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Server Actions, Route Handlers) |
| **Language** | TypeScript |
| **UI Library** | shadcn/ui (New York style) + Radix UI primitives |
| **Styling** | Tailwind CSS v4 + `tw-animate-css` |
| **Authentication** | NextAuth v5 beta (Credentials provider, JWT sessions) |
| **Database** | MongoDB (via Mongoose v9) |
| **State Management** | React Context (SessionProvider) + TanStack React Query v5 |
| **Forms** | React Hook Form v7 + Zod v4 |
| **Icons** | Lucide React |
| **Notifications** | Sonner |
| **Date Handling** | date-fns v4 |
| **Excel Export** | xlsx (SheetJS) |
| **Validation** | Zod v4 |
| **Linting** | ESLint v9 (flat config) |

## Prerequisites

- Node.js 18+
- MongoDB 6+
- npm or pnpm

## Environment Variables

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/gaar
AUTH_SECRET=your-secret-key-here
NEXTAUTH_SECRET=your-secret-key-here
DEFAULT_SYSADMIN_PASSWORD=YourSecurePassword123
DEFAULT_EMP_PASSWORD=ChangeMe@123
UPLOAD_DIR=./public/uploads
API_BASE_URL=http://localhost:3000
```

> **Security Note:** Never commit `.env` to version control. Use strong, randomly generated secrets for `AUTH_SECRET` and `NEXTAUTH_SECRET`.

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build

```bash
npm run build
npm start
```

## Linting

```bash
npm run lint
```

## Project Structure

```
/var/snap/gaar/
├── app/
│   ├── (root)/                  # Public routes (login)
│   │   └── page.tsx
│   ├── (main)/                  # Authenticated app routes
│   │   ├── layout.tsx           # SideNav + NavBar layout
│   │   ├── dashboard/
│   │   ├── clients/
│   │   ├── employees/
│   │   ├── fund-request/
│   │   ├── organizations/
│   │   ├── payments/
│   │   ├── receivables/
│   │   ├── settings/
│   │   ├── tenders/
│   │   ├── users/
│   │   └── work-orders/
│   ├── _components/             # Shared layout & feature components
│   ├── api/                     # Next.js Route Handlers (REST API)
│   ├── Providers.tsx             # SessionProvider + QueryClientProvider
│   └── layout.tsx                # Root layout
├── components/ui/               # shadcn/ui components
├── lib/                         # Utilities & config
│   ├── mongoose.js              # MongoDB connection (singleton)
│   ├── auth.ts                  # NextAuth configuration
│   ├── validation.ts            # Zod validation helpers
│   └── utils.ts                 # Helper functions
├── models/                      # Mongoose schemas
├── types/                       # TypeScript type declarations
├── proxy.ts                     # Next.js Middleware (route protection)
└── public/                      # Static assets
```

## Modules

### 1. Authentication & Authorization

- **Location:** `app/api/auth/`, `lib/auth.ts`, `proxy.ts`
- **Provider:** NextAuth v5 beta with Credentials provider
- **Session Strategy:** JWT
- **Roles:** SYS_ADMIN, ADMIN, ACCOUNTS, ORG_USER, USER
- **Password Hashing:** bcryptjs
- **Route Protection:** Middleware-based with role restrictions

### 2. Organization Management

- **Location:** `app/api/organization/`, `app/(main)/organizations/`
- **Access:** SYS_ADMIN only
- **Features:** CRUD for tenant organizations, auto-generated `orgId`, user creation on registration

### 3. User Management

- **Location:** `app/api/user/`, `app/(main)/users/`
- **Features:** CRUD, search, role assignment, org-specific users
- **Default Password:** Configurable via `DEFAULT_EMP_PASSWORD` env var

### 4. Employee Management

- **Location:** `app/api/employee/`, `app/(main)/employees/`
- **Features:** CRUD, photo upload, search, export to Excel, manager hierarchy
- **Auto-creation:** Creates a corresponding User account on employee creation

### 5. Client Management

- **Location:** `app/api/client/`, `app/(main)/clients/`
- **Features:** CRUD, search, auto-generated `clientId`, GST/state tracking

### 6. Tender Management

- **Location:** `app/api/tender/`, `app/(main)/tenders/`
- **Features:** Full CRUD, document upload, status workflow, search, pagination, Excel export
- **Statuses:** Draft, Live, Won, Lost, Disqualified, Cancelled
- **Payments:** EMD, BG, Document Fee, Corpus Fund, Transaction Fee tracking

### 7. Work Order Management

- **Location:** `app/api/work-order/`, `app/(main)/work-orders/`
- **Features:** CRUD, dashboard statistics, BG tracking, link to parent tender

### 8. Payment Management

- **Location:** `app/api/payment/`, `app/(main)/payments/`
- **Features:** CRUD, export to Excel, search, approval/auth workflow tracking

### 9. Receivable Management

- **Location:** `app/api/receivable/`, `app/(main)/receivables/`
- **Features:** CRUD, dashboard with status filters, payment tracking

### 10. Fund Request Management

- **Location:** `app/api/fund-request/`, `app/(main)/fund-request/`
- **Features:** CRUD, filtered queries, export, approval/auth workflow, auto-generated `frNo`

### 11. Transaction Management

- **Location:** `app/api/transaction/`
- **Features:** General financial transaction recording

### 12. Country/Location Data

- **Location:** `app/api/country-info/`
- **Features:** Hierarchical location data (Country → State → District → Mandal)

### 13. System List (Master Data)

- **Location:** `app/api/system-list/`
- **Features:** Dynamic dropdown values (tender status, positions, verticals, designations)

### 14. Notes

- **Location:** `app/api/note/`, `app/_components/Notes.tsx`
- **Features:** Polymorphic notes linked to any entity

### 15. File Upload

- **Location:** `app/api/files/[...path]/`
- **Features:** Secure file serving, upload directory management

### 16. Configuration

- **Location:** `app/api/config/`, `models/Config.ts`
- **Features:** Key-value configuration per organization

## Database Models

| Model | Purpose |
|-------|---------|
| **User** | Authentication — username, password (bcrypt), role, orgId |
| **Employee** | Employee master — name, empId, phone, email, designation, orgId |
| **Organization** | Tenant/org master — orgName, orgId, contact info, address |
| **Client** | Client/customer master — name, clientId, website, GST, state, orgId |
| **TenderInfo** | Tender/bidding documents — tenderNo, dates, EMD, BG, fees, status |
| **WorkOrder** | Work orders — woNo, dates, value, BG, status, orgId |
| **PaymentInfo** | Payment records — type, amount, approval/auth workflow, orgId |
| **ReceivableInfo** | Receivables — amount, paymentFrom, dueDate, status, orgId |
| **FundRequest** | Fund requests — frNo, amount, approval/auth workflow, orgId |
| **TransactionInfo** | General transactions — amount, date, type, paidTo, orgId |
| **ActivityLog** | Audit trail — date, activity, description, entity, entityId, orgId |
| **Config** | Key-value configuration per org |
| **Note** | Notes/remarks linked to any entity |
| **CountryInfo** | Hierarchical location data |
| **SystemList** | Dropdown/list master data |

## Role-Based Access Control

| Role | Access |
|------|--------|
| **SYS_ADMIN** | Full system access, organization management |
| **ADMIN** | Dashboard, all modules except organization management |
| **ACCOUNTS** | Dashboard, payments, receivables, fund requests |
| **ORG_USER** | Dashboard, fund requests, users, settings |
| **USER** | Dashboard, fund requests |

## API Design Principles

- All route handlers follow: `connectDB → process → NextResponse.json()`
- Server-side pagination with consistent response format:
  ```json
  {
    "data": [],
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
  ```
- All data models include `orgId` for multi-tenant isolation
- Request validation via Zod schemas (see `lib/validation.ts`)

## UI/UX Guidelines

- **Design System:** shadcn/ui with New York style
- **Color Theme:** Cyan-based (`cyan-900`, `cyan-600`, `cyan-200`)
- **Typography:** System fonts via Tailwind
- **Icons:** Lucide React
- **Notifications:** Sonner toasts
- **Responsive:** Mobile-first with breakpoints at `md`, `lg`, `xl`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` to ensure code quality
5. Submit a pull request

## License

Private — All rights reserved.
