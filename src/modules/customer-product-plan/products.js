import { dataService } from './data-service.js';
import { showToast } from './toast.js';
import { createIcons, icons } from 'lucide';

export class ProductModule {
  constructor() {
    this.searchQuery = '';
    this.statusFilter = '';
    this.typeFilter = '';
    this.activeProductId = null;

    this.container = document.getElementById('view-products');
    if (!this.container) return;

    this.init();
  }

  init() {
    this.renderLayout();
    this.bindEvents();
    this.loadData();
    dataService.subscribe(() => {
      this.loadData();
      if (this.activeProductId) {
        this.renderVariantDrawer(this.activeProductId);
      }
    });
  }

  renderLayout() {
    this.container.innerHTML = `
      <div class="page-header">
        <div class="page-title">
          <h2>Product & Variant Catalogue</h2>
          <p>Define base products with configurable dynamic attribute surcharge pricing</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary btn-sm" id="product-refresh-btn">
            <i data-lucide="rotate-cw"></i> Refresh
          </button>
          <button class="btn btn-primary" id="product-add-btn">
            <i data-lucide="plus"></i> Add Product
          </button>
        </div>
      </div>

      <!-- Stripe-inspired Variant Formula Callout -->
      <div class="info-banner" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
        <div>
          <strong>Dynamic Variant Pricing Rule:</strong>
          <code>Final Variant Price = Base Product Price + Sum of Attribute Surcharges</code>
          <span style="margin-left: 10px; color: var(--text-main); font-weight: 600;">
            (e.g., Base ₹2,000 + Brand=Odoo surcharge ₹560 = Final ₹2,560)
          </span>
        </div>
        <span class="badge badge-info">Odoo Compliant</span>
      </div>

      <div class="card">
        <div class="filter-bar">
          <div class="filter-left">
            <div style="position: relative; width: 300px;">
              <input type="text" id="product-search-input" class="form-input" placeholder="Search product name, SKU, type..." style="width: 100%; padding-left: 32px;" />
              <i data-lucide="search" style="position: absolute; left: 10px; top: 9px; width: 14px; height: 14px; color: var(--text-muted);"></i>
            </div>
            <select id="product-status-filter" class="form-select">
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Archived">Archived</option>
            </select>
            <select id="product-type-filter" class="form-select">
              <option value="">All Types</option>
              <option value="Service / SaaS">Service / SaaS</option>
              <option value="Analytics Module">Analytics Module</option>
              <option value="Add-on License">Add-on License</option>
              <option value="Integration Utility">Integration Utility</option>
            </select>
          </div>
          <div class="filter-right">
            <button class="btn btn-secondary btn-sm" id="product-export-csv">
              <i data-lucide="download"></i> Export Products
            </button>
          </div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Product Name & SKU</th>
                <th>Type</th>
                <th>Base Sales Price</th>
                <th>Cost Price</th>
                <th>Configured Variants & Surcharges</th>
                <th>Max Variant Price</th>
                <th>Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody id="product-table-body">
              <!-- Rendered dynamically -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Product Modal -->
      <div id="product-form-modal" class="modal-overlay">
        <div class="modal-dialog" style="max-width: 600px;">
          <div class="modal-header">
            <div class="modal-title" id="product-modal-title">Create New Product</div>
            <button class="modal-close" id="product-modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <form id="product-form">
              <input type="hidden" id="prod-field-id" />
              
              <div class="form-group">
                <label class="form-label">Product Name <span style="color: var(--danger)">*</span></label>
                <input type="text" id="prod-field-name" class="form-input" required placeholder="e.g. Brightloop Core Platform" style="width: 100%;" />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Product Code / SKU <span style="color: var(--danger)">*</span></label>
                  <input type="text" id="prod-field-sku" class="form-input" required placeholder="BL-PROD-CORE" style="width: 100%;" />
                </div>
                <div class="form-group">
                  <label class="form-label">Product Type</label>
                  <select id="prod-field-type" class="form-select" style="width: 100%;">
                    <option value="Service / SaaS">Service / SaaS</option>
                    <option value="Analytics Module">Analytics Module</option>
                    <option value="Add-on License">Add-on License</option>
                    <option value="Integration Utility">Integration Utility</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Base Sales Price (₹) <span style="color: var(--danger)">*</span></label>
                  <input type="number" id="prod-field-sales-price" class="form-input" required placeholder="2000" min="0" step="any" style="width: 100%;" />
                  <span class="form-help">Base catalog price before any variant surcharge</span>
                </div>
                <div class="form-group">
                  <label class="form-label">Internal Cost Price (₹)</label>
                  <input type="number" id="prod-field-cost-price" class="form-input" placeholder="450" min="0" step="any" style="width: 100%;" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea id="prod-field-description" class="form-input" rows="2" placeholder="Brief commercial description..." style="width: 100%; resize: vertical;"></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Status</label>
                  <select id="prod-field-status" class="form-select" style="width: 100%;">
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Internal Operations Notes</label>
                  <input type="text" id="prod-field-notes" class="form-input" placeholder="e.g. Requires primary tenant license" style="width: 100%;" />
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="product-modal-cancel">Cancel</button>
            <button type="button" class="btn btn-primary" id="product-modal-submit">Save Product</button>
          </div>
        </div>
      </div>

      <!-- Dynamic Variants Drawer -->
      <div id="product-variant-overlay" class="drawer-overlay"></div>
      <div id="product-variant-drawer" class="drawer-panel" style="width: 560px; max-width: 90vw;">
        <div class="drawer-header">
          <div>
            <div style="font-size: 16px; font-weight: 600;" id="variant-drawer-prod-name">Manage Product Variants</div>
            <div style="font-size: 12px; color: var(--text-muted);" id="variant-drawer-prod-sku">SKU Code</div>
          </div>
          <button class="modal-close" id="variant-drawer-close">&times;</button>
        </div>
        <div class="drawer-body" id="variant-drawer-body">
          <!-- Dynamic Variant Editor Content -->
        </div>
      </div>

      <!-- Confirm Modal -->
      <div id="product-confirm-modal" class="modal-overlay">
        <div class="modal-dialog" style="max-width: 400px;">
          <div class="modal-body">
            <div class="confirm-dialog-content">
              <div class="confirm-dialog-icon">
                <i data-lucide="alert-triangle"></i>
              </div>
              <div class="confirm-dialog-title" id="prod-confirm-title">Archive Product?</div>
              <div class="confirm-dialog-desc" id="prod-confirm-desc">Are you sure you want to proceed?</div>
            </div>
          </div>
          <div class="modal-footer" style="justify-content: center; gap: 12px;">
            <button class="btn btn-secondary" id="prod-confirm-cancel">Cancel</button>
            <button class="btn btn-primary" id="prod-confirm-action" style="background: var(--danger); border-color: var(--danger);">Confirm</button>
          </div>
        </div>
      </div>
    `;

    createIcons({ icons });
  }

  bindEvents() {
    this.container.querySelector('#product-search-input')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.loadData();
    });

    this.container.querySelector('#product-status-filter')?.addEventListener('change', (e) => {
      this.statusFilter = e.target.value;
      this.loadData();
    });

    this.container.querySelector('#product-type-filter')?.addEventListener('change', (e) => {
      this.typeFilter = e.target.value;
      this.loadData();
    });

    this.container.querySelector('#product-refresh-btn')?.addEventListener('click', () => {
      this.loadData();
      showToast('Product catalogue refreshed', 'info');
    });

    this.container.querySelector('#product-export-csv')?.addEventListener('click', () => {
      this.exportCSV();
    });

    this.container.querySelector('#product-add-btn')?.addEventListener('click', () => {
      this.openFormModal();
    });

    this.container.querySelector('#product-modal-close')?.addEventListener('click', () => this.closeFormModal());
    this.container.querySelector('#product-modal-cancel')?.addEventListener('click', () => this.closeFormModal());
    this.container.querySelector('#product-modal-submit')?.addEventListener('click', () => this.saveProductForm());

    this.container.querySelector('#variant-drawer-close')?.addEventListener('click', () => this.closeVariantDrawer());
    this.container.querySelector('#product-variant-overlay')?.addEventListener('click', () => this.closeVariantDrawer());

    this.container.querySelector('#prod-confirm-cancel')?.addEventListener('click', () => {
      this.container.querySelector('#product-confirm-modal')?.classList.remove('active');
    });
  }

  loadData() {
    const products = dataService.getProducts({
      search: this.searchQuery,
      status: this.statusFilter,
      type: this.typeFilter
    });

    const tbody = this.container.querySelector('#product-table-body');
    if (!tbody) return;

    if (products.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="empty-state-container">
              <i data-lucide="package" class="empty-state-icon"></i>
              <div class="empty-state-title">No products found</div>
              <div class="empty-state-subtitle">No product catalog items matched your criteria. Add a product or clear filters.</div>
              <button class="btn btn-secondary btn-sm" id="prod-clear-filter-btn">Clear Filters</button>
            </div>
          </td>
        </tr>
      `;
      tbody.querySelector('#prod-clear-filter-btn')?.addEventListener('click', () => {
        this.searchQuery = '';
        this.statusFilter = '';
        this.typeFilter = '';
        const s = this.container.querySelector('#product-search-input');
        if (s) s.value = '';
        const st = this.container.querySelector('#product-status-filter');
        if (st) st.value = '';
        const tp = this.container.querySelector('#product-type-filter');
        if (tp) tp.value = '';
        this.loadData();
      });
      createIcons({ icons });
      return;
    }

    tbody.innerHTML = products.map(p => {
      const variants = p.variants || [];
      const totalSurcharges = variants.reduce((sum, v) => sum + (Number(v.additionalPrice) || 0), 0);
      const maxPrice = p.salesPrice + totalSurcharges;
      const statusBadge = p.status === 'Active'
        ? '<span class="badge badge-success">Active</span>'
        : '<span class="badge badge-neutral">Archived</span>';

      const variantChips = variants.length > 0
        ? variants.map(v => `
            <span class="product-variant-chip" title="SKU Mod: ${v.skuModifier || 'None'}">
              <strong>${v.attribute}:</strong> ${v.value} 
              <span class="surcharge-badge">(+₹${v.additionalPrice})</span>
            </span>
          `).join('')
        : '<span class="text-muted" style="font-size: 12px;">Standard (No Variants)</span>';

      return `
        <tr>
          <td>
            <strong>${p.name}</strong>
            <div class="mono-text" style="font-size: 11px; color: var(--text-muted);">${p.sku}</div>
          </td>
          <td><span class="badge badge-neutral">${p.type}</span></td>
          <td class="mono-text"><strong>₹ ${(p.salesPrice || 0).toLocaleString('en-IN')}</strong></td>
          <td class="mono-text text-muted">₹ ${(p.costPrice || 0).toLocaleString('en-IN')}</td>
          <td style="max-width: 320px;">
            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
              ${variantChips}
            </div>
          </td>
          <td class="mono-text">
            <strong>₹ ${maxPrice.toLocaleString('en-IN')}</strong>
            <div style="font-size: 10px; color: var(--text-muted);">${variants.length} variant${variants.length === 1 ? '' : 's'}</div>
          </td>
          <td>${statusBadge}</td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 4px;">
              <button class="btn btn-secondary btn-sm btn-prod-variants" data-id="${p.id}" title="Manage Variants & Surcharges">
                <i data-lucide="sliders"></i> Variants (${variants.length})
              </button>
              <button class="btn btn-secondary btn-sm btn-prod-edit" data-id="${p.id}" title="Edit Product">
                <i data-lucide="edit-2"></i>
              </button>
              <button class="btn btn-secondary btn-sm btn-prod-archive" data-id="${p.id}" title="${p.status === 'Archived' ? 'Restore' : 'Archive'}">
                <i data-lucide="${p.status === 'Archived' ? 'archive-restore' : 'archive'}"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Event listeners
    tbody.querySelectorAll('.btn-prod-variants').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openVariantDrawer(id);
      });
    });

    tbody.querySelectorAll('.btn-prod-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openFormModal(id);
      });
    });

    tbody.querySelectorAll('.btn-prod-archive').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.confirmArchiveProduct(id);
      });
    });

    createIcons({ icons });
  }

  openFormModal(productId = null) {
    const modal = this.container.querySelector('#product-form-modal');
    const title = this.container.querySelector('#product-modal-title');
    const form = this.container.querySelector('#product-form');
    if (!modal || !form) return;

    form.reset();

    if (productId) {
      const prod = dataService.getProductById(productId);
      if (!prod) return;
      title.textContent = 'Edit Product';
      form.querySelector('#prod-field-id').value = prod.id;
      form.querySelector('#prod-field-name').value = prod.name;
      form.querySelector('#prod-field-sku').value = prod.sku;
      form.querySelector('#prod-field-type').value = prod.type;
      form.querySelector('#prod-field-sales-price').value = prod.salesPrice;
      form.querySelector('#prod-field-cost-price').value = prod.costPrice;
      form.querySelector('#prod-field-description').value = prod.description || '';
      form.querySelector('#prod-field-status').value = prod.status || 'Active';
      form.querySelector('#prod-field-notes').value = prod.notes || '';
    } else {
      title.textContent = 'Create New Product';
      form.querySelector('#prod-field-id').value = '';
      form.querySelector('#prod-field-sku').value = `BL-PROD-${Date.now().toString().slice(-4)}`;
    }

    modal.classList.add('active');
  }

  closeFormModal() {
    this.container.querySelector('#product-form-modal')?.classList.remove('active');
  }

  saveProductForm() {
    const form = this.container.querySelector('#product-form');
    if (!form) return;

    const id = form.querySelector('#prod-field-id').value;
    const name = form.querySelector('#prod-field-name').value.trim();
    const sku = form.querySelector('#prod-field-sku').value.trim();
    const salesPrice = Number(form.querySelector('#prod-field-sales-price').value);

    if (!name || !sku || isNaN(salesPrice)) {
      showToast('Product name, SKU code, and valid base price are required.', 'error');
      return;
    }

    const payload = {
      name,
      sku,
      type: form.querySelector('#prod-field-type').value,
      salesPrice,
      costPrice: Number(form.querySelector('#prod-field-cost-price').value) || 0,
      description: form.querySelector('#prod-field-description').value.trim(),
      status: form.querySelector('#prod-field-status').value,
      notes: form.querySelector('#prod-field-notes').value.trim()
    };

    if (id) {
      dataService.updateProduct(id, payload);
      showToast(`Product ${name} updated successfully.`);
    } else {
      dataService.createProduct(payload);
      showToast(`Product ${name} created successfully.`);
    }

    this.closeFormModal();
  }

  confirmArchiveProduct(id) {
    const prod = dataService.getProductById(id);
    if (!prod) return;

    const isArchived = prod.status === 'Archived';
    const actionName = isArchived ? 'Restore' : 'Archive';

    const modal = this.container.querySelector('#product-confirm-modal');
    const title = this.container.querySelector('#prod-confirm-title');
    const desc = this.container.querySelector('#prod-confirm-desc');
    const btn = this.container.querySelector('#prod-confirm-action');

    title.textContent = `${actionName} Product?`;
    desc.textContent = `Are you sure you want to ${actionName.toLowerCase()} "${prod.name}" (${prod.sku})?`;
    btn.textContent = actionName;
    btn.style.background = isArchived ? 'var(--primary)' : 'var(--danger)';
    btn.style.borderColor = isArchived ? 'var(--primary)' : 'var(--danger)';

    modal.classList.add('active');

    btn.onclick = () => {
      dataService.archiveProduct(id);
      modal.classList.remove('active');
      showToast(`Product ${prod.name} ${isArchived ? 'restored' : 'archived'}.`);
    };
  }

  openVariantDrawer(id) {
    this.activeProductId = id;
    this.renderVariantDrawer(id);
    this.container.querySelector('#product-variant-overlay')?.classList.add('active');
    this.container.querySelector('#product-variant-drawer')?.classList.add('active');
  }

  closeVariantDrawer() {
    this.activeProductId = null;
    this.container.querySelector('#product-variant-overlay')?.classList.remove('active');
    this.container.querySelector('#product-variant-drawer')?.classList.remove('active');
  }

  renderVariantDrawer(id) {
    const prod = dataService.getProductById(id);
    if (!prod) return;

    const nameEl = this.container.querySelector('#variant-drawer-prod-name');
    const skuEl = this.container.querySelector('#variant-drawer-prod-sku');
    const body = this.container.querySelector('#variant-drawer-body');

    if (nameEl) nameEl.textContent = prod.name;
    if (skuEl) skuEl.textContent = `${prod.sku} • Base Catalog Price: ₹${prod.salesPrice.toLocaleString('en-IN')}`;

    const variants = prod.variants || [];

    body.innerHTML = `
      <div class="info-banner" style="margin-bottom: 16px;">
        <strong>Pricing Simulator:</strong>
        <div style="margin-top: 4px; font-size: 13px;">
          Base Price: <strong class="mono-text">₹ ${prod.salesPrice.toLocaleString('en-IN')}</strong> +
          Surcharges: <strong class="mono-text" style="color: var(--primary);">₹ ${variants.reduce((s, v) => s + (Number(v.additionalPrice) || 0), 0).toLocaleString('en-IN')}</strong> =
          Max Combined: <strong class="mono-text" style="font-size: 15px;">₹ ${(prod.salesPrice + variants.reduce((s, v) => s + (Number(v.additionalPrice) || 0), 0)).toLocaleString('en-IN')}</strong>
        </div>
      </div>

      <div style="font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 10px;">
        Configured Dynamic Attributes & Surcharges (${variants.length})
      </div>

      <div class="product-variant-list-editor">
        ${variants.length > 0 ? variants.map(v => `
          <div class="variant-row-item">
            <div>
              <div style="font-weight: 600;">${v.attribute}: <span style="color: var(--primary);">${v.value}</span></div>
              <div class="mono-text" style="font-size: 11px; color: var(--text-muted);">
                SKU Tag: ${v.skuModifier || 'None'} • ID: ${v.id}
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span class="mono-text" style="font-weight: 700; color: var(--text-main);">+ ₹ ${(v.additionalPrice || 0).toLocaleString('en-IN')}</span>
              <button class="btn btn-secondary btn-sm btn-var-delete" data-vid="${v.id}" style="color: var(--danger); padding: 4px 8px;" title="Remove Variant">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
        `).join('') : '<div class="text-muted" style="text-align: center; padding: 12px;">No attribute variants configured yet. Add one below.</div>'}
      </div>

      <!-- Add Variant Form -->
      <div class="card" style="margin-top: 20px; padding: 16px; border: 1px dashed var(--border);">
        <div style="font-size: 13px; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
          <i data-lucide="plus-circle" style="width: 16px; height: 16px; color: var(--primary);"></i> Add Dynamic Attribute / Surcharge
        </div>
        <form id="add-variant-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Attribute Name <span style="color: var(--danger)">*</span></label>
              <input type="text" id="var-attr-name" class="form-input" required placeholder="e.g. Brand, Support, Storage" style="width: 100%;" />
            </div>
            <div class="form-group">
              <label class="form-label">Attribute Value <span style="color: var(--danger)">*</span></label>
              <input type="text" id="var-attr-val" class="form-input" required placeholder="e.g. Odoo, Priority SLA, 500GB" style="width: 100%;" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Additional Surcharge Price (₹) <span style="color: var(--danger)">*</span></label>
              <input type="number" id="var-attr-price" class="form-input" required placeholder="560" min="0" step="any" style="width: 100%;" />
              <span class="form-help">Amount added on top of Base Price (₹${prod.salesPrice})</span>
            </div>
            <div class="form-group">
              <label class="form-label">SKU Suffix Modifier</label>
              <input type="text" id="var-attr-sku" class="form-input" placeholder="-ODOO" style="width: 100%;" />
            </div>
          </div>
          <div style="text-align: right; margin-top: 8px;">
            <button type="submit" class="btn btn-primary btn-sm">
              <i data-lucide="check"></i> Add Variant Rule
            </button>
          </div>
        </form>
      </div>
    `;

    // Delete variant event
    body.querySelectorAll('.btn-var-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const vid = btn.getAttribute('data-vid');
        dataService.removeVariantFromProduct(prod.id, vid);
        showToast('Variant surcharge removed.');
      });
    });

    // Add variant submit
    const varForm = body.querySelector('#add-variant-form');
    varForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const attr = body.querySelector('#var-attr-name').value.trim();
      const val = body.querySelector('#var-attr-val').value.trim();
      const surcharge = Number(body.querySelector('#var-attr-price').value);
      const skuMod = body.querySelector('#var-attr-sku').value.trim();

      if (!attr || !val || isNaN(surcharge)) {
        showToast('Please provide valid attribute name, value, and surcharge price.', 'error');
        return;
      }

      dataService.addVariantToProduct(prod.id, {
        attribute: attr,
        value: val,
        additionalPrice: surcharge,
        skuModifier: skuMod
      });

      showToast(`Variant "${attr}: ${val}" (+₹${surcharge}) added successfully.`);
    });

    createIcons({ icons });
  }

  exportCSV() {
    const list = dataService.getProducts();
    if (list.length === 0) {
      showToast('No product catalog items to export.', 'error');
      return;
    }

    const headers = ['ID', 'Name', 'SKU', 'Type', 'Base Price', 'Cost Price', 'Status', 'Variant Count'];
    const rows = list.map(p => [
      p.id,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      p.sku,
      p.type,
      p.salesPrice || 0,
      p.costPrice || 0,
      p.status,
      (p.variants || []).length
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SubscriptIQ_Products_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Product catalogue CSV exported.');
  }
}

