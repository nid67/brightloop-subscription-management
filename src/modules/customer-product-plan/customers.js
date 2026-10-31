import { dataService } from './data-service.js';
import { showToast } from './toast.js';
import { createIcons, icons } from 'lucide';

export class CustomerModule {
  constructor() {
    this.currentPage = 1;
    this.pageSize = 5;
    this.searchQuery = '';
    this.statusFilter = '';
    this.typeFilter = '';
    this.sortBy = 'name';
    this.sortOrder = 'asc';
    this.activeCustomerId = null;

    this.container = document.getElementById('view-customers');
    if (!this.container) return;

    this.init();
  }

  init() {
    this.renderLayout();
    this.bindEvents();
    this.loadData();
    dataService.subscribe(() => {
      this.loadData();
      if (this.activeCustomerId) {
        this.renderCustomerProfileDrawer(this.activeCustomerId);
      }
    });
  }

  renderLayout() {
    this.container.innerHTML = `
      <div class="page-header">
        <div class="page-title">
          <h2>Customer Directory</h2>
          <p>Manage subscriber accounts, billing profiles, contact details and lifetime revenue</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary btn-sm" id="customer-refresh-btn">
            <i data-lucide="rotate-cw"></i> Refresh
          </button>
          <button class="btn btn-primary" id="customer-add-btn">
            <i data-lucide="user-plus"></i> Add Customer
          </button>
        </div>
      </div>

      <div class="card">
        <div class="filter-bar">
          <div class="filter-left">
            <div style="position: relative; width: 300px;">
              <input type="text" id="customer-search-input" class="form-input" placeholder="Search customer, email, GSTIN..." style="width: 100%; padding-left: 32px;" />
              <i data-lucide="search" style="position: absolute; left: 10px; top: 9px; width: 14px; height: 14px; color: var(--text-muted);"></i>
            </div>
            <select id="customer-status-filter" class="form-select">
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Overdue">Overdue</option>
              <option value="Churned">Churned</option>
              <option value="Archived">Archived</option>
            </select>
            <select id="customer-type-filter" class="form-select">
              <option value="">All Types</option>
              <option value="Enterprise">Enterprise</option>
              <option value="Mid-Market">Mid-Market</option>
              <option value="Startup">Startup</option>
              <option value="Individual">Individual</option>
            </select>
          </div>
          <div class="filter-right">
            <button class="btn btn-secondary btn-sm" id="customer-export-csv">
              <i data-lucide="download"></i> Export CSV
            </button>
          </div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th style="cursor: pointer;" id="th-customer-name">
                  Customer / Company <i data-lucide="chevrons-up-down" style="width: 12px; height: 12px; vertical-align: middle;"></i>
                </th>
                <th>Email & Phone</th>
                <th>Type</th>
                <th>Active Subscriptions</th>
                <th>GSTIN / Tax ID</th>
                <th>Lifetime Revenue</th>
                <th>Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody id="customer-table-body">
              <!-- Rendered dynamically -->
            </tbody>
          </table>
        </div>

        <div class="pagination-bar" id="customer-pagination">
          <!-- Rendered dynamically -->
        </div>
      </div>

      <!-- Add/Edit Customer Modal -->
      <div id="customer-form-modal" class="modal-overlay">
        <div class="modal-dialog" style="max-width: 550px;">
          <div class="modal-header">
            <div class="modal-title" id="customer-modal-title">Add New Customer Account</div>
            <button class="modal-close" id="customer-modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <form id="customer-form">
              <input type="hidden" id="cust-field-id" />
              
              <div class="form-group">
                <label class="form-label">Full Name / Primary Contact <span style="color: var(--danger)">*</span></label>
                <input type="text" id="cust-field-name" class="form-input" required placeholder="e.g. Acme Technologies Ltd" style="width: 100%;" />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Company Name</label>
                  <input type="text" id="cust-field-company" class="form-input" placeholder="Legal registered company" style="width: 100%;" />
                </div>
                <div class="form-group">
                  <label class="form-label">Customer Tier / Type</label>
                  <select id="cust-field-type" class="form-select" style="width: 100%;">
                    <option value="Enterprise">Enterprise</option>
                    <option value="Mid-Market">Mid-Market</option>
                    <option value="Startup">Startup</option>
                    <option value="Individual">Individual</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Billing Email Address <span style="color: var(--danger)">*</span></label>
                  <input type="email" id="cust-field-email" class="form-input" required placeholder="billing@company.com" style="width: 100%;" />
                </div>
                <div class="form-group">
                  <label class="form-label">Phone Number</label>
                  <input type="text" id="cust-field-phone" class="form-input" placeholder="+91 98000 00000" style="width: 100%;" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">GSTIN / Tax ID</label>
                  <input type="text" id="cust-field-gstin" class="form-input" placeholder="27AABCU9603R1ZM" style="width: 100%;" />
                  <span class="form-help">15-digit Indian GST number format</span>
                </div>
                <div class="form-group">
                  <label class="form-label">Status</label>
                  <select id="cust-field-status" class="form-select" style="width: 100%;">
                    <option value="Active">Active</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Churned">Churned</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Billing Address</label>
                <textarea id="cust-field-address" class="form-input" rows="2" placeholder="Registered office or delivery address" style="width: 100%; resize: vertical;"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="customer-modal-cancel">Cancel</button>
            <button type="button" class="btn btn-primary" id="customer-modal-submit">Save Customer</button>
          </div>
        </div>
      </div>

      <!-- Customer Details Drawer -->
      <div id="customer-detail-overlay" class="drawer-overlay"></div>
      <div id="customer-detail-drawer" class="drawer-panel" style="width: 520px; max-width: 90vw;">
        <div class="drawer-header">
          <div>
            <div style="font-size: 16px; font-weight: 600;" id="drawer-cust-name">Customer Account Profile</div>
            <div style="font-size: 12px; color: var(--text-muted);" id="drawer-cust-id">CUST-001</div>
          </div>
          <button class="modal-close" id="drawer-cust-close">&times;</button>
        </div>
        <div class="drawer-body" id="drawer-cust-body">
          <!-- Dynamic Profile Content -->
        </div>
      </div>

      <!-- Confirm Dialog Modal -->
      <div id="customer-confirm-modal" class="modal-overlay">
        <div class="modal-dialog" style="max-width: 400px;">
          <div class="modal-body">
            <div class="confirm-dialog-content">
              <div class="confirm-dialog-icon">
                <i data-lucide="alert-triangle"></i>
              </div>
              <div class="confirm-dialog-title" id="cust-confirm-title">Archive Customer?</div>
              <div class="confirm-dialog-desc" id="cust-confirm-desc">Are you sure you want to proceed?</div>
            </div>
          </div>
          <div class="modal-footer" style="justify-content: center; gap: 12px;">
            <button class="btn btn-secondary" id="cust-confirm-cancel">Cancel</button>
            <button class="btn btn-primary" id="cust-confirm-action" style="background: var(--danger); border-color: var(--danger);">Confirm</button>
          </div>
        </div>
      </div>
    `;

    createIcons({ icons });
  }

  bindEvents() {
    // Search & Filters
    const searchInput = this.container.querySelector('#customer-search-input');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.currentPage = 1;
      this.loadData();
    });

    const statusFilter = this.container.querySelector('#customer-status-filter');
    statusFilter?.addEventListener('change', (e) => {
      this.statusFilter = e.target.value;
      this.currentPage = 1;
      this.loadData();
    });

    const typeFilter = this.container.querySelector('#customer-type-filter');
    typeFilter?.addEventListener('change', (e) => {
      this.typeFilter = e.target.value;
      this.currentPage = 1;
      this.loadData();
    });

    // Refresh & Export
    this.container.querySelector('#customer-refresh-btn')?.addEventListener('click', () => {
      this.loadData();
      showToast('Customer directory refreshed', 'info');
    });

    this.container.querySelector('#customer-export-csv')?.addEventListener('click', () => {
      this.exportCSV();
    });

    // Add Customer
    this.container.querySelector('#customer-add-btn')?.addEventListener('click', () => {
      this.openFormModal();
    });

    // Modal Close
    this.container.querySelector('#customer-modal-close')?.addEventListener('click', () => this.closeFormModal());
    this.container.querySelector('#customer-modal-cancel')?.addEventListener('click', () => this.closeFormModal());

    // Modal Submit
    this.container.querySelector('#customer-modal-submit')?.addEventListener('click', () => this.saveCustomerForm());

    // Drawer Close
    this.container.querySelector('#drawer-cust-close')?.addEventListener('click', () => this.closeCustomerDrawer());
    this.container.querySelector('#customer-detail-overlay')?.addEventListener('click', () => this.closeCustomerDrawer());

    // Confirm Modal Cancel
    this.container.querySelector('#cust-confirm-cancel')?.addEventListener('click', () => {
      this.container.querySelector('#customer-confirm-modal')?.classList.remove('active');
    });
  }

  loadData() {
    const customers = dataService.getCustomers({
      search: this.searchQuery,
      status: this.statusFilter,
      type: this.typeFilter,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    });

    const total = customers.length;
    const totalPages = Math.max(1, Math.ceil(total / this.pageSize));
    if (this.currentPage > totalPages) this.currentPage = totalPages;

    const startIdx = (this.currentPage - 1) * this.pageSize;
    const paginated = customers.slice(startIdx, startIdx + this.pageSize);

    const tbody = this.container.querySelector('#customer-table-body');
    if (!tbody) return;

    if (paginated.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="empty-state-container">
              <i data-lucide="users" class="empty-state-icon"></i>
              <div class="empty-state-title">No customers found</div>
              <div class="empty-state-subtitle">No customer records matched your query. Add a new customer or clear filters.</div>
              <button class="btn btn-secondary btn-sm" id="customer-clear-filter-btn">Clear All Filters</button>
            </div>
          </td>
        </tr>
      `;
      tbody.querySelector('#customer-clear-filter-btn')?.addEventListener('click', () => {
        this.searchQuery = '';
        this.statusFilter = '';
        this.typeFilter = '';
        const sInput = this.container.querySelector('#customer-search-input');
        if (sInput) sInput.value = '';
        const stFilter = this.container.querySelector('#customer-status-filter');
        if (stFilter) stFilter.value = '';
        const tFilter = this.container.querySelector('#customer-type-filter');
        if (tFilter) tFilter.value = '';
        this.loadData();
      });
      createIcons({ icons });
      this.renderPagination(total, totalPages);
      return;
    }

    tbody.innerHTML = paginated.map(c => {
      const initials = (c.name || 'C').substring(0, 2).toUpperCase();
      const statusBadge = this.getStatusBadge(c.status);
      const activeSubCount = (c.activeSubscriptions || []).length;
      const formattedRev = '₹ ' + (c.lifetimeRevenue || 0).toLocaleString('en-IN');

      return `
        <tr>
          <td>
            <div class="customer-cell">
              <span class="customer-avatar">${initials}</span>
              <div>
                <strong>${c.name}</strong>
                <span class="customer-company-sub">${c.company || c.name}</span>
              </div>
            </div>
          </td>
          <td>
            <div>${c.email}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${c.phone || 'No phone'}</div>
          </td>
          <td>
            <span class="badge badge-neutral">${c.customerType || 'Standard'}</span>
          </td>
          <td>
            <strong>${activeSubCount}</strong> ${activeSubCount === 1 ? 'Subscription' : 'Subscriptions'}
          </td>
          <td class="mono-text">${c.gstin || '<span class="text-muted">N/A</span>'}</td>
          <td class="mono-text"><strong>${formattedRev}</strong></td>
          <td>${statusBadge}</td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 4px;">
              <button class="btn btn-secondary btn-sm btn-cust-view" data-id="${c.id}" title="View Profile">
                <i data-lucide="eye"></i> View
              </button>
              <button class="btn btn-secondary btn-sm btn-cust-edit" data-id="${c.id}" title="Edit Account">
                <i data-lucide="edit-2"></i>
              </button>
              <button class="btn btn-secondary btn-sm btn-cust-archive" data-id="${c.id}" title="${c.status === 'Archived' ? 'Unarchive' : 'Archive'}">
                <i data-lucide="${c.status === 'Archived' ? 'archive-restore' : 'archive'}"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Row action listeners
    tbody.querySelectorAll('.btn-cust-view').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openCustomerDrawer(id);
      });
    });

    tbody.querySelectorAll('.btn-cust-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openFormModal(id);
      });
    });

    tbody.querySelectorAll('.btn-cust-archive').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.confirmArchiveCustomer(id);
      });
    });

    this.renderPagination(total, totalPages);
    createIcons({ icons });
  }

  getStatusBadge(status) {
    switch ((status || '').toLowerCase()) {
      case 'active':
        return '<span class="badge badge-success">Active</span>';
      case 'overdue':
        return '<span class="badge badge-warning">Overdue</span>';
      case 'churned':
        return '<span class="badge badge-danger">Churned</span>';
      case 'archived':
        return '<span class="badge badge-neutral">Archived</span>';
      default:
        return `<span class="badge badge-neutral">${status || 'Draft'}</span>`;
    }
  }

  renderPagination(total, totalPages) {
    const bar = this.container.querySelector('#customer-pagination');
    if (!bar) return;

    if (total === 0) {
      bar.innerHTML = '<div>0 customers</div>';
      return;
    }

    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(start + this.pageSize - 1, total);

    let buttons = '';
    for (let i = 1; i <= totalPages; i++) {
      buttons += `
        <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>
      `;
    }

    bar.innerHTML = `
      <div>Showing <strong>${start}-${end}</strong> of <strong>${total}</strong> customers</div>
      <div class="pagination-actions">
        <button class="pagination-btn" id="cust-prev-page" ${this.currentPage === 1 ? 'disabled' : ''}>Previous</button>
        ${buttons}
        <button class="pagination-btn" id="cust-next-page" ${this.currentPage === totalPages ? 'disabled' : ''}>Next</button>
      </div>
    `;

    bar.querySelector('#cust-prev-page')?.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadData();
      }
    });

    bar.querySelector('#cust-next-page')?.addEventListener('click', () => {
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.loadData();
      }
    });

    bar.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentPage = Number(btn.getAttribute('data-page'));
        this.loadData();
      });
    });
  }

  openFormModal(customerId = null) {
    const modal = this.container.querySelector('#customer-form-modal');
    const title = this.container.querySelector('#customer-modal-title');
    const form = this.container.querySelector('#customer-form');
    if (!modal || !form) return;

    form.reset();

    if (customerId) {
      const cust = dataService.getCustomerById(customerId);
      if (!cust) return;
      title.textContent = 'Edit Customer Account';
      form.querySelector('#cust-field-id').value = cust.id;
      form.querySelector('#cust-field-name').value = cust.name;
      form.querySelector('#cust-field-company').value = cust.company || '';
      form.querySelector('#cust-field-type').value = cust.customerType || 'Enterprise';
      form.querySelector('#cust-field-email').value = cust.email;
      form.querySelector('#cust-field-phone').value = cust.phone || '';
      form.querySelector('#cust-field-gstin').value = cust.gstin || '';
      form.querySelector('#cust-field-status').value = cust.status || 'Active';
      form.querySelector('#cust-field-address').value = cust.address || '';
    } else {
      title.textContent = 'Add New Customer Account';
      form.querySelector('#cust-field-id').value = '';
    }

    modal.classList.add('active');
  }

  closeFormModal() {
    this.container.querySelector('#customer-form-modal')?.classList.remove('active');
  }

  saveCustomerForm() {
    const form = this.container.querySelector('#customer-form');
    if (!form) return;

    const id = form.querySelector('#cust-field-id').value;
    const name = form.querySelector('#cust-field-name').value.trim();
    const email = form.querySelector('#cust-field-email').value.trim();

    if (!name || !email) {
      showToast('Customer name and billing email are required.', 'error');
      return;
    }

    const payload = {
      name,
      company: form.querySelector('#cust-field-company').value.trim(),
      customerType: form.querySelector('#cust-field-type').value,
      email,
      phone: form.querySelector('#cust-field-phone').value.trim(),
      gstin: form.querySelector('#cust-field-gstin').value.trim(),
      status: form.querySelector('#cust-field-status').value,
      address: form.querySelector('#cust-field-address').value.trim()
    };

    if (id) {
      dataService.updateCustomer(id, payload);
      showToast(`Customer ${name} updated successfully.`);
    } else {
      dataService.createCustomer(payload);
      showToast(`Customer ${name} created successfully.`);
    }

    this.closeFormModal();
  }

  confirmArchiveCustomer(id) {
    const cust = dataService.getCustomerById(id);
    if (!cust) return;

    const isArchived = cust.status === 'Archived';
    const actionName = isArchived ? 'Restore' : 'Archive';

    const modal = this.container.querySelector('#customer-confirm-modal');
    const title = this.container.querySelector('#cust-confirm-title');
    const desc = this.container.querySelector('#cust-confirm-desc');
    const btn = this.container.querySelector('#cust-confirm-action');

    title.textContent = `${actionName} Customer Account?`;
    desc.textContent = `Are you sure you want to ${actionName.toLowerCase()} "${cust.name}"? Active subscriptions will not be deleted.`;
    btn.textContent = actionName;
    btn.style.background = isArchived ? 'var(--primary)' : 'var(--danger)';
    btn.style.borderColor = isArchived ? 'var(--primary)' : 'var(--danger)';

    modal.classList.add('active');

    btn.onclick = () => {
      dataService.archiveCustomer(id);
      modal.classList.remove('active');
      showToast(`Customer ${cust.name} ${isArchived ? 'restored' : 'archived'}.`);
    };
  }

  openCustomerDrawer(id) {
    this.activeCustomerId = id;
    this.renderCustomerProfileDrawer(id);
    this.container.querySelector('#customer-detail-overlay')?.classList.add('active');
    this.container.querySelector('#customer-detail-drawer')?.classList.add('active');
  }

  closeCustomerDrawer() {
    this.activeCustomerId = null;
    this.container.querySelector('#customer-detail-overlay')?.classList.remove('active');
    this.container.querySelector('#customer-detail-drawer')?.classList.remove('active');
  }

  renderCustomerProfileDrawer(id) {
    const cust = dataService.getCustomerById(id);
    if (!cust) return;

    const drawerName = this.container.querySelector('#drawer-cust-name');
    const drawerId = this.container.querySelector('#drawer-cust-id');
    const drawerBody = this.container.querySelector('#drawer-cust-body');

    if (drawerName) drawerName.textContent = cust.name;
    if (drawerId) drawerId.textContent = `${cust.id} • Registered ${cust.registrationDate}`;

    const activeSubs = cust.activeSubscriptions || [];
    const prevSubs = cust.previousSubscriptions || [];
    const invoices = cust.invoices || [];
    const payments = cust.payments || [];
    const activities = cust.activities || [];

    drawerBody.innerHTML = `
      <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          ${this.getStatusBadge(cust.status)}
          <span class="badge badge-neutral" style="margin-left: 6px;">${cust.customerType || 'Enterprise'}</span>
        </div>
        <button class="btn btn-secondary btn-sm" id="drawer-quick-edit-btn">
          <i data-lucide="edit-2"></i> Edit Account
        </button>
      </div>

      <div class="customer-drawer-kpis">
        <div class="customer-kpi-card">
          <div class="kpi-label">Lifetime Revenue</div>
          <div class="kpi-value mono-text">₹ ${(cust.lifetimeRevenue || 0).toLocaleString('en-IN')}</div>
        </div>
        <div class="customer-kpi-card">
          <div class="kpi-label">Outstanding Balance</div>
          <div class="kpi-value mono-text" style="color: ${cust.outstandingBalance > 0 ? 'var(--danger)' : 'var(--success)'};">
            ₹ ${(cust.outstandingBalance || 0).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      <div class="customer-drawer-tabs">
        <button class="customer-drawer-tab active" data-tab="tab-overview">Overview</button>
        <button class="customer-drawer-tab" data-tab="tab-subscriptions">Subscriptions (${activeSubs.length})</button>
        <button class="customer-drawer-tab" data-tab="tab-invoices">Invoices (${invoices.length})</button>
        <button class="customer-drawer-tab" data-tab="tab-payments">Payments (${payments.length})</button>
        <button class="customer-drawer-tab" data-tab="tab-activity">Activity</button>
      </div>

      <!-- Tab: Overview -->
      <div class="customer-tab-pane active" id="tab-overview">
        <div class="form-group">
          <label class="form-label">Company / Account Name</label>
          <div style="font-weight: 600;">${cust.company || cust.name}</div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Billing Email</label>
            <div class="mono-text">${cust.email}</div>
          </div>
          <div class="form-group">
            <label class="form-label">Contact Phone</label>
            <div>${cust.phone || '<span class="text-muted">Not provided</span>'}</div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">GSTIN / Tax Identification</label>
          <div class="mono-text">${cust.gstin || '<span class="text-muted">Not configured</span>'}</div>
        </div>
        <div class="form-group">
          <label class="form-label">Billing Address</label>
          <div style="color: var(--text-secondary);">${cust.address || '<span class="text-muted">No address specified</span>'}</div>
        </div>
      </div>

      <!-- Tab: Subscriptions -->
      <div class="customer-tab-pane" id="tab-subscriptions">
        <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">Active Subscriptions</div>
        ${activeSubs.length > 0 ? activeSubs.map(sub => `
          <div class="card" style="padding: 12px; margin-bottom: 10px; border-left: 3px solid var(--primary);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <strong>${sub.planName}</strong>
                <div class="mono-text" style="font-size: 11px; color: var(--text-muted);">${sub.id} • ${sub.cadence}</div>
              </div>
              <span class="badge badge-success">${sub.status}</span>
            </div>
            <div style="margin-top: 8px; display: flex; justify-content: space-between; font-size: 12px;">
              <span>Recurring Amount: <strong class="mono-text">₹ ${sub.amount.toLocaleString('en-IN')}</strong></span>
              <span style="color: var(--text-muted);">Renews: ${sub.renewalDate}</span>
            </div>
          </div>
        `).join('') : '<div class="text-muted" style="font-size: 13px; padding: 12px 0;">No active subscriptions found.</div>'}

        ${prevSubs.length > 0 ? `
          <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin: 16px 0 8px 0;">Previous Subscriptions</div>
          ${prevSubs.map(sub => `
            <div class="card" style="padding: 12px; margin-bottom: 8px; opacity: 0.85;">
              <div style="display: flex; justify-content: space-between;">
                <div>
                  <strong>${sub.planName}</strong>
                  <div class="mono-text" style="font-size: 11px; color: var(--text-muted);">${sub.id}</div>
                </div>
                <span class="badge badge-neutral">Closed (${sub.closedDate})</span>
              </div>
            </div>
          `).join('')}
        ` : ''}
      </div>

      <!-- Tab: Invoices -->
      <div class="customer-tab-pane" id="tab-invoices">
        ${invoices.length > 0 ? invoices.map(inv => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border-subtle);">
            <div>
              <div class="mono-text" style="font-weight: 600;">${inv.id}</div>
              <div style="font-size: 11px; color: var(--text-muted);">Date: ${inv.date} • Due: ${inv.dueDate}</div>
            </div>
            <div style="text-align: right;">
              <div class="mono-text" style="font-weight: 700;">₹ ${inv.amount.toLocaleString('en-IN')}</div>
              <span class="badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-warning'}" style="font-size: 10px;">${inv.status}</span>
            </div>
          </div>
        `).join('') : '<div class="text-muted" style="padding: 12px 0;">No invoices recorded.</div>'}
      </div>

      <!-- Tab: Payments -->
      <div class="customer-tab-pane" id="tab-payments">
        ${payments.length > 0 ? payments.map(pay => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border-subtle);">
            <div>
              <div class="mono-text" style="font-weight: 600;">${pay.id} • ${pay.method}</div>
              <div style="font-size: 11px; color: var(--text-muted);">Date: ${pay.date} • Ref: ${pay.ref}</div>
            </div>
            <div style="text-align: right;">
              <div class="mono-text" style="font-weight: 700; color: var(--success);">+ ₹ ${pay.amount.toLocaleString('en-IN')}</div>
              <span class="badge badge-success" style="font-size: 10px;">Cleared</span>
            </div>
          </div>
        `).join('') : '<div class="text-muted" style="padding: 12px 0;">No payment transactions recorded.</div>'}
      </div>

      <!-- Tab: Activity History -->
      <div class="customer-tab-pane" id="tab-activity">
        <div class="timeline-list">
          ${activities.length > 0 ? activities.map(act => `
            <div class="timeline-item">
              <div class="timeline-bullet"></div>
              <div class="timeline-content">
                <div class="timeline-title">${act.description}</div>
                <div class="timeline-time">${act.date} • <span class="badge badge-neutral" style="font-size: 9px;">${act.type}</span></div>
              </div>
            </div>
          `).join('') : '<div class="text-muted">No recent activity logs.</div>'}
        </div>
      </div>
    `;

    // Tab switching in drawer
    drawerBody.querySelectorAll('.customer-drawer-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        drawerBody.querySelectorAll('.customer-drawer-tab').forEach(t => t.classList.remove('active'));
        drawerBody.querySelectorAll('.customer-tab-pane').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const targetId = tab.getAttribute('data-tab');
        drawerBody.querySelector(`#${targetId}`)?.classList.add('active');
      });
    });

    // Quick Edit Button inside drawer
    drawerBody.querySelector('#drawer-quick-edit-btn')?.addEventListener('click', () => {
      this.closeCustomerDrawer();
      this.openFormModal(cust.id);
    });

    createIcons({ icons });
  }

  exportCSV() {
    const list = dataService.getCustomers();
    if (list.length === 0) {
      showToast('No customer data to export.', 'error');
      return;
    }

    const headers = ['ID', 'Name', 'Company', 'Email', 'Phone', 'Type', 'GSTIN', 'Status', 'Lifetime Revenue', 'Outstanding Balance'];
    const rows = list.map(c => [
      c.id,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.company || '').replace(/"/g, '""')}"`,
      c.email,
      c.phone || '',
      c.customerType || '',
      c.gstin || '',
      c.status,
      c.lifetimeRevenue || 0,
      c.outstandingBalance || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SubscriptIQ_Customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Customer CSV exported successfully.');
  }
}

