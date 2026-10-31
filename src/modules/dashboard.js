/**
 * Module 06 — Dashboard Enhancement
 * Adds: date filters, operational overview tables, leakage alert preview,
 * export-to-CSV, and additional mini-charts to the existing dashboard view.
 * NOTE: The base KPI cards and main revenue chart are rendered in index.html
 * and initialized in main.js — this module ADDS new sections to the dashboard.
 */

import { createIcons, icons } from 'lucide';
import Chart from 'chart.js/auto';

// ── Demo Data ─────────────────────────────────────────────────────────────────
const DEMO_DATA = {
  '7d': {
    mrr: 245000, arr: 2940000, activeSubs: 128, customers: 94,
    collected: 210500, outstanding: 34500, overdueCount: 3, overdueAmt: 14200,
    mrrChange: 12.4, arrChange: 14.2, subsChange: 8, custChange: 5,
    collectionRate: 86
  },
  '30d': {
    mrr: 238000, arr: 2856000, activeSubs: 122, customers: 90,
    collected: 198000, outstanding: 40000, overdueCount: 5, overdueAmt: 18600,
    mrrChange: 9.1, arrChange: 10.8, subsChange: 6, custChange: 3,
    collectionRate: 83
  },
  '90d': {
    mrr: 220000, arr: 2640000, activeSubs: 115, customers: 84,
    collected: 185000, outstanding: 35000, overdueCount: 4, overdueAmt: 12800,
    mrrChange: 6.3, arrChange: 7.9, subsChange: 11, custChange: 7,
    collectionRate: 81
  },
  'yr': {
    mrr: 195000, arr: 2340000, activeSubs: 104, customers: 76,
    collected: 165000, outstanding: 30000, overdueCount: 2, overdueAmt: 9400,
    mrrChange: 4.2, arrChange: 5.1, subsChange: 22, custChange: 18,
    collectionRate: 79
  }
};

const UPCOMING_RENEWALS = [
  { id: 'SUB-2026-001', customer: 'Acme Technologies Ltd', plan: 'Enterprise Growth', amount: '₹18,500', date: 'Nov 5, 2026', daysLeft: 5 },
  { id: 'SUB-2026-008', customer: 'Nexus Digital Media', plan: 'Standard Business', amount: '₹4,999', date: 'Nov 8, 2026', daysLeft: 8 },
  { id: 'SUB-2026-014', customer: 'Skyline Logistics', plan: 'Core Platform', amount: '₹12,500', date: 'Nov 12, 2026', daysLeft: 12 },
  { id: 'SUB-2026-021', customer: 'TechBridge Solutions', plan: 'Starter', amount: '₹2,499', date: 'Nov 15, 2026', daysLeft: 15 },
  { id: 'SUB-2026-033', customer: 'Horizon Cloud Labs', plan: 'Enterprise Growth', amount: '₹18,500', date: 'Nov 18, 2026', daysLeft: 18 }
];

const RECENT_SUBS = [
  { id: 'SUB-2026-047', customer: 'InfraCore Systems', plan: 'Standard Business', date: 'Oct 29, 2026', amount: '₹4,999', status: 'Active' },
  { id: 'SUB-2026-046', customer: 'DataVault Analytics', plan: 'Enterprise Growth', date: 'Oct 27, 2026', amount: '₹18,500', status: 'Active' },
  { id: 'SUB-2026-045', customer: 'PureLogic Retail', plan: 'Core Platform', date: 'Oct 25, 2026', amount: '₹12,500', status: 'Confirmed' },
  { id: 'SUB-2026-044', customer: 'Orion Fintech', plan: 'Starter', date: 'Oct 24, 2026', amount: '₹2,499', status: 'Active' },
  { id: 'SUB-2026-043', customer: 'BlueSky Pharma', plan: 'Standard Business', date: 'Oct 22, 2026', amount: '₹4,999', status: 'Quotation Sent' }
];

const PENDING_INVOICES = [
  { id: 'BL-INV-2026-041', customer: 'Skyline Logistics', amount: '₹14,750', due: 'Nov 5, 2026', age: '3 days' },
  { id: 'BL-INV-2026-039', customer: 'TechBridge Solutions', amount: '₹2,949', due: 'Nov 8, 2026', age: '6 days' },
  { id: 'BL-INV-2026-037', customer: 'PureLogic Retail', amount: '₹14,750', due: 'Nov 10, 2026', age: '8 days' },
  { id: 'BL-INV-2026-035', customer: 'BlueSky Pharma', amount: '₹5,899', due: 'Nov 12, 2026', age: '10 days' }
];

const OVERDUE_PAYMENTS = [
  { id: 'BL-INV-2026-002', customer: 'Horizon Cloud Labs', amount: '₹23,600', overdueDays: 3, risk: 'High' },
  { id: 'BL-INV-2026-028', customer: 'Nexus Digital Media', amount: '₹5,899', overdueDays: 12, risk: 'Medium' },
  { id: 'BL-INV-2026-019', customer: 'DataVault Analytics', amount: '₹21,830', overdueDays: 22, risk: 'Critical' }
];

const LEAKAGE_ALERTS = [
  { severity: 'critical', id: 'LK-005', title: 'Incorrect Billing Amount', desc: 'SUB-2026-004 billed ₹15,000 vs contracted ₹18,500', impact: '₹3,500' },
  { severity: 'high', id: 'LK-001', title: 'Active Subscription Missing Invoice', desc: 'SUB-2026-031 renewal due Oct 28 — no invoice generated', impact: '₹12,500' },
  { severity: 'high', id: 'LK-007', title: 'Approaching Renewal — Unbilled', desc: '3 subscriptions renew within 5 days with no invoice queued', impact: '₹41,997' }
];

// Stored chart instances for cleanup
let dashChartInstances = {};

function fmt(num) {
  return '₹' + num.toLocaleString('en-IN');
}

function trendBadge(val, isCount) {
  const prefix = val > 0 ? '+' : '';
  const cls = val >= 0 ? 'trend-up' : 'trend-down';
  return `<span class="${cls}">${prefix}${val}${isCount ? '' : '%'}</span>`;
}

function statusBadge(status) {
  const map = {
    'Active': 'badge-success', 'Confirmed': 'badge-warning',
    'Quotation Sent': 'badge-info', 'Closed': 'badge-danger'
  };
  return `<span class="badge ${map[status] || 'badge-neutral'}">${status}</span>`;
}

function riskBadge(risk) {
  const map = { Critical: 'badge-danger', High: 'badge-warning', Medium: 'badge-info', Low: 'badge-neutral' };
  return `<span class="badge ${map[risk] || 'badge-neutral'}">${risk}</span>`;
}

// Destroy existing Chart instances to avoid canvas reuse error
function destroyCharts() {
  Object.values(dashChartInstances).forEach(c => { try { c.destroy(); } catch(e) {} });
  dashChartInstances = {};
}

function renderKPIs(period) {
  const d = DEMO_DATA[period] || DEMO_DATA['7d'];
  const container = document.getElementById('dash-kpi-grid');
  if (!container) return;
  container.innerHTML = `
    <div class="kpi-card">
      <div class="kpi-header"><span class="kpi-label">Monthly Recurring Revenue</span><i data-lucide="trending-up" class="kpi-icon"></i></div>
      <div class="kpi-value">${fmt(d.mrr)}</div>
      <div class="kpi-trend">${trendBadge(d.mrrChange)} <span class="trend-sub">vs prior period</span></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-header"><span class="kpi-label">Annual Recurring Revenue</span><i data-lucide="calendar" class="kpi-icon"></i></div>
      <div class="kpi-value">${fmt(d.arr)}</div>
      <div class="kpi-trend">${trendBadge(d.arrChange)} <span class="trend-sub">annualized pace</span></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-header"><span class="kpi-label">Active Subscriptions</span><i data-lucide="repeat" class="kpi-icon"></i></div>
      <div class="kpi-value">${d.activeSubs}</div>
      <div class="kpi-trend">${trendBadge(d.subsChange, true)} <span class="trend-sub">new this period</span></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-header"><span class="kpi-label">Total Customers</span><i data-lucide="users" class="kpi-icon"></i></div>
      <div class="kpi-value">${d.customers}</div>
      <div class="kpi-trend">${trendBadge(d.custChange, true)} <span class="trend-sub">new accounts</span></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-header"><span class="kpi-label">Revenue Collected</span><i data-lucide="check-circle-2" class="kpi-icon"></i></div>
      <div class="kpi-value">${fmt(d.collected)}</div>
      <div class="kpi-trend"><span class="trend-up">${d.collectionRate}%</span> <span class="trend-sub">collection rate</span></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-header"><span class="kpi-label">Outstanding Revenue</span><i data-lucide="clock" class="kpi-icon"></i></div>
      <div class="kpi-value">${fmt(d.outstanding)}</div>
      <div class="kpi-trend"><span class="trend-sub">Due in current period</span></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-header"><span class="kpi-label">Overdue Invoices</span><i data-lucide="alert-triangle" class="kpi-icon"></i></div>
      <div class="kpi-value" style="color:var(--danger)">${d.overdueCount}</div>
      <div class="kpi-trend"><span class="trend-down">${fmt(d.overdueAmt)}</span> <span class="trend-sub">requiring follow-up</span></div>
    </div>`;
}

function renderCharts() {
  destroyCharts();

  // Revenue trend chart
  const revCanvas = document.getElementById('dash-revenue-chart');
  if (revCanvas) {
    dashChartInstances.rev = new Chart(revCanvas, {
      type: 'line',
      data: {
        labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
        datasets: [
          { label: 'Recognized MRR (₹)', data: [185000, 198000, 210000, 222000, 235000, 245000, 258000], borderColor: '#635bff', backgroundColor: 'rgba(99,91,255,0.07)', fill: true, tension: 0.35, borderWidth: 2, pointRadius: 4, pointBackgroundColor: '#635bff' },
          { label: 'Target (₹)', data: [180000, 195000, 208000, 220000, 232000, 242000, 255000], borderColor: '#adbdcc', borderDash: [5, 5], fill: false, tension: 0.35, borderWidth: 1.5, pointRadius: 0 }
        ]
      },
      options: chartOptions('₹', true)
    });
  }

  // Plan revenue doughnut
  const planCanvas = document.getElementById('dash-plan-chart');
  if (planCanvas) {
    dashChartInstances.plan = new Chart(planCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Enterprise Growth', 'Standard Business', 'Core Platform', 'Starter'],
        datasets: [{ data: [118200, 69985, 49996, 9996], backgroundColor: ['#635bff', '#00d4ff', '#00875a', '#8898aa'], borderWidth: 2, borderColor: '#fff' }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 11 }, usePointStyle: true, boxWidth: 8, padding: 12 } } }, cutout: '65%' }
    });
  }

  // Payment status doughnut
  const statusCanvas = document.getElementById('dash-status-chart');
  if (statusCanvas) {
    dashChartInstances.status = new Chart(statusCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Paid', 'Pending', 'Overdue', 'Partial'],
        datasets: [{ data: [210500, 20300, 14200, 7500], backgroundColor: ['#00875a', '#635bff', '#df1b41', '#b76e00'], borderWidth: 2, borderColor: '#fff' }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 11 }, usePointStyle: true, boxWidth: 8, padding: 12 } } }, cutout: '65%' }
    });
  }
}

function chartOptions(unit, abbrev) {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { font: { family: 'Inter', size: 12 }, color: '#425466', usePointStyle: true, boxWidth: 8 } } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 }, color: '#8898aa' } },
      y: { grid: { color: '#f0f2f5' }, ticks: { font: { family: 'Inter', size: 11 }, color: '#8898aa', callback: v => abbrev ? unit + (v / 1000) + 'k' : unit + v } }
    }
  };
}

function renderOperationalTables() {
  const opsEl = document.getElementById('dash-ops-section');
  if (!opsEl) return;

  opsEl.innerHTML = `
    <div class="dash-ops-grid">
      <div class="card" style="margin-bottom:0">
        <div class="card-header">
          <div><div class="card-title">Upcoming Renewals</div><div class="card-subtitle">Next 30 days</div></div>
          <button class="btn btn-secondary btn-sm" data-nav="subscriptions"><i data-lucide="arrow-right"></i> View All</button>
        </div>
        <div class="table-container">
          <table class="data-table dash-ops-table">
            <thead><tr><th>Subscription</th><th>Customer</th><th>Amount</th><th>Date</th><th>Days</th></tr></thead>
            <tbody>
              ${UPCOMING_RENEWALS.map(r => `<tr>
                <td class="mono-text">${r.id}</td>
                <td>${r.customer}</td>
                <td class="mono-text">${r.amount}</td>
                <td>${r.date}</td>
                <td><span class="badge ${r.daysLeft <= 7 ? 'badge-danger' : r.daysLeft <= 14 ? 'badge-warning' : 'badge-info'}">${r.daysLeft}d</span></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card" style="margin-bottom:0">
        <div class="card-header">
          <div><div class="card-title">Recent Subscriptions</div><div class="card-subtitle">Latest sign-ups</div></div>
          <button class="btn btn-secondary btn-sm" data-nav="subscriptions"><i data-lucide="arrow-right"></i> View All</button>
        </div>
        <div class="table-container">
          <table class="data-table dash-ops-table">
            <thead><tr><th>ID</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              ${RECENT_SUBS.map(s => `<tr>
                <td class="mono-text">${s.id}</td>
                <td>${s.customer}</td>
                <td class="mono-text">${s.amount}</td>
                <td>${statusBadge(s.status)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="dash-ops-grid">
      <div class="card" style="margin-bottom:0">
        <div class="card-header">
          <div><div class="card-title">Pending Invoices</div><div class="card-subtitle">Awaiting payment</div></div>
          <button class="btn btn-secondary btn-sm" data-nav="invoices"><i data-lucide="arrow-right"></i> View All</button>
        </div>
        <div class="table-container">
          <table class="data-table dash-ops-table">
            <thead><tr><th>Invoice</th><th>Customer</th><th>Amount</th><th>Due Date</th></tr></thead>
            <tbody>
              ${PENDING_INVOICES.map(i => `<tr>
                <td class="mono-text">${i.id}</td>
                <td>${i.customer}</td>
                <td class="mono-text">${i.amount}</td>
                <td>${i.due}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card" style="margin-bottom:0">
        <div class="card-header">
          <div><div class="card-title">Overdue Payments</div><div class="card-subtitle">Immediate follow-up needed</div></div>
          <button class="btn btn-secondary btn-sm" data-nav="invoices"><i data-lucide="arrow-right"></i> View All</button>
        </div>
        <div class="table-container">
          <table class="data-table dash-ops-table">
            <thead><tr><th>Invoice</th><th>Customer</th><th>Amount</th><th>Risk</th></tr></thead>
            <tbody>
              ${OVERDUE_PAYMENTS.map(p => `<tr>
                <td class="mono-text">${p.id}</td>
                <td>${p.customer}</td>
                <td class="mono-text" style="color:var(--danger)">${p.amount}</td>
                <td>${riskBadge(p.risk)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
}

function renderLeakagePreview() {
  const el = document.getElementById('dash-leakage-preview');
  if (!el) return;
  const total = LEAKAGE_ALERTS.reduce((sum, a) => sum + parseInt(a.impact.replace(/[₹,]/g, '')), 0);
  el.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div><div class="card-title">Revenue Leakage Sentinel</div><div class="card-subtitle">Top priority alerts requiring action</div></div>
        <button class="btn btn-secondary btn-sm" data-nav="leakage"><i data-lucide="shield-alert"></i> View All Issues</button>
      </div>
      <div class="card-body">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div>
            <div style="font-size:11px;font-weight:600;color:var(--danger);text-transform:uppercase">Total Revenue at Risk</div>
            <div style="font-size:22px;font-weight:700;color:var(--danger)">${fmt(total)}</div>
          </div>
          <span class="badge badge-danger">${LEAKAGE_ALERTS.length} Active Issues</span>
        </div>
        ${LEAKAGE_ALERTS.map(a => `
          <div class="dash-leakage-alert-item ${a.severity}">
            <div style="flex:1">
              <div style="font-weight:600;font-size:12px">${a.title}</div>
              <div style="color:var(--text-secondary);font-size:12px;margin-top:2px">${a.desc}</div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div class="mono-text" style="font-weight:600;color:var(--danger)">${a.impact}</div>
              <span class="badge ${a.severity === 'critical' ? 'badge-danger' : a.severity === 'high' ? 'badge-warning' : 'badge-info'}">${a.severity}</span>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

function exportKPIs(period) {
  const d = DEMO_DATA[period] || DEMO_DATA['7d'];
  const rows = [
    ['Metric', 'Value', 'Change'],
    ['MRR', d.mrr, `${d.mrrChange}%`],
    ['ARR', d.arr, `${d.arrChange}%`],
    ['Active Subscriptions', d.activeSubs, `+${d.subsChange}`],
    ['Total Customers', d.customers, `+${d.custChange}`],
    ['Revenue Collected', d.collected, `${d.collectionRate}% rate`],
    ['Outstanding Revenue', d.outstanding, '-'],
    ['Overdue Count', d.overdueCount, `₹${d.overdueAmt}`]
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'dashboard-kpis.csv'; a.click();
  URL.revokeObjectURL(url);
}

export function initDashboard() {
  const view = document.getElementById('view-dashboard');
  if (!view) return;

  // Inject the enhanced dashboard HTML structure
  view.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h2>Executive Revenue Dashboard</h2>
        <p>Live metrics across recurring revenue, subscriptions and cash collections</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary btn-sm" id="dash-export-btn"><i data-lucide="download"></i> Export KPIs</button>
        <button class="btn btn-primary btn-sm" data-modal="add-customer-modal"><i data-lucide="plus"></i> New Subscription</button>
      </div>
    </div>

    <div class="dash-filter-bar">
      <div class="dash-period-pills" id="dash-period-pills">
        <button class="dash-period-pill active" data-period="7d">Last 7 Days</button>
        <button class="dash-period-pill" data-period="30d">Last 30 Days</button>
        <button class="dash-period-pill" data-period="90d">Last 90 Days</button>
        <button class="dash-period-pill" data-period="yr">This Year</button>
      </div>
      <span class="demo-data-notice"><i data-lucide="info" style="width:12px;height:12px"></i> Demo data — connect API for live figures</span>
    </div>

    <!-- Dynamic KPI Grid -->
    <div class="kpi-grid" id="dash-kpi-grid"></div>

    <!-- Charts Row: Revenue Trend + Plan Split -->
    <div class="dash-charts-grid">
      <div class="card" style="margin-bottom:0">
        <div class="card-header">
          <div><div class="card-title">Recurring Revenue Trajectory</div><div class="card-subtitle">Monthly recognized revenue vs billing target</div></div>
          <span class="badge badge-info">Chart.js</span>
        </div>
        <div class="card-body"><canvas id="dash-revenue-chart" height="240"></canvas></div>
      </div>
      <div class="card" style="margin-bottom:0">
        <div class="card-header"><div class="card-title">Revenue by Plan</div><div class="card-subtitle">MRR split by subscription tier</div></div>
        <div class="card-body"><canvas id="dash-plan-chart" height="240"></canvas></div>
      </div>
    </div>
    <div style="margin-bottom:24px"></div>

    <!-- Payment Status Doughnut + Leakage Preview -->
    <div class="grid-2">
      <div class="card" style="margin-bottom:0">
        <div class="card-header"><div class="card-title">Revenue by Payment Status</div><div class="card-subtitle">Collected vs pending vs overdue</div></div>
        <div class="card-body"><canvas id="dash-status-chart" height="220"></canvas></div>
      </div>
      <div id="dash-leakage-preview"></div>
    </div>
    <div style="margin-bottom:24px"></div>

    <!-- Operational Overview -->
    <div id="dash-ops-section"></div>`;

  // Attach period pill listeners
  let activePeriod = '7d';
  view.querySelectorAll('.dash-period-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      view.querySelectorAll('.dash-period-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activePeriod = pill.dataset.period;
      renderKPIs(activePeriod);
    });
  });

  // Export button
  const exportBtn = view.querySelector('#dash-export-btn');
  if (exportBtn) exportBtn.addEventListener('click', () => exportKPIs(activePeriod));

  // Data-nav buttons (delegated)
  view.addEventListener('click', e => {
    const btn = e.target.closest('[data-nav]');
    if (btn) {
      const target = btn.getAttribute('data-nav');
      const navLink = document.querySelector(`.nav-link[data-view="${target}"]`);
      if (navLink) navLink.click();
    }
    const modalBtn = e.target.closest('[data-modal]');
    if (modalBtn) {
      const id = modalBtn.getAttribute('data-modal');
      const modal = document.getElementById(id);
      if (modal) modal.classList.add('active');
    }
  });

  // Initial render
  renderKPIs(activePeriod);
  renderCharts();
  renderOperationalTables();
  renderLeakagePreview();
  createIcons({ icons });
}

