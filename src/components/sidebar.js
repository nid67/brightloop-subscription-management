import { iconHtml } from '../utils/icons.js';

export function renderSidebar(activeRoute = 'dashboard', user = { name: 'Admin User', role: 'ADMIN' }) {
  return `
    <aside class="app-sidebar">
      <div class="sidebar-header">
        <a href="#/dashboard" class="brand-logo">
          <div class="brand-icon">
            ${iconHtml('layers', { size: 16 })}
          </div>
          <span>Brightloop</span>
          <small>Software</small>
        </a>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-title">Overview</div>
        <a href="#/dashboard" class="nav-link ${activeRoute === 'dashboard' ? 'active' : ''}">
          ${iconHtml('layout-dashboard', { size: 16 })}
          <span>Dashboard</span>
        </a>

        <div class="nav-section-title">Business Management</div>
        <a href="#/customers" class="nav-link ${activeRoute === 'customers' ? 'active' : ''}">
          ${iconHtml('users', { size: 16 })}
          <span>Customers</span>
        </a>
        <a href="#/products" class="nav-link ${activeRoute === 'products' ? 'active' : ''}">
          ${iconHtml('package', { size: 16 })}
          <span>Products & Variants</span>
        </a>
        <a href="#/plans" class="nav-link ${activeRoute === 'plans' ? 'active' : ''}">
          ${iconHtml('calendar-days', { size: 16 })}
          <span>Plans</span>
        </a>
        <a href="#/subscriptions" class="nav-link ${activeRoute === 'subscriptions' ? 'active' : ''}">
          ${iconHtml('repeat', { size: 16 })}
          <span>Subscriptions</span>
        </a>
        <a href="#/quotations" class="nav-link ${activeRoute === 'quotations' ? 'active' : ''}">
          ${iconHtml('file-check', { size: 16 })}
          <span>Quotations</span>
        </a>

        <div class="nav-section-title">Financial Operations</div>
        <a href="#/invoices" class="nav-link ${activeRoute === 'invoices' ? 'active' : ''}">
          ${iconHtml('file-text', { size: 16 })}
          <span>Invoices</span>
        </a>
        <a href="#/payments" class="nav-link ${activeRoute === 'payments' ? 'active' : ''}">
          ${iconHtml('credit-card', { size: 16 })}
          <span>Payments</span>
        </a>
        <a href="#/discounts" class="nav-link ${activeRoute === 'discounts' ? 'active' : ''}">
          ${iconHtml('tag', { size: 16 })}
          <span>Discounts</span>
        </a>
        <a href="#/taxes" class="nav-link ${activeRoute === 'taxes' ? 'active' : ''}">
          ${iconHtml('percent', { size: 16 })}
          <span>Taxes</span>
        </a>

        <div class="nav-section-title">Intelligence</div>
        <a href="#/leakage" class="nav-link ${activeRoute === 'leakage' ? 'active' : ''}">
          ${iconHtml('shield-alert', { size: 16 })}
          <span>Revenue Leakage</span>
        </a>
        <a href="#/analytics" class="nav-link ${activeRoute === 'analytics' ? 'active' : ''}">
          ${iconHtml('line-chart', { size: 16 })}
          <span>Revenue Analytics</span>
        </a>
        <a href="#/ai-assistant" class="nav-link ${activeRoute === 'ai-assistant' ? 'active' : ''}">
          ${iconHtml('sparkles', { size: 16 })}
          <span>Subscription Health</span>
        </a>

        <div class="nav-section-title">Administration</div>
        <a href="#/staff" class="nav-link ${activeRoute === 'staff' ? 'active' : ''}">
          ${iconHtml('user-check', { size: 16 })}
          <span>Staff</span>
        </a>
        <a href="#/portal" class="nav-link ${activeRoute === 'portal' ? 'active' : ''}">
          ${iconHtml('user', { size: 16 })}
          <span>Customer Portal</span>
        </a>
        <a href="#/settings" class="nav-link ${activeRoute === 'settings' ? 'active' : ''}">
          ${iconHtml('settings', { size: 16 })}
          <span>Settings</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="user-snippet">
          <div class="user-avatar">${user.name.charAt(0)}</div>
          <div class="user-meta">
            <span class="user-name">${user.name}</span>
            <span class="user-role">${user.role}</span>
          </div>
        </div>
        <a href="#/login" style="color:#8792a2;" title="Sign out">
          ${iconHtml('log-out', { size: 15 })}
        </a>
      </div>
    </aside>
  `;
}
