/**
 * Module 06 — Subscription Health Monitoring
 * Health scores, risk levels, renewal tracking, status filters.
 */

import { createIcons, icons } from 'lucide';
import Chart from 'chart.js/auto';

const HEALTH_DATA = [
  { id: 'SUB-2026-001', customer: 'Acme Technologies Ltd', plan: 'Enterprise Growth', score: 96, status: 'Healthy', nextBilling: 'Nov 15, 2026', daysLeft: 15, paymentHistory: '12/12 on-time', risk: 'Very Low', mrr: 18500 },
  { id: 'SUB-2026-002', customer: 'Nexus Digital Media', plan: 'Core Platform', score: 78, status: 'Healthy', nextBilling: 'Dec 1, 2026', daysLeft: 31, paymentHistory: '10/12 on-time', risk: 'Low', mrr: 4999 },
  { id: 'SUB-2026-008', customer: 'DataVault Analytics', plan: 'Enterprise Growth', score: 44, status: 'At Risk', nextBilling: 'Nov 8, 2026', daysLeft: 8, paymentHistory: '7/12 on-time', risk: 'High', mrr: 18500 },
  { id: 'SUB-2026-014', customer: 'Horizon Cloud Labs', plan: 'Standard Business', score: 31, status: 'At Risk', nextBilling: 'Nov 5, 2026', daysLeft: 5, paymentHistory: '5/10 on-time', risk: 'Critical', mrr: 4999 },
  { id: 'SUB-2026-021', customer: 'Skyline Logistics', plan: 'Enterprise Growth', score: 82, status: 'Healthy', nextBilling: 'Nov 12, 2026', daysLeft: 12, paymentHistory: '9/10 on-time', risk: 'Low', mrr: 18500 },
  { id: 'SUB-2026-029', customer: 'TechBridge Solutions', plan: 'Starter', score: 60, status: 'Approaching Renewal', nextBilling: 'Nov 3, 2026', daysLeft: 3, paymentHistory: '4/6 on-time', risk: 'Medium', mrr: 2499 },
  { id: 'SUB-2026-033', customer: 'InfraCore Systems', plan: 'Core Platform', score: 0, status: 'Paused', nextBilling: 'Paused', daysLeft: null, paymentHistory: '6/8 on-time', risk: 'Medium', mrr: 4999 },
  { id: 'SUB-2026-041', customer: 'BlueSky Pharma', plan: 'Standard Business', score: 15, status: 'Pending Cancellation', nextBilling: 'Nov 30, 2026', daysLeft: 30, paymentHistory: '2/6 on-time', risk: 'Critical', mrr: 4999 }
];

let healthChart = null;
let healthFilter = 'all';
let healthSearch = '';

function scoreColor(s) {
  if (s >= 80) return 'excellent';
  if (s >= 60) return 'good';
  if (s >= 40) return 'fair';
  return 'poor';
}

function scoreBadge(s) {
  const cls = { excellent: 'badge-success', good: 'badge-info', fair: 'badge-warning', poor: 'badge-danger' }[scoreColor(s)];
  return `<span class="badge ${cls}">${s}/100</span>`;
}

function riskBadge(r) {
  const map = { 'Very Low': 'badge-success', 'Low': 'badge-info', 'Medium': 'badge-warning', 'High': 'badge-danger', 'Critical': 'badge-danger' };
  return `<span class="badge ${map[r] || 'badge-neutral'}">${r}</span>`;
}

function statusBadge(s) {
  const map = { 'Healthy': 'badge-success', 'Approaching Renewal': 'badge-warning', 'At Risk': 'badge-danger', 'Paused': 'badge-neutral', 'Pending Cancellation': 'badge-danger', 'Failed Renewal': 'badge-danger' };
  return `<span class="badge ${map[s] || 'badge-neutral'}">${s}</span>`;
}

function fmt(n) { return '₹' + n.toLocaleString('en-IN'); }

function renderHealthKPIs() {
  const counts = { Healthy: 0, 'Approaching Renewal': 0, 'At Risk': 0, Paused: 0, 'Pending Cancellation': 0, 'Failed Renewal': 0 };
  HEALTH_DATA.forEach(s => { if (counts[s.status] !== undefined) counts[s.status]++; });
  const el = document.getElementById('health-kpi-strip');
  if (!el) return;
  el.innerHTML = `
    <div class="kpi-card"><div class="kpi-header"><span class="kpi-label">Healthy</span><i data-lucide="heart" class="kpi-icon"></i></div><div class="kpi-value" style="color:var(--success)">${counts.Healthy}</div></div>
    <div class="kpi-card"><div class="kpi-header"><span class="kpi-label">Approaching Renewal</span><i data-lucide="clock" class="kpi-icon"></i></div><div class="kpi-value" style="color:var(--warning)">${counts['Approaching Renewal']}</div></div>
    <div class="kpi-card"><div class="kpi-header"><span class="kpi-label">At Risk</span><i data-lucide="alert-triangle" class="kpi-icon"></i></div><div class="kpi-value" style="color:var(--danger)">${counts['At Risk']}</div></div>
    <div class="kpi-card"><div class="kpi-header"><span class="kpi-label">Paused</span><i data-lucide="pause-circle" class="kpi-icon"></i></div><div class="kpi-value">${counts.Paused}</div></div>
    <div class="kpi-card"><div class="kpi-header"><span class="kpi-label">Pending Cancel</span><i data-lucide="x-circle" class="kpi-icon"></i></div><div class="kpi-value" style="color:var(--danger)">${counts['Pending Cancellation']}</div></div>
    <div class="kpi-card"><div class="kpi-header"><span class="kpi-label">Failed Renewal</span><i data-lucide="x-octagon" class="kpi-icon"></i></div><div class="kpi-value">${counts['Failed Renewal']}</div></div>`;
}

function renderHealthChart() {
  if (healthChart) { try { healthChart.destroy(); } catch(e) {} }
  const canvas = document.getElementById('health-distribution-chart');
  if (!canvas) return;
  const counts = [3, 1, 2, 1, 1, 0];
  healthChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Healthy', 'Approaching Renewal', 'At Risk', 'Paused', 'Pending Cancel', 'Failed'],
      datasets: [{ data: counts, backgroundColor: ['#00875a', '#b76e00', '#df1b41', '#8898aa', '#df1b41', '#425466'], borderWidth: 2, borderColor: '#fff' }]
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 11 }, usePointStyle: true, boxWidth: 8, padding: 10 } } } }
  });
}

function filteredHealth() {
  return HEALTH_DATA.filter(s => {
    const matchSearch = !healthSearch || [s.id, s.customer, s.plan].some(v => v.toLowerCase().includes(healthSearch.toLowerCase()));
    const matchFilter = healthFilter === 'all' || s.status === healthFilter;
    return matchSearch && matchFilter;
  });
}

function renderHealthTable() {
  const tbody = document.getElementById('health-tbody');
  if (!tbody) return;
  const data = filteredHealth();
  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted)">No subscriptions match your filters</td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(s => `
    <tr>
      <td>${s.customer}</td>
      <td class="mono-text">${s.id}</td>
      <td>${s.plan}</td>
      <td>
        <div class="health-score-bar-wrap">
          <div class="health-score-bar">
            <div class="health-score-fill ${scoreColor(s.score)}" style="width:${s.score}%"></div>
          </div>
          ${scoreBadge(s.score)}
        </div>
      </td>
      <td>${statusBadge(s.status)}</td>
      <td>${s.nextBilling}</td>
      <td>${s.daysLeft !== null ? `<span class="badge ${s.daysLeft <= 7 ? 'badge-danger' : s.daysLeft <= 14 ? 'badge-warning' : 'badge-neutral'}">${s.daysLeft}d</span>` : '—'}</td>
      <td style="font-size:12px">${s.paymentHistory}</td>
      <td>${riskBadge(s.risk)}</td>
    </tr>`).join('');
}

export function initHealth() {
  const view = document.getElementById('view-health');
  if (!view) return;

  view.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h2>Subscription Health Monitor</h2>
        <p>Proactive retention scoring, renewal tracking and early churn warnings</p>
      </div>
      <div class="header-actions">
        <span class="demo-data-notice"><i data-lucide="info" style="width:12px;height:12px"></i> Demo data</span>
      </div>
    </div>

    <!-- KPI Strip -->
    <div class="health-kpi-strip" id="health-kpi-strip"></div>

    <!-- Chart + Legend -->
    <div class="health-chart-panel">
      <div class="card" style="margin-bottom:0">
        <div class="card-header"><div class="card-title">Health Distribution</div></div>
        <div class="card-body"><canvas id="health-distribution-chart" height="240"></canvas></div>
      </div>
      <div class="card" style="margin-bottom:0">
        <div class="card-header"><div class="card-title">Score Reference</div></div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:12px">
            <div style="display:flex;align-items:center;gap:10px"><div style="width:12px;height:12px;border-radius:3px;background:var(--success);flex-shrink:0"></div><div><strong>80–100 Excellent</strong><div style="font-size:12px;color:var(--text-secondary)">High engagement, on-time payments, upsell candidate</div></div></div>
            <div style="display:flex;align-items:center;gap:10px"><div style="width:12px;height:12px;border-radius:3px;background:var(--info);flex-shrink:0"></div><div><strong>60–79 Good</strong><div style="font-size:12px;color:var(--text-secondary)">Stable account, minor payment delays, monitor renewal</div></div></div>
            <div style="display:flex;align-items:center;gap:10px"><div style="width:12px;height:12px;border-radius:3px;background:var(--warning);flex-shrink:0"></div><div><strong>40–59 Fair</strong><div style="font-size:12px;color:var(--text-secondary)">Declining activity, consider outreach before renewal</div></div></div>
            <div style="display:flex;align-items:center;gap:10px"><div style="width:12px;height:12px;border-radius:3px;background:var(--danger);flex-shrink:0"></div><div><strong>0–39 At Risk</strong><div style="font-size:12px;color:var(--text-secondary)">High churn probability — immediate retention action needed</div></div></div>
          </div>
        </div>
      </div>
    </div>
    <div style="margin-bottom:20px"></div>

    <!-- Table -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">Subscriber Health Scores</div>
      </div>
      <div class="filter-bar">
        <div class="filter-left">
          <div class="search-box" style="width:260px">
            <i data-lucide="search"></i>
            <input type="text" id="health-search" placeholder="Search customer, subscription...">
          </div>
        </div>
        <div class="filter-right">
          <select id="health-status-filter" class="form-select">
            <option value="all">All Statuses</option>
            <option value="Healthy">Healthy</option>
            <option value="Approaching Renewal">Approaching Renewal</option>
            <option value="At Risk">At Risk</option>
            <option value="Paused">Paused</option>
            <option value="Pending Cancellation">Pending Cancellation</option>
          </select>
        </div>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr><th>Customer</th><th>Sub ID</th><th>Plan</th><th>Health Score</th><th>Status</th><th>Next Billing</th><th>Days Left</th><th>Payment History</th><th>Risk Level</th></tr>
          </thead>
          <tbody id="health-tbody"></tbody>
        </table>
      </div>
    </div>

    <div class="demo-data-notice">
      <i data-lucide="info" style="width:12px;height:12px"></i>
      All health scores above are demonstration data. Connect the health scoring API for live churn predictions.
    </div>`;

  renderHealthKPIs();
  renderHealthChart();
  renderHealthTable();

  view.querySelector('#health-search')?.addEventListener('input', e => {
    healthSearch = e.target.value;
    renderHealthTable();
  });

  view.querySelector('#health-status-filter')?.addEventListener('change', e => {
    healthFilter = e.target.value;
    renderHealthTable();
  });

  createIcons({ icons });
}

