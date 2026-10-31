import { iconHtml, refreshIcons } from '../utils/icons.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { formatCurrency } from '../utils/currency.js';
import { api } from '../services/api.js';
import Chart from 'chart.js/auto';

let chartInstance = null;

export function renderDashboardView(container) {
  const role = localStorage.getItem('brightloop_role') || 'ADMIN';
  const kpiData = api.getKPIs();
  const leakageItems = api.getLeakageAnomalies();
  const subscriptions = api.getSubscriptions();
  const invoices = api.getInvoices();

  container.innerHTML = `
    <div class="app-shell">
      ${renderSidebar('dashboard', { name: role === 'ADMIN' ? 'Alexander Wright' : 'Operations Staff', role })}

      <main class="app-main">
        ${renderHeader('Dashboard', role)}

        <div class="app-content">
          <div class="page-header">
            <div>
              <h1 class="page-title">Revenue Operations Command Center</h1>
              <p class="page-subtitle">Centralized subscription telemetry, recurring billing, and leakage guard</p>
            </div>
            <div>
              <button class="btn btn-primary" onclick="window.location.hash='#/subscriptions'">
                ${iconHtml('plus', { size: 16 })} New Subscription
              </button>
            </div>
          </div>

          <!-- 7 KPI Cards (Requirement Section 7) -->
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">Monthly Recurring Revenue (MRR)</div>
              <div class="kpi-value tabular-nums">${formatCurrency(kpiData.mrr.value)}</div>
              <div class="kpi-sub">Contracted recurring monthly run-rate</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-label">Annual Recurring Revenue (ARR)</div>
              <div class="kpi-value tabular-nums">${formatCurrency(kpiData.arr.value)}</div>
              <div class="kpi-sub">Annualized run-rate (12x MRR)</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-label">Active Subscriptions</div>
              <div class="kpi-value tabular-nums">${kpiData.activeSubscriptions.value}</div>
              <div class="kpi-sub">Total active customer contracts</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-label">Total Customers</div>
              <div class="kpi-value tabular-nums">${kpiData.totalCustomers.value}</div>
              <div class="kpi-sub">Registered client accounts</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-label">Revenue Collected</div>
              <div class="kpi-value tabular-nums">${formatCurrency(kpiData.revenueCollected.value)}</div>
              <div class="kpi-sub">Settled and reconciled payments</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-label">Outstanding Revenue</div>
              <div class="kpi-value tabular-nums">${formatCurrency(kpiData.outstandingRevenue.value)}</div>
              <div class="kpi-sub">Awaiting customer payment</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-label">Overdue Invoices</div>
              <div class="kpi-value tabular-nums" style="color:var(--danger);">${kpiData.overdueInvoices.value}</div>
              <div class="kpi-sub">Exceeded invoice payment term</div>
            </div>
          </div>

          <!-- Revenue Analytics Chart -->
          <div class="card" style="margin-bottom: 24px;">
            <div class="card-header">
              <span class="card-title">Revenue Trajectory & Billing Trends</span>
              <span style="font-size:12px; color:var(--text-muted);">Real-time chart visualization</span>
            </div>
            <div class="card-body">
              <div style="height: 240px; position:relative;">
                <canvas id="dashboard-chart"></canvas>
              </div>
            </div>
          </div>

          <!-- Revenue Leakage Alerts (Signature Differentiator) -->
          <div class="card" style="margin-bottom: 24px;">
            <div class="card-header">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="color:var(--danger);">${iconHtml('shield-alert', { size: 18 })}</span>
                <span class="card-title">Revenue Leakage Sentinel Alerts</span>
              </div>
              <a href="#/leakage" class="btn btn-secondary btn-sm">View All Sentinel Issues</a>
            </div>
            <div class="card-body" style="padding:16px;">
              ${leakageItems.length === 0 ? `
                <div style="padding:20px; text-align:center; color:var(--text-muted); font-size:13.5px;">
                  No revenue leaks detected. All billing schedules and discounts are operating normally.
                </div>
              ` : leakageItems.slice(0, 3).map(item => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid var(--border-light);">
                  <div>
                    <div style="display:flex; align-items:center; gap:6px;">
                      <span class="badge ${item.severity === 'Critical' ? 'badge-danger' : 'badge-warning'}">${item.severity}</span>
                      <strong style="color:var(--text-main); font-size:13.5px;">${item.title}</strong>
                    </div>
                    <div style="color:var(--text-muted); font-size:12.5px; margin-top:2px;">${item.description}</div>
                  </div>
                  <div style="text-align:right;">
                    <div style="font-weight:700; color:var(--danger);">${formatCurrency(item.financialImpact)}</div>
                    <button class="btn btn-subtle btn-sm" onclick="window.location.hash='#/leakage'">Review</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Operational Overview Lists -->
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px;">
            <div class="card">
              <div class="card-header">
                <span class="card-title">Recent Subscriptions</span>
                <a href="#/subscriptions" style="font-size:12px;">See all</a>
              </div>
              <div class="card-body" style="padding:0;">
                ${subscriptions.length === 0 ? `
                  <div class="empty-state">
                    <div class="empty-title">No subscriptions created yet</div>
                    <div class="empty-desc">Contract data will appear here once subscriptions are created.</div>
                    <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#/subscriptions'">
                      Create Subscription
                    </button>
                  </div>
                ` : `
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Subscription #</th>
                        <th>Customer</th>
                        <th>Status</th>
                        <th style="text-align:right;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${subscriptions.slice(0, 5).map(s => `
                        <tr>
                          <td><strong>${s.subscriptionNumber}</strong></td>
                          <td>${s.customerName}</td>
                          <td><span class="badge badge-success">${s.status}</span></td>
                          <td style="text-align:right; font-weight:600;">${formatCurrency(s.totalAmount)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                `}
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <span class="card-title">Recent Invoices</span>
                <a href="#/invoices" style="font-size:12px;">See all</a>
              </div>
              <div class="card-body" style="padding:0;">
                ${invoices.length === 0 ? `
                  <div class="empty-state">
                    <div class="empty-title">No invoices generated yet</div>
                    <div class="empty-desc">Invoices generated from billing cycles will be tracked here.</div>
                    <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#/invoices'">
                      Generate Invoice
                    </button>
                  </div>
                ` : `
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Customer</th>
                        <th>Status</th>
                        <th style="text-align:right;">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${invoices.slice(0, 5).map(inv => `
                        <tr>
                          <td><strong>${inv.invoiceNumber}</strong></td>
                          <td>${inv.customerName}</td>
                          <td><span class="badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-danger'}">${inv.status}</span></td>
                          <td style="text-align:right; font-weight:600;">${formatCurrency(inv.totalAmount)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                `}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  refreshIcons(container);

  // Initialize revenue chart
  const canvas = container.querySelector('#dashboard-chart');
  if (canvas) {
    if (chartInstance) chartInstance.destroy();
    const ctx = canvas.getContext('2d');
    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
        datasets: [
          {
            label: 'Collected Revenue',
            data: [24000, 31000, 38000, 42000, 47000, 52000],
            backgroundColor: '#635bff',
            borderRadius: 4
          },
          {
            label: 'Outstanding Invoices',
            data: [4000, 5000, 6000, 4500, 5200, 3800],
            backgroundColor: '#ffb82e',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, font: { family: 'Inter', size: 12 } } }
        },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: '#f0f3f7' } }
        }
      }
    });
  }

  // Role Pill Switcher
  const pill = container.querySelector('#role-toggle-pill');
  if (pill) {
    pill.addEventListener('click', () => {
      const nextRole = role === 'ADMIN' ? 'STAFF' : role === 'STAFF' ? 'CUSTOMER' : 'ADMIN';
      localStorage.setItem('brightloop_role', nextRole);
      renderDashboardView(container);
    });
  }
}
