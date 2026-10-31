/**
 * SubscriptIQ - Discount Management View Controller
 * Admin discount configuration, lifecycle operations,
 * and Interactive Frontend Coupon Eligibility Validation Tester.
 */

import { paymentService } from './payment-service.js';

export class DiscountsViewController {
  constructor(containerElement, toastService, modalService) {
    this.container = containerElement;
    this.toast = toastService;
    this.modal = modalService;

    this.filters = {
      search: '',
      status: 'all',
      type: 'all'
    };

    paymentService.subscribe((event, data) => {
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
    const discounts = paymentService.getDiscounts(this.filters);
    const activeCount = discounts.filter(d => d.status === 'Active').length;
    const totalRedemptions = discounts.reduce((sum, d) => sum + (d.usageCount || 0), 0);

    this.container.innerHTML = `
      <div class="page-header">
        <div class="page-title">
          <h2>Discounts & Promotional Codes</h2>
          <p>Define percentage and fixed amount coupon codes, enforce redemption caps, validity windows and product criteria</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" id="btn-open-create-discount-modal">
            <i data-lucide="plus"></i> Create Discount Rule
          </button>
        </div>
      </div>

      <!-- KPI Summary Bar -->
      <div class="inv-summary-bar">
        <div class="inv-stat-card">
          <span class="inv-stat-label">Active Promotions</span>
          <span class="inv-stat-val" style="color: var(--success);">${activeCount}</span>
          <span class="inv-stat-sub">Live Slabs Available for Checkout</span>
        </div>
        <div class="inv-stat-card">
          <span class="inv-stat-label">Total Redemptions</span>
          <span class="inv-stat-val" style="color: var(--primary);">${totalRedemptions}</span>
          <span class="inv-stat-sub">Subscribers Benefited to Date</span>
        </div>
        <div class="inv-stat-card">
          <span class="inv-stat-label">Configured Rules</span>
          <span class="inv-stat-val">${discounts.length}</span>
          <span class="inv-stat-sub">Percentage & Fixed Slabs Total</span>
        </div>
        <div class="inv-stat-card">
          <span class="inv-stat-label">Validation Engine</span>
          <span class="inv-stat-val" style="color: var(--info);">Pre-checkout</span>
          <span class="inv-stat-sub">Multi-Condition Validation</span>
        </div>
      </div>

      <!-- Interactive Discount Validation Tester Widget -->
      <div class="disc-tester-card">
        <div class="disc-tester-header">
          <div class="disc-tester-title">
            <h3><i data-lucide="shield-alert" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; color: var(--primary); margin-right: 6px;"></i> Discount Eligibility & Rule Validator</h3>
            <p>Test coupon codes against specific order values, items, and expiry criteria in the frontend validation sandbox.</p>
          </div>
          <span class="badge badge-neutral" style="font-size: 11px;">Simulation Sandbox</span>
        </div>

        <div class="disc-tester-grid">
          <div>
            <label class="form-label">Promotional Coupon Code</label>
            <input type="text" class="form-input" id="test-coupon-code" placeholder="e.g. ENTER_CODE" style="width: 100%; text-transform: uppercase; font-family: var(--font-mono); font-weight: 600;" value="">
          </div>
          <div>
            <label class="form-label">Target Product / Service</label>
            <select class="form-select" id="test-product-select" style="width: 100%;">
              <option value="SubscriptIQ Cloud Enterprise">SubscriptIQ Cloud Enterprise</option>
              <option value="SubscriptIQ Pro Team Workspace">SubscriptIQ Pro Team Workspace</option>
              <option value="All Cloud Subscriptions & Services">All Cloud Subscriptions & Services</option>
              <option value="Ineligible Hardware Addon">Ineligible Hardware Addon (Test Mismatch)</option>
            </select>
          </div>
          <div>
            <label class="form-label">Cart Subtotal (₹)</label>
            <input type="number" class="form-input" id="test-subtotal-input" style="width: 100%; font-family: var(--font-mono);" value="20000">
          </div>
          <div>
            <button class="btn btn-primary" id="btn-run-discount-test" style="width: 100%; height: 35px;">
              <i data-lucide="play-circle"></i> Validate Coupon
            </button>
          </div>
        </div>

        <!-- Outcome Box -->
        <div id="disc-tester-outcome" class="disc-outcome-box">
          <!-- Dynamically populated -->
        </div>
      </div>

      <!-- Main Discount Table Card -->
      <div class="card">
        <!-- Filter Controls -->
        <div class="filter-bar">
          <div class="filter-left">
            <div class="search-box" style="width: 280px;">
              <i data-lucide="search"></i>
              <input type="text" id="disc-search-input" placeholder="Search coupon code, campaign, products..." value="${this.filters.search}">
            </div>
            <select class="form-select" id="disc-status-filter">
              <option value="all" ${this.filters.status === 'all' ? 'selected' : ''}>All Statuses</option>
              <option value="active" ${this.filters.status === 'active' ? 'selected' : ''}>Active</option>
              <option value="inactive" ${this.filters.status === 'inactive' ? 'selected' : ''}>Inactive</option>
            </select>
            <select class="form-select" id="disc-type-filter">
              <option value="all" ${this.filters.type === 'all' ? 'selected' : ''}>All Types</option>
              <option value="percentage" ${this.filters.type === 'percentage' ? 'selected' : ''}>Percentage (%)</option>
              <option value="fixed" ${this.filters.type === 'fixed' ? 'selected' : ''}>Fixed Amount (₹)</option>
            </select>
          </div>
          <div class="filter-right">
            <span class="text-muted" style="font-size: 12px;">Final calculation governed by Billing Engine</span>
          </div>
        </div>

        <!-- Table Container -->
        <div class="table-container" id="disc-table-body-container">
          ${this.getTableHTML(discounts)}
        </div>
      </div>
    `;

    this.bindEvents();
    if (window.lucide) window.lucide.createIcons();
  }

  renderTableOnly() {
    const discounts = paymentService.getDiscounts(this.filters);
    const container = document.getElementById('disc-table-body-container');
    if (container) {
      container.innerHTML = this.getTableHTML(discounts);
      this.bindTableEvents();
      if (window.lucide) window.lucide.createIcons();
    }
  }

  getTableHTML(discounts) {
    if (discounts.length === 0) {
      const isFiltered = this.filters.search || this.filters.status !== 'all' || this.filters.type !== 'all';
      return `
        <div class="placeholder-box" style="margin: 30px;">
          <i data-lucide="tag" style="width: 36px; height: 36px; color: var(--text-muted); margin-bottom: 8px;"></i>
          <h4 style="font-size: 14px; font-weight: 600; color: var(--text-main);">
            ${isFiltered ? 'No Discounts Match Filter' : 'No Promotional Discounts Configured'}
          </h4>
          <p>
            ${isFiltered
              ? 'No promotional codes match your current search or status filter.'
              : 'Create percentage or fixed amount promotional discount codes to incentivize new subscriptions.'}
          </p>
          ${isFiltered
            ? `<button class="btn btn-secondary btn-sm" id="btn-clear-disc-filters" style="margin-top: 12px;">Reset Filters</button>`
            : `<button class="btn btn-primary btn-sm" id="btn-empty-add-disc" style="margin-top: 12px;"><i data-lucide="plus"></i> Create First Promotion</button>`}
        </div>
      `;
    }

    const rows = discounts.map(d => {
      const isActive = d.status === 'Active';
      const isPercentage = d.type.toLowerCase().includes('percentage');
      const valText = isPercentage ? `${d.value}% Off` : `₹ ${d.value.toLocaleString('en-IN')} Off`;
      const remaining = Math.max(0, d.usageLimit - d.usageCount);

      return `
        <tr data-disc-id="${d.id}">
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="disc-code-tag">${d.code}</span>
              <button class="icon-btn disc-copy-btn" data-code="${d.code}" title="Copy Code" style="width: 22px; height: 22px;">
                <i data-lucide="copy" style="width: 12px; height: 12px;"></i>
              </button>
            </div>
            <div style="font-weight: 600; color: var(--text-main); margin-top: 4px;">${d.name}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${d.description || ''}</div>
          </td>
          <td>
            <span class="disc-type-pill">${d.type}</span>
          </td>
          <td class="mono-text">
            <strong style="color: var(--primary); font-size: 13px;">${valText}</strong>
            ${d.minPurchase > 0 ? `<div style="font-size: 10.5px; color: var(--text-muted);">Min: ₹ ${d.minPurchase.toLocaleString('en-IN')}</div>` : ''}
          </td>
          <td>
            <div style="font-size: 12px; font-weight: 500;">${d.applicableProducts}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${d.applicablePlans} • ${d.subscriptionWide ? 'Recurring All Cycles' : 'First Cycle Only'}</div>
          </td>
          <td>
            <div style="font-size: 12px; font-weight: 600;">${d.usageCount} / ${d.usageLimit} uses</div>
            <div style="font-size: 11px; color: ${remaining <= 5 ? 'var(--danger)' : 'var(--text-muted)'}; font-weight: ${remaining <= 5 ? '600' : 'normal'};">
              ${remaining} remaining
            </div>
          </td>
          <td class="mono-text" style="font-size: 11.5px;">
            ${d.startDate} to ${d.endDate}
          </td>
          <td>
            <span class="badge ${isActive ? 'badge-success' : 'badge-neutral'}">${d.status}</span>
          </td>
          <td>
            <div class="inv-action-group">
              <button class="inv-action-btn disc-toggle-btn" data-disc-id="${d.id}" title="${isActive ? 'Deactivate Discount' : 'Activate Discount'}">
                <i data-lucide="${isActive ? 'toggle-right' : 'toggle-left'}"></i> ${isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button class="inv-action-btn disc-edit-btn" data-disc-id="${d.id}" title="Edit Discount Rule">
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
            <th>Coupon Code & Campaign</th>
            <th>Type</th>
            <th>Discount Value</th>
            <th>Eligible Products & Cadence</th>
            <th>Redemptions</th>
            <th>Validity Window</th>
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
    const searchInput = document.getElementById('disc-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filters.search = e.target.value;
        this.renderTableOnly();
      });
    }

    // Status filter
    const statusSelect = document.getElementById('disc-status-filter');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.setFilter('status', e.target.value);
      });
    }

    // Type filter
    const typeSelect = document.getElementById('disc-type-filter');
    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        this.setFilter('type', e.target.value);
      });
    }

    // Create discount modal button
    const createBtn = document.getElementById('btn-open-create-discount-modal');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        this.modal.openDiscountModal();
      });
    }

    // Tester execution button
    const testBtn = document.getElementById('btn-run-discount-test');
    if (testBtn) {
      testBtn.addEventListener('click', () => {
        this.runDiscountTest();
      });
    }

    this.bindTableEvents();
  }

  bindTableEvents() {
    const emptyAddBtn = document.getElementById('btn-empty-add-disc');
    if (emptyAddBtn) {
      emptyAddBtn.addEventListener('click', () => {
        this.modal.openDiscountModal();
      });
    }

    // Reset filters
    const clearBtn = document.getElementById('btn-clear-disc-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.filters = { search: '', status: 'all', type: 'all' };
        this.render();
      });
    }

    // Copy code button
    document.querySelectorAll('.disc-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-code');
        navigator.clipboard.writeText(code).then(() => {
          this.toast.show('success', 'Code Copied', `Promotional code "${code}" copied to clipboard.`);
        });
      });
    });

    // Toggle status button
    document.querySelectorAll('.disc-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-disc-id');
        try {
          const disc = paymentService.toggleDiscountStatus(id);
          this.toast.show(
            disc.status === 'Active' ? 'success' : 'info',
            `Discount ${disc.status}`,
            `Promotional code "${disc.code}" is now ${disc.status.toLowerCase()}.`
          );
        } catch (err) {
          this.toast.show('danger', 'Toggle Error', err.message);
        }
      });
    });

    // Edit button
    document.querySelectorAll('.disc-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-disc-id');
        this.modal.openDiscountModal(id);
      });
    });
  }

  runDiscountTest() {
    const code = document.getElementById('test-coupon-code').value.trim();
    const product = document.getElementById('test-product-select').value;
    const subtotal = parseFloat(document.getElementById('test-subtotal-input').value) || 0;
    const outcomeBox = document.getElementById('disc-tester-outcome');

    const result = paymentService.validateDiscount(code, { product, subtotal, quantity: 1 });

    outcomeBox.style.display = 'block';

    if (result.valid) {
      outcomeBox.className = 'disc-outcome-box disc-outcome-valid';
      outcomeBox.innerHTML = `
        <div style="font-weight: 700; display: flex; align-items: center; gap: 6px;">
          <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i> VALID COUPON APPLIED
        </div>
        <p style="margin-top: 4px;">${result.message}</p>
        <div class="disc-calc-breakdown">
          <div>Original Order: <strong class="mono-text">₹ ${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
          <div style="color: var(--success);">Deduction: <strong class="mono-text">- ₹ ${result.computedDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
          <div>Net Payable: <strong class="mono-text" style="color: #0a2540;">₹ ${result.finalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
        </div>
      `;
    } else {
      let cls = 'disc-outcome-invalid';
      let title = 'COUPON REJECTED';

      if (result.state === 'expired') {
        cls = 'disc-outcome-expired';
        title = 'COUPON EXPIRED';
      } else if (result.state === 'min_purchase_not_met' || result.state === 'product_not_eligible' || result.state === 'limit_reached') {
        cls = 'disc-outcome-warning';
        title = 'CRITERIA NOT MET';
      }

      outcomeBox.className = `disc-outcome-box ${cls}`;
      outcomeBox.innerHTML = `
        <div style="font-weight: 700; display: flex; align-items: center; gap: 6px;">
          <i data-lucide="alert-triangle" style="width: 16px; height: 16px;"></i> ${title}
        </div>
        <p style="margin-top: 4px;">${result.message}</p>
      `;
    }

    if (window.lucide) window.lucide.createIcons();
  }
}
