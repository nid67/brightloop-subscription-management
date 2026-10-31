# Brightloop Software – Subscription & Revenue Operations Platform

Brightloop Software is an intelligent subscription management and revenue operations platform built for the Odoo Hackathon. It provides businesses with a centralized system to manage recurring contracts, product variants, automated billing, dual-GST tax compliance, and real-time revenue leakage detection.

---

## Features

- **Executive Command Center**: 7 real-time financial KPI cards (MRR, ARR, Active Subscriptions, Total Customers, Revenue Collected, Outstanding Revenue, Overdue Invoices) and collection trend charts.
- **Product Catalog & Variant Pricing**: Configure base recurring products with dynamic variant pricing rules (e.g. Base Platform ₹2,000 + Brand Odoo ₹560 = Final Price ₹2,560).
- **Subscription Lifecycle Management**: Full contract state machine: `Draft → Quotation → Confirmed → Active → Closed`, with support for pause and automated renewal policies.
- **Plan Management**: Multi-frequency cadence orchestration across Daily, Weekly, Monthly, and Yearly intervals with early closure and auto-close flags.
- **Commercial Quotations**: Proposal builder with customizable templates and one-click conversion into active subscriptions.
- **Dual-GST Tax & Invoicing**: Automated CGST (9%) + SGST (9%) calculations, HSN/SAC code tracking, duplicate invoice prevention locks, and printable tax invoice sheets.
- **Payment Reconciliation**: Recording customer payments via UPI, Cards, NetBanking, and NEFT/RTGS with reconciliation status tracking.
- **Revenue Leakage Sentinel**: Signature operational anomaly detector that surfaces unbilled active subscriptions, expired discounts still in use, and overdue dunning cycles.
- **Financial Analytics**: MRR/ARR cohorts, retention metrics (NRR, churn rate), and time-range filters (7d, 30d, 90d, YTD).
- **Customer Self-Service Portal**: Dedicated interface for customers to view active subscriptions, download tax invoices, and request pauses or cancellations.
- **Role-Based Access**: Role-aware navigation supporting `ADMIN`, `STAFF`, and `CUSTOMER` personas with instant testing switchers.

---

## Tech Stack

- **Core**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Build Tool**: Vite 8
- **Icons**: Lucide Icons
- **Visualizations**: Chart.js 4
- **Styling**: Custom enterprise design system inspired by Stripe Dashboard

---

## Getting Started

### Prerequisites

Ensure you have Node.js (v18+) and npm installed.

### Installation

```bash
git clone https://github.com/nid67/brightloop-subscription-management.git
cd brightloop-subscription-management
npm install
```

### Development Server

Start the local development server:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:3000/`.

### Production Build

Compile and bundle for production:

```bash
npm run build
```

---

## Project Structure

```
src/
├── main.js                   # Application bootstrap
├── config.js                 # Workspace configuration & company metadata
├── router/
│   └── router.js             # Client-side SPA hash router
├── styles/
│   ├── theme.css             # Design tokens & color palette
│   ├── layout.css            # Persistent app shell, sidebar, and header
│   └── components.css        # Buttons, tables, cards, badges, modals, drawers
├── components/
│   ├── sidebar.js            # Collapsible navigation matching all modules
│   ├── header.js             # Topbar, breadcrumbs, currency & role switchers
│   ├── modal.js              # Reusable modal utility
│   └── drawer.js             # Slide-over inspector drawer utility
├── services/
│   ├── api.js                # Clean API client stubs with localStorage persistence
│   └── notification.js       # Toast notifications
├── utils/
│   ├── currency.js           # Multi-currency formatting (₹ INR, $ USD, € EUR)
│   ├── date.js               # Date helpers
│   ├── export.js             # CSV export & print triggers
│   └── icons.js              # Lucide icons helper
└── views/
    ├── auth.js               # Split-screen Login, Register, Forgot Password
    ├── dashboard.js          # Command Center: 7 KPIs, charts, leakage alerts
    ├── customers.js          # Customer directory, search, Add modal, Profile drawer
    ├── products.js           # Products & Variant Pricing (Base ₹2,000 + Odoo ₹560 = ₹2,560)
    ├── plans.js              # Daily, Weekly, Monthly, Yearly cadences & policy rules
    ├── subscriptions.js      # Contract lifecycle: Draft → Quotation → Confirmed → Active → Closed
    ├── quotations.js         # Commercial proposals, templates, 1-click sub conversion
    ├── invoices.js           # Dual-GST invoicing, duplicate prevention lock, printable PDF
    ├── payments.js           # Recording payments (UPI, Bank, Card) & reconciliation
    ├── discounts.js          # Percentage & fixed promotions, usage limits, horizons
    ├── taxes.js              # Tax rules (GST 18%, Zero-rated, VAT) & backend calculation notice
    ├── leakage.js            # Revenue Leakage Sentinel (unbilled cycles, duplicate checks, dunning)
    ├── analytics.js          # MRR, ARR, NRR, churn rate, Chart.js trends, date filters
    ├── aiAssistant.js        # Subscription Health scores & AI financial reasoning
    ├── staff.js              # Staff management & role assignment (ADMIN, STAFF)
    ├── portal.js             # Customer self-service portal (own subscriptions, invoices, pause/cancel)
    └── settings.js           # Organization profile, currency defaults, invoice prefix schemes
```

---

## Connecting Backend Endpoints

Each method in `src/services/api.js` is structured as a clean client stub. To connect your backend REST or GraphQL endpoints, update the corresponding function:

```javascript
// Example in src/services/api.js
getCustomers(query = {}) {
  // Replace with:
  // const res = await fetch('/api/v1/customers');
  // return await res.json();
  let list = [...this.data.customers];
  return list;
}
```
