/**
 * SubscriptIQ - Modals & Drawers for Module 04
 * Record Payment Receipt Modal, Payment Detail Slide Drawer,
 * and Discount Rule Configuration Dialog.
 */

import { paymentService } from './payment-service.js';

export class PaymentModalService {
  constructor(toastService) {
    this.toast = toastService;
    this.ensureContainers();
  }

  ensureContainers() {
    // Payment details drawer
    if (!document.getElementById('pay-detail-drawer')) {
      const drawerHTML = `
        <div id="pay-drawer-overlay" class="drawer-overlay"></div>
        <div id="pay-detail-drawer" class="drawer-panel">
          <div class="drawer-header">
            <div>
              <div style="font-size: 15px; font-weight: 700; color: var(--text-main);" id="pay-drawer-title">Payment Transaction Details</div>
              <div style="font-size: 12px; color: var(--text-muted);" id="pay-drawer-sub">Loading...</div>
            </div>
            <button class="modal-close" id="btn-close-pay-drawer">&times;</button>
          </div>
          <div class="drawer-body" id="pay-drawer-body">
            <!-- Dynamic Content -->
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', drawerHTML);

      document.getElementById('btn-close-pay-drawer').addEventListener('click', () => this.closePaymentDrawer());
      document.getElementById('pay-drawer-overlay').addEventListener('click', () => this.closePaymentDrawer());
    }

    // Module 04 Modal Container
    if (!document.getElementById('pay-generic-modal')) {
      const modalHTML = `
        <div id="pay-generic-modal" class="modal-overlay">
          <div class="modal-dialog" id="pay-generic-modal-dialog">
            <div class="modal-header">
              <div class="modal-title" id="pay-generic-modal-title">SubscriptIQ Operations</div>
              <button class="modal-close" id="btn-close-pay-modal">&times;</button>
            </div>
            <div class="modal-body" id="pay-generic-modal-body">
              <!-- Content -->
            </div>
            <div class="modal-footer" id="pay-generic-modal-footer">
              <!-- Footer Buttons -->
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);

      document.getElementById('btn-close-pay-modal').addEventListener('click', () => this.closeModal());
      document.getElementById('pay-generic-modal').addEventListener('click', (e) => {
        if (e.target.id === 'pay-generic-modal') this.closeModal();
      });
    }
  }

  closePaymentDrawer() {
    const drawer = document.getElementById('pay-detail-drawer');
    const overlay = document.getElementById('pay-drawer-overlay');
    if (drawer) drawer.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
  }

  closeModal() {
    const modal = document.getElementById('pay-generic-modal');
    if (modal) modal.classList.remove('active');
  }

  // --- 1. RECORD PAYMENT MODAL ---
  openRecordPaymentModal(preselectedInvoiceId = null) {
    const modal = document.getElementById('pay-generic-modal');
    const dialog = document.getElementById('pay-generic-modal-dialog');
    const title = document.getElementById('pay-generic-modal-title');
    const body = document.getElementById('pay-generic-modal-body');
    const footer = document.getElementById('pay-generic-modal-footer');

    dialog.className = 'modal-dialog';
    title.textContent = 'Record & Reconcile Payment Receipt';

    // Retrieve open invoices from Teammate 3
    const invoices = paymentService.getInvoices();
    const openInvoices = invoices.filter(inv => inv.status !== 'Cancelled');

    const invoiceOptions = openInvoices.map(inv => {
      const isSelected = inv.invoiceNumber === preselectedInvoiceId || inv.id === preselectedInvoiceId;
      const outstanding = inv.outstandingBalance !== undefined ? inv.outstandingBalance : (inv.grandTotal - (inv.paidAmount || 0));
      return `
        <option value="${inv.invoiceNumber}" ${isSelected ? 'selected' : ''}>
          ${inv.invoiceNumber} – ${inv.customerName} (Due: ₹ ${outstanding.toLocaleString('en-IN')})
        </option>
      `;
    }).join('');

    body.innerHTML = `
      <form id="form-record-payment">
        <!-- Notice banner -->
        <div class="inv-guard-banner" style="margin-bottom: 14px; padding: 10px 14px;">
          <div class="inv-guard-content" style="font-size: 11.5px;">
            <i data-lucide="info"></i>
            <div>
              <strong>Simulated Payment Operation:</strong>
              This transaction records verified fund settlement and automatically adjusts the customer's invoice balance.
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Match Open Invoice</label>
          <select class="form-select" id="pay-form-invoice-select" style="width: 100%;">
            <option value="unallocated">-- Direct Receipt / Unallocated Advance Credit --</option>
            ${invoiceOptions}
          </select>
        </div>

        <div class="form-group" id="pay-unallocated-cust-group">
          <label class="form-label">Customer / Remitter Account Name</label>
          <input type="text" class="form-input" id="pay-form-customer-name" placeholder="e.g. Acme Technologies Ltd" style="width: 100%;">
        </div>

        <!-- Dynamic Invoice Details Box -->
        <div id="pay-form-inv-preview" class="pay-invoice-preview" style="display: none;">
          <!-- Dynamically populated -->
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Payment Amount (₹)</label>
            <input type="number" step="0.01" class="form-input" id="pay-form-amount" placeholder="0.00" style="width: 100%; font-family: var(--font-mono); font-weight: 700;" required>
            <div id="pay-amount-error" style="color: var(--danger); font-size: 11px; margin-top: 4px; display: none;"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Payment Channel / Method</label>
            <select class="form-select" id="pay-form-method" style="width: 100%;">
              <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
              <option value="Bank transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
              <option value="Card">Credit / Debit Card</option>
              <option value="Cash">Cash / Cheque</option>
              <option value="Other">Other Remittance</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Payment Date</label>
            <input type="date" class="form-input" id="pay-form-date" style="width: 100%;" value="${new Date().toISOString().slice(0, 10)}">
          </div>
          <div class="form-group">
            <label class="form-label">UTR / Transaction Reference No.</label>
            <input type="text" class="form-input" id="pay-form-reference" placeholder="e.g. UTR-HDFC-992108" style="width: 100%;">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Remittance Notes & Audit Memo</label>
          <textarea class="form-input" id="pay-form-notes" rows="2" style="width: 100%; resize: vertical;" placeholder="Add payment verification or bank reconciliation remarks..."></textarea>
        </div>
      </form>
    `;

    footer.innerHTML = `
      <button class="btn btn-secondary" id="btn-pay-modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="btn-pay-modal-submit"><i data-lucide="check"></i> Reconcile & Record Payment</button>
    `;

    const invSelect = document.getElementById('pay-form-invoice-select');
    const previewBox = document.getElementById('pay-form-inv-preview');
    const amountInput = document.getElementById('pay-form-amount');
    const errorBox = document.getElementById('pay-amount-error');
    const submitBtn = document.getElementById('btn-pay-modal-submit');

    let currentPermittedMax = Infinity;

    const updateInvoicePreview = () => {
      const invId = invSelect.value;
      const custGroup = document.getElementById('pay-unallocated-cust-group');

      if (invId === 'unallocated') {
        if (custGroup) custGroup.style.display = 'block';
        previewBox.style.display = 'none';
        currentPermittedMax = Infinity;
        errorBox.style.display = 'none';
        submitBtn.disabled = false;
        return;
      }

      if (custGroup) custGroup.style.display = 'none';

      const inv = paymentService.getInvoiceById(invId);
      if (!inv) return;

      const outstanding = inv.outstandingBalance !== undefined ? inv.outstandingBalance : (inv.grandTotal - (inv.paidAmount || 0));
      currentPermittedMax = outstanding;

      previewBox.style.display = 'block';
      previewBox.innerHTML = `
        <div class="pay-invoice-row">
          <span>Customer Account:</span>
          <strong>${inv.customerName}</strong>
        </div>
        <div class="pay-invoice-row">
          <span>Invoice Grand Total:</span>
          <span class="mono-text">₹ ${inv.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="pay-invoice-row">
          <span>Previously Paid:</span>
          <span class="mono-text" style="color: var(--success);">₹ ${(inv.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="pay-invoice-row" style="border-top: 1px dashed var(--border); margin-top: 6px; padding-top: 6px; font-weight: 700;">
          <span>Permitted Outstanding Balance:</span>
          <span class="mono-text" style="color: var(--danger);">₹ ${outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="pay-quick-actions">
          <button type="button" class="pay-quick-btn" id="btn-pay-full">Full Payment (₹ ${outstanding.toLocaleString('en-IN')})</button>
          ${outstanding > 1000 ? `<button type="button" class="pay-quick-btn" id="btn-pay-half">50% Installment (₹ ${(outstanding / 2).toLocaleString('en-IN')})</button>` : ''}
        </div>
      `;

      amountInput.value = outstanding;
      validateAmount();

      const fullBtn = document.getElementById('btn-pay-full');
      if (fullBtn) fullBtn.addEventListener('click', () => {
        amountInput.value = outstanding;
        validateAmount();
      });

      const halfBtn = document.getElementById('btn-pay-half');
      if (halfBtn) halfBtn.addEventListener('click', () => {
        amountInput.value = Math.round((outstanding / 2) * 100) / 100;
        validateAmount();
      });
    };

    const validateAmount = () => {
      const val = parseFloat(amountInput.value);
      if (isNaN(val) || val <= 0) {
        errorBox.textContent = 'Please enter a valid payment amount greater than ₹ 0.00.';
        errorBox.style.display = 'block';
        submitBtn.disabled = true;
        return false;
      }

      if (val > currentPermittedMax) {
        errorBox.textContent = `Amount cannot exceed the permitted outstanding balance of ₹ ${currentPermittedMax.toLocaleString('en-IN')}.`;
        errorBox.style.display = 'block';
        submitBtn.disabled = true;
        return false;
      }

      errorBox.style.display = 'none';
      submitBtn.disabled = false;
      return true;
    };

    invSelect.addEventListener('change', updateInvoicePreview);
    amountInput.addEventListener('input', validateAmount);

    if (preselectedInvoiceId) {
      updateInvoicePreview();
    }

    document.getElementById('btn-pay-modal-cancel').addEventListener('click', () => this.closeModal());
    submitBtn.addEventListener('click', () => {
      if (!validateAmount()) return;

      const invoiceId = invSelect.value;
      const amount = parseFloat(amountInput.value);
      const custInput = document.getElementById('pay-form-customer-name');
      const customerName = (invoiceId === 'unallocated' && custInput) ? custInput.value.trim() : undefined;
      const method = document.getElementById('pay-form-method').value;
      const date = document.getElementById('pay-form-date').value;
      const reference = document.getElementById('pay-form-reference').value;
      const notes = document.getElementById('pay-form-notes').value;

      try {
        const payment = paymentService.recordPayment({
          invoiceId,
          customerName: customerName || undefined,
          amount,
          method,
          date,
          reference,
          notes
        });

        this.closeModal();
        this.toast.show('success', 'Payment Recorded & Reconciled', `Receipt ${payment.reference} for ₹ ${payment.amount.toLocaleString('en-IN')} successfully allocated.`);
        this.openPaymentDrawer(payment.id);
      } catch (err) {
        this.toast.show('danger', 'Payment Recording Error', err.message);
      }
    });

    modal.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  }

  // --- 2. PAYMENT DETAILS DRAWER ---
  openPaymentDrawer(paymentId) {
    const payment = paymentService.getPaymentById(paymentId);
    if (!payment) return;

    const drawer = document.getElementById('pay-detail-drawer');
    const overlay = document.getElementById('pay-drawer-overlay');
    const title = document.getElementById('pay-drawer-title');
    const sub = document.getElementById('pay-drawer-sub');
    const body = document.getElementById('pay-drawer-body');

    title.textContent = `Transaction ${payment.reference}`;
    sub.textContent = `${payment.customerName} • ${payment.date} at ${payment.time || '10:00 AM'}`;

    const allocationsHTML = (payment.allocations && payment.allocations.length > 0)
      ? payment.allocations.map(a => `
          <div class="pay-allocation-item">
            <div>
              <strong>${a.invoiceNumber}</strong>
              <div style="font-size: 11px; color: var(--text-muted);">Allocated on ${a.allocationDate}</div>
            </div>
            <div style="text-align: right;">
              <span class="mono-text" style="font-weight: 700; color: var(--success);">
                ₹ ${a.allocatedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        `).join('')
      : `<div style="font-size: 12px; color: var(--text-muted); padding: 8px 0;">No invoice allocations. Retained as customer advance balance.</div>`;

    body.innerHTML = `
      <div class="inv-drawer-meta" style="margin-top: 0; margin-bottom: 20px;">
        <div class="inv-meta-item">
          <label>Status</label>
          <span class="badge ${payment.status === 'Successful' ? 'badge-success' : (payment.status === 'Refunded' ? 'badge-neutral' : 'badge-danger')}">${payment.status}</span>
        </div>
        <div class="inv-meta-item">
          <label>Reconciliation</label>
          <span style="font-weight: 600;">${payment.reconciliationStatus}</span>
        </div>
        <div class="inv-meta-item">
          <label>Payment Method</label>
          <span>${payment.method}</span>
        </div>
        <div class="inv-meta-item">
          <label>Customer Account</label>
          <span>${payment.customerName}</span>
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div style="display: flex; gap: 8px; margin-bottom: 20px;">
        ${payment.status === 'Successful' ? `
          <button class="btn btn-secondary btn-sm" id="btn-drawer-refund">
            <i data-lucide="rotate-ccw"></i> Issue Refund
          </button>
        ` : ''}
        ${payment.invoiceId ? `
          <button class="btn btn-primary btn-sm" id="btn-drawer-view-inv">
            <i data-lucide="receipt"></i> View Invoice ${payment.invoiceId}
          </button>
        ` : ''}
      </div>

      <!-- Amount Breakdown Box -->
      <div class="inv-breakdown-card">
        <div class="inv-breakdown-row">
          <span>Gross Payment Amount:</span>
          <span class="mono-text" style="font-size: 14px; font-weight: 700; color: var(--text-main);">
            ₹ ${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div class="inv-breakdown-row" style="color: var(--success);">
          <span>Allocated to Invoices:</span>
          <span class="mono-text">
            ₹ ${payment.allocatedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div class="inv-breakdown-row" style="color: ${payment.unallocatedAmount > 0 ? 'var(--warning)' : 'var(--text-muted)'};">
          <span>Unallocated Credit Balance:</span>
          <span class="mono-text">
            ₹ ${payment.unallocatedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div class="inv-breakdown-row" style="border-top: 1px solid var(--border); margin-top: 6px; padding-top: 6px;">
          <span>Channel Reference Details:</span>
          <span class="mono-text" style="font-size: 11px;">${payment.channelDetails}</span>
        </div>
      </div>

      <!-- Invoice Allocation Breakdown -->
      <div style="margin-top: 24px;">
        <div style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Invoice Allocation Breakdown</div>
        <p style="font-size: 11.5px; color: var(--text-muted); margin-bottom: 12px;">Traceability of invoice line settlements reconciled against this receipt.</p>
        ${allocationsHTML}
      </div>

      <!-- Internal Audit Notes -->
      <div style="margin-top: 20px;">
        <div style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">Audit Trail & Remarks</div>
        <div style="background: #fdfdfe; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px; font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
          ${payment.notes || 'No audit remarks attached.'}
        </div>
      </div>
    `;

    const refundBtn = document.getElementById('btn-drawer-refund');
    if (refundBtn) {
      refundBtn.addEventListener('click', () => {
        const reason = prompt(`Refund payment ${payment.reference}? Enter audit justification:`, 'Customer billing dispute resolution');
        if (reason) {
          paymentService.refundPayment(payment.id, reason);
          this.toast.show('warning', 'Payment Refunded', `Transaction ${payment.reference} reversed.`);
          this.openPaymentDrawer(payment.id);
        }
      });
    }

    const viewInvBtn = document.getElementById('btn-drawer-view-inv');
    if (viewInvBtn) {
      viewInvBtn.addEventListener('click', () => {
        this.closePaymentDrawer();
        if (window.SubscriptIQ_Invoices && typeof window.SubscriptIQ_Invoices.view === 'function') {
          window.SubscriptIQ_Invoices.view(payment.invoiceId);
        }
      });
    }

    drawer.classList.add('active');
    overlay.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  }

  // --- 3. CREATE / EDIT DISCOUNT MODAL ---
  openDiscountModal(discountId = null) {
    const isEdit = !!discountId;
    const disc = isEdit ? paymentService.getDiscountById(discountId) : null;

    const modal = document.getElementById('pay-generic-modal');
    const dialog = document.getElementById('pay-generic-modal-dialog');
    const title = document.getElementById('pay-generic-modal-title');
    const body = document.getElementById('pay-generic-modal-body');
    const footer = document.getElementById('pay-generic-modal-footer');

    dialog.className = 'modal-dialog';
    title.textContent = isEdit ? `Edit Promotional Discount – ${disc.code}` : 'Create Promotional Discount Rule';

    body.innerHTML = `
      <form id="form-discount-rule">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Promotion Campaign Name</label>
            <input type="text" class="form-input" id="disc-form-name" placeholder="e.g. Early Bird SaaS Launch" style="width: 100%;" value="${isEdit ? disc.name : ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Coupon Code (Uppercase)</label>
            <input type="text" class="form-input" id="disc-form-code" placeholder="e.g. EARLYBIRD" style="width: 100%; text-transform: uppercase; font-family: var(--font-mono); font-weight: 700;" value="${isEdit ? disc.code : ''}" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Discount Type</label>
            <select class="form-select" id="disc-form-type" style="width: 100%;">
              <option value="Percentage" ${isEdit && disc.type.includes('Percent') ? 'selected' : ''}>Percentage (%) Off</option>
              <option value="Fixed amount" ${isEdit && disc.type.includes('Fixed') ? 'selected' : ''}>Fixed Amount (₹) Off</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Discount Value</label>
            <input type="number" step="0.01" class="form-input" id="disc-form-value" placeholder="e.g. 15 or 1000" style="width: 100%; font-family: var(--font-mono); font-weight: 700;" value="${isEdit ? disc.value : 10}" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Minimum Purchase Amount (₹)</label>
            <input type="number" class="form-input" id="disc-form-min-purchase" placeholder="0" style="width: 100%;" value="${isEdit ? disc.minPurchase : 0}">
          </div>
          <div class="form-group">
            <label class="form-label">Max Usage Limit (Redemptions)</label>
            <input type="number" class="form-input" id="disc-form-limit" placeholder="100" style="width: 100%;" value="${isEdit ? disc.usageLimit : 100}">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Start Date</label>
            <input type="date" class="form-input" id="disc-form-start" style="width: 100%;" value="${isEdit ? disc.startDate : new Date().toISOString().slice(0, 10)}">
          </div>
          <div class="form-group">
            <label class="form-label">End Date</label>
            <input type="date" class="form-input" id="disc-form-end" style="width: 100%;" value="${isEdit ? disc.endDate : '2027-12-31'}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Applicable Products & Services</label>
          <select class="form-select" id="disc-form-products" style="width: 100%;">
            <option value="All Cloud Subscriptions & Services" ${isEdit && disc.applicableProducts.includes('All') ? 'selected' : ''}>All Cloud Subscriptions & Services</option>
            <option value="SubscriptIQ Cloud Enterprise" ${isEdit && disc.applicableProducts.includes('Enterprise') ? 'selected' : ''}>SubscriptIQ Cloud Enterprise Only</option>
            <option value="SubscriptIQ Pro Team Workspace" ${isEdit && disc.applicableProducts.includes('Workspace') ? 'selected' : ''}>SubscriptIQ Pro Team Workspace Only</option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-select" id="disc-form-status" style="width: 100%;">
              <option value="Active" ${!isEdit || disc.status === 'Active' ? 'selected' : ''}>Active (Eligible for Checkout)</option>
              <option value="Inactive" ${isEdit && disc.status === 'Inactive' ? 'selected' : ''}>Inactive (Deactivated)</option>
            </select>
          </div>
          <div class="form-group" style="display: flex; align-items: center; margin-top: 24px;">
            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
              <input type="checkbox" id="disc-form-recurring" ${!isEdit || disc.subscriptionWide ? 'checked' : ''}>
              Apply to recurring renewal cycles
            </label>
          </div>
        </div>
      </form>
    `;

    footer.innerHTML = `
      <button class="btn btn-secondary" id="btn-disc-cancel">Cancel</button>
      <button class="btn btn-primary" id="btn-disc-submit"><i data-lucide="check"></i> ${isEdit ? 'Save Changes' : 'Create Promotion'}</button>
    `;

    document.getElementById('btn-disc-cancel').addEventListener('click', () => this.closeModal());
    document.getElementById('btn-disc-submit').addEventListener('click', () => {
      const name = document.getElementById('disc-form-name').value.trim();
      const code = document.getElementById('disc-form-code').value.trim();
      const type = document.getElementById('disc-form-type').value;
      const value = parseFloat(document.getElementById('disc-form-value').value);
      const minPurchase = parseFloat(document.getElementById('disc-form-min-purchase').value) || 0;
      const usageLimit = parseInt(document.getElementById('disc-form-limit').value) || 100;
      const startDate = document.getElementById('disc-form-start').value;
      const endDate = document.getElementById('disc-form-end').value;
      const applicableProducts = document.getElementById('disc-form-products').value;
      const status = document.getElementById('disc-form-status').value;
      const subscriptionWide = document.getElementById('disc-form-recurring').checked;

      if (!name || !code || isNaN(value)) {
        alert('Please complete all required fields.');
        return;
      }

      try {
        if (isEdit) {
          paymentService.updateDiscount(discountId, {
            name, code, type, value, minPurchase, usageLimit, startDate, endDate, applicableProducts, status, subscriptionWide
          });
          this.toast.show('success', 'Promotion Updated', `Discount rule "${code}" has been updated.`);
        } else {
          paymentService.createDiscount({
            name, code, type, value, minPurchase, usageLimit, startDate, endDate, applicableProducts, status, subscriptionWide
          });
          this.toast.show('success', 'Promotion Created', `Promotional code "${code}" is now active.`);
        }
        this.closeModal();
      } catch (err) {
        alert(err.message);
      }
    });

    modal.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  }
}
