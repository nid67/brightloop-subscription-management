import { iconHtml, refreshIcons } from '../utils/icons.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { formatCurrency } from '../utils/currency.js';
import { api } from '../services/api.js';
import { Modal } from '../components/modal.js';
import { notification } from '../services/notification.js';

export function renderProductsView(container) {
  const role = localStorage.getItem('brightloop_role') || 'ADMIN';
  const products = api.getProducts();

  container.innerHTML = `
    <div class="app-shell">
      ${renderSidebar('products', { name: 'Admin User', role })}

      <main class="app-main">
        ${renderHeader('Products & Variants', role)}

        <div class="app-content">
          <div class="page-header">
            <div>
              <h1 class="page-title">Product Catalog & Variant Pricing</h1>
              <p class="page-subtitle">Configure base recurring products and add-on variant pricing rules</p>
            </div>
            <div>
              <button class="btn btn-primary" id="btn-create-product">
                ${iconHtml('plus', { size: 16 })} Create Product
              </button>
            </div>
          </div>

          <!-- Section 9 Variant Architecture Notice -->
          <div style="background:#ffffff; border:1px solid var(--border); border-radius:var(--radius-lg); padding:14px 18px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
            <div>
              <strong style="color:var(--text-main);">Product Variant Configuration:</strong>
              <span style="color:var(--text-muted); margin-left:6px;">
                Base price (e.g. ₹2,000) + Variant Brand=Odoo (e.g. ₹560) = Final Price (₹2,560)
              </span>
            </div>
            <button class="btn btn-secondary btn-sm" id="btn-add-sample-variant">
              Load Odoo Variant Example
            </button>
          </div>

          ${products.length === 0 ? `
            <div class="card" style="padding:48px; text-align:center;">
              <div class="empty-icon">${iconHtml('package', { size: 24 })}</div>
              <div class="empty-title">No products in catalog</div>
              <div class="empty-desc">Create your base software products and configure pricing variants.</div>
              <button class="btn btn-primary btn-sm" id="btn-empty-product">
                ${iconHtml('plus', { size: 14 })} Create First Product
              </button>
            </div>
          ` : `
            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap:20px;">
              ${products.map(p => `
                <div class="card" style="padding:20px;">
                  <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <div>
                      <span class="badge badge-info" style="margin-bottom:4px;">${p.type}</span>
                      <h3 style="font-size:16px; font-weight:700; color:var(--text-main);">${p.name}</h3>
                    </div>
                    <div style="text-align:right;">
                      <div style="font-size:11px; text-transform:uppercase; color:var(--text-muted);">Base Price</div>
                      <div style="font-size:18px; font-weight:700; color:var(--primary);">${formatCurrency(p.basePrice)}</div>
                    </div>
                  </div>

                  <p style="font-size:13px; color:var(--text-muted); margin-bottom:14px;">${p.description || 'No description provided.'}</p>

                  <div style="background:var(--bg-subtle); border:1px solid var(--border); border-radius:var(--radius-md); padding:10px;">
                    <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:6px;">
                      Variants (${(p.variants || []).length}):
                    </div>
                    ${(p.variants || []).length === 0 ? `
                      <div style="font-size:12px; color:var(--text-muted);">No variants. Base price applies.</div>
                    ` : (p.variants || []).map(v => `
                      <div style="display:flex; justify-content:space-between; padding:4px 0; font-size:13px; border-bottom:1px solid var(--border-light);">
                        <span>${v.name} (${v.attributeName}: ${v.attributeValue})</span>
                        <span><strong>+${formatCurrency(v.additionalPrice)}</strong> = ${formatCurrency(v.finalPrice)}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </main>
    </div>
  `;

  refreshIcons(container);

  const openModal = () => {
    new Modal({
      title: 'Create Product & Variants',
      size: 'lg',
      content: `
        <form id="prod-form">
          <div style="display:grid; grid-template-columns: 2fr 1fr; gap:16px;">
            <div class="form-group">
              <label class="form-label">Product Name *</label>
              <input type="text" id="p-name" class="form-input" placeholder="e.g. Core SaaS Engine" required />
            </div>
            <div class="form-group">
              <label class="form-label">Type</label>
              <select id="p-type" class="form-select">
                <option value="Recurring Service">Recurring Service</option>
                <option value="SaaS Seat">SaaS Seat</option>
                <option value="Usage Add-on">Usage Add-on</option>
              </select>
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
            <div class="form-group">
              <label class="form-label">Base Price (₹) *</label>
              <input type="number" id="p-base-price" class="form-input" placeholder="2000" min="0" required />
            </div>
            <div class="form-group">
              <label class="form-label">Cost Price (₹)</label>
              <input type="number" id="p-cost-price" class="form-input" placeholder="650" min="0" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <input type="text" id="p-desc" class="form-input" placeholder="Product scope and notes" />
          </div>

          <div style="margin-top:16px; border-top:1px solid var(--border); padding-top:12px;">
            <div style="font-size:12px; font-weight:700; color:var(--text-main); margin-bottom:8px;">Add Variant (e.g. Brand = Odoo, +₹560)</div>
            <div style="display:grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap:8px;">
              <input type="text" id="v-name" class="form-input" placeholder="Variant Name" value="Odoo Connected Engine" />
              <input type="text" id="v-attr" class="form-input" placeholder="Attribute" value="Brand" />
              <input type="text" id="v-val" class="form-input" placeholder="Value" value="Odoo" />
              <input type="number" id="v-add" class="form-input" placeholder="Add Price" value="560" />
            </div>
          </div>
        </form>
      `,
      footer: `
        <button class="btn btn-secondary modal-close-btn">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-prod">Save Product</button>
      `
    }).open();

    const submitBtn = document.querySelector('#btn-submit-prod');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const name = document.querySelector('#p-name').value.trim();
        const type = document.querySelector('#p-type').value;
        const basePrice = Number(document.querySelector('#p-base-price').value) || 2000;
        const costPrice = Number(document.querySelector('#p-cost-price').value) || 0;
        const description = document.querySelector('#p-desc').value.trim();

        const vName = document.querySelector('#v-name').value.trim();
        const vAttr = document.querySelector('#v-attr').value.trim();
        const vVal = document.querySelector('#v-val').value.trim();
        const vAdd = Number(document.querySelector('#v-add').value) || 0;

        const variants = [];
        if (vName) {
          variants.push({
            id: `var_${Date.now()}`,
            name: vName,
            attributeName: vAttr,
            attributeValue: vVal,
            additionalPrice: vAdd,
            finalPrice: basePrice + vAdd
          });
        }

        api.createProduct({ name, type, basePrice, costPrice, description, variants });
        notification.success('Product Saved', `${name} catalog entry created.`);
        document.querySelector('.modal-dialog').closest('.modal-overlay').remove();
        renderProductsView(container);
      });
    }
  };

  const createBtn = container.querySelector('#btn-create-product');
  const emptyBtn = container.querySelector('#btn-empty-product');
  if (createBtn) createBtn.addEventListener('click', openModal);
  if (emptyBtn) emptyBtn.addEventListener('click', openModal);

  const sampleBtn = container.querySelector('#btn-add-sample-variant');
  if (sampleBtn) {
    sampleBtn.addEventListener('click', () => {
      api.createProduct({
        name: 'Brightloop Core Platform',
        type: 'Recurring Service',
        basePrice: 2000,
        costPrice: 650,
        description: 'Core subscription billing engine and customer master module.',
        variants: [
          {
            id: `var_${Date.now()}`,
            name: 'Odoo Connected Engine',
            attributeName: 'Brand',
            attributeValue: 'Odoo',
            additionalPrice: 560,
            finalPrice: 2560
          }
        ]
      });
      notification.success('Template Loaded', 'Base product with Odoo variant (₹2,000 + ₹560 = ₹2,560) added.');
      renderProductsView(container);
    });
  }
}
