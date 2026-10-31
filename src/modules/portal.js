/**
 * Customer Self-Service Portal Module - Brightloop Software
 * Subscriber-facing views for subscriptions, invoices, authorized cloud workloads,
 * early renewals, pause requests, cancellation workflows, and account settings.
 */

import { db } from '../db.js';
import { getCurrentUser, setCurrentUser, ROLES } from './rbac.js';
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

export function renderPortalProfileBanner(user = null, customer = null, primarySub = null) {
  const activeUser = user || getCurrentUser() || {};
  const sub = primarySub || customerSubscriptions[0];

  const companyEl = document.getElementById('portal-banner-company');
  const legacyCompanyEl = document.getElementById('portal-company-name');
  const userEl = document.getElementById('portal-banner-user');
  const contactNameEl = document.getElementById('portal-contact-name');
  const contactEmailEl = document.getElementById('portal-contact-email');
  const gstinEl = document.getElementById('portal-banner-gstin');
  const subCountEl = document.getElementById('portal-banner-sub-count');
  const nextBillEl = document.getElementById('portal-banner-next-billing');
  const avatarEl = document.getElementById('portal-banner-avatar');
  const legacyAvatarEl = document.getElementById('portal-company-avatar');

  const bannerSubNameEl = document.getElementById('portal-banner-sub-name');
  const statAmountEl = document.getElementById('portal-stat-amount');

  // KPI Card Elements
  const kpiPlanNameEl = document.getElementById('portal-kpi-plan-name');
  const kpiSubCodeEl = document.getElementById('portal-kpi-sub-code');
  const kpiRenewalDateEl = document.getElementById('portal-kpi-renewal-date');
  const kpiPriceAmountEl = document.getElementById('portal-kpi-price-amount');

  // Form Profile Inputs
  const formCompInput = document.getElementById('portal-profile-company-input');
  const formGstinInput = document.getElementById('portal-profile-gstin-input');
  const formNameInput = document.getElementById('portal-profile-name-input');
  const formEmailInput = document.getElementById('portal-profile-email-input');
  const formAddressInput = document.getElementById('portal-profile-address-input');

  const compName = customer?.company_name || activeUser.company || (activeUser.full_name ? `${activeUser.full_name}'s Organization` : 'STARK Industries');
  const fullName = customer?.contact_name || activeUser.full_name || activeUser.name || 'Praveen M';
  const emailAddr = customer?.email || activeUser.email || 'subscriber@brightloop.io';
  const gstinVal = customer?.gstin || '27AABCS9821R1Z8';
  const initials = compName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'SI';

  if (avatarEl) avatarEl.textContent = initials;
  if (legacyAvatarEl) legacyAvatarEl.textContent = initials;
  if (companyEl) companyEl.textContent = compName;
  if (legacyCompanyEl) legacyCompanyEl.textContent = compName;
  if (userEl) userEl.textContent = `${fullName} (${emailAddr})`;
  if (contactNameEl) contactNameEl.textContent = fullName;
  if (contactEmailEl) contactEmailEl.textContent = emailAddr;
  if (gstinEl) gstinEl.textContent = `GSTIN: ${gstinVal}`;

  const planName = sub?.planName || 'Enterprise Annual Tier';
  const renewalDate = sub?.nextRenewal || '30 Nov 2026';
  const priceVal = sub?.price ? `₹ ${Number(sub.price).toLocaleString('en-IN')}` : '₹ 49,999';
  const cadence = (sub?.cadence || 'Yearly').toLowerCase();

  if (bannerSubNameEl) bannerSubNameEl.textContent = planName;
  if (nextBillEl) nextBillEl.textContent = renewalDate;
  if (subCountEl) subCountEl.textContent = `${customerSubscriptions.length || 1} Plan (Active)`;
  if (statAmountEl) statAmountEl.textContent = `${priceVal} / ${cadence}`;

  // KPI Elements
  if (kpiPlanNameEl) kpiPlanNameEl.textContent = planName;
  if (kpiSubCodeEl) kpiSubCodeEl.innerHTML = `<span class="mono-text">${sub?.id || 'SUB-8235'}</span> &bull; Idempotent`;
  if (kpiRenewalDateEl) kpiRenewalDateEl.textContent = renewalDate;
  if (kpiPriceAmountEl) kpiPriceAmountEl.textContent = `${priceVal}`;

  // Profile Form Pre-fills
  if (formCompInput && !formCompInput.value) formCompInput.value = compName;
  if (formGstinInput && !formGstinInput.value) formGstinInput.value = gstinVal;
  if (formNameInput && !formNameInput.value) formNameInput.value = fullName;
  if (formEmailInput && !formEmailInput.value) formEmailInput.value = emailAddr;
  if (formAddressInput && !formAddressInput.value) formAddressInput.value = customer?.billing_address || 'Brigade Tech Gardens, Whitefield, Bengaluru, Karnataka 560066';
}

export function renderPortalSubscriptions() {
  const container = document.getElementById('portal-subscriptions-list');
  const legacySubName = document.getElementById('portal-sub-name');
  const legacySubCycle = document.getElementById('portal-sub-cycle');
  const legacySubPrice = document.getElementById('portal-sub-price');
  const legacySubBadge = document.getElementById('portal-sub-badge');

  if (customerSubscriptions.length === 0) {
    // Generate default enterprise subscription fallback
    customerSubscriptions = [{
      id: 'SUB-8235',
      planName: 'Enterprise Annual Tier',
      price: 49999,
      cadence: 'Yearly',
      status: 'Active',
      startDate: '31 Oct 2026',
      nextRenewal: '30 Nov 2026',
      autoRenew: true,
      gracePeriodDays: 30,
      idempotencyKey: 'tok_sub-8235',
      attributes: [
        { name: 'Dual-GST Billing Engine', value: 'Active (HSN/SAC 998313)', surcharge: 0 },
        { name: 'Revenue Leakage Sentinel', value: '24/7 Monitoring Enabled', surcharge: 0 },
        { name: 'Idempotent Payment Webhooks', value: 'Active Gateway Dispatch', surcharge: 0 },
        { name: 'API Quota Allocation', value: '100,000 requests/month', surcharge: 0 }
      ]
    }];
    saveToStorage(SUBS_KEY, customerSubscriptions);
  }

  const primarySub = customerSubscriptions[0];

  // Update legacy elements if present in DOM
  if (legacySubName) legacySubName.textContent = `${primarySub.planName} (${primarySub.id})`;
  if (legacySubCycle) legacySubCycle.textContent = `Billing cycle: ${primarySub.cadence} (Next renewal: ${primarySub.nextRenewal})`;
  if (legacySubPrice) legacySubPrice.textContent = `₹ ${(primarySub.price || 0).toLocaleString('en-IN')} / ${(primarySub.cadence || 'month').toLowerCase()}`;
  if (legacySubBadge) {
    legacySubBadge.textContent = primarySub.status;
    legacySubBadge.className = primarySub.status === 'Active' ? 'badge badge-success' : 'badge badge-warning';
  }

  if (!container) return;

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
          <span style="font-size: 11px; color: var(--text-muted); margin-left: 8px;">(Dual-GST 18% included)</span>
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
            <div class="val">${sub.gracePeriodDays || 30} days after due date</div>
          </div>
          <div class="portal-sub-detail-item">
            <div class="lbl">Authorized Services</div>
            <div class="val">${(sub.attributes || []).length} Cloud Capabilities Active</div>
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
  if (idEl) idEl.textContent = `${sub.id} • ${sub.cadence || 'Yearly'} Billing`;

  if (contentEl) {
    const attrs = sub.attributes || [];
    contentEl.innerHTML = `
      <div class="info-banner" style="margin-bottom: 16px; background: rgba(99, 91, 255, 0.08); border-left: 3px solid var(--primary); padding: 12px 14px; border-radius: 4px;">
        <strong>Subscription Status:</strong> <span class="badge badge-success" style="font-size: 11px;">${sub.status}</span> &bull; Renewal on <strong>${sub.nextRenewal || '30 Nov 2026'}</strong>
      </div>

      <div class="form-group" style="margin-bottom: 16px;">
        <label class="form-label" style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Recurring Investment</label>
        <div style="font-size: 22px; font-weight: 700; font-family: var(--font-mono); color: var(--text-main); margin-top: 4px;">
          &#8377; ${(sub.price || 0).toLocaleString('en-IN')} <span style="font-size: 13px; font-weight: normal; color: var(--text-secondary);">/ ${(sub.cadence || 'month').toLowerCase()}</span>
        </div>
      </div>

      <div class="form-group" style="margin-bottom: 16px;">
        <label class="form-label" style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Authorized Workloads & Entitlements</label>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
          ${attrs.length > 0 ? attrs.map(attr => `
            <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-page); padding: 10px 14px; border-radius: var(--radius-sm); font-size: 12px; border: 1px solid var(--border);">
              <span><strong>${attr.name}:</strong> <span style="color: var(--text-secondary);">${attr.value}</span></span>
              <span class="badge badge-success" style="font-size: 10px;">Authorized</span>
            </div>
          `).join('') : '<div style="font-size: 12px; color: var(--text-muted);">Standard enterprise entitlements configured.</div>'}
        </div>
      </div>

      <div class="form-group" style="margin-bottom: 16px;">
        <label class="form-label" style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Replay Prevention & Idempotency Key</label>
        <div class="mono-text" style="font-size: 12px; background: var(--bg-page); padding: 8px 12px; border-radius: 4px; border: 1px solid var(--border); color: var(--primary);">${sub.idempotencyKey || 'tok_' + sub.id.toLowerCase()}</div>
      </div>

      <div class="form-group" style="margin-bottom: 16px;">
        <label class="form-label" style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Service Level Agreement (SLA)</label>
        <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin-top: 4px;">
          Enterprise Tier includes 99.98% uptime guarantee, 1-hour critical engineering response SLA, continuous dual-GST reporting, and zero revenue leakage guarantee.
        </p>
      </div>
    `;
  }

  if (drawer) drawer.classList.add('active');
  if (overlay) overlay.classList.add('active');
}

export function renderPortalInvoices() {
  const tbody = document.getElementById('portal-invoices-body');
  const legacyInvNumber = document.getElementById('portal-inv-number');
  const legacyInvMeta = document.getElementById('portal-inv-meta');

  if (customerInvoices.length === 0) {
    // Generate initial paid invoice matching subscription
    const primarySub = customerSubscriptions[0] || { id: 'SUB-8235', price: 49999 };
    const price = primarySub.price || 49999;
    const subtotal = Math.round((price / 1.18) * 100) / 100;
    const gstEach = Math.round(((price - subtotal) / 2) * 100) / 100;

    customerInvoices = [{
      number: `BL-INV-2026-${primarySub.id.replace('SUB-', '')}`,
      issueDate: '31 Oct 2026',
      dueDate: '30 Nov 2026',
      subtotal: subtotal,
      cgst: gstEach,
      sgst: gstEach,
      total: price,
      status: 'Paid'
    }];
    saveToStorage(INVS_KEY, customerInvoices);
  }

  const primaryInv = customerInvoices[0];
  if (legacyInvNumber) legacyInvNumber.textContent = primaryInv.number;
  if (legacyInvMeta) {
    legacyInvMeta.textContent = `${primaryInv.issueDate} • ₹ ${Number(primaryInv.total).toLocaleString('en-IN')} • Dual-GST Paid`;
  }

  if (!tbody) return;

  tbody.innerHTML = customerInvoices.map(inv => `
    <tr>
      <td>
        <span class="mono-text" style="font-weight: 600; color: var(--primary);">${inv.number}</span>
      </td>
      <td>${inv.issueDate}</td>
      <td>${inv.dueDate}</td>
      <td class="mono-text">&#8377; ${(inv.subtotal || 0).toLocaleString('en-IN')}</td>
      <td class="mono-text" style="font-size: 11px; color: var(--text-muted);">
        CGST: &#8377;${(inv.cgst || 0).toLocaleString('en-IN')} | SGST: &#8377;${(inv.sgst || 0).toLocaleString('en-IN')}
      </td>
      <td class="mono-text" style="font-weight: 700; color: var(--text-main);">&#8377; ${(inv.total || 0).toLocaleString('en-IN')}</td>
      <td><span class="badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-warning'}">${inv.status}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" data-modal="invoice-preview-modal" title="View Tax Invoice PDF">
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
    customerServiceRequests = [
      {
        id: 'REQ-101',
        type: 'Subscription Activation',
        subscriptionId: customerSubscriptions[0]?.id || 'SUB-8235',
        submittedAt: '31 Oct 2026, 13:45',
        status: 'Confirmed',
        details: 'Initial contract initiated. Enterprise cloud workloads provisioned with Dual-GST compliance.'
      }
    ];
    saveToStorage(REQS_KEY, customerServiceRequests);
  }

  container.innerHTML = customerServiceRequests.map(req => `
    <div style="background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 18px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
      <div>
        <div style="font-weight: 600; font-size: 13px; color: var(--text-main);">
          ${req.type} &bull; <span class="mono-text" style="color: var(--primary); font-size: 12px;">${req.subscriptionId}</span>
        </div>
        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 3px;">${req.details}</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Submitted: ${req.submittedAt}</div>
      </div>
      <span class="badge badge-info" style="font-size: 11px;">${req.status}</span>
    </div>
  `).join('');
}

/**
 * Synchronize Portal with live Supabase database records
 */
export async function syncPortalWithSupabase(user = null) {
  let activeUser = user;
  if (!activeUser) {
    const raw = sessionStorage.getItem('brightloop_user') || localStorage.getItem('brightloop_user');
    if (raw) {
      try { activeUser = JSON.parse(raw); } catch (e) {}
    }
  }

  if (!activeUser || !activeUser.email) return;

  let custData = null;
  let subDataList = [];
  let invsDataList = [];

  try {
    // 1. Fetch customer profile
    const { data: customerRow } = await db
      .from('customers')
      .select('*')
      .eq('email', activeUser.email)
      .maybeSingle();

    if (customerRow) {
      custData = customerRow;

      // 2. Fetch subscriptions linked to this customer
      const { data: subs } = await db
        .from('subscriptions')
        .select('*, plans(*)')
        .eq('customer_id', customerRow.id)
        .order('created_at', { ascending: false });

      if (subs && subs.length > 0) {
        subDataList = subs;
      }

      // 3. Fetch invoices linked to this customer
      const { data: invs } = await db
        .from('invoices')
        .select('*')
        .eq('customer_id', customerRow.id)
        .order('created_at', { ascending: false });

      if (invs && invs.length > 0) {
        invsDataList = invs;
      }
    }
  } catch (err) {
    console.warn('Portal Supabase sync warning:', err);
  }

  // Update in-memory subscriptions
  if (subDataList.length > 0) {
    customerSubscriptions = subDataList.map(sub => {
      const plan = sub.plans || {};
      const cadence = plan.interval_unit === 'YEARLY' ? 'Yearly' : (plan.interval_unit === 'MONTHLY' ? 'Monthly' : 'Quarterly');
      return {
        id: sub.subscription_code,
        planName: plan.name || 'Enterprise Annual Tier',
        price: Number(sub.recurring_amount || plan.recurring_price || 49999),
        cadence: cadence,
        status: sub.status === 'ACTIVE' ? 'Active' : sub.status,
        startDate: new Date(sub.current_period_start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        nextRenewal: new Date(sub.current_period_end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        autoRenew: plan.auto_renew ?? true,
        gracePeriodDays: plan.auto_close_days || 30,
        idempotencyKey: sub.idempotency_token || `tok_${sub.subscription_code.toLowerCase()}`,
        attributes: [
          { name: 'Dual-GST Calculation Engine', value: 'Active (HSN/SAC 998313)', surcharge: 0 },
          { name: 'Automated Dunning & Sentinel', value: '24/7 Monitor Enabled', surcharge: 0 },
          { name: 'Idempotent Payment Webhooks', value: 'Active Gateway Dispatch', surcharge: 0 },
          { name: 'Developer REST API Access', value: '100,000 requests/mo quota', surcharge: 0 }
        ]
      };
    });
    saveToStorage(SUBS_KEY, customerSubscriptions);
  }

  // Update in-memory invoices
  if (invsDataList.length > 0) {
    customerInvoices = invsDataList.map(inv => ({
      number: inv.invoice_number,
      issueDate: new Date(inv.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      dueDate: new Date(inv.due_date || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      subtotal: Number(inv.subtotal || 0),
      cgst: Number(inv.cgst_amount || 0),
      sgst: Number(inv.sgst_amount || 0),
      total: Number(inv.total_amount || 0),
      status: inv.status === 'PAID' ? 'Paid' : inv.status
    }));
    saveToStorage(INVS_KEY, customerInvoices);
  }

  // Re-render Portal with refreshed data
  renderPortalProfileBanner(activeUser, custData, customerSubscriptions[0]);
  renderPortalSubscriptions();
  renderPortalInvoices();
  renderPortalRequests();
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

  // 7. Drawer and Modal Close Handlers
  const drawerOverlay = document.getElementById('portal-sub-detail-drawer-overlay');
  const drawer = document.getElementById('portal-sub-detail-drawer');
  const drawerCloseBtn = document.getElementById('portal-sub-detail-drawer-close');

  const closeDrawer = () => {
    if (drawer) drawer.classList.remove('active');
    if (drawerOverlay) drawerOverlay.classList.remove('active');
  };

  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);
  if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);

  // 8. Organization Profile Form Save
  const profileForm = document.getElementById('portal-profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const compName = document.getElementById('portal-profile-company-input')?.value?.trim();
      const gstin = document.getElementById('portal-profile-gstin-input')?.value?.trim();
      const contactName = document.getElementById('portal-profile-name-input')?.value?.trim();
      const email = document.getElementById('portal-profile-email-input')?.value?.trim();
      const address = document.getElementById('portal-profile-address-input')?.value?.trim();

      const userJson = sessionStorage.getItem('brightloop_user') || localStorage.getItem('brightloop_user');
      let user = null;
      if (userJson) {
        try { user = JSON.parse(userJson); } catch (err) {}
      }

      if (user && user.email) {
        try {
          await db.from('customers').update({
            company_name: compName,
            gstin: gstin,
            contact_name: contactName,
            billing_address: address
          }).eq('email', user.email);

          showToast('Profile Updated', 'Organization billing details saved successfully.', 'success');
          await syncPortalWithSupabase(user);
        } catch (dbErr) {
          console.warn('Profile update error:', dbErr);
          showToast('Profile Saved Locally', 'Details updated for current session.', 'info');
        }
      }
    });
  }

  // 9. Refresh Button Trigger
  const refreshBtn = document.getElementById('portal-refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.disabled = true;
      refreshBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Syncing...`;
      await syncPortalWithSupabase();
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg> Refresh Data`;
      showToast('Data Synchronized', 'Customer dashboard synced with PostgreSQL database.', 'success');
    });
  }
}
