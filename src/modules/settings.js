/**
 * Account Settings Module
 * Handles User Profile, Password Updates with Strength Validation,
 * Notification Preferences, and Role-Gated Organization Metadata.
 */

import { getCurrentUser, setCurrentUser, ROLES } from './rbac.js';
import { evaluatePasswordStrength } from './auth.js';
import { showToast } from './toast.js';

export function renderSettingsProfile() {
  const user = getCurrentUser();
  const avatarEl = document.getElementById('settings-avatar-display');
  const firstNameInput = document.getElementById('settings-first-name');
  const lastNameInput = document.getElementById('settings-last-name');
  const emailInput = document.getElementById('settings-email');
  const phoneInput = document.getElementById('settings-phone');
  const jobTitleInput = document.getElementById('settings-job-title');

  if (avatarEl) avatarEl.textContent = user.avatar;

  const nameParts = user.name.split(' ');
  if (firstNameInput) firstNameInput.value = nameParts[0] || '';
  if (lastNameInput) lastNameInput.value = nameParts.slice(1).join(' ') || '';
  if (emailInput) emailInput.value = user.email || '';
  if (phoneInput) phoneInput.value = user.phone || '';
  if (jobTitleInput) jobTitleInput.value = user.roleLabel || '';

  // Toggle Organization Tab visibility based on role (Admin/Staff only)
  const orgTabBtn = document.querySelector('[data-settings-tab="org"]');
  if (orgTabBtn) {
    if (user.role === ROLES.CUSTOMER) {
      orgTabBtn.style.display = 'none';
    } else {
      orgTabBtn.style.display = 'flex';
    }
  }
}

export function initSettings() {
  renderSettingsProfile();

  // Listen to user changes
  window.addEventListener('subscriptiq:user-changed', () => {
    renderSettingsProfile();
  });

  // Tab switching inside settings
  const tabBtns = document.querySelectorAll('.settings-tab-btn');
  const tabPanes = document.querySelectorAll('.settings-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-settings-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(`settings-pane-${targetTab}`);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // 1. Save Profile Form
  const profileForm = document.getElementById('settings-profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const first = document.getElementById('settings-first-name')?.value.trim();
      const last = document.getElementById('settings-last-name')?.value.trim();
      const phone = document.getElementById('settings-phone')?.value.trim();
      const jobTitle = document.getElementById('settings-job-title')?.value.trim();

      const user = getCurrentUser();
      user.name = `${first} ${last}`.trim();
      user.avatar = (first[0] + (last[0] || '')).toUpperCase();
      user.phone = phone;
      user.roleLabel = jobTitle;

      setCurrentUser(user);
      renderSettingsProfile();

      showToast('Profile Updated', 'Your personal account profile has been saved.', 'success');
    });
  }

  // 2. Change Password Form
  const newPassInput = document.getElementById('settings-new-password');
  const confirmPassInput = document.getElementById('settings-confirm-password');

  if (newPassInput) {
    newPassInput.addEventListener('input', () => {
      const evaluation = evaluatePasswordStrength(newPassInput.value);
      const container = document.getElementById('settings-password-strength');
      if (!container) return;

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
        labelEl.textContent = newPassInput.value ? evaluation.label : 'Requirements';
        labelEl.style.color = evaluation.color;
      }
    });
  }

  const passwordForm = document.getElementById('settings-password-form');
  if (passwordForm) {
    passwordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentPass = document.getElementById('settings-current-password')?.value;
      const newPass = newPassInput?.value;
      const confirmPass = confirmPassInput?.value;

      if (!currentPass) {
        showToast('Password Error', 'Please enter your current password.', 'error');
        return;
      }

      const evalResult = evaluatePasswordStrength(newPass || '');
      if (!evalResult.isValid) {
        showToast('Weak Password', 'New password must have min 9 chars with uppercase, lowercase, and special characters.', 'error');
        return;
      }

      if (newPass !== confirmPass) {
        showToast('Mismatch Error', 'New passwords do not match.', 'error');
        return;
      }

      passwordForm.reset();
      showToast('Security Credentials Updated', 'Your account password was updated successfully.', 'success');
    });
  }

  // 3. Notification Preferences Form
  const notifForm = document.getElementById('settings-notifications-form');
  if (notifForm) {
    notifForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Preferences Saved', 'Your communication and notification triggers were updated.', 'success');
    });
  }

  // 4. Organization Settings Form
  const orgForm = document.getElementById('settings-org-form');
  if (orgForm) {
    orgForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Organization Settings Saved', 'Company legal identity and tax configurations were updated.', 'success');
    });
  }
}

