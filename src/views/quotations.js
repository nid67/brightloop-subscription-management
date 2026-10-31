import { iconHtml, refreshIcons } from '../utils/icons.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { formatCurrency } from '../utils/currency.js';
import { api } from '../services/api.js';
import { Modal } from '../components/modal.js';
import { notification } from '../services/notification.js';

export function renderQuotationsView(container) {
  const role = localStorage.getItem('brightloop_role') || 'ADMIN';
  const quotations = api.getQuotations();
  const customers = api.getCustomers();

  container.innerHTML = `
    <div class="app-shell">
      ${renderSidebar('quotations', { name: 'Admin User', role })}

      <main class="app-main">
        ${renderHeader('Quotations', role)}

        <div class="app-content">
          <div class="page-header">
            <div>
              <h1 class="page-title">Commercial Quotation Management</h1>
              <p class="page-subtitle">Draft proposals, apply templates, and convert accepted quotes into subscriptions</p>
            </div>
            <div>
              <button class="btn btn-primary" id="btn-create-quotation">
                ${iconHtml('plus', { size: 16 })} Create Quotation
              </button>
            </div>
          </div>

          <div class="table-box">
            <div class="table-bar">
              <div class="search-box">
                ${iconHtml('search', { size: 14 })}
                <input type="text" class="search-input" placeholder="Search quotations..." />
              </div>
              <div style="display:flex; gap:8px;">
                <span class="badge badge-neutral">All (${quotations.length})</span>
                <span class="badge badge-info">Sent</span>
                <span class="badge badge-success">Converted</span>
              </div>
            </div>

            <div>
              ${quotations.length === 0 ? `
                <div class="empty-state">
                  <div class="empty-icon">${iconHtml('file-check', { size: 24 })}</div>
                  <div class="empty-title">No quotations issued yet</div>
                  <div class="empty-desc">Create customer proposals and convert them into confirmed subscriptions with 1-click.</div>
                  <button class="btn btn-primary btn-sm" id="btn-empty-qt">
                    ${iconHtml('plus', { size: 14 })} Create Quotation
                  </button>
                </div>
              ` : `
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Quotation #</th>
                      <th>Customer</th>
                      <th>Template</th>
                      <th>Valid Until</th>
                      <th>Status</th>
                      <th style="text-align:right;">Subtotal</th>
                      <th style="text-align:right;">Total</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${quotations.map(q => `
                      <tr>
                        <td><strong>${q.quotationNumber}</strong></td>
                        <td>${q.customerName}</td>
                        <td>${q.templateName || 'Standard Proposal'}</td>
                        <td>${q.validUntil}</td>
                        <td>
                          <span class="badge ${q.status === 'Converted' ? 'badge-success' : 'badge-info'}">
                            ${q.status}
                          </span>
                        </td>
                        <td style="text-align:right;">${formatCurrency(q.subtotal)}</td>
                        <td style="text-align:right; font-weight:700;">${formatCurrency(q.totalAmount)}</td>
                        <td>
                          ${q.status !== 'Converted' ? `
                            <button class="btn btn-primary btn-sm convert-btn" data-id="${q.id}">
                              Convert to Sub →
                            </button>
                          ` : `<span style="color:var(--success-text); font-weight:600;">Converted ✓</span>`}
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

  const convertBtns = container.querySelectorAll('.convert-btn');
  convertBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const qId = btn.getAttribute('data-id');
      try {
        const sub = api.convertQuotationToSubscription(qId);
        notification.success('Converted to Subscription', `Created subscription contract ${sub.subscriptionNumber}.`);
        renderQuotationsView(container);
      } catch (err) {
        notification.error('Error', err.message);
      }
    });
  });

  const openQtModal = () => {
    new Modal({
      title: 'Create Commercial Quotation',
      size: 'lg',
      content: `
        <form id="qt-form">
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
            <div class="form-group">
              <label class="form-label">Customer *</label>
              <select id="q-cust" class="form-select">
                ${customers.length === 0 ? '<option value="cust_temp">Acme Technologies Ltd</option>' : customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Template</label>
              <select id="q-tmpl" class="form-select">
                <option value="Enterprise Annual Proposal">Enterprise Annual Proposal</option>
                <option value="Growth Velocity Proposal">Growth Velocity Proposal</option>
                <option value="Starter SaaS Pilot">Starter SaaS Pilot</option>
              </select>
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
            <div class="form-group">
              <label class="form-label">Total Proposal Amount (₹) *</label>
              <input type="number" id="q-total" class="form-input" value="3021" min="0" required />
            </div>
            <div class="form-group">
              <label class="form-label">Validity (Days)</label>
              <input type="number" id="q-days" class="form-input" value="30" />
            </div>
          </div>
        </form>
      `,
      footer: `
        <button class="btn btn-secondary modal-close-btn">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-qt">Send Quotation</button>
      `
    }).open();

    const submitBtn = document.querySelector('#btn-submit-qt');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const custSelect = document.querySelector('#q-cust');
        const customerName = custSelect.options[custSelect.selectedIndex]?.text || 'Customer';
        const templateName = document.querySelector('#q-tmpl').value;
        const total = Number(document.querySelector('#q-total').value) || 3021;
        const subtotal = Math.round(total / 1.18);
        const taxAmount = total - subtotal;
        const validUntil = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

        api.createQuotation({
          customerId: custSelect.value,
          customerName,
          templateName,
          validUntil,
          subtotal,
          taxAmount,
          totalAmount: total,
          items: [{ description: templateName, total }]
        });

        notification.success('Quotation Created', `Proposal sent to ${customerName}.`);
        document.querySelector('.modal-dialog').closest('.modal-overlay').remove();
        renderQuotationsView(container);
      });
    }
  };

  const createBtn = container.querySelector('#btn-create-quotation');
  const emptyBtn = container.querySelector('#btn-empty-qt');
  if (createBtn) createBtn.addEventListener('click', openQtModal);
  if (emptyBtn) emptyBtn.addEventListener('click', openQtModal);
}
