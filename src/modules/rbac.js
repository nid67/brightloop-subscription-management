/**
 * Role-Based Access Control (RBAC) System
 * Manages active user sessions, role matrix, route guards and sidebar navigation visibility
 */

export const ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  CUSTOMER: 'CUSTOMER'
};

// Permission matrix defining allowed views per role
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    'dashboard',
    'customers',
    'products',
    'plans',
    'subscriptions',
    'quotations',
    'invoices',
    'payments',
    'discounts',
    'taxes',
    'leakage',
    'analytics',
    'health',
    'staff',
    'portal',
    'settings'
  ],
  [ROLES.STAFF]: [
    'dashboard',
    'customers',
    'quotations',
    'subscriptions',
    'invoices',
    'payments',
    'portal',
    'settings'
  ],
  [ROLES.CUSTOMER]: [
    'portal',
    'settings'
  ]
};

// Default initial session when no user is logged in
function createDefaultSession() {
  return {
    id: 'USR-001',
    name: 'Admin User',
    email: 'admin@subscriptiq.io',
    role: ROLES.ADMIN,
    department: 'Administration',
    avatar: 'AU',
    roleLabel: 'Super Admin',
    company: ''
  };
}

let currentUser = createDefaultSession();

export function getCurrentUser() {
  return currentUser;
}

export function getCurrentRole() {
  return currentUser ? currentUser.role : ROLES.ADMIN;
}

export function hasPermission(viewId, role = getCurrentRole()) {
  const allowedViews = ROLE_PERMISSIONS[role] || [];
  return allowedViews.includes(viewId);
}

/**
 * Update the active user and re-render navigation visibility
 */
export function setCurrentUser(user) {
  currentUser = user;
  sessionStorage.setItem('subscriptiq_current_user', JSON.stringify(user));
  applyRBACNavigation(user.role);
  
  // Dispatch custom event for modules to react
  window.dispatchEvent(new CustomEvent('subscriptiq:user-changed', { detail: { user } }));
}

/**
 * Switch role for the current user
 */
export function setCurrentRole(roleKey) {
  const role = roleKey.toUpperCase();
  if (!ROLES[role]) return;

  const roleLabelMap = {
    [ROLES.ADMIN]: 'Super Admin',
    [ROLES.STAFF]: 'Operations Staff',
    [ROLES.CUSTOMER]: 'Client Subscriber'
  };

  currentUser.role = role;
  currentUser.roleLabel = roleLabelMap[role] || role;

  setCurrentUser(currentUser);
}

/**
 * Filter sidebar links and section headers based on role permissions
 */
export function applyRBACNavigation(role) {
  const navLinks = document.querySelectorAll('.nav-link[data-view]');
  const allowedViews = ROLE_PERMISSIONS[role] || [];

  navLinks.forEach(link => {
    const view = link.dataset.view;
    if (!view) return;

    if (allowedViews.includes(view)) {
      link.classList.remove('role-hidden');
    } else {
      link.classList.add('role-hidden');
    }
  });

  // Hide section titles in sidebar if all sibling links in that group are hidden
  const navContainer = document.querySelector('.sidebar-nav');
  if (navContainer) {
    const sectionTitles = navContainer.querySelectorAll('.nav-section-title');
    sectionTitles.forEach(title => {
      let sibling = title.nextElementSibling;
      let hasVisibleLink = false;
      while (sibling && !sibling.classList.contains('nav-section-title')) {
        if (sibling.classList.contains('nav-link') && !sibling.classList.contains('role-hidden')) {
          hasVisibleLink = true;
          break;
        }
        sibling = sibling.nextElementSibling;
      }
      if (!hasVisibleLink) {
        title.classList.add('section-hidden');
      } else {
        title.classList.remove('section-hidden');
      }
    });
  }

  // Update sidebar user snippet display
  const userAvatar = document.querySelector('.sidebar-footer .user-avatar');
  const userName = document.querySelector('.sidebar-footer .user-name');
  const userRole = document.querySelector('.sidebar-footer .user-role');
  if (userAvatar && currentUser) userAvatar.textContent = currentUser.avatar;
  if (userName && currentUser) userName.textContent = currentUser.name;
  if (userRole && currentUser) userRole.textContent = currentUser.roleLabel;

  // Sync role selector dropdown in topbar
  const roleSelect = document.getElementById('role-select');
  if (roleSelect && currentUser) {
    const roleMap = {
      [ROLES.ADMIN]: 'admin',
      [ROLES.STAFF]: 'staff',
      [ROLES.CUSTOMER]: 'customer'
    };
    roleSelect.value = roleMap[role] || 'admin';
  }

  // If currently active section is now forbidden, switch to safe view
  const activeSection = document.querySelector('.view-section.active');
  if (activeSection) {
    const currentViewId = activeSection.id.replace('view-', '');
    if (!allowedViews.includes(currentViewId)) {
      const fallbackView = role === ROLES.CUSTOMER ? 'portal' : 'dashboard';
      const switchTrigger = document.querySelector(`.nav-link[data-view="${fallbackView}"]`);
      if (switchTrigger) {
        switchTrigger.click();
      }
    }
  }
}

/**
 * Initialize RBAC listeners and restore session if available
 */
export function initRBAC() {
  const savedUser = sessionStorage.getItem('subscriptiq_current_user');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
    } catch {
      currentUser = createDefaultSession();
    }
  } else {
    currentUser = createDefaultSession();
  }

  // Attach listener to topbar role-select
  const roleSelect = document.getElementById('role-select');
  if (roleSelect) {
    roleSelect.addEventListener('change', (e) => {
      setCurrentRole(e.target.value);
    });
  }

  // Initial navigation filtering
  applyRBACNavigation(currentUser.role);
}
