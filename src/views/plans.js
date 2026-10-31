import { iconHtml, refreshIcons } from '../utils/icons.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { formatCurrency } from '../utils/currency.js';
import { api } from '../services/api.js';
import { Modal } from '../components/modal.js';
import { notification } from '../services/notification.js';

export function renderPlansView(container) {
  const role = localStorage.getItem('brightloop_role') || 'ADMIN';
  const plans = api.getPlans();

  container.innerHTML = `
    <div class="app-shell">
      ${renderSidebar('plans', { name: 'Admin User', role })}

      <main class="app-main">
        ${renderHeader('Plan Management', role)}

        <div class="app-content">
          <div class="page-header">
            <div>
              <h1 class="page-title">Subscription Plan Management</h1>
              <p class="page-subtitle">Configure billing cadences (Daily, Weekly, Monthly, Yearly) and lifecycle rules</p>
            </div>
            <div>
              <button class="btn btn-primary" id="btn-create-plan">
                ${iconHtml('plus', { size: 16 })} Create Plan
              </button>
            </div>
          </div>

          <div class="table-box">
            <div class="table-bar">
              <span style="font-weight:600; font-size:14px;">Configured Plans (${plans.length})</span>
              <div style="display:flex; gap:8px;">
                <span class="badge badge-neutral">Daily</span>
                <span class="badge badge-neutral">Weekly</span>
                <span class="badge badge-neutral">Monthly</span>
                <span class="badge badge-neutral">Yearly</span>
              </div>
            </div>

            <div>
              ${plans.length === 0 ? `
                <div class="empty-state">
                  <div class="empty-icon">${iconHtml('calendar-days', { size: 24 })}</div>
                  <div class="empty-title">No plans configured</div>
                  <div class="empty-desc">Create your recurring subscription plans with billing frequency and lifecycle rules.</div>
                  <button class="btn btn-primary btn-sm" id="btn-empty-plan">
                    ${iconHtml('plus', { size: 14 })} Create Plan
                  </button>
                </div>
              ` : `
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Plan Name</th>
                      <th>Billing Frequency</th>
                      <th>Base Price</th>
                      <th>Min Qty</th>
                      <th>Lifecycle Rules</th>
                      <th>Availability</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${plans.map(p => `
                      <tr>
                        <td>
                          <strong>${p.name}</strong>
                          <div style="font-size:12px; color:var(--text-muted);">${p.description || 'Standard plan'}</div>
                        </td>
                        <td><span class="badge badge-info">${p.billingFrequency}</span></td>
                        <td style="font-weight:700; color:var(--text-main);">${formatCurrency(p.basePrice)}</td>
                        <td>${p.minQuantity || 1} units</td>
                        <td>
                          <div style="display:flex; gap:4px; flex-wrap:wrap; font-size:11px;">
                            ${p.allowPause ? '<span class="badge badge-neutral">Pause OK</span>' : ''}
                            ${p.allowRenewal ? '<span class="badge badge-success">Auto-Renew</span>' : ''}
                            ${p.autoClose ? '<span class="badge badge-warning">Auto-Close</span>' : ''}
                          </div>
                        </td>
                        <td style="font-size:12.5px; color:var(--text-muted);">
                          ${p.availabilityStart || 'Open'} ${p.availabilityEnd ? `→ ${p.availabilityEnd}` : ''}
                        </td>
                        <td><span class="badge badge-success">Active</span></td>
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

  const openPlanModal = () => {
    new Modal({
      title: 'Configure Subscription Plan',
      size: 'lg',
      content: `
        <form id="plan-form">
          <div style="display:grid; grid-template-columns: 2fr 1fr; gap:16px;">
            <div class="form-group">
              <label class="form-label">Plan Name *</label>
              <input type="text" id="pl-name" class="form-input" placeholder="e.g. Enterprise Annual Scale" required />
            </div>
            <div class="form-group">
              <label class="form-label">Billing Frequency *</label>
              <select id="pl-freq" class="form-select">
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly" selected>Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
            <div class="form-group">
              <label class="form-label">Base Price (₹) *</label>
              <input type="number" id="pl-price" class="form-input" placeholder="4500" min="0" required />
            </div>
            <div class="form-group">
              <label class="form-label">Minimum Quantity</label>
              <input type="number" id="pl-min-qty" class="form-input" value="1" min="1" />
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
            <div class="form-group">
              <label class="form-label">Availability Start</label>
              <input type="date" id="pl-start" class="form-input" value="${new Date().toISOString().split('T')[0]}" />
            </div>
            <div class="form-group">
              <label class="form-label">Availability End</label>
              <input type="date" id="pl-end" class="form-input" />
            </div>
          </div>

          <div style="background:var(--bg-subtle); border:1px solid var(--border); border-radius:var(--radius-md); padding:12px; margin-top:8px;">
            <div style="font-size:12px; font-weight:700; color:var(--text-main); margin-bottom:8px;">Lifecycle Policy Flags</div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; font-size:13px;">
              <label style="display:flex; align-items:center; gap:6px;">
                <input type="checkbox" id="pl-pause" checked /> Allow customer pause requests
              </label>
              <label style="display:flex; align-items:center; gap:6px;">
                <input type="checkbox" id="pl-early" checked /> Allow early contract closure
              </label>
              <label style="display:flex; align-items:center; gap:6px;">
                <input type="checkbox" id="pl-renew" checked /> Enable automated renewal
              </label>
              <label style="display:flex; align-items:center; gap:6px;">
                <input type="checkbox" id="pl-autoclose" /> Auto-close upon expiry date
              </label>
            </div>
          </div>
        </form>
      `,
      footer: `
        <button class="btn btn-secondary modal-close-btn">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-plan">Save Plan</button>
      `
    }).open();

    const submitBtn = document.querySelector('#btn-submit-plan');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const name = document.querySelector('#pl-name').value.trim();
        const billingFrequency = document.querySelector('#pl-freq').value;
        const basePrice = Number(document.querySelector('#pl-price').value) || 0;
        const minQuantity = Number(document.querySelector('#pl-min-qty').value) || 1;
        const availabilityStart = document.querySelector('#pl-start').value;
        const availabilityEnd = document.querySelector('#pl-end').value;
        const allowPause = document.querySelector('#pl-pause').checked;
        const allowEarlyClosure = document.querySelector('#pl-early').checked;
        const allowRenewal = document.querySelector('#pl-renew').checked;
        const autoClose = document.querySelector('#pl-autoclose').checked;

        if (!name || !basePrice) {
          notification.error('Validation Error', 'Please enter plan name and base price.');
          return;
        }

        api.createPlan({ name, billingFrequency, basePrice, minQuantity, availabilityStart, availabilityEnd, allowPause, allowEarlyClosure, allowRenewal, autoClose });
        notification.success('Plan Created', `${name} is ready for subscriptions.`);
        document.querySelector('.modal-dialog').closest('.modal-overlay').remove();
        renderPlansView(container);
      });
    }
  };

  const createBtn = container.querySelector('#btn-create-plan');
  const emptyBtn = container.querySelector('#btn-empty-plan');
  if (createBtn) createBtn.addEventListener('click', openPlanModal);
  if (emptyBtn) emptyBtn.addEventListener('click', openPlanModal);
}
