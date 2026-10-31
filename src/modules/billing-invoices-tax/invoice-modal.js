/**
 * SubscriptIQ - Modals, Drawers & Printable Sheet Controller for Module 03
 * Handles Invoice Drawer, Printable Tax Invoice Sheet, Subscription Generator,
 * Tax Rule Form, and Toast Notifications.
 */

import { invoiceService } from './invoice-service.js';

export class ToastService {
  constructor() {
    this.container = null;
    this.ensureContainer();
  }

  ensureContainer() {
    let el = document.getElementById('inv-toast-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'inv-toast-container';
      el.className = 'inv-toast-container';
      document.body.appendChild(el);
    }
    this.container = el;
  }

  show(type, title, message, duration = 4000) {
    this.ensureContainer();

    const toast = document.createElement('div');
    toast.className = `inv-toast ${type}`;

    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'danger') iconName = 'alert-triangle';
    if (type === 'warning') iconName = 'alert-circle';

    toast.innerHTML = `
      <div class="inv-toast-icon">
        <i data-lucide="${iconName}" style="width: 18px; height: 18px; color: ${type === 'success' ? 'var(--success)' : (type === 'danger' ? 'var(--danger)' : 'var(--primary)')}"></i>
      </div>
      <div style="flex: 1;">
        <div class="inv-toast-title">${title}</div>
        <div class="inv-toast-desc">${message}</div>
      </div>
      <button style="background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 0 4px;" class="toast-close">&times;</button>
    `;

    this.container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 200);
      });
    }

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 200);
      }
    }, duration);
  }
}

export class InvoiceModalService {
  constructor(toastService) {
    this.toast = toastService;
    this.ensureContainers();
  }

  ensureContainers() {
    // Inject Drawer Container if absent
    if (!document.getElementById('inv-detail-drawer')) {
      const drawerHTML = `
        <div id="inv-drawer-overlay" class="drawer-overlay"></div>
        <div id="inv-detail-drawer" class="drawer-panel">
          <div class="drawer-header">
            <div>
              <div style="font-size: 15px; font-weight: 700; color: var(--text-main);" id="inv-drawer-title">Invoice Details</div>
              <div style="font-size: 12px; color: var(--text-muted);" id="inv-drawer-sub">Loading...</div>
            </div>
            <button class="modal-close" id="btn-close-inv-drawer">&times;</button>
          </div>
          <div class="drawer-body" id="inv-drawer-body">
            <!-- Dynamic Content -->
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', drawerHTML);

      document.getElementById('btn-close-inv-drawer').addEventListener('click', () => this.closeInvoiceDrawer());
      document.getElementById('inv-drawer-overlay').addEventListener('click', () => this.closeInvoiceDrawer());
    }

    // Inject Generic Dynamic Modal Container if absent
    if (!document.getElementById('inv-generic-modal')) {
      const modalHTML = `
        <div id="inv-generic-modal" class="modal-overlay">
          <div class="modal-dialog modal-lg" id="inv-generic-modal-dialog">
            <div class="modal-header">
              <div class="modal-title" id="inv-generic-modal-title">SubscriptIQ Dialog</div>
              <button class="modal-close" id="btn-close-generic-modal">&times;</button>
            </div>
            <div class="modal-body" id="inv-generic-modal-body">
              <!-- Content -->
            </div>
            <div class="modal-footer" id="inv-generic-modal-footer">
              <!-- Footer Buttons -->
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);

      document.getElementById('btn-close-generic-modal').addEventListener('click', () => this.closeGenericModal());
      document.getElementById('inv-generic-modal').addEventListener('click', (e) => {
        if (e.target.id === 'inv-generic-modal') this.closeGenericModal();
      });
    }
  }

  closeInvoiceDrawer() {
    const drawer = document.getElementById('inv-detail-drawer');
    const overlay = document.getElementById('inv-drawer-overlay');
    if (drawer) drawer.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
  }

  closeGenericModal() {
    const modal = document.getElementById('inv-generic-modal');
    if (modal) modal.classList.remove('active');
  }

  // --- 1. INVOICE DETAIL DRAWER ---
  openInvoiceDrawer(invoiceId) {
    const inv = invoiceService.getInvoiceById(invoiceId);
    if (!inv) {
      this.toast.show('danger', 'Error', `Invoice ${invoiceId} not found.`);
      return;
    }

    const drawer = document.getElementById('inv-detail-drawer');
    const overlay = document.getElementById('inv-drawer-overlay');
    const title = document.getElementById('inv-drawer-title');
    const sub = document.getElementById('inv-drawer-sub');
    const body = document.getElementById('inv-drawer-body');

    title.textContent = `Invoice ${inv.invoiceNumber}`;
    sub.textContent = `${inv.customerName} • Billing Cycle: ${inv.billingPeriod}`;

    const linesHTML = (inv.lines || []).map(l => `
      <tr>
        <td>
          <div style="font-weight: 600;">${l.description}</div>
          <div style="font-size: 11px; color: var(--text-muted);">SAC: ${l.sac || '998313'}</div>
        </td>
        <td class="mono-text" style="text-align: center;">${l.quantity}</td>
        <td class="mono-text" style="text-align: right;">₹ ${l.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td class="mono-text" style="text-align: right;"><strong>₹ ${l.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
      </tr>
    `).join('');

    const paymentsHTML = (inv.payments && inv.payments.length > 0)
      ? inv.payments.map(p => `
          <li class="inv-history-item">
            <div>
              <strong>${p.paymentId}</strong> (${p.method})
              <div style="font-size: 11px; color: var(--text-muted);">${p.date} • Ref: ${p.reference}</div>
            </div>
            <div style="text-align: right;">
              <span class="mono-text" style="color: var(--success); font-weight: 700;">₹ ${p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              <span class="badge badge-success" style="font-size: 10px; margin-left: 6px;">${p.status}</span>
            </div>
          </li>
        `).join('')
      : `<div style="font-size: 12px; color: var(--text-muted); padding: 8px 0;">No payments recorded against this invoice yet.</div>`;

    body.innerHTML = `
      <!-- Top Meta -->
      <div class="inv-drawer-meta" style="margin-top: 0; margin-bottom: 20px;">
        <div class="inv-meta-item">
          <label>Status</label>
          <span class="badge ${this.getBadgeClass(inv.status)}">${inv.status}</span>
        </div>
        <div class="inv-meta-item">
          <label>Issue Date / Due Date</label>
          <span>${inv.invoiceDate} (Due: ${inv.dueDate})</span>
        </div>
        <div class="inv-meta-item">
          <label>GSTIN / Place of Supply</label>
          <span>${inv.customerGstin || 'Export / N/A'} • ${inv.placeOfSupply}</span>
        </div>
        <div class="inv-meta-item">
          <label>Subscription Reference</label>
          <span class="mono-text">${inv.subscriptionId} (${inv.frequency})</span>
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">
        <button class="btn btn-secondary btn-sm" id="drawer-btn-print">
          <i data-lucide="printer"></i> Print / PDF
        </button>
        <button class="btn btn-secondary btn-sm" id="drawer-btn-send">
          <i data-lucide="send"></i> Dispatch Email
        </button>
        ${inv.status === 'Draft' ? `
          <button class="btn btn-primary btn-sm" id="drawer-btn-confirm">
            <i data-lucide="check"></i> Confirm Invoice
          </button>
        ` : ''}
        ${inv.outstandingBalance > 0 && inv.status !== 'Cancelled' ? `
          <button class="btn btn-primary btn-sm" id="drawer-btn-pay">
            <i data-lucide="credit-card"></i> Record Payment
          </button>
        ` : ''}
      </div>

      <!-- Itemized Lines -->
      <div style="font-size: 13px; font-weight: 700; margin-bottom: 8px; color: var(--text-main);">Itemized Billable Items</div>
      <table class="inv-lines-table">
        <thead>
          <tr>
            <th>Description & SAC</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Rate</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${linesHTML}
        </tbody>
      </table>

      <!-- Tax & Totals Breakdown -->
      <div class="inv-breakdown-card">
        <div class="inv-breakdown-row">
          <span>Subtotal:</span>
          <span class="mono-text">₹ ${inv.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        ${inv.discountAmount > 0 ? `
          <div class="inv-breakdown-row" style="color: var(--success);">
            <span>Discount Applied:</span>
            <span class="mono-text">- ₹ ${inv.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        ` : ''}
        ${inv.cgstRate > 0 ? `
          <div class="inv-breakdown-row">
            <span>Central GST (CGST ${inv.cgstRate}%):</span>
            <span class="mono-text">₹ ${inv.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="inv-breakdown-row">
            <span>State GST (SGST ${inv.sgstRate}%):</span>
            <span class="mono-text">₹ ${inv.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        ` : (inv.igstRate > 0 ? `
          <div class="inv-breakdown-row">
            <span>Integrated GST (IGST ${inv.igstRate}%):</span>
            <span class="mono-text">₹ ${inv.igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        ` : `
          <div class="inv-breakdown-row">
            <span>Export GST:</span>
            <span class="mono-text">₹ 0.00 (Zero Rated under LUT)</span>
          </div>
        `)}
        <div class="inv-breakdown-row total">
          <span>Total Invoice Amount:</span>
          <span class="mono-text" style="color: var(--primary);">₹ ${inv.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="inv-breakdown-row" style="margin-top: 6px; font-weight: 600;">
          <span>Outstanding Balance Due:</span>
          <span class="mono-text" style="color: ${inv.outstandingBalance > 0 ? 'var(--danger)' : 'var(--success)'};">
            ₹ ${inv.outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <!-- Payment & Allocation History -->
      <div style="margin-top: 24px;">
        <div style="font-size: 13px; font-weight: 700; color: var(--text-main);">Payment & Settlement History</div>
        <p style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Allocated payment transactions reconciled against this invoice record.</p>
        <ul class="inv-history-list">
          ${paymentsHTML}
        </ul>
      </div>
    `;

    // Bind drawer buttons
    const printBtn = document.getElementById('drawer-btn-print');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        this.closeInvoiceDrawer();
        this.openPrintModal(inv.id);
      });
    }

    const sendBtn = document.getElementById('drawer-btn-send');
    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        invoiceService.sendInvoice(inv.id);
        this.toast.show('success', 'Email Transmitted', `Invoice dispatched to ${inv.customerEmail}`);
      });
    }

    const confirmBtn = document.getElementById('drawer-btn-confirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        invoiceService.confirmInvoice(inv.id);
        this.toast.show('success', 'Invoice Confirmed', `Invoice ${inv.invoiceNumber} has been finalized.`);
        this.openInvoiceDrawer(inv.id);
      });
    }

    const payBtn = document.getElementById('drawer-btn-pay');
    if (payBtn) {
      payBtn.addEventListener('click', () => {
        const amtStr = prompt(`Enter payment amount to record against ${inv.invoiceNumber}:`, inv.outstandingBalance);
        if (amtStr) {
          const amt = parseFloat(amtStr);
          if (isNaN(amt) || amt <= 0) {
            alert('Invalid amount');
            return;
          }
          invoiceService.recordPayment(inv.id, {
            amount: amt,
            method: 'Razorpay UPI / NEFT Mandate',
            reference: `MAN-PAY-${Date.now().toString().slice(-6)}`
          });
          this.toast.show('success', 'Payment Settled', `Recorded ₹ ${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })} towards ${inv.invoiceNumber}.`);
          this.openInvoiceDrawer(inv.id);
        }
      });
    }

    drawer.classList.add('active');
    overlay.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  }

  // --- 2. HIGH-FIDELITY PRINTABLE TAX INVOICE MODAL ---
  openPrintModal(invoiceId) {
    const inv = invoiceService.getInvoiceById(invoiceId);
    if (!inv) return;

    const supplier = invoiceService.getSupplierDetails();
    const modal = document.getElementById('inv-generic-modal');
    const dialog = document.getElementById('inv-generic-modal-dialog');
    const title = document.getElementById('inv-generic-modal-title');
    const body = document.getElementById('inv-generic-modal-body');
    const footer = document.getElementById('inv-generic-modal-footer');

    dialog.className = 'modal-dialog modal-lg';
    title.textContent = `Tax Invoice Print Preview – ${inv.invoiceNumber}`;

    const words = this.numberToWords(Math.round(inv.grandTotal));

    const lineRows = (inv.lines || []).map((line, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td>
          <strong>${line.description}</strong>
          <div style="font-size: 10.5px; color: #555;">Contract Ref: ${inv.subscriptionId} (${inv.billingPeriod})</div>
        </td>
        <td class="mono-text" style="text-align: center;">${line.sac || '998313'}</td>
        <td class="mono-text" style="text-align: center;">${line.quantity}</td>
        <td class="mono-text" style="text-align: right;">₹ ${line.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td class="mono-text" style="text-align: right;">₹ ${line.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td class="mono-text" style="text-align: right;">
          ${inv.cgstRate > 0 ? `₹ ${(line.taxableValue * 0.18).toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${inv.cgstRate + inv.sgstRate}%)` : (inv.igstRate > 0 ? `₹ ${(line.taxableValue * 0.18).toLocaleString('en-IN', { minimumFractionDigits: 2 })} (18%)` : `₹ 0.00 (LUT)`)}
        </td>
        <td class="mono-text" style="text-align: right;"><strong>₹ ${(line.taxableValue + (inv.totalTax * (line.taxableValue / inv.subtotal))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
      </tr>
    `).join('');

    body.innerHTML = `
      <div class="inv-print-sheet">
        <!-- Sheet Header -->
        <div class="inv-sheet-header">
          <div class="inv-sheet-brand">
            <h2>${supplier.companyName}</h2>
            <p><strong>CIN:</strong> ${supplier.cin} • <strong>PAN:</strong> ${supplier.pan}</p>
            <p><strong>GSTIN:</strong> ${supplier.gstin} (State: Karnataka, Code: 29)</p>
            <p style="max-width: 440px;">${supplier.address}</p>
            <p><strong>Email:</strong> ${supplier.email} • <strong>Phone:</strong> ${supplier.phone}</p>
          </div>
          <div class="inv-sheet-title">
            <h1>TAX INVOICE</h1>
            <span class="inv-sheet-badge">ORIGINAL FOR RECIPIENT</span>
            <div style="margin-top: 8px; font-size: 13px;">
              <div><strong>Invoice No:</strong> <span class="mono-text">${inv.invoiceNumber}</span></div>
              <div><strong>Invoice Date:</strong> ${inv.invoiceDate}</div>
              <div><strong>Payment Due Date:</strong> ${inv.dueDate}</div>
              <div><strong>Reverse Charge:</strong> No</div>
              <div><strong>Place of Supply:</strong> ${inv.placeOfSupply}</div>
            </div>
          </div>
        </div>

        <!-- Party Details -->
        <div class="inv-sheet-party-grid">
          <div class="inv-sheet-party">
            <h4>Billed To (Customer Details)</h4>
            <div class="inv-sheet-party-name">${inv.customerName}</div>
            <p>${inv.customerAddress}</p>
            <p style="margin-top: 4px;"><strong>GSTIN / UIN:</strong> <span class="mono-text">${inv.customerGstin || 'Not Registered / Export'}</span></p>
            <p><strong>State & Code:</strong> ${inv.placeOfSupply}</p>
            <p><strong>Email:</strong> ${inv.customerEmail}</p>
          </div>
          <div class="inv-sheet-party">
            <h4>Subscription & Billing Schedule</h4>
            <div><strong>Subscription ID:</strong> <span class="mono-text">${inv.subscriptionId}</span></div>
            <div><strong>Frequency:</strong> ${inv.frequency}</div>
            <div><strong>Billing Cycle:</strong> ${inv.billingPeriod}</div>
            <div><strong>Payment Status:</strong> <span class="badge ${this.getBadgeClass(inv.status)}">${inv.status}</span></div>
            <div style="margin-top: 8px; font-size: 11px; color: #555;">
              <strong>Idempotency Verification Token:</strong><br>
              <span class="mono-text" style="font-size: 10px;">${inv.idempotencyKey}</span>
            </div>
          </div>
        </div>

        <!-- Line Items Table -->
        <table class="inv-sheet-table">
          <thead>
            <tr>
              <th style="width: 30px;">#</th>
              <th>Description of Software Services</th>
              <th>HSN/SAC</th>
              <th>Qty</th>
              <th>Unit Rate</th>
              <th>Taxable Value</th>
              <th>GST Tax</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            ${lineRows}
          </tbody>
        </table>

        <!-- Totals & Breakdown -->
        <div class="inv-sheet-totals-wrapper">
          <div class="inv-sheet-words">
            <strong>Total Amount in Words:</strong>
            Indian Rupees ${words}
            ${inv.cgstRate === 0 && inv.igstRate === 0 ? `
              <div style="margin-top: 8px; font-size: 11px; color: #0055cc;">
                * Export of Information Technology Software Services without payment of integrated tax under Letter of Undertaking (LUT Bond Ref: ${supplier.lutNumber}).
              </div>
            ` : ''}
          </div>

          <div class="inv-sheet-totals-box">
            <div class="inv-sheet-calc-row">
              <span>Taxable Value (Subtotal):</span>
              <span class="mono-text">₹ ${inv.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            ${inv.cgstRate > 0 ? `
              <div class="inv-sheet-calc-row">
                <span>Central GST (CGST @ ${inv.cgstRate}%):</span>
                <span class="mono-text">₹ ${inv.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div class="inv-sheet-calc-row">
                <span>State GST (SGST @ ${inv.sgstRate}%):</span>
                <span class="mono-text">₹ ${inv.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            ` : (inv.igstRate > 0 ? `
              <div class="inv-sheet-calc-row">
                <span>Integrated GST (IGST @ ${inv.igstRate}%):</span>
                <span class="mono-text">₹ ${inv.igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            ` : `
              <div class="inv-sheet-calc-row">
                <span>GST Tax (Zero-Rated LUT):</span>
                <span class="mono-text">₹ 0.00</span>
              </div>
            `)}
            <div class="inv-sheet-calc-row grand-total">
              <span>Grand Total Due:</span>
              <span class="mono-text">₹ ${inv.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="inv-sheet-calc-row" style="background: #fafbfc; font-size: 12px;">
              <span>Amount Paid:</span>
              <span class="mono-text">₹ ${inv.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="inv-sheet-calc-row" style="background: #fafbfc; font-size: 12px; font-weight: 700; color: ${inv.outstandingBalance > 0 ? 'var(--danger)' : 'var(--success)'};">
              <span>Net Balance Payable:</span>
              <span class="mono-text">₹ ${inv.outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <!-- Bank Details & Authorized Signatory -->
        <div class="inv-sheet-footer-grid">
          <div class="inv-bank-box">
            <strong style="color: #24292e;">Bank Remittance Instructions:</strong><br>
            <strong>Account Name:</strong> ${supplier.bankDetails.accountName}<br>
            <strong>Bank & Branch:</strong> ${supplier.bankDetails.bankName}, ${supplier.bankDetails.branch}<br>
            <strong>A/c Number:</strong> <span class="mono-text">${supplier.bankDetails.accountNumber}</span> • <strong>IFSC:</strong> <span class="mono-text">${supplier.bankDetails.ifscCode}</span><br>
            <strong>UPI ID:</strong> <span class="mono-text">subscriptiq@hdfcbank</span>
          </div>
          <div class="inv-signatory-box">
            <div>For <strong>${supplier.companyName}</strong></div>
            <div class="inv-sign-line">Authorized Signatory</div>
          </div>
        </div>
      </div>
    `;

    footer.innerHTML = `
      <button class="btn btn-secondary" id="btn-modal-cancel">Close</button>
      <button class="btn btn-primary" id="btn-modal-trigger-print"><i data-lucide="printer"></i> Print Invoice / Save as PDF</button>
    `;

    document.getElementById('btn-modal-cancel').addEventListener('click', () => this.closeGenericModal());
    document.getElementById('btn-modal-trigger-print').addEventListener('click', () => {
      window.print();
    });

    modal.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  }

  // --- 3. GENERATE INVOICE FROM SUBSCRIPTION MODAL ---
  openGenerateModal() {
    const subs = invoiceService.getSubscriptions();
    const modal = document.getElementById('inv-generic-modal');
    const dialog = document.getElementById('inv-generic-modal-dialog');
    const title = document.getElementById('inv-generic-modal-title');
    const body = document.getElementById('inv-generic-modal-body');
    const footer = document.getElementById('inv-generic-modal-footer');

    dialog.className = 'modal-dialog';
    title.textContent = 'Generate Invoice from Subscription';

    if (subs.length === 0) {
      body.innerHTML = `
        <div class="placeholder-box" style="margin: 10px 0 20px 0; padding: 28px;">
          <i data-lucide="layers" style="width: 36px; height: 36px; color: var(--text-muted); margin-bottom: 8px;"></i>
          <h4 style="font-size: 14px; font-weight: 600; color: var(--text-main);">No Active Subscriptions Available</h4>
          <p style="font-size: 12px; color: var(--text-secondary); margin-top: 6px; line-height: 1.5;">
            Invoices are generated against active customer subscription contracts. Subscriptions will appear here once created in the Subscriptions module.
          </p>
        </div>
      `;
      footer.innerHTML = `
        <button class="btn btn-secondary" id="btn-gen-cancel">Close</button>
      `;
      document.getElementById('btn-gen-cancel').addEventListener('click', () => this.closeGenericModal());
      modal.classList.add('active');
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const subOptions = subs.map(s => `
      <option value="${s.id}">
        ${s.id} – ${s.customerName} (${s.planName} • ₹ ${s.baseAmount.toLocaleString('en-IN')})
      </option>
    `).join('');

    body.innerHTML = `
      <form id="form-generate-invoice">
        <div class="form-group">
          <label class="form-label">Select Active Subscription</label>
          <select class="form-select" id="gen-sub-id" style="width: 100%;">
            ${subOptions}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Billing Period</label>
          <input type="text" class="form-input" id="gen-billing-period" style="width: 100%;" value="2026-11-01 to 2026-11-30">
          <div class="form-help">Billing date range to invoice against this subscription cycle.</div>
        </div>

        <!-- Idempotency Warning Alert -->
        <div id="gen-dup-alert" style="display: none; margin-bottom: 16px;" class="danger-banner">
          <strong>Duplicate Billing Blocked:</strong> An active invoice has already been issued for this subscription and period.
        </div>

        <!-- Real-time Preview Box -->
        <div class="inv-breakdown-card" id="gen-calc-preview" style="margin-top: 10px;">
          <!-- Live Preview -->
        </div>
      </form>
    `;

    footer.innerHTML = `
      <button class="btn btn-secondary" id="btn-gen-cancel">Cancel</button>
      <button class="btn btn-primary" id="btn-gen-submit"><i data-lucide="check"></i> Create Finalized Invoice</button>
    `;

    const subSelect = document.getElementById('gen-sub-id');
    const periodInput = document.getElementById('gen-billing-period');
    const alertBox = document.getElementById('gen-dup-alert');
    const submitBtn = document.getElementById('btn-gen-submit');
    const previewBox = document.getElementById('gen-calc-preview');

    const updatePreview = () => {
      const subId = subSelect.value;
      const period = periodInput.value.trim();
      const sub = subs.find(s => s.id === subId);
      if (!sub) return;

      const customer = invoiceService.customers.find(c => c.id === sub.customerId);
      const taxCalc = invoiceService.calculateTaxForCustomer(sub.baseAmount, customer);
      const total = sub.baseAmount + taxCalc.totalTax;

      // Duplicate check
      const dup = invoiceService.checkDuplicateInvoice(subId, period);
      if (dup.isDuplicate) {
        alertBox.style.display = 'block';
        alertBox.innerHTML = `<strong>Duplicate Billing Blocked:</strong> ${dup.reason}`;
        submitBtn.disabled = true;
      } else {
        alertBox.style.display = 'none';
        submitBtn.disabled = false;
      }

      previewBox.innerHTML = `
        <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-muted); margin-bottom: 8px;">
          Estimated Invoice Calculation Preview
        </div>
        <div class="inv-breakdown-row">
          <span>Client & POS:</span>
          <span>${customer ? customer.name : sub.customerName} (${customer ? customer.state : 'Karnataka'})</span>
        </div>
        <div class="inv-breakdown-row">
          <span>Base Subscription:</span>
          <span class="mono-text">₹ ${sub.baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="inv-breakdown-row">
          <span>Tax Treatment:</span>
          <span>${taxCalc.taxType}</span>
        </div>
        <div class="inv-breakdown-row">
          <span>GST Tax Amount:</span>
          <span class="mono-text">₹ ${taxCalc.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="inv-breakdown-row total">
          <span>Total To Be Billed:</span>
          <span class="mono-text" style="color: var(--primary);">₹ ${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      `;
    };

    subSelect.addEventListener('change', updatePreview);
    periodInput.addEventListener('input', updatePreview);
    updatePreview();

    document.getElementById('btn-gen-cancel').addEventListener('click', () => this.closeGenericModal());
    submitBtn.addEventListener('click', () => {
      const subId = subSelect.value;
      const period = periodInput.value.trim();

      try {
        const newInv = invoiceService.generateInvoiceFromSubscription(subId, period);
        this.closeGenericModal();
        this.toast.show('success', 'Invoice Generated', `Tax invoice ${newInv.invoiceNumber} successfully created for ${newInv.customerName}.`);
        this.openInvoiceDrawer(newInv.id);
      } catch (err) {
        this.toast.show('danger', 'Generation Failed', err.message);
      }
    });

    modal.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  }

  // --- 4. SUBSCRIPTION BILLING HISTORY MODAL ---
  openSubscriptionHistoryModal(subscriptionId) {
    const history = invoiceService.getSubscriptionBillingHistory(subscriptionId);
    const sub = invoiceService.subscriptions.find(s => s.id === subscriptionId);

    const modal = document.getElementById('inv-generic-modal');
    const dialog = document.getElementById('inv-generic-modal-dialog');
    const title = document.getElementById('inv-generic-modal-title');
    const body = document.getElementById('inv-generic-modal-body');
    const footer = document.getElementById('inv-generic-modal-footer');

    dialog.className = 'modal-dialog modal-lg';
    title.textContent = `Subscription Billing History – ${subscriptionId}`;

    const invRows = (history.invoices || []).map(inv => `
      <tr>
        <td class="mono-text">
          <strong>${inv.invoiceNumber}</strong>
        </td>
        <td>${inv.billingPeriod}</td>
        <td>${inv.invoiceDate}</td>
        <td class="mono-text">₹ ${inv.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td><span class="badge ${this.getBadgeClass(inv.status)}">${inv.status}</span></td>
        <td>
          <button class="inv-action-btn" onclick="window.SubscriptIQ_Invoices.view('${inv.id}')">View</button>
        </td>
      </tr>
    `).join('');

    body.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main);">${sub ? sub.customerName : 'Subscriber'}</h4>
        <p style="font-size: 12px; color: var(--text-secondary);">${sub ? sub.planName : ''} • Frequency: ${sub ? sub.frequency : ''} • Next Scheduled Date: ${sub ? sub.nextBillingDate : ''}</p>
      </div>

      <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px;">Generated Invoices for this Contract</div>
      <table class="data-table" style="margin-bottom: 24px;">
        <thead>
          <tr>
            <th>Invoice No</th>
            <th>Billing Period</th>
            <th>Issue Date</th>
            <th>Total Amount</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${invRows.length > 0 ? invRows : '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No invoices generated yet.</td></tr>'}
        </tbody>
      </table>
    `;

    footer.innerHTML = `
      <button class="btn btn-secondary" id="btn-close-hist">Close</button>
    `;

    document.getElementById('btn-close-hist').addEventListener('click', () => this.closeGenericModal());
    modal.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  }

  // --- 5. CREATE / EDIT TAX RULE MODAL ---
  openTaxRuleModal(taxId = null) {
    const isEdit = !!taxId;
    const rule = isEdit ? invoiceService.taxRules.find(t => t.id === taxId) : null;

    const modal = document.getElementById('inv-generic-modal');
    const dialog = document.getElementById('inv-generic-modal-dialog');
    const title = document.getElementById('inv-generic-modal-title');
    const body = document.getElementById('inv-generic-modal-body');
    const footer = document.getElementById('inv-generic-modal-footer');

    dialog.className = 'modal-dialog';
    title.textContent = isEdit ? `Edit Tax Rule – ${rule.name}` : 'Add Tax Configuration Rule';

    body.innerHTML = `
      <form id="form-tax-rule">
        <div class="form-group">
          <label class="form-label">Tax Category Label</label>
          <input type="text" class="form-input" id="tax-form-name" style="width: 100%;" value="${isEdit ? rule.name : ''}" placeholder="e.g. GST 18% Cloud Services" required>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Tax Rate (%)</label>
            <input type="number" step="0.01" class="form-input" id="tax-form-rate" style="width: 100%;" value="${isEdit ? rule.rate : 18.0}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Tax Type</label>
            <select class="form-select" id="tax-form-type" style="width: 100%;">
              <option value="Dual-GST (CGST 9% + SGST 9%)" ${isEdit && rule.type.includes('Dual') ? 'selected' : ''}>Dual-GST (CGST + SGST)</option>
              <option value="IGST (18%)" ${isEdit && rule.type.includes('IGST') ? 'selected' : ''}>IGST (Inter-state)</option>
              <option value="Zero Rated (Export)" ${isEdit && rule.type.includes('Zero') ? 'selected' : ''}>Zero Rated (Export LUT)</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Applicable Products / SAC</label>
          <input type="text" class="form-input" id="tax-form-products" style="width: 100%;" value="${isEdit ? rule.applicableProducts : 'All Cloud Subscriptions & Services (SAC 998313)'}">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Effective Start Date</label>
            <input type="date" class="form-input" id="tax-form-start" style="width: 100%;" value="${isEdit ? rule.startDate : '2026-04-01'}">
          </div>
          <div class="form-group">
            <label class="form-label">Effective End Date</label>
            <input type="date" class="form-input" id="tax-form-end" style="width: 100%;" value="${isEdit ? rule.endDate : '2028-03-31'}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select" id="tax-form-status" style="width: 100%;">
            <option value="Active" ${!isEdit || rule.status === 'Active' ? 'selected' : ''}>Active (Live Evaluation)</option>
            <option value="Inactive" ${isEdit && rule.status === 'Inactive' ? 'selected' : ''}>Inactive (Draft / Staged)</option>
          </select>
        </div>
      </form>
    `;

    footer.innerHTML = `
      <button class="btn btn-secondary" id="btn-tax-cancel">Cancel</button>
      <button class="btn btn-primary" id="btn-tax-submit"><i data-lucide="check"></i> ${isEdit ? 'Save Changes' : 'Create Tax Rule'}</button>
    `;

    document.getElementById('btn-tax-cancel').addEventListener('click', () => this.closeGenericModal());
    document.getElementById('btn-tax-submit').addEventListener('click', () => {
      const name = document.getElementById('tax-form-name').value.trim();
      const rate = parseFloat(document.getElementById('tax-form-rate').value);
      const type = document.getElementById('tax-form-type').value;
      const applicableProducts = document.getElementById('tax-form-products').value.trim();
      const startDate = document.getElementById('tax-form-start').value;
      const endDate = document.getElementById('tax-form-end').value;
      const status = document.getElementById('tax-form-status').value;

      if (!name) {
        alert('Tax Label is required.');
        return;
      }

      if (isEdit) {
        invoiceService.updateTaxRule(taxId, { name, rate, type, applicableProducts, startDate, endDate, status });
        this.toast.show('success', 'Tax Rule Updated', `Tax rule "${name}" has been updated.`);
      } else {
        invoiceService.createTaxRule({ name, rate, type, applicableProducts, startDate, endDate, status });
        this.toast.show('success', 'Tax Rule Added', `Tax rule "${name}" has been created.`);
      }

      this.closeGenericModal();
    });

    modal.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  }

  getBadgeClass(status) {
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

  numberToWords(num) {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const format = (n) => {
      if (n === 0) return '';
      if (n < 20) return a[n] + ' ';
      if (n < 100) return b[Math.floor(n / 10)] + ' ' + a[n % 10] + ' ';
      if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred ' + format(n % 100);
      if (n < 100000) return format(Math.floor(n / 1000)) + ' Thousand ' + format(n % 1000);
      if (n < 10000000) return format(Math.floor(n / 100000)) + ' Lakh ' + format(n % 100000);
      return format(Math.floor(n / 10000000)) + ' Crore ' + format(n % 10000000);
    };

    if (num === 0) return 'Zero Only';
    return format(num).trim() + ' Only';
  }
}
