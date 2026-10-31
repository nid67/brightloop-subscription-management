import { iconHtml, refreshIcons } from '../utils/icons.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { notification } from '../services/notification.js';

export function renderSettingsView(container) {
  const role = localStorage.getItem('brightloop_role') || 'ADMIN';

  container.innerHTML = `
    <div class="app-shell">
      ${renderSidebar('settings', { name: 'Admin User', role })}

      <main class="app-main">
        ${renderHeader('Workspace Settings', role)}

        <div class="app-content">
          <div class="page-header">
            <div>
              <h1 class="page-title">Platform Settings & Billing Configuration</h1>
              <p class="page-subtitle">Configure organization profile, invoice numbering schemes, and tax credentials</p>
            </div>
            <div>
              <button class="btn btn-primary" id="btn-save-settings">
                Save Changes
              </button>
            </div>
          </div>

          <div class="card" style="max-width:800px; margin-bottom:24px;">
            <div class="card-header">
              <span class="card-title">Organization Profile</span>
            </div>
            <div class="card-body">
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                <div class="form-group">
                  <label class="form-label">Company / Legal Name</label>
                  <input type="text" class="form-input" value="Brightloop Software Ltd" />
                </div>
                <div class="form-group">
                  <label class="form-label">Billing Support Email</label>
                  <input type="email" class="form-input" value="billing@brightloop.com" />
                </div>
              </div>

              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                <div class="form-group">
                  <label class="form-label">GSTIN / Tax ID</label>
                  <input type="text" class="form-input" value="29ABCDE1234F1Z5" />
                </div>
                <div class="form-group">
                  <label class="form-label">Default Currency</label>
                  <select class="form-select">
                    <option value="INR" selected>Indian Rupee (₹ INR)</option>
                    <option value="USD">US Dollar ($ USD)</option>
                    <option value="EUR">Euro (€ EUR)</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Registered Office Address</label>
                <textarea class="form-textarea" rows="2">Prestige Tech Park, Outer Ring Road, Bengaluru, Karnataka 560103, India</textarea>
              </div>
            </div>
          </div>

          <div class="card" style="max-width:800px;">
            <div class="card-header">
              <span class="card-title">Invoice & Numbering Automation</span>
            </div>
            <div class="card-body">
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                <div class="form-group">
                  <label class="form-label">Invoice Prefix</label>
                  <input type="text" class="form-input" value="INV-2026-" />
                </div>
                <div class="form-group">
                  <label class="form-label">Subscription Prefix</label>
                  <input type="text" class="form-input" value="SUB-2026-" />
                </div>
              </div>

              <div style="display:flex; flex-direction:column; gap:12px; margin-top:12px; font-size:13.5px;">
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                  <input type="checkbox" checked /> Enforce duplicate billing prevention locks
                </label>
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                  <input type="checkbox" checked /> Automatically scan for expired discounts on quotation issue
                </label>
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                  <input type="checkbox" checked /> Send automatic dunning emails on overdue invoices
                </label>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  refreshIcons(container);

  const saveBtn = container.querySelector('#btn-save-settings');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      notification.success('Settings Saved', 'Organization settings and billing rules updated.');
    });
  }
}
