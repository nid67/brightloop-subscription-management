import { quoteSubService } from './data-service.js';
import { dataService as cppService } from '../customer-product-plan/data-service.js';
import { showToast } from '../customer-product-plan/toast.js';
import { createIcons, icons } from 'lucide';

export class QuotationModule {
  constructor() {
    this.searchQuery = '';
    this.statusFilter = '';
    this.activeQuoteId = null;

    this.container = document.getElementById('view-quotations');
    if (!this.container) return;

    this.init();
  }

  init() {
    this.renderLayout();
    this.bindEvents();
    this.loadData();
    quoteSubService.subscribe(() => {
      this.loadData();
      if (this.activeQuoteId) {
        this.renderQuoteDrawer(this.activeQuoteId);
      }
    });
  }

  renderLayout() {
    this.container.innerHTML = `
      <div class="page-header">
        <div class="page-title">
          <h2>Quotations & Contract Proposals</h2>
          <p>Generate, send, customer-review, and convert approved commercial proposals directly into subscriptions</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary btn-sm" id="quote-refresh-btn">
            <i data-lucide="rotate-cw"></i> Refresh
          </button>
          <button class="btn btn-primary" id="quote-add-btn">
            <i data-lucide="plus"></i> New Quotation
          </button>
        </div>
      </div>

      <!-- Pipeline Bar -->
      <div class="pipeline-steps-bar">
        <div class="pipeline-step-item">
          <span class="badge badge-neutral">1</span> Draft Proposal
        </div>
        <span class="pipeline-step-arrow">→</span>
        <div class="pipeline-step-item">
          <span class="badge badge-info">2</span> Sent to Customer
        </div>
        <span class="pipeline-step-arrow">→</span>
        <div class="pipeline-step-item">
          <span class="badge badge-success">3</span> Accepted by Customer
        </div>
        <span class="pipeline-step-arrow">→</span>
        <div class="pipeline-step-item">
          <span class="badge badge-primary" style="background: var(--primary); color: #fff;">4</span> Convert to Active Subscription
        </div>
      </div>

      <div class="card">
        <div class="filter-bar">
          <div class="filter-left">
            <div style="position: relative; width: 300px;">
              <input type="text" id="quote-search-input" class="form-input" placeholder="Search quote #, customer, plan..." style="width: 100%; padding-left: 32px;" />
              <i data-lucide="search" style="position: absolute; left: 10px; top: 9px; width: 14px; height: 14px; color: var(--text-muted);"></i>
            </div>
            <select id="quote-status-filter" class="form-select">
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
          <div class="filter-right">
            <button class="btn btn-secondary btn-sm" id="quote-export-csv">
              <i data-lucide="download"></i> Export Quotes
            </button>
          </div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Quote Number</th>
                <th>Customer</th>
                <th>Plan & Product</th>
                <th>Frequency</th>
                <th>Valid Until</th>
                <th>Total Value (Inc. GST)</th>
                <th>Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody id="quote-table-body">
              <!-- Dynamically populated -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create / Edit Quotation Modal -->
      <div id="quote-form-modal" class="modal-overlay">
        <div class="modal-dialog" style="max-width: 660px;">
          <div class="modal-header">
            <div class="modal-title" id="quote-modal-title">Create Commercial Quotation</div>
            <button class="modal-close" id="quote-modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <form id="quote-form">
              <input type="hidden" id="quote-field-id" />

              <div class="form-row">
                <div class="form-group" style="flex: 2;">
                  <label class="form-label">Select Customer <span style="color: var(--danger)">*</span></label>
                  <select id="quote-field-customer" class="form-select" required style="width: 100%;">
                    <!-- Dynamically populated from cppService.getCustomers() -->
                  </select>
                </div>
                <div class="form-group" style="flex: 1;">
                  <label class="form-label">Valid Until <span style="color: var(--danger)">*</span></label>
                  <input type="date" id="quote-field-valid-until" class="form-input" required style="width: 100%;" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Select Base Product <span style="color: var(--danger)">*</span></label>
                  <select id="quote-field-product" class="form-select" required style="width: 100%;">
                    <!-- Populated from cppService.getProducts() -->
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Subscription Plan <span style="color: var(--danger)">*</span></label>
                  <select id="quote-field-plan" class="form-select" required style="width: 100%;">
                    <!-- Populated from cppService.getPlans() -->
                  </select>
                </div>
              </div>

              <!-- Product Variants / Add-ons Checklist -->
              <div class="form-group">
                <label class="form-label">Select Dynamic Add-ons & Attribute Variants</label>
                <div id="quote-variant-checkboxes" style="background: #fafbfc; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px; min-height: 40px;">
                  <span class="text-muted" style="font-size: 12px;">Select a product to view configured variants.</span>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Quantity (Units / Licenses) <span style="color: var(--danger)">*</span></label>
                  <input type="number" id="quote-field-qty" class="form-input" value="1" min="1" required style="width: 100%;" />
                </div>
                <div class="form-group">
                  <label class="form-label">Billing Cadence</label>
                  <select id="quote-field-frequency" class="form-select" style="width: 100%;">
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly" selected>Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <!-- Live Calculated Quotation Breakdown -->
              <div class="card" style="padding: 14px; background: #f8fafc; border: 1px solid #dce2e6; margin-top: 10px;">
                <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">Quotation Financial Calculation</div>
                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                  <span>Base Unit Price:</span>
                  <span class="mono-text" id="calc-base-price">₹ 0.00</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                  <span>Add-on Variant Surcharges:</span>
                  <span class="mono-text" id="calc-surcharge-price" style="color: var(--primary);">+ ₹ 0.00</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                  <span>Subtotal (<span id="calc-qty-multiplier">1</span> unit):</span>
                  <span class="mono-text" id="calc-subtotal">₹ 0.00</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
                  <span>Dual GST (CGST 9% + SGST 9% = 18%):</span>
                  <span class="mono-text" id="calc-gst">₹ 0.00</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 700; border-top: 1px dashed var(--border); padding-top: 6px;">
                  <span>Total Quotation Amount:</span>
                  <span class="mono-text" id="calc-total" style="color: var(--primary);">₹ 0.00</span>
                </div>
              </div>

              <div class="form-group" style="margin-top: 14px;">
                <label class="form-label">Special Terms & Notes</label>
                <textarea id="quote-field-notes" class="form-input" rows="2" placeholder="e.g. 30-day payment term, includes migration SLA..." style="width: 100%; resize: vertical;"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="quote-modal-cancel">Cancel</button>
            <button type="button" class="btn btn-primary" id="quote-modal-submit">Save as Draft</button>
          </div>
        </div>
      </div>

      <!-- Quotation Preview & Customer Review Drawer -->
      <div id="quote-detail-overlay" class="drawer-overlay"></div>
      <div id="quote-detail-drawer" class="drawer-panel" style="width: 520px; max-width: 90vw;">
        <div class="drawer-header">
          <div>
            <div style="font-size: 16px; font-weight: 600;" id="drawer-quote-number">QT-2026-000</div>
            <div style="font-size: 12px; color: var(--text-muted);" id="drawer-quote-customer">Customer Proposal</div>
          </div>
          <button class="modal-close" id="drawer-quote-close">&times;</button>
        </div>
        <div class="drawer-body" id="drawer-quote-body">
          <!-- Dynamic Quotation View Sheet -->
        </div>
      </div>
    `;

    createIcons({ icons });
  }

  bindEvents() {
    this.container.querySelector('#quote-search-input')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.loadData();
    });

    this.container.querySelector('#quote-status-filter')?.addEventListener('change', (e) => {
      this.statusFilter = e.target.value;
      this.loadData();
    });

    this.container.querySelector('#quote-refresh-btn')?.addEventListener('click', () => {
      this.loadData();
      showToast('Quotations list refreshed', 'info');
    });

    this.container.querySelector('#quote-export-csv')?.addEventListener('click', () => {
      this.exportCSV();
    });

    this.container.querySelector('#quote-add-btn')?.addEventListener('click', () => {
      this.openFormModal();
    });

    this.container.querySelector('#quote-modal-close')?.addEventListener('click', () => this.closeFormModal());
    this.container.querySelector('#quote-modal-cancel')?.addEventListener('click', () => this.closeFormModal());
    this.container.querySelector('#quote-modal-submit')?.addEventListener('click', () => this.saveQuotationForm());

    this.container.querySelector('#drawer-quote-close')?.addEventListener('click', () => this.closeQuoteDrawer());
    this.container.querySelector('#quote-detail-overlay')?.addEventListener('click', () => this.closeQuoteDrawer());
  }

  loadData() {
    const list = quoteSubService.getQuotations({
      search: this.searchQuery,
      status: this.statusFilter
    });

    const tbody = this.container.querySelector('#quote-table-body');
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="empty-state-container">
              <i data-lucide="file-text" class="empty-state-icon"></i>
              <div class="empty-state-title">No quotations found</div>
              <div class="empty-state-subtitle">No proposals match your search or filter. Create a new quotation.</div>
              <button class="btn btn-secondary btn-sm" id="quote-clear-filters-btn">Clear Filters</button>
            </div>
          </td>
        </tr>
      `;
      tbody.querySelector('#quote-clear-filters-btn')?.addEventListener('click', () => {
        this.searchQuery = '';
        this.statusFilter = '';
        const s = this.container.querySelector('#quote-search-input');
        if (s) s.value = '';
        const st = this.container.querySelector('#quote-status-filter');
        if (st) st.value = '';
        this.loadData();
      });
      createIcons({ icons });
      return;
    }

    tbody.innerHTML = list.map(q => {
      const statusBadge = this.getStatusBadge(q.status);
      const isAccepted = q.status === 'Accepted';
      const isAlreadyConverted = !!q.convertedSubscriptionId;

      return `
        <tr>
          <td class="mono-text"><strong>${q.quoteNumber}</strong></td>
          <td>
            <strong>${q.customerName}</strong>
            <div style="font-size: 11px; color: var(--text-muted);">${q.customerEmail}</div>
          </td>
          <td>
            <div>${q.planName}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${q.productName} (${q.quantity} unit${q.quantity > 1 ? 's' : ''})</div>
          </td>
          <td><span class="badge badge-neutral">${q.billingFrequency}</span></td>
          <td class="mono-text">${q.validUntil}</td>
          <td class="mono-text"><strong>₹ ${(q.total || 0).toLocaleString('en-IN')}</strong></td>
          <td>${statusBadge}</td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 4px;">
              <button class="btn btn-secondary btn-sm btn-quote-view" data-id="${q.id}">
                <i data-lucide="eye"></i> Review
              </button>
              ${isAccepted && !isAlreadyConverted ? `
                <button class="btn btn-primary btn-sm btn-quote-convert" data-id="${q.id}">
                  <i data-lucide="repeat"></i> Convert
                </button>
              ` : isAlreadyConverted ? `
                <span class="badge badge-success" title="Linked: ${q.convertedSubscriptionId}">Converted</span>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-quote-view').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openQuoteDrawer(id);
      });
    });

    tbody.querySelectorAll('.btn-quote-convert').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.handleConvertToSubscription(id);
      });
    });

    createIcons({ icons });
  }

  getStatusBadge(status) {
    switch ((status || '').toLowerCase()) {
      case 'draft':
        return '<span class="badge badge-quote-draft">Draft</span>';
      case 'sent':
        return '<span class="badge badge-quote-sent">Sent</span>';
      case 'accepted':
        return '<span class="badge badge-quote-accepted">Accepted</span>';
      case 'rejected':
        return '<span class="badge badge-quote-rejected">Rejected</span>';
      case 'expired':
        return '<span class="badge badge-quote-expired">Expired</span>';
      default:
        return `<span class="badge badge-neutral">${status}</span>`;
    }
  }

  openFormModal() {
    const modal = this.container.querySelector('#quote-form-modal');
    const form = this.container.querySelector('#quote-form');
    if (!modal || !form) return;

    form.reset();

    // Populate Customers
    const custSelect = form.querySelector('#quote-field-customer');
    const customers = cppService.getCustomers({ status: 'Active' });
    custSelect.innerHTML = customers.map(c => `
      <option value="${c.id}">${c.name} (${c.company || 'Enterprise'})</option>
    `).join('');

    // Populate Products
    const prodSelect = form.querySelector('#quote-field-product');
    const products = cppService.getProducts({ status: 'Active' });
    prodSelect.innerHTML = products.map(p => `
      <option value="${p.id}">${p.name} (₹${p.salesPrice})</option>
    `).join('');

    // Populate Plans
    const planSelect = form.querySelector('#quote-field-plan');
    const plans = cppService.getPlans({ status: 'Active' });
    planSelect.innerHTML = plans.map(p => `
      <option value="${p.id}" data-freq="${p.billingFrequency}" data-price="${p.price}">
        ${p.name} (₹${p.price}/${p.billingFrequency})
      </option>
    `).join('');

    // Default dates
    const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    form.querySelector('#quote-field-valid-until').value = expiry;

    // Attach dynamic listeners for pricing recalculation
    const updateVariantsAndPricing = () => {
      const selectedProdId = prodSelect.value;
      const product = cppService.getProductById(selectedProdId);
      const varContainer = form.querySelector('#quote-variant-checkboxes');

      if (product && Array.isArray(product.variants) && product.variants.length > 0) {
        varContainer.innerHTML = product.variants.map(v => `
          <label style="display: block; margin-bottom: 6px; font-size: 13px; cursor: pointer;">
            <input type="checkbox" class="quote-variant-chk" value="${v.id}" data-surcharge="${v.additionalPrice}" />
            <strong>${v.attribute}:</strong> ${v.value} (+₹${v.additionalPrice})
          </label>
        `).join('');

        varContainer.querySelectorAll('.quote-variant-chk').forEach(chk => {
          chk.addEventListener('change', calculateTotals);
        });
      } else {
        varContainer.innerHTML = '<span class="text-muted" style="font-size: 12px;">No variant add-ons configured for this product.</span>';
      }

      calculateTotals();
    };

    const calculateTotals = () => {
      const selectedPlan = planSelect.options[planSelect.selectedIndex];
      const basePrice = Number(selectedPlan?.getAttribute('data-price')) || 0;
      const freq = selectedPlan ? selectedPlan.getAttribute('data-freq') : 'Monthly';
      
      form.querySelector('#quote-field-frequency').value = freq;

      let surcharge = 0;
      form.querySelectorAll('.quote-variant-chk:checked').forEach(chk => {
        surcharge += Number(chk.getAttribute('data-surcharge') || 0);
      });

      const qty = Math.max(1, Number(form.querySelector('#quote-field-qty').value) || 1);
      const unitPrice = basePrice + surcharge;
      const subtotal = unitPrice * qty;
      const gst = (subtotal * 0.18);
      const grandTotal = subtotal + gst;

      form.querySelector('#calc-base-price').textContent = `₹ ${basePrice.toLocaleString('en-IN')}`;
      form.querySelector('#calc-surcharge-price').textContent = `+ ₹ ${surcharge.toLocaleString('en-IN')}`;
      form.querySelector('#calc-qty-multiplier').textContent = qty;
      form.querySelector('#calc-subtotal').textContent = `₹ ${subtotal.toLocaleString('en-IN')}`;
      form.querySelector('#calc-gst').textContent = `₹ ${gst.toLocaleString('en-IN')}`;
      form.querySelector('#calc-total').textContent = `₹ ${grandTotal.toLocaleString('en-IN')}`;
    };

    prodSelect.onchange = updateVariantsAndPricing;
    planSelect.onchange = calculateTotals;
    form.querySelector('#quote-field-qty').oninput = calculateTotals;

    updateVariantsAndPricing();
    modal.classList.add('active');
  }

  closeFormModal() {
    this.container.querySelector('#quote-form-modal')?.classList.remove('active');
  }

  saveQuotationForm() {
    const form = this.container.querySelector('#quote-form');
    if (!form) return;

    const customerId = form.querySelector('#quote-field-customer').value;
    const productId = form.querySelector('#quote-field-product').value;
    const planId = form.querySelector('#quote-field-plan').value;
    const validUntil = form.querySelector('#quote-field-valid-until').value;
    const quantity = Number(form.querySelector('#quote-field-qty').value);
    const frequency = form.querySelector('#quote-field-frequency').value;
    const notes = form.querySelector('#quote-field-notes').value.trim();

    if (!customerId || !productId || !planId || !validUntil) {
      showToast('Please select customer, product, plan and expiry date.', 'error');
      return;
    }

    const variantIds = [];
    form.querySelectorAll('.quote-variant-chk:checked').forEach(chk => {
      variantIds.push(chk.value);
    });

    const newQuote = quoteSubService.createQuotation({
      customerId,
      productId,
      planId,
      validUntil,
      quantity,
      billingFrequency: frequency,
      variantIds,
      notes,
      status: 'Draft'
    });

    this.closeFormModal();
    showToast(`Quotation ${newQuote.quoteNumber} created as Draft.`);
  }

  openQuoteDrawer(id) {
    this.activeQuoteId = id;
    this.renderQuoteDrawer(id);
    this.container.querySelector('#quote-detail-overlay')?.classList.add('active');
    this.container.querySelector('#quote-detail-drawer')?.classList.add('active');
  }

  closeQuoteDrawer() {
    this.activeQuoteId = null;
    this.container.querySelector('#quote-detail-overlay')?.classList.remove('active');
    this.container.querySelector('#quote-detail-drawer')?.classList.remove('active');
  }

  renderQuoteDrawer(id) {
    const quote = quoteSubService.getQuotationById(id);
    if (!quote) return;

    const titleEl = this.container.querySelector('#drawer-quote-number');
    const custEl = this.container.querySelector('#drawer-quote-customer');
    const body = this.container.querySelector('#drawer-quote-body');

    if (titleEl) titleEl.textContent = quote.quoteNumber;
    if (custEl) custEl.textContent = `${quote.customerName} • Created ${quote.createdAt}`;

    const statusBadge = this.getStatusBadge(quote.status);
    const isAccepted = quote.status === 'Accepted';
    const isConverted = !!quote.convertedSubscriptionId;

    body.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div>${statusBadge}</div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-secondary btn-sm" id="btn-print-quote">
            <i data-lucide="printer"></i> Print / PDF
          </button>
          ${quote.status === 'Draft' ? `
            <button class="btn btn-primary btn-sm" id="btn-send-quote">
              <i data-lucide="send"></i> Send to Customer
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Customer Flow Simulation Banner -->
      <div class="customer-action-banner">
        <div>
          <strong style="display: block; font-size: 13px;">Customer Self-Review Simulation</strong>
          <span style="font-size: 12px; color: var(--text-secondary);">
            Simulate the customer's portal action to accept or decline this quotation.
          </span>
        </div>
        <div style="display: flex; gap: 6px;">
          ${quote.status === 'Sent' || quote.status === 'Draft' ? `
            <button class="btn btn-primary btn-sm" id="btn-simulate-accept" style="background: var(--success); border-color: var(--success);">
              <i data-lucide="check"></i> Accept Quote
            </button>
            <button class="btn btn-secondary btn-sm" id="btn-simulate-reject" style="color: var(--danger);">
              <i data-lucide="x"></i> Reject
            </button>
          ` : isAccepted ? `
            <span class="badge badge-success"><i data-lucide="check-circle" style="width: 12px; height: 12px;"></i> Accepted by Customer</span>
          ` : `
            <span class="badge badge-neutral">${quote.status}</span>
          `}
        </div>
      </div>

      <!-- Conversion Callout if Accepted -->
      ${isAccepted ? `
        <div class="info-banner" style="display: flex; justify-content: space-between; align-items: center; margin: 16px 0;">
          <div>
            <strong>Ready for Provisioning:</strong>
            <p style="font-size: 12px; margin: 2px 0 0 0;">Customer has accepted this contract. Convert into an active recurring subscription.</p>
          </div>
          ${!isConverted ? `
            <button class="btn btn-primary btn-sm" id="btn-drawer-convert">
              <i data-lucide="repeat"></i> Convert Now
            </button>
          ` : `
            <span class="badge badge-success">Converted: ${quote.convertedSubscriptionId}</span>
          `}
        </div>
      ` : ''}

      <!-- Clean Printable Quotation Sheet -->
      <div class="quote-preview-sheet" id="printable-quote-sheet">
        <div class="quote-sheet-header">
          <div class="quote-sheet-brand">
            <h3>Brightloop Software</h3>
            <span style="font-size: 11px; color: var(--text-muted);">Subscription Management Platform</span>
          </div>
          <div class="quote-sheet-meta">
            <div><strong>Quotation:</strong> ${quote.quoteNumber}</div>
            <div><strong>Date:</strong> ${quote.createdAt}</div>
            <div><strong>Valid Until:</strong> ${quote.validUntil}</div>
          </div>
        </div>

        <div class="quote-parties-grid">
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Bill To</div>
            <div style="font-weight: 600;">${quote.customerName}</div>
            <div>${quote.customerCompany}</div>
            <div class="mono-text" style="font-size: 12px;">${quote.customerEmail}</div>
          </div>
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Terms</div>
            <div>Billing Cadence: <strong>${quote.billingFrequency}</strong></div>
            <div>Status: <strong>${quote.status}</strong></div>
            <div>Tax Jurisdiction: <strong>Dual GST (18%)</strong></div>
          </div>
        </div>

        <table class="quote-line-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit Rate</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>${quote.planName}</strong>
                <div style="font-size: 12px; color: var(--text-muted);">${quote.productName}</div>
                ${(quote.selectedVariants || []).map(v => `
                  <div style="font-size: 11px; color: var(--primary);">+ ${v.attribute}: ${v.value} (+₹${v.additionalPrice})</div>
                `).join('')}
              </td>
              <td>${quote.quantity}</td>
              <td class="mono-text">₹ ${(quote.unitPrice || 0).toLocaleString('en-IN')}</td>
              <td class="mono-text" style="text-align: right;">₹ ${(quote.subtotal || 0).toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>

        <div class="quote-totals-box">
          <div class="quote-total-row">
            <span>Subtotal:</span>
            <span class="mono-text">₹ ${(quote.subtotal || 0).toLocaleString('en-IN')}</span>
          </div>
          <div class="quote-total-row">
            <span>CGST (9%):</span>
            <span class="mono-text">₹ ${(quote.taxAmount / 2).toLocaleString('en-IN')}</span>
          </div>
          <div class="quote-total-row">
            <span>SGST (9%):</span>
            <span class="mono-text">₹ ${(quote.taxAmount / 2).toLocaleString('en-IN')}</span>
          </div>
          <div class="quote-total-row grand-total">
            <span>Total Quotation:</span>
            <span class="mono-text">₹ ${(quote.total || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        ${quote.notes ? `
          <div style="margin-top: 18px; padding-top: 10px; border-top: 1px solid var(--border-subtle); font-size: 12px; color: var(--text-secondary);">
            <strong>Special Notes:</strong> ${quote.notes}
          </div>
        ` : ''}
      </div>

      <!-- History / Audit Log -->
      <div style="margin-top: 20px;">
        <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">Quotation Lifecycle History</div>
        <div class="timeline-list">
          ${(quote.history || []).map(h => `
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

    // Actions
    body.querySelector('#btn-send-quote')?.addEventListener('click', () => {
      quoteSubService.setQuotationStatus(quote.id, 'Sent', `Dispatched to ${quote.customerEmail}`);
      showToast(`Quotation sent to ${quote.customerEmail}`);
    });

    body.querySelector('#btn-simulate-accept')?.addEventListener('click', () => {
      quoteSubService.setQuotationStatus(quote.id, 'Accepted', 'Accepted by customer in self-service review');
      showToast('Quotation accepted! You can now convert it to a subscription.');
    });

    body.querySelector('#btn-simulate-reject')?.addEventListener('click', () => {
      quoteSubService.setQuotationStatus(quote.id, 'Rejected', 'Customer declined quotation proposal');
      showToast('Quotation marked as Rejected.', 'error');
    });

    body.querySelector('#btn-drawer-convert')?.addEventListener('click', () => {
      this.handleConvertToSubscription(quote.id);
    });

    body.querySelector('#btn-print-quote')?.addEventListener('click', () => {
      window.print();
    });

    createIcons({ icons });
  }

  handleConvertToSubscription(quoteId) {
    try {
      const newSub = quoteSubService.convertQuotationToSubscription(quoteId);
      showToast(`Subscription ${newSub.subscriptionNumber} provisioned successfully!`);
      this.closeQuoteDrawer();
      // Switch view to subscriptions
      const subNav = document.querySelector('.nav-link[data-view="subscriptions"]');
      if (subNav) subNav.click();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  exportCSV() {
    const list = quoteSubService.getQuotations();
    if (list.length === 0) {
      showToast('No quotations to export.', 'error');
      return;
    }

    const headers = ['Quote Number', 'Customer', 'Email', 'Product', 'Plan', 'Frequency', 'Quantity', 'Subtotal', 'Tax', 'Total', 'Status', 'Valid Until'];
    const rows = list.map(q => [
      q.quoteNumber,
      `"${(q.customerName || '').replace(/"/g, '""')}"`,
      q.customerEmail,
      `"${(q.productName || '').replace(/"/g, '""')}"`,
      `"${(q.planName || '').replace(/"/g, '""')}"`,
      q.billingFrequency,
      q.quantity,
      q.subtotal,
      q.taxAmount,
      q.total,
      q.status,
      q.validUntil
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SubscriptIQ_Quotations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Quotations exported.');
  }
}

