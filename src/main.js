import { createIcons, icons } from 'lucide';
import Chart from 'chart.js/auto';
import { db } from './db.js';
import { dataService } from './modules/customer-product-plan/data-service.js';
import './modules/customer-product-plan/styles.css';
import { initCustomerProductPlanModule } from './modules/customer-product-plan/index.js';
import './modules/quotations-subscriptions/quotations-subscriptions.css';
import { initQuoteSubscriptionModule } from './modules/quotations-subscriptions/index.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Feature Modules
  initCustomerProductPlanModule();
  initQuoteSubscriptionModule();

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
    return sessionStorage.getItem('brightloop_session') === 'active';
  }

  function getUserRole() {
    return sessionStorage.getItem('brightloop_role') || 'ADMIN';
  }

  function applyUserSession() {
    const loggedIn = isUserLoggedIn();
    const role = getUserRole();
    const userJson = sessionStorage.getItem('brightloop_user');
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
    try {
      const { data } = await db.from('customers').select('*').eq('email', user.email).maybeSingle();
      if (data) customerInfo = data;
    } catch (e) {
      console.warn('Could not fetch customer record:', e);
    }

    if (!customerInfo) {
      customerInfo = dataService.getCustomers().find(c => c.email?.toLowerCase() === user.email?.toLowerCase());
    }

    if (companyEl) {
      companyEl.textContent = customerInfo?.company_name || customerInfo?.company || (user.full_name ? `${user.full_name}'s Organization` : 'My Organization');
    }

    if (subNameEl) subNameEl.textContent = 'Brightloop Standard Cloud Tier';
    if (subCycleEl) subCycleEl.textContent = 'Billing cycle: Monthly (Auto-renews on 15th)';
    if (subPriceEl) subPriceEl.textContent = '₹ 4,999 / month';
    if (subBadgeEl) {
      subBadgeEl.textContent = 'Active';
      subBadgeEl.className = 'badge badge-success';
    }

    if (invNumberEl) {
      invNumberEl.textContent = `BL-INV-2026-${String(Math.floor(Math.random() * 800) + 100)}`;
    }
    if (invMetaEl) {
      const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      invMetaEl.textContent = `${today} • ₹ 4,999 • Dual-GST Paid`;
    }
  }

  // Synchronize customers from Supabase into local dataService
  async function syncCustomersFromSupabase() {
    try {
      const { data: dbCustomers, error } = await db.from('customers').select('*');
      if (dbCustomers && dbCustomers.length > 0) {
        const localList = dataService.getCustomers();
        for (const dbCust of dbCustomers) {
          const exists = localList.some(c => c.email?.toLowerCase() === dbCust.email?.toLowerCase());
          if (!exists) {
            dataService.createCustomer({
              name: dbCust.contact_name || dbCust.company_name,
              company: dbCust.company_name,
              email: dbCust.email,
              customerType: 'Enterprise',
              status: 'Active'
            });
          }
        }
      }
    } catch (err) {
      console.warn('Could not sync customers from database:', err);
    }
  }

  // Initial sync of customers
  syncCustomersFromSupabase();

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

        applyUserSession();

        if (authenticatedUser.role === 'ADMIN') {
          showApp('dashboard');
        } else {
          // CUSTOMER: Strictly redirect to Customer Dashboard
          await updateCustomerPortalUI(authenticatedUser);
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
        const { error: custError } = await db
          .from('customers')
          .insert({
            user_id: newUser.id,
            company_name: companyName,
            contact_name: fullName,
            email: email
          });

        if (custError) {
          console.warn('Customer table insert warning:', custError);
        }

        // 3. Immediately register in dataService so Admin Customer Directory shows them
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

        // 5. Pre-fill login email and redirect to login page with success notification
        const loginEmailInput = document.getElementById('login-email-input');
        const loginPasswordInput = document.getElementById('login-password-input');
        if (loginEmailInput) loginEmailInput.value = email;
        if (loginPasswordInput) loginPasswordInput.value = '';

        showAuth('login');
        showLoginAlert('Account successfully registered! Please sign in with your credentials.', 'success');
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
    const userJson = sessionStorage.getItem('brightloop_user');
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
