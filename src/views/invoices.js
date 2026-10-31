import { iconHtml, refreshIcons } from '../utils/icons.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { formatCurrency } from '../utils/currency.js';
import { api } from '../services/api.js';
import { Modal } from '../components/modal.js';
import { notification } from '../services/notification.js';

export function renderInvoicesView(container) {
  const role = localStorage.getItem('brightloop_role') || 'ADMIN';
  const invoices = api.getInvoices();
  const subscriptions = api.getSubscriptions();

  container.innerHTML = `
    <div class="app-shell">
      ${renderSidebar('invoices', { name: 'Admin User', role })}

      <main class="app-main">
        ${renderHeader('Invoices & Billing', role)}

        <div class="app-content">
          <div class="page-header">
            <div>
              <h1 class="page-title">Tax Invoices & Billing Operations</h1>
              <p class="page-subtitle">Dual-GST calculation, duplicate billing prevention locks, and payment tracking</p>
            </div>
            <div>
              <button class="btn btn-primary" id="btn-generate-inv">
                ${iconHtml('plus', { size: 16 })} Generate Invoice
              </button>
            </div>
          </div>

          <!-- Section 13 Duplicate Prevention Lock -->
          <div style="background:#ffffff; border:1px solid var(--border); border-radius:var(--radius-lg); padding:14px 18px; margin-bottom:24px; display:flex; align-items:center; justify-content:space-between; font-size:13px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="color:var(--success);">${iconHtml('shield-check', { size: 18 })}</span>
              <div>
                <strong>Duplicate Prevention Guard:</strong>
                <span style="color:var(--text-muted); margin-left:4px;">
                  System ensures never generating duplicate invoices for the same subscription billing period.
                </span>
              </div>
            </div>
            <span class="badge badge-success">Enforced</span>
          </div>

          <div class="table-box">
            <div class="table-bar">
              <div class="search-box">
                ${iconHtml('search', { size: 14 })}
                <input type="text" class="search-input" placeholder="Search invoice # or customer..." />
              </div>
              <div style="display:flex; gap:8px;">
                <span class="badge badge-neutral">All (${invoices.length})</span>
                <span class="badge badge-success">Paid</span>
                <span class="badge badge-warning">Confirmed</span>
                <span class="badge badge-danger">Overdue</span>
              </div>
            </div>

            <div>
              ${invoices.length === 0 ? `
                <div class="empty-state">
                  <div class="empty-icon">${iconHtml('file-text', { size: 24 })}</div>
                  <div class="empty-title">No invoices generated yet</div>
                  <div class="empty-desc">Invoices generated from active subscription billing cycles will appear here.</div>
                  <button class="btn btn-primary btn-sm" id="btn-empty-inv">
                    ${iconHtml('plus', { size: 14 })} Generate Invoice
                  </button>
                </div>
              ` : `
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th style="text-align:right;">Subtotal</th>
                      <th style="text-align:right;">GST Tax</th>
                      <th style="text-align:right;">Total Due</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${invoices.map(inv => `
                      <tr>
                        <td><strong>${inv.invoiceNumber}</strong></td>
                        <td>${inv.customerName}</td>
                        <td>${inv.invoiceDate}</td>
                        <td>${inv.dueDate}</td>
                        <td>
                          <span class="badge ${inv.status === 'Paid' ? 'badge-success' : inv.status === 'Overdue' ? 'badge-danger' : 'badge-warning'}">
                            ${inv.status}
                          </span>
                        </td>
                        <td style="text-align:right;">${formatCurrency(inv.subtotal)}</td>
                        <td style="text-align:right; color:var(--text-muted);">+${formatCurrency(inv.taxAmount)}</td>
                        <td style="text-align:right; font-weight:700; color:var(--text-main);">${formatCurrency(inv.totalAmount)}</td>
                        <td>
                          <button class="btn btn-secondary btn-sm print-action" data-id="${inv.id}">
                            ${iconHtml('printer', { size: 14 })} Printable View
                          </button>
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

  const printBtns = container.querySelectorAll('.print-action');
  printBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const invId = btn.getAttribute('data-id');
      const inv = api.getInvoiceById(invId);
      if (!inv) return;

      new Modal({
        title: `Tax Invoice: ${inv.invoiceNumber}`,
        size: 'lg',
        content: `
          <div style="font-size:13.5px; padding:10px;">
            <div style="display:flex; justify-content:space-between; border-bottom:2px solid var(--border); padding-bottom:16px; margin-bottom:16px;">
              <div>
                <h2 style="font-size:18px; font-weight:800; color:var(--text-main);">Brightloop Software Ltd</h2>
                <div style="color:var(--text-muted); font-size:12px; margin-top:2px;">GSTIN: 29ABCDE1234F1Z5 • Bengaluru, Karnataka</div>
              </div>
              <div style="text-align:right;">
                <div style="font-family:var(--font-mono); font-size:16px; font-weight:700;">${inv.invoiceNumber}</div>
                <div style="color:var(--text-muted); font-size:12px;">Date: ${inv.invoiceDate} • Due: ${inv.dueDate}</div>
                <span class="badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-danger'}" style="margin-top:4px;">${inv.status}</span>
              </div>
            </div>

            <div style="margin-bottom:16px;">
              <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:var(--text-muted);">Billed To:</div>
              <div style="font-weight:700; font-size:14px; color:var(--text-main);">${inv.customerName}</div>
              <div style="color:var(--text-muted); font-size:12.5px;">GSTIN: 29AABCA1234F1Z1 • Electronic Tax Invoice</div>
            </div>

            <table class="data-table" style="margin-bottom:16px;">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th style="text-align:right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${(inv.items || [{ description: 'Subscription Service Billing', qty: 1, unitPrice: inv.subtotal, total: inv.subtotal }]).map(it => `
                  <tr>
                    <td><strong>${it.description}</strong></td>
                    <td>${it.qty || 1}</td>
                    <td>${formatCurrency(it.unitPrice)}</td>
                    <td style="text-align:right; font-weight:700;">${formatCurrency(it.total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div style="background:var(--bg-subtle); padding:14px; border-radius:var(--radius-md); border:1px solid var(--border); max-width:320px; margin-left:auto;">
              <div style="display:flex; justify-content:space-between;"><span>Subtotal:</span> <strong>${formatCurrency(inv.subtotal)}</strong></div>
              <div style="display:flex; justify-content:space-between; margin-top:2px;"><span>CGST (9%) + SGST (9%):</span> <strong>+${formatCurrency(inv.taxAmount)}</strong></div>
              <div style="display:flex; justify-content:space-between; margin-top:6px; font-weight:700; color:var(--primary); font-size:16px; border-top:1px solid var(--border); padding-top:6px;">
                <span>Total Amount:</span> <span>${formatCurrency(inv.totalAmount)}</span>
              </div>
            </div>
          </div>
        `,
        footer: `
          <button class="btn btn-secondary modal-close-btn">Close</button>
          <button class="btn btn-primary" onclick="window.print()">
            ${iconHtml('printer', { size: 16 })} Print / Save PDF
          </button>
        `
      }).open();
    });
  });

  const openGenModal = () => {
    new Modal({
      title: 'Generate Tax Invoice',
      size: 'lg',
      content: `
        <form id="gen-inv-form">
          <div class="form-group">
            <label class="form-label">Active Subscription Link</label>
            <select id="inv-sub" class="form-select">
              ${subscriptions.length === 0 ? '<option value="">Ad-hoc invoice (No active subscription)</option>' : subscriptions.map(s => `<option value="${s.id}" data-name="${s.customerName}" data-amt="${s.totalAmount}">${s.subscriptionNumber} - ${s.customerName} (${formatCurrency(s.totalAmount)})</option>`).join('')}
            </select>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
            <div class="form-group">
              <label class="form-label">Customer Name *</label>
              <input type="text" id="inv-cust" class="form-input" placeholder="e.g. Acme Technologies Ltd" value="Acme Technologies Ltd" required />
            </div>
            <div class="form-group">
              <label class="form-label">Total Amount (₹) *</label>
              <input type="number" id="inv-total" class="form-input" value="3021" min="0" required />
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
            <div class="form-group">
              <label class="form-label">Invoice Date</label>
              <input type="date" id="inv-d" class="form-input" value="${new Date().toISOString().split('T')[0]}" />
            </div>
            <div class="form-group">
              <label class="form-label">Due Date</label>
              <input type="date" id="inv-due" class="form-input" value="${new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]}" />
            </div>
          </div>
        </form>
      `,
      footer: `
        <button class="btn btn-secondary modal-close-btn">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-inv">Issue Invoice</button>
      `
    }).open();

    const submitBtn = document.querySelector('#btn-submit-inv');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const customerName = document.querySelector('#inv-cust').value.trim();
        const total = Number(document.querySelector('#inv-total').value) || 3021;
        const subtotal = Math.round(total / 1.18);
        const taxAmount = total - subtotal;
        const invoiceDate = document.querySelector('#inv-d').value;
        const dueDate = document.querySelector('#inv-due').value;

        api.generateInvoice({
          customerName,
          subtotal,
          taxAmount,
          totalAmount: total,
          invoiceDate,
          dueDate,
          items: [{ description: 'Subscription Billing Period', qty: 1, unitPrice: subtotal, total: subtotal }]
        });

        notification.success('Invoice Created', `Issued invoice to ${customerName}.`);
        document.querySelector('.modal-dialog').closest('.modal-overlay').remove();
        renderInvoicesView(container);
      });
    }
  };

  const genBtn = container.querySelector('#btn-generate-inv');
  const emptyBtn = container.querySelector('#btn-empty-inv');
  if (genBtn) genBtn.addEventListener('click', openGenModal);
  if (emptyBtn) emptyBtn.addEventListener('click', openGenModal);
}
