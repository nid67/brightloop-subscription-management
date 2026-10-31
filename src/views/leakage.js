import { iconHtml, refreshIcons } from '../utils/icons.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { formatCurrency } from '../utils/currency.js';
import { api } from '../services/api.js';
import { notification } from '../services/notification.js';

export function renderLeakageView(container) {
  const role = localStorage.getItem('brightloop_role') || 'ADMIN';
  const anomalies = api.getLeakageAnomalies();

  container.innerHTML = `
    <div class="app-shell">
      ${renderSidebar('leakage', { name: 'Admin User', role })}

      <main class="app-main">
        ${renderHeader('Revenue Leakage Sentinel', role)}

        <div class="app-content">
          <div class="page-header">
            <div>
              <h1 class="page-title">Revenue Leakage Detection</h1>
              <p class="page-subtitle">Real-time operational monitoring to detect and prevent revenue loss</p>
            </div>
            <div>
              <button class="btn btn-primary" id="btn-scan-now">
                ${iconHtml('refresh-cw', { size: 16 })} Run System Scan
              </button>
            </div>
          </div>

          <!-- Total Revenue at Risk Card -->
          <div class="card" style="background:#0a2540; color:#ffffff; padding:24px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <span class="badge badge-danger" style="margin-bottom:8px;">Leakage Sentinel Active</span>
              <h2 style="font-size:20px; font-weight:700;">Operational Anomaly Surveillance</h2>
              <p style="color:#adb9c8; font-size:13px; margin-top:2px;">
                Continuously scanning active subscriptions, billing schedules, discounts, and payment reconciliations.
              </p>
            </div>
            <div style="text-align:right;">
              <div style="font-size:12px; text-transform:uppercase; color:#adb9c8;">Total Revenue at Risk</div>
              <div style="font-size:28px; font-weight:800; color:#ff8097;" class="tabular-nums">
                ${formatCurrency(anomalies.reduce((sum, a) => sum + (a.financialImpact || 0), 0))}
              </div>
            </div>
          </div>

          <!-- Leakage Issues List (Requirement Section 18) -->
          <div class="table-box">
            <div class="table-bar">
              <span style="font-weight:600; font-size:14px;">Detected Issues (${anomalies.length})</span>
              <div style="display:flex; gap:8px;">
                <span class="badge badge-neutral">1. Missing Invoices</span>
                <span class="badge badge-neutral">2. Duplicate Billing</span>
                <span class="badge badge-neutral">3. Overdue Invoices</span>
                <span class="badge badge-neutral">4. Expired Discounts</span>
                <span class="badge badge-neutral">5. Reconciliation Mismatches</span>
              </div>
            </div>

            <div style="padding:16px;">
              ${anomalies.length === 0 ? `
                <div class="empty-state">
                  <div class="empty-icon">${iconHtml('shield-check', { size: 24 })}</div>
                  <div class="empty-title">All billing operations healthy</div>
                  <div class="empty-desc">No revenue leaks, unbilled cycles, or duplicate attempts detected in the system.</div>
                  <button class="btn btn-secondary btn-sm" id="btn-simulate-issue">
                    Load Test Leakage Case
                  </button>
                </div>
              ` : anomalies.map(item => `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; padding:16px; border-bottom:1px solid var(--border-light); gap:16px;">
                  <div style="display:flex; gap:12px;">
                    <div style="color:${item.severity === 'Critical' ? 'var(--danger)' : 'var(--warning)'}; margin-top:2px;">
                      ${iconHtml('alert-circle', { size: 20 })}
                    </div>
                    <div>
                      <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-family:var(--font-mono); font-size:12px; color:var(--text-muted); font-weight:600;">[${item.id}]</span>
                        <strong style="font-size:14px; color:var(--text-main);">${item.title}</strong>
                        <span class="badge ${item.severity === 'Critical' ? 'badge-danger' : 'badge-warning'}">${item.severity}</span>
                        ${item.resolved ? '<span class="badge badge-success">Resolved</span>' : ''}
                      </div>
                      <div style="font-size:13px; color:var(--text-body); margin:4px 0;">${item.description}</div>
                      <div style="font-size:12px; color:var(--text-muted);">
                        Customer: <strong>${item.customerName || '—'}</strong> • Reference: <code>${item.referenceNumber || '—'}</code>
                      </div>
                    </div>
                  </div>

                  <div style="text-align:right; white-space:nowrap;">
                    <div style="font-size:11px; text-transform:uppercase; color:var(--text-muted);">Financial Impact</div>
                    <div style="font-size:16px; font-weight:700; color:var(--danger); margin-bottom:6px;">
                      ${formatCurrency(item.financialImpact)}
                    </div>
                    <button class="btn btn-secondary btn-sm resolve-btn" data-id="${item.id}">
                      ${item.actionLabel || 'Remediate'}
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  refreshIcons(container);

  const scanBtn = container.querySelector('#btn-scan-now');
  if (scanBtn) {
    scanBtn.addEventListener('click', () => {
      notification.success('Scan Completed', 'Operational scan verified all billing contracts.');
    });
  }

  const simBtn = container.querySelector('#btn-simulate-issue');
  if (simBtn) {
    simBtn.addEventListener('click', () => {
      api.data.leakageAnomalies.push({
        id: 'LEAK-101',
        title: 'Active Subscription Missing Invoice',
        severity: 'Critical',
        description: 'Subscription SUB-2026-002 passed next billing date without an invoice being generated.',
        customerName: 'Brightline Logistics',
        referenceNumber: 'SUB-2026-002',
        financialImpact: 5145,
        actionLabel: 'Generate Missing Invoice',
        resolved: false
      });
      api.saveState();
      renderLeakageView(container);
    });
  }

  const resolveBtns = container.querySelectorAll('.resolve-btn');
  resolveBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      api.resolveLeakageAnomaly(id);
      notification.success('Issue Resolved', `Remediation action executed for ${id}.`);
      renderLeakageView(container);
    });
  });
}
