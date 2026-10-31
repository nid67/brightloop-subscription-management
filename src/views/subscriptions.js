import { iconHtml, refreshIcons } from '../utils/icons.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { formatCurrency } from '../utils/currency.js';
import { api } from '../services/api.js';
import { Modal } from '../components/modal.js';
import { Drawer } from '../components/drawer.js';
import { notification } from '../services/notification.js';

export function renderSubscriptionsView(container) {
  const role = localStorage.getItem('brightloop_role') || 'ADMIN';
  const subscriptions = api.getSubscriptions();
  const customers = api.getCustomers();
  const plans = api.getPlans();

  container.innerHTML = `
    <div class="app-shell">
      ${renderSidebar('subscriptions', { name: 'Admin User', role })}

      <main class="app-main">
        ${renderHeader('Subscription Operations', role)}

        <div class="app-content">
          <div class="page-header">
            <div>
              <h1 class="page-title">Subscription Contracts & Lifecycle</h1>
              <p class="page-subtitle">Track lifecycle transitions: Draft → Quotation → Confirmed → Active → Closed</p>
            </div>
            <div>
              <button class="btn btn-primary" id="btn-create-sub">
                ${iconHtml('plus', { size: 16 })} Create Subscription
              </button>
            </div>
          </div>

          <div class="table-box">
            <div class="table-bar">
              <div class="search-box">
                ${iconHtml('search', { size: 14 })}
                <input type="text" class="search-input" placeholder="Search subscription # or customer..." />
              </div>
              <div style="display:flex; gap:8px;">
                <span class="badge badge-neutral">All (${subscriptions.length})</span>
                <span class="badge badge-success">Active</span>
                <span class="badge badge-warning">Quotation</span>
                <span class="badge badge-neutral">Draft</span>
              </div>
            </div>

            <div>
              ${subscriptions.length === 0 ? `
                <div class="empty-state">
                  <div class="empty-icon">${iconHtml('repeat', { size: 24 })}</div>
                  <div class="empty-title">No subscriptions created yet</div>
                  <div class="empty-desc">Create your first customer subscription contract with variant items, taxes, and renewal settings.</div>
                  <button class="btn btn-primary btn-sm" id="btn-empty-sub">
                    ${iconHtml('plus', { size: 14 })} Create Subscription
                  </button>
                </div>
              ` : `
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Subscription #</th>
                      <th>Customer</th>
                      <th>Plan</th>
                      <th>Cadence</th>
                      <th>Next Billing</th>
                      <th>Status</th>
                      <th>Health</th>
                      <th style="text-align:right;">Contract Value</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${subscriptions.map(s => `
                      <tr>
                        <td><strong>${s.subscriptionNumber}</strong></td>
                        <td>${s.customerName}</td>
                        <td>${s.planName}</td>
                        <td><span class="badge badge-neutral">${s.billingFrequency}</span></td>
                        <td>${s.nextBillingDate || '—'}</td>
                        <td>
                          <span class="badge ${s.status === 'Active' ? 'badge-success' : s.status === 'Quotation' ? 'badge-warning' : 'badge-neutral'}">
                            ${s.status}
                          </span>
                        </td>
                        <td><strong>${s.healthScore || 90}/100</strong></td>
                        <td style="text-align:right; font-weight:700; color:var(--text-main);">${formatCurrency(s.totalAmount)}</td>
                        <td>
                          <button class="btn btn-subtle btn-sm view-sub-btn" data-id="${s.id}">
                            View Details
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

  const openSubModal = () => {
    new Modal({
      title: 'Create Subscription Contract',
      size: 'lg',
      content: `
        <form id="sub-form">
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
            <div class="form-group">
              <label class="form-label">Assign Customer *</label>
              <select id="sub-cust" class="form-select">
                ${customers.length === 0 ? '<option value="cust_temp" data-name="Acme Technologies Ltd">Acme Technologies Ltd</option>' : customers.map(c => `<option value="${c.id}" data-name="${c.name}">${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Select Plan *</label>
              <select id="sub-plan" class="form-select">
                ${plans.length === 0 ? '<option value="plan_temp" data-name="Enterprise Annual Scale">Enterprise Annual Scale (Monthly)</option>' : plans.map(p => `<option value="${p.id}" data-name="${p.name}">${p.name} (${p.billingFrequency})</option>`).join('')}
              </select>
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 2fr 1fr; gap:16px;">
            <div class="form-group">
              <label class="form-label">Product & Variant</label>
              <select id="sub-variant" class="form-select">
                <option value="2560">Brightloop Core Platform + Odoo Sync (₹2,560/mo)</option>
                <option value="2000">Brightloop Core Standard Cloud (₹2,000/mo)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Quantity</label>
              <input type="number" id="sub-qty" class="form-input" value="1" min="1" />
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:16px;">
            <div class="form-group">
              <label class="form-label">Start Date</label>
              <input type="date" id="sub-start" class="form-input" value="${new Date().toISOString().split('T')[0]}" />
            </div>
            <div class="form-group">
              <label class="form-label">Expiry Date</label>
              <input type="date" id="sub-end" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Lifecycle Stage</label>
              <select id="sub-state" class="form-select">
                <option value="Active" selected>Active</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Quotation">Quotation</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          <div style="background:var(--bg-subtle); border:1px solid var(--border); border-radius:var(--radius-md); padding:12px;">
            <div style="display:flex; justify-content:space-between; font-size:13px;">
              <span>Subtotal:</span> <strong>₹2,560</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text-muted); margin-top:2px;">
              <span>GST Tax (18%):</span> <strong>+₹461</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:15px; font-weight:700; color:var(--text-main); margin-top:6px; border-top:1px solid var(--border); padding-top:6px;">
              <span>Total Value:</span> <span style="color:var(--primary);">₹3,021</span>
            </div>
          </div>
        </form>
      `,
      footer: `
        <button class="btn btn-secondary modal-close-btn">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-sub">Create Subscription</button>
      `
    }).open();

    const submitBtn = document.querySelector('#btn-submit-sub');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const custSelect = document.querySelector('#sub-cust');
        const customerName = custSelect.options[custSelect.selectedIndex]?.getAttribute('data-name') || 'Customer';
        const planSelect = document.querySelector('#sub-plan');
        const planName = planSelect.options[planSelect.selectedIndex]?.getAttribute('data-name') || 'Plan';
        const status = document.querySelector('#sub-state').value;
        const startDate = document.querySelector('#sub-start').value;
        const expiryDate = document.querySelector('#sub-end').value;

        api.createSubscription({
          customerId: custSelect.value,
          customerName,
          planName,
          status,
          startDate,
          expiryDate,
          subtotal: 2560,
          taxAmount: 461,
          totalAmount: 3021,
          items: [{ productName: 'Brightloop Core Platform', variantName: 'Odoo Sync', quantity: 1, unitPrice: 2560, total: 2560 }]
        });

        notification.success('Subscription Created', `Contract activated in ${status} status.`);
        document.querySelector('.modal-dialog').closest('.modal-overlay').remove();
        renderSubscriptionsView(container);
      });
    }
  };

  const createBtn = container.querySelector('#btn-create-sub');
  const emptyBtn = container.querySelector('#btn-empty-sub');
  if (createBtn) createBtn.addEventListener('click', openSubModal);
  if (emptyBtn) emptyBtn.addEventListener('click', openSubModal);

  const viewBtns = container.querySelectorAll('.view-sub-btn');
  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const subId = btn.getAttribute('data-id');
      const sub = api.getSubscriptionById(subId);
      if (!sub) return;

      new Drawer({
        title: sub.subscriptionNumber,
        subtitle: `${sub.customerName} • ${sub.planName}`,
        content: `
          <div style="font-size:13.5px;">
            <div style="background:var(--bg-subtle); border:1px solid var(--border); border-radius:var(--radius-md); padding:16px; margin-bottom:16px;">
              <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:8px;">Contract Lifecycle State</div>
              <div style="display:flex; gap:6px;">
                <span class="badge ${sub.status === 'Draft' ? 'badge-info' : 'badge-neutral'}">Draft</span>
                <span class="badge ${sub.status === 'Quotation' ? 'badge-info' : 'badge-neutral'}">Quotation</span>
                <span class="badge ${sub.status === 'Confirmed' ? 'badge-info' : 'badge-neutral'}">Confirmed</span>
                <span class="badge ${sub.status === 'Active' ? 'badge-success' : 'badge-neutral'}">Active</span>
              </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:16px;">
              <div>Start Date: <strong>${sub.startDate}</strong></div>
              <div>Billing Frequency: <strong>${sub.billingFrequency}</strong></div>
              <div>Next Billing: <strong>${sub.nextBillingDate || '—'}</strong></div>
              <div>Auto-Renew: <strong>${sub.autoRenew ? 'Yes' : 'No'}</strong></div>
            </div>

            <div style="font-size:12px; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:6px;">Line Items & Variants</div>
            <table class="data-table" style="margin-bottom:16px;">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th style="text-align:right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${(sub.items || []).map(it => `
                  <tr>
                    <td>${it.productName} <br /><small style="color:var(--text-muted);">${it.variantName || 'Standard'}</small></td>
                    <td>${it.quantity}</td>
                    <td style="text-align:right; font-weight:600;">${formatCurrency(it.total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div style="background:var(--bg-subtle); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border);">
              <div style="display:flex; justify-content:space-between;"><span>Subtotal:</span> <strong>${formatCurrency(sub.subtotal)}</strong></div>
              <div style="display:flex; justify-content:space-between; margin-top:2px;"><span>GST (18%):</span> <strong>+${formatCurrency(sub.taxAmount)}</strong></div>
              <div style="display:flex; justify-content:space-between; margin-top:4px; font-weight:700; color:var(--primary); font-size:15px; border-top:1px solid var(--border); padding-top:4px;">
                <span>Total:</span> <span>${formatCurrency(sub.totalAmount)}</span>
              </div>
            </div>
          </div>
        `,
        footer: `
          <button class="btn btn-secondary drawer-close-btn">Close</button>
          <button class="btn btn-primary" onclick="window.location.hash='#/invoices'">Generate Next Invoice</button>
        `
      }).open();
    });
  });
}
