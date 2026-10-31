/**
 * Customer Self-Service Portal Module
 * Subscriber-facing views for subscriptions, invoices, payment methods,
 * early renewals, pause requests, cancellation workflows, and account settings.
 */

import { getCurrentUser } from './rbac.js';
import { showToast } from './toast.js';

const SUBS_KEY = 'subscriptiq_customer_subscriptions';
const INVS_KEY = 'subscriptiq_customer_invoices';
const REQS_KEY = 'subscriptiq_customer_requests';

function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

let customerSubscriptions = loadFromStorage(SUBS_KEY);
let customerInvoices = loadFromStorage(INVS_KEY);
let customerServiceRequests = loadFromStorage(REQS_KEY);

let selectedSubscriptionForAction = null;

export function renderPortalProfileBanner() {
  const user = getCurrentUser() || {};
  const companyEl = document.getElementById('portal-banner-company');
  const userEl = document.getElementById('portal-banner-user');
  const gstinEl = document.getElementById('portal-banner-gstin');
  const subCountEl = document.getElementById('portal-banner-sub-count');
  const nextBillEl = document.getElementById('portal-banner-next-billing');
  const avatarEl = document.getElementById('portal-banner-avatar');

  if (avatarEl) avatarEl.textContent = user.avatar || 'CU';
  if (companyEl) companyEl.textContent = user.company || user.name || 'Subscriber Account';
  if (userEl) userEl.textContent = user.email ? `${user.name} (${user.email})` : 'No authenticated subscriber';
  if (gstinEl) gstinEl.textContent = user.gstin ? `GSTIN: ${user.gstin}` : 'GSTIN: Not Registered';
  if (subCountEl) subCountEl.textContent = `${customerSubscriptions.length} ${customerSubscriptions.length === 1 ? 'Plan' : 'Plans'}`;
  if (nextBillEl) nextBillEl.textContent = customerSubscriptions[0]?.nextRenewal || 'None Scheduled';
}

export function renderPortalSubscriptions() {
  const container = document.getElementById('portal-subscriptions-list');
  if (!container) return;

  if (customerSubscriptions.length === 0) {
    container.innerHTML = `
      <div class="placeholder-box" style="padding: 48px 24px;">
        <div style="font-size: 15px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">No Active Subscriptions</div>
        <p style="font-size: 13px; color: var(--text-muted); max-width: 440px; margin: 0 auto;">
          There are currently no active recurring contracts registered for this subscriber account. When recurring subscriptions are confirmed, they will appear here.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = customerSubscriptions.map(sub => {
    const isPaused = sub.status?.includes('Pause');
    const isCancelled = sub.status?.includes('Cancel');
    const badgeClass = isPaused ? 'badge-warning' : (isCancelled ? 'badge-danger' : 'badge-success');

    return `
      <div class="portal-sub-card" data-sub-id="${sub.id}">
        <div class="portal-sub-card-header">
          <div>
            <div class="portal-sub-plan-title">${sub.planName}</div>
            <div class="portal-sub-plan-id">${sub.id} &bull; Started on ${sub.startDate || '—'}</div>
          </div>
          <span class="badge ${badgeClass}">${sub.status}</span>
        </div>

        <div class="portal-sub-price-row">
          <span class="portal-sub-price-val">&#8377; ${(sub.price || 0).toLocaleString('en-IN')}</span>
          <span class="portal-sub-price-cadence">/ ${(sub.cadence || 'month').toLowerCase()}</span>
        </div>

        <div class="portal-sub-details-grid">
          <div class="portal-sub-detail-item">
            <div class="lbl">Next Renewal Date</div>
            <div class="val">${sub.nextRenewal || '—'}</div>
          </div>
          <div class="portal-sub-detail-item">
            <div class="lbl">Auto-Renewal</div>
            <div class="val">${sub.autoRenew ? 'Enabled (Idempotent)' : 'Disabled'}</div>
          </div>
          <div class="portal-sub-detail-item">
            <div class="lbl">Grace Period</div>
            <div class="val">${sub.gracePeriodDays || 0} days after due date</div>
          </div>
          <div class="portal-sub-detail-item">
            <div class="lbl">Configured Add-ons</div>
            <div class="val">${(sub.attributes || []).length} attributes active</div>
          </div>
        </div>

        <div class="portal-sub-actions">
          <div class="portal-sub-actions-left">
            <button class="btn btn-primary btn-sm btn-portal-renew" data-id="${sub.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              Renew Early
            </button>
            <button class="btn btn-secondary btn-sm btn-portal-pause" data-id="${sub.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/></svg>
              Request Pause
            </button>
            <button class="btn btn-secondary btn-sm btn-portal-details" data-id="${sub.id}">
              View Details
            </button>
          </div>
          <button class="btn btn-secondary btn-sm btn-portal-cancel" data-id="${sub.id}" style="color: var(--danger); border-color: rgba(223, 27, 65, 0.2);">
            Cancel Plan
          </button>
        </div>
      </div>
    `;
  }).join('');

  attachPortalSubActionListeners();
}

function attachPortalSubActionListeners() {
  // Early Renewal Modal Trigger
  document.querySelectorAll('.btn-portal-renew').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const sub = customerSubscriptions.find(s => s.id === id);
      if (!sub) return;

      selectedSubscriptionForAction = sub;
      const modal = document.getElementById('portal-renew-modal');
      const planNameEl = document.getElementById('renew-modal-plan-name');
      const priceEl = document.getElementById('renew-modal-amount');
      const nextDateEl = document.getElementById('renew-modal-next-date');

      if (planNameEl) planNameEl.textContent = sub.planName;
      if (priceEl) priceEl.textContent = `₹ ${(sub.price || 0).toLocaleString('en-IN')}`;
      if (nextDateEl) nextDateEl.textContent = sub.nextRenewal || '—';

      if (modal) modal.classList.add('active');
    });
  });

  // Pause Modal Trigger
  document.querySelectorAll('.btn-portal-pause').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const sub = customerSubscriptions.find(s => s.id === id);
      if (!sub) return;

      selectedSubscriptionForAction = sub;
      const modal = document.getElementById('portal-pause-modal');
      const planNameEl = document.getElementById('pause-modal-plan-name');
      if (planNameEl) planNameEl.textContent = sub.planName;
      if (modal) modal.classList.add('active');
    });
  });

  // Cancellation Modal Trigger
  document.querySelectorAll('.btn-portal-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const sub = customerSubscriptions.find(s => s.id === id);
      if (!sub) return;

      selectedSubscriptionForAction = sub;
      const modal = document.getElementById('portal-cancel-modal');
      const planNameEl = document.getElementById('cancel-modal-plan-name');
      if (planNameEl) planNameEl.textContent = sub.planName;
      if (modal) modal.classList.add('active');
    });
  });

  // Detail Drawer Trigger
  document.querySelectorAll('.btn-portal-details').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const sub = customerSubscriptions.find(s => s.id === id);
      if (!sub) return;

      openPortalSubDetailDrawer(sub);
    });
  });
}

function openPortalSubDetailDrawer(sub) {
  const drawer = document.getElementById('portal-sub-detail-drawer');
  const overlay = document.getElementById('portal-sub-detail-drawer-overlay');
  const titleEl = document.getElementById('portal-drawer-sub-title');
  const idEl = document.getElementById('portal-drawer-sub-id');
  const contentEl = document.getElementById('portal-drawer-sub-content');

  if (titleEl) titleEl.textContent = sub.planName;
  if (idEl) idEl.textContent = `${sub.id} • ${sub.cadence || 'Monthly'} Cycle`;

  if (contentEl) {
    const attrs = sub.attributes || [];
    contentEl.innerHTML = `
      <div class="info-banner" style="margin-bottom: 16px;">
        <strong>Subscription Status:</strong> ${sub.status} &bull; Next renewal: ${sub.nextRenewal || '—'}
      </div>

      <div class="form-group">
        <label class="form-label">Billing Amount</label>
        <div style="font-size: 20px; font-weight: 700; font-family: var(--font-mono);">&#8377; ${(sub.price || 0).toLocaleString('en-IN')} / ${(sub.cadence || 'month').toLowerCase()}</div>
      </div>

      <div class="form-group">
        <label class="form-label">Configured Attributes & Dynamic Surcharges</label>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
          ${attrs.length > 0 ? attrs.map(attr => `
            <div style="display: flex; justify-content: space-between; background: var(--bg-page); padding: 8px 12px; border-radius: var(--radius-sm); font-size: 12px;">
              <span><strong>${attr.name}:</strong> ${attr.value}</span>
              <span class="mono-text">+&#8377; ${attr.surcharge || 0}</span>
            </div>
          `).join('') : '<div style="font-size: 12px; color: var(--text-muted);">No custom attributes configured for this plan.</div>'}
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Idempotency Token</label>
        <div class="mono-text" style="font-size: 11px; color: var(--text-muted);">${sub.idempotencyKey || '—'}</div>
      </div>

      <div class="form-group">
        <label class="form-label">Service Level Agreement (SLA)</label>
        <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
          Includes uptime guarantee, ticketing response SLA, and automated Dual-GST reporting compliance.
        </p>
      </div>
    `;
  }

  if (drawer) drawer.classList.add('active');
  if (overlay) overlay.classList.add('active');
}

export function renderPortalInvoices() {
  const tbody = document.getElementById('portal-invoices-body');
  if (!tbody) return;

  if (customerInvoices.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 48px 16px; color: var(--text-muted);">
          <div style="font-size: 14px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;">No Invoices Generated Yet</div>
          <p style="font-size: 12px;">Tax invoices generated during recurring billing cycles will be listed here.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = customerInvoices.map(inv => `
    <tr>
      <td>
        <span class="mono-text" style="font-weight: 600; color: var(--primary);">${inv.number}</span>
      </td>
      <td>${inv.issueDate}</td>
      <td>${inv.dueDate}</td>
      <td class="mono-text">&#8377; ${(inv.subtotal || 0).toLocaleString('en-IN')}</td>
      <td class="mono-text" style="font-size: 11px; color: var(--text-muted);">
        CGST: &#8377;${inv.cgst || 0} | SGST: &#8377;${inv.sgst || 0}
      </td>
      <td class="mono-text" style="font-weight: 700;">&#8377; ${(inv.total || 0).toLocaleString('en-IN')}</td>
      <td><span class="badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-warning'}">${inv.status}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" data-modal="invoice-preview-modal" title="View Printable Invoice">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          PDF
        </button>
      </td>
    </tr>
  `).join('');
}

export function renderPortalRequests() {
  const container = document.getElementById('portal-requests-list');
  if (!container) return;

  if (customerServiceRequests.length === 0) {
    container.innerHTML = `
      <div class="placeholder-box" style="padding: 36px 20px;">
        <div style="font-size: 14px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;">No Recent Requests</div>
        <p style="font-size: 12px; color: var(--text-muted);">Renewal, pause, or cancellation requests submitted through the portal will be tracked here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = customerServiceRequests.map(req => `
    <div style="background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 18px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
      <div>
        <div style="font-weight: 600; font-size: 13px;">${req.type} &bull; <span class="mono-text" style="color: var(--text-muted);">${req.subscriptionId}</span></div>
        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">${req.details}</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Submitted: ${req.submittedAt}</div>
      </div>
      <span class="badge badge-info">${req.status}</span>
    </div>
  `).join('');
}

export function initPortal() {
  customerSubscriptions = loadFromStorage(SUBS_KEY);
  customerInvoices = loadFromStorage(INVS_KEY);
  customerServiceRequests = loadFromStorage(REQS_KEY);

  // 1. Initial Renders
  renderPortalProfileBanner();
  renderPortalSubscriptions();
  renderPortalInvoices();
  renderPortalRequests();

  // 2. React to user identity switch
  window.addEventListener('subscriptiq:user-changed', () => {
    renderPortalProfileBanner();
  });

  // 3. Tab switching inside customer portal
  const tabBtns = document.querySelectorAll('.portal-tab-btn');
  const tabPanes = document.querySelectorAll('.portal-tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-portal-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(`portal-pane-${targetTab}`);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // 4. Modal Confirmations: Early Renewal
  const renewForm = document.getElementById('portal-renew-form');
  if (renewForm) {
    renewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!selectedSubscriptionForAction) return;

      const now = new Date();
      now.setDate(now.getDate() + 30);
      const newDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      selectedSubscriptionForAction.nextRenewal = newDate;

      customerServiceRequests.unshift({
        id: `REQ-${Date.now().toString().slice(-3)}`,
        type: 'Early Renewal Processed',
        subscriptionId: selectedSubscriptionForAction.id,
        submittedAt: 'Just now',
        status: 'Confirmed',
        details: `Subscribed for next cycle until ${newDate}. Invoiced via idempotency token.`
      });

      saveToStorage(SUBS_KEY, customerSubscriptions);
      saveToStorage(REQS_KEY, customerServiceRequests);

      renderPortalSubscriptions();
      renderPortalRequests();

      const modal = document.getElementById('portal-renew-modal');
      if (modal) modal.classList.remove('active');

      showToast('Early Renewal Confirmed', `${selectedSubscriptionForAction.planName} has been extended until ${newDate}.`, 'success');
    });
  }

  // 5. Modal Confirmations: Pause Request
  const pauseForm = document.getElementById('portal-pause-form');
  if (pauseForm) {
    pauseForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!selectedSubscriptionForAction) return;

      const duration = document.getElementById('pause-duration-select')?.value || '30 days';
      const reason = document.getElementById('pause-reason-input')?.value || 'Customer operational pause';

      selectedSubscriptionForAction.status = `Paused (${duration})`;

      customerServiceRequests.unshift({
        id: `REQ-${Date.now().toString().slice(-3)}`,
        type: 'Subscription Pause Request',
        subscriptionId: selectedSubscriptionForAction.id,
        submittedAt: 'Just now',
        status: 'Submitted',
        details: `Requested ${duration} pause. Reason: ${reason}`
      });

      saveToStorage(SUBS_KEY, customerSubscriptions);
      saveToStorage(REQS_KEY, customerServiceRequests);

      renderPortalSubscriptions();
      renderPortalRequests();

      const modal = document.getElementById('portal-pause-modal');
      if (modal) modal.classList.remove('active');
      pauseForm.reset();

      showToast('Pause Request Submitted', `Your request to pause ${selectedSubscriptionForAction.planName} for ${duration} is received.`, 'info');
    });
  }

  // 6. Modal Confirmations: Cancellation Request
  const cancelForm = document.getElementById('portal-cancel-form');
  if (cancelForm) {
    cancelForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!selectedSubscriptionForAction) return;

      const reason = document.querySelector('input[name="cancel_reason"]:checked')?.value || 'Other';

      selectedSubscriptionForAction.status = 'Cancellation Pending';
      selectedSubscriptionForAction.autoRenew = false;

      customerServiceRequests.unshift({
        id: `REQ-${Date.now().toString().slice(-3)}`,
        type: 'Cancellation Notice',
        subscriptionId: selectedSubscriptionForAction.id,
        submittedAt: 'Just now',
        status: 'Pending End-of-Cycle',
        details: `Auto-renew cancelled for end of period (${selectedSubscriptionForAction.nextRenewal || 'current cycle'}). Reason: ${reason}`
      });

      saveToStorage(SUBS_KEY, customerSubscriptions);
      saveToStorage(REQS_KEY, customerServiceRequests);

      renderPortalSubscriptions();
      renderPortalRequests();

      const modal = document.getElementById('portal-cancel-modal');
      if (modal) modal.classList.remove('active');

      showToast('Cancellation Scheduled', `${selectedSubscriptionForAction.planName} will expire at end of current cycle.`, 'warning');
    });
  }
}
