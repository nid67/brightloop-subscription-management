import { iconHtml, refreshIcons } from '../utils/icons.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { api } from '../services/api.js';
import { Modal } from '../components/modal.js';
import { notification } from '../services/notification.js';

export function renderTaxesView(container) {
  const role = localStorage.getItem('brightloop_role') || 'ADMIN';
  const taxes = api.getTaxes();

  container.innerHTML = `
    <div class="app-shell">
      ${renderSidebar('taxes', { name: 'Admin User', role })}

      <main class="app-main">
        ${renderHeader('Tax Management', role)}

        <div class="app-content">
          <div class="page-header">
            <div>
              <h1 class="page-title">Tax Configuration & Compliance</h1>
              <p class="page-subtitle">Configure GST, VAT, and withholding tax rates across product lines</p>
            </div>
            <div>
              <button class="btn btn-primary" id="btn-create-tax">
                ${iconHtml('plus', { size: 16 })} Create Tax Rule
              </button>
            </div>
          </div>

          <!-- Section 15 Clear UI Notice -->
          <div style="background:#ffffff; border:1px solid var(--border); border-radius:var(--radius-lg); padding:14px 18px; margin-bottom:24px; display:flex; align-items:center; justify-content:space-between; font-size:13.5px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="color:#2563eb;">${iconHtml('info', { size: 18 })}</span>
              <div>
                <strong>Backend Tax Engine:</strong>
                <span style="color:var(--text-muted); margin-left:4px;">
                  All effective tax rates and compound dual-GST amounts are calculated deterministically by the backend.
                </span>
              </div>
            </div>
            <span class="badge badge-info">Automated</span>
          </div>

          <div class="table-box">
            <div class="table-bar">
              <span style="font-weight:600; font-size:14px;">Configured Tax Rules (${taxes.length})</span>
            </div>

            <div>
              ${taxes.length === 0 ? `
                <div class="empty-state">
                  <div class="empty-icon">${iconHtml('percent', { size: 24 })}</div>
                  <div class="empty-title">No tax rules configured</div>
                  <div class="empty-desc">Create GST 18%, Export Zero-Rated, or custom withholding tax policies.</div>
                  <button class="btn btn-primary btn-sm" id="btn-empty-tax">
                    ${iconHtml('plus', { size: 14 })} Create Tax Rule
                  </button>
                </div>
              ` : `
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Tax Name</th>
                      <th>Percentage</th>
                      <th>Type</th>
                      <th>Effective Dates</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${taxes.map(t => `
                      <tr>
                        <td>
                          <strong>${t.name}</strong>
                          <div style="font-size:12px; color:var(--text-muted);">${t.description || 'Standard rate'}</div>
                        </td>
                        <td style="font-weight:700; color:var(--text-main);">${t.percentage}%</td>
                        <td><span class="badge badge-neutral">${t.type}</span></td>
                        <td style="font-size:12.5px; color:var(--text-muted);">
                          ${t.effectiveStart || 'Open'} ${t.effectiveEnd ? `→ ${t.effectiveEnd}` : ''}
                        </td>
                        <td>
                          <span class="badge ${t.active ? 'badge-success' : 'badge-danger'}">
                            ${t.active ? 'Active' : 'Inactive'}
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

  const openTaxModal = () => {
    new Modal({
      title: 'Create Tax Rule',
      size: 'lg',
      content: `
        <form id="tax-form">
          <div class="form-group">
            <label class="form-label">Tax Rule Name *</label>
            <input type="text" id="tax-name" class="form-input" placeholder="e.g. GST 18% (Standard SaaS Rate)" required />
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
            <div class="form-group">
              <label class="form-label">Tax Rate (%) *</label>
              <input type="number" id="tax-rate" class="form-input" placeholder="18" min="0" step="0.01" required />
            </div>
            <div class="form-group">
              <label class="form-label">Calculation Type</label>
              <select id="tax-type" class="form-select">
                <option value="Exclusive">Exclusive (Added to invoice subtotal)</option>
                <option value="Inclusive">Inclusive (Included in product price)</option>
                <option value="Zero-Rated">Zero-Rated (Export with LUT)</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Description / Legal Reference</label>
            <input type="text" id="tax-desc" class="form-input" placeholder="CGST 9% + SGST 9% or IGST 18%" />
          </div>
        </form>
      `,
      footer: `
        <button class="btn btn-secondary modal-close-btn">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-tax">Save Tax Rule</button>
      `
    }).open();

    const submitBtn = document.querySelector('#btn-submit-tax');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const name = document.querySelector('#tax-name').value.trim();
        const percentage = Number(document.querySelector('#tax-rate').value) || 0;
        const type = document.querySelector('#tax-type').value;
        const description = document.querySelector('#tax-desc').value.trim();

        if (!name) {
          notification.error('Validation Error', 'Please enter tax name.');
          return;
        }

        api.createTax({ name, percentage, type, description });
        notification.success('Tax Rule Created', `${name} (${percentage}%) is now active.`);
        document.querySelector('.modal-backdrop').remove();
        renderTaxesView(container);
      });
    }
  };

  const createBtn = container.querySelector('#btn-create-tax');
  const emptyBtn = container.querySelector('#btn-empty-tax');
  if (createBtn) createBtn.addEventListener('click', openTaxModal);
  if (emptyBtn) emptyBtn.addEventListener('click', openTaxModal);
}
