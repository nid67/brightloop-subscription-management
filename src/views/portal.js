import { iconHtml, refreshIcons } from '../utils/icons.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { formatCurrency } from '../utils/currency.js';
import { api } from '../services/api.js';
import { notification } from '../services/notification.js';

export function renderPortalView(container) {
  const role = localStorage.getItem('brightloop_role') || 'CUSTOMER';
  const subscriptions = api.getSubscriptions();
  const invoices = api.getInvoices();

  container.innerHTML = `
    <div class="app-shell">
      ${renderSidebar('portal', { name: 'Customer User', role })}

      <main class="app-main">
        ${renderHeader('Customer Self-Service Portal', role)}

        <div class="app-content">
          <!-- Customer Welcome Banner -->
          <div class="card" style="background:linear-gradient(135deg, #0a2540 0%, #172a45 100%); color:#ffffff; padding:28px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <span class="badge badge-success" style="margin-bottom:8px;">Customer Portal</span>
              <h1 style="font-size:22px; font-weight:700;">Welcome to your Billing & Subscription Center</h1>
              <p style="color:#adb9c8; font-size:13.5px; margin-top:4px;">
                Review active software subscriptions, download tax invoices, submit renewal requests, or manage payment methods.
              </p>
            </div>
            <div>
              <button class="btn btn-secondary btn-sm" onclick="alert('Account profile settings opened.')">
                ${iconHtml('user', { size: 14 })} Account Settings
              </button>
            </div>
          </div>

          <!-- My Active Subscriptions (Section 5) -->
          <div class="card" style="margin-bottom:24px;">
            <div class="card-header">
              <span class="card-title">My Active Subscriptions</span>
              <span style="font-size:12px; color:var(--text-muted);">Self-Service Controls</span>
            </div>
            <div class="card-body" style="padding:0;">
              ${subscriptions.length === 0 ? `
                <div class="empty-state">
                  <div class="empty-icon">${iconHtml('repeat', { size: 24 })}</div>
                  <div class="empty-title">No active subscriptions on file</div>
                  <div class="empty-desc">When you subscribe to Brightloop services, contract details will appear here.</div>
                </div>
              ` : `
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Subscription #</th>
                      <th>Plan Name</th>
                      <th>Frequency</th>
                      <th>Renewal Date</th>
                      <th>Status</th>
                      <th style="text-align:right;">Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${subscriptions.map(s => `
                      <tr>
                        <td><strong>${s.subscriptionNumber}</strong></td>
                        <td>${s.planName}</td>
                        <td><span class="badge badge-neutral">${s.billingFrequency}</span></td>
                        <td>${s.nextBillingDate || '—'}</td>
                        <td><span class="badge badge-success">${s.status}</span></td>
                        <td style="text-align:right; font-weight:700;">${formatCurrency(s.totalAmount)}</td>
                        <td>
                          <div style="display:flex; gap:6px;">
                            <button class="btn btn-secondary btn-sm req-pause-btn" data-id="${s.id}">
                              Request Pause
                            </button>
                            <button class="btn btn-subtle btn-sm req-cancel-btn" data-id="${s.id}" style="color:var(--danger);">
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              `}
            </div>
          </div>

          <!-- My Invoices & Receipts (Section 5) -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">My Invoices & Receipts</span>
              <span style="font-size:12px; color:var(--text-muted);">PDF Downloads & Online Settlement</span>
            </div>
            <div class="card-body" style="padding:0;">
              ${invoices.length === 0 ? `
                <div class="empty-state">
                  <div class="empty-icon">${iconHtml('file-text', { size: 24 })}</div>
                  <div class="empty-title">No invoices issued yet</div>
                  <div class="empty-desc">Billing statements and payment receipts will be available for download here.</div>
                </div>
              ` : `
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Invoice Date</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th style="text-align:right;">Amount</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${invoices.map(inv => `
                      <tr>
                        <td><strong>${inv.invoiceNumber}</strong></td>
                        <td>${inv.invoiceDate}</td>
                        <td>${inv.dueDate}</td>
                        <td>
                          <span class="badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-danger'}">
                            ${inv.status}
                          </span>
                        </td>
                        <td style="text-align:right; font-weight:700;">${formatCurrency(inv.totalAmount)}</td>
                        <td>
                          ${inv.status !== 'Paid' ? `
                            <button class="btn btn-primary btn-sm pay-online-btn" data-id="${inv.id}">
                              Pay Online
                            </button>
                          ` : `
                            <button class="btn btn-secondary btn-sm" onclick="window.print()">
                              Download PDF
                            </button>
                          `}
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

  const pauseBtns = container.querySelectorAll('.req-pause-btn');
  pauseBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      notification.info('Pause Requested', 'Your pause request has been submitted for review.');
    });
  });

  const payBtns = container.querySelectorAll('.pay-online-btn');
  payBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const inv = api.getInvoiceById(id);
      if (inv) {
        inv.status = 'Paid';
        api.saveState();
        notification.success('Payment Received', `Invoice ${inv.invoiceNumber} settled.`);
        renderPortalView(container);
      }
    });
  });
}
