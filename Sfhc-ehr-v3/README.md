# Sahel Family Health Clinic Electronic Health Record (SFHC EHR)

A comprehensive Electronic Health Record (EHR) system for the Sahel Family Health Clinic, built with React, TypeScript, Vite, and Tailwind CSS.

## Completed Milestones

- **Milestone 1 — Foundation**: Authentication, app shell, sidebar navigation, dashboard, design system
- **Milestone 2 — Patient Management**: Patient records, demographics, search, detail view with tabs
- **Milestone 3 — Appointment Management**: Scheduling, calendar, status tracking, patient linking
- **Milestone 4 — Clinical Documentation**: SOAP notes, vitals, diagnoses, clinical encounters
- **Milestone 5 — Laboratory Information System**: Lab orders, test tracking, results, status workflow
- **Milestone 6 — Pharmacy Management**: Prescriptions, dispensing, inventory, purchase orders, stock alerts, controlled drugs, medication history, medication catalogue
- **Milestone 7 — Billing & Revenue Cycle Management**: Invoices, payments, insurance/HMO, claims, revenue reports, pricing catalogue, patient billing tab
- **Milestone 8 — Inventory & Procurement**: General inventory, suppliers, purchase orders, stock movements, asset tracking, adjustments, transfers
- **Milestone 9 — Administration & HR**: Staff management, departments, roles, users, attendance, leave, scheduling, audit logs, system settings
- **Milestone 10 — Patient Portal & Telemedicine**: Patient portal, telemedicine sessions, secure messaging, appointment reminders
- **Milestone 11 — Reporting, Analytics & System Polish**: Executive dashboard, comprehensive reports, global search, notification center, holiday calendar, business hours

## Tech Stack

- **React 18** with TypeScript
- **Vite 5** as the build tool
- **Tailwind CSS 3** for styling
- **Lucide React** for icons
- **Supabase** client (for optional backend persistence)

## Prerequisites

- Node.js 18+ and npm

## Setup Instructions

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables (optional — app runs with in-memory data by default)
cp .env.example .env
# Edit .env with your Supabase project URL and anon key if using Supabase

# 3. Start the development server
npm run dev

# 4. Open the app
# Navigate to the URL shown in the terminal (typically http://localhost:5173)
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build the production bundle |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |

## Demo Accounts

The app ships with seeded demo users. Use any of the following on the login screen:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sfhc.org | admin123 |
| Physician | doctor@sfhc.org | doctor123 |
| Nurse | nurse@sfhc.org | nurse123 |
| Pharmacist | pharmacist@sfhc.org | pharma123 |
| Lab Tech | lab@sfhc.org | lab123 |
| Receptionist | reception@sfhc.org | recep123 |
| Finance | finance@sfhc.org | finance123 |

## Project Structure

```
sfhc-ehr/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Charts.tsx       # SVG-based charts (bar, line, donut, progress)
│   │   ├── ConfirmDialog.tsx
│   │   ├── Login.tsx
│   │   ├── Modal.tsx
│   │   ├── Sidebar.tsx      # Navigation with role-based sections
│   │   └── ui.tsx           # Design system primitives (KpiCard, EmptyState, etc.)
│   ├── lib/
│   │   ├── billing.ts       # Billing calculations, invoice generators, print templates
│   │   ├── billingSeed.ts   # Seed data for billing module
│   │   ├── derived.ts       # Derived/computed state helpers
│   │   ├── format.ts        # Date, currency, and number formatting utilities
│   │   ├── medications.ts   # Medication catalogue data
│   │   ├── seed.ts          # Seed data for Milestones 1–6
│   │   ├── storage.ts       # localStorage persistence layer
│   │   ├── store.tsx        # Global app context & state management
│   │   └── types.ts         # TypeScript type definitions
│   ├── pages/
│   │   ├── Appointments.tsx
│   │   ├── Clinical.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Labs.tsx
│   │   ├── PatientDetail.tsx
│   │   ├── PatientPharmacyTab.tsx
│   │   ├── Patients.tsx
│   │   ├── admin/           # Milestone 9 — Administration pages
│   │   ├── analytics/       # Milestone 11 — Reports & Executive Dashboard
│   │   ├── billing/         # Milestone 7 — Billing pages
│   │   ├── inventory/       # Milestone 8 — Inventory pages
│   │   ├── parts/           # Shared form components
│   │   ├── pharmacy/        # Milestone 6 — Pharmacy pages
│   │   └── portal/          # Milestone 10 — Patient Portal & Telemedicine
│   ├── App.tsx              # Root app with routing
│   ├── main.tsx             # Entry point
│   ├── index.css            # Global styles & Tailwind directives
│   └── vite-env.d.ts
├── index.html
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── .env.example
└── .gitignore
```

## Data Persistence

The app uses `localStorage` for client-side data persistence. All demo data is seeded on first load. The schema version is tracked to handle migrations. Use the "Reset Demo Data" option in the app to restore the original seed data.

## License

This project is for demonstration purposes.
