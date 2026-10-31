import { iconHtml, refreshIcons } from '../utils/icons.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { formatCurrency } from '../utils/currency.js';
import { api } from '../services/api.js';
import { Modal } from '../components/modal.js';
import { Drawer } from '../components/drawer.js';
import { notification } from '../services/notification.js';

export function renderCustomersView(container) {
  const role = localStorage.getItem('brightloop_role') || 'ADMIN';
  const customers = api.getCustomers();

  container.innerHTML = `
    <div class="app-shell">
      ${renderSidebar('customers', { name: 'Admin User', role })}

      <main class="app-main">
        ${renderHeader('Customer Management', role)}

        <div class="app-content">
          <div class="page-header">
            <div>
              <h1 class="page-title">Customer Management</h1>
              <p class="page-subtitle">Manage customer profiles, billing addresses, tax IDs, and subscription history</p>
            </div>
            <div>
              <button class="btn btn-primary" id="btn-add-customer">
                ${iconHtml('plus', { size: 16 })} Add Customer
              </button>
            </div>
          </div>

          <div class="table-box">
            <div class="table-bar">
              <div class="search-box">
                ${iconHtml('search', { size: 14 })}
                <input type="text" id="customer-search-input" class="search-input" placeholder="Search customers..." />
              </div>
              <div style="display:flex; gap:8px;">
                <span class="badge badge-neutral">All (${customers.length})</span>
                <span class="badge badge-neutral">Enterprise</span>
                <span class="badge badge-neutral">Mid-Market</span>
                <span class="badge badge-neutral">Startup</span>
              </div>
            </div>

            <div>
              ${customers.length === 0 ? `
                <div class="empty-state">
                  <div class="empty-icon">${iconHtml('users', { size: 24 })}</div>
                  <div class="empty-title">No customers added yet</div>
                  <div class="empty-desc">Create your first customer profile or connect your backend API to begin managing subscriptions.</div>
                  <button class="btn btn-primary btn-sm" id="empty-add-customer-btn">
                    ${iconHtml('plus', { size: 14 })} Add First Customer
                  </button>
                </div>
              ` : `
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Customer / Company</th>
                      <th>Email</th>
                      <th>Tier</th>
                      <th>Tax ID / GSTIN</th>
                      <th>Payment Terms</th>
                      <th>Status</th>
                      <th style="text-align:right;">Lifetime Revenue</th>
                      <th style="text-align:right;">Balance</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${customers.map(c => `
                      <tr>
                        <td>
                          <strong>${c.name}</strong>
                          <div style="font-size:12px; color:var(--text-muted);">${c.company || '—'}</div>
                        </td>
                        <td>${c.email}</td>
                        <td><span class="badge badge-neutral">${c.tier}</span></td>
                        <td><code>${c.taxId || '—'}</code></td>
                        <td>${c.paymentTerms}</td>
                        <td>
                          <span class="badge ${c.status === 'Active' ? 'badge-success' : 'badge-neutral'}">
                            ${c.status}
                          </span>
                        </td>
                        <td style="text-align:right; font-weight:600;">${formatCurrency(c.lifetimeValue)}</td>
                        <td style="text-align:right; font-weight:600; color:${c.balance > 0 ? 'var(--danger)' : 'var(--text-main)'};">
                          ${formatCurrency(c.balance)}
                        </td>
                        <td>
                          <button class="btn btn-subtle btn-sm view-customer-btn" data-id="${c.id}">
                            View Profile
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

  const openAddModal = () => {
    new Modal({
      title: 'Add New Customer Profile',
      size: 'lg',
      content: `
        <form id="add-customer-form">
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
            <div class="form-group">
              <label class="form-label">Full Name / Contact Person *</label>
              <input type="text" id="cust-name" class="form-input" placeholder="e.g. Vikram Mehta" required />
            </div>
            <div class="form-group">
              <label class="form-label">Company / Legal Name *</label>
              <input type="text" id="cust-company" class="form-input" placeholder="e.g. Acme Technologies Ltd" required />
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
            <div class="form-group">
              <label class="form-label">Email Address *</label>
              <input type="email" id="cust-email" class="form-input" placeholder="billing@acmetech.in" required />
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="tel" id="cust-phone" class="form-input" placeholder="+91 98201 54321" />
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:16px;">
            <div class="form-group">
              <label class="form-label">Customer Tier</label>
              <select id="cust-tier" class="form-select">
                <option value="Enterprise">Enterprise</option>
                <option value="Mid-Market">Mid-Market</option>
                <option value="Startup">Startup</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">GSTIN / Tax ID</label>
              <input type="text" id="cust-taxid" class="form-input" placeholder="29AABCA1234F1Z1" />
            </div>
            <div class="form-group">
              <label class="form-label">Payment Terms</label>
              <select id="cust-terms" class="form-select">
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30" selected>Net 30</option>
                <option value="Net 60">Net 60</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Billing Address</label>
            <textarea id="cust-address" class="form-textarea" rows="2" placeholder="Building, Street, City, State, Postal Code"></textarea>
          </div>
        </form>
      `,
      footer: `
        <button class="btn btn-secondary modal-close-btn">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-customer">Save Customer</button>
      `
    }).open();

    const submitBtn = document.querySelector('#btn-submit-customer');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const name = document.querySelector('#cust-name').value.trim();
        const company = document.querySelector('#cust-company').value.trim();
        const email = document.querySelector('#cust-email').value.trim();
        const phone = document.querySelector('#cust-phone').value.trim();
        const tier = document.querySelector('#cust-tier').value;
        const taxId = document.querySelector('#cust-taxid').value.trim();
        const paymentTerms = document.querySelector('#cust-terms').value;
        const billingAddress = document.querySelector('#cust-address').value.trim();

        if (!name || !email) {
          notification.error('Validation Error', 'Please enter customer name and email.');
          return;
        }

        api.createCustomer({ name, company, email, phone, tier, taxId, paymentTerms, billingAddress });
        notification.success('Customer Created', `${name} has been added to directory.`);
        document.querySelector('.modal-dialog').closest('.modal-overlay').remove();
        renderCustomersView(container);
      });
    }
  };

  const addBtn = container.querySelector('#btn-add-customer');
  const emptyAddBtn = container.querySelector('#empty-add-customer-btn');
  if (addBtn) addBtn.addEventListener('click', openAddModal);
  if (emptyAddBtn) emptyAddBtn.addEventListener('click', openAddModal);

  const rowBtns = container.querySelectorAll('.view-customer-btn');
  rowBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const custId = btn.getAttribute('data-id');
      const cust = api.getCustomerById(custId);
      if (!cust) return;

      new Drawer({
        title: cust.name,
        subtitle: `${cust.company || 'Customer'} • ${cust.tier}`,
        content: `
          <div style="font-size:13.5px;">
            <div style="background:var(--bg-subtle); border:1px solid var(--border); border-radius:var(--radius-md); padding:16px; margin-bottom:16px;">
              <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:8px;">Contact Information</div>
              <div>Email: <strong>${cust.email}</strong></div>
              <div>Phone: <strong>${cust.phone || '—'}</strong></div>
              <div>Tax ID / GSTIN: <strong>${cust.taxId || '—'}</strong></div>
              <div>Payment Terms: <strong>${cust.paymentTerms}</strong></div>
              ${cust.billingAddress ? `<div style="margin-top:6px;">Address: ${cust.billingAddress}</div>` : ''}
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:16px;">
              <div class="card" style="padding:12px;">
                <div style="font-size:11px; text-transform:uppercase; color:var(--text-muted);">Lifetime Value</div>
                <div style="font-size:18px; font-weight:700; color:var(--text-main);">${formatCurrency(cust.lifetimeValue)}</div>
              </div>
              <div class="card" style="padding:12px;">
                <div style="font-size:11px; text-transform:uppercase; color:var(--text-muted);">Balance Due</div>
                <div style="font-size:18px; font-weight:700; color:${cust.balance > 0 ? 'var(--danger)' : 'var(--text-main)'};">${formatCurrency(cust.balance)}</div>
              </div>
            </div>
          </div>
        `,
        footer: `
          <button class="btn btn-secondary drawer-close-btn">Close</button>
          <button class="btn btn-primary" onclick="window.location.hash='#/subscriptions'">Create Subscription</button>
        `
      }).open();
    });
  });
}
