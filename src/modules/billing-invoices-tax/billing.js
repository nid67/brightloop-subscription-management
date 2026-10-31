/**
 * SubscriptIQ - Recurring Billing Operations Workspace Controller
 * Manages upcoming, completed, and failed billing cycles with retry capabilities,
 * multi-frequency schedules (Daily, Weekly, Monthly, Yearly), and subscription billing histories.
 */

import { invoiceService } from './invoice-service.js';

export class BillingViewController {
  constructor(containerElement, toastService, modalService) {
    this.container = containerElement;
    this.toast = toastService;
    this.modal = modalService;

    this.filters = {
      status: 'all',
      frequency: 'all',
      search: ''
    };

    invoiceService.subscribe((event, data) => {
      this.render();
    });
  }

  init() {
    this.render();
  }

  setFilter(key, value) {
    this.filters[key] = value;
    this.renderTableOnly();
  }

  render() {
    const stats = invoiceService.getBillingStats();
    const operations = invoiceService.getBillingOperations(this.filters);

    this.container.innerHTML = `
      <!-- Billing Operations Stat Grid -->
      <div class="inv-summary-bar">
        <div class="inv-stat-card">
          <span class="inv-stat-label">Total Scheduled Cycles</span>
          <span class="inv-stat-val">${stats.total}</span>
          <span class="inv-stat-sub">Across All Subscription Contracts</span>
        </div>
        <div class="inv-stat-card">
          <span class="inv-stat-label">Upcoming Operations (7 Days)</span>
          <span class="inv-stat-val" style="color: var(--info);">${stats.upcoming}</span>
          <span class="inv-stat-sub">₹ ${stats.totalAmountDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Queued Volume</span>
        </div>
        <div class="inv-stat-card">
          <span class="inv-stat-label">Completed This Month</span>
          <span class="inv-stat-val" style="color: var(--success);">${stats.completed}</span>
          <span class="inv-stat-sub">Successfully Finalized & Billed</span>
        </div>
        <div class="inv-stat-card">
          <span class="inv-stat-label">Failed / Exceptions</span>
          <span class="inv-stat-val" style="color: var(--danger);">${stats.failed}</span>
          <span class="inv-stat-sub">Requires Billing Retry or Card Update</span>
        </div>
      </div>

      <!-- Billing Action Banner -->
      <div class="inv-guard-banner">
        <div class="inv-guard-content">
          <i data-lucide="refresh-cw"></i>
          <div>
            <strong>Recurring Billing Queue Engine:</strong>
            Evaluates daily, weekly, monthly, and annual subscription cycles. Simulates automatic invoice generation and payment authorization.
          </div>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-trigger-billing-cycle">
          <i data-lucide="play"></i> Run Scheduled Billing Cycle Now
        </button>
      </div>

      <!-- Table Container Card -->
      <div class="card">
        <!-- Filter Controls -->
        <div class="filter-bar">
          <div class="filter-left">
            <div class="search-box" style="width: 280px;">
              <i data-lucide="search"></i>
              <input type="text" id="bill-search-input" placeholder="Search operation ID, client, subscription..." value="${this.filters.search}">
            </div>
            <select class="form-select" id="bill-status-filter">
              <option value="all" ${this.filters.status === 'all' ? 'selected' : ''}>All Operations (${stats.total})</option>
              <option value="upcoming" ${this.filters.status === 'upcoming' ? 'selected' : ''}>Upcoming (${stats.upcoming})</option>
              <option value="completed" ${this.filters.status === 'completed' ? 'selected' : ''}>Completed (${stats.completed})</option>
              <option value="failed" ${this.filters.status === 'failed' ? 'selected' : ''}>Failed (${stats.failed})</option>
            </select>
            <select class="form-select" id="bill-freq-filter">
              <option value="all" ${this.filters.frequency === 'all' ? 'selected' : ''}>All Frequencies</option>
              <option value="daily" ${this.filters.frequency === 'daily' ? 'selected' : ''}>Daily</option>
              <option value="weekly" ${this.filters.frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
              <option value="monthly" ${this.filters.frequency === 'monthly' ? 'selected' : ''}>Monthly</option>
              <option value="yearly" ${this.filters.frequency === 'yearly' ? 'selected' : ''}>Yearly</option>
            </select>
          </div>
          <div class="filter-right">
            <span class="badge badge-neutral" style="font-size: 11px;">Backend Billing Integration Ready</span>
          </div>
        </div>

        <!-- Billing Table Body -->
        <div class="table-container" id="bill-table-body-container">
          ${this.getTableHTML(operations)}
        </div>
      </div>
    `;

    this.bindEvents();
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  renderTableOnly() {
    const operations = invoiceService.getBillingOperations(this.filters);
    const container = document.getElementById('bill-table-body-container');
    if (container) {
      container.innerHTML = this.getTableHTML(operations);
      this.bindTableEvents();
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  }

  getTableHTML(operations) {
    if (operations.length === 0) {
      const isFiltered = this.filters.search || this.filters.status !== 'all' || this.filters.frequency !== 'all';
      return `
        <div class="placeholder-box" style="margin: 30px;">
          <i data-lucide="calendar-x" style="width: 36px; height: 36px; color: var(--text-muted); margin-bottom: 8px;"></i>
          <h4 style="font-size: 14px; font-weight: 600; color: var(--text-main);">
            ${isFiltered ? 'No Operations Match Filters' : 'No Scheduled Billing Operations'}
          </h4>
          <p>
            ${isFiltered
              ? 'No billing cycles match the chosen status or cadence filters.'
              : 'Recurring billing cycles will appear here as active subscription renewals are scheduled.'}
          </p>
          ${isFiltered ? `<button class="btn btn-secondary btn-sm" id="btn-clear-bill-filters" style="margin-top: 12px;">Reset Filters</button>` : ''}
        </div>
      `;
    }

    const rows = operations.map(op => {
      const statusBadge = this.getStatusBadge(op.status);
      const freqPill = this.getFrequencyPill(op.frequency);

      return `
        <tr data-op-id="${op.id}">
          <td class="mono-text">
            <strong>${op.id}</strong>
            <div style="font-size: 11px; color: var(--text-muted);">${op.subscriptionId}</div>
          </td>
          <td>
            <div style="font-weight: 600; color: var(--text-main);">${op.customerName}</div>
          </td>
          <td>${freqPill}</td>
          <td>
            <div style="font-size: 12px;">${op.billingPeriod}</div>
          </td>
          <td class="mono-text">
            <span style="font-weight: 600; color: var(--text-main);">${op.nextBillingDate}</span>
          </td>
          <td class="mono-text">
            <strong>₹ ${op.amountDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </td>
          <td>
            ${statusBadge}
            ${op.exceptionReason ? `<span class="bill-exception-text"><i data-lucide="alert-circle" style="width: 12px; height: 12px; display: inline;"></i> ${op.exceptionReason}</span>` : ''}
            ${op.invoiceId ? `<div style="font-size: 11px; color: var(--primary); margin-top: 2px;">Invoice: <strong>${op.invoiceId}</strong></div>` : ''}
          </td>
          <td>
            <div class="inv-action-group">
              ${op.status === 'Failed' ? `
                <button class="inv-action-btn primary bill-retry-btn" data-op-id="${op.id}" title="Retry Billing Operation">
                  <i data-lucide="refresh-cw"></i> Retry
                </button>
              ` : ''}
              ${op.status === 'Upcoming' ? `
                <button class="inv-action-btn primary bill-run-now-btn" data-op-id="${op.id}" title="Execute Billing Cycle Now">
                  <i data-lucide="play"></i> Bill Now
                </button>
              ` : ''}
              ${op.invoiceId ? `
                <button class="inv-action-btn bill-view-inv-btn" data-inv-id="${op.invoiceId}" title="View Generated Invoice">
                  <i data-lucide="receipt"></i> Invoice
                </button>
              ` : ''}
              <button class="inv-action-btn bill-history-btn" data-sub-id="${op.subscriptionId}" title="Subscription Billing History">
                <i data-lucide="history"></i> History
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <table class="data-table">
        <thead>
          <tr>
            <th>Operation & Subscription</th>
            <th>Customer</th>
            <th>Frequency</th>
            <th>Billing Period</th>
            <th>Next Billing Date</th>
            <th>Amount Due</th>
            <th>Status & Exception</th>
            <th style="min-width: 150px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  getStatusBadge(status) {
    switch (status.toLowerCase()) {
      case 'completed': return '<span class="badge badge-success"><i data-lucide="check-circle" style="width: 10px; height: 10px;"></i> Completed</span>';
      case 'upcoming': return '<span class="badge badge-info"><i data-lucide="clock" style="width: 10px; height: 10px;"></i> Upcoming</span>';
      case 'failed': return '<span class="badge badge-danger"><i data-lucide="alert-triangle" style="width: 10px; height: 10px;"></i> Failed</span>';
      default: return `<span class="badge badge-neutral">${status}</span>`;
    }
  }

  getFrequencyPill(freq) {
    const f = (freq || 'monthly').toLowerCase();
    return `<span class="bill-freq-pill bill-freq-${f}">${freq}</span>`;
  }

  bindEvents() {
    // Search input
    const searchInput = document.getElementById('bill-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filters.search = e.target.value;
        this.renderTableOnly();
      });
    }

    // Status filter
    const statusSelect = document.getElementById('bill-status-filter');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.setFilter('status', e.target.value);
      });
    }

    // Frequency filter
    const freqSelect = document.getElementById('bill-freq-filter');
    if (freqSelect) {
      freqSelect.addEventListener('change', (e) => {
        this.setFilter('frequency', e.target.value);
      });
    }

    // Trigger cycle button
    const triggerBtn = document.getElementById('btn-trigger-billing-cycle');
    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => {
        const result = invoiceService.triggerBillingCycle();
        if (result.generatedCount > 0) {
          this.toast.show('success', 'Billing Cycle Completed', `Successfully executed billing cycle. Generated ${result.generatedCount} invoice(s).`);
        } else {
          this.toast.show('info', 'Billing Queue Up-to-Date', 'No new pending billing cycles required execution at this time.');
        }
      });
    }

    this.bindTableEvents();
  }

  bindTableEvents() {
    // Reset filters
    const clearBtn = document.getElementById('btn-clear-bill-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.filters = { status: 'all', frequency: 'all', search: '' };
        this.render();
      });
    }

    // Retry billing button
    document.querySelectorAll('.bill-retry-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const opId = btn.getAttribute('data-op-id');
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader" class="spin"></i> Retrying...';
        setTimeout(() => {
          try {
            const op = invoiceService.retryBillingOperation(opId);
            if (op.status === 'Completed') {
              this.toast.show('success', 'Retry Succeeded', `Operation ${opId} successfully processed. Invoice ${op.invoiceId} generated.`);
            } else {
              this.toast.show('danger', 'Retry Failed', op.exceptionReason || 'Authentication mandate still rejected.');
            }
          } catch (err) {
            this.toast.show('danger', 'Error Retrying Billing', err.message);
          }
        }, 600);
      });
    });

    // Run now button (for upcoming)
    document.querySelectorAll('.bill-run-now-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const opId = btn.getAttribute('data-op-id');
        try {
          const op = invoiceService.retryBillingOperation(opId);
          this.toast.show('success', 'Billing Executed', `Operation ${opId} billed immediately. Invoice ${op.invoiceId} created.`);
        } catch (err) {
          this.toast.show('danger', 'Execution Failed', err.message);
        }
      });
    });

    // View linked invoice
    document.querySelectorAll('.bill-view-inv-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const invId = btn.getAttribute('data-inv-id');
        this.modal.openInvoiceDrawer(invId);
      });
    });

    // View subscription history
    document.querySelectorAll('.bill-history-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const subId = btn.getAttribute('data-sub-id');
        this.modal.openSubscriptionHistoryModal(subId);
      });
    });
  }
}
