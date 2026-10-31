/**
 * Module 06 — Revenue Analytics
 * Full analytics workspace with date filters, multiple charts, KPIs, export.
 */

import { createIcons, icons } from 'lucide';
import Chart from 'chart.js/auto';

// ── Demo data sets per period ─────────────────────────────────────────────────
const ANALYTICS_DATA = {
  '7d':  { mrr: 245000, arr: 2940000, collected: 210500, outstanding: 34500, growth: 12.4, newSubs: 8,  churned: 1, renewals: 14, nrr: 114.2, arpu: 1914, ltv: 144700, churnRate: 0.8 },
  '30d': { mrr: 238000, arr: 2856000, collected: 198000, outstanding: 40000, growth: 9.1,  newSubs: 22, churned: 3, renewals: 52, nrr: 112.6, arpu: 1869, ltv: 141200, churnRate: 1.2 },
  '90d': { mrr: 220000, arr: 2640000, collected: 185000, outstanding: 35000, growth: 6.3,  newSubs: 58, churned: 9, renewals: 144, nrr: 110.1, arpu: 1739, ltv: 138000, churnRate: 1.8 },
  'yr':  { mrr: 195000, arr: 2340000, collected: 165000, outstanding: 30000, growth: 4.2,  newSubs: 94, churned: 18, renewals: 492, nrr: 108.4, arpu: 1615, ltv: 133000, churnRate: 2.3 }
};

const CHART_LABELS = {
  '7d':  ['Oct 25', 'Oct 26', 'Oct 27', 'Oct 28', 'Oct 29', 'Oct 30', 'Oct 31'],
  '30d': ['Oct 2', 'Oct 8', 'Oct 14', 'Oct 20', 'Oct 26', 'Oct 31', 'Nov'],
  '90d': ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
  'yr':  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
};

const COLLECTION_DATA = {
  '7d':  [28000, 34000, 12000, 46000, 38000, 29000, 23500],
  '30d': [28000, 34000, 42000, 38000, 46000, 29000, 23500],
  '90d': [62000, 74000, 68000, 85000, 79000, 91000, 82000],
  'yr':  [165000, 178000, 192000, 185000, 201000, 215000, 210000, 225000, 218000, 232000, 245000, 260000]
};

let analyticsCharts = {};

function destroyCharts() {
  Object.values(analyticsCharts).forEach(c => { try { c.destroy(); } catch(e) {} });
  analyticsCharts = {};
}

function fmt(n) { return '₹' + n.toLocaleString('en-IN'); }

function renderAnalyticsKPIs(period) {
  const d = ANALYTICS_DATA[period];
  const el = document.getElementById('analytics-kpi-strip');
  if (!el) return;
  el.innerHTML = `
    <div class="kpi-card">
      <div class="kpi-header"><span class="kpi-label">MRR</span><i data-lucide="trending-up" class="kpi-icon"></i></div>
      <div class="kpi-value">${fmt(d.mrr)}</div>
      <div class="kpi-trend"><span class="trend-up">+${d.growth}%</span><span class="trend-sub">growth</span></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-header"><span class="kpi-label">ARR</span><i data-lucide="calendar" class="kpi-icon"></i></div>
      <div class="kpi-value">${fmt(d.arr)}</div>
      <div class="kpi-trend"><span class="trend-up">+${(d.growth * 1.14).toFixed(1)}%</span><span class="trend-sub">YoY pace</span></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-header"><span class="kpi-label">Revenue Collected</span><i data-lucide="check-circle-2" class="kpi-icon"></i></div>
      <div class="kpi-value">${fmt(d.collected)}</div>
      <div class="kpi-trend"><span class="trend-up">${Math.round(d.collected / d.mrr * 100)}%</span><span class="trend-sub">collection rate</span></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-header"><span class="kpi-label">Outstanding</span><i data-lucide="clock" class="kpi-icon"></i></div>
      <div class="kpi-value">${fmt(d.outstanding)}</div>
      <div class="kpi-trend"><span class="trend-sub">pending collection</span></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-header"><span class="kpi-label">New Subscriptions</span><i data-lucide="plus-circle" class="kpi-icon"></i></div>
      <div class="kpi-value">${d.newSubs}</div>
      <div class="kpi-trend"><span class="trend-up">+${d.newSubs}</span><span class="trend-sub">this period</span></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-header"><span class="kpi-label">Churned</span><i data-lucide="user-x" class="kpi-icon"></i></div>
      <div class="kpi-value" style="color:var(--danger)">${d.churned}</div>
      <div class="kpi-trend"><span class="trend-down">${d.churnRate}%</span><span class="trend-sub">churn rate</span></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-header"><span class="kpi-label">Renewals</span><i data-lucide="refresh-cw" class="kpi-icon"></i></div>
      <div class="kpi-value">${d.renewals}</div>
      <div class="kpi-trend"><span class="trend-sub">completed this period</span></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-header"><span class="kpi-label">NRR</span><i data-lucide="activity" class="kpi-icon"></i></div>
      <div class="kpi-value">${d.nrr}%</div>
      <div class="kpi-trend"><span class="trend-up">Healthy</span><span class="trend-sub">net retention</span></div>
    </div>`;
}

function renderAnalyticsCharts(period) {
  destroyCharts();
  const labels = CHART_LABELS[period];
  const collData = COLLECTION_DATA[period];

  // Revenue by Product (bar)
  const prodCanvas = document.getElementById('analytics-product-chart');
  if (prodCanvas) {
    analyticsCharts.prod = new Chart(prodCanvas, {
      type: 'bar',
      data: {
        labels: ['Brightloop Core', 'Billing Engine', 'Analytics Suite', 'Portal Module', 'Compliance Pack'],
        datasets: [{ label: 'Revenue (₹)', data: [98000, 72000, 45000, 22000, 13000], backgroundColor: ['#635bff', '#00d4ff', '#00875a', '#b76e00', '#8898aa'], borderRadius: 4 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: '#f0f2f5' }, ticks: { font: { family: 'Inter', size: 11 }, color: '#8898aa', callback: v => '₹' + (v/1000) + 'k' } },
          y: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 12 }, color: '#425466' } }
        }
      }
    });
  }

  // Revenue by Plan (doughnut)
  const planCanvas = document.getElementById('analytics-plan-revenue-chart');
  if (planCanvas) {
    analyticsCharts.plan = new Chart(planCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Enterprise Growth', 'Standard Business', 'Core Platform', 'Starter'],
        datasets: [{ data: [118200, 69985, 49996, 9996], backgroundColor: ['#635bff', '#00d4ff', '#00875a', '#8898aa'], borderWidth: 2, borderColor: '#fff' }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 11 }, usePointStyle: true, boxWidth: 8, padding: 10 } } } }
    });
  }

  // Payment Collection Trend (line)
  const collCanvas = document.getElementById('analytics-collection-chart');
  if (collCanvas) {
    analyticsCharts.coll = new Chart(collCanvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{ label: 'Revenue Collected (₹)', data: collData, borderColor: '#00875a', backgroundColor: 'rgba(0,135,90,0.07)', fill: true, tension: 0.3, borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#00875a' }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { family: 'Inter', size: 12 }, usePointStyle: true, boxWidth: 8 } } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 }, color: '#8898aa' } },
          y: { grid: { color: '#f0f2f5' }, ticks: { font: { family: 'Inter', size: 11 }, color: '#8898aa', callback: v => '₹' + (v/1000) + 'k' } }
        }
      }
    });
  }

  // Customer Segment (bar)
  const segCanvas = document.getElementById('analytics-segment-chart');
  if (segCanvas) {
    analyticsCharts.seg = new Chart(segCanvas, {
      type: 'bar',
      data: {
        labels: ['Enterprise (>₹15k/mo)', 'Mid-Market (₹5k-15k)', 'SMB (₹2k-5k)', 'Starter (<₹2k)'],
        datasets: [
          { label: 'Revenue Share', data: [118200, 82000, 34985, 13000], backgroundColor: ['#635bff', '#00d4ff', '#00875a', '#8898aa'], borderRadius: 4 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 }, color: '#8898aa' } },
          y: { grid: { color: '#f0f2f5' }, ticks: { font: { family: 'Inter', size: 11 }, color: '#8898aa', callback: v => '₹' + (v/1000) + 'k' } }
        }
      }
    });
  }
}

function exportAnalytics(period) {
  const d = ANALYTICS_DATA[period];
  const rows = [['Metric','Value'],['MRR',d.mrr],['ARR',d.arr],['Revenue Collected',d.collected],['Outstanding',d.outstanding],['Revenue Growth %',d.growth],['New Subscriptions',d.newSubs],['Churned',d.churned],['Renewals',d.renewals],['NRR %',d.nrr],['ARPU',d.arpu],['LTV',d.ltv]];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `analytics-${period}.csv`; a.click();
}

export function initAnalytics() {
  const view = document.getElementById('view-analytics');
  if (!view) return;

  view.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h2>Revenue Analytics &amp; Financial Intelligence</h2>
        <p>In-depth cohort analysis, NRR, ARR trajectory and collection trends</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary btn-sm" id="analytics-export-btn"><i data-lucide="download"></i> Export CSV</button>
      </div>
    </div>

    <div class="dash-filter-bar">
      <div class="dash-period-pills" id="analytics-period-pills">
        <button class="dash-period-pill active" data-period="7d">Last 7 Days</button>
        <button class="dash-period-pill" data-period="30d">Last 30 Days</button>
        <button class="dash-period-pill" data-period="90d">Last 90 Days</button>
        <button class="dash-period-pill" data-period="yr">This Year</button>
      </div>
      <div class="analytics-date-custom" id="analytics-custom-range">
        <label class="form-label" style="margin:0">From</label>
        <input type="date" class="form-input" id="analytics-date-from">
        <label class="form-label" style="margin:0">To</label>
        <input type="date" class="form-input" id="analytics-date-to">
      </div>
      <span class="demo-data-notice"><i data-lucide="info" style="width:12px;height:12px"></i> Demo data</span>
    </div>

    <!-- KPI Strip -->
    <div class="analytics-kpi-strip" id="analytics-kpi-strip"></div>

    <!-- Charts Row 1: Product Revenue + Plan Split -->
    <div class="analytics-charts-row">
      <div class="card" style="margin-bottom:0">
        <div class="card-header"><div class="card-title">Revenue by Product</div><div class="card-subtitle">Top revenue-generating products this period</div></div>
        <div class="card-body"><canvas id="analytics-product-chart" height="260"></canvas></div>
      </div>
      <div class="card" style="margin-bottom:0">
        <div class="card-header"><div class="card-title">Revenue by Plan</div><div class="card-subtitle">MRR distribution by subscription tier</div></div>
        <div class="card-body"><canvas id="analytics-plan-revenue-chart" height="260"></canvas></div>
      </div>
    </div>
    <div style="margin-bottom:20px"></div>

    <!-- Charts Row 2: Collection Trend + Segment -->
    <div class="analytics-charts-row-3">
      <div class="card" style="margin-bottom:0">
        <div class="card-header"><div class="card-title">Payment Collection Trend</div><div class="card-subtitle">Revenue collected over selected period</div></div>
        <div class="card-body"><canvas id="analytics-collection-chart" height="220"></canvas></div>
      </div>
      <div class="card" style="margin-bottom:0">
        <div class="card-header"><div class="card-title">Revenue by Customer Segment</div><div class="card-subtitle">MRR grouped by account size tier</div></div>
        <div class="card-body"><canvas id="analytics-segment-chart" height="220"></canvas></div>
      </div>
    </div>
    <div style="margin-bottom:20px"></div>

    <div class="demo-data-notice" style="margin-bottom:0">
      <i data-lucide="info" style="width:12px;height:12px"></i>
      All figures above are demonstration data for evaluation purposes. Connect the analytics API to display live financial data.
    </div>`;

  let activePeriod = '7d';

  view.querySelectorAll('.dash-period-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      view.querySelectorAll('.dash-period-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activePeriod = pill.dataset.period;
      renderAnalyticsKPIs(activePeriod);
      renderAnalyticsCharts(activePeriod);
      createIcons({ icons });
    });
  });

  view.querySelector('#analytics-export-btn')?.addEventListener('click', () => exportAnalytics(activePeriod));

  renderAnalyticsKPIs(activePeriod);
  renderAnalyticsCharts(activePeriod);
  createIcons({ icons });
}

