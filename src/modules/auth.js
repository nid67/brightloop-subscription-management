/**
 * Authentication Module
 * Manages Split-Screen Login, Registration, Forgot Password, Reset Password,
 * and Password Strength Evaluation.
 */

import { setCurrentUser, ROLES } from './rbac.js';
import { showToast } from './toast.js';

const USERS_STORAGE_KEY = 'subscriptiq_registered_users';

function getRegisteredUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRegisteredUser(user) {
  const users = getRegisteredUsers();
  users.push(user);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function evaluatePasswordStrength(password) {
  const rules = {
    length: password.length >= 9,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)
  };

  let score = 0;
  if (rules.length) score++;
  if (rules.uppercase) score++;
  if (rules.lowercase) score++;
  if (rules.special) score++;

  let label = 'Very Weak';
  let color = '#df1b41';

  if (score === 1) {
    label = 'Weak';
    color = '#df1b41';
  } else if (score === 2) {
    label = 'Fair';
    color = '#b76e00';
  } else if (score === 3) {
    label = 'Good';
    color = '#0055cc';
  } else if (score === 4) {
    label = 'Strong';
    color = '#00875a';
  }

  const isValid = rules.length && rules.uppercase && rules.lowercase && rules.special;

  return { rules, score, label, color, isValid };
}

export function showAuthSubview(targetViewId) {
  const subviews = document.querySelectorAll('.auth-subview');
  subviews.forEach(view => {
    if (view.id === `auth-subview-${targetViewId}`) {
      view.classList.add('active');
    } else {
      view.classList.remove('active');
    }
  });

  // Clear any existing alerts
  document.querySelectorAll('.auth-alert').forEach(alert => {
    alert.classList.remove('active');
  });
}

export function openAuthPage(subview = 'login') {
  const appLayout = document.getElementById('app');
  const authPage = document.getElementById('view-auth');

  if (appLayout) appLayout.style.display = 'none';
  if (authPage) authPage.classList.add('active');

  showAuthSubview(subview);
}

export function closeAuthPage() {
  const appLayout = document.getElementById('app');
  const authPage = document.getElementById('view-auth');

  if (authPage) authPage.classList.remove('active');
  if (appLayout) appLayout.style.display = 'flex';
}

export function initAuth() {
  // 1. Password Visibility Toggles
  document.querySelectorAll('.password-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const wrapper = btn.closest('.password-input-wrapper');
      if (!wrapper) return;
      const input = wrapper.querySelector('input');
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      btn.innerHTML = isPassword
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-.722-3.25"/><path d=" 2 8a10.645 10.645 0 0 0 20 0"/><path d="m20 15-1.726-2.05"/><path d="m4 15 1.726-2.05"/><path d="m9 18 .722-3.25"/></svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`;
    });
  });

  // 2. Subview navigation links
  document.querySelectorAll('[data-auth-target]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-auth-target');
      if (target) showAuthSubview(target);
    });
  });

  // 3. Login Form Submission
  const loginForm = document.getElementById('auth-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email')?.value.trim().toLowerCase();
      const password = document.getElementById('login-password')?.value;
      const errorAlert = document.getElementById('login-error-alert');
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      if (errorAlert) errorAlert.classList.remove('active');

      if (!email || !password) {
        if (errorAlert) {
          errorAlert.textContent = 'Please enter both work email and password.';
          errorAlert.classList.add('active');
        }
        return;
      }

      // Simulate loading state
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Signing in...</span>`;

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;

        const users = getRegisteredUsers();
        let targetUser = users.find(u => u.email.toLowerCase() === email);

        if (targetUser) {
          if (targetUser.password !== password) {
            if (errorAlert) {
              errorAlert.textContent = 'Invalid credentials. Please verify your password.';
              errorAlert.classList.add('active');
            }
            return;
          }
        } else {
          // If this is the first login or account creation
          const namePart = email.split('@')[0].replace(/[\._]/g, ' ');
          const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
          targetUser = {
            id: `USR-${Date.now().toString().slice(-4)}`,
            name: formattedName,
            email: email,
            password: password,
            role: ROLES.ADMIN,
            department: 'Operations',
            avatar: formattedName.slice(0, 2).toUpperCase(),
            roleLabel: 'Super Admin',
            company: ''
          };
          saveRegisteredUser(targetUser);
        }

        setCurrentUser(targetUser);
        closeAuthPage();

        const initialView = targetUser.role === ROLES.CUSTOMER ? 'portal' : 'dashboard';
        const targetNav = document.querySelector(`.nav-link[data-view="${initialView}"]`);
        if (targetNav) targetNav.click();

        showToast('Signed In Successfully', `Authenticated as ${targetUser.name} (${targetUser.roleLabel})`, 'success');
      }, 500);
    });
  }

  // 4. Password Strength Meter on Registration Form
  const regPassword = document.getElementById('reg-password');
  const regConfirmPassword = document.getElementById('reg-confirm-password');

  function updateStrengthUI(password, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const evaluation = evaluatePasswordStrength(password);
    const segments = container.querySelectorAll('.password-strength-segment');
    const labelEl = container.querySelector('.password-strength-label span:last-child');

    segments.forEach((seg, idx) => {
      if (idx < evaluation.score) {
        seg.style.backgroundColor = evaluation.color;
      } else {
        seg.style.backgroundColor = 'var(--border, #e3e8ee)';
      }
    });

    if (labelEl) {
      labelEl.textContent = password ? evaluation.label : 'Requirements';
      labelEl.style.color = evaluation.color;
    }

    // Update rule chips
    const ruleLen = container.querySelector('[data-rule="length"]');
    const ruleUpper = container.querySelector('[data-rule="uppercase"]');
    const ruleLower = container.querySelector('[data-rule="lowercase"]');
    const ruleSpecial = container.querySelector('[data-rule="special"]');

    if (ruleLen) ruleLen.className = `password-rule-item ${evaluation.rules.length ? 'valid' : 'invalid'}`;
    if (ruleUpper) ruleUpper.className = `password-rule-item ${evaluation.rules.uppercase ? 'valid' : 'invalid'}`;
    if (ruleLower) ruleLower.className = `password-rule-item ${evaluation.rules.lowercase ? 'valid' : 'invalid'}`;
    if (ruleSpecial) ruleSpecial.className = `password-rule-item ${evaluation.rules.special ? 'valid' : 'invalid'}`;

    return evaluation;
  }

  if (regPassword) {
    regPassword.addEventListener('input', () => {
      updateStrengthUI(regPassword.value, 'reg-password-strength');
    });
  }

  // 5. Registration Form Submission
  const regForm = document.getElementById('auth-register-form');
  if (regForm) {
    regForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name')?.value.trim();
      const company = document.getElementById('reg-company')?.value.trim();
      const email = document.getElementById('reg-email')?.value.trim();
      const password = regPassword?.value;
      const confirmPassword = regConfirmPassword?.value;
      const errorAlert = document.getElementById('reg-error-alert');
      const submitBtn = regForm.querySelector('button[type="submit"]');

      if (errorAlert) errorAlert.classList.remove('active');

      const evaluation = evaluatePasswordStrength(password || '');
      if (!evaluation.isValid) {
        if (errorAlert) {
          errorAlert.textContent = 'Password must be at least 9 characters and include uppercase, lowercase, and a special character.';
          errorAlert.classList.add('active');
        }
        return;
      }

      if (password !== confirmPassword) {
        if (errorAlert) {
          errorAlert.textContent = 'Passwords do not match. Please re-enter.';
          errorAlert.classList.add('active');
        }
        return;
      }

      // Simulate registration
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Creating Account...</span>';

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Create Account';

        const newUser = {
          id: `USR-REG-${Date.now().toString().slice(-4)}`,
          name: name,
          email: email,
          password: password,
          role: ROLES.ADMIN,
          department: 'Executive',
          avatar: name.slice(0, 2).toUpperCase(),
          roleLabel: 'Super Admin',
          company: company
        };

        saveRegisteredUser(newUser);
        setCurrentUser(newUser);
        closeAuthPage();

        const dashNav = document.querySelector('.nav-link[data-view="dashboard"]');
        if (dashNav) dashNav.click();

        showToast('Registration Complete', `Welcome to SubscriptIQ, ${name}! Your account has been initialized.`, 'success', 5000);
      }, 700);
    });
  }

  // 6. Forgot Password Submission
  const forgotForm = document.getElementById('auth-forgot-form');
  if (forgotForm) {
    forgotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('forgot-email')?.value.trim();
      const successAlert = document.getElementById('forgot-success-alert');
      const submitBtn = forgotForm.querySelector('button[type="submit"]');

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Sending Link...</span>';

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Send Reset Link';

        if (successAlert) {
          successAlert.innerHTML = `
            <strong>Reset Link Dispatched:</strong> A secure password reset link has been dispatched to <em>${email}</em>.
            <div style="margin-top: 8px;">
              <a href="#" id="simulate-reset-link" style="color: var(--success); font-weight: 600; text-decoration: underline;">
                Click here to simulate opening the reset token &rarr;
              </a>
            </div>
          `;
          successAlert.classList.add('active');

          const simLink = document.getElementById('simulate-reset-link');
          if (simLink) {
            simLink.addEventListener('click', (ev) => {
              ev.preventDefault();
              showAuthSubview('reset');
            });
          }
        }
        showToast('Reset Link Dispatched', `Password instructions sent to ${email}`, 'info');
      }, 600);
    });
  }

  // 7. Reset Password Form Submission
  const resetPassword = document.getElementById('reset-password-input');
  const resetConfirm = document.getElementById('reset-confirm-input');

  if (resetPassword) {
    resetPassword.addEventListener('input', () => {
      updateStrengthUI(resetPassword.value, 'reset-password-strength');
    });
  }

  const resetForm = document.getElementById('auth-reset-form');
  if (resetForm) {
    resetForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pass = resetPassword?.value;
      const conf = resetConfirm?.value;
      const errorAlert = document.getElementById('reset-error-alert');
      const submitBtn = resetForm.querySelector('button[type="submit"]');

      if (errorAlert) errorAlert.classList.remove('active');

      const evaluation = evaluatePasswordStrength(pass || '');
      if (!evaluation.isValid) {
        if (errorAlert) {
          errorAlert.textContent = 'Password must meet all 4 security criteria.';
          errorAlert.classList.add('active');
        }
        return;
      }

      if (pass !== conf) {
        if (errorAlert) {
          errorAlert.textContent = 'Password confirmation does not match.';
          errorAlert.classList.add('active');
        }
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Updating Password...</span>';

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Update Password';

        showToast('Password Updated', 'Your security credentials have been updated. Please sign in.', 'success');
        showAuthSubview('login');
      }, 600);
    });
  }

  // 8. Sign Out Button in Sidebar Footer
  const signOutBtn = document.querySelector('.sidebar-footer [data-view="auth"]');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openAuthPage('login');
      showToast('Signed Out', 'You have been safely signed out.', 'info');
    });
  }
}
