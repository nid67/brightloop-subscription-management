import { createIcons, icons } from 'lucide';
import Chart from 'chart.js/auto';
import { db } from './db.js';
import { dataService } from './modules/customer-product-plan/data-service.js';
import { quoteSubService } from './modules/quotations-subscriptions/data-service.js';
import { invoiceService } from './modules/billing-invoices-tax/invoice-service.js';
import './modules/customer-product-plan/styles.css';
import { initCustomerProductPlanModule } from './modules/customer-product-plan/index.js';
import './modules/quotations-subscriptions/quotations-subscriptions.css';
import { initQuoteSubscriptionModule } from './modules/quotations-subscriptions/index.js';
import './modules/billing-invoices-tax/module.css';
import { initBillingInvoicesTaxModule } from './modules/billing-invoices-tax/index.js';
import './modules/payments-discounts/module.css';
import { initPaymentsDiscountsModule } from './modules/payments-discounts/index.js';
import './styles/module-auth.css';
import { initPortal, syncPortalWithSupabase } from './modules/portal.js';

window.lucide = {
  createIcons: () => createIcons({ icons })
};

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Feature Modules
  initCustomerProductPlanModule();
  initQuoteSubscriptionModule();
  initBillingInvoicesTaxModule();
  initPaymentsDiscountsModule();
  initPortal();

  createIcons({ icons });

  const appLayout = document.getElementById('app');
  const authPage = document.getElementById('view-auth');
  const homePage = document.getElementById('view-home');
  const navLinks = document.querySelectorAll('.nav-link[data-view]');
  const viewSections = document.querySelectorAll('.view-section');
  const breadcrumbCurrent = document.getElementById('breadcrumb-current');
  const logoutBtn = document.getElementById('logout-btn');

  let dashboardChartInstance = null;
  let analyticsChartInstance = null;

  // SHA-256 cryptographic hashing via native Web Crypto API
  async function hashPassword(plainText) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function isUserLoggedIn() {
    return sessionStorage.getItem('brightloop_session') === 'active' || localStorage.getItem('brightloop_session') === 'active';
  }

  function getUserRole() {
    return sessionStorage.getItem('brightloop_role') || localStorage.getItem('brightloop_role') || 'ADMIN';
  }

  function applyUserSession() {
    const loggedIn = isUserLoggedIn();
    const role = getUserRole();
    const userJson = sessionStorage.getItem('brightloop_user') || localStorage.getItem('brightloop_user');
    let user = null;
    if (userJson) {
      try { user = JSON.parse(userJson); } catch (e) {}
    }

    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      if (loggedIn && role === 'CUSTOMER') {
        sidebar.classList.add('role-customer');
      } else {
        sidebar.classList.remove('role-customer');
      }
    }

    const userNameEl = document.getElementById('sidebar-user-name');
    const userRoleEl = document.getElementById('sidebar-user-role');
    const userAvatarEl = document.getElementById('sidebar-user-avatar');

    if (userNameEl && userRoleEl && userAvatarEl) {
      if (loggedIn && role === 'CUSTOMER') {
        userNameEl.textContent = user?.full_name || 'Subscriber';
        userRoleEl.textContent = 'Customer Account';
        userAvatarEl.textContent = (user?.full_name || 'C').substring(0, 2).toUpperCase();
      } else {
        userNameEl.textContent = 'Brightloop Admin';
        userRoleEl.textContent = 'Super Admin';
        userAvatarEl.textContent = 'BL';
      }
    }
  }

  function showHome() {
    if (appLayout) appLayout.style.display = 'none';
    if (authPage) authPage.classList.remove('active');
    if (homePage) homePage.classList.add('active');
    window.location.hash = '#/home';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    createIcons({ icons });
  }

  function showAuth(tab = 'login') {
    if (appLayout) appLayout.style.display = 'none';
    if (homePage) homePage.classList.remove('active');
    if (authPage) authPage.classList.add('active');
    switchAuthTab(tab);
    window.location.hash = tab === 'register' ? '#/register' : '#/login';
    window.scrollTo({ top: 0, behavior: 'instant' });
    createIcons({ icons });
  }

  function showApp(targetViewId = 'dashboard') {
    // Protected route check: cannot open dashboard without login
    if (!isUserLoggedIn()) {
      showAuth('login');
      return;
    }

    // Role-based protection: customer can NEVER access admin dashboard
    const role = getUserRole();
    if (role === 'CUSTOMER') {
      targetViewId = 'portal';
    }

    if (homePage) homePage.classList.remove('active');
    if (authPage) authPage.classList.remove('active');
    if (appLayout) appLayout.style.display = 'flex';

    applyUserSession();
    switchWorkspaceView(targetViewId);
    window.location.hash = `#/${targetViewId}`;
    createIcons({ icons });
  }

  function switchWorkspaceView(targetViewId) {
    if (targetViewId === 'home') {
      showHome();
      return;
    }
    if (targetViewId === 'auth' || targetViewId === 'login') {
      showAuth('login');
      return;
    }
    if (targetViewId === 'register') {
      showAuth('register');
      return;
    }

    // Strict route authorization check:
    // Only Admin can view admin sections; customers are strictly locked to 'portal'
    const role = getUserRole();
    if (role === 'CUSTOMER' && targetViewId !== 'portal') {
      targetViewId = 'portal';
    }

    if (homePage) homePage.classList.remove('active');
    if (authPage) authPage.classList.remove('active');
    if (appLayout) appLayout.style.display = 'flex';

    applyUserSession();

    navLinks.forEach(link => {
      if (link.dataset.view === targetViewId) {
        link.classList.add('active');
        if (breadcrumbCurrent) {
          const spanText = link.querySelector('span')?.textContent;
          breadcrumbCurrent.textContent = spanText || (targetViewId === 'portal' ? 'Customer Dashboard' : targetViewId);
        }
      } else {
        link.classList.remove('active');
      }
    });

    viewSections.forEach(section => {
      if (section.id === `view-${targetViewId}`) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    if (targetViewId === 'portal') {
      const userJson = sessionStorage.getItem('brightloop_user') || localStorage.getItem('brightloop_user');
      if (userJson) {
        try {
          const u = JSON.parse(userJson);
          updateCustomerPortalUI(u);
        } catch (e) {}
      }
    } else {
      // Sync database records across modules when navigating
      syncAllDataFromSupabase();
    }

    createIcons({ icons });

    if (targetViewId === 'dashboard' && dashboardChartInstance) {
      dashboardChartInstance.resize();
    }
    if (targetViewId === 'analytics' && analyticsChartInstance) {
      analyticsChartInstance.resize();
    }
  }

  function logoutUser() {
    sessionStorage.removeItem('brightloop_session');
    sessionStorage.removeItem('brightloop_role');
    sessionStorage.removeItem('brightloop_user');
    localStorage.removeItem('brightloop_session');
    localStorage.removeItem('brightloop_role');
    localStorage.removeItem('brightloop_user');
    applyUserSession();
    showHome();
  }

  // Logout triggers
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logoutUser();
    });
  }

  document.querySelectorAll('[data-action="logout"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      logoutUser();
    });
  });

  // Launch Dashboard buttons: require login before opening dashboard
  document.querySelectorAll('[data-action="launch-dashboard"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (isUserLoggedIn()) {
        const role = getUserRole();
        if (role === 'CUSTOMER') {
          showApp('portal');
        } else {
          showApp('dashboard');
        }
      } else {
        showAuth('login');
      }
    });
  });

  // Get Started / Deploy buttons: direct strictly to register page
  document.querySelectorAll('[data-action="register"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showAuth('register');
    });
  });

  // Navigation handlers
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const target = el.getAttribute('data-nav');
      if (target === 'home') showHome();
      else if (target === 'auth' || target === 'login') showAuth('login');
      else if (target === 'register') showAuth('register');
      else showApp(target);
    });
  });

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.dataset.view;
      if (view === 'home') showHome();
      else if (view) switchWorkspaceView(view);
    });
  });

  // Return to homepage buttons from auth
  document.querySelectorAll('.auth-back-to-home-btn, #auth-back-to-home').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showHome();
    });
  });

  // Switch between Sign in and Register from links inside forms
  const linkToRegister = document.getElementById('link-to-register');
  if (linkToRegister) {
    linkToRegister.addEventListener('click', (e) => {
      e.preventDefault();
      showAuth('register');
    });
  }

  const linkToLogin = document.getElementById('link-to-login');
  if (linkToLogin) {
    linkToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      showAuth('login');
    });
  }

  // Real-time Password Security Criteria & Validation
  const regPasswordInput = document.getElementById('reg-password');
  const regConfirmPasswordInput = document.getElementById('reg-confirm-password');
  const regSubmitBtn = document.getElementById('reg-submit-btn');
  const critLength = document.getElementById('crit-length');
  const critUpper = document.getElementById('crit-upper');
  const critLower = document.getElementById('crit-lower');
  const critNumber = document.getElementById('crit-number');
  const critSpecial = document.getElementById('crit-special');
  const critMatch = document.getElementById('crit-match');

  function updateCriterion(el, isValid) {
    if (!el) return;
    if (isValid) {
      el.classList.add('valid');
      el.classList.remove('invalid');
    } else {
      el.classList.add('invalid');
      el.classList.remove('valid');
    }
  }

  function checkPasswordCriteria() {
    const pwd = regPasswordInput?.value || '';
    const confirmPwd = regConfirmPasswordInput?.value || '';

    const isLengthValid = pwd.length >= 8;
    const isUpperValid = /[A-Z]/.test(pwd);
    const isLowerValid = /[a-z]/.test(pwd);
    const isNumberValid = /[0-9]/.test(pwd);
    const isSpecialValid = /[^A-Za-z0-9]/.test(pwd);
    const isMatchValid = confirmPwd.length > 0 && confirmPwd === pwd;

    updateCriterion(critLength, isLengthValid);
    updateCriterion(critUpper, isUpperValid);
    updateCriterion(critLower, isLowerValid);
    updateCriterion(critNumber, isNumberValid);
    updateCriterion(critSpecial, isSpecialValid);
    updateCriterion(critMatch, isMatchValid);

    const allValid = isLengthValid && isUpperValid && isLowerValid && isNumberValid && isSpecialValid && isMatchValid;

    if (regSubmitBtn) {
      regSubmitBtn.disabled = !allValid;
    }

    return allValid;
  }

  if (regPasswordInput) {
    regPasswordInput.addEventListener('input', checkPasswordCriteria);
  }
  if (regConfirmPasswordInput) {
    regConfirmPasswordInput.addEventListener('input', checkPasswordCriteria);
  }

  function showLoginAlert(msg, type = 'error') {
    const alertEl = document.getElementById('login-alert');
    if (!alertEl) return;
    alertEl.textContent = msg;
    alertEl.className = `auth-alert auth-alert-${type}`;
    alertEl.style.display = 'block';
  }

  function showRegAlert(msg, type = 'error') {
    const alertEl = document.getElementById('reg-alert');
    if (!alertEl) return;
    alertEl.textContent = msg;
    alertEl.className = `auth-alert auth-alert-${type}`;
    alertEl.style.display = 'block';
  }

  function clearAlerts() {
    const lAlert = document.getElementById('login-alert');
    if (lAlert) { lAlert.style.display = 'none'; lAlert.textContent = ''; }
    const rAlert = document.getElementById('reg-alert');
    if (rAlert) { rAlert.style.display = 'none'; rAlert.textContent = ''; }
  }

  // Update Customer Portal UI with registered customer details
  async function updateCustomerPortalUI(user) {
    if (!user) return;
    const companyEl = document.getElementById('portal-company-name');
    const contactNameEl = document.getElementById('portal-contact-name');
    const contactEmailEl = document.getElementById('portal-contact-email');
    const subNameEl = document.getElementById('portal-sub-name');
    const subCycleEl = document.getElementById('portal-sub-cycle');
    const subPriceEl = document.getElementById('portal-sub-price');
    const subBadgeEl = document.getElementById('portal-sub-badge');
    const invNumberEl = document.getElementById('portal-inv-number');
    const invMetaEl = document.getElementById('portal-inv-meta');

    if (contactNameEl) contactNameEl.textContent = user.full_name || 'Subscriber';
    if (contactEmailEl) contactEmailEl.textContent = user.email || '';

    let customerInfo = null;
    let subscriptionInfo = null;
    let planInfo = null;

    try {
      // 1. Fetch customer profile
      const { data: custData } = await db.from('customers').select('*').eq('email', user.email).maybeSingle();
      if (custData) customerInfo = custData;

      // 2. Fetch customer's active subscription and linked plan
      if (customerInfo?.id) {
        const { data: subData } = await db
          .from('subscriptions')
          .select('*, plans(*)')
          .eq('customer_id', customerInfo.id)
          .maybeSingle();

        if (subData) {
          subscriptionInfo = subData;
          planInfo = subData.plans;
        }
      }
    } catch (e) {
      console.warn('Could not fetch customer subscription details from DB:', e);
    }

    if (!customerInfo) {
      customerInfo = dataService.getCustomers().find(c => c.email?.toLowerCase() === user.email?.toLowerCase());
    }

    if (companyEl) {
      companyEl.textContent = customerInfo?.company_name || customerInfo?.company || (user.full_name ? `${user.full_name}'s Organization` : 'My Organization');
    }

    // Display their respective subscription details
    if (subscriptionInfo && planInfo) {
      const renewalDate = new Date(subscriptionInfo.current_period_end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const formattedPrice = Number(subscriptionInfo.recurring_amount || planInfo.recurring_price).toLocaleString('en-IN');
      const interval = planInfo.interval_unit === 'YEARLY' ? 'year' : 'month';

      if (subNameEl) subNameEl.textContent = `${planInfo.name} (${subscriptionInfo.subscription_code})`;
      if (subCycleEl) subCycleEl.textContent = `Billing cycle: ${planInfo.interval_unit} (Next renewal: ${renewalDate})`;
      if (subPriceEl) subPriceEl.textContent = `₹ ${formattedPrice} / ${interval}`;
      if (subBadgeEl) {
        subBadgeEl.textContent = subscriptionInfo.status || 'Active';
        subBadgeEl.className = subscriptionInfo.status === 'ACTIVE' ? 'badge badge-success' : 'badge badge-neutral';
      }
    } else {
      // Default standard subscription presentation
      if (subNameEl) subNameEl.textContent = 'Standard Monthly Tier';
      if (subCycleEl) subCycleEl.textContent = 'Billing cycle: Monthly (Auto-renews on 15th)';
      if (subPriceEl) subPriceEl.textContent = '₹ 4,999 / month';
      if (subBadgeEl) {
        subBadgeEl.textContent = 'Active';
        subBadgeEl.className = 'badge badge-success';
      }
    }

    if (invNumberEl) {
      invNumberEl.textContent = `BL-INV-2026-${String(Math.floor(Math.random() * 800) + 100)}`;
    }
    if (invMetaEl) {
      const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const priceText = subscriptionInfo?.recurring_amount ? `₹ ${Number(subscriptionInfo.recurring_amount).toLocaleString('en-IN')}` : '₹ 4,999';
      invMetaEl.textContent = `${today} • ${priceText} • Dual-GST Paid`;
    }

    // Synchronize comprehensive Customer Portal views (KPIs, tabs, authorized services, invoices)
    try {
      await syncPortalWithSupabase(user);
    } catch (syncErr) {
      console.warn('syncPortalWithSupabase error:', syncErr);
    }
    createIcons({ icons });
  }

  // Synchronize all database tables (Customers, Plans, Subscriptions, Invoices) from Supabase into teammate modules
  async function syncAllDataFromSupabase() {
    try {
      // 1. Sync Customers from Supabase
      const { data: dbCustomers } = await db.from('customers').select('*').order('created_at', { ascending: false });
      if (dbCustomers && dbCustomers.length > 0) {
        const localCusts = dataService.getCustomers();
        for (const c of dbCustomers) {
          const idx = localCusts.findIndex(lc => lc.email?.toLowerCase() === c.email?.toLowerCase());
          const mappedCust = {
            id: c.id,
            name: c.contact_name || c.company_name,
            company: c.company_name,
            email: c.email,
            phone: c.phone || '+91 98765 43210',
            gstin: c.gstin || '27AABCS9821R1Z8',
            address: c.billing_address || 'Whitefield, Bengaluru, Karnataka',
            state: 'Karnataka',
            stateCode: '29',
            customerType: 'Enterprise',
            status: 'Active',
            createdAt: c.created_at
          };
          if (idx !== -1) {
            localCusts[idx] = { ...localCusts[idx], ...mappedCust };
          } else {
            localCusts.unshift(mappedCust);
          }
        }
        dataService.customers = localCusts;
        dataService._persist('subscriptiq_customers', localCusts);
      }

      // 2. Sync Plans from Supabase
      const { data: dbPlans } = await db.from('plans').select('*');
      if (dbPlans && dbPlans.length > 0) {
        const localPlans = dataService.getPlans();
        for (const p of dbPlans) {
          const idx = localPlans.findIndex(lp => lp.code === p.plan_code || lp.name === p.name);
          const mappedPlan = {
            id: p.id,
            name: p.name,
            code: p.plan_code,
            interval: p.interval_unit === 'YEARLY' ? 'year' : 'month',
            intervalCount: p.interval_count || 1,
            price: Number(p.recurring_price),
            autoRenew: p.auto_renew ?? true,
            allowPause: p.allow_pause ?? true,
            gracePeriod: p.auto_close_days || 30,
            status: 'Active'
          };
          if (idx !== -1) {
            localPlans[idx] = { ...localPlans[idx], ...mappedPlan };
          } else {
            localPlans.unshift(mappedPlan);
          }
        }
        dataService.plans = localPlans;
        dataService._persist('subscriptiq_plans', localPlans);
      }

      // 3. Sync Subscriptions from Supabase
      const { data: dbSubs } = await db.from('subscriptions').select('*, plans(*), customers(*)').order('created_at', { ascending: false });
      if (dbSubs && dbSubs.length > 0) {
        const localSubs = quoteSubService.getSubscriptions();
        for (const s of dbSubs) {
          const subNum = s.subscription_code;
          const idx = localSubs.findIndex(ls => ls.subscriptionNumber === subNum || ls.id === subNum);
          const plan = s.plans || {};
          const cust = s.customers || {};
          const mappedSub = {
            id: subNum,
            subscriptionNumber: subNum,
            customerId: cust.id || s.customer_id,
            customerName: cust.contact_name || cust.company_name || 'Subscriber',
            customerEmail: cust.email || '',
            customerCompany: cust.company_name || 'STARK Industries',
            planId: plan.id || s.plan_id,
            planName: plan.name || 'Enterprise Annual Tier',
            billingFrequency: plan.interval_unit === 'YEARLY' ? 'Yearly' : 'Monthly',
            recurringAmount: Number(s.recurring_amount || plan.recurring_price || 49999),
            status: s.status === 'ACTIVE' ? 'Active' : s.status,
            startDate: s.current_period_start,
            currentPeriodStart: s.current_period_start,
            currentPeriodEnd: s.current_period_end,
            nextBillingDate: s.current_period_end,
            autoRenew: plan.auto_renew ?? true,
            lines: [
              {
                description: `${plan.name || 'Enterprise Tier'} Subscription`,
                quantity: 1,
                unitPrice: Number(s.recurring_amount || plan.recurring_price || 49999),
                amount: Number(s.recurring_amount || plan.recurring_price || 49999)
              }
            ]
          };
          if (idx !== -1) {
            localSubs[idx] = { ...localSubs[idx], ...mappedSub };
          } else {
            localSubs.unshift(mappedSub);
          }
        }
        quoteSubService.subscriptions = localSubs;
        quoteSubService._persist(quoteSubService.STORAGE_KEYS.SUBSCRIPTIONS, localSubs);
      }

      // 4. Sync Invoices from Supabase
      const { data: dbInvoices } = await db.from('invoices').select('*, customers(*), subscriptions(*)').order('created_at', { ascending: false });
      if (dbInvoices && dbInvoices.length > 0) {
        const mappedInvoices = dbInvoices.map(inv => {
          const cust = inv.customers || {};
          const sub = inv.subscriptions || {};
          return {
            id: inv.invoice_number,
            invoiceNumber: inv.invoice_number,
            subscriptionId: sub.subscription_code || 'SUB-8235',
            customerId: cust.id || inv.customer_id,
            customerName: cust.contact_name || cust.company_name || 'STARK Industries',
            customerEmail: cust.email || '',
            customerGstin: cust.gstin || '27AABCS9821R1Z8',
            customerAddress: cust.billing_address || 'Whitefield, Bengaluru, Karnataka',
            placeOfSupply: 'Karnataka (29)',
            billingPeriod: `${inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-GB') : '31 Oct 2026'} - ${inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-GB') : '30 Nov 2026'}`,
            invoiceDate: inv.created_at ? new Date(inv.created_at).toISOString().split('T')[0] : '2026-10-31',
            dueDate: inv.due_date || '2026-11-30',
            frequency: 'Annual',
            status: inv.status === 'PAID' ? 'Paid' : (inv.status === 'UNPAID' ? 'Confirmed' : inv.status),
            subtotal: Number(inv.subtotal),
            discountAmount: 0.0,
            discountCode: null,
            taxType: 'Intra-State GST (CGST 9% + SGST 9%)',
            cgstRate: Number(inv.cgst_rate || 9.0),
            cgstAmount: Number(inv.cgst_amount || 0),
            sgstRate: Number(inv.sgst_rate || 9.0),
            sgstAmount: Number(inv.sgst_amount || 0),
            igstRate: Number(inv.igst_rate || 0),
            igstAmount: Number(inv.igst_amount || 0),
            totalTax: Number(inv.cgst_amount || 0) + Number(inv.sgst_amount || 0),
            grandTotal: Number(inv.total_amount),
            paidAmount: inv.status === 'PAID' ? Number(inv.total_amount) : 0,
            outstandingBalance: inv.status === 'PAID' ? 0 : Number(inv.total_amount),
            paymentStatus: inv.status === 'PAID' ? 'Paid' : 'Unpaid',
            sentAt: new Date().toLocaleString(),
            confirmedAt: new Date().toLocaleString(),
            idempotencyKey: inv.idempotency_key || `tok_inv_${inv.invoice_number.toLowerCase()}`,
            lines: [
              {
                description: 'Brightloop Software Enterprise Annual Subscription',
                hsnSac: '998313',
                quantity: 1,
                unitPrice: Number(inv.subtotal),
                amount: Number(inv.subtotal)
              }
            ],
            payments: inv.status === 'PAID' ? [
              {
                date: new Date().toISOString().split('T')[0],
                amount: Number(inv.total_amount),
                method: 'Auto-Debit / Corporate Card',
                reference: 'TXN-' + inv.invoice_number.replace('BL-INV-', '')
              }
            ] : []
          };
        });

        invoiceService.invoices = mappedInvoices;
        invoiceService.notify('INVOICES_SYNCED', mappedInvoices);
      }
    } catch (err) {
      console.warn('Global database sync warning:', err);
    }
  }

  // Initial sync of all data
  syncAllDataFromSupabase();

  // Authentication form submissions
  const loginForm = document.getElementById('auth-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAlerts();

      const loginEmailInput = document.getElementById('login-email-input');
      const loginPasswordInput = document.getElementById('login-password-input');
      const loginSubmitBtn = document.getElementById('login-submit-btn');

      const email = loginEmailInput?.value?.trim()?.toLowerCase();
      const password = loginPasswordInput?.value;

      if (!email || !password) {
        showLoginAlert('Please enter both email and password.', 'error');
        return;
      }

      if (loginSubmitBtn) {
        loginSubmitBtn.disabled = true;
        loginSubmitBtn.innerHTML = 'Signing in...';
      }

      try {
        const inputHash = await hashPassword(password);
        let authenticatedUser = null;

        // Query Supabase users table
        const { data: dbUser, error: queryErr } = await db
          .from('users')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (dbUser && dbUser.password_hash === inputHash) {
          authenticatedUser = dbUser;
        } else if (email === 'admin@brightloop.io' && password === 'Brightloop@2026') {
          // Hardcoded Super Admin fallback / credentials
          authenticatedUser = {
            email: 'admin@brightloop.io',
            role: 'ADMIN',
            full_name: 'Brightloop Super Admin'
          };
        }

        if (!authenticatedUser) {
          showLoginAlert('Invalid email or password. Please verify your credentials.', 'error');
          if (loginSubmitBtn) {
            loginSubmitBtn.disabled = false;
            loginSubmitBtn.textContent = 'Sign In';
          }
          return;
        }

        // Store session and role
        sessionStorage.setItem('brightloop_session', 'active');
        sessionStorage.setItem('brightloop_role', authenticatedUser.role);
        sessionStorage.setItem('brightloop_user', JSON.stringify(authenticatedUser));
        localStorage.setItem('brightloop_session', 'active');
        localStorage.setItem('brightloop_role', authenticatedUser.role);
        localStorage.setItem('brightloop_user', JSON.stringify(authenticatedUser));

        applyUserSession();

        if (authenticatedUser.role === 'ADMIN') {
          showApp('dashboard');
        } else {
          // CUSTOMER: Strictly redirect to Customer Dashboard
          try {
            await updateCustomerPortalUI(authenticatedUser);
          } catch (portalErr) {
            console.warn('Customer portal update warning:', portalErr);
          }
          showApp('portal');
        }
      } catch (err) {
        console.error('Login error:', err);
        showLoginAlert('An error occurred during authentication. Please try again.', 'error');
      } finally {
        if (loginSubmitBtn) {
          loginSubmitBtn.disabled = false;
          loginSubmitBtn.textContent = 'Sign In';
        }
      }
    });
  }

  const registerForm = document.getElementById('auth-register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAlerts();

      if (!checkPasswordCriteria()) {
        showRegAlert('Please satisfy all password security requirements before creating an account.', 'error');
        return;
      }

      const fullName = document.getElementById('reg-fullname')?.value?.trim();
      const companyName = document.getElementById('reg-company')?.value?.trim();
      const email = document.getElementById('reg-email')?.value?.trim()?.toLowerCase();
      const password = regPasswordInput?.value;

      if (!fullName || !companyName || !email || !password) {
        showRegAlert('Please fill in all required registration fields.', 'error');
        return;
      }

      if (regSubmitBtn) {
        regSubmitBtn.disabled = true;
        regSubmitBtn.textContent = 'Creating Account...';
      }

      try {
        // Check if user already exists in database
        const { data: existingUser } = await db
          .from('users')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (existingUser) {
          showRegAlert('An account with this email already exists. Please sign in.', 'error');
          if (regSubmitBtn) {
            regSubmitBtn.disabled = false;
            regSubmitBtn.textContent = 'Create Account';
          }
          return;
        }

        const passwordHash = await hashPassword(password);

        // 1. Insert into Supabase users table with role 'CUSTOMER'
        const { data: newUser, error: userError } = await db
          .from('users')
          .insert({
            email,
            password_hash: passwordHash,
            role: 'CUSTOMER',
            full_name: fullName
          })
          .select()
          .single();

        if (userError) {
          throw new Error(userError.message || 'Database error creating user account.');
        }

        // 2. Insert into Supabase customers table
        const { data: newCust, error: custError } = await db
          .from('customers')
          .insert({
            user_id: newUser.id,
            company_name: companyName,
            contact_name: fullName,
            email: email
          })
          .select()
          .single();

        if (custError) {
          console.warn('Customer table insert warning:', custError);
        }

        // 3. Automatically link active SaaS subscription and initial tax invoice in Supabase
        try {
          const { data: plans } = await db.from('plans').select('*');
          const defaultPlan = plans?.find(p => p.plan_code === 'PLAN-STD-MONTHLY') || plans?.[0];
          if (defaultPlan && newCust?.id) {
            const today = new Date().toISOString().split('T')[0];
            const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const subCode = 'SUB-' + Math.floor(1000 + Math.random() * 9000);

            const { data: newSub } = await db.from('subscriptions').insert({
              subscription_code: subCode,
              customer_id: newCust.id,
              plan_id: defaultPlan.id,
              status: 'ACTIVE',
              current_period_start: today,
              current_period_end: nextMonth,
              recurring_amount: defaultPlan.recurring_price,
              idempotency_token: 'tok_' + subCode.toLowerCase()
            }).select().maybeSingle();

            if (newSub) {
              const invCode = 'BL-INV-2026-' + subCode.replace('SUB-', '');
              const subtotal = Math.round((Number(defaultPlan.recurring_price) / 1.18) * 100) / 100;
              const gstEach = Math.round(((Number(defaultPlan.recurring_price) - subtotal) / 2) * 100) / 100;
              await db.from('invoices').insert({
                invoice_number: invCode,
                subscription_id: newSub.id,
                customer_id: newCust.id,
                subtotal: subtotal,
                cgst_rate: 9.00,
                cgst_amount: gstEach,
                sgst_rate: 9.00,
                sgst_amount: gstEach,
                total_amount: defaultPlan.recurring_price,
                status: 'PAID',
                due_date: nextMonth,
                idempotency_key: 'tok_inv_' + subCode.toLowerCase()
              });
            }
          }
        } catch (subErr) {
          console.warn('Subscription auto-creation warning:', subErr);
        }

        // 4. Immediately register in dataService so Admin Customer Directory shows them
        dataService.createCustomer({
          name: fullName,
          company: companyName,
          email: email,
          customerType: 'Enterprise',
          status: 'Active'
        });

        // 4. Reset form & criteria
        registerForm.reset();
        checkPasswordCriteria();

        // 5. Pre-fill login credentials so the user can immediately sign in in 1 click
        const loginEmailInput = document.getElementById('login-email-input');
        const loginPasswordInput = document.getElementById('login-password-input');
        if (loginEmailInput) loginEmailInput.value = email;
        if (loginPasswordInput) loginPasswordInput.value = password;

        showAuth('login');
        showLoginAlert('Account successfully registered! Click "Sign In" below to enter your Customer Dashboard.', 'success');
      } catch (err) {
        console.error('Registration failed:', err);
        showRegAlert(err.message || 'Registration failed. Please check network and try again.', 'error');
      } finally {
        if (regSubmitBtn) {
          regSubmitBtn.disabled = false;
          regSubmitBtn.textContent = 'Create Account';
        }
      }
    });
  }

  const forgotForm = document.getElementById('auth-forgot-form');
  if (forgotForm) {
    forgotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Password reset link has been dispatched to your email.');
      switchAuthTab('login');
    });
  }

  // Auth tabs switching
  const tabLogin = document.getElementById('tab-btn-login');
  const tabRegister = document.getElementById('tab-btn-register');
  const tabForgot = document.getElementById('tab-btn-forgot');
  const panelLogin = document.getElementById('auth-panel-login');
  const panelRegister = document.getElementById('auth-panel-register');
  const panelForgot = document.getElementById('auth-panel-forgot');

  function switchAuthTab(tab) {
    clearAlerts();
    if (tabLogin) tabLogin.classList.toggle('active', tab === 'login');
    if (tabRegister) tabRegister.classList.toggle('active', tab === 'register');
    if (tabForgot) tabForgot.classList.toggle('active', tab === 'forgot');

    if (panelLogin) panelLogin.style.display = tab === 'login' ? 'block' : 'none';
    if (panelRegister) panelRegister.style.display = tab === 'register' ? 'block' : 'none';
    if (panelForgot) panelForgot.style.display = tab === 'forgot' ? 'block' : 'none';

    createIcons({ icons });
  }

  if (tabLogin) tabLogin.addEventListener('click', () => switchAuthTab('login'));
  if (tabRegister) tabRegister.addEventListener('click', () => switchAuthTab('register'));
  if (tabForgot) tabForgot.addEventListener('click', () => switchAuthTab('forgot'));

  const linkToForgot = document.getElementById('link-to-forgot');
  if (linkToForgot) {
    linkToForgot.addEventListener('click', (e) => {
      e.preventDefault();
      switchAuthTab('forgot');
    });
  }

  // Auto-fill Admin credentials helper
  const fillAdminBtn = document.getElementById('fill-admin-credentials-btn');
  if (fillAdminBtn) {
    fillAdminBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const loginEmailInput = document.getElementById('login-email-input');
      const loginPasswordInput = document.getElementById('login-password-input');
      if (loginEmailInput) loginEmailInput.value = 'admin@brightloop.io';
      if (loginPasswordInput) loginPasswordInput.value = 'Brightloop@2026';
    });
  }

  // Toggle password visibility (Login)
  const togglePassBtn = document.getElementById('toggle-password-btn');
  const passInput = document.getElementById('login-password-input');
  if (togglePassBtn && passInput) {
    togglePassBtn.addEventListener('click', () => {
      const isPassword = passInput.type === 'password';
      passInput.type = isPassword ? 'text' : 'password';
      togglePassBtn.innerHTML = isPassword 
        ? '<i data-lucide="eye-off" style="width: 15px; height: 15px;"></i>'
        : '<i data-lucide="eye" style="width: 15px; height: 15px;"></i>';
      createIcons({ icons });
    });
  }

  // Toggle password visibility (Register)
  const toggleRegPassBtn = document.getElementById('toggle-reg-password-btn');
  if (toggleRegPassBtn && regPasswordInput) {
    toggleRegPassBtn.addEventListener('click', () => {
      const isPassword = regPasswordInput.type === 'password';
      regPasswordInput.type = isPassword ? 'text' : 'password';
      toggleRegPassBtn.innerHTML = isPassword 
        ? '<i data-lucide="eye-off" style="width: 15px; height: 15px;"></i>'
        : '<i data-lucide="eye" style="width: 15px; height: 15px;"></i>';
      createIcons({ icons });
    });
  }

  // Modal Dialogs
  document.querySelectorAll('[data-modal]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const modalId = trigger.getAttribute('data-modal');
      const targetModal = document.getElementById(modalId);
      if (targetModal) targetModal.classList.add('active');
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.remove('active');
      });
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  });

  // Slide-over Drawers
  document.querySelectorAll('[data-drawer]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const drawerId = trigger.getAttribute('data-drawer');
      const drawer = document.getElementById(drawerId);
      const overlay = document.getElementById(`${drawerId}-overlay`);
      if (drawer) drawer.classList.add('active');
      if (overlay) overlay.classList.add('active');
    });
  });

  document.querySelectorAll('[data-close-drawer]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.drawer-panel').forEach(d => d.classList.remove('active'));
      document.querySelectorAll('.drawer-overlay').forEach(o => o.classList.remove('active'));
    });
  });

  // Dashboard Chart
  const dashboardCanvas = document.getElementById('dashboardRevenueChart');
  if (dashboardCanvas) {
    dashboardChartInstance = new Chart(dashboardCanvas, {
      type: 'line',
      data: {
        labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
        datasets: [
          {
            label: 'Recognized MRR (₹)',
            data: [142000, 168000, 185000, 210000, 228000, 245000],
            borderColor: '#635bff',
            backgroundColor: 'rgba(99, 91, 255, 0.08)',
            fill: true,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: '#635bff'
          },
          {
            label: 'Target (₹)',
            data: [140000, 160000, 180000, 200000, 220000, 240000],
            borderColor: '#adbdcc',
            borderDash: [5, 5],
            fill: false,
            tension: 0.35,
            borderWidth: 1.5,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: { family: 'Inter', size: 12 },
              color: '#425466',
              usePointStyle: true,
              boxWidth: 8
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 11 }, color: '#8898aa' }
          },
          y: {
            grid: { color: '#f0f2f5' },
            ticks: {
              font: { family: 'Inter', size: 11 },
              color: '#8898aa',
              callback: value => '₹ ' + (value / 1000) + 'k'
            }
          }
        }
      }
    });
  }

  // Analytics Waterfall Chart
  const analyticsCanvas = document.getElementById('analyticsChart');
  if (analyticsCanvas) {
    analyticsChartInstance = new Chart(analyticsCanvas, {
      type: 'bar',
      data: {
        labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
        datasets: [
          {
            label: 'New Bookings',
            data: [35000, 42000, 48000, 52000, 58000, 64000],
            backgroundColor: '#635bff',
            borderRadius: 4
          },
          {
            label: 'Upgrades / Add-ons',
            data: [12000, 15000, 14000, 18000, 22000, 24000],
            backgroundColor: '#00d4ff',
            borderRadius: 4
          },
          {
            label: 'Churn Impact',
            data: [-4000, -3200, -5000, -2800, -3500, -4100],
            backgroundColor: '#df1b41',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: { family: 'Inter', size: 12 },
              color: '#425466',
              usePointStyle: true,
              boxWidth: 8
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 11 }, color: '#8898aa' }
          },
          y: {
            grid: { color: '#f0f2f5' },
            ticks: {
              font: { family: 'Inter', size: 11 },
              color: '#8898aa',
              callback: val => '₹ ' + (val / 1000) + 'k'
            }
          }
        }
      }
    });
  }

  // Restore session UI on initial load if user is logged in
  applyUserSession();
  if (isUserLoggedIn()) {
    const userJson = sessionStorage.getItem('brightloop_user') || localStorage.getItem('brightloop_user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user.role === 'CUSTOMER') {
          updateCustomerPortalUI(user);
        }
      } catch (e) {}
    }
  }

  // Initial Route Check based on URL hash
  const currentHash = window.location.hash.replace('#/', '').replace('#', '');
  if (currentHash === 'register') {
    showAuth('register');
  } else if (currentHash === 'login' || currentHash === 'auth') {
    showAuth('login');
  } else if (currentHash === 'home') {
    showHome();
  } else if (currentHash && document.getElementById(`view-${currentHash}`)) {
    if (isUserLoggedIn()) {
      showApp(currentHash);
    } else {
      showAuth('login');
    }
  } else {
    showHome();
  }
});
