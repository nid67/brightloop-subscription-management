import { dataService } from './data-service.js';
import { showToast } from './toast.js';
import { createIcons, icons } from 'lucide';

export class PlanModule {
  constructor() {
    this.searchQuery = '';
    this.statusFilter = '';
    this.frequencyFilter = '';
    this.activePlanId = null;

    this.container = document.getElementById('view-plans');
    if (!this.container) return;

    this.init();
  }

  init() {
    this.renderLayout();
    this.bindEvents();
    this.loadData();
    dataService.subscribe(() => {
      this.loadData();
      if (this.activePlanId) {
        this.renderPlanDetailDrawer(this.activePlanId);
      }
    });
  }

  renderLayout() {
    this.container.innerHTML = `
      <div class="page-header">
        <div class="page-title">
          <h2>Subscription Plans & Billing Schedules</h2>
          <p>Configure recurring frequencies, automated closure rules, pause terms and renewal conditions</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary btn-sm" id="plan-refresh-btn">
            <i data-lucide="rotate-cw"></i> Refresh
          </button>
          <button class="btn btn-primary" id="plan-add-btn">
            <i data-lucide="plus"></i> Create Plan
          </button>
        </div>
      </div>

      <div class="card" style="margin-bottom: 20px;">
        <div class="filter-bar">
          <div class="filter-left">
            <div style="position: relative; width: 300px;">
              <input type="text" id="plan-search-input" class="form-input" placeholder="Search plan name, code, product..." style="width: 100%; padding-left: 32px;" />
              <i data-lucide="search" style="position: absolute; left: 10px; top: 9px; width: 14px; height: 14px; color: var(--text-muted);"></i>
            </div>
            <select id="plan-frequency-filter" class="form-select">
              <option value="">All Frequencies</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </select>
            <select id="plan-status-filter" class="form-select">
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
          <div class="filter-right">
            <button class="btn btn-secondary btn-sm" id="plan-export-csv">
              <i data-lucide="download"></i> Export Plans
            </button>
          </div>
        </div>
      </div>

      <!-- Plan Cards Grid -->
      <div class="plan-grid" id="plan-cards-container">
        <!-- Rendered dynamically -->
      </div>

      <!-- Add/Edit Plan Modal -->
      <div id="plan-form-modal" class="modal-overlay">
        <div class="modal-dialog" style="max-width: 620px;">
          <div class="modal-header">
            <div class="modal-title" id="plan-modal-title">Create Subscription Plan</div>
            <button class="modal-close" id="plan-modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <form id="plan-form">
              <input type="hidden" id="plan-field-id" />

              <div class="form-group">
                <label class="form-label">Plan Title / Name <span style="color: var(--danger)">*</span></label>
                <input type="text" id="plan-field-name" class="form-input" required placeholder="e.g. Standard Monthly Tier" style="width: 100%;" />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Associated Product <span style="color: var(--danger)">*</span></label>
                  <select id="plan-field-product" class="form-select" required style="width: 100%;">
                    <!-- Dynamically populated from dataService.getProducts() -->
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Plan Identifier Code <span style="color: var(--danger)">*</span></label>
                  <input type="text" id="plan-field-code" class="form-input" required placeholder="BL-PLAN-MONTHLY" style="width: 100%;" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Billing Frequency <span style="color: var(--danger)">*</span></label>
                  <select id="plan-field-frequency" class="form-select" required style="width: 100%;">
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly" selected>Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Recurring Price (₹) <span style="color: var(--danger)">*</span></label>
                  <input type="number" id="plan-field-price" class="form-input" required placeholder="4999" min="0" step="any" style="width: 100%;" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Minimum Quantity</label>
                  <input type="number" id="plan-field-min-qty" class="form-input" value="1" min="1" style="width: 100%;" />
                </div>
                <div class="form-group">
                  <label class="form-label">Auto-close Grace Period (Days)</label>
                  <input type="number" id="plan-field-autoclose-days" class="form-input" value="15" min="0" style="width: 100%;" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Availability Start Date</label>
                  <input type="date" id="plan-field-start-date" class="form-input" style="width: 100%;" />
                </div>
                <div class="form-group">
                  <label class="form-label">Availability End Date</label>
                  <input type="date" id="plan-field-end-date" class="form-input" value="2028-12-31" style="width: 100%;" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Plan Description</label>
                <textarea id="plan-field-description" class="form-input" rows="2" placeholder="Customer-facing description and terms..." style="width: 100%; resize: vertical;"></textarea>
              </div>

              <div class="card" style="padding: 12px; background: #fafbfc; border: 1px solid var(--border);">
                <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">Lifecycle Permissions & Policies</div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 13px;">
                  <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" id="plan-field-allow-pause" checked />
                    <span>Allow Subscriber Pause</span>
                  </label>
                  <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" id="plan-field-allow-early-close" checked />
                    <span>Allow Early Closure</span>
                  </label>
                  <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" id="plan-field-allow-auto-renewal" checked />
                    <span>Auto Recurring Renewal</span>
                  </label>
                  <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" id="plan-field-autoclose-enabled" checked />
                    <span>Auto-close on Unpaid Invoices</span>
                  </label>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="plan-modal-cancel">Cancel</button>
            <button type="button" class="btn btn-primary" id="plan-modal-submit">Save Plan</button>
          </div>
        </div>
      </div>

      <!-- Plan Detail Drawer -->
      <div id="plan-detail-overlay" class="drawer-overlay"></div>
      <div id="plan-detail-drawer" class="drawer-panel" style="width: 520px; max-width: 90vw;">
        <div class="drawer-header">
          <div>
            <div style="font-size: 16px; font-weight: 600;" id="drawer-plan-title">Subscription Plan Configuration</div>
            <div style="font-size: 12px; color: var(--text-muted);" id="drawer-plan-code">BL-PLAN-CODE</div>
          </div>
          <button class="modal-close" id="drawer-plan-close">&times;</button>
        </div>
        <div class="drawer-body" id="drawer-plan-body">
          <!-- Dynamic Plan Details Content -->
        </div>
      </div>

      <!-- Confirm Modal -->
      <div id="plan-confirm-modal" class="modal-overlay">
        <div class="modal-dialog" style="max-width: 400px;">
          <div class="modal-body">
            <div class="confirm-dialog-content">
              <div class="confirm-dialog-icon">
                <i data-lucide="alert-triangle"></i>
              </div>
              <div class="confirm-dialog-title" id="plan-confirm-title">Archive Plan?</div>
              <div class="confirm-dialog-desc" id="plan-confirm-desc">Are you sure you want to proceed?</div>
            </div>
          </div>
          <div class="modal-footer" style="justify-content: center; gap: 12px;">
            <button class="btn btn-secondary" id="plan-confirm-cancel">Cancel</button>
            <button class="btn btn-primary" id="plan-confirm-action" style="background: var(--danger); border-color: var(--danger);">Confirm</button>
          </div>
        </div>
      </div>
    `;

    createIcons({ icons });
  }

  bindEvents() {
    this.container.querySelector('#plan-search-input')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.loadData();
    });

    this.container.querySelector('#plan-frequency-filter')?.addEventListener('change', (e) => {
      this.frequencyFilter = e.target.value;
      this.loadData();
    });

    this.container.querySelector('#plan-status-filter')?.addEventListener('change', (e) => {
      this.statusFilter = e.target.value;
      this.loadData();
    });

    this.container.querySelector('#plan-refresh-btn')?.addEventListener('click', () => {
      this.loadData();
      showToast('Subscription plans refreshed', 'info');
    });

    this.container.querySelector('#plan-export-csv')?.addEventListener('click', () => {
      this.exportCSV();
    });

    this.container.querySelector('#plan-add-btn')?.addEventListener('click', () => {
      this.openFormModal();
    });

    this.container.querySelector('#plan-modal-close')?.addEventListener('click', () => this.closeFormModal());
    this.container.querySelector('#plan-modal-cancel')?.addEventListener('click', () => this.closeFormModal());
    this.container.querySelector('#plan-modal-submit')?.addEventListener('click', () => this.savePlanForm());

    this.container.querySelector('#drawer-plan-close')?.addEventListener('click', () => this.closePlanDrawer());
    this.container.querySelector('#plan-detail-overlay')?.addEventListener('click', () => this.closePlanDrawer());

    this.container.querySelector('#plan-confirm-cancel')?.addEventListener('click', () => {
      this.container.querySelector('#plan-confirm-modal')?.classList.remove('active');
    });
  }

  loadData() {
    const plans = dataService.getPlans({
      search: this.searchQuery,
      status: this.statusFilter,
      frequency: this.frequencyFilter
    });

    const grid = this.container.querySelector('#plan-cards-container');
    if (!grid) return;

    if (plans.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1;">
          <div class="empty-state-container card">
            <i data-lucide="layers" class="empty-state-icon"></i>
            <div class="empty-state-title">No subscription plans found</div>
            <div class="empty-state-subtitle">No plans matched your filter criteria. Create a plan or clear filters.</div>
            <button class="btn btn-secondary btn-sm" id="plan-clear-filter-btn">Clear Filters</button>
          </div>
        </div>
      `;
      grid.querySelector('#plan-clear-filter-btn')?.addEventListener('click', () => {
        this.searchQuery = '';
        this.statusFilter = '';
        this.frequencyFilter = '';
        const s = this.container.querySelector('#plan-search-input');
        if (s) s.value = '';
        const f = this.container.querySelector('#plan-frequency-filter');
        if (f) f.value = '';
        const st = this.container.querySelector('#plan-status-filter');
        if (st) st.value = '';
        this.loadData();
      });
      createIcons({ icons });
      return;
    }

    grid.innerHTML = plans.map(p => {
      const isArchived = p.status === 'Archived';
      const isInactive = p.status === 'Inactive';
      const statusBadge = p.status === 'Active'
        ? '<span class="badge badge-success">Active</span>'
        : p.status === 'Inactive'
        ? '<span class="badge badge-warning">Inactive</span>'
        : '<span class="badge badge-neutral">Archived</span>';

      const intervalText = p.billingFrequency === 'Daily' ? 'day' :
        p.billingFrequency === 'Weekly' ? 'week' :
        p.billingFrequency === 'Yearly' ? 'year' : 'month';

      return `
        <div class="plan-card ${isInactive || isArchived ? 'plan-inactive' : ''}">
          <div>
            <div class="plan-card-header">
              <div>
                <div style="font-size: 16px; font-weight: 600; color: var(--text-main);">${p.name}</div>
                <div class="mono-text" style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                  ${p.code} • ${p.productName}
                </div>
              </div>
              ${statusBadge}
            </div>

            <div class="plan-price-display">
              ₹ ${(p.price || 0).toLocaleString('en-IN')}
              <span class="plan-price-unit">/ ${intervalText}</span>
            </div>

            <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; min-height: 36px;">
              ${p.description || 'Configured recurring schedule for automated subscription billing.'}
            </p>

            <ul class="plan-feature-list">
              <li class="plan-feature-item">
                <i data-lucide="calendar"></i>
                <span>Billing Interval: <strong>Every 1 ${p.billingFrequency}</strong></span>
              </li>
              <li class="plan-feature-item">
                <i data-lucide="shield-alert"></i>
                <span>Auto-close on unpaid: <strong>${p.autoCloseEnabled ? `After ${p.autoCloseGracePeriodDays} days` : 'Disabled'}</strong></span>
              </li>
              <li class="plan-feature-item">
                <i data-lucide="pause-circle"></i>
                <span>Subscriber Pause: <strong>${p.allowPause ? `Allowed (up to ${p.maxPauseDurationDays || 30} days)` : 'Restricted'}</strong></span>
              </li>
              <li class="plan-feature-item">
                <i data-lucide="refresh-cw"></i>
                <span>Recurring Auto-renewal: <strong>${p.allowAutoRenewal ? 'Enabled' : 'Manual'}</strong></span>
              </li>
            </ul>
          </div>

          <div class="plan-card-actions">
            <div>
              <button class="btn btn-secondary btn-sm btn-plan-view" data-id="${p.id}">
                Configure & Details
              </button>
            </div>
            <div style="display: flex; gap: 4px;">
              <button class="btn btn-secondary btn-sm btn-plan-toggle" data-id="${p.id}" title="${p.status === 'Active' ? 'Deactivate' : 'Activate'}">
                <i data-lucide="${p.status === 'Active' ? 'toggle-right' : 'toggle-left'}"></i>
              </button>
              <button class="btn btn-secondary btn-sm btn-plan-edit" data-id="${p.id}" title="Edit Plan">
                <i data-lucide="edit-2"></i>
              </button>
              <button class="btn btn-secondary btn-sm btn-plan-archive" data-id="${p.id}" title="${isArchived ? 'Restore' : 'Archive'}">
                <i data-lucide="${isArchived ? 'archive-restore' : 'archive'}"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.btn-plan-view').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openPlanDrawer(id);
      });
    });

    grid.querySelectorAll('.btn-plan-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        dataService.togglePlanStatus(id);
        showToast('Plan status changed.');
      });
    });

    grid.querySelectorAll('.btn-plan-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openFormModal(id);
      });
    });

    grid.querySelectorAll('.btn-plan-archive').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.confirmArchivePlan(id);
      });
    });

    createIcons({ icons });
  }

  populateProductDropdown(selectedProductId = '') {
    const select = this.container.querySelector('#plan-field-product');
    if (!select) return;

    const products = dataService.getProducts({ status: 'Active' });
    select.innerHTML = products.map(p => `
      <option value="${p.id}" ${p.id === selectedProductId ? 'selected' : ''}>
        ${p.name} (${p.sku})
      </option>
    `).join('');
  }

  openFormModal(planId = null) {
    const modal = this.container.querySelector('#plan-form-modal');
    const title = this.container.querySelector('#plan-modal-title');
    const form = this.container.querySelector('#plan-form');
    if (!modal || !form) return;

    form.reset();

    if (planId) {
      const plan = dataService.getPlanById(planId);
      if (!plan) return;
      title.textContent = 'Edit Subscription Plan';
      this.populateProductDropdown(plan.productId);

      form.querySelector('#plan-field-id').value = plan.id;
      form.querySelector('#plan-field-name').value = plan.name;
      form.querySelector('#plan-field-code').value = plan.code;
      form.querySelector('#plan-field-frequency').value = plan.billingFrequency;
      form.querySelector('#plan-field-price').value = plan.price;
      form.querySelector('#plan-field-min-qty').value = plan.minQuantity || 1;
      form.querySelector('#plan-field-autoclose-days').value = plan.autoCloseGracePeriodDays || 15;
      form.querySelector('#plan-field-start-date').value = plan.startDate || '';
      form.querySelector('#plan-field-end-date').value = plan.endDate || '2028-12-31';
      form.querySelector('#plan-field-description').value = plan.description || '';
      form.querySelector('#plan-field-allow-pause').checked = !!plan.allowPause;
      form.querySelector('#plan-field-allow-early-close').checked = !!plan.allowEarlyClosure;
      form.querySelector('#plan-field-allow-auto-renewal').checked = !!plan.allowAutoRenewal;
      form.querySelector('#plan-field-autoclose-enabled').checked = plan.autoCloseEnabled !== false;
    } else {
      title.textContent = 'Create Subscription Plan';
      this.populateProductDropdown();
      form.querySelector('#plan-field-id').value = '';
      form.querySelector('#plan-field-code').value = `BL-PLAN-${Date.now().toString().slice(-4)}`;
      form.querySelector('#plan-field-start-date').value = new Date().toISOString().split('T')[0];
    }

    modal.classList.add('active');
  }

  closeFormModal() {
    this.container.querySelector('#plan-form-modal')?.classList.remove('active');
  }

  savePlanForm() {
    const form = this.container.querySelector('#plan-form');
    if (!form) return;

    const id = form.querySelector('#plan-field-id').value;
    const name = form.querySelector('#plan-field-name').value.trim();
    const productId = form.querySelector('#plan-field-product').value;
    const code = form.querySelector('#plan-field-code').value.trim();
    const price = Number(form.querySelector('#plan-field-price').value);

    if (!name || !code || isNaN(price)) {
      showToast('Plan title, code, and valid price are required.', 'error');
      return;
    }

    const payload = {
      name,
      productId,
      code,
      billingFrequency: form.querySelector('#plan-field-frequency').value,
      price,
      minQuantity: Number(form.querySelector('#plan-field-min-qty').value) || 1,
      autoCloseGracePeriodDays: Number(form.querySelector('#plan-field-autoclose-days').value) || 15,
      startDate: form.querySelector('#plan-field-start-date').value,
      endDate: form.querySelector('#plan-field-end-date').value,
      description: form.querySelector('#plan-field-description').value.trim(),
      allowPause: form.querySelector('#plan-field-allow-pause').checked,
      maxPauseDurationDays: form.querySelector('#plan-field-allow-pause').checked ? 30 : 0,
      allowEarlyClosure: form.querySelector('#plan-field-allow-early-close').checked,
      allowAutoRenewal: form.querySelector('#plan-field-allow-auto-renewal').checked,
      autoCloseEnabled: form.querySelector('#plan-field-autoclose-enabled').checked
    };

    if (id) {
      dataService.updatePlan(id, payload);
      showToast(`Plan ${name} updated successfully.`);
    } else {
      dataService.createPlan(payload);
      showToast(`Plan ${name} created successfully.`);
    }

    this.closeFormModal();
  }

  confirmArchivePlan(id) {
    const plan = dataService.getPlanById(id);
    if (!plan) return;

    const isArchived = plan.status === 'Archived';
    const actionName = isArchived ? 'Restore' : 'Archive';

    const modal = this.container.querySelector('#plan-confirm-modal');
    const title = this.container.querySelector('#plan-confirm-title');
    const desc = this.container.querySelector('#plan-confirm-desc');
    const btn = this.container.querySelector('#plan-confirm-action');

    title.textContent = `${actionName} Subscription Plan?`;
    desc.textContent = `Are you sure you want to ${actionName.toLowerCase()} "${plan.name}" (${plan.code})?`;
    btn.textContent = actionName;
    btn.style.background = isArchived ? 'var(--primary)' : 'var(--danger)';
    btn.style.borderColor = isArchived ? 'var(--primary)' : 'var(--danger)';

    modal.classList.add('active');

    btn.onclick = () => {
      dataService.archivePlan(id);
      modal.classList.remove('active');
      showToast(`Plan ${plan.name} ${isArchived ? 'restored' : 'archived'}.`);
    };
  }

  openPlanDrawer(id) {
    this.activePlanId = id;
    this.renderPlanDetailDrawer(id);
    this.container.querySelector('#plan-detail-overlay')?.classList.add('active');
    this.container.querySelector('#plan-detail-drawer')?.classList.add('active');
  }

  closePlanDrawer() {
    this.activePlanId = null;
    this.container.querySelector('#plan-detail-overlay')?.classList.remove('active');
    this.container.querySelector('#plan-detail-drawer')?.classList.remove('active');
  }

  renderPlanDetailDrawer(id) {
    const plan = dataService.getPlanById(id);
    if (!plan) return;

    const titleEl = this.container.querySelector('#drawer-plan-title');
    const codeEl = this.container.querySelector('#drawer-plan-code');
    const body = this.container.querySelector('#drawer-plan-body');

    if (titleEl) titleEl.textContent = plan.name;
    if (codeEl) codeEl.textContent = `${plan.code} • Frequency: ${plan.billingFrequency}`;

    body.innerHTML = `
      <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
        <span class="badge ${plan.status === 'Active' ? 'badge-success' : 'badge-neutral'}">${plan.status}</span>
        <button class="btn btn-secondary btn-sm" id="plan-drawer-quick-edit">
          <i data-lucide="edit-2"></i> Edit Parameters
        </button>
      </div>

      <div class="card" style="padding: 16px; margin-bottom: 16px;">
        <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Recurring Rate</div>
        <div style="font-size: 28px; font-weight: 700; color: var(--text-main);" class="mono-text">
          ₹ ${(plan.price || 0).toLocaleString('en-IN')} <span style="font-size: 13px; font-weight: 400; color: var(--text-muted);">/ ${plan.billingFrequency}</span>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Associated Product</label>
        <div style="font-weight: 600;">${plan.productName}</div>
      </div>

      <div class="form-group">
        <label class="form-label">Plan Description</label>
        <div style="color: var(--text-secondary); font-size: 13px;">${plan.description || 'No description entered.'}</div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Availability Start</label>
          <div class="mono-text">${plan.startDate || 'Immediate'}</div>
        </div>
        <div class="form-group">
          <label class="form-label">Availability End</label>
          <div class="mono-text">${plan.endDate || 'Perpetual'}</div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Policy Specifications</label>
        <div class="card" style="padding: 12px; background: #fafbfc; border: 1px solid var(--border);">
          <ul style="list-style: none; padding: 0; font-size: 13px; line-height: 2;">
            <li>✓ Auto-close on unpaid invoice: <strong>${plan.autoCloseEnabled ? `After ${plan.autoCloseGracePeriodDays} days grace` : 'Disabled'}</strong></li>
            <li>✓ Subscriber pause: <strong>${plan.allowPause ? `Enabled (up to ${plan.maxPauseDurationDays || 30} days)` : 'Disabled'}</strong></li>
            <li>✓ Early contract closure: <strong>${plan.allowEarlyClosure ? 'Allowed with fee adjustment' : 'Contract Locked'}</strong></li>
            <li>✓ Recurring auto-renewal: <strong>${plan.allowAutoRenewal ? 'Enabled' : 'Manual agreement required'}</strong></li>
            <li>✓ Minimum quantity: <strong>${plan.minQuantity || 1} unit</strong></li>
          </ul>
        </div>
      </div>
    `;

    body.querySelector('#plan-drawer-quick-edit')?.addEventListener('click', () => {
      this.closePlanDrawer();
      this.openFormModal(plan.id);
    });

    createIcons({ icons });
  }

  exportCSV() {
    const list = dataService.getPlans();
    if (list.length === 0) {
      showToast('No plans to export.', 'error');
      return;
    }

    const headers = ['ID', 'Name', 'Code', 'Product', 'Frequency', 'Price', 'Status', 'Grace Period Days', 'Allow Pause'];
    const rows = list.map(p => [
      p.id,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      p.code,
      `"${(p.productName || '').replace(/"/g, '""')}"`,
      p.billingFrequency,
      p.price || 0,
      p.status,
      p.autoCloseGracePeriodDays || 0,
      p.allowPause ? 'Yes' : 'No'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SubscriptIQ_Plans_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Subscription plans CSV exported.');
  }
}

