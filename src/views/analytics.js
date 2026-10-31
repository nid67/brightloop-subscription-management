import { iconHtml, refreshIcons } from '../utils/icons.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { formatCurrency } from '../utils/currency.js';
import { api } from '../services/api.js';
import Chart from 'chart.js/auto';

let trendChart = null;
let planChart = null;

export function renderAnalyticsView(container) {
  const role = localStorage.getItem('brightloop_role') || 'ADMIN';
  const kpis = api.getKPIs();

  container.innerHTML = `
    <div class="app-shell">
      ${renderSidebar('analytics', { name: 'Admin User', role })}

      <main class="app-main">
        ${renderHeader('Revenue Analytics', role)}

        <div class="app-content">
          <div class="page-header">
            <div>
              <h1 class="page-title">Financial Analytics Workspace</h1>
              <p class="page-subtitle">Multi-dimensional MRR/ARR cohorts, retention metrics, and collection performance</p>
            </div>
            <!-- Date Filter Presets (Section 17) -->
            <div style="display:flex; align-items:center; gap:8px;">
              <select id="date-range-filter" class="form-select" style="width:auto; font-size:13px; font-weight:500;">
                <option value="7d">Last 7 days</option>
                <option value="30d" selected>Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="ytd">This year</option>
                <option value="custom">Custom date range</option>
              </select>
            </div>
          </div>

          <!-- Financial KPI Row -->
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">MRR (Monthly Run Rate)</div>
              <div class="kpi-value tabular-nums">${formatCurrency(kpis.mrr.value)}</div>
              <div class="kpi-sub">+12.4% vs previous period</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">ARR (Annual Run Rate)</div>
              <div class="kpi-value tabular-nums">${formatCurrency(kpis.arr.value)}</div>
              <div class="kpi-sub">Annualized recurring run-rate</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Net Retention Rate (NRR)</div>
              <div class="kpi-value tabular-nums" style="color:var(--success-text);">118.2%</div>
              <div class="kpi-sub">Expansion exceeds churn</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Gross Churn Rate</div>
              <div class="kpi-value tabular-nums">1.4%</div>
              <div class="kpi-sub">Below industry benchmark</div>
            </div>
          </div>

          <!-- Charts Grid -->
          <div style="display:grid; grid-template-columns: 2fr 1fr; gap:24px; margin-bottom:24px;">
            <div class="card">
              <div class="card-header">
                <span class="card-title">MRR Growth & Collection Trajectory</span>
                <span style="font-size:12px; color:var(--text-muted);">Monthly breakdown</span>
              </div>
              <div class="card-body">
                <div style="height:260px; position:relative;">
                  <canvas id="analytics-growth-chart"></canvas>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <span class="card-title">Revenue by Plan</span>
                <span style="font-size:12px; color:var(--text-muted);">Tier share</span>
              </div>
              <div class="card-body">
                <div style="height:220px; position:relative;">
                  <canvas id="analytics-plan-chart"></canvas>
                </div>
                <div style="display:flex; justify-content:space-around; margin-top:16px; font-size:12px;">
                  <span style="color:#635bff; font-weight:600;">● Enterprise (60%)</span>
                  <span style="color:#00d4b1; font-weight:600;">● Starter (30%)</span>
                  <span style="color:#ffb82e; font-weight:600;">● Growth (10%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  refreshIcons(container);

  // Initialize analytics charts
  const growthCanvas = container.querySelector('#analytics-growth-chart');
  if (growthCanvas) {
    if (trendChart) trendChart.destroy();
    const ctx = growthCanvas.getContext('2d');
    trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
        datasets: [
          {
            label: 'MRR Growth',
            data: [28000, 32000, 37000, 41000, 46000, 52000],
            borderColor: '#635bff',
            backgroundColor: 'rgba(99, 91, 255, 0.08)',
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: '#f0f3f7' } }
        }
      }
    });
  }

  const planCanvas = container.querySelector('#analytics-plan-chart');
  if (planCanvas) {
    if (planChart) planChart.destroy();
    const ctx2 = planCanvas.getContext('2d');
    planChart = new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: ['Enterprise', 'Starter', 'Growth'],
        datasets: [
          {
            data: [60, 30, 10],
            backgroundColor: ['#635bff', '#00d4b1', '#ffb82e'],
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: { legend: { display: false } }
      }
    });
  }
}
