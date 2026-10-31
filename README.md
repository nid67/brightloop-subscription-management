# Brightloop Software – Subscription & Revenue Operations Platform

Brightloop Software is an intelligent subscription management and revenue operations platform developed for the Odoo Hackathon. The platform provides businesses with a centralized interface to manage recurring subscriptions, dynamic product variants, automated billing, dual-GST tax compliance, and revenue leakage detection.

---

## Features & Modules

- **Executive Revenue Dashboard**: 7 KPI cards (MRR, ARR, Active Subscriptions, Total Customers, Revenue Collected, Outstanding Balance, Overdue Invoices) and collection trend charts.
- **Customer Directory**: Account profiles, GSTIN tracking, subscription histories, and lifecycle records.
- **Product Catalog & Dynamic Variants**: Dynamic pricing rules (`Base Price + Attribute Surcharges`, e.g., Base ₹2,000 + Brand=Odoo ₹560 = Final ₹2,560).
- **Pricing Plans & Schedules**: Multi-cadence subscriptions (Daily, Weekly, Monthly, Yearly) with auto-close and pause rules.
- **Subscription Lifecycle**: Contract states (`Draft → Quotation Sent → Confirmed → Active → Closed`).
- **Commercial Quotations**: Proposal builder and conversion to active subscriptions.
- **Dual-GST Recurring Invoices**: CGST (9%) + SGST (9%) breakdowns, printable tax invoice layout, and duplicate billing prevention via idempotency tokens.
- **Payment Reconciliation**: Recording payments via UPI, NEFT/RTGS, Cards, and NetBanking with invoice matching.
- **Discounts & Promotions**: Percentage and fixed discount rules with expiration and redemption caps.
- **Taxes & GST**: Dual-tax intra-state, interstate IGST, and international export zero-rated configurations.
- **Revenue Leakage Sentinel**: Anomaly detection for unbilled renewals, expired discount overuses, and unlinked receipts.
- **Revenue Analytics**: MRR growth waterfall, ARR forecasts, and Net Revenue Retention (NRR) cohorts.
- **Subscription Health & AI**: Retention risk scoring and natural language financial query interface.
- **Staff & Access Control**: Role-based access controls for Admin, Staff, and Customer personas.
- **Customer Self-Service Portal**: Subscriber-facing portal for invoices, card updates, and pause requests.
- **Settings**: Organization metadata, operating currency, and invoice prefix customization (`BL-INV-`).

---

## Tech Stack

- **Markup & Layout**: HTML5, CSS3 (CSS Grid & Flexbox)
- **Visual Design**: Stripe-inspired enterprise design system
- **Scripting**: Vanilla JavaScript (ES6+ modular)
- **Charts**: Chart.js
- **Icons**: Lucide Icons
- **Tooling**: Vite

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/nid67/brightloop-subscription-management.git
cd brightloop-subscription-management

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build

```bash
npm run build
```

---

## Project Structure

```
├── index.html              # Main application shell, views, modals & component placeholders
├── src/
│   ├── styles/
│   │   └── styles.css      # Stripe-inspired design tokens, typography, and component styling
│   └── main.js             # View navigation, modals/drawers, and Chart.js initialization
├── package.json
└── vite.config.js
```
