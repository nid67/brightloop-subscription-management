/**
 * SubscriptIQ - Tax Configuration & GST Management View Controller
 * Manage dual-GST compliance rules, intra/inter-state tax configurations,
 * export LUT zero-tax rules, activation toggles, and backend tax engine contracts.
 */

import { invoiceService } from './invoice-service.js';

export class TaxesViewController {
  constructor(containerElement, toastService, modalService) {
    this.container = containerElement;
    this.toast = toastService;
    this.modal = modalService;

    this.filters = {
      search: '',
      status: 'all'
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
    const rules = invoiceService.getTaxRules(this.filters);
    const activeCount = rules.filter(r => r.status === 'Active').length;

    this.container.innerHTML = `
      <div class="page-header">
        <div class="page-title">
          <h2>Tax Configuration & GST Rules</h2>
          <p>Manage tax categories, dual-tax structures (CGST 9% + SGST 9% / IGST 18%) and international exemptions</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" id="btn-open-create-tax-modal">
            <i data-lucide="plus"></i> Add Tax Rule
          </button>
        </div>
      </div>

      <!-- Backend Tax Engine Compliance Notice -->
      <div class="inv-guard-banner">
        <div class="inv-guard-content">
          <i data-lucide="info"></i>
          <div>
            <strong>Automated Backend Tax Calculation Contract:</strong>
            Tax calculation and HSN/SAC evaluations are executed by the centralized billing engine during invoice generation. Rates are applied dynamically according to recipient Place of Supply (POS) and registered GSTIN codes.
          </div>
        </div>
        <span class="badge badge-success" style="font-size: 11px;">Dual-GST Engine Active</span>
      </div>

      <!-- Summary Stat Bar -->
      <div class="inv-summary-bar">
        <div class="inv-stat-card">
          <span class="inv-stat-label">Total Tax Rules</span>
          <span class="inv-stat-val">${rules.length}</span>
          <span class="inv-stat-sub">Configured Tax Categories</span>
        </div>
        <div class="inv-stat-card">
          <span class="inv-stat-label">Active Compliance Rules</span>
          <span class="inv-stat-val" style="color: var(--success);">${activeCount}</span>
          <span class="inv-stat-sub">Currently Evaluated on Checkout & Billing</span>
        </div>
        <div class="inv-stat-card">
          <span class="inv-stat-label">Supplier State Jurisdiction</span>
          <span class="inv-stat-val" style="color: var(--primary);">Karnataka (29)</span>
          <span class="inv-stat-sub">Registered GSTIN: 29AABCU9603R1ZM</span>
        </div>
        <div class="inv-stat-card">
          <span class="inv-stat-label">Export Tax Treatment</span>
          <span class="inv-stat-val" style="color: var(--info);">LUT Zero-Rated</span>
          <span class="inv-stat-sub">ARN-AD2903240019283</span>
        </div>
      </div>

      <!-- Tax Rules Card -->
      <div class="card">
        <!-- Filter Controls -->
        <div class="filter-bar">
          <div class="filter-left">
            <div class="search-box" style="width: 280px;">
              <i data-lucide="search"></i>
              <input type="text" id="tax-search-input" placeholder="Search tax name, scope, formula..." value="${this.filters.search}">
            </div>
            <select class="form-select" id="tax-status-filter">
              <option value="all" ${this.filters.status === 'all' ? 'selected' : ''}>All Statuses</option>
              <option value="active" ${this.filters.status === 'active' ? 'selected' : ''}>Active Only</option>
              <option value="inactive" ${this.filters.status === 'inactive' ? 'selected' : ''}>Inactive Only</option>
            </select>
          </div>
          <div class="filter-right">
            <span class="text-muted" style="font-size: 12px;">HSN/SAC 998313 Software Compliance</span>
          </div>
        </div>

        <!-- Table Container -->
        <div class="table-container" id="tax-table-body-container">
          ${this.getTableHTML(rules)}
        </div>
      </div>
    `;

    this.bindEvents();
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  renderTableOnly() {
    const rules = invoiceService.getTaxRules(this.filters);
    const container = document.getElementById('tax-table-body-container');
    if (container) {
      container.innerHTML = this.getTableHTML(rules);
      this.bindTableEvents();
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  }

  getTableHTML(rules) {
    if (rules.length === 0) {
      const isFiltered = this.filters.search || this.filters.status !== 'all';
      return `
        <div class="placeholder-box" style="margin: 30px;">
          <i data-lucide="percent" style="width: 36px; height: 36px; color: var(--text-muted); margin-bottom: 8px;"></i>
          <h4 style="font-size: 14px; font-weight: 600; color: var(--text-main);">
            ${isFiltered ? 'No Tax Rules Match Filter' : 'No Tax Rules Configured Yet'}
          </h4>
          <p>
            ${isFiltered
              ? 'No tax rules match your current search query or status filter.'
              : 'Configure intra-state dual-GST slabs, interstate IGST, or export zero-tax compliance rules.'}
          </p>
          ${isFiltered
            ? `<button class="btn btn-secondary btn-sm" id="btn-clear-tax-filters" style="margin-top: 12px;">Reset Filters</button>`
            : `<button class="btn btn-primary btn-sm" id="btn-empty-add-tax" style="margin-top: 12px;"><i data-lucide="plus"></i> Add First Tax Rule</button>`}
        </div>
      `;
    }

    const rows = rules.map(rule => {
      const isActive = rule.status === 'Active';
      const formula = rule.cgstRate > 0
        ? `CGST (${rule.cgstRate}%) + SGST (${rule.sgstRate}%)`
        : (rule.igstRate > 0 ? `IGST (${rule.igstRate}%)` : `Zero tax under LUT`);

      return `
        <tr data-tax-id="${rule.id}">
          <td>
            <div style="font-weight: 600; color: var(--text-main);">${rule.name}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${rule.id} • ${rule.scope}</div>
          </td>
          <td class="mono-text">
            <strong style="font-size: 13px;">${rule.rate.toFixed(2)}%</strong>
          </td>
          <td>
            <div style="font-weight: 500;">${formula}</div>
            <div style="font-size: 11px; color: var(--text-secondary);">${rule.description || ''}</div>
          </td>
          <td>
            <div style="font-size: 12px;">${rule.applicableProducts}</div>
          </td>
          <td class="mono-text" style="font-size: 11.5px;">
            ${rule.startDate} to ${rule.endDate}
          </td>
          <td>
            <span class="badge ${isActive ? 'badge-success' : 'badge-neutral'}">${rule.status}</span>
          </td>
          <td>
            <div class="inv-action-group">
              <button class="inv-action-btn tax-toggle-btn" data-tax-id="${rule.id}" title="${isActive ? 'Deactivate Tax Rule' : 'Activate Tax Rule'}">
                <i data-lucide="${isActive ? 'toggle-right' : 'toggle-left'}"></i> ${isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button class="inv-action-btn tax-edit-btn" data-tax-id="${rule.id}" title="Edit Tax Rule">
                <i data-lucide="edit-2"></i> Edit
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
            <th>Tax Label & Category</th>
            <th>Rate (%)</th>
            <th>Breakdown Formula & Scope</th>
            <th>Applicable Products</th>
            <th>Effective Validity</th>
            <th>Status</th>
            <th style="min-width: 140px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  bindEvents() {
    // Search input
    const searchInput = document.getElementById('tax-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filters.search = e.target.value;
        this.renderTableOnly();
      });
    }

    // Status filter
    const statusSelect = document.getElementById('tax-status-filter');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.setFilter('status', e.target.value);
      });
    }

    // Add Tax Rule button
    const addBtn = document.getElementById('btn-open-create-tax-modal');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.modal.openTaxRuleModal();
      });
    }

    this.bindTableEvents();
  }

  bindTableEvents() {
    const emptyAddBtn = document.getElementById('btn-empty-add-tax');
    if (emptyAddBtn) {
      emptyAddBtn.addEventListener('click', () => {
        this.modal.openTaxRuleModal();
      });
    }

    // Reset filters
    const clearBtn = document.getElementById('btn-clear-tax-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.filters = { search: '', status: 'all' };
        this.render();
      });
    }

    // Toggle active / inactive
    document.querySelectorAll('.tax-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const taxId = btn.getAttribute('data-tax-id');
        try {
          const rule = invoiceService.toggleTaxRuleStatus(taxId);
          this.toast.show(
            rule.status === 'Active' ? 'success' : 'info',
            `Tax Rule ${rule.status}`,
            `Tax rule "${rule.name}" is now ${rule.status.toLowerCase()}.`
          );
        } catch (err) {
          this.toast.show('danger', 'Toggle Failed', err.message);
        }
      });
    });

    // Edit tax rule
    document.querySelectorAll('.tax-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const taxId = btn.getAttribute('data-tax-id');
        this.modal.openTaxRuleModal(taxId);
      });
    });
  }
}
