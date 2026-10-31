import { createIcons, icons } from 'lucide';

// Module 05: Authentication, RBAC, Customer Portal, Staff & Settings
import { initRBAC } from './modules/rbac.js';
import { initAuth } from './modules/auth.js';
import { initStaff } from './modules/staff.js';
import { initPortal } from './modules/portal.js';
import { initSettings } from './modules/settings.js';

// Module 06: Dashboard, Analytics, Intelligence & AI Assistant
import { initDashboard }    from './modules/dashboard.js';
import { initAnalytics }    from './modules/analytics.js';
import { initLeakage }      from './modules/leakage.js';
import { initHealth }       from './modules/health.js';
import { initReports }      from './modules/reports.js';
import { initAIAssistant }  from './modules/ai-assistant.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Module 05 subsystems
  initRBAC();
  initAuth();
  initStaff();
  initPortal();
  initSettings();

  // Initialize Module 06 subsystems
  initDashboard();
  initAnalytics();
  initLeakage();
  initHealth();
  initReports();
  initAIAssistant();

  // Initialize Lucide icons
  createIcons({ icons });

  // Navigation / View Switching
  const navLinks = document.querySelectorAll('.nav-link[data-view]');
  const viewSections = document.querySelectorAll('.view-section');
  const breadcrumbCurrent = document.getElementById('breadcrumb-current');
  const appLayout = document.getElementById('app');
  const authPage = document.getElementById('view-auth');

  function switchView(targetViewId) {
    if (targetViewId === 'auth') {
      appLayout.style.display = 'none';
      authPage.classList.add('active');
      return;
    }

    authPage.classList.remove('active');
    appLayout.style.display = 'flex';

    // Update active nav link
    navLinks.forEach(link => {
      if (link.dataset.view === targetViewId) {
        link.classList.add('active');
        if (breadcrumbCurrent) {
          const spanText = link.querySelector('span')?.textContent;
          breadcrumbCurrent.textContent = spanText || targetViewId;
        }
      } else {
        link.classList.remove('active');
      }
    });

    // Update active section
    viewSections.forEach(section => {
      if (section.id === `view-${targetViewId}`) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    createIcons({ icons });
  }

  // Sidebar link clicks
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.dataset.view;
      if (view) switchView(view);
    });
  });

  // Buttons with data-nav attribute
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-nav');
      if (target) switchView(target);
    });
  });

  // Modal handlers
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

  // Drawer handlers
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

  // Role preview selector
  const roleSelect = document.getElementById('role-select');
  if (roleSelect) {
    roleSelect.addEventListener('change', (e) => {
      const selected = e.target.value;
      const roleBadge = document.querySelector('.user-info .user-role');
      if (roleBadge) {
        if (selected === 'admin') roleBadge.textContent = 'Super Admin';
        else if (selected === 'staff') roleBadge.textContent = 'Operations Staff';
        else if (selected === 'customer') roleBadge.textContent = 'Client Subscriber';
      }
    });
  }

  // Module 06 handles all dashboard and analytics chart rendering
  // via initDashboard() and initAnalytics() above.
});
