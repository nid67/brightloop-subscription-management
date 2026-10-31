/**
 * Module 06 — Reports Workspace
 * Date filters, category tabs, report preview, CSV export, print layout.
 */

import { createIcons, icons } from 'lucide';

const REPORT_CONFIGS = {
  revenue: {
    label: 'Revenue Report',
    cols: ['Period', 'MRR', 'ARR', 'Collected', 'Outstanding', 'Growth %'],
    rows: [
      ['Oct 2026', '₹2,45,000', '₹29,40,000', '₹2,10,500', '₹34,500', '+12.4%'],
      ['Sep 2026', '₹2,28,000', '₹27,36,000', '₹1,95,000', '₹33,000', '+9.8%'],
      ['Aug 2026', '₹2,10,000', '₹25,20,000', '₹1,82,000', '₹28,000', '+8.2%'],
      ['Jul 2026', '₹1,95,000', '₹23,40,000', '₹1,70,500', '₹24,500', '+6.5%'],
      ['Jun 2026', '₹1,85,000', '₹22,20,000', '₹1,60,000', '₹25,000', '+5.1%']
    ],
    summary: { 'Total MRR (Period)': '₹10,63,000', 'Avg Collection Rate': '84.2%', 'Revenue Records': '5', 'Growth Trend': 'Positive ↑' }
  },
  subscriptions: {
    label: 'Subscriptions Report',
    cols: ['Sub ID', 'Customer', 'Plan', 'MRR', 'Start Date', 'Renewal Date', 'Status'],
    rows: [
      ['SUB-2026-001', 'Acme Technologies Ltd', 'Enterprise Growth', '₹18,500', 'Jan 1, 2026', 'Nov 15, 2026', 'Active'],
      ['SUB-2026-002', 'Nexus Digital Media', 'Core Platform', '₹4,999', 'Feb 1, 2026', 'Dec 1, 2026', 'Active'],
      ['SUB-2026-008', 'DataVault Analytics', 'Enterprise Growth', '₹18,500', 'Mar 15, 2026', 'Nov 8, 2026', 'At Risk'],
      ['SUB-2026-014', 'Horizon Cloud Labs', 'Standard Business', '₹4,999', 'Apr 1, 2026', 'Nov 5, 2026', 'Active'],
      ['SUB-2026-021', 'Skyline Logistics', 'Enterprise Growth', '₹18,500', 'Jun 1, 2026', 'Nov 12, 2026', 'Active'],
      ['SUB-2026-029', 'TechBridge Solutions', 'Starter', '₹2,499', 'Aug 3, 2026', 'Nov 3, 2026', 'Approaching Renewal']
    ],
    summary: { 'Total Active Subs': '128', 'Monthly Recurring': '₹2,45,000', 'Avg Plan Value': '₹1,914', 'Churn Rate': '1.2%' }
  },
  customers: {
    label: 'Customer Report',
    cols: ['Customer', 'Email', 'Active Subs', 'Lifetime Value', 'GSTIN', 'Status', 'Since'],
    rows: [
      ['Acme Technologies Ltd', 'billing@acmetech.io', '2', '₹2,45,000', '27AABCU9603R1ZM', 'Active', 'Jan 2026'],
      ['Nexus Digital Media', 'accounts@nexusdigital.com', '1', '₹86,400', '29AAACG0561D1Z5', 'Active', 'Feb 2026'],
      ['DataVault Analytics', 'finance@datavault.in', '1', '₹1,62,000', '07AADCD1234E1Z4', 'Active', 'Mar 2026'],
      ['Horizon Cloud Labs', 'accounts@horizoncloud.com', '1', '₹44,991', '06AAACH0561H1Z2', 'Overdue', 'Apr 2026'],
      ['Skyline Logistics', 'billing@skylinelogi.com', '1', '₹92,500', '24AAACS1234F1Z9', 'Active', 'Jun 2026']
    ],
    summary: { 'Total Customers': '94', 'Active Accounts': '89', 'Overdue Accounts': '3', 'Avg Lifetime Value': '₹1,44,700' }
  },
  invoices: {
    label: 'Invoice Report',
    cols: ['Invoice ID', 'Customer', 'Date', 'Subtotal', 'CGST 9%', 'SGST 9%', 'Total', 'Status'],
    rows: [
      ['BL-INV-2026-001', 'Acme Technologies Ltd', 'Nov 1, 2026', '₹10,000', '₹900', '₹900', '₹11,800', 'Paid'],
      ['BL-INV-2026-002', 'Horizon Cloud Labs', 'Oct 28, 2026', '₹20,000', '₹1,800', '₹1,800', '₹23,600', 'Overdue'],
      ['BL-INV-2026-039', 'TechBridge Solutions', 'Oct 29, 2026', '₹2,499', '₹225', '₹225', '₹2,949', 'Pending'],
      ['BL-INV-2026-041', 'Skyline Logistics', 'Oct 30, 2026', '₹12,500', '₹1,125', '₹1,125', '₹14,750', 'Pending'],
      ['BL-INV-2026-043', 'DataVault Analytics', 'Oct 31, 2026', '₹18,500', '₹1,665', '₹1,665', '₹21,830', 'Paid']
    ],
    summary: { 'Total Invoices': '43', 'Total Billed': '₹2,45,000', 'Collected': '₹2,10,500', 'Overdue Amount': '₹14,200' }
  },
  payments: {
    label: 'Payment Report',
    cols: ['Payment Ref', 'Invoice', 'Customer', 'Method', 'Amount', 'Date', 'Status'],
    rows: [
      ['PAY-UPI-98402', 'BL-INV-2026-001', 'Acme Technologies Ltd', 'UPI (GooglePay)', '₹11,800', 'Nov 1, 2026', 'Reconciled'],
      ['PAY-NEFT-8819', 'Unmatched', 'DataVault Analytics', 'NEFT', '₹30,500', 'Oct 28, 2026', 'Unreconciled'],
      ['PAY-CARD-4429', 'BL-INV-2026-043', 'DataVault Analytics', 'Visa Corporate', '₹21,830', 'Oct 31, 2026', 'Reconciled'],
      ['PAY-UPI-88120', 'BL-INV-2026-041', 'Skyline Logistics', 'PhonePe', '₹14,750', 'Oct 30, 2026', 'Reconciled']
    ],
    summary: { 'Total Payments': '38', 'Total Collected': '₹2,10,500', 'Reconciled': '37', 'Unreconciled': '1' }
  },
  renewals: {
    label: 'Renewals Report',
    cols: ['Sub ID', 'Customer', 'Plan', 'MRR', 'Renewal Date', 'Days Left', 'Risk'],
    rows: [
      ['SUB-2026-029', 'TechBridge Solutions', 'Starter', '₹2,499', 'Nov 3, 2026', '3', 'High'],
      ['SUB-2026-014', 'Horizon Cloud Labs', 'Standard Business', '₹4,999', 'Nov 5, 2026', '5', 'Critical'],
      ['SUB-2026-001', 'Acme Technologies Ltd', 'Enterprise Growth', '₹18,500', 'Nov 15, 2026', '15', 'Low'],
      ['SUB-2026-021', 'Skyline Logistics', 'Enterprise Growth', '₹18,500', 'Nov 12, 2026', '12', 'Low'],
      ['SUB-2026-008', 'Nexus Digital Media', 'Core Platform', '₹4,999', 'Nov 8, 2026', '8', 'Medium']
    ],
    summary: { 'Due This Month': '18', 'Revenue at Renewal': '₹1,20,000', 'High Risk': '3', 'Auto-renew Enabled': '15' }
  }
};

let activeCategory = 'revenue';
let reportFilters = { from: '', to: '', customer: '' };

function renderReportSummary(cat) {
  const summary = REPORT_CONFIGS[cat]?.summary || {};
  const el = document.getElementById('reports-summary-strip');
  if (!el) return;
  el.innerHTML = Object.entries(summary).map(([k, v]) => `
    <div class="reports-summary-card">
      <div class="label">${k}</div>
      <div class="value">${v}</div>
    </div>`).join('');
}

function filteredRows(cat) {
  let rows = [...(REPORT_CONFIGS[cat]?.rows || [])];
  if (reportFilters.customer) {
    rows = rows.filter(r => r.some(cell => cell.toLowerCase().includes(reportFilters.customer.toLowerCase())));
  }
  return rows;
}

function renderReportTable(cat) {
  const config = REPORT_CONFIGS[cat];
  if (!config) return;
  const rows = filteredRows(cat);
  const el = document.getElementById('reports-preview-table');
  if (!el) return;
  el.innerHTML = `
    <table class="data-table" id="reports-table-inner">
      <thead><tr>${config.cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
      <tbody>
        ${rows.length === 0
          ? `<tr><td colspan="${config.cols.length}" style="text-align:center;padding:40px;color:var(--text-muted)">No data matches filters</td></tr>`
          : rows.map(r => `<tr>${r.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
      </tbody>
    </table>`;
}

function exportCSV(cat) {
  const config = REPORT_CONFIGS[cat];
  const rows = filteredRows(cat);
  const csv = [config.cols, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${cat}-report.csv`; a.click();
}

export function initReports() {
  const view = document.getElementById('view-reports');
  if (!view) return;

  view.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h2>Reports &amp; Business Intelligence</h2>
        <p>Revenue, subscription, customer, invoice, payment and renewal reports with export</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary btn-sm" id="reports-print-btn"><i data-lucide="printer"></i> Print</button>
        <button class="btn btn-primary btn-sm" id="reports-export-btn"><i data-lucide="download"></i> Export CSV</button>
      </div>
    </div>

    <!-- Category Tabs -->
    <div class="reports-category-tabs" id="reports-tabs">
      <button class="reports-category-tab active" data-cat="revenue">Revenue</button>
      <button class="reports-category-tab" data-cat="subscriptions">Subscriptions</button>
      <button class="reports-category-tab" data-cat="customers">Customers</button>
      <button class="reports-category-tab" data-cat="invoices">Invoices</button>
      <button class="reports-category-tab" data-cat="payments">Payments</button>
      <button class="reports-category-tab" data-cat="renewals">Renewals</button>
    </div>

    <!-- Filters Panel -->
    <div class="reports-filter-panel">
      <label>Date From</label>
      <input type="date" class="form-input" id="reports-date-from" style="width:140px">
      <label>To</label>
      <input type="date" class="form-input" id="reports-date-to" style="width:140px">
      <label>Customer</label>
      <input type="text" class="form-input" id="reports-customer-filter" placeholder="Filter by customer..." style="width:200px">
      <button class="btn btn-primary btn-sm" id="reports-generate-btn"><i data-lucide="play"></i> Generate</button>
      <button class="btn btn-secondary btn-sm" id="reports-reset-btn">Reset</button>
      <span class="demo-data-notice" style="margin-left:auto"><i data-lucide="info" style="width:12px;height:12px"></i> Demo data</span>
    </div>

    <!-- Summary Strip -->
    <div class="reports-summary-strip" id="reports-summary-strip"></div>

    <!-- Report Preview -->
    <div class="card">
      <div class="card-header">
        <div id="reports-table-title">
          <div class="card-title" id="reports-report-title">Revenue Report</div>
          <div class="card-subtitle">Preview — adjust filters and click Generate to refresh</div>
        </div>
        <span class="badge badge-neutral" id="reports-row-count">5 records</span>
      </div>
      <div class="table-container" id="reports-preview-table"></div>
    </div>

    <div class="demo-data-notice">
      <i data-lucide="info" style="width:12px;height:12px"></i>
      All report data above is for demonstration. Connect the reporting API for live financial reports.
    </div>`;

  // Initial render
  renderReportSummary(activeCategory);
  renderReportTable(activeCategory);

  const updateRowCount = () => {
    const el = document.getElementById('reports-row-count');
    if (el) el.textContent = `${filteredRows(activeCategory).length} records`;
    const titleEl = document.getElementById('reports-report-title');
    if (titleEl) titleEl.textContent = REPORT_CONFIGS[activeCategory]?.label || '';
  };
  updateRowCount();

  // Category tabs
  view.querySelectorAll('.reports-category-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      view.querySelectorAll('.reports-category-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeCategory = tab.dataset.cat;
      renderReportSummary(activeCategory);
      renderReportTable(activeCategory);
      updateRowCount();
    });
  });

  // Filters
  view.querySelector('#reports-customer-filter')?.addEventListener('input', e => {
    reportFilters.customer = e.target.value;
  });
  view.querySelector('#reports-date-from')?.addEventListener('change', e => { reportFilters.from = e.target.value; });
  view.querySelector('#reports-date-to')?.addEventListener('change', e => { reportFilters.to = e.target.value; });

  // Generate
  view.querySelector('#reports-generate-btn')?.addEventListener('click', () => {
    renderReportSummary(activeCategory);
    renderReportTable(activeCategory);
    updateRowCount();
  });

  // Reset
  view.querySelector('#reports-reset-btn')?.addEventListener('click', () => {
    reportFilters = { from: '', to: '', customer: '' };
    view.querySelector('#reports-date-from').value = '';
    view.querySelector('#reports-date-to').value = '';
    view.querySelector('#reports-customer-filter').value = '';
    renderReportTable(activeCategory);
    updateRowCount();
  });

  // Export
  view.querySelector('#reports-export-btn')?.addEventListener('click', () => exportCSV(activeCategory));

  // Print
  view.querySelector('#reports-print-btn')?.addEventListener('click', () => window.print());

  createIcons({ icons });
}

