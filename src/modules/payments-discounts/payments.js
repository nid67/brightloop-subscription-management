/**
 * SubscriptIQ - Payment Management View Controller
 * Compact financial table, multi-parameter search/filters,
 * invoice allocation tracking, reconciliation metrics, and refund lifecycle.
 */

import { paymentService } from './payment-service.js';

export class PaymentsViewController {
  constructor(containerElement, toastService, modalService) {
    this.container = containerElement;
    this.toast = toastService;
    this.modal = modalService;

    this.filters = {
      search: '',
      status: 'all',
      method: 'all',
      sortBy: 'date',
      sortDir: 'desc'
    };

    this.currentPage = 1;
    this.pageSize = 6;

    paymentService.subscribe((event, data) => {
      this.render();
    });
  }

  init() {
    this.render();
  }

  setFilter(key, value) {
    this.filters[key] = value;
    this.currentPage = 1;
    this.renderTableOnly();
  }

  render() {
    const stats = paymentService.getPaymentTotals();
    const payments = paymentService.getPayments(this.filters);

    this.container.innerHTML = `
      <div class="page-header">
        <div class="page-title">
          <h2>Payment Recording & Reconciliation</h2>
          <p>Record manual and automated payments, allocate receipts against open invoices, and manage settlement audits</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" id="btn-open-record-payment-modal">
            <i data-lucide="plus-circle"></i> Record Payment Receipt
          </button>
        </div>
      </div>

      <!-- Payment Overview Metric Bar -->
      <div class="inv-summary-bar">
        <div class="inv-stat-card">
          <span class="inv-stat-label">Total Collected Revenue</span>
          <span class="inv-stat-val" style="color: var(--success);">₹ ${stats.totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span class="inv-stat-sub">Reconciled Settlement in Operating Accounts</span>
        </div>
        <div class="inv-stat-card">
          <span class="inv-stat-label">Pending Settlements</span>
          <span class="inv-stat-val" style="color: var(--info);">₹ ${stats.totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span class="inv-stat-sub">${stats.pendingCount} Transaction${stats.pendingCount === 1 ? '' : 's'} in Gateway Clearance</span>
        </div>
        <div class="inv-stat-card">
          <span class="inv-stat-label">Unallocated Receipts</span>
          <span class="inv-stat-val" style="color: var(--warning);">₹ ${stats.unallocatedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span class="inv-stat-sub">Customer Advance Credit Unlinked to Invoice</span>
        </div>
        <div class="inv-stat-card">
          <span class="inv-stat-label">Reconciliation Efficiency</span>
          <span class="inv-stat-val" style="color: var(--primary);">${stats.reconciliationRate}%</span>
          <span class="inv-stat-sub">${stats.totalPaymentsCount} Lifetime Receipts Audited</span>
        </div>
      </div>

      <!-- Simulated Processing Disclaimer Banner -->
      <div class="inv-guard-banner">
        <div class="inv-guard-content">
          <i data-lucide="check-shield"></i>
          <div>
            <strong>Reconciliation & Idempotent Matching Engine:</strong>
            Payments update linked invoice balances in real-time. Overpayment is prevented by strict outstanding balance caps.
          </div>
        </div>
        <span class="badge badge-success" style="font-size: 11px;">Simulation Environment</span>
      </div>

      <!-- Main Payments Card -->
      <div class="card">
        <!-- Filter Bar -->
        <div class="filter-bar">
          <div class="filter-left">
            <div class="search-box" style="width: 280px;">
              <i data-lucide="search"></i>
              <input type="text" id="pay-search-input" placeholder="Search reference, customer, invoice..." value="${this.filters.search}">
            </div>
            <select class="form-select" id="pay-status-filter">
              <option value="all" ${this.filters.status === 'all' ? 'selected' : ''}>All Statuses</option>
              <option value="successful" ${this.filters.status === 'successful' ? 'selected' : ''}>Successful</option>
              <option value="pending" ${this.filters.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="failed" ${this.filters.status === 'failed' ? 'selected' : ''}>Failed</option>
              <option value="refunded" ${this.filters.status === 'refunded' ? 'selected' : ''}>Refunded</option>
            </select>
            <select class="form-select" id="pay-method-filter">
              <option value="all" ${this.filters.method === 'all' ? 'selected' : ''}>All Payment Methods</option>
              <option value="upi" ${this.filters.method === 'upi' ? 'selected' : ''}>UPI</option>
              <option value="bank transfer" ${this.filters.method === 'bank transfer' ? 'selected' : ''}>Bank Transfer (NEFT/RTGS)</option>
              <option value="card" ${this.filters.method === 'card' ? 'selected' : ''}>Credit/Debit Card</option>
              <option value="cash" ${this.filters.method === 'cash' ? 'selected' : ''}>Cash/Cheque</option>
              <option value="other" ${this.filters.method === 'other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
          <div class="filter-right">
            <select class="form-select" id="pay-sort-select">
              <option value="date-desc">Newest Date First</option>
              <option value="date-asc">Oldest Date First</option>
              <option value="amount-desc">Amount (High to Low)</option>
              <option value="amount-asc">Amount (Low to High)</option>
              <option value="ref-asc">Reference (A-Z)</option>
            </select>
          </div>
        </div>

        <!-- Payments Table Body -->
        <div class="table-container" id="pay-table-body-container">
          ${this.getTableHTML(payments)}
        </div>
      </div>
    `;

    this.bindEvents();
    if (window.lucide) window.lucide.createIcons();
  }

  renderTableOnly() {
    const payments = paymentService.getPayments(this.filters);
    const container = document.getElementById('pay-table-body-container');
    if (container) {
      container.innerHTML = this.getTableHTML(payments);
      this.bindTableEvents();
      if (window.lucide) window.lucide.createIcons();
    }
  }

  getTableHTML(payments) {
    if (payments.length === 0) {
      const isFiltered = this.filters.search || this.filters.status !== 'all' || this.filters.method !== 'all';
      return `
        <div class="placeholder-box" style="margin: 30px;">
          <i data-lucide="credit-card" style="width: 36px; height: 36px; color: var(--text-muted); margin-bottom: 8px;"></i>
          <h4 style="font-size: 14px; font-weight: 600; color: var(--text-main);">
            ${isFiltered ? 'No Transactions Match Filters' : 'No Payment Transactions Recorded'}
          </h4>
          <p>
            ${isFiltered
              ? 'No payments match your current search and filter parameters.'
              : 'Payments will appear here once recorded against open invoices or customer advance credits.'}
          </p>
          ${isFiltered
            ? `<button class="btn btn-secondary btn-sm" id="btn-clear-pay-filters" style="margin-top: 12px;">Reset Filters</button>`
            : `<button class="btn btn-primary btn-sm" id="btn-empty-record-pay" style="margin-top: 12px;"><i data-lucide="plus-circle"></i> Record First Payment</button>`}
        </div>
      `;
    }

    const totalRecords = payments.length;
    const totalPages = Math.ceil(totalRecords / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const paginated = payments.slice(startIndex, startIndex + this.pageSize);

    const rows = paginated.map(p => {
      const methodPill = this.getMethodPill(p.method);
      const statusBadge = this.getStatusBadge(p.status);
      const recBadge = this.getReconciliationBadge(p.reconciliationStatus);

      return `
        <tr data-payment-id="${p.id}">
          <td class="mono-text">
            <strong style="color: var(--primary); cursor: pointer;" class="pay-view-link" data-pay-id="${p.id}">${p.reference}</strong>
            <div style="font-size: 11px; color: var(--text-muted);">${p.id}</div>
          </td>
          <td>
            <div style="font-weight: 600; color: var(--text-main);">${p.customerName}</div>
            <div style="font-size: 11px; color: var(--text-secondary);">${p.customerEmail || 'No email provided'}</div>
          </td>
          <td>
            ${p.invoiceId ? `
              <span class="mono-text" style="color: var(--info); font-weight: 600; cursor: pointer;" class="pay-inv-link" data-inv-id="${p.invoiceId}">
                ${p.invoiceId}
              </span>
            ` : `
              <span class="badge badge-neutral" style="font-size: 10.5px;">Advance Credit</span>
            `}
          </td>
          <td>${methodPill}</td>
          <td class="mono-text">
            <strong style="font-size: 13px;">₹ ${p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            <div style="font-size: 10.5px; color: var(--text-muted);">
              Allocated: ₹ ${p.allocatedAmount.toLocaleString('en-IN')}
            </div>
          </td>
          <td>
            <div>${p.date}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${p.time || ''}</div>
          </td>
          <td>${statusBadge}</td>
          <td>${recBadge}</td>
          <td>
            <div class="inv-action-group">
              <button class="inv-action-btn pay-view-link" data-pay-id="${p.id}" title="View Payment Details">
                <i data-lucide="eye"></i> View
              </button>
              ${p.status === 'Successful' ? `
                <button class="inv-action-btn danger pay-refund-btn" data-pay-id="${p.id}" title="Issue Refund">
                  <i data-lucide="rotate-ccw"></i> Refund
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <table class="data-table">
        <thead>
          <tr>
            <th>Payment Reference</th>
            <th>Customer</th>
            <th>Invoice Matched</th>
            <th>Method</th>
            <th>Amount Paid</th>
            <th>Date & Time</th>
            <th>Status</th>
            <th>Reconciliation</th>
            <th style="min-width: 120px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <!-- Pagination Bar -->
      <div class="inv-pagination-bar">
        <div>
          Showing <strong>${startIndex + 1}</strong> to <strong>${Math.min(startIndex + this.pageSize, totalRecords)}</strong> of <strong>${totalRecords}</strong> payments
        </div>
        <div class="inv-pagination-controls">
          <button class="inv-page-btn" id="pay-prev-page" ${this.currentPage === 1 ? 'disabled' : ''}>Previous</button>
          <span style="padding: 0 8px; font-weight: 600;">Page ${this.currentPage} of ${totalPages}</span>
          <button class="inv-page-btn" id="pay-next-page" ${this.currentPage === totalPages ? 'disabled' : ''}>Next</button>
        </div>
      </div>
    `;
  }

  getMethodPill(method) {
    const m = (method || 'other').toLowerCase();
    let icon = 'credit-card';
    let cls = 'pay-method-other';

    if (m.includes('upi')) {
      icon = 'smartphone';
      cls = 'pay-method-upi';
    } else if (m.includes('bank') || m.includes('neft') || m.includes('rtgs')) {
      icon = 'building-2';
      cls = 'pay-method-bank';
    } else if (m.includes('card')) {
      icon = 'credit-card';
      cls = 'pay-method-card';
    } else if (m.includes('cash') || m.includes('cheque')) {
      icon = 'banknote';
      cls = 'pay-method-cash';
    }

    return `<span class="pay-method-pill ${cls}"><i data-lucide="${icon}" style="width: 12px; height: 12px;"></i> ${method}</span>`;
  }

  getStatusBadge(status) {
    switch ((status || '').toLowerCase()) {
      case 'successful': return '<span class="badge badge-success">Successful</span>';
      case 'pending': return '<span class="badge badge-info">Pending</span>';
      case 'failed': return '<span class="badge badge-danger">Failed</span>';
      case 'refunded': return '<span class="badge badge-neutral" style="text-decoration: line-through;">Refunded</span>';
      default: return `<span class="badge badge-neutral">${status}</span>`;
    }
  }

  getReconciliationBadge(rec) {
    switch (rec) {
      case 'Reconciled': return '<span class="pay-rec-badge pay-rec-reconciled"><i data-lucide="check" style="width: 10px; height: 10px;"></i> Reconciled</span>';
      case 'Unallocated Credit': return '<span class="pay-rec-badge pay-rec-unallocated"><i data-lucide="alert-circle" style="width: 10px; height: 10px;"></i> Unallocated</span>';
      case 'Pending Settlement': return '<span class="pay-rec-badge pay-rec-pending"><i data-lucide="clock" style="width: 10px; height: 10px;"></i> Pending</span>';
      case 'Failed Match': return '<span class="pay-rec-badge pay-rec-failed"><i data-lucide="x" style="width: 10px; height: 10px;"></i> Failed Match</span>';
      default: return `<span class="badge badge-neutral">${rec || 'Pending'}</span>`;
    }
  }

  bindEvents() {
    // Search input
    const searchInput = document.getElementById('pay-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filters.search = e.target.value;
        this.currentPage = 1;
        this.renderTableOnly();
      });
    }

    // Status filter
    const statusSelect = document.getElementById('pay-status-filter');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.setFilter('status', e.target.value);
      });
    }

    // Method filter
    const methodSelect = document.getElementById('pay-method-filter');
    if (methodSelect) {
      methodSelect.addEventListener('change', (e) => {
        this.setFilter('method', e.target.value);
      });
    }

    // Sort select
    const sortSelect = document.getElementById('pay-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        const [field, dir] = e.target.value.split('-');
        this.filters.sortBy = field;
        this.filters.sortDir = dir;
        this.renderTableOnly();
      });
    }

    // Record Payment Button
    const recordBtn = document.getElementById('btn-open-record-payment-modal');
    if (recordBtn) {
      recordBtn.addEventListener('click', () => {
        this.modal.openRecordPaymentModal();
      });
    }

    this.bindTableEvents();
  }

  bindTableEvents() {
    const emptyPayBtn = document.getElementById('btn-empty-record-pay');
    if (emptyPayBtn) {
      emptyPayBtn.addEventListener('click', () => {
        this.modal.openRecordPaymentModal();
      });
    }

    // Pagination
    const prevBtn = document.getElementById('pay-prev-page');
    const nextBtn = document.getElementById('pay-next-page');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.renderTableOnly();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.currentPage++;
        this.renderTableOnly();
      });
    }

    // Reset filters
    const clearBtn = document.getElementById('btn-clear-pay-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.filters = { search: '', status: 'all', method: 'all', sortBy: 'date', sortDir: 'desc' };
        this.currentPage = 1;
        this.render();
      });
    }

    // View details
    document.querySelectorAll('.pay-view-link').forEach(btn => {
      btn.addEventListener('click', () => {
        const payId = btn.getAttribute('data-pay-id');
        this.modal.openPaymentDrawer(payId);
      });
    });

    // Refund button
    document.querySelectorAll('.pay-refund-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const payId = btn.getAttribute('data-pay-id');
        const reason = prompt(`Enter reason for refunding payment ${payId}:`, 'Customer requested billing reversal');
        if (reason) {
          try {
            paymentService.refundPayment(payId, reason);
            this.toast.show('warning', 'Payment Refunded', `Transaction ${payId} marked as refunded. Balance adjustments logged.`);
          } catch (err) {
            this.toast.show('danger', 'Refund Error', err.message);
          }
        }
      });
    });
  }
}
