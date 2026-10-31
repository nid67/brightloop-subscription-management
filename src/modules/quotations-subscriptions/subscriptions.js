import { quoteSubService } from './data-service.js';
import { showToast } from '../customer-product-plan/toast.js';
import { createIcons, icons } from 'lucide';

export class SubscriptionModule {
  constructor() {
    this.searchQuery = '';
    this.statusFilter = '';
    this.frequencyFilter = '';
    this.activeSubId = null;

    this.container = document.getElementById('view-subscriptions');
    if (!this.container) return;

    this.init();
  }

  init() {
    this.renderLayout();
    this.bindEvents();
    this.loadData();
    quoteSubService.subscribe(() => {
      this.loadData();
      if (this.activeSubId) {
        this.renderSubDrawer(this.activeSubId);
      }
    });
  }

  renderLayout() {
    this.container.innerHTML = `
      <div class="page-header">
        <div class="page-title">
          <h2>Subscription Lifecycle Management</h2>
          <p>Manage recurring contract stages, trial periods, pause requests, renewals, and billing schedules</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary btn-sm" id="sub-refresh-btn">
            <i data-lucide="rotate-cw"></i> Refresh
          </button>
          <button class="btn btn-primary" id="sub-new-btn">
            <i data-lucide="plus"></i> New Subscription
          </button>
        </div>
      </div>

      <!-- Lifecycle Stage Indicator -->
      <div class="card" style="padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
        <span style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">Subscription Lifecycle Stages:</span>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <span class="badge badge-neutral">1. Pending</span>
          <span class="badge badge-info">2. Trial</span>
          <span class="badge badge-success">3. Active</span>
          <span class="badge badge-warning">4. Paused</span>
          <span class="badge badge-danger">5. Cancelled / Expired</span>
        </div>
      </div>

      <div class="card">
        <div class="filter-bar">
          <div class="filter-left">
            <div style="position: relative; width: 300px;">
              <input type="text" id="sub-search-input" class="form-input" placeholder="Search subscription #, customer, plan..." style="width: 100%; padding-left: 32px;" />
              <i data-lucide="search" style="position: absolute; left: 10px; top: 9px; width: 14px; height: 14px; color: var(--text-muted);"></i>
            </div>
            <select id="sub-status-filter" class="form-select">
              <option value="">All Stages</option>
              <option value="Active">Active</option>
              <option value="Trial">Trial</option>
              <option value="Paused">Paused</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Expired">Expired</option>
            </select>
            <select id="sub-frequency-filter" class="form-select">
              <option value="">All Frequencies</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
          <div class="filter-right">
            <button class="btn btn-secondary btn-sm" id="sub-export-csv">
              <i data-lucide="download"></i> Export Subscriptions
            </button>
          </div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Subscription ID</th>
                <th>Customer</th>
                <th>Plan & Product</th>
                <th>Cadence</th>
                <th>Next Billing Date</th>
                <th>Recurring Amount</th>
                <th>Lifecycle Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody id="sub-table-body">
              <!-- Dynamically populated -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Lifecycle Detail Drawer -->
      <div id="sub-lifecycle-overlay" class="drawer-overlay"></div>
      <div id="sub-lifecycle-drawer" class="drawer-panel" style="width: 520px; max-width: 90vw;">
        <div class="drawer-header">
          <div>
            <div style="font-size: 16px; font-weight: 600;" id="drawer-sub-id">SUB-2026-000</div>
            <div style="font-size: 12px; color: var(--text-muted);" id="drawer-sub-cust">Customer Name</div>
          </div>
          <button class="modal-close" id="drawer-sub-close">&times;</button>
        </div>
        <div class="drawer-body" id="drawer-sub-body">
          <!-- Dynamic Lifecycle Details -->
        </div>
      </div>
    `;

    createIcons({ icons });
  }

  bindEvents() {
    this.container.querySelector('#sub-search-input')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.loadData();
    });

    this.container.querySelector('#sub-status-filter')?.addEventListener('change', (e) => {
      this.statusFilter = e.target.value;
      this.loadData();
    });

    this.container.querySelector('#sub-frequency-filter')?.addEventListener('change', (e) => {
      this.frequencyFilter = e.target.value;
      this.loadData();
    });

    this.container.querySelector('#sub-refresh-btn')?.addEventListener('click', () => {
      this.loadData();
      showToast('Subscriptions list refreshed', 'info');
    });

    this.container.querySelector('#sub-export-csv')?.addEventListener('click', () => {
      this.exportCSV();
    });

    this.container.querySelector('#sub-new-btn')?.addEventListener('click', () => {
      // Suggest creating quotation first or route to quotation
      const quoteNav = document.querySelector('.nav-link[data-view="quotations"]');
      if (quoteNav) {
        quoteNav.click();
        const newQuoteBtn = document.getElementById('quote-add-btn');
        if (newQuoteBtn) newQuoteBtn.click();
      }
    });

    this.container.querySelector('#drawer-sub-close')?.addEventListener('click', () => this.closeSubDrawer());
    this.container.querySelector('#sub-lifecycle-overlay')?.addEventListener('click', () => this.closeSubDrawer());
  }

  loadData() {
    const list = quoteSubService.getSubscriptions({
      search: this.searchQuery,
      status: this.statusFilter,
      frequency: this.frequencyFilter
    });

    const tbody = this.container.querySelector('#sub-table-body');
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="empty-state-container">
              <i data-lucide="repeat" class="empty-state-icon"></i>
              <div class="empty-state-title">No subscriptions found</div>
              <div class="empty-state-subtitle">No subscriptions match your query. Convert accepted quotations to create subscriptions.</div>
              <button class="btn btn-secondary btn-sm" id="sub-clear-filter-btn">Clear Filters</button>
            </div>
          </td>
        </tr>
      `;
      tbody.querySelector('#sub-clear-filter-btn')?.addEventListener('click', () => {
        this.searchQuery = '';
        this.statusFilter = '';
        this.frequencyFilter = '';
        const s = this.container.querySelector('#sub-search-input');
        if (s) s.value = '';
        const st = this.container.querySelector('#sub-status-filter');
        if (st) st.value = '';
        const f = this.container.querySelector('#sub-frequency-filter');
        if (f) f.value = '';
        this.loadData();
      });
      createIcons({ icons });
      return;
    }

    tbody.innerHTML = list.map(s => {
      const statusBadge = this.getStatusBadge(s.status);
      const isPaused = s.status === 'Paused';

      return `
        <tr>
          <td class="mono-text"><strong>${s.subscriptionNumber}</strong></td>
          <td>
            <strong>${s.customerName}</strong>
            <div style="font-size: 11px; color: var(--text-muted);">${s.customerEmail}</div>
          </td>
          <td>
            <div>${s.planName}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${s.productName}</div>
          </td>
          <td><span class="badge badge-neutral">${s.billingFrequency}</span></td>
          <td class="mono-text">
            <strong>${s.nextBillingDate}</strong>
            ${isPaused && s.pauseResumeDate ? `<div style="font-size: 10px; color: var(--warning);">Paused till ${s.pauseResumeDate}</div>` : ''}
          </td>
          <td class="mono-text">
            <strong>₹ ${(s.recurringAmount || 0).toLocaleString('en-IN')}</strong>
            <span style="font-size: 11px; color: var(--text-muted);">/ ${s.billingFrequency.toLowerCase()}</span>
          </td>
          <td>${statusBadge}</td>
          <td style="text-align: right;">
            <button class="btn btn-secondary btn-sm btn-sub-view" data-id="${s.id}">
              <i data-lucide="sliders"></i> Manage
            </button>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-sub-view').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openSubDrawer(id);
      });
    });

    createIcons({ icons });
  }

  getStatusBadge(status) {
    switch ((status || '').toLowerCase()) {
      case 'active':
        return '<span class="badge badge-success">Active</span>';
      case 'trial':
        return '<span class="badge badge-info">Trial</span>';
      case 'paused':
        return '<span class="badge badge-warning">Paused</span>';
      case 'pending':
        return '<span class="badge badge-neutral">Pending</span>';
      case 'cancelled':
        return '<span class="badge badge-danger">Cancelled</span>';
      case 'expired':
        return '<span class="badge badge-neutral">Expired</span>';
      default:
        return `<span class="badge badge-neutral">${status}</span>`;
    }
  }

  openSubDrawer(id) {
    this.activeSubId = id;
    this.renderSubDrawer(id);
    this.container.querySelector('#sub-lifecycle-overlay')?.classList.add('active');
    this.container.querySelector('#sub-lifecycle-drawer')?.classList.add('active');
  }

  closeSubDrawer() {
    this.activeSubId = null;
    this.container.querySelector('#sub-lifecycle-overlay')?.classList.remove('active');
    this.container.querySelector('#sub-lifecycle-drawer')?.classList.remove('active');
  }

  renderSubDrawer(id) {
    const sub = quoteSubService.getSubscriptionById(id);
    if (!sub) return;

    const idEl = this.container.querySelector('#drawer-sub-id');
    const custEl = this.container.querySelector('#drawer-sub-cust');
    const body = this.container.querySelector('#drawer-sub-body');

    if (idEl) idEl.textContent = sub.subscriptionNumber;
    if (custEl) custEl.textContent = `${sub.customerName} • Started ${sub.startDate}`;

    const statusBadge = this.getStatusBadge(sub.status);
    const isActive = sub.status === 'Active';
    const isPaused = sub.status === 'Paused';

    body.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div>${statusBadge}</div>
        <div style="font-size: 12px; color: var(--text-muted);">
          ${sub.quotationId ? `Linked Proposal: <strong>${sub.quotationId}</strong>` : 'Direct Contract'}
        </div>
      </div>

      <!-- Financial & Billing Stat Grid -->
      <div class="sub-stat-grid">
        <div class="sub-stat-card">
          <div class="label">Recurring Rate</div>
          <div class="val mono-text">₹ ${(sub.recurringAmount || 0).toLocaleString('en-IN')}</div>
          <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">Every 1 ${sub.billingFrequency}</div>
        </div>
        <div class="sub-stat-card">
          <div class="label">Next Billing Due</div>
          <div class="val mono-text" style="font-size: 15px;">${sub.nextBillingDate}</div>
          <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">Period: ${sub.currentPeriodStart} - ${sub.currentPeriodEnd}</div>
        </div>
        <div class="sub-stat-card">
          <div class="label">Auto-Renewal</div>
          <div class="val" style="font-size: 15px; color: ${sub.autoRenew ? 'var(--success)' : 'var(--text-muted)'};">
            ${sub.autoRenew ? 'Enabled' : 'Disabled'}
          </div>
          <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">Automated invoice run</div>
        </div>
      </div>

      <!-- Contract & Plan Details -->
      <div class="card" style="padding: 14px; margin-bottom: 16px;">
        <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">Plan & Component Specification</div>
        <div style="font-size: 14px; font-weight: 600;">${sub.planName}</div>
        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 6px;">Product: ${sub.productName} (Qty: ${sub.quantity})</div>
        ${(sub.selectedVariants || []).map(v => `
          <span class="product-variant-chip">
            <strong>${v.attribute}:</strong> ${v.value} (+₹${v.additionalPrice})
          </span>
        `).join('')}
      </div>

      <!-- Lifecycle Management Action Bar -->
      <div class="card" style="padding: 16px; margin-bottom: 16px; background: #fafbfc; border: 1px solid var(--border);">
        <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px;">Lifecycle Management Controls</div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          ${isActive ? `
            <button class="btn btn-secondary btn-sm" id="btn-pause-sub">
              <i data-lucide="pause-circle"></i> Pause Subscription
            </button>
          ` : isPaused ? `
            <button class="btn btn-primary btn-sm" id="btn-resume-sub" style="background: var(--success); border-color: var(--success);">
              <i data-lucide="play-circle"></i> Resume Subscription
            </button>
          ` : ''}

          <button class="btn btn-secondary btn-sm" id="btn-renew-sub">
            <i data-lucide="refresh-cw"></i> Advance / Manual Renew
          </button>

          ${sub.status !== 'Cancelled' ? `
            <button class="btn btn-secondary btn-sm" id="btn-cancel-sub" style="color: var(--danger);">
              <i data-lucide="x-circle"></i> Cancel Subscription
            </button>
          ` : ''}
        </div>
      </div>

      <!-- History & Audit Trail -->
      <div>
        <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">Subscription Timeline & Lifecycle Audit</div>
        <div class="timeline-list">
          ${(sub.history || []).map(h => `
            <div class="timeline-item">
              <div class="timeline-bullet"></div>
              <div class="timeline-content">
                <div class="timeline-title">${h.action}: ${h.details}</div>
                <div class="timeline-time">${h.date}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Action listeners
    body.querySelector('#btn-pause-sub')?.addEventListener('click', () => {
      const resume = prompt('Enter anticipated resume date (YYYY-MM-DD) or leave blank:', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      quoteSubService.pauseSubscription(sub.id, resume);
      showToast('Subscription paused.');
    });

    body.querySelector('#btn-resume-sub')?.addEventListener('click', () => {
      quoteSubService.resumeSubscription(sub.id);
      showToast('Subscription resumed to Active!');
    });

    body.querySelector('#btn-renew-sub')?.addEventListener('click', () => {
      quoteSubService.renewSubscription(sub.id);
      showToast('Subscription renewed to next billing cycle.');
    });

    body.querySelector('#btn-cancel-sub')?.addEventListener('click', () => {
      const reason = prompt('Please specify cancellation reason:');
      if (reason !== null) {
        quoteSubService.cancelSubscription(sub.id, reason);
        showToast('Subscription cancelled.', 'error');
      }
    });

    createIcons({ icons });
  }

  exportCSV() {
    const list = quoteSubService.getSubscriptions();
    if (list.length === 0) {
      showToast('No subscriptions to export.', 'error');
      return;
    }

    const headers = ['Subscription ID', 'Customer', 'Email', 'Plan', 'Product', 'Frequency', 'Quantity', 'Recurring Amount', 'Status', 'Start Date', 'Next Billing Date'];
    const rows = list.map(s => [
      s.subscriptionNumber,
      `"${(s.customerName || '').replace(/"/g, '""')}"`,
      s.customerEmail,
      `"${(s.planName || '').replace(/"/g, '""')}"`,
      `"${(s.productName || '').replace(/"/g, '""')}"`,
      s.billingFrequency,
      s.quantity,
      s.recurringAmount,
      s.status,
      s.startDate,
      s.nextBillingDate
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SubscriptIQ_Subscriptions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Subscriptions exported.');
  }
}

