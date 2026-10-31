/**
 * Module 06 — Revenue Leakage Detection
 * Intelligent operational monitoring workspace with search, filters,
 * issue detail drawer, mark-as-resolved, and audit trail.
 */

import { createIcons, icons } from 'lucide';

// ── Demo Leakage Issues ───────────────────────────────────────────────────────
const LEAKAGE_ISSUES = [
  {
    id: 'LK-001', severity: 'critical', category: 'Missing Invoice',
    description: 'Active subscription SUB-2026-031 passed renewal date (Oct 28) with no invoice generated.',
    customer: 'Horizon Cloud Labs', entity: 'SUB-2026-031', impact: 12500,
    detectedAt: '2026-10-31 08:30', status: 'Open', action: 'Generate Invoice',
    history: [
      { time: '2026-10-31 08:30', event: 'Issue detected by automated billing audit scan' },
      { time: '2026-10-31 08:31', event: 'Severity classified as Critical — invoice overdue by 3 days' }
    ]
  },
  {
    id: 'LK-002', severity: 'high', category: 'Duplicate Invoice Attempt',
    description: 'Two invoice generation attempts detected for BL-INV-2026-039 within the same billing cycle.',
    customer: 'TechBridge Solutions', entity: 'BL-INV-2026-039', impact: 2949,
    detectedAt: '2026-10-30 14:15', status: 'Resolved',
    action: 'Review Idempotency',
    history: [
      { time: '2026-10-30 14:15', event: 'Duplicate attempt detected via idempotency token check' },
      { time: '2026-10-30 14:16', event: 'Second invoice blocked automatically by duplicate billing guard' },
      { time: '2026-10-30 15:00', event: 'Marked as resolved — idempotency key verified intact' }
    ]
  },
  {
    id: 'LK-003', severity: 'high', category: 'Overdue Invoice',
    description: 'Invoice BL-INV-2026-002 is 22 days overdue. Customer contact not responded to 2 reminders.',
    customer: 'Nexus Digital Media', entity: 'BL-INV-2026-002', impact: 23600,
    detectedAt: '2026-10-09 00:00', status: 'In Progress', action: 'Send Reminder',
    history: [
      { time: '2026-10-09 00:00', event: 'Invoice passed due date — auto-flagged as overdue' },
      { time: '2026-10-15 10:00', event: 'Reminder #1 sent to accounts@nexusdigital.com' },
      { time: '2026-10-22 10:00', event: 'Reminder #2 sent — no response received' }
    ]
  },
  {
    id: 'LK-004', severity: 'medium', category: 'Expired Discount Applied',
    description: 'Customer applying promo code PROMO10 which expired on Oct 15. Discount still active in billing engine.',
    customer: 'PureLogic Retail', entity: 'Discount: PROMO10', impact: 3200,
    detectedAt: '2026-10-29 09:45', status: 'Open', action: 'Revoke Discount',
    history: [
      { time: '2026-10-29 09:45', event: 'PROMO10 used on invoice — expiry date Oct 15 already passed' },
      { time: '2026-10-29 09:46', event: 'System flag raised — discount not auto-expired in billing config' }
    ]
  },
  {
    id: 'LK-005', severity: 'critical', category: 'Incorrect Billing Amount',
    description: 'SUB-2026-004 billed ₹15,000 but contracted plan price is ₹18,500. Billing discrepancy of ₹3,500.',
    customer: 'Acme Technologies Ltd', entity: 'SUB-2026-004', impact: 3500,
    detectedAt: '2026-10-31 07:12', status: 'Open', action: 'Correct Invoice',
    history: [
      { time: '2026-10-31 07:12', event: 'Billing amount mismatch detected vs contract price on file' },
      { time: '2026-10-31 07:13', event: 'Severity set to Critical — revenue gap of ₹3,500 per cycle' }
    ]
  },
  {
    id: 'LK-006', severity: 'medium', category: 'Failed Payment Reconciliation',
    description: 'NEFT reference NEFT-8819 (₹30,500) received Oct 28 — no matching open invoice found.',
    customer: 'DataVault Analytics', entity: 'NEFT-8819', impact: 30500,
    detectedAt: '2026-10-28 16:00', status: 'In Progress', action: 'Match Invoice',
    history: [
      { time: '2026-10-28 16:00', event: 'Bank receipt NEFT-8819 imported — no invoice match found' },
      { time: '2026-10-29 10:00', event: 'Manual review initiated by Finance team' }
    ]
  },
  {
    id: 'LK-007', severity: 'high', category: 'Renewal Without Billing Prep',
    description: '3 subscriptions renew within 5 days (Nov 3-5) — no draft invoices created yet.',
    customer: 'Multiple Accounts', entity: 'SUB-2026-001, 008, 033', impact: 41997,
    detectedAt: '2026-10-31 06:00', status: 'Open', action: 'Queue Invoices',
    history: [
      { time: '2026-10-31 06:00', event: 'Pre-renewal scan: 3 subscriptions approaching billing window' },
      { time: '2026-10-31 06:01', event: 'No draft invoices found — escalated to billing operations team' }
    ]
  }
];

let issueData = LEAKAGE_ISSUES.map(i => ({ ...i }));
let activeFilters = { search: '', severity: 'all', status: 'all', period: 'all' };

function fmt(n) { return '₹' + n.toLocaleString('en-IN'); }

function sevBadge(sev) {
  const map = { critical: 'badge-danger', high: 'badge-warning', medium: 'badge-info', low: 'badge-neutral' };
  return `<span class="badge ${map[sev] || 'badge-neutral'}" style="text-transform:capitalize">${sev}</span>`;
}
function statusBadge(s) {
  const map = { 'Open': 'badge-danger', 'In Progress': 'badge-warning', 'Resolved': 'badge-success' };
  return `<span class="badge ${map[s] || 'badge-neutral'}">${s}</span>`;
}

function filteredIssues() {
  return issueData.filter(i => {
    const matchSearch = !activeFilters.search || [i.id, i.category, i.customer, i.entity, i.description].some(v => v.toLowerCase().includes(activeFilters.search.toLowerCase()));
    const matchSev = activeFilters.severity === 'all' || i.severity === activeFilters.severity;
    const matchStatus = activeFilters.status === 'all' || i.status === activeFilters.status;
    return matchSearch && matchSev && matchStatus;
  });
}

function renderKPIs() {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  issueData.filter(i => i.status !== 'Resolved').forEach(i => counts[i.severity] = (counts[i.severity] || 0) + 1);
  const totalImpact = issueData.filter(i => i.status !== 'Resolved').reduce((s, i) => s + i.impact, 0);

  const el = document.getElementById('leakage-kpi-strip');
  if (!el) return;
  el.innerHTML = `
    <div class="kpi-card"><div class="kpi-header"><span class="kpi-label">Critical Issues</span><i data-lucide="alert-octagon" class="kpi-icon"></i></div><div class="kpi-value" style="color:var(--danger)">${counts.critical}</div><div class="kpi-trend"><span class="trend-sub">Immediate action</span></div></div>
    <div class="kpi-card"><div class="kpi-header"><span class="kpi-label">High Issues</span><i data-lucide="alert-triangle" class="kpi-icon"></i></div><div class="kpi-value" style="color:var(--warning)">${counts.high}</div><div class="kpi-trend"><span class="trend-sub">Urgent review</span></div></div>
    <div class="kpi-card"><div class="kpi-header"><span class="kpi-label">Medium Issues</span><i data-lucide="alert-circle" class="kpi-icon"></i></div><div class="kpi-value" style="color:var(--info)">${counts.medium || 0}</div><div class="kpi-trend"><span class="trend-sub">Monitor closely</span></div></div>
    <div class="kpi-card"><div class="kpi-header"><span class="kpi-label">Revenue at Risk</span><i data-lucide="trending-down" class="kpi-icon"></i></div><div class="kpi-value" style="color:var(--danger);font-size:18px">${fmt(totalImpact)}</div><div class="kpi-trend"><span class="trend-sub">Open issues</span></div></div>`;
}

function renderTable() {
  const tbody = document.getElementById('leakage-tbody');
  if (!tbody) return;
  const filtered = filteredIssues();
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted)">No issues match your filters</td></tr>`;
    return;
  }
  tbody.innerHTML = filtered.map(i => `
    <tr data-issue-id="${i.id}">
      <td class="mono-text">${i.id}</td>
      <td>${sevBadge(i.severity)}</td>
      <td><strong>${i.category}</strong></td>
      <td style="max-width:220px;font-size:12px;color:var(--text-secondary)">${i.description.slice(0, 80)}${i.description.length > 80 ? '…' : ''}</td>
      <td>${i.customer}</td>
      <td class="mono-text" style="font-size:12px">${i.entity}</td>
      <td class="mono-text" style="color:var(--danger);font-weight:600">${fmt(i.impact)}</td>
      <td>${statusBadge(i.status)}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-secondary btn-sm" data-open-leakage="${i.id}">Details</button>
          ${i.status !== 'Resolved' ? `<button class="btn btn-primary btn-sm" data-resolve-leakage="${i.id}">Resolve</button>` : ''}
        </div>
      </td>
    </tr>`).join('');
}

function updateRiskBanner() {
  const open = issueData.filter(i => i.status !== 'Resolved');
  const total = open.reduce((s, i) => s + i.impact, 0);
  const banner = document.getElementById('leakage-risk-total');
  const subtext = document.getElementById('leakage-risk-subtext');
  if (banner) banner.textContent = fmt(total);
  if (subtext) subtext.textContent = `${open.length} active issue${open.length !== 1 ? 's' : ''} detected in the current billing cycle`;
}

function openLeakageDrawer(issueId) {
  const issue = issueData.find(i => i.id === issueId);
  if (!issue) return;

  const drawerTitle = document.getElementById('leakage-drawer-title');
  const drawerContent = document.getElementById('leakage-drawer-content');
  if (drawerTitle) drawerTitle.textContent = `${issue.id} — ${issue.category}`;
  if (drawerContent) {
    drawerContent.innerHTML = `
      <div style="margin-bottom:16px">
        ${sevBadge(issue.severity)} ${statusBadge(issue.status)}
      </div>
      <div class="form-group"><label class="form-label">Description</label><div style="font-size:13px;color:var(--text-main)">${issue.description}</div></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Affected Customer</label><div><strong>${issue.customer}</strong></div></div>
        <div class="form-group"><label class="form-label">Related Entity</label><div class="mono-text" style="font-size:12px">${issue.entity}</div></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Estimated Impact</label><div class="mono-text" style="font-size:18px;font-weight:700;color:var(--danger)">${fmt(issue.impact)}</div></div>
        <div class="form-group"><label class="form-label">Detected At</label><div class="mono-text" style="font-size:12px">${issue.detectedAt}</div></div>
      </div>

      <div style="border-top:1px solid var(--border);padding-top:16px;margin-top:4px">
        <div style="font-weight:600;font-size:13px;margin-bottom:14px">Resolution History</div>
        ${issue.history.map(h => `
          <div class="leakage-timeline-item">
            <div class="leakage-timeline-dot"><i data-lucide="clock" style="width:12px;height:12px"></i></div>
            <div class="leakage-timeline-content">
              <div class="leakage-timeline-title">${h.event}</div>
              <div class="leakage-timeline-time">${h.time}</div>
            </div>
          </div>`).join('')}
      </div>

      ${issue.status !== 'Resolved' ? `
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">
          <button class="btn btn-primary" style="width:100%;justify-content:center" data-resolve-leakage="${issue.id}" id="drawer-resolve-btn">
            <i data-lucide="check-circle-2"></i> Mark as Resolved
          </button>
        </div>` : `<div class="info-banner" style="margin-top:16px"><strong>Resolved:</strong> This issue has been marked as resolved.</div>`}`;
  }

  const overlay = document.getElementById('leakage-detail-overlay');
  const panel = document.getElementById('leakage-detail-drawer');
  if (overlay) overlay.classList.add('active');
  if (panel) panel.classList.add('active');
  createIcons({ icons });
}

function resolveIssue(issueId) {
  const issue = issueData.find(i => i.id === issueId);
  if (!issue) return;
  issue.status = 'Resolved';
  const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
  issue.history.push({ time: now, event: 'Issue marked as resolved by operations team' });

  renderKPIs();
  renderTable();
  updateRiskBanner();

  // Close drawer
  document.getElementById('leakage-detail-overlay')?.classList.remove('active');
  document.getElementById('leakage-detail-drawer')?.classList.remove('active');

  // Toast
  const { showToast } = window.__subscriptiqToast || {};
  if (showToast) showToast(`Issue ${issueId} marked as resolved`, 'success');
  else { const t = document.createElement('div'); t.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#00875a;color:#fff;padding:10px 16px;border-radius:6px;font-size:13px;z-index:9999'; t.textContent = `✓ Issue ${issueId} resolved`; document.body.appendChild(t); setTimeout(() => t.remove(), 3000); }
  createIcons({ icons });
}

export function initLeakage() {
  const view = document.getElementById('view-leakage');
  if (!view) return;

  view.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h2>Revenue Leakage Sentinel</h2>
        <p>Automated anomaly detection across billing gaps, duplicate invoices, overdue payments and discount leaks</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary btn-sm" id="leakage-audit-btn"><i data-lucide="refresh-cw" id="leakage-audit-icon"></i> Run Anomaly Audit</button>
      </div>
    </div>

    <!-- Risk Banner -->
    <div class="leakage-risk-banner">
      <div>
        <div class="leakage-risk-label">Total Detected Revenue at Risk</div>
        <div class="leakage-risk-total" id="leakage-risk-total"></div>
      </div>
      <div style="text-align:right">
        <div style="font-size:13px;color:var(--text-secondary)" id="leakage-risk-subtext"></div>
        <span class="demo-data-notice" style="margin-top:8px;display:inline-flex"><i data-lucide="info" style="width:12px;height:12px"></i> Demo data</span>
      </div>
    </div>

    <!-- KPI Strip -->
    <div class="leakage-kpi-strip" id="leakage-kpi-strip"></div>

    <!-- Filters -->
    <div class="card" style="margin-bottom:16px">
      <div class="filter-bar">
        <div class="filter-left">
          <div class="search-box" style="width:280px">
            <i data-lucide="search"></i>
            <input type="text" id="leakage-search" placeholder="Search issues, customers, IDs...">
          </div>
        </div>
        <div class="filter-right">
          <select id="leakage-sev-filter" class="form-select">
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select id="leakage-status-filter" class="form-select">
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
          <button class="btn btn-secondary btn-sm" id="leakage-reset-filters">Reset</button>
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Issue ID</th><th>Severity</th><th>Category</th><th>Description</th>
              <th>Customer</th><th>Entity</th><th>Impact</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody id="leakage-tbody"></tbody>
        </table>
      </div>
    </div>

    <div class="demo-data-notice">
      <i data-lucide="info" style="width:12px;height:12px"></i>
      All leakage issues above are demonstration data. Connect the monitoring API to display live anomaly detections.
    </div>

    <!-- Detail Drawer -->
    <div id="leakage-detail-overlay" class="drawer-overlay" data-close-leakage-drawer></div>
    <div id="leakage-detail-drawer" class="drawer-panel">
      <div class="drawer-header">
        <div>
          <div style="font-size:15px;font-weight:600" id="leakage-drawer-title">Issue Details</div>
          <div style="font-size:12px;color:var(--text-muted)">Revenue Leakage Analysis</div>
        </div>
        <button class="modal-close" data-close-leakage-drawer>&times;</button>
      </div>
      <div class="drawer-body" id="leakage-drawer-content"></div>
    </div>`;

  // KPIs and table
  renderKPIs();
  renderTable();
  updateRiskBanner();

  // Search
  view.querySelector('#leakage-search')?.addEventListener('input', e => {
    activeFilters.search = e.target.value;
    renderTable();
  });

  // Severity filter
  view.querySelector('#leakage-sev-filter')?.addEventListener('change', e => {
    activeFilters.severity = e.target.value;
    renderTable();
  });

  // Status filter
  view.querySelector('#leakage-status-filter')?.addEventListener('change', e => {
    activeFilters.status = e.target.value;
    renderTable();
  });

  // Reset filters
  view.querySelector('#leakage-reset-filters')?.addEventListener('click', () => {
    activeFilters = { search: '', severity: 'all', status: 'all', period: 'all' };
    view.querySelector('#leakage-search').value = '';
    view.querySelector('#leakage-sev-filter').value = 'all';
    view.querySelector('#leakage-status-filter').value = 'all';
    renderTable();
  });

  // Run Audit button
  const auditBtn = view.querySelector('#leakage-audit-btn');
  const auditIcon = view.querySelector('#leakage-audit-icon');
  auditBtn?.addEventListener('click', () => {
    auditBtn.disabled = true;
    if (auditIcon) auditIcon.classList.add('leakage-spin');
    setTimeout(() => {
      auditBtn.disabled = false;
      if (auditIcon) auditIcon.classList.remove('leakage-spin');
      const open = issueData.filter(i => i.status !== 'Resolved').length;
      const t = document.createElement('div');
      t.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#0a2540;color:#fff;padding:12px 18px;border-radius:6px;font-size:13px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.2)';
      t.innerHTML = `<strong>Audit Complete</strong> — ${open} active issue${open !== 1 ? 's' : ''} detected`;
      document.body.appendChild(t); setTimeout(() => t.remove(), 4000);
    }, 2000);
  });

  // Event delegation for open/resolve
  view.addEventListener('click', e => {
    const openBtn = e.target.closest('[data-open-leakage]');
    if (openBtn) { openLeakageDrawer(openBtn.getAttribute('data-open-leakage')); return; }

    const resolveBtn = e.target.closest('[data-resolve-leakage]');
    if (resolveBtn) { resolveIssue(resolveBtn.getAttribute('data-resolve-leakage')); return; }

    const closeBtn = e.target.closest('[data-close-leakage-drawer]');
    if (closeBtn) {
      view.querySelector('#leakage-detail-overlay')?.classList.remove('active');
      view.querySelector('#leakage-detail-drawer')?.classList.remove('active');
    }
  });

  createIcons({ icons });
}

