import { iconHtml, refreshIcons } from '../utils/icons.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { formatCurrency } from '../utils/currency.js';
import { api } from '../services/api.js';
import { Modal } from '../components/modal.js';
import { notification } from '../services/notification.js';

export function renderPaymentsView(container) {
  const role = localStorage.getItem('brightloop_role') || 'ADMIN';
  const payments = api.getPayments();
  const invoices = api.getInvoices();

  container.innerHTML = `
    <div class="app-shell">
      ${renderSidebar('payments', { name: 'Admin User', role })}

      <main class="app-main">
        ${renderHeader('Payments & Reconciliation', role)}

        <div class="app-content">
          <div class="page-header">
            <div>
              <h1 class="page-title">Payment Operations & Reconciliation</h1>
              <p class="page-subtitle">Record customer settlements, match invoice references, and track clearing</p>
            </div>
            <div>
              <button class="btn btn-primary" id="btn-record-payment">
                ${iconHtml('plus', { size: 16 })} Record Payment
              </button>
            </div>
          </div>

          <div class="table-box">
            <div class="table-bar">
              <div class="search-box">
                ${iconHtml('search', { size: 14 })}
                <input type="text" class="search-input" placeholder="Search reference # or customer..." />
              </div>
              <div style="display:flex; gap:8px;">
                <span class="badge badge-neutral">All (${payments.length})</span>
                <span class="badge badge-success">Successful</span>
                <span class="badge badge-warning">Unallocated</span>
              </div>
            </div>

            <div>
              ${payments.length === 0 ? `
                <div class="empty-state">
                  <div class="empty-icon">${iconHtml('credit-card', { size: 24 })}</div>
                  <div class="empty-title">No payments recorded</div>
                  <div class="empty-desc">Record incoming payments via UPI, NetBanking, Card, or Cash against confirmed invoices.</div>
                  <button class="btn btn-primary btn-sm" id="btn-empty-record-pay">
                    ${iconHtml('plus', { size: 14 })} Record First Payment
                  </button>
                </div>
              ` : `
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Payment #</th>
                      <th>Invoice Ref</th>
                      <th>Customer</th>
                      <th>Method</th>
                      <th>Reference #</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Reconciliation</th>
                      <th style="text-align:right;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${payments.map(p => `
                      <tr>
                        <td><strong>${p.paymentNumber}</strong></td>
                        <td><code>${p.invoiceNumber || 'Unassigned'}</code></td>
                        <td>${p.customerName || '—'}</td>
                        <td>${p.method}</td>
                        <td><small style="color:var(--text-muted);">${p.referenceNumber}</small></td>
                        <td>${p.paymentDate}</td>
                        <td>
                          <span class="badge ${p.status === 'Successful' ? 'badge-success' : 'badge-warning'}">
                            ${p.status}
                          </span>
                        </td>
                        <td>
                          <span class="badge ${p.reconciliationStatus === 'Reconciled' ? 'badge-success' : 'badge-warning'}">
                            ${p.reconciliationStatus}
                          </span>
                        </td>
                        <td style="text-align:right; font-weight:700; color:var(--text-main);">
                          ${formatCurrency(p.amount)}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              `}
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  refreshIcons(container);

  const openPayModal = () => {
    new Modal({
      title: 'Record Incoming Payment',
      size: 'lg',
      content: `
        <form id="record-pay-form">
          <div class="form-group">
            <label class="form-label">Select Invoice</label>
            <select id="pay-inv-select" class="form-select">
              ${invoices.length === 0 ? '<option value="">No open invoices (Record unallocated payment)</option>' : invoices.map(i => `<option value="${i.id}" data-cust="${i.customerName}" data-num="${i.invoiceNumber}" data-amt="${i.totalAmount}">${i.invoiceNumber} - ${i.customerName} (${formatCurrency(i.totalAmount)})</option>`).join('')}
            </select>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
            <div class="form-group">
              <label class="form-label">Payment Method *</label>
              <select id="pay-method" class="form-select">
                <option value="UPI">UPI (PhonePe, GPay, Paytm)</option>
                <option value="Bank Transfer (NEFT/RTGS)" selected>Bank Transfer (NEFT/RTGS)</option>
                <option value="Credit / Debit Card">Credit / Debit Card</option>
                <option value="Cash">Cash</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Amount Paid (₹) *</label>
              <input type="number" id="pay-amount" class="form-input" placeholder="3021" min="1" required />
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
            <div class="form-group">
              <label class="form-label">Bank Transaction / Reference #</label>
              <input type="text" id="pay-ref" class="form-input" placeholder="e.g. HDFC-NEFT-994411" required />
            </div>
            <div class="form-group">
              <label class="form-label">Payment Date</label>
              <input type="date" id="pay-date" class="form-input" value="${new Date().toISOString().split('T')[0]}" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Internal Audit Notes</label>
            <input type="text" id="pay-notes" class="form-input" placeholder="e.g. Verified via bank statement" />
          </div>
        </form>
      `,
      footer: `
        <button class="btn btn-secondary modal-close-btn">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-payment">Save Payment</button>
      `
    }).open();

    const submitBtn = document.querySelector('#btn-submit-payment');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const invSelect = document.querySelector('#pay-inv-select');
        const selectedOpt = invSelect.options[invSelect.selectedIndex];
        const invoiceId = invSelect.value;
        const invoiceNumber = selectedOpt?.getAttribute('data-num') || 'UNALLOCATED';
        const customerName = selectedOpt?.getAttribute('data-cust') || 'Customer';
        const amount = Number(document.querySelector('#pay-amount').value) || 3021;
        const method = document.querySelector('#pay-method').value;
        const referenceNumber = document.querySelector('#pay-ref').value.trim() || `REF-${Date.now()}`;
        const paymentDate = document.querySelector('#pay-date').value;
        const notes = document.querySelector('#pay-notes').value.trim();

        api.recordPayment({
          invoiceId,
          invoiceNumber,
          customerName,
          amount,
          method,
          referenceNumber,
          paymentDate,
          notes
        });

        notification.success('Payment Recorded', `Payment of ${formatCurrency(amount)} recorded successfully.`);
        document.querySelector('.modal-backdrop').remove();
        renderPaymentsView(container);
      });
    }
  };

  const recBtn = container.querySelector('#btn-record-payment');
  const emptyRecBtn = container.querySelector('#btn-empty-record-pay');
  if (recBtn) recBtn.addEventListener('click', openPayModal);
  if (emptyRecBtn) emptyRecBtn.addEventListener('click', openPayModal);
}
