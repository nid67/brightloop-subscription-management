import { iconHtml, refreshIcons } from '../utils/icons.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { formatCurrency } from '../utils/currency.js';
import { api } from '../services/api.js';
import { Modal } from '../components/modal.js';
import { notification } from '../services/notification.js';

export function renderDiscountsView(container) {
  const role = localStorage.getItem('brightloop_role') || 'ADMIN';
  const discounts = api.getDiscounts();

  container.innerHTML = `
    <div class="app-shell">
      ${renderSidebar('discounts', { name: 'Admin User', role })}

      <main class="app-main">
        ${renderHeader('Discounts & Promotions', role)}

        <div class="app-content">
          <div class="page-header">
            <div>
              <h1 class="page-title">Discount Rules & Promotions</h1>
              <p class="page-subtitle">Configure percentage and fixed discounts, minimum thresholds, and usage limits</p>
            </div>
            <div>
              <button class="btn btn-primary" id="btn-create-discount">
                ${iconHtml('plus', { size: 16 })} Create Discount
              </button>
            </div>
          </div>

          <div class="table-box">
            <div class="table-bar">
              <div class="search-box">
                ${iconHtml('search', { size: 14 })}
                <input type="text" class="search-input" placeholder="Search discount codes..." />
              </div>
            </div>

            <div>
              ${discounts.length === 0 ? `
                <div class="empty-state">
                  <div class="empty-icon">${iconHtml('tag', { size: 24 })}</div>
                  <div class="empty-title">No discounts configured yet</div>
                  <div class="empty-desc">Create fixed or percentage promotions with usage caps and expiry dates.</div>
                  <button class="btn btn-primary btn-sm" id="btn-empty-disc">
                    ${iconHtml('plus', { size: 14 })} Create Discount
                  </button>
                </div>
              ` : `
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Code & Name</th>
                      <th>Type</th>
                      <th>Value</th>
                      <th>Scope</th>
                      <th>Usage / Limit</th>
                      <th>Validity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${discounts.map(d => `
                      <tr>
                        <td>
                          <strong>${d.code}</strong>
                          <div style="font-size:12px; color:var(--text-muted);">${d.name}</div>
                        </td>
                        <td><span class="badge badge-info">${d.type}</span></td>
                        <td style="font-weight:700; color:var(--text-main);">
                          ${d.type === 'Percentage' ? `${d.value}% Off` : `-${formatCurrency(d.value)}`}
                        </td>
                        <td><span class="badge badge-neutral">${d.scope}</span></td>
                        <td>${d.usageCount} / ${d.usageLimit} uses</td>
                        <td style="font-size:12px; color:var(--text-muted);">
                          ${d.startDate || 'Open'} ${d.endDate ? `→ ${d.endDate}` : ''}
                        </td>
                        <td>
                          <span class="badge ${d.active ? 'badge-success' : 'badge-danger'}">
                            ${d.active ? 'Active' : 'Expired'}
                          </span>
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

  const openModal = () => {
    new Modal({
      title: 'Configure Commercial Discount',
      size: 'lg',
      content: `
        <form id="disc-form">
          <div style="display:grid; grid-template-columns: 1fr 2fr; gap:16px;">
            <div class="form-group">
              <label class="form-label">Discount Code *</label>
              <input type="text" id="dc-code" class="form-input" placeholder="e.g. ANNUAL15" style="text-transform:uppercase;" required />
            </div>
            <div class="form-group">
              <label class="form-label">Discount Name *</label>
              <input type="text" id="dc-name" class="form-input" placeholder="Annual Commitment Incentive" required />
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:16px;">
            <div class="form-group">
              <label class="form-label">Type</label>
              <select id="dc-type" class="form-select">
                <option value="Percentage">Percentage (%)</option>
                <option value="Fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Value *</label>
              <input type="number" id="dc-val" class="form-input" placeholder="15" min="0" required />
            </div>
            <div class="form-group">
              <label class="form-label">Usage Limit</label>
              <input type="number" id="dc-limit" class="form-input" value="100" min="1" />
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
            <div class="form-group">
              <label class="form-label">Start Date</label>
              <input type="date" id="dc-start" class="form-input" value="${new Date().toISOString().split('T')[0]}" />
            </div>
            <div class="form-group">
              <label class="form-label">End Date</label>
              <input type="date" id="dc-end" class="form-input" />
            </div>
          </div>
        </form>
      `,
      footer: `
        <button class="btn btn-secondary modal-close-btn">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-dc">Save Discount</button>
      `
    }).open();

    const submitBtn = document.querySelector('#btn-submit-dc');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const code = document.querySelector('#dc-code').value.trim();
        const name = document.querySelector('#dc-name').value.trim();
        const type = document.querySelector('#dc-type').value;
        const value = Number(document.querySelector('#dc-val').value) || 0;
        const usageLimit = Number(document.querySelector('#dc-limit').value) || 100;
        const startDate = document.querySelector('#dc-start').value;
        const endDate = document.querySelector('#dc-end').value;

        if (!code || !name) {
          notification.error('Validation Error', 'Please enter discount code and name.');
          return;
        }

        api.createDiscount({ code, name, type, value, usageLimit, startDate, endDate });
        notification.success('Discount Created', `${code} promotion is active.`);
        document.querySelector('.modal-dialog').closest('.modal-overlay').remove();
        renderDiscountsView(container);
      });
    }
  };

  const createBtn = container.querySelector('#btn-create-discount');
  const emptyBtn = container.querySelector('#btn-empty-disc');
  if (createBtn) createBtn.addEventListener('click', openModal);
  if (emptyBtn) emptyBtn.addEventListener('click', openModal);
}
