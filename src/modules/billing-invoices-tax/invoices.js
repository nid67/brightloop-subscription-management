/**
 * SubscriptIQ - Invoices View Controller
 * Compact enterprise table, search, multi-factor filters, sorting, pagination,
 * duplicate billing guard, invoice lifecycle actions (Confirm, Cancel, Send, Print/PDF).
 */

import { invoiceService } from './invoice-service.js';

export class InvoicesViewController {
  constructor(containerElement, toastService, modalService) {
    this.container = containerElement;
    this.toast = toastService;
    this.modal = modalService;

    this.filters = {
      search: '',
      status: 'all',
      dateRange: 'all',
      sortBy: 'date',
      sortDir: 'desc'
    };

    this.currentPage = 1;
    this.pageSize = 6;

    // Subscribe to service updates
    invoiceService.subscribe((event, data) => {
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
    const stats = invoiceService.getInvoiceTotals();
    const invoices = invoiceService.getInvoices(this.filters);

    this.container.innerHTML = `
      <!-- Invoices Summary Stat Bar -->
      <div class="inv-summary-bar">
        <div class="inv-stat-card">
          <span class="inv-stat-label">Recognized Revenue (Gross)</span>
          <span class="inv-stat-val">₹ ${stats.recognized.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span class="inv-stat-sub">${stats.count} Total Invoices Generated</span>
        </div>
        <div class="inv-stat-card">
          <span class="inv-stat-label">Collected / Settled</span>
          <span class="inv-stat-val" style="color: var(--success);">₹ ${stats.paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span class="inv-stat-sub">Reconciled via UPI, Cards & NetBanking</span>
        </div>
        <div class="inv-stat-card">
          <span class="inv-stat-label">Outstanding Balance</span>
          <span class="inv-stat-val" style="color: var(--primary);">₹ ${stats.outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span class="inv-stat-sub">Across Unpaid & Partial Contracts</span>
        </div>
        <div class="inv-stat-card">
          <span class="inv-stat-label">Overdue Exposure</span>
          <span class="inv-stat-val" style="color: var(--danger);">₹ ${stats.overdue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span class="inv-stat-sub">${stats.overdueCount} Past Due Account${stats.overdueCount === 1 ? '' : 's'}</span>
        </div>
      </div>

      <!-- Idempotency & Duplicate Billing Guard Callout -->
      <div class="inv-guard-banner">
        <div class="inv-guard-content">
          <i data-lucide="shield-check"></i>
          <div>
            <strong>Strict Idempotency Guard Active:</strong>
            SubscriptIQ guarantees that no subscription contract can be billed more than once for the same renewal cycle.
          </div>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-open-generate-modal">
          <i data-lucide="plus"></i> Generate Invoice from Subscription
        </button>
      </div>

      <!-- Invoices Table Card -->
      <div class="card">
        <!-- Filter Bar -->
        <div class="filter-bar">
          <div class="filter-left">
            <div class="search-box" style="width: 280px;">
              <i data-lucide="search"></i>
              <input type="text" id="inv-search-input" placeholder="Search invoice #, client, GSTIN..." value="${this.filters.search}">
            </div>
            <select class="form-select" id="inv-status-filter">
              <option value="all" ${this.filters.status === 'all' ? 'selected' : ''}>All Statuses</option>
              <option value="draft" ${this.filters.status === 'draft' ? 'selected' : ''}>Draft</option>
              <option value="confirmed" ${this.filters.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="paid" ${this.filters.status === 'paid' ? 'selected' : ''}>Paid</option>
              <option value="partially paid" ${this.filters.status === 'partially paid' ? 'selected' : ''}>Partially Paid</option>
              <option value="overdue" ${this.filters.status === 'overdue' ? 'selected' : ''}>Overdue</option>
              <option value="cancelled" ${this.filters.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
            <select class="form-select" id="inv-date-filter">
              <option value="all" ${this.filters.dateRange === 'all' ? 'selected' : ''}>All Dates</option>
              <option value="this_month" ${this.filters.dateRange === 'this_month' ? 'selected' : ''}>This Month (Nov 2026)</option>
              <option value="last_month" ${this.filters.dateRange === 'last_month' ? 'selected' : ''}>Last Month (Oct 2026)</option>
            </select>
          </div>
          <div class="filter-right">
            <select class="form-select" id="inv-sort-select">
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Amount (High to Low)</option>
              <option value="amount-asc">Amount (Low to High)</option>
              <option value="number-asc">Invoice Number (A-Z)</option>
            </select>
          </div>
        </div>

        <!-- Table Container -->
        <div class="table-container" id="inv-table-body-container">
          ${this.getTableHTML(invoices)}
        </div>
      </div>
    `;

    this.bindEvents();
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  renderTableOnly() {
    const invoices = invoiceService.getInvoices(this.filters);
    const container = document.getElementById('inv-table-body-container');
    if (container) {
      container.innerHTML = this.getTableHTML(invoices);
      this.bindTableEvents();
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  }

  getTableHTML(invoices) {
    if (invoices.length === 0) {
      const isFiltered = this.filters.search || this.filters.status !== 'all' || this.filters.dateRange !== 'all';
      return `
        <div class="placeholder-box" style="margin: 30px;">
          <i data-lucide="file-x" style="width: 36px; height: 36px; color: var(--text-muted); margin-bottom: 8px;"></i>
          <h4 style="font-size: 14px; font-weight: 600; color: var(--text-main);">
            ${isFiltered ? 'No Invoices Match Filters' : 'No Invoices Generated Yet'}
          </h4>
          <p>
            ${isFiltered
              ? 'No invoice records match your current search and filter parameters.'
              : 'Invoices will appear here once generated from active subscriptions or scheduled billing runs.'}
          </p>
          ${isFiltered ? `<button class="btn btn-secondary btn-sm" id="btn-clear-inv-filters" style="margin-top: 12px;">Reset Filters</button>` : ''}
        </div>
      `;
    }

    const totalRecords = invoices.length;
    const totalPages = Math.ceil(totalRecords / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const paginated = invoices.slice(startIndex, startIndex + this.pageSize);

    const rows = paginated.map(inv => {
      const statusClass = this.getStatusBadgeClass(inv.status);
      const taxLabel = inv.cgstRate > 0 ? `CGST (${inv.cgstRate}%) + SGST (${inv.sgstRate}%)` : (inv.igstRate > 0 ? `IGST (${inv.igstRate}%)` : `LUT 0%`);

      return `
        <tr data-invoice-id="${inv.id}">
          <td class="mono-text">
            <strong style="color: var(--primary); cursor: pointer;" class="inv-view-link" data-inv-id="${inv.id}">${inv.invoiceNumber}</strong>
            <div style="font-size: 11px; color: var(--text-muted);">${inv.subscriptionId}</div>
          </td>
          <td>
            <div style="font-weight: 600; color: var(--text-main);">${inv.customerName}</div>
            <div style="font-size: 11px; color: var(--text-secondary);">${inv.customerGstin || 'Unregistered / Export'}</div>
          </td>
          <td>
            <div>${inv.invoiceDate}</div>
            <div style="font-size: 11px; color: ${inv.status === 'Overdue' ? 'var(--danger)' : 'var(--text-muted)'}; font-weight: ${inv.status === 'Overdue' ? '600' : 'normal'}">
              Due: ${inv.dueDate}
            </div>
          </td>
          <td class="mono-text">₹ ${inv.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td class="mono-text">
            <div>₹ ${inv.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div style="font-size: 10.5px; color: var(--text-muted);">${taxLabel}</div>
          </td>
          <td class="mono-text">
            <strong style="font-size: 13px;">₹ ${inv.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </td>
          <td class="mono-text">
            <span style="color: ${inv.outstandingBalance > 0 ? 'var(--danger)' : 'var(--success)'}; font-weight: 600;">
              ₹ ${inv.outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </td>
          <td>
            <span class="badge ${statusClass}">${inv.status}</span>
          </td>
          <td>
            <div class="inv-action-group">
              <button class="inv-action-btn inv-view-link" data-inv-id="${inv.id}" title="View Details">
                <i data-lucide="eye"></i>
              </button>
              <button class="inv-action-btn inv-print-link" data-inv-id="${inv.id}" title="Print / PDF Invoice">
                <i data-lucide="printer"></i>
              </button>
              ${inv.status === 'Draft' ? `
                <button class="inv-action-btn primary inv-confirm-btn" data-inv-id="${inv.id}" title="Confirm Invoice">
                  <i data-lucide="check"></i> Confirm
                </button>
              ` : ''}
              ${inv.status !== 'Cancelled' && inv.status !== 'Paid' ? `
                <button class="inv-action-btn inv-send-btn" data-inv-id="${inv.id}" title="Send Invoice via Email">
                  <i data-lucide="send"></i>
                </button>
                <button class="inv-action-btn danger inv-cancel-btn" data-inv-id="${inv.id}" title="Cancel Invoice">
                  <i data-lucide="x-circle"></i>
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
            <th>Invoice & Subscription</th>
            <th>Customer & GSTIN</th>
            <th>Issue & Due Date</th>
            <th>Subtotal</th>
            <th>GST Breakdown</th>
            <th>Grand Total</th>
            <th>Outstanding</th>
            <th>Payment Status</th>
            <th style="min-width: 140px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <!-- Pagination Bar -->
      <div class="inv-pagination-bar">
        <div>
          Showing <strong>${startIndex + 1}</strong> to <strong>${Math.min(startIndex + this.pageSize, totalRecords)}</strong> of <strong>${totalRecords}</strong> invoices
        </div>
        <div class="inv-pagination-controls">
          <button class="inv-page-btn" id="inv-prev-page" ${this.currentPage === 1 ? 'disabled' : ''}>Previous</button>
          <span style="padding: 0 8px; font-weight: 600;">Page ${this.currentPage} of ${totalPages}</span>
          <button class="inv-page-btn" id="inv-next-page" ${this.currentPage === totalPages ? 'disabled' : ''}>Next</button>
        </div>
      </div>
    `;
  }

  getStatusBadgeClass(status) {
    switch (status.toLowerCase()) {
      case 'paid': return 'badge-success';
      case 'confirmed': return 'badge-info';
      case 'draft': return 'badge-neutral';
      case 'overdue': return 'badge-danger';
      case 'partially paid': return 'badge-warning';
      case 'cancelled': return 'inv-badge-cancelled';
      default: return 'badge-neutral';
    }
  }

  bindEvents() {
    // Search input with debounce
    const searchInput = document.getElementById('inv-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filters.search = e.target.value;
        this.currentPage = 1;
        this.renderTableOnly();
      });
    }

    // Status filter
    const statusSelect = document.getElementById('inv-status-filter');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.setFilter('status', e.target.value);
      });
    }

    // Date range filter
    const dateSelect = document.getElementById('inv-date-filter');
    if (dateSelect) {
      dateSelect.addEventListener('change', (e) => {
        this.setFilter('dateRange', e.target.value);
      });
    }

    // Sort select
    const sortSelect = document.getElementById('inv-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        const [field, dir] = e.target.value.split('-');
        this.filters.sortBy = field;
        this.filters.sortDir = dir;
        this.renderTableOnly();
      });
    }

    // Generate Invoice Button
    const genBtn = document.getElementById('btn-open-generate-modal');
    if (genBtn) {
      genBtn.addEventListener('click', () => {
        this.modal.openGenerateModal();
      });
    }

    this.bindTableEvents();
  }

  bindTableEvents() {
    // Pagination
    const prevBtn = document.getElementById('inv-prev-page');
    const nextBtn = document.getElementById('inv-next-page');

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

    // Clear filters button
    const clearBtn = document.getElementById('btn-clear-inv-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.filters = { search: '', status: 'all', dateRange: 'all', sortBy: 'date', sortDir: 'desc' };
        this.currentPage = 1;
        this.render();
      });
    }

    // View links / drawer trigger
    document.querySelectorAll('.inv-view-link').forEach(btn => {
      btn.addEventListener('click', () => {
        const invId = btn.getAttribute('data-inv-id');
        this.modal.openInvoiceDrawer(invId);
      });
    });

    // Print links / modal trigger
    document.querySelectorAll('.inv-print-link').forEach(btn => {
      btn.addEventListener('click', () => {
        const invId = btn.getAttribute('data-inv-id');
        this.modal.openPrintModal(invId);
      });
    });

    // Confirm button
    document.querySelectorAll('.inv-confirm-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const invId = btn.getAttribute('data-inv-id');
        try {
          invoiceService.confirmInvoice(invId);
          this.toast.show('success', 'Invoice Confirmed', `Invoice ${invId} is now confirmed and finalized for billing.`);
        } catch (err) {
          this.toast.show('danger', 'Confirmation Failed', err.message);
        }
      });
    });

    // Send button
    document.querySelectorAll('.inv-send-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const invId = btn.getAttribute('data-inv-id');
        try {
          const inv = invoiceService.sendInvoice(invId);
          this.toast.show('success', 'Invoice Dispatched', `Tax invoice ${inv.invoiceNumber} has been transmitted to ${inv.customerEmail}.`);
        } catch (err) {
          this.toast.show('danger', 'Send Failed', err.message);
        }
      });
    });

    // Cancel button
    document.querySelectorAll('.inv-cancel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const invId = btn.getAttribute('data-inv-id');
        const confirmed = confirm(`Are you sure you want to cancel invoice ${invId}? Outstanding balance will be set to ₹0.00.`);
        if (confirmed) {
          try {
            invoiceService.cancelInvoice(invId, 'User requested cancellation');
            this.toast.show('warning', 'Invoice Cancelled', `Invoice ${invId} has been cancelled.`);
          } catch (err) {
            this.toast.show('danger', 'Cancellation Failed', err.message);
          }
        }
      });
    });
  }
}
